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

      const purchaseType = workout.purchaseType || 'free'
      const isPaid = workout.isPaid || false

      return accessService.checkWorkoutAccess(
        user.id,
        workout.id,
        workout.trainerId,
        purchaseType,
        isPaid,
      )
    },
    enabled: !!user && !!workout,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

