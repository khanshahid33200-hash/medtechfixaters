import { useCallback, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  ChatConversation,
  ChatMember,
  ChatMessage,
  fetchMessages,
  listConversations,
  markConversationRead,
} from '../services/chatService'

type ConversationWithMembers = ChatConversation & { members: ChatMember[] }

/** Hospital-wide presence: who is online right now. Keyed by user_id. */
export function usePresence(hospitalId: string | null | undefined, myUserId: string | null | undefined) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!hospitalId || !myUserId) return
    const channel = supabase.channel(`presence:hospital:${hospitalId}`, {
      config: { presence: { key: myUserId } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineIds(new Set(Object.keys(state)))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [hospitalId, myUserId])

  return onlineIds
}

export function useConversationList(myUserId: string | null | undefined) {
  const [conversations, setConversations] = useState<ConversationWithMembers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await listConversations()
    setConversations(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!myUserId) {
      setIsLoading(false)
      return
    }
    refresh()

    // Any new/updated conversation touching this hospital re-triggers a
    // refresh — cheap given conversation lists are small, and simpler/safer
    // than trying to patch the RLS-filtered list client-side per event.
    const channel = supabase
      .channel(`chat-conversations:${myUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members', filter: `user_id=eq.${myUserId}` }, () => refresh())
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [myUserId, refresh])

  return { conversations, isLoading, refresh }
}

interface TypingState {
  [userId: string]: { name: string; at: number }
}

export function useConversationThread(conversationId: string | null, myUserId: string | null | undefined, myName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typing, setTyping] = useState<TypingState>({})
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    fetchMessages(conversationId).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs)
        setIsLoading(false)
        if (myUserId) markConversationRead(conversationId, myUserId)
      }
    })

    const channel = supabase
      .channel(`chat-thread:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const row = payload.new as ChatMessage
          // Re-fetch just this one row with its joins rather than trusting the
          // bare payload, so sender name/attachments are populated instantly.
          const { data } = await supabase
            .from('chat_messages')
            .select('*, sender:profiles(id, full_name), attachments:chat_message_attachments(id, file_url, file_name, file_type)')
            .eq('id', row.id)
            .single()
          if (data) {
            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as any]))
            if (myUserId && row.sender_id !== myUserId) markConversationRead(conversationId, myUserId)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as ChatMessage
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)))
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, name } = payload.payload as { userId: string; name: string }
        if (userId === myUserId) return
        setTyping((prev) => ({ ...prev, [userId]: { name, at: Date.now() } }))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      cancelled = true
      channel.unsubscribe()
    }
  }, [conversationId, myUserId])

  // Expire stale typing indicators after 3s of silence
  useEffect(() => {
    const t = setInterval(() => {
      setTyping((prev) => {
        const now = Date.now()
        const next: TypingState = {}
        let changed = false
        for (const [uid, v] of Object.entries(prev)) {
          if (now - v.at < 3000) next[uid] = v
          else changed = true
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const broadcastTyping = useCallback(() => {
    if (!myUserId) return
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: myUserId, name: myName } })
  }, [myUserId, myName])

  return { messages, setMessages, isLoading, typingUsers: Object.values(typing).map((t) => t.name), broadcastTyping }
}
