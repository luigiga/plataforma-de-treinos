import { useQuery } from '@tanstack/react-query'
import { accessService, WorkoutAccess } from '@/services/payments/access'
import { useAuth } from '@/context/AuthContext'
import { Workout } from '@/context/DataContext'

/**
 * Hook para verificar acesso a um workout
 */
export function useWorkoutAccess(workout: Workout | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workout-access', workout?.id, user?.id],
    queryFn: async (): Promise<WorkoutAccess> => {
      if (!user || !workout) {
        return { hasAccess: false }
      }

      // Buscar informações do workout do banco para ter purchase_type e is_paid
      // Por enquanto, vamos assumir que está no objeto workout
      // TODO: Adicionar purchase_type e is_paid ao tipo Workout

      const purchaseType = (workout as any).purchase_type || 'free'
      const isPaid = (workout as any).is_paid || false

      return accessService.checkWorkoutAccess(
        user.id,
        workout.id,
        workout.trainerId,
        purchaseType as 'subscription' | 'one_time' | 'free',
        isPaid
      )
    },
    enabled: !!user && !!workout,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

