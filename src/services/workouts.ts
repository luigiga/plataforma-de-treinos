import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Workout, Review } from '@/context/DataContext'

// Pagination types
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

// Helper function to map workout data
const mapWorkoutData = (w: any, trainerName: string = 'Trainer'): Workout => ({
  id: w.id,
  trainerId: w.trainer_id,
  trainerName: trainerName,
  title: w.title,
  description: w.description,
  image: w.image,
  duration: w.duration,
  difficulty: w.difficulty,
  category: w.category || [],
  status: w.status,
  createdAt: w.created_at,
  isCircuit: w.is_circuit,
  price: w.price ? Number(w.price) : undefined,
  isPaid: w.is_paid || false,
  purchaseType: (w.purchase_type || 'free') as 'subscription' | 'one_time' | 'free',
  exercises: (w.exercises || []).map((e: any) => ({
    id: e.id,
    name: e.name,
    sets: e.sets,
    reps: e.reps,
    instructions: e.instructions,
    videoUrl: e.video_url,
    variations: e.variations,
  })),
})

export const workoutService = {
  /**
   * Fetch all workouts (legacy method - mantido para compatibilidade)
   * @deprecated Use fetchWorkoutsPaginated for better performance
   */
  async fetchWorkouts(): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*, exercises(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workouts:', error)
      throw error
    }

    // Fetch trainer names separately
    const trainerIds = [...new Set((data || []).map((w: any) => w.trainer_id))]
    const { data: trainers } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', trainerIds.length > 0 ? trainerIds : ['00000000-0000-0000-0000-000000000000'])

    const trainerMap = new Map(
      (trainers || []).map((t: any) => [t.id, t.full_name || t.username || 'Trainer']),
    )

    return (data || []).map((w: any) =>
      mapWorkoutData(w, trainerMap.get(w.trainer_id) || 'Trainer'),
    ) as Workout[]
  },

  /**
   * Fetch workouts with pagination (NOVO - otimizado)
   * Use este método para melhor performance e escalabilidade
   */
  async fetchWorkoutsPaginated(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Workout>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    // Get total count (otimizado)
    const { count, error: countError } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    if (countError) throw countError

    // Fetch paginated data with optimized select (apenas campos necessários)
    const { data, error } = await supabase
      .from('workouts')
      .select(
        'id, trainer_id, title, description, image, duration, difficulty, category, status, is_circuit, price, is_paid, purchase_type, created_at, exercises(id, name, sets, reps, instructions, video_url, variations)',
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      logger.error('Error fetching workouts', error)
      throw error
    }

    // Fetch trainer names separately if needed
    const trainerIds = [...new Set((data || []).map((w: any) => w.trainer_id).filter(Boolean))]
    const trainerMap = new Map<string, string>()
    
    if (trainerIds.length > 0) {
      const { data: trainers } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', trainerIds)

      if (trainers) {
        trainers.forEach((t: any) => {
          trainerMap.set(t.id, t.full_name || t.username || 'Trainer')
        })
      }
    }

    return {
      data: (data || []).map((w: any) =>
        mapWorkoutData(w, trainerMap.get(w.trainer_id) || 'Trainer'),
      ),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    }
  },

  /**
   * Fetch workouts by trainer with pagination (NOVO)
   */
  async fetchWorkoutsByTrainerPaginated(
    trainerId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Workout>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const { count, error: countError } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', trainerId)

    if (countError) {
      logger.error('Error counting workouts', countError)
      throw countError
    }

    const { data, error } = await supabase
      .from('workouts')
      .select(
        'id, trainer_id, title, description, image, duration, difficulty, category, status, is_circuit, price, is_paid, purchase_type, created_at, exercises(id, name, sets, reps, instructions, video_url, variations)',
      )
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      logger.error('Error fetching trainer workouts', error)
      throw error
    }

    // Fetch trainer name separately
    const { data: trainer } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', trainerId)
      .single()

    return {
      data: (data || []).map((w: any) => ({
        ...mapWorkoutData(w),
        trainerName: trainer?.full_name || trainer?.username || 'Trainer',
      })),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    }
  },

  /**
   * Fetch single workout by ID (otimizado)
   */
  async fetchWorkoutById(id: string): Promise<Workout | null> {
    const { data, error } = await supabase
      .from('workouts')
      .select(
        'id, trainer_id, title, description, image, duration, difficulty, category, status, is_circuit, price, is_paid, purchase_type, created_at, exercises(id, name, sets, reps, instructions, video_url, variations)',
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      logger.error('Error fetching workout', error)
      throw error
    }

    if (!data) return null

    // Fetch trainer name separately
    const { data: trainer } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', data.trainer_id)
      .single()

    return {
      ...mapWorkoutData(data),
      trainerName: trainer?.full_name || trainer?.username || 'Trainer',
    }
  },

  async createWorkout(
    workout: Omit<Workout, 'id' | 'createdAt' | 'trainerName'>,
  ) {
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        trainer_id: workout.trainerId,
        title: workout.title,
        description: workout.description,
        image: workout.image,
        duration: workout.duration,
        difficulty: workout.difficulty,
        category: workout.category,
        status: workout.status,
        is_circuit: workout.isCircuit,
        price: workout.price || 0,
        is_paid: workout.isPaid || false,
        purchase_type: workout.purchaseType || 'free',
      })
      .select()
      .single()

    if (workoutError) throw workoutError

    if (workout.exercises.length > 0) {
      const exercisesToInsert = workout.exercises.map((e) => ({
        workout_id: workoutData.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        instructions: e.instructions,
        video_url: e.videoUrl,
        variations: e.variations,
      }))

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert)

      if (exercisesError) throw exercisesError
    }

    return workoutData
  },

  async deleteWorkout(id: string) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Fetch all reviews (legacy method - mantido para compatibilidade)
   * @deprecated Use fetchReviewsPaginated for better performance
   */
  async fetchReviews(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) // Limite de segurança

    if (error) {
      logger.error('Error fetching reviews', error)
      throw error
    }

    // Fetch user profiles separately
    const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))]
    const userMap = new Map<string, { name: string; avatar: string }>()
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      if (users) {
        users.forEach((u: any) => {
          userMap.set(u.id, {
            name: u.full_name || 'User',
            avatar: u.avatar_url || '',
          })
        })
      }
    }

    return (data || []).map((r: any) => {
      const user = userMap.get(r.user_id)
      return {
        id: r.id,
        workoutId: r.workout_id,
        userId: r.user_id,
        userName: user?.name || 'User',
        userAvatar: user?.avatar || '',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      }
    }) as Review[]
  },

  /**
   * Fetch reviews with pagination (NOVO - otimizado)
   */
  async fetchReviewsPaginated(
    workoutId?: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Review>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('reviews')
      .select('id, workout_id, user_id, rating, comment, created_at', {
        count: 'exact',
      })

    if (workoutId) {
      query = query.eq('workout_id', workoutId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      logger.error('Error fetching reviews', error)
      throw error
    }

    // Fetch user profiles separately
    const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))]
    const userMap = new Map<string, { name: string; avatar: string }>()
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      if (users) {
        users.forEach((u: any) => {
          userMap.set(u.id, {
            name: u.full_name || 'User',
            avatar: u.avatar_url || '',
          })
        })
      }
    }

    const reviews = (data || []).map((r: any) => {
      const user = userMap.get(r.user_id)
      return {
        id: r.id,
        workoutId: r.workout_id,
        userId: r.user_id,
        userName: user?.name || 'User',
        userAvatar: user?.avatar || '',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      }
    }) as Review[]

    return {
      data: reviews,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    }
  },

  async addReview(review: Omit<Review, 'id' | 'createdAt'>) {
    const { error } = await supabase.from('reviews').insert({
      workout_id: review.workoutId,
      user_id: review.userId,
      rating: review.rating,
      comment: review.comment,
    })
    if (error) throw error
  },
}
