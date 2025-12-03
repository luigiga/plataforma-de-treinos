import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface Transaction {
  id: string
  user_id: string
  trainer_id: string | null
  referral_trainer_id: string | null
  product_id: string | null
  subscription_id: string | null
  type: 'subscription' | 'one_time'
  amount: number
  currency: string
  stripe_fee: number
  net_amount: number
  platform_percentage: number
  trainer_percentage: number
  platform_fee: number
  trainer_fee: number
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded'
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_invoice_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export const transactionService = {
  /**
   * Buscar transações do usuário com paginação
   */
  async getUserTransactions(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const offset = (page - 1) * pageSize

      // Buscar total
      const { count, error: countError } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (countError) {
        logger.error('Error counting transactions', countError)
        throw countError
      }

      // Buscar dados paginados
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) {
        logger.error('Error fetching transactions', error)
        throw error
      }

      return {
        data: (data || []) as Transaction[],
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > offset + pageSize,
      }
    } catch (error) {
      logger.error('Error in transactionService.getUserTransactions', error)
      throw error
    }
  },

  /**
   * Buscar transações do trainer com paginação
   */
  async getTrainerTransactions(
    trainerId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const offset = (page - 1) * pageSize

      const { count, error: countError } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .or(`trainer_id.eq.${trainerId},referral_trainer_id.eq.${trainerId}`)

      if (countError) {
        logger.error('Error counting trainer transactions', countError)
        throw countError
      }

      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .or(`trainer_id.eq.${trainerId},referral_trainer_id.eq.${trainerId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) {
        logger.error('Error fetching trainer transactions', error)
        throw error
      }

      return {
        data: (data || []) as Transaction[],
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > offset + pageSize,
      }
    } catch (error) {
      logger.error('Error in transactionService.getTrainerTransactions', error)
      throw error
    }
  },

  /**
   * Buscar transação por ID
   */
  async getTransactionById(id: string) {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logger.error('Error fetching transaction', error)
        throw error
      }

      return data as Transaction
    } catch (error) {
      logger.error('Error in transactionService.getTransactionById', error)
      throw error
    }
  },
}

