import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface StripeEvent {
  id: string
  type: string
  data: {
    object: any
  }
}

// Função para calcular split
function calculateSplit(
  netAmount: number,
  hasReferral: boolean,
): {
  platform: number
  trainer: number
  platformPercentage: number
  trainerPercentage: number
} {
  const platformPercentage = hasReferral ? 10 : 20
  const trainerPercentage = hasReferral ? 90 : 80

  const platformFee = (netAmount * platformPercentage) / 100
  const trainerFee = (netAmount * trainerPercentage) / 100

  return {
    platform: platformFee,
    trainer: trainerFee,
    platformPercentage,
    trainerPercentage,
  }
}

export const onRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obter assinatura do header (Stripe Signature)
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    // Ler o body como texto para verificação
    const body = await req.text()

    // Verificar webhook signature (em produção, use a biblioteca oficial do Stripe)
    // Por enquanto, vamos processar diretamente (em produção, adicione verificação de assinatura)

    const event: StripeEvent = JSON.parse(body)

    console.log(`[INFO] Processing Stripe event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const metadata = paymentIntent.metadata || {}

        // Buscar transação pelo payment_intent_id
        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (transaction) {
          // Atualizar status da transação
          await supabase
            .from('payment_transactions')
            .update({
              status: 'succeeded',
              stripe_charge_id: paymentIntent.latest_charge || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id)

          // Atualizar status dos splits
          await supabase
            .from('payment_splits')
            .update({ status: 'pending' }) // Será transferido posteriormente
            .eq('transaction_id', transaction.id)
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object

        // Atualizar transação como falhada
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (!subscriptionId) {
          break
        }

        // Buscar subscription no banco
        const { data: subscription } = await supabase
          .from('payment_subscriptions')
          .select('*, payment_products(*)')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (subscription) {
          // Atualizar subscription
          await supabase
            .from('payment_subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date(
                invoice.period_start * 1000,
              ).toISOString(),
              current_period_end: new Date(
                invoice.period_end * 1000,
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)

          // Criar transação para renovação
          const amount = invoice.amount_paid / 100 // Converter de centavos
          const currency = invoice.currency.toUpperCase()

          // Calcular taxas (aproximadamente 3.9% + R$ 0.40)
          const stripeFeePercent = 0.039
          const stripeFixedFee = 0.40
          const stripeFee = amount * stripeFeePercent + stripeFixedFee
          const netAmount = amount - stripeFee

          const hasReferral = !!subscription.referral_trainer_id
          const split = calculateSplit(netAmount, hasReferral)

          const { data: transaction } = await supabase
            .from('payment_transactions')
            .insert({
              user_id: subscription.user_id,
              trainer_id: subscription.trainer_id,
              referral_trainer_id: subscription.referral_trainer_id,
              product_id: subscription.product_id,
              subscription_id: subscription.id,
              type: 'subscription',
              amount,
              currency,
              stripe_fee: stripeFee,
              net_amount: netAmount,
              platform_percentage: split.platformPercentage,
              trainer_percentage: split.trainerPercentage,
              platform_fee: split.platform,
              trainer_fee: split.trainer,
              status: 'succeeded',
              stripe_invoice_id: invoice.id,
              metadata: { invoiceId: invoice.id },
            })
            .select()
            .single()

          if (transaction) {
            // Criar splits
            const splits = []
            if (subscription.trainer_id) {
              splits.push({
                transaction_id: transaction.id,
                recipient_type: 'trainer',
                recipient_id: subscription.trainer_id,
                amount: split.trainer,
                status: 'pending',
              })
            }
            splits.push({
              transaction_id: transaction.id,
              recipient_type: 'platform',
              recipient_id: null,
              amount: split.platform,
              status: 'pending',
            })

            await supabase.from('payment_splits').insert(splits)
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object

        // Atualizar subscription como cancelada
        await supabase
          .from('payment_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSubscription.id)

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object

        // Atualizar subscription
        await supabase
          .from('payment_subscriptions')
          .update({
            status: stripeSubscription.status === 'active' ? 'active' : 'canceled',
            current_period_start: new Date(
              stripeSubscription.current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              stripeSubscription.current_period_end * 1000,
            ).toISOString(),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSubscription.id)

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        console.log(`[INFO] Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('[ERROR] Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

