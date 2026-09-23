import { supabase } from '../lib/supabase'

export interface NotificationRow {
  id: string
  hospital_id?: string | null
  user_id?: string | null
  appointment_id?: string | null
  title: string
  message: string
  type: string
  category?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  link?: string | null
  metadata?: any
  created_at: string
  is_read: boolean
}

function formatNotificationRow(item: any): NotificationRow {
  const type = item.type || 'info'
  let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  if (type === 'urgent' || item.priority === 'urgent' || /urgent|emergency|critical/i.test(item.title || '')) {
    priority = 'urgent'
  } else if (type === 'warning' || item.priority === 'high' || /delay|alert/i.test(item.title || '')) {
    priority = 'high'
  }

  return {
    id: item.id,
    hospital_id: item.hospital_id || null,
    user_id: item.user_id || null,
    appointment_id: item.appointment_id || null,
    title: item.title || 'Notification Alert',
    message: item.message || '',
    type,
    category: item.category || type || 'system',
    priority,
    link: item.link || null,
    metadata: item.metadata || {},
    created_at: item.created_at || new Date().toISOString(),
    is_read: Boolean(item.is_read),
  }
}

/**
 * Fetch notifications from public.notifications table.
 * Supports hospital and user level filtering with safe RLS fallback.
 */
export async function fetchNotifications(userId?: string, hospitalId?: string): Promise<NotificationRow[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (hospitalId && userId) {
      query = query.or(`hospital_id.eq.${hospitalId},user_id.eq.${userId}`)
    } else if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.warn('fetchNotifications error, attempting general select:', error.message)
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fallbackErr) {
        console.warn('fetchNotifications fallback error:', fallbackErr.message)
        return []
      }
      return (fallbackData || []).map(formatNotificationRow)
    }

    return (data || []).map(formatNotificationRow)
  } catch (err) {
    console.warn('Exception in fetchNotifications:', err)
    return []
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    if (error) console.warn('markNotificationRead error:', error.message)
  } catch (err) {
    console.warn('Error marking notification read:', err)
  }
}

export async function markAllRead(notificationIds: string[]) {
  if (!notificationIds || notificationIds.length === 0) return
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
    if (error) console.warn('markAllRead error:', error.message)
  } catch (err) {
    console.warn('Error marking all notifications read:', err)
  }
}

export async function archiveNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    if (error) {
      // If DELETE is restricted by RLS policy, mark as read
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    }
  } catch (err) {
    console.warn('Error archiving notification:', err)
  }
}
