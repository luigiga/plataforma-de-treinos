import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workoutService, PaginationParams, PaginatedResponse } from '@/services/workouts'
import { Workout, Review } from '@/context/DataContext'

/**
 * Hook otimizado para buscar workouts com cache e paginação
 * Use este hook ao invés de usarData().workouts para melhor performance
 */
export function useWorkouts(params: PaginationParams = {}) {
  return useQuery({
    queryKey: ['workouts', 'paginated', params.page, params.pageSize],
    queryFn: () => workoutService.fetchWorkoutsPaginated(params),
    staleTime: 2 * 60 * 1000, // 2 minutos para workouts (dados mudam menos)
  })
}

/**
 * Hook para buscar workouts de um trainer específico
 */
export function useTrainerWorkouts(
  trainerId: string,
  params: PaginationParams = {},
) {
  return useQuery({
    queryKey: ['workouts', 'trainer', trainerId, params.page, params.pageSize],
    queryFn: () => workoutService.fetchWorkoutsByTrainerPaginated(trainerId, params),
    enabled: !!trainerId, // Só executa se trainerId existir
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook para buscar um workout específico por ID
 */
export function useWorkout(workoutId: string | null) {
  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => workoutService.fetchWorkoutById(workoutId!),
    enabled: !!workoutId, // Só executa se workoutId existir
    staleTime: 5 * 60 * 1000, // 5 minutos (dados de um workout específico mudam pouco)
  })
}

/**
 * Hook para buscar reviews com paginação
 */
export function useReviews(
  workoutId?: string,
  params: PaginationParams = {},
) {
  return useQuery({
    queryKey: ['reviews', workoutId, params.page, params.pageSize],
    queryFn: () => workoutService.fetchReviewsPaginated(workoutId, params),
    staleTime: 1 * 60 * 1000, // 1 minuto para reviews
  })
}

/**
 * Hook para criar workout (mutation)
 */
export function useCreateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workout: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>) =>
      workoutService.createWorkout(workout),
    onSuccess: () => {
      // Invalidar cache de workouts para refetch
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}

/**
 * Hook para deletar workout (mutation)
 */
export function useDeleteWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => workoutService.deleteWorkout(id),
    onSuccess: () => {
      // Invalidar cache de workouts
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}

/**
 * Hook para adicionar review (mutation)
 */
export function useAddReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (review: Omit<Review, 'id' | 'createdAt'>) =>
      workoutService.addReview(review),
    onSuccess: (_, variables) => {
      // Invalidar cache de reviews do workout específico
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.workoutId] })
    },
  })
}

