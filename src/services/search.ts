import { supabase } from '@/lib/supabase/client'

export interface SearchResult {
  id: string
  type: 'profile' | 'workout' | 'exercise'
  title: string
  subtitle?: string
  image?: string
  url: string
}

export const searchService = {
  async searchGlobal(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const results: SearchResult[] = []

    // Search Profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(5)

    if (profiles) {
      results.push(
        ...profiles.map((p) => ({
          id: p.id,
          type: 'profile' as const,
          title: p.full_name || p.username || 'Usuário',
          subtitle: `@${p.username}`,
          image: p.avatar_url,
          url: `/profile/${p.username}`,
        })),
      )
    }

    // Search Workouts
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, title, description, image, category, difficulty')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5)

    if (workouts) {
      results.push(
        ...workouts.map((w) => ({
          id: w.id,
          type: 'workout' as const,
          title: w.title,
          subtitle: `${w.difficulty} • ${w.category?.join(', ')}`,
          image: w.image,
          url: `/workout/${w.id}`,
        })),
      )
    }

    // Search Exercises
    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, name, instructions, workout_id')
      .or(`name.ilike.%${query}%,instructions.ilike.%${query}%`)
      .limit(5)

    if (exercises) {
      results.push(
        ...exercises.map((e) => ({
          id: e.id,
          type: 'exercise' as const,
          title: e.name,
          subtitle: 'Exercício',
          url: `/workout/${e.workout_id}`,
        })),
      )
    }

    return results
  },
}
