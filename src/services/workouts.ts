import { supabase } from '@/lib/supabase/client'
import { Workout, Exercise, Review } from '@/context/DataContext'

export const workoutService = {
  async fetchWorkouts() {
    const { data, error } = await supabase
      .from('workouts')
      .select('*, profiles:trainer_id(full_name, username), exercises(*)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((w: any) => ({
      id: w.id,
      trainerId: w.trainer_id,
      trainerName: w.profiles?.full_name || w.profiles?.username || 'Trainer',
      title: w.title,
      description: w.description,
      image: w.image,
      duration: w.duration,
      difficulty: w.difficulty,
      category: w.category || [],
      status: w.status,
      createdAt: w.created_at,
      isCircuit: w.is_circuit,
      exercises: w.exercises.map((e: any) => ({
        id: e.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        instructions: e.instructions,
        videoUrl: e.video_url,
        variations: e.variations,
      })),
    })) as Workout[]
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

  async fetchReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((r: any) => ({
      id: r.id,
      workoutId: r.workout_id,
      userId: r.user_id,
      userName: r.profiles?.full_name || 'User',
      userAvatar: r.profiles?.avatar_url || '',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })) as Review[]
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
