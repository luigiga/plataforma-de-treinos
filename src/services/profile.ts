import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase/types'
import type { User } from '@/context/AuthContext'
import { USE_MOCKS } from '@/lib/config'
import { mockStore } from '@/mocks/store'
import { userToProfile } from '@/mocks/profile-mapper'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

type ProfileFilters = {
  page?: number
  pageSize?: number
  role?: string
  status?: string
  search?: string
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (USE_MOCKS) {
      const user = mockStore.getUserById(userId)
      return user ? userToProfile(user) : null
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, email, role, bio, metadata, status, created_at',
        )
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        logger.error('Error fetching profile', {
          error,
          userId,
          code: error.code,
          message: error.message,
        })

        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          logger.warn('Received maybeSingle fallback scenario, trying limit(1)', {
            userId,
          })

          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select(
              'id, username, full_name, avatar_url, email, role, bio, metadata, status, created_at',
            )
            .eq('id', userId)
            .limit(1)

          if (fallbackError) {
            logger.error('Fallback profile query also failed', fallbackError)
            return null
          }

          return fallbackData?.[0] || null
        }

        return null
      }

      if (!data) {
        logger.warn('Profile not found for user', userId)
        return null
      }

      return data
    } catch (error) {
      logger.error('Unexpected error fetching profile', error)
      return null
    }
  },

  async getAllProfiles(): Promise<Profile[]> {
    const result = await this.getAllProfilesPaginated({ page: 1, pageSize: 1000 })
    return result.data
  },

  async getAllProfilesPaginated(params: ProfileFilters = {}) {
    if (USE_MOCKS) {
      const result = mockStore.listProfiles(params)
      return {
        ...result,
        data: result.data.map(userToProfile),
      }
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const offset = (page - 1) * pageSize

    try {
      let countQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      let dataQuery = supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, email, role, bio, metadata, status, created_at',
        )
        .order('created_at', { ascending: false })

      if (params.role) {
        countQuery = countQuery.eq('role', params.role)
        dataQuery = dataQuery.eq('role', params.role)
      }

      if (params.status) {
        countQuery = countQuery.eq('status', params.status)
        dataQuery = dataQuery.eq('status', params.status)
      }

      if (params.search) {
        const searchFilter = `username.ilike.%${params.search}%,full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
        countQuery = countQuery.or(searchFilter)
        dataQuery = dataQuery.or(searchFilter)
      }

      const { count, error: countError } = await countQuery
      if (countError) {
        logger.error('Error counting profiles', countError)
        throw countError
      }

      const { data, error } = await dataQuery.range(offset, offset + pageSize - 1)
      if (error) {
        logger.error('Error fetching all profiles', error)
        throw error
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > offset + pageSize,
      }
    } catch (error) {
      logger.error('Unexpected error fetching all profiles', error)
      return {
        data: [] as Profile[],
        total: 0,
        page: 1,
        pageSize,
        hasMore: false,
      }
    }
  },

  async updateProfile(userId: string, updates: ProfileUpdate) {
    if (USE_MOCKS) {
      const metadata = (updates.metadata || {}) as Record<string, unknown>
      mockStore.updateUser(userId, {
        full_name: updates.full_name ?? undefined,
        username: updates.username ?? undefined,
        bio: updates.bio ?? undefined,
        avatar: updates.avatar_url ?? undefined,
        status: (updates.status as User['status']) ?? undefined,
        socialLinks: metadata.socialLinks as User['socialLinks'],
        preferences: metadata.preferences as User['preferences'],
        notificationPreferences:
          metadata.notificationPreferences as User['notificationPreferences'],
        subscriptionStatus:
          metadata.subscriptionStatus as User['subscriptionStatus'],
        plan: metadata.plan as User['plan'],
        points: metadata.points as number | undefined,
        badges: metadata.badges as string[] | undefined,
      })
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) {
        logger.error('Error updating profile', error)
        throw error
      }
    } catch (error) {
      logger.error('Unexpected error updating profile', error)
      throw error
    }
  },

  async createProfile(payload: ProfileInsert) {
    if (USE_MOCKS) {
      // Cadastro mock já cria o usuário no AuthProvider.
      return
    }

    try {
      const { error } = await supabase.from('profiles').insert(payload)

      if (error) {
        logger.error('Error creating profile', error)
        throw error
      }
    } catch (error) {
      logger.error('Unexpected error creating profile', error)
      throw error
    }
  },

  async deleteProfile(userId: string) {
    if (USE_MOCKS) {
      mockStore.deleteUser(userId)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      if (error) {
        logger.error('Error deleting profile', error)
        throw error
      }
    } catch (error) {
      logger.error('Unexpected error deleting profile', error)
      throw error
    }
  },

  async checkUsernameAvailability(username: string) {
    if (USE_MOCKS) {
      return mockStore.isUsernameAvailable(username)
    }

    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('username', { count: 'exact', head: true })
        .eq('username', username)

      if (error) {
        logger.error('Error checking username availability', error)
        return false
      }
      return count === 0
    } catch (error) {
      logger.error('Unexpected error checking username availability', error)
      return false
    }
  },
}
