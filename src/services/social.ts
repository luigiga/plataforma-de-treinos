import { supabase } from '@/lib/supabase/client'
import { PublicUser } from '@/context/DataContext'

export interface FollowRelation {
  followerId: string
  followingId: string
  status: 'pending' | 'accepted'
}

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

export const socialService = {
  /**
   * Search users (legacy method - mantido para compatibilidade)
   * @deprecated Use searchUsersPaginated for better performance
   */
  async searchUsers(query: string) {
    const result = await this.searchUsersPaginated(query, { page: 1, pageSize: 20 })
    return result.data
  },

  /**
   * Search users with pagination (NOVO - otimizado)
   */
  async searchUsersPaginated(
    query: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<PublicUser>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    // Get total count
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or(
        `username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`,
      )

    if (countError) throw countError

    // Fetch paginated data
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, role, avatar_url, bio, metadata')
      .or(
        `username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`,
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return {
      data: (data || []).map((p: any) => ({
        id: p.id,
        username: p.username || '',
        name: p.full_name || p.username,
        role: p.role,
        avatar: p.avatar_url,
        bio: p.bio,
        socialLinks: p.metadata?.socialLinks,
      })) as PublicUser[],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    }
  },

  /**
   * Fetch all follows (legacy method - mantido para compatibilidade)
   * @deprecated Use fetchFollowsPaginated for better performance
   */
  async fetchFollows(): Promise<FollowRelation[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, following_id, status')
      .limit(500) // Limite de segurança

    if (error) throw error
    return (data || []).map((f: any) => ({
      followerId: f.follower_id,
      followingId: f.following_id,
      status: f.status || 'accepted',
    }))
  },

  /**
   * Fetch follows with pagination (NOVO - otimizado)
   */
  async fetchFollowsPaginated(
    userId?: string,
    type: 'followers' | 'following' | 'all' = 'all',
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<FollowRelation>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const offset = (page - 1) * pageSize

    let query = supabase.from('follows').select('follower_id, following_id, status', {
      count: 'exact',
    })

    if (userId) {
      if (type === 'followers') {
        query = query.eq('following_id', userId)
      } else if (type === 'following') {
        query = query.eq('follower_id', userId)
      }
    }

    const { count, error: countError } = await query

    if (countError) throw countError

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return {
      data: (data || []).map((f: any) => ({
        followerId: f.follower_id,
        followingId: f.following_id,
        status: f.status || 'accepted',
      })),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    }
  },

  async follow(followerId: string, followingId: string) {
    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
      status: 'pending',
    })
    if (error) throw error
  },

  async unfollow(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId })
    if (error) throw error
  },

  async acceptFollow(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .match({ follower_id: followerId, following_id: followingId })
    if (error) throw error
  },

  async rejectFollow(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId })
    if (error) throw error
  },
}
