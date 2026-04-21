import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CancelSubscriptionRequest {
  subscriptionId: string
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

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token')
  }
  return authHeader.replace('Bearer ', '').trim()
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

    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = getRequiredEnv('STRIPE_SECRET_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = getBearerToken(req)

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !authUser) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    const requesterRole = requesterProfile?.role || 'subscriber'

    const { data: subscription, error: subscriptionError } = await supabase
      .from('payment_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (subscriptionError || !subscription) {
      throw new Error('Subscription not found')
    }

    const canCancel =
      subscription.user_id === authUser.id || requesterRole === 'admin'

    if (!canCancel) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    if (subscription.cancel_at_period_end || subscription.status === 'canceled') {
      return jsonResponse({
        message: 'Subscription already scheduled for cancellation',
        cancelAtPeriodEnd: true,
      })
    }

    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          cancel_at_period_end: 'true',
        }),
      },
    )

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json()
      throw new Error(`Stripe cancel error: ${error.error?.message || 'Unknown error'}`)
    }

    const canceledSubscription = await cancelResponse.json()

    const { error: updateError } = await supabase
      .from('payment_subscriptions')
      .update({
        cancel_at_period_end: true,
        current_period_end: new Date(
          canceledSubscription.current_period_end * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('[ERROR] Failed to update subscription:', updateError)
      throw new Error('Failed to update subscription record')
    }

    return jsonResponse({
      message: 'Subscription scheduled for cancellation',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: canceledSubscription.current_period_end,
    })
  } catch (error: any) {
    console.error('[ERROR] Failed to cancel subscription:', error)
    return jsonResponse({ error: error.message }, 400)
  }
}
