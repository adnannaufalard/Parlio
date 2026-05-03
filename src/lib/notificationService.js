import { supabase } from './supabaseClient'

export const NotificationService = {
  /**
   * Create a new notification for a user
   * @param {Object} params
   * @param {string} params.userId - User ID receiving the notification
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {string} [params.type='info'] - Type: 'info', 'success', 'warning', 'achievement', 'forum'
   * @param {string} [params.link] - Optional link to navigate when clicked
   */
  createNotification: async ({ userId, title, message, type = 'info', link = null }) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          link
        }])
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      return false
    }
  },

  /**
   * Get notifications for the current user
   */
  getNotifications: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      const { count, error } = await supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  },
  
  /**
   * Mark all as read
   */
  markAllAsRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking all as read:', error)
      return false
    }
  }
}

export default NotificationService
