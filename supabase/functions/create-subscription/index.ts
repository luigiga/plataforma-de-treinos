import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CreateSubscriptionRequest {
  userId: string
  productId: string
  referralTrainerId?: string
  metadata?: Record<string, any>
}

export const onRequest = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, productId, referralTrainerId, metadata = {} } =
      (await req.json()) as CreateSubscriptionRequest

    // Validação
    if (!userId || !productId) {
      throw new Error('Missing required fields: userId, productId')
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
      .eq('type', 'subscription')
      .single()

    if (productError || !product) {
      throw new Error('Subscription product not found or inactive')
    }

    if (!product.stripe_price_id) {
      throw new Error('Product missing Stripe price ID')
    }

    // Buscar perfil do usuário para obter email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!profile?.email) {
      throw new Error('User email not found')
    }

    // Buscar ou criar customer no Stripe
    const { data: existingSubscription } = await supabase
      .from('payment_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    let customerId: string

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      // Criar customer no Stripe
      const customerResponse = await fetch(
        'https://api.stripe.com/v1/customers',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: profile.email,
            metadata: JSON.stringify({
              userId,
              referralTrainerId: referralTrainerId || '',
            }),
          }),
        },
      )

      if (!customerResponse.ok) {
        const error = await customerResponse.json()
        throw new Error(`Stripe customer error: ${error.error?.message || 'Unknown error'}`)
      }

      const customer = await customerResponse.json()
      customerId = customer.id
    }

    // Criar subscription no Stripe
    const subscriptionResponse = await fetch(
      'https://api.stripe.com/v1/subscriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer: customerId,
          items: JSON.stringify([{ price: product.stripe_price_id }]),
          payment_behavior: 'default_incomplete',
          payment_settings: JSON.stringify({ save_default_payment_method: 'on_subscription' }),
          expand: JSON.stringify(['latest_invoice.payment_intent']),
          metadata: JSON.stringify({
            userId,
            productId,
            referralTrainerId: referralTrainerId || '',
            ...metadata,
          }),
        }),
      },
    )

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json()
      throw new Error(`Stripe subscription error: ${error.error?.message || 'Unknown error'}`)
    }

    const subscription = await subscriptionResponse.json()
    const paymentIntent = subscription.latest_invoice?.payment_intent

    // Criar registro de subscription no banco
    const { data: subscriptionRecord, error: subscriptionError } = await supabase
      .from('payment_subscriptions')
      .insert({
        user_id: userId,
        product_id: productId,
        trainer_id: product.trainer_id,
        referral_trainer_id: referralTrainerId || null,
        status: 'trialing', // Será atualizado pelo webhook quando o pagamento for confirmado
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('[ERROR] Failed to create subscription record:', subscriptionError)
      throw new Error('Failed to create subscription record')
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
        subscriptionRecordId: subscriptionRecord.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('[ERROR] Failed to create subscription:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

