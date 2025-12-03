import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface Split {
  id: string
  transaction_id: string
  recipient_type: 'platform' | 'trainer'
  recipient_id: string | null
  amount: number
  status: 'pending' | 'transferred' | 'failed'
  stripe_transfer_id: string | null
  stripe_payout_id: string | null
  transferred_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainerEarnings {
  total: number
  pending: number
  transferred: number
  thisMonth: number
  lastMonth: number
}

export const splitService = {
  /**
   * Calcular divisão de receita
   */
  calculateSplit(
    netAmount: number,
    hasReferral: boolean
  ): { platform: number; trainer: number; platformPercentage: number; trainerPercentage: number } {
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
  },

  /**
   * Buscar splits do trainer
   */
  async getTrainerSplits(trainerId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_splits')
        .select('*')
        .eq('recipient_id', trainerId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching trainer splits', error)
        throw error
      }

      return (data || []) as Split[]
    } catch (error) {
      logger.error('Error in splitService.getTrainerSplits', error)
      throw error
    }
  },

  /**
   * Calcular ganhos do trainer
   */
  async getTrainerEarnings(trainerId: string): Promise<TrainerEarnings> {
    try {
      const splits = await this.getTrainerSplits(trainerId)

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      const total = splits.reduce((sum, split) => sum + Number(split.amount), 0)
      const pending = splits
        .filter((s) => s.status === 'pending')
        .reduce((sum, split) => sum + Number(split.amount), 0)
      const transferred = splits
        .filter((s) => s.status === 'transferred')
        .reduce((sum, split) => sum + Number(split.amount), 0)

      const thisMonth = splits
        .filter((s) => {
          const createdAt = new Date(s.created_at)
          return createdAt >= startOfMonth
        })
        .reduce((sum, split) => sum + Number(split.amount), 0)

      const lastMonth = splits
        .filter((s) => {
          const createdAt = new Date(s.created_at)
          return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth
        })
        .reduce((sum, split) => sum + Number(split.amount), 0)

      return {
        total,
        pending,
        transferred,
        thisMonth,
        lastMonth,
      }
    } catch (error) {
      logger.error('Error in splitService.getTrainerEarnings', error)
      throw error
    }
  },
}

