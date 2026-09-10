import { supabase } from '../lib/supabase'

export interface ChatConversation {
  id: string
  hospital_id: string
  type: 'direct' | 'group'
  name: string | null
  created_by: string
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
}

export interface ChatMember {
  id: string
  conversation_id: string
  user_id: string
  role: 'owner' | 'member'
  is_muted: boolean
  last_read_at: string | null
  profile?: { id: string; full_name: string; role: string; department: string | null }
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  body: string | null
  reply_to_id: string | null
  is_deleted: boolean
  created_at: string
  edited_at: string | null
  sender?: { id: string; full_name: string }
  attachments?: { id: string; file_url: string; file_name: string; file_type: string | null }[]
}

/** All conversations the current user belongs to, most recent first. */
export async function listConversations(): Promise<(ChatConversation & { members: ChatMember[] })[]> {
  const { data: memberRows, error: memberErr } = await supabase
    .from('chat_members')
    .select('conversation_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
  if (memberErr || !memberRows?.length) return []

  const convIds = memberRows.map((m) => m.conversation_id)
  const { data: convs, error } = await supabase
    .from('chat_conversations')
    .select('*, members:chat_members(id, conversation_id, user_id, role, is_muted, last_read_at, profile:profiles(id, full_name, role, department))')
    .in('id', convIds)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.warn('listConversations error:', error.message)
    return []
  }
  return (convs || []) as any
}

export async function listDoctorsForChat(hospitalId: string, excludeSelf: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, department, is_active')
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .neq('id', excludeSelf)
    .in('role', ['doctor', 'hospital_admin', 'staff'])
    .order('full_name', { ascending: true })
  return data || []
}

export async function getOrCreateDirectConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_other_user_id: otherUserId })
  if (error) throw new Error(error.message)
  return data as string
}

export async function createGroupConversation(name: string, memberIds: string[]): Promise<string> {
  const { data, error } = await supabase.rpc('create_group_conversation', { p_name: name, p_member_ids: memberIds })
  if (error) throw new Error(error.message)
  return data as string
}

export async function fetchMessages(conversationId: string, limit = 60): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles(id, full_name), attachments:chat_message_attachments(id, file_url, file_name, file_type)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) {
    console.warn('fetchMessages error:', error.message)
    return []
  }
  return (data || []) as any
}

export async function sendMessage(conversationId: string, senderId: string, body: string, replyToId?: string | null) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim(), reply_to_id: replyToId || null })
    .select('*, sender:profiles(id, full_name)')
    .single()
  if (error) throw new Error(error.message)
  return data as ChatMessage
}

export async function softDeleteMessage(messageId: string) {
  const { error } = await supabase.from('chat_messages').update({ body: null, is_deleted: true }).eq('id', messageId)
  if (error) throw new Error(error.message)
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from('chat_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
}

export async function setConversationMuted(conversationId: string, userId: string, muted: boolean) {
  await supabase.from('chat_members').update({ is_muted: muted }).eq('conversation_id', conversationId).eq('user_id', userId)
}

export async function addGroupMembers(conversationId: string, userIds: string[]) {
  const rows = userIds.map((uid) => ({ conversation_id: conversationId, user_id: uid, role: 'member' as const }))
  const { error } = await supabase.from('chat_members').insert(rows)
  if (error) throw new Error(error.message)
}

export async function removeGroupMember(conversationId: string, userId: string) {
  const { error } = await supabase.from('chat_members').delete().eq('conversation_id', conversationId).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function uploadChatAttachment(conversationId: string, file: File) {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${conversationId}/${Date.now()}_${cleanName}`
  const { error: uploadErr } = await supabase.storage.from('chat-attachments').upload(path, file, { upsert: false })
  if (uploadErr) throw new Error(uploadErr.message)

  const { data: signedData } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 60 * 60 * 24 * 7)
  return {
    file_url: signedData?.signedUrl || path,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_path: path,
  }
}

export async function attachToMessage(messageId: string, attachment: { file_url: string; file_name: string; file_type: string; file_size: number }) {
  const { error } = await supabase.from('chat_message_attachments').insert({ message_id: messageId, ...attachment })
  if (error) throw new Error(error.message)
}
