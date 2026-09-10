import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Users as UsersIcon,
  UserPlus,
  X,
  Trash2,
  BellOff,
  Bell,
  Check,
  CheckCheck,
  Circle,
  FileText,
  Image as ImageIcon,
  Plus,
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useConversationList, useConversationThread, usePresence } from '../../hooks/useChat'
import {
  listDoctorsForChat,
  getOrCreateDirectConversation,
  createGroupConversation,
  sendMessage,
  softDeleteMessage,
  setConversationMuted,
  uploadChatAttachment,
  attachToMessage,
} from '../../services/chatService'

export default function HospitalChatPage() {
  const { currentUser, doctorProfile } = useAuth()
  const myUserId = currentUser?.id || null
  const myName = doctorProfile?.name || currentUser?.email || 'You'
  const hospitalId = doctorProfile?.hospital_id || null

  const { conversations, isLoading: convsLoading, refresh } = useConversationList(myUserId)
  const onlineIds = usePresence(hospitalId, myUserId)

  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [doctors, setDoctors] = useState<{ id: string; full_name: string; role: string; department: string | null }[]>([])
  const [newChatMode, setNewChatMode] = useState<'direct' | 'group'>('direct')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  const { messages, isLoading: msgsLoading, typingUsers, broadcastTyping } = useConversationThread(activeConvId, myUserId, myName)

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeConvId && conversations.length > 0) setActiveConvId(conversations[0].id)
  }, [conversations, activeConvId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!hospitalId || !myUserId) return
    listDoctorsForChat(hospitalId, myUserId).then(setDoctors)
  }, [hospitalId, myUserId])

  const activeConv = conversations.find((c) => c.id === activeConvId)

  const conversationLabel = (c: (typeof conversations)[number]) => {
    if (c.type === 'group') return c.name || 'Group Chat'
    const other = c.members.find((m) => m.user_id !== myUserId)
    return other?.profile?.full_name || 'Direct Message'
  }

  const otherMemberOnline = (c: (typeof conversations)[number]) => {
    if (c.type !== 'direct') return false
    const other = c.members.find((m) => m.user_id !== myUserId)
    return other ? onlineIds.has(other.user_id) : false
  }

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c) => conversationLabel(c).toLowerCase().includes(q))
  }, [conversations, search])

  const filteredDoctors = useMemo(
    () => doctors.filter((d) => d.full_name.toLowerCase().includes(search.toLowerCase())),
    [doctors, search]
  )

  const handleSend = async () => {
    if (!draft.trim() || !activeConvId || !myUserId) return
    setSending(true)
    try {
      await sendMessage(activeConvId, myUserId, draft)
      setDraft('')
    } catch (e: any) {
      alert(`Message could not be sent: ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !activeConvId || !myUserId) return
    setSending(true)
    try {
      const uploaded = await uploadChatAttachment(activeConvId, file)
      const msg = await sendMessage(activeConvId, myUserId, `📎 ${file.name}`)
      await attachToMessage(msg.id, uploaded)
    } catch (e: any) {
      alert(`Attachment upload failed: ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  const handleCreateChat = async () => {
    if (selectedMembers.length === 0) return
    setCreating(true)
    try {
      let convId: string
      if (newChatMode === 'direct') {
        convId = await getOrCreateDirectConversation(selectedMembers[0])
      } else {
        convId = await createGroupConversation(groupName || 'New Group', selectedMembers)
      }
      await refresh()
      setActiveConvId(convId)
      setShowNewChat(false)
      setSelectedMembers([])
      setGroupName('')
    } catch (e: any) {
      alert(`Could not start chat: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleMute = async () => {
    if (!activeConvId || !myUserId || !activeConv) return
    const myMembership = activeConv.members.find((m) => m.user_id === myUserId)
    await setConversationMuted(activeConvId, myUserId, !myMembership?.is_muted)
    refresh()
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message for everyone?')) return
    await softDeleteMessage(messageId)
    setMenuOpenFor(null)
  }

  return (
    <HospitalDashboardLayout pageTitle="Doctor Communication">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[500px]">
        {/* ─── CONVERSATION LIST ─── */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white/70 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Conversations</h3>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => { setShowNewChat(true); setNewChatMode('direct'); setSelectedMembers([]) }}
                className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm"
                title="New conversation"
              >
                <Plus size={16} />
              </motion.button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors or chats..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading conversations…</div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center">
                <UsersIcon size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">No conversations yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Start a chat with a registered doctor.</p>
              </div>
            ) : (
              filteredConvs.map((c) => {
                const unread = c.members.find((m) => m.user_id === myUserId)
                const isUnread =
                  c.last_message_at && unread?.last_read_at && new Date(c.last_message_at) > new Date(unread.last_read_at)
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-slate-50 transition ${
                      activeConvId === c.id ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 text-white flex items-center justify-center text-xs font-bold">
                        {c.type === 'group' ? <UsersIcon size={16} /> : conversationLabel(c)[0]?.toUpperCase()}
                      </div>
                      {otherMemberOnline(c) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate ${isUnread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {conversationLabel(c)}
                        </span>
                        {c.last_message_at && (
                          <span className="text-[9.5px] text-slate-400 shrink-0 ml-1">
                            {new Date(c.last_message_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isUnread ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                        {c.last_message_preview || 'No messages yet'}
                      </p>
                    </div>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ─── THREAD ─── */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white/70 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm flex flex-col overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <UsersIcon size={32} className="text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">Select a conversation</p>
              <p className="text-xs text-slate-400 mt-1">Or start a new chat with a doctor on your team.</p>
            </div>
          ) : (
            <>
              <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 text-white flex items-center justify-center text-xs font-bold">
                    {activeConv.type === 'group' ? <UsersIcon size={15} /> : conversationLabel(activeConv)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{conversationLabel(activeConv)}</h4>
                    <p className="text-[10.5px] text-slate-400">
                      {typingUsers.length > 0
                        ? `${typingUsers.join(', ')} typing…`
                        : activeConv.type === 'group'
                        ? `${activeConv.members.length} members`
                        : otherMemberOnline(activeConv)
                        ? 'Online'
                        : 'Offline'}
                    </p>
                  </div>
                </div>
                <button onClick={handleToggleMute} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" title="Mute conversation">
                  {activeConv.members.find((m) => m.user_id === myUserId)?.is_muted ? <BellOff size={16} /> : <Bell size={16} />}
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="text-center text-xs text-slate-400 py-6">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-6">No messages yet — say hello 👋</div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === myUserId
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!mine && activeConv.type === 'group' && (
                            <span className="text-[10px] font-bold text-slate-500 mb-0.5 ml-1">{m.sender?.full_name}</span>
                          )}
                          <div className="relative flex items-center gap-1.5">
                            {mine && (
                              <button
                                onClick={() => setMenuOpenFor(menuOpenFor === m.id ? null : m.id)}
                                className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-300 hover:text-slate-500"
                              >
                                <MoreVertical size={13} />
                              </button>
                            )}
                            <div
                              className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                                m.is_deleted
                                  ? 'bg-slate-100 text-slate-400 italic'
                                  : mine
                                  ? 'bg-blue-600 text-white rounded-br-sm'
                                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                              }`}
                            >
                              {m.is_deleted ? 'Message deleted' : m.body}
                              {m.attachments && m.attachments.length > 0 && !m.is_deleted && (
                                <div className="mt-1.5 space-y-1">
                                  {m.attachments.map((a) => (
                                    <a
                                      key={a.id}
                                      href={a.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-1.5 text-[11px] underline ${mine ? 'text-blue-100' : 'text-blue-600'}`}
                                    >
                                      {a.file_type?.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                                      {a.file_name}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            {mine && menuOpenFor === m.id && !m.is_deleted && (
                              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs w-36">
                                <button
                                  onClick={() => handleDeleteMessage(m.id)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                                >
                                  <Trash2 size={12} /> Delete message
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 px-1">
                            <span className="text-[9.5px] text-slate-400">
                              {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {mine && <CheckCheck size={11} className="text-blue-400" />}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              <div className="p-4 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"
                    title="Attach file"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); broadcastTyping() }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Type a message…"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-400"
                  />
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="w-10 h-10 rounded-xl bg-blue-600 disabled:bg-slate-200 text-white flex items-center justify-center shrink-0"
                  >
                    <Send size={16} />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── NEW CHAT MODAL ─── */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">New Conversation</h3>
                <button onClick={() => setShowNewChat(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 mb-4 bg-slate-50 p-1 rounded-xl">
                {(['direct', 'group'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setNewChatMode(mode); setSelectedMembers([]) }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      newChatMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {mode === 'direct' ? 'Direct Message' : 'Group Chat'}
                  </button>
                ))}
              </div>

              {newChatMode === 'group' && (
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (e.g. Cardiology Team)"
                  className="w-full mb-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
                />
              )}

              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctors..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 mb-4">
                {filteredDoctors.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No registered doctors found.</p>
                ) : (
                  filteredDoctors.map((d) => {
                    const checked = selectedMembers.includes(d.id)
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          if (newChatMode === 'direct') setSelectedMembers([d.id])
                          else setSelectedMembers((prev) => (checked ? prev.filter((x) => x !== d.id) : [...prev, d.id]))
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition ${
                          checked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {d.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{d.full_name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{d.department || d.role}</p>
                        </div>
                        {checked && <Check size={15} className="text-blue-600 shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>

              <button
                onClick={handleCreateChat}
                disabled={creating || selectedMembers.length === 0}
                className="w-full py-3 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <UserPlus size={15} />
                {newChatMode === 'direct' ? 'Start Direct Message' : `Create Group (${selectedMembers.length})`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </HospitalDashboardLayout>
  )
}
