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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function parseStripeSignatureHeader(signature: string) {
  const parts = signature.split(',')
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid Stripe signature header')
  }

  return { timestamp, signatures }
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return mismatch === 0
}

async function createHmacSha256(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
) {
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader)
  const timestampMs = Number(timestamp) * 1000

  if (!Number.isFinite(timestampMs)) {
    throw new Error('Invalid Stripe timestamp')
  }

  const toleranceMs = 5 * 60 * 1000
  if (Math.abs(Date.now() - timestampMs) > toleranceMs) {
    throw new Error('Stripe webhook timestamp outside tolerance window')
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const expectedSignature = await createHmacSha256(secret, signedPayload)

  const isValid = signatures.some((signature) =>
    timingSafeEqual(signature, expectedSignature),
  )

  if (!isValid) {
    throw new Error('Invalid Stripe webhook signature')
  }
}

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
    const stripeWebhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    const body = await req.text()
    await verifyStripeSignature(body, signature, stripeWebhookSecret)

    const event: StripeEvent = JSON.parse(body)

    console.log(`[INFO] Processing Stripe event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object

        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('id, status')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .maybeSingle()

        if (!transaction) {
          return jsonResponse({ received: true, ignored: 'transaction_not_found' })
        }

        if (transaction.status === 'succeeded') {
          return jsonResponse({ received: true, ignored: 'already_processed' })
        }

        await supabase
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            stripe_charge_id: paymentIntent.latest_charge || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id)

        await supabase
          .from('payment_splits')
          .update({ status: 'pending' })
          .eq('transaction_id', transaction.id)

        return jsonResponse({ received: true })
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object

        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        return jsonResponse({ received: true })
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (!subscriptionId) {
          return jsonResponse({ received: true, ignored: 'missing_subscription' })
        }

        const { data: existingTransaction } = await supabase
          .from('payment_transactions')
          .select('id')
          .eq('stripe_invoice_id', invoice.id)
          .maybeSingle()

        if (existingTransaction) {
          return jsonResponse({ received: true, ignored: 'already_processed' })
        }

        const { data: subscription } = await supabase
          .from('payment_subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!subscription) {
          return jsonResponse({ received: true, ignored: 'subscription_not_found' })
        }

        await supabase
          .from('payment_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(
              invoice.period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id)

        const amount = invoice.amount_paid / 100
        const currency = invoice.currency.toUpperCase()
        const stripeFeePercent = 0.039
        const stripeFixedFee = 0.4
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

        return jsonResponse({ received: true })
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object

        await supabase
          .from('payment_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSubscription.id)

        return jsonResponse({ received: true })
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object

        await supabase
          .from('payment_subscriptions')
          .update({
            status: stripeSubscription.status,
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

        return jsonResponse({ received: true })
      }

      default:
        console.log(`[INFO] Unhandled event type: ${event.type}`)
        return jsonResponse({ received: true, ignored: 'unhandled_event' })
    }
  } catch (error: any) {
    console.error('[ERROR] Webhook processing error:', error)
    return jsonResponse({ error: error.message }, 400)
  }
}
