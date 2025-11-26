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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('Error fetching profile', error)
        return null
      }
      return data as Profile
    } catch (error) {
      logger.error('Unexpected error fetching profile', error)
      return null
    }
  },

  async getAllProfiles() {
    try {
      const { data, error } = await supabase.from('profiles').select('*')
      if (error) {
        logger.error('Error fetching all profiles', error)
        return []
      }
      return data as Profile[]
    } catch (error) {
      logger.error('Unexpected error fetching all profiles', error)
      return []
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
