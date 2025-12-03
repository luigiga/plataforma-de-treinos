import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService, Product } from '@/services/payments/products'
import { subscriptionService, Subscription } from '@/services/payments/subscriptions'
import { transactionService, Transaction } from '@/services/payments/transactions'
import { splitService, TrainerEarnings } from '@/services/payments/splits'
import { stripeService } from '@/services/payments/stripe'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

/**
 * Hook para buscar produtos
 */
export function useProducts(filters?: {
  type?: 'subscription' | 'one_time'
  trainer_id?: string
  workout_id?: string
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar produto por ID
 */
export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => (productId ? productService.getProductById(productId) : null),
    enabled: !!productId,
  })
}

/**
 * Hook para buscar produto por workout_id
 */
export function useProductByWorkout(workoutId: string | null) {
  return useQuery({
    queryKey: ['product', 'workout', workoutId],
    queryFn: () => (workoutId ? productService.getProductByWorkoutId(workoutId) : null),
    enabled: !!workoutId,
  })
}

/**
 * Hook para buscar assinaturas do usuário
 */
export function useSubscriptions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: () => (user ? subscriptionService.getUserSubscriptions(user.id) : []),
    enabled: !!user,
  })
}

/**
 * Hook para buscar assinatura ativa
 */
export function useActiveSubscription() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['subscription', 'active', user?.id],
    queryFn: () => (user ? subscriptionService.getActiveSubscription(user.id) : null),
    enabled: !!user,
  })
}

/**
 * Hook para verificar se tem assinatura ativa
 */
export function useHasActiveSubscription() {
  const { data: subscription } = useActiveSubscription()
  return !!subscription
}

/**
 * Hook para criar assinatura
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      productId: string
      referralTrainerId?: string
    }) => {
      if (!user) throw new Error('Usuário não autenticado')
      return stripeService.createSubscription({
        userId: user.id,
        productId: params.productId,
        referralTrainerId: params.referralTrainerId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast.success('Assinatura criada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar assinatura')
    },
  })
}

/**
 * Hook para cancelar assinatura
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      stripeService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast.success('Assinatura cancelada com sucesso')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cancelar assinatura')
    },
  })
}

/**
 * Hook para buscar transações do usuário
 */
export function useTransactions(page: number = 1, pageSize: number = 20) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', user?.id, page, pageSize],
    queryFn: () =>
      user ? transactionService.getUserTransactions(user.id, { page, pageSize }) : null,
    enabled: !!user,
  })
}

/**
 * Hook para buscar transações do trainer
 */
export function useTrainerTransactions(trainerId: string | null, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['transactions', 'trainer', trainerId, page, pageSize],
    queryFn: () =>
      trainerId ? transactionService.getTrainerTransactions(trainerId, { page, pageSize }) : null,
    enabled: !!trainerId,
  })
}

/**
 * Hook para buscar ganhos do trainer
 */
export function useTrainerEarnings(trainerId: string | null) {
  return useQuery({
    queryKey: ['earnings', trainerId],
    queryFn: () => (trainerId ? splitService.getTrainerEarnings(trainerId) : null),
    enabled: !!trainerId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Hook para criar payment intent (treino avulso)
 */
export function useCreatePaymentIntent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      productId: string
      amount: number
      referralTrainerId?: string
    }) => {
      if (!user) throw new Error('Usuário não autenticado')
      return stripeService.createPaymentIntent({
        userId: user.id,
        productId: params.productId,
        amount: params.amount,
        type: 'one_time',
        referralTrainerId: params.referralTrainerId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar pagamento')
    },
  })
}

