import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useParams } from 'react-router-dom'
import {
  Clock, Search, Activity, Building2, User, Stethoscope,
  MapPin, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Bell,
  Volume2, VolumeX, Sparkles, ShieldCheck, ChevronRight, Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'

interface QueueProgressItem {
  token_number: number
  queue_number: string
  status: string
  is_current: boolean
  is_you: boolean
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

interface QueueStatus {
  appointment_id: string
  hospital_name: string
  hospital_phone?: string
  doctor_name: string
  doctor_code: string
  department: string
  room_number: string
  appointment_date: string
  token_number: number
  original_token: number
  queue_number: string
  patient_id?: string
  patient_number?: string
  patient_name: string
  current_serving_token: number
  live_position: number
  patients_ahead: number
  waiting_before_you: number
  estimated_wait_mins: number
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show'
  live_status_label: 'Now Serving' | 'Your Turn Soon' | 'Waiting' | 'Completed' | 'Cancelled' | 'Missed'
  queue_progress?: QueueProgressItem[]
  notifications?: NotificationItem[]
}

// Synthesize pleasant chime using standard Web Audio API (0 external assets required)
function playTurnChime(type: 'urgent' | 'alert' | 'normal' = 'normal') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    if (type === 'urgent') {
      // High-pitched double ascending chime for "Your Turn"
      osc1.frequency.setValueAtTime(587.33, now) // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5
      osc2.frequency.setValueAtTime(880, now + 0.18)
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35) // D6
    } else {
      // Soft gentle chime for "2 turns away" or "You're next"
      osc1.frequency.setValueAtTime(523.25, now) // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15) // E5
      osc2.frequency.setValueAtTime(659.25, now + 0.18)
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35) // G5
    }

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.6)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.6)
  } catch {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
}

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const { trackingToken: pathToken } = useParams<{ trackingToken?: string }>()
  const trackingTokenParam = pathToken || searchParams.get('t') || searchParams.get('token') || ''

  useSEO({
    title: 'Live Patient Queue Tracker — Med Rapidly',
    description: 'Track your live position in the doctor queue, turnaround time, and receive instant turn notifications.',
  })

  const [tokenInput, setTokenInput] = useState(trackingTokenParam)
  const [queueData, setQueueData] = useState<QueueStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isConnected, setIsConnected] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [browserPushEnabled, setBrowserPushEnabled] = useState(false)
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([])

  const previousPatientsAhead = useRef<number | null>(null)

  // 1. Fetch Live Queue Status via PostgreSQL RPC
  const fetchLiveStatus = async (trkToken: string, isSilent = false) => {
    if (!trkToken.trim()) return
    if (!isSilent) setIsLoading(true)
    setError(null)

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_live_queue_status', {
        p_tracking_token: trkToken.trim()
      })

      if (rpcErr) throw rpcErr

      if (data && data.success) {
        setQueueData(data)
        setLastUpdated(new Date())
        setIsConnected(true)

        if (Array.isArray(data.notifications)) {
          setLocalNotifications(data.notifications)
        }

        // Sound trigger & Browser Notification on threshold changes
        if (previousPatientsAhead.current !== null && previousPatientsAhead.current !== data.patients_ahead) {
          if (data.status === 'In Consultation' || data.patients_ahead === 0) {
            if (soundEnabled) playTurnChime('urgent')
            triggerBrowserNotification("🟢 It's your turn!", `Token #${data.token_number} is now being called by Dr. ${data.doctor_name}.`)
          } else if (data.patients_ahead === 1) {
            if (soundEnabled) playTurnChime('alert')
            triggerBrowserNotification("⚡ You're next!", `Token #${data.token_number} is next in line for Dr. ${data.doctor_name}.`)
          } else if (data.patients_ahead === 2) {
            if (soundEnabled) playTurnChime('normal')
            triggerBrowserNotification("⏱️ You're 2 turns away", `Current token is #${data.current_serving_token}. Please be ready.`)
          }
        }
        previousPatientsAhead.current = data.patients_ahead
      } else {
        throw new Error(data?.error || 'Appointment record not found.')
      }
    } catch (err: any) {
      console.warn('Queue tracking notice:', err.message)
      if (!isSilent) {
        setError(err.message || 'Tracking token not recognized. Please check your token.')
      }
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }

  const triggerBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        })
      } catch {
        // Notification failed in background
      }
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        setBrowserPushEnabled(true)
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    if (trackingTokenParam) {
      fetchLiveStatus(trackingTokenParam)
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserPushEnabled(true)
    }
  }, [trackingTokenParam])

  // 2. Real-Time Subscription to Live Appointments & Notifications
  useEffect(() => {
    if (!queueData?.appointment_id) return

    const apptChannel = supabase
      .channel(`live_queue_${queueData.appointment_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${queueData.appointment_id}`
        },
        () => {
          fetchLiveStatus(tokenInput || trackingTokenParam, true)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `appointment_id=eq.${queueData.appointment_id}`
        },
        (payload: any) => {
          if (payload.new) {
            setLocalNotifications(prev => [payload.new, ...prev.filter(p => p.id !== payload.new.id)])
            if (soundEnabled) playTurnChime(payload.new.type === 'QUEUE_YOUR_TURN' ? 'urgent' : 'alert')
            triggerBrowserNotification(payload.new.title, payload.new.message)
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
        }
      })

    // 10-second polling fallback to keep queue resilient even through network switches
    const interval = setInterval(() => {
      if (tokenInput || trackingTokenParam) {
        fetchLiveStatus(tokenInput || trackingTokenParam, true)
      }
    }, 10000)

    return () => {
      supabase.removeChannel(apptChannel)
      clearInterval(interval)
    }
  }, [queueData?.appointment_id, tokenInput, trackingTokenParam, soundEnabled])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) return
    fetchLiveStatus(tokenInput.trim())
  }

  // Visual status pill computation
  const isNowServing = queueData && (queueData.status === 'In Consultation' || queueData.patients_ahead === 0)
  const isNext = queueData && queueData.patients_ahead === 1 && queueData.status === 'Waiting'
  const isTwoAway = queueData && queueData.patients_ahead === 2 && queueData.status === 'Waiting'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16 antialiased selection:bg-orange-500 selection:text-white">
      {/* ─── TOP CLINICAL BAR ────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-orange-500/20">
              ⚡
            </div>
            <div>
              <span className="font-black text-xs text-slate-900 block leading-tight tracking-tight">
                MED RAPIDLY
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Live Queue Node
              </span>
            </div>
          </Link>

          {/* Realtime Live Status Pill & Controls */}
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              <span>{isConnected ? '● LIVE' : 'Reconnecting...'}</span>
            </div>

            {queueData && (
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-xl border transition ${
                  soundEnabled
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                title={soundEnabled ? 'Audio chime enabled' : 'Audio chime muted'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            )}

            {queueData && (
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold transition"
                title="Notifications"
              >
                <Bell size={14} />
                {localNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                    {localNotifications.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTAINER ──────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Token Search Bar (if not pre-loaded or switching tokens) */}
        {!queueData && (
          <form onSubmit={handleSearchSubmit} className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Track Appointment Queue
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Enter Tracking Ref (e.g. G-001 or ID)..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition"
              >
                <Search size={14} />
                <span>{isLoading ? '...' : 'Track'}</span>
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── LIVE TRACKER HERO CARD ──────────────────────────── */}
        {queueData && (
          <div className="space-y-4">
            {/* NOTIFICATION THRESHOLD ALERT BANNERS */}
            {isNowServing && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 animate-bounce-short space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <h3 className="text-sm font-black uppercase tracking-wider">🟢 IT'S YOUR TURN!</h3>
                </div>
                <p className="text-xs text-emerald-50 font-medium">
                  Token #{queueData.token_number} is now being called. Please proceed directly to <strong>{queueData.room_number || 'Consultation Room'}</strong>.
                </p>
              </div>
            )}

            {isNext && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-wider">⚡ YOU'RE NEXT!</h3>
                </div>
                <p className="text-xs text-orange-50 font-medium">
                  You are the very next patient in queue. Please proceed towards <strong>{queueData.room_number}</strong> and stay ready.
                </p>
              </div>
            )}

            {isTwoAway && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <h3 className="text-sm font-black uppercase tracking-wider">⏱️ 2 PATIENTS AWAY</h3>
                </div>
                <p className="text-xs text-blue-50 font-medium">
                  Your turn is approaching shortly. Please stay in the {queueData.department} waiting area.
                </p>
              </div>
            )}

            {/* MAIN LIQUID GLASS QUEUE CARD */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/60 p-6 space-y-6 text-center">
              {/* Doctor & Facility Header */}
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 inline-block">
                  {queueData.hospital_name}
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {queueData.doctor_name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {queueData.department} • <strong className="text-slate-800">{queueData.room_number || 'Room 101'}</strong>
                </p>
              </div>

              {/* HERO TOKEN DISPLAY */}
              <div className="py-2 space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                  YOUR TURN
                </span>
                <div className="text-6xl font-black text-slate-900 font-mono tracking-tight text-gradient">
                  #{queueData.token_number}
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 block">
                  Queue Ref: {queueData.queue_number}
                </span>
              </div>

              {/* DUAL STAT METRICS: NOW SERVING & PATIENTS AHEAD */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 shadow-inner">
                <div className="border-r border-slate-200 pr-2 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Now Serving
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-orange-600 font-mono block mt-0.5">
                    #{queueData.current_serving_token}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block mt-0.5">Active Doctor Desk</span>
                </div>

                <div className="pl-2 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Patients Ahead
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black font-mono block mt-0.5 ${
                    queueData.patients_ahead === 0 ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {queueData.patients_ahead}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                    {queueData.patients_ahead === 0 ? 'You are next!' : `${queueData.patients_ahead} waiting`}
                  </span>
                </div>
              </div>

              {/* ESTIMATED WAIT TIME BOX */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={15} className="text-orange-500" />
                  <span className="font-bold">Estimated Wait Time:</span>
                </div>
                <span className="font-mono font-black text-slate-900">
                  {queueData.patients_ahead === 0
                    ? 'Immediate'
                    : `~${queueData.estimated_wait_mins} mins`}
                </span>
              </div>

              {/* VISUAL QUEUE PROGRESS TIMELINE */}
              {queueData.queue_progress && queueData.queue_progress.length > 0 && (
                <div className="pt-2 space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Live Queue Flow
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                    {queueData.queue_progress
                      .filter(item => Math.abs(item.token_number - queueData.token_number) <= 3 || item.is_current || item.is_you)
                      .map(item => {
                        const isCurrent = item.is_current
                        const isYou = item.is_you
                        const isDone = item.status === 'Completed'

                        return (
                          <div
                            key={item.token_number}
                            className={`px-3 py-2 rounded-xl text-center shrink-0 border transition-all ${
                              isYou
                                ? 'bg-orange-500 text-white border-orange-600 ring-2 ring-orange-400/30 font-black shadow-md'
                                : isCurrent
                                ? 'bg-emerald-500 text-white border-emerald-600 font-bold animate-pulse shadow-sm'
                                : isDone
                                ? 'bg-slate-100 text-slate-400 border-slate-200 text-xs'
                                : 'bg-white text-slate-700 border-slate-200 text-xs font-semibold'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-wider block opacity-80">
                              {isYou ? 'YOU' : isCurrent ? 'SERVING' : isDone ? 'DONE' : 'WAIT'}
                            </span>
                            <span className="text-xs font-mono font-black block">#{item.token_number}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* PATIENT PROFILE IDENTITY FOOTER */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-black text-slate-900">{queueData.patient_name}</span>
                </div>
                {queueData.patient_number && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                    <span className="text-slate-500 font-medium">Permanent Patient ID:</span>
                    <span className="font-mono text-emerald-800 font-black tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {queueData.patient_number}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Appointment Date:</span>
                  <span className="font-bold text-slate-800">{queueData.appointment_date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Live Status:</span>
                  <span className="font-black text-orange-600 uppercase tracking-wide">
                    {queueData.live_status_label || queueData.status}
                  </span>
                </div>
              </div>

              {/* BROWSER PUSH NOTIFICATION OPT-IN BUTTON */}
              {!browserPushEnabled && 'Notification' in window && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <Bell size={13} className="text-orange-500" />
                  <span>Enable Push Notifications for Turn Alerts</span>
                </button>
              )}

              <div className="text-[10px] text-slate-400 font-medium pt-1">
                Last Synced: {lastUpdated.toLocaleTimeString()} • Zero-refresh live synchronization
              </div>
            </div>

            {/* NOTIFICATIONS DRAWER / HISTORY */}
            {showNotifications && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell size={14} className="text-orange-500" />
                    <span>Queue Alerts & Turn Notifications</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                {localNotifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet. You will be alerted when 2 turns away.</p>
                ) : (
                  <div className="space-y-2">
                    {localNotifications.map(n => (
                      <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5 text-xs text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900">{n.title}</span>
                          <span className="text-[9px] text-slate-400">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
