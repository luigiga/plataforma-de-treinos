import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase/types'

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
