import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CancelSubscriptionRequest {
  subscriptionId: string
}

export const onRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscriptionId } = (await req.json()) as CancelSubscriptionRequest

    if (!subscriptionId) {
      throw new Error('Missing required field: subscriptionId')
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar subscription no banco
    const { data: subscription, error: subscriptionError } = await supabase
      .from('payment_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (subscriptionError || !subscription) {
      throw new Error('Subscription not found')
    }

    if (subscription.status === 'canceled') {
      return new Response(
        JSON.stringify({ message: 'Subscription already canceled' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Cancelar subscription no Stripe
    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          cancel_at_period_end: 'true', // Cancelar no final do período atual
        }),
      },
    )

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json()
      throw new Error(`Stripe cancel error: ${error.error?.message || 'Unknown error'}`)
    }

    const canceledSubscription = await cancelResponse.json()

    // Atualizar subscription no banco
    const { error: updateError } = await supabase
      .from('payment_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        current_period_end: new Date(
          canceledSubscription.current_period_end * 1000,
        ).toISOString(),
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('[ERROR] Failed to update subscription:', updateError)
      throw new Error('Failed to update subscription record')
    }

    return new Response(
      JSON.stringify({
        message: 'Subscription canceled successfully',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: canceledSubscription.current_period_end,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('[ERROR] Failed to cancel subscription:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

