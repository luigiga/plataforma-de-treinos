import { subscriptionService } from './subscriptions'
import { transactionService } from './transactions'
import { logger } from '@/lib/logger'

export interface WorkoutAccess {
  hasAccess: boolean
  reason?: 'subscription' | 'purchased' | 'free' | 'assigned' | 'owner'
  subscriptionId?: string
  transactionId?: string
}

/**
 * Serviço para verificar acesso a workouts
 */
export const accessService = {
  /**
   * Verificar se usuário tem acesso a um workout
   */
  async checkWorkoutAccess(
    userId: string,
    workoutId: string,
    workoutTrainerId: string,
    workoutPurchaseType: 'subscription' | 'one_time' | 'free',
    workoutIsPaid: boolean
  ): Promise<WorkoutAccess> {
    try {
      // Se o workout é gratuito, todos têm acesso
      if (!workoutIsPaid || workoutPurchaseType === 'free') {
        return {
          hasAccess: true,
          reason: 'free',
        }
      }

      // Se o usuário é o trainer dono, tem acesso
      if (userId === workoutTrainerId) {
        return {
          hasAccess: true,
          reason: 'owner',
        }
      }

      // Verificar se tem assinatura ativa (para workouts que requerem assinatura)
      if (workoutPurchaseType === 'subscription') {
        const hasSubscription = await subscriptionService.hasActiveSubscription(userId)
        if (hasSubscription) {
          const subscription = await subscriptionService.getActiveSubscription(userId)
          return {
            hasAccess: true,
            reason: 'subscription',
            subscriptionId: subscription?.id,
          }
        }
        return {
          hasAccess: false,
          reason: 'subscription',
        }
      }

      // Verificar se comprou o treino avulso
      if (workoutPurchaseType === 'one_time') {
        // Buscar produto associado ao workout
        const { productService } = await import('./products')
        const product = await productService.getProductByWorkoutId(workoutId)

        if (!product) {
          // Se não houver produto, permitir acesso (workout gratuito)
          return {
            hasAccess: true,
            reason: 'free',
          }
        }

        const transactions = await transactionService.getUserTransactions(userId, {
          page: 1,
          pageSize: 100,
        })

        const hasPurchased = transactions.data.some(
          (t) =>
            t.type === 'one_time' &&
            t.status === 'succeeded' &&
            t.product_id === product.id
        )

        if (hasPurchased) {
          const transaction = transactions.data.find(
            (t) => t.type === 'one_time' && t.status === 'succeeded' && t.product_id === product.id
          )
          return {
            hasAccess: true,
            reason: 'purchased',
            transactionId: transaction?.id,
          }
        }

        return {
          hasAccess: false,
          reason: 'purchased',
        }
      }

      // Por padrão, sem acesso
      return {
        hasAccess: false,
      }
    } catch (error) {
      logger.error('Error checking workout access', error)
      // Em caso de erro, negar acesso por segurança
      return {
        hasAccess: false,
      }
    }
  },
}

