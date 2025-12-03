import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentIntentRequest {
  amount: number
  currency?: string
  userId: string
  productId: string
  type: 'subscription' | 'one_time'
  referralTrainerId?: string
  metadata?: Record<string, any>
}

export const onRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      amount,
      currency = 'BRL',
      userId,
      productId,
      type,
      referralTrainerId,
      metadata = {},
    } = (await req.json()) as CreatePaymentIntentRequest

    // Validação
    if (!amount || !userId || !productId || !type) {
      throw new Error('Missing required fields: amount, userId, productId, type')
    }

    if (type !== 'one_time') {
      throw new Error('Payment intent is only for one_time payments')
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar produto
    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      throw new Error('Product not found or inactive')
    }

    // Buscar workout para obter trainer_id
    let trainerId: string | null = product.trainer_id

    if (product.workout_id) {
      const { data: workout } = await supabase
        .from('workouts')
        .select('trainer_id')
        .eq('id', product.workout_id)
        .single()

      if (workout) {
        trainerId = workout.trainer_id
      }
    }

    // Calcular taxas do Stripe (aproximadamente 3.9% + R$ 0.40 para cartão de crédito no Brasil)
    const stripeFeePercent = 0.039
    const stripeFixedFee = 0.40
    const stripeFee = amount * stripeFeePercent + stripeFixedFee
    const netAmount = amount - stripeFee

    // Calcular split (80/20 padrão ou 90/10 com referral)
    const hasReferral = !!referralTrainerId
    const platformPercentage = hasReferral ? 10 : 20
    const trainerPercentage = hasReferral ? 90 : 80
    const platformFee = (netAmount * platformPercentage) / 100
    const trainerFee = (netAmount * trainerPercentage) / 100

    // Criar Payment Intent no Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Stripe usa centavos
        currency: currency.toLowerCase(),
        metadata: JSON.stringify({
          userId,
          productId,
          type,
          trainerId: trainerId || '',
          referralTrainerId: referralTrainerId || '',
          ...metadata,
        }),
      }),
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json()
      throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`)
    }

    const paymentIntent = await stripeResponse.json()

    // Criar transação no banco
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
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

    // Criar splits
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

    const { error: splitsError } = await supabase
      .from('payment_splits')
      .insert(splits)

    if (splitsError) {
      console.error('[ERROR] Failed to create splits:', splitsError)
      // Não falhar o processo, apenas logar o erro
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: transaction.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('[ERROR] Failed to create payment intent:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

