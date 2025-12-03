import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

/**
 * Serviço para interagir com Stripe via Supabase Edge Functions
 * As chamadas diretas ao Stripe devem ser feitas no backend (Edge Functions)
 */

export interface CreatePaymentIntentParams {
  amount: number
  currency?: string
  userId: string
  productId: string
  type: 'subscription' | 'one_time'
  referralTrainerId?: string
  metadata?: Record<string, any>
}

export interface CreateSubscriptionParams {
  userId: string
  productId: string
  referralTrainerId?: string
  metadata?: Record<string, any>
}

export const stripeService = {
  /**
   * Criar Payment Intent para pagamento único (treino avulso)
   */
  async createPaymentIntent(params: CreatePaymentIntentParams) {
    try {
      // Chamar Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: params,
        },
      )

      if (error) {
        logger.error('Error creating payment intent', error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in stripeService.createPaymentIntent', error)
      throw error
    }
  },

  /**
   * Criar Subscription (assinatura)
   */
  async createSubscription(params: CreateSubscriptionParams) {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-subscription',
        {
          body: params,
        },
      )

      if (error) {
        logger.error('Error creating subscription', error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in stripeService.createSubscription', error)
      throw error
    }
  },

  /**
   * Cancelar Subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      const { data, error } = await supabase.functions.invoke(
        'cancel-subscription',
        {
          body: { subscriptionId },
        },
      )

      if (error) {
        logger.error('Error canceling subscription', error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in stripeService.cancelSubscription', error)
      throw error
    }
  },

  /**
   * Buscar Subscription por ID
   */
  async getSubscription(subscriptionId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (error) {
        logger.error('Error fetching subscription', error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in stripeService.getSubscription', error)
      throw error
    }
  },
}
