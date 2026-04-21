import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentIntentRequest {
  amount?: number
  currency?: string
  userId?: string
  productId: string
  type: 'subscription' | 'one_time'
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

    const {
      amount: requestedAmount,
      currency: requestedCurrency,
      userId,
      productId,
      type,
      referralTrainerId,
      metadata = {},
    } = (await req.json()) as CreatePaymentIntentRequest

    if (!productId || !type) {
      throw new Error('Missing required fields: productId, type')
    }

    if (type !== 'one_time') {
      throw new Error('Payment intent is only for one_time payments')
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
      .select('id, price, currency, trainer_id, workout_id, type, is_active')
      .eq('id', productId)
      .eq('is_active', true)
      .eq('type', 'one_time')
      .single()

    if (productError || !product) {
      throw new Error('Product not found or inactive')
    }

    const amount = Number(product.price)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid product price')
    }

    if (
      typeof requestedAmount === 'number' &&
      Math.abs(requestedAmount - amount) > 0.001
    ) {
      return jsonResponse({ error: 'Amount does not match product price' }, 400)
    }

    const currency = (requestedCurrency || product.currency || 'BRL').toUpperCase()
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

    const stripeFeePercent = 0.039
    const stripeFixedFee = 0.4
    const stripeFee = amount * stripeFeePercent + stripeFixedFee
    const netAmount = amount - stripeFee

    const hasReferral = !!referralTrainerId
    const platformPercentage = hasReferral ? 10 : 20
    const trainerPercentage = hasReferral ? 90 : 80
    const platformFee = (netAmount * platformPercentage) / 100
    const trainerFee = (netAmount * trainerPercentage) / 100

    const stripeParams = new URLSearchParams()
    stripeParams.set('amount', Math.round(amount * 100).toString())
    stripeParams.set('currency', currency.toLowerCase())
    stripeParams.set('automatic_payment_methods[enabled]', 'true')
    appendMetadata(stripeParams, {
      userId: effectiveUserId,
      productId,
      type,
      trainerId: trainerId || '',
      referralTrainerId: referralTrainerId || '',
      ...metadata,
    })

    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeParams,
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json()
      throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`)
    }

    const paymentIntent = await stripeResponse.json()

    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: effectiveUserId,
        trainer_id: trainerId,
        referral_trainer_id: referralTrainerId || null,
        product_id: productId,
        type: 'one_time',
        amount,
        currency,
        stripe_fee: stripeFee,
        net_amount: netAmount,
        platform_percentage: platformPercentage,
        trainer_percentage: trainerPercentage,
        platform_fee: platformFee,
        trainer_fee: trainerFee,
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        metadata: { ...metadata, paymentIntentId: paymentIntent.id },
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[ERROR] Failed to create transaction:', transactionError)
      throw new Error('Failed to create transaction record')
    }

    const splits = []
    if (trainerId) {
      splits.push({
        transaction_id: transaction.id,
        recipient_type: 'trainer',
        recipient_id: trainerId,
        amount: trainerFee,
        status: 'pending',
      })
    }
    splits.push({
      transaction_id: transaction.id,
      recipient_type: 'platform',
      recipient_id: null,
      amount: platformFee,
      status: 'pending',
    })

    const { error: splitsError } = await supabase.from('payment_splits').insert(splits)

    if (splitsError) {
      console.error('[ERROR] Failed to create splits:', splitsError)
    }

    return jsonResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction.id,
    })
  } catch (error: any) {
    console.error('[ERROR] Failed to create payment intent:', error)
    return jsonResponse({ error: error.message }, 400)
  }
}
