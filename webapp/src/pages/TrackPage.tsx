import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Clock, Search, Activity, Building2, User, Stethoscope,
  MapPin, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Bell
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'

interface QueueStatus {
  appointment_id: string
  hospital_name: string
  hospital_phone?: string
  doctor_name: string
  doctor_code: string
  department: string
  room_number: string
  appointment_date: string
  original_token: number
  live_position: number
  patients_ahead: number
  estimated_wait_mins: number
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show'
  created_at: string
}

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const trackingTokenParam = searchParams.get('t') || searchParams.get('token') || ''

  useSEO({
    title: 'Live OPD Queue & Token Tracker — MedTech Fixaters',
    description: 'Track your real-time doctor queue position, live room status, and estimated consultation wait time.',
  })

  const [tokenInput, setTokenInput] = useState(trackingTokenParam)
  const [queueData, setQueueData] = useState<QueueStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // 1. Fetch Live Queue Status via RPC
  const fetchLiveStatus = async (trkToken: string) => {
    if (!trkToken.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_live_queue_status', {
        p_tracking_token: trkToken.trim()
      })

      if (rpcErr) throw rpcErr

      if (data && data.success) {
        setQueueData(data)
        setLastUpdated(new Date())
      } else {
        throw new Error(data?.error || 'Appointment record not found.')
      }
    } catch (err: any) {
      console.warn('Queue tracking notice:', err.message)
      // Fallback state if query token not found
      setError(err.message || 'Tracking token not recognized. Please check your token.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (trackingTokenParam) {
      fetchLiveStatus(trackingTokenParam)
    }
  }, [trackingTokenParam])

  // 2. Real-Time Subscription to Live Appointments Queue
  useEffect(() => {
    if (!queueData?.appointment_id) return

    const channel = supabase
      .channel(`live_queue_${queueData.appointment_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          // Scoped to this one appointment row — without this filter, RLS's
          // "Public view queue for display" anon policy (appointment_date =
          // CURRENT_DATE, no hospital_id restriction) meant every hospital's
          // today's appointment changes were pushed to every tracking
          // patient's browser over the wire, not just the one they're
          // following, even though the callback itself ignored the payload.
          filter: `id=eq.${queueData.appointment_id}`
        },
        () => {
          // Re-fetch queue status immediately on any change in appointments
          fetchLiveStatus(tokenInput || trackingTokenParam)
        }
      )
      .subscribe()

    // 15-second polling fallback
    const interval = setInterval(() => {
      if (tokenInput || trackingTokenParam) {
        fetchLiveStatus(tokenInput || trackingTokenParam)
      }
    }, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [queueData?.appointment_id, tokenInput, trackingTokenParam])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) return
    fetchLiveStatus(tokenInput.trim())
  }

  // Get status color & badge
  const getStatusBadge = (status: string) => {
    // Must match the DB CHECK constraint on public.appointments exactly.
    switch (status) {
      case 'In Consultation':
        return {
          label: 'In Consultation',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-600 animate-pulse',
          desc: 'Consultation currently in progress with doctor.'
        }
      case 'Completed':
        return {
          label: 'Consultation Completed',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-600',
          desc: 'Consultation finished. Your WhatsApp e-prescription has been dispatched.'
        }
      case 'No Show':
        return {
          label: 'Marked No-Show',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          desc: 'Patient was not present when token was called.'
        }
      case 'Cancelled':
        return {
          label: 'Appointment Cancelled',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          desc: 'This appointment was cancelled.'
        }
      default:
        return {
          label: 'Waiting in Queue',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500 animate-ping',
          desc: 'Your token is active in the OPD queue. Monitor live position below.'
        }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16 antialiased selection:bg-emerald-500 selection:text-white">
      {/* ─── HEADER ────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-emerald-600/20">
              M
            </div>
            <div>
              <span className="font-black text-xs text-slate-900 block leading-tight">MedTech Fixaters</span>
              <span className="text-[10px] text-slate-400 font-semibold">Live Patient Telemetry</span>
            </div>
          </Link>

          {queueData && (
            <button
              onClick={() => fetchLiveStatus(tokenInput || trackingTokenParam)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Refresh Queue"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN CONTENT ──────────────────────────────────── */}
      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Token Search Form */}
        <form onSubmit={handleSearchSubmit} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Lookup Live Token or Tracking ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Enter Tracking Token (e.g. TRK-ABC123)..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow flex items-center gap-1.5"
            >
              <Search size={14} />
              <span>Track</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ─── LIVE QUEUE DISPLAY CARD ────────────────────────── */}
        {queueData && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/60 p-6 sm:p-8 space-y-6">
            {/* Hospital & Doctor Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                  {queueData.hospital_name}
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {queueData.doctor_name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {queueData.department} • <strong className="text-slate-800">{queueData.room_number}</strong>
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(queueData.status).bg}`}>
                  <span className={`w-2 h-2 rounded-full ${getStatusBadge(queueData.status).dot}`} />
                  {getStatusBadge(queueData.status).label}
                </span>
              </div>
            </div>

            {/* Permanent Token & Live Position Dual Box */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-3xl text-center shadow-inner">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Original Token #
                </span>
                <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono block mt-1">
                  #{queueData.original_token}
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">Permanent Token</span>
              </div>

              <div className="pl-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Live Queue Position
                </span>
                <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono block mt-1">
                  {queueData.live_position}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 mt-1 block">
                  {queueData.patients_ahead} Patients Ahead
                </span>
              </div>
            </div>

            {/* Live Queue Notice Box */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1 text-xs text-emerald-950">
              <p className="font-bold flex items-center gap-1.5">
                <Activity size={14} className="text-emerald-600" />
                <span>Live Real-Time Stream Active</span>
              </p>
              <p className="text-[11px] text-emerald-800">
                {getStatusBadge(queueData.status).desc}
              </p>
            </div>

            {/* Turnaround Estimate */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={16} className="text-slate-400" />
                <span className="font-bold">Estimated Turnaround:</span>
              </div>
              <span className="font-mono font-black text-slate-900">
                ~{queueData.estimated_wait_mins} mins
              </span>
            </div>

            {/* Footer info */}
            <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
              Last Synced: {lastUpdated.toLocaleTimeString()} • Powered by MedTech Fixaters High-Speed Clinical OS
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
