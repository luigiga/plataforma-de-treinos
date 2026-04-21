import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CreateSubscriptionRequest {
  userId?: string
  productId: string
  referralTrainerId?: string
  metadata?: Record<string, unknown>
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

function appendMetadata(params: URLSearchParams, metadata: Record<string, unknown>) {
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'undefined' || value === null) continue
    params.append(`metadata[${key}]`, String(value))
  }
}

export const onRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = getRequiredEnv('STRIPE_SECRET_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = getBearerToken(req)

    const { userId, productId, referralTrainerId, metadata = {} } =
      (await req.json()) as CreateSubscriptionRequest

    if (!productId) {
      throw new Error('Missing required field: productId')
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !authUser) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    if (userId && userId !== authUser.id) {
      return jsonResponse({ error: 'User mismatch' }, 403)
    }

    const effectiveUserId = authUser.id

    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select('id, trainer_id, workout_id, stripe_price_id, is_active, type')
      .eq('id', productId)
      .eq('is_active', true)
      .eq('type', 'subscription')
      .single()

    if (productError || !product) {
      throw new Error('Subscription product not found or inactive')
    }

    if (!product.stripe_price_id) {
      throw new Error('Product missing Stripe price ID')
    }

    const { data: existingSubscription } = await supabase
      .from('payment_subscriptions')
      .select('id, status, stripe_subscription_id')
      .eq('user_id', effectiveUserId)
      .eq('product_id', productId)
      .in('status', ['active', 'trialing', 'past_due', 'incomplete'])
      .limit(1)
      .maybeSingle()

    if (existingSubscription) {
      return jsonResponse(
        {
          error: 'An active or pending subscription already exists for this product',
          subscriptionId: existingSubscription.stripe_subscription_id,
        },
        409,
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', effectiveUserId)
      .single()

    if (!profile?.email) {
      throw new Error('User email not found')
    }

    let trainerId: string | null = product.trainer_id

    if (product.workout_id) {
      const { data: workout } = await supabase
        .from('workouts')
        .select('trainer_id')
        .eq('id', product.workout_id)
        .single()

      if (workout?.trainer_id) {
        trainerId = workout.trainer_id
      }
    }

    const { data: existingCustomerSubscription } = await supabase
      .from('payment_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', effectiveUserId)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let customerId: string

    if (existingCustomerSubscription?.stripe_customer_id) {
      customerId = existingCustomerSubscription.stripe_customer_id
    } else {
      const customerParams = new URLSearchParams()
      customerParams.set('email', profile.email)
      appendMetadata(customerParams, {
        userId: effectiveUserId,
        referralTrainerId: referralTrainerId || '',
      })

      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: customerParams,
      })

      if (!customerResponse.ok) {
        const error = await customerResponse.json()
        throw new Error(`Stripe customer error: ${error.error?.message || 'Unknown error'}`)
      }

      const customer = await customerResponse.json()
      customerId = customer.id
    }

    const subscriptionParams = new URLSearchParams()
    subscriptionParams.set('customer', customerId)
    subscriptionParams.set('items[0][price]', product.stripe_price_id)
    subscriptionParams.set('payment_behavior', 'default_incomplete')
    subscriptionParams.set('payment_settings[save_default_payment_method]', 'on_subscription')
    subscriptionParams.append('expand[]', 'latest_invoice.payment_intent')
    appendMetadata(subscriptionParams, {
      userId: effectiveUserId,
      productId,
      referralTrainerId: referralTrainerId || '',
      ...metadata,
    })

    const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: subscriptionParams,
    })

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json()
      throw new Error(`Stripe subscription error: ${error.error?.message || 'Unknown error'}`)
    }

    const subscription = await subscriptionResponse.json()
    const paymentIntent = subscription.latest_invoice?.payment_intent

    const { data: subscriptionRecord, error: subscriptionError } = await supabase
      .from('payment_subscriptions')
      .insert({
        user_id: effectiveUserId,
        product_id: productId,
        trainer_id: trainerId,
        referral_trainer_id: referralTrainerId || null,
        status: subscription.status || 'incomplete',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('[ERROR] Failed to create subscription record:', subscriptionError)
      throw new Error('Failed to create subscription record')
    }

    return jsonResponse({
      clientSecret: paymentIntent?.client_secret,
      subscriptionId: subscription.id,
      subscriptionRecordId: subscriptionRecord.id,
    })
  } catch (error: any) {
    console.error('[ERROR] Failed to create subscription:', error)
    return jsonResponse({ error: error.message }, 400)
  }
}
