import { supabase } from '@/lib/supabase/client'
import { PublicUser } from '@/context/DataContext'
import { USE_MOCKS } from '@/lib/config'
import { mockStore } from '@/mocks/store'

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
    if (USE_MOCKS) {
      return mockStore.searchUsers(query)
    }
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
    if (USE_MOCKS) {
      const all = mockStore.searchUsers(query)
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const start = (page - 1) * pageSize
      const data = all.slice(start, start + pageSize)
      return {
        data,
        total: all.length,
        page,
        pageSize,
        hasMore: start + pageSize < all.length,
      }
    }

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
    if (USE_MOCKS) {
      return mockStore.listFollows()
    }

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

    if (USE_MOCKS) {
      let items = mockStore.listFollows()
      if (userId) {
        if (type === 'followers') {
          items = items.filter((item) => item.followingId === userId)
        } else if (type === 'following') {
          items = items.filter((item) => item.followerId === userId)
        }
      }
      const data = items.slice(offset, offset + pageSize)
      return {
        data,
        total: items.length,
        page,
        pageSize,
        hasMore: offset + pageSize < items.length,
      }
    }

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
    if (USE_MOCKS) {
      mockStore.follow(followerId, followingId)
      return
    }

    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
      status: 'pending',
    })
    if (error) throw error
  },

  async unfollow(followerId: string, followingId: string) {
    if (USE_MOCKS) {
      mockStore.unfollow(followerId, followingId)
      return
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId })
    if (error) throw error
  },

  async acceptFollow(followerId: string, followingId: string) {
    if (USE_MOCKS) {
      mockStore.acceptFollow(followerId, followingId)
      return
    }

    const { error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .match({ follower_id: followerId, following_id: followingId })
    if (error) throw error
  },

  async rejectFollow(followerId: string, followingId: string) {
    if (USE_MOCKS) {
      mockStore.rejectFollow(followerId, followingId)
      return
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId })
    if (error) throw error
  },
}
