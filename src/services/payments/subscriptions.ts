import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface Subscription {
  id: string
  user_id: string
  product_id: string
  trainer_id: string | null
  referral_trainer_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  stripe_subscription_id: string
  stripe_customer_id: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export const subscriptionService = {
  /**
   * Buscar assinaturas do usuário
   */
  async getUserSubscriptions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching user subscriptions', error)
        throw error
      }

      return (data || []) as Subscription[]
    } catch (error) {
      logger.error('Error in subscriptionService.getUserSubscriptions', error)
      throw error
    }
  },

  /**
   * Buscar assinatura ativa do usuário
   */
  async getActiveSubscription(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching active subscription', error)
        throw error
      }

      return data as Subscription | null
    } catch (error) {
      logger.error('Error in subscriptionService.getActiveSubscription', error)
      throw error
    }
  },

  /**
   * Verificar se usuário tem assinatura ativa
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(userId)
      return subscription !== null
    } catch (error) {
      logger.error('Error in subscriptionService.hasActiveSubscription', error)
      return false
    }
  },

  /**
   * Buscar assinatura por ID
   */
  async getSubscriptionById(id: string) {
    try {
      const { data, error } = await supabase
        .from('payment_subscriptions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logger.error('Error fetching subscription', error)
        throw error
      }

      return data as Subscription
    } catch (error) {
      logger.error('Error in subscriptionService.getSubscriptionById', error)
      throw error
    }
  },
}

