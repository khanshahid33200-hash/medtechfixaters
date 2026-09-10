import { supabase } from '../lib/supabase'

export interface NotificationRow {
  id: string
  audience: 'platform_all' | 'hospital_admins' | 'hospital_all' | 'specific_user'
  hospital_id: string | null
  recipient_id: string | null
  sender_id: string | null
  title: string
  message: string
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  is_read: boolean
  is_archived: boolean
}

/**
 * Every notification this user is entitled to see, per the RLS policy
 * (platform_all, or hospital_admins/hospital_all scoped to their hospital,
 * or specific_user addressed to them) — left-joined with their own receipt
 * row so unread/archived state is per-viewer, not shared.
 */
export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data: notifs, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) {
    console.warn('fetchNotifications error:', error.message)
    return []
  }
  const { data: receipts } = await supabase
    .from('notification_receipts')
    .select('notification_id, is_read, is_archived')
    .eq('user_id', userId)

  const receiptMap = new Map((receipts || []).map((r) => [r.notification_id, r]))
  return (notifs || [])
    .map((n) => ({
      ...n,
      is_read: receiptMap.get(n.id)?.is_read || false,
      is_archived: receiptMap.get(n.id)?.is_archived || false,
    }))
    .filter((n) => !n.is_archived) as NotificationRow[]
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notification_receipts')
    .upsert({ notification_id: notificationId, user_id: userId, is_read: true, read_at: new Date().toISOString() }, { onConflict: 'notification_id,user_id' })
  if (error) throw new Error(error.message)
}

export async function markAllRead(notificationIds: string[], userId: string) {
  const rows = notificationIds.map((id) => ({ notification_id: id, user_id: userId, is_read: true, read_at: new Date().toISOString() }))
  const { error } = await supabase.from('notification_receipts').upsert(rows, { onConflict: 'notification_id,user_id' })
  if (error) throw new Error(error.message)
}

export async function archiveNotification(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notification_receipts')
    .upsert({ notification_id: notificationId, user_id: userId, is_archived: true }, { onConflict: 'notification_id,user_id' })
  if (error) throw new Error(error.message)
}
