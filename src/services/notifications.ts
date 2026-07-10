import { supabase } from '@/lib/supabase/client'
import { Notification } from '@/context/DataContext'
import { USE_MOCKS } from '@/lib/config'
import { mockStore } from '@/mocks/store'

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

const mapNotification = (n: any): Notification => ({
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
})

export const notificationService = {
  /**
   * Fetch all notifications (legacy method - mantido para compatibilidade)
   * @deprecated Use fetchNotificationsPaginated for better performance
   */
  async fetchNotifications(userId: string): Promise<Notification[]> {
    if (USE_MOCKS) {
      return mockStore.listNotifications(userId, 1, 50).data
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50) // Limite de segurança

    if (error) throw error
    return (data || []).map(mapNotification)
  },

  /**
   * Fetch notifications with pagination (NOVO - otimizado)
   */
  async fetchNotificationsPaginated(
    userId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Notification>> {
    if (USE_MOCKS) {
      return mockStore.listNotifications(
        userId,
        params.page || 1,
        params.pageSize || 20,
      )
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) throw countError

    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, content, read_at, created_at, link, type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return {
      data: (data || []).map(mapNotification),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    }
  },

  /**
   * Fetch unread notifications count (otimizado)
   */
  async fetchUnreadCount(userId: string): Promise<number> {
    if (USE_MOCKS) {
      return mockStore
        .listNotifications(userId, 1, 1000)
        .data.filter((item) => !item.read).length
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) throw error
    return count || 0
  },

  async markAsRead(id: string) {
    if (USE_MOCKS) {
      mockStore.markNotificationRead(id)
      return
    }

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
    if (USE_MOCKS) {
      mockStore.addNotification(notification)
      return
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: notification.userId,
      content: notification.message,
      type: notification.type,
      link: notification.link,
    })

    if (error) throw error
  },
}
