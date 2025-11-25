import { supabase } from '@/lib/supabase/client'
import { PublicUser } from '@/context/DataContext'

export interface FollowRelation {
  followerId: string
  followingId: string
  status: 'pending' | 'accepted'
}

export const socialService = {
  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(
        `username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`,
      )
      .limit(20)

    if (error) throw error

    return data.map((p: any) => ({
      id: p.id,
      username: p.username || '',
      name: p.full_name || p.username,
      role: p.role,
      avatar: p.avatar_url,
      bio: p.bio,
      socialLinks: p.metadata?.socialLinks,
    })) as PublicUser[]
  },

  async fetchFollows() {
    const { data, error } = await supabase.from('follows').select('*')
    if (error) throw error
    return data.map((f: any) => ({
      followerId: f.follower_id,
      followingId: f.following_id,
      status: f.status || 'accepted', // Fallback for old data
    })) as FollowRelation[]
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
