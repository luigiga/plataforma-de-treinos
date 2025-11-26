import { supabase } from '@/lib/supabase/client'
import { Notification } from '@/context/DataContext'

export const notificationService = {
  async fetchNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      message: n.content,
      read: !!n.read_at,
      createdAt: n.created_at,
      link: n.link,
      type: n.type as
        | 'info'
        | 'success'
        | 'warning'
        | 'new_follower'
        | 'workout_assignment',
    })) as Notification[]
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  async create(
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'> & {
      userId: string
    },
  ) {
    const { error } = await supabase.from('notifications').insert({
      user_id: notification.userId,
      content: notification.message,
      type: notification.type,
      link: notification.link,
    })

    if (error) throw error
  },
}
