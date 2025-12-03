import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase/types'

// Extend the type to include the new status column which might not be in types.ts yet
type Profile = Database['public']['Tables']['profiles']['Row'] & {
  status?: string
}

export const profileService = {
  async getProfile(userId: string) {
    try {
      // Usar maybeSingle() em vez de single() para evitar erro se não existir
      // Especificar campos explicitamente para evitar problemas com select=*
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
          status: (error as any).status,
          details: (error as any).details,
          hint: (error as any).hint,
        })

        // Se for erro 406 (Not Acceptable), pode ser problema com o formato da resposta
        // Tentar uma abordagem diferente usando limit(1) em vez de maybeSingle
        if (
          error.code === 'PGRST116' ||
          (error as any).status === 406 ||
          error.message?.includes('406')
        ) {
          logger.warn('Received 406 error, trying alternative query', userId)

          // Tentar com limit(1) em vez de maybeSingle
          const { data: altData, error: altError } = await supabase
            .from('profiles')
            .select(
              'id, username, full_name, avatar_url, email, role, bio, metadata, status, created_at',
            )
            .eq('id', userId)
            .limit(1)

          if (altError) {
            logger.error('Alternative query also failed', altError)
            return null
          }

          return altData && altData.length > 0 ? (altData[0] as Profile) : null
        }

        return null
      }

      // Se não encontrou o perfil, pode ser que ainda não foi criado
      if (!data) {
        logger.warn('Profile not found for user', userId)
        return null
      }

      return data as Profile
    } catch (error) {
      logger.error('Unexpected error fetching profile', error)
      return null
    }
  },

  /**
   * Get all profiles (legacy method - mantido para compatibilidade)
   * @deprecated Use getAllProfilesPaginated for better performance
   */
  async getAllProfiles() {
    const result = await this.getAllProfilesPaginated({ page: 1, pageSize: 1000 })
    return result.data
  },

  /**
   * Get all profiles with pagination (NOVO - otimizado)
   */
  async getAllProfilesPaginated(params: { page?: number; pageSize?: number; role?: string; status?: string; search?: string } = {}) {
    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const offset = (page - 1) * pageSize

    try {
      // Build query
      let countQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      let dataQuery = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email, role, bio, metadata, status, created_at')
        .order('created_at', { ascending: false })

      // Apply filters
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

      // Get count
      const { count, error: countError } = await countQuery
      if (countError) {
        logger.error('Error counting profiles', countError)
        throw countError
      }

      // Get paginated data
      const { data, error } = await dataQuery.range(offset, offset + pageSize - 1)

      if (error) {
        logger.error('Error fetching all profiles', error)
        throw error
      }

      return {
        data: (data || []) as Profile[],
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > offset + pageSize,
      }
    } catch (error) {
      logger.error('Unexpected error fetching all profiles', error)
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize,
        hasMore: false,
      }
    }
  },

  async updateProfile(userId: string, updates: any) {
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
