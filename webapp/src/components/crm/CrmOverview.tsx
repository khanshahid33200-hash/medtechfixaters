import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, CalendarClock, AlertTriangle, CheckCircle2, MailWarning, Sparkles, RefreshCw, Search,
  Phone, MessageCircle, Copy, X, UserX, CalendarDays, Activity, Loader2, Check,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  type CrmFollowUp, type CrmOverview as Overview, daysBetween, fetchCrmOverview, nextActions, prettyDate, reminderDraft, whatsappLink,
} from '../../lib/crm'

// CRM Overview. Every number and row comes from get_crm_overview (tenant-scoped in the
// database: doctors only ever see their own patients). "MedTechFixaters AI" here is the
// built-in rules engine: next actions and reminder drafts. Staff review and send drafts
// themselves; nothing is sent automatically from this screen.

type Draft = { patientName: string | null; phone: string | null; text: string }

const STATUS_LABEL: Record<string, string> = {
  pending: 'Queued', sending: 'Sending', failed: 'Failed', not_configured: 'Provider not set up', skipped: 'Not sent',
}

export default function CrmOverview({ canFilterDoctors = false }: { canFilterDoctors?: boolean }) {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiOn, setAiOn] = useState(true)
  const [doctorId, setDoctorId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchCrmOverview({ doctorId: doctorId || null, status: status || null, search: search || null }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load CRM data.')
    } finally {
      setLoading(false)
    }
  }, [doctorId, status, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  useEffect(() => {
    supabase.rpc('get_ai_feature_flags').then(({ data: f }) => setAiOn(f?.crm_ai_enabled !== false), () => undefined)
  }, [])

  const inRange = useCallback((d: string) => (!from || d >= from) && (!to || d <= to), [from, to])
  const followUps = useMemo(() => (data?.follow_ups || []).filter((f) => inRange(f.follow_up_date)), [data, inRange])
  const today = followUps.filter((f) => f.bucket === 'due_today')
  const overdue = followUps.filter((f) => f.bucket === 'overdue')
  const upcoming = followUps.filter((f) => f.bucket === 'upcoming')
  const actions = useMemo(() => (data ? nextActions(data) : []), [data])
  const bookingLink = data?.booking_token ? `${window.location.origin}/book/${encodeURIComponent(data.booking_token)}` : null

  const openDraft = (f: { patient_name: string | null; patient_phone: string | null; follow_up_date: string | null }, kind: 'due' | 'overdue' | 'upcoming' | 'lapsed') => {
    setCopied(false)
    setDraft({
      patientName: f.patient_name,
      phone: f.patient_phone,
      text: reminderDraft({ patientName: f.patient_name, clinicName: data?.hospital_name ?? null, followUpDate: f.follow_up_date, kind, bookingLink }),
    })
  }

  const cards = [
    { label: 'Follow-ups Today', value: data?.counts.due_today, icon: CalendarCheck, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Upcoming (30 days)', value: data?.counts.upcoming, icon: CalendarClock, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Overdue', value: data?.counts.overdue, icon: AlertTriangle, tone: 'text-rose-600 bg-rose-50' },
    { label: 'Completed (30 days)', value: data?.counts.completed, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending Communication', value: data?.counts.pending_communication, icon: MailWarning, tone: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <section className="space-y-5" aria-label="CRM overview">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
            CRM Overview
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-700">
              <Sparkles size={11} /> MedTechFixaters AI
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {data?.scope === 'doctor' ? 'Your patients only.' : 'Whole hospital.'} Follow-ups, returning patients and reminders from live records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {canFilterDoctors && (data?.doctors?.length ?? 0) > 0 && (
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label="Doctor" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-700">
              <option value="">All doctors</option>
              {data!.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-700">
            <option value="">All statuses</option>
            <option value="due_today">Due today</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-700" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-700" />
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient name, phone or ID" aria-label="Search patient" className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 font-medium" />
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50" aria-label="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{loading && !data ? '…' : c.value ?? 0}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tone}`}><Icon size={18} /></span>
            </div>
          )
        })}
      </div>

      {aiOn && data && (
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50/60 via-white to-indigo-50/40 p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm font-black text-slate-900"><Sparkles size={15} className="text-orange-500" /> Suggested next actions</p>
          <p className="text-[11px] text-slate-500">Built from today’s records by MedTechFixaters rules. Operational only, never medical advice.</p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {actions.map((a) => (
              <li key={a.id} className="flex gap-3 rounded-2xl border border-white bg-white/80 p-3 text-xs shadow-sm">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${a.priority === 'high' ? 'bg-rose-500' : a.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                <div>
                  <p className="font-extrabold text-slate-900">{a.title}</p>
                  <p className="mt-0.5 text-slate-600">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <FollowUpList title="Today’s Follow-ups" icon={CalendarCheck} rows={today} empty="No follow-ups due today." kind="due" onDraft={aiOn ? openDraft : undefined} showDoctor={data?.scope === 'hospital'} />
        <FollowUpList title="Overdue Patients" icon={AlertTriangle} rows={overdue} empty="No overdue follow-ups." kind="overdue" onDraft={aiOn ? openDraft : undefined} showDoctor={data?.scope === 'hospital'} />
        <FollowUpList title="Upcoming Follow-ups" icon={CalendarClock} rows={upcoming.slice(0, 20)} empty="Nothing scheduled." kind="upcoming" onDraft={aiOn ? openDraft : undefined} showDoctor={data?.scope === 'hospital'} />

        <Panel title="Patients Who Haven’t Returned" icon={UserX} empty="Everyone seen in the last year has visited recently." count={data?.lapsed_patients.length}>
          {data?.lapsed_patients.map((p) => (
            <Row key={p.id}>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-900">{p.name}</p>
                <p className="text-[10px] text-slate-400">Last visit {prettyDate(p.last_visit)} ({daysBetween(p.last_visit)} days ago){p.doctor_name ? ` · ${p.doctor_name}` : ''}</p>
              </div>
              {aiOn && (
                <button onClick={() => openDraft({ patient_name: p.name, patient_phone: p.phone, follow_up_date: null }, 'lapsed')} className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-100">
                  Draft message
                </button>
              )}
            </Row>
          ))}
        </Panel>

        <Panel title="Pending Communication" icon={MailWarning} empty="No reminders waiting or failed." count={data?.pending_communication.length}>
          {data?.pending_communication.map((p) => (
            <Row key={p.id}>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-900">{p.patient_name || 'Patient'} <span className="font-medium text-slate-400">· {p.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</span></p>
                <p className="truncate text-[10px] text-slate-400">
                  Follow-up {prettyDate(p.follow_up_date)}{p.skip_reason ? ` · ${p.skip_reason.replace(/_/g, ' ')}` : ''}{p.last_error ? ` · ${p.last_error}` : ''}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === 'failed' ? 'bg-rose-50 text-rose-700' : p.status === 'skipped' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                {STATUS_LABEL[p.status] || p.status}
              </span>
            </Row>
          ))}
        </Panel>

        <Panel title="Upcoming Appointments (7 days)" icon={CalendarDays} empty="No upcoming appointments." count={data?.upcoming_appointments.length}>
          {data?.upcoming_appointments.map((a) => (
            <Row key={a.id}>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-900">{a.patient_name}</p>
                <p className="text-[10px] text-slate-400">{prettyDate(a.appointment_date)}{a.doctor_name ? ` · ${a.doctor_name}` : ''}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-black text-indigo-600">{a.queue_number}</span>
            </Row>
          ))}
        </Panel>

        <Panel title="Recent Patient Activity (14 days)" icon={Activity} empty="No recent activity." count={data?.recent_activity.length}>
          {data?.recent_activity.map((a) => (
            <Row key={a.id}>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-900">{a.patient_name}</p>
                <p className="text-[10px] text-slate-400">{prettyDate(a.appointment_date)}{a.doctor_name ? ` · ${a.doctor_name}` : ''}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{a.status}</span>
            </Row>
          ))}
        </Panel>
      </div>

      <AnimatePresence>
        {draft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="dialog" aria-label="Reminder draft">
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-black text-slate-900"><Sparkles size={14} className="text-orange-500" /> Reminder draft for {draft.patientName || 'patient'}</p>
                <button onClick={() => setDraft(null)} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
              </div>
              <textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value.slice(0, 1000) })} rows={6} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed" aria-label="Message text" />
              <p className="text-[10px] text-slate-400">Review and edit before sending. You send this yourself; nothing is sent automatically.</p>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  onClick={() => navigator.clipboard.writeText(draft.text).then(() => setCopied(true), () => undefined)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-slate-700 hover:bg-slate-200"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                </button>
                {whatsappLink(draft.phone, draft.text) ? (
                  <a href={whatsappLink(draft.phone, draft.text)!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 rounded-xl bg-emerald-50 py-2 text-emerald-700 hover:bg-emerald-100">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                ) : <span />}
                {draft.phone ? (
                  <a href={`tel:${draft.phone}`} className="flex items-center justify-center gap-1 rounded-xl bg-indigo-50 py-2 text-indigo-700 hover:bg-indigo-100"><Phone size={13} /> Call</a>
                ) : <span />}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading && data && <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><Loader2 size={12} className="animate-spin" /> Refreshing…</p>}
    </section>
  )
}

function Panel({ title, icon: Icon, count, empty, children }: { title: string; icon: typeof CalendarCheck; count?: number; empty: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="flex items-center justify-between text-sm font-black text-slate-900">
        <span className="flex items-center gap-2"><Icon size={15} className="text-indigo-600" /> {title}</span>
        {count ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{count}</span> : null}
      </p>
      {count ? <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100">{children}</div> : <p className="mt-3 text-xs italic text-slate-400">{empty}</p>}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 bg-slate-50/40 p-3 text-xs">{children}</div>
}

function FollowUpList({ title, icon, rows, empty, kind, onDraft, showDoctor }: {
  title: string; icon: typeof CalendarCheck; rows: CrmFollowUp[]; empty: string
  kind: 'due' | 'overdue' | 'upcoming'; onDraft?: (f: CrmFollowUp, kind: 'due' | 'overdue' | 'upcoming') => void; showDoctor?: boolean
}) {
  return (
    <Panel title={title} icon={icon} empty={empty} count={rows.length}>
      {rows.map((f) => (
        <Row key={f.id}>
          <div className="min-w-0">
            <p className="truncate font-extrabold text-slate-900">
              {f.patient_name || 'Patient'} <span className="font-mono text-[10px] font-black text-purple-700">{f.follow_up_token}</span>
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {prettyDate(f.follow_up_date)}{kind === 'overdue' ? ` · ${daysBetween(f.follow_up_date)} days overdue` : ''}
              {showDoctor && f.doctor_name ? ` · ${f.doctor_name}` : ''}{f.reason ? ` · ${f.reason}` : ''}
              {f.communication_opt_out ? ' · opted out of reminders' : ''}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {f.patient_phone && <a href={`tel:${f.patient_phone}`} aria-label={`Call ${f.patient_name || 'patient'}`} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"><Phone size={12} /></a>}
            {onDraft && !f.communication_opt_out && (
              <button onClick={() => onDraft(f, kind)} className="rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-100">Draft reminder</button>
            )}
          </div>
        </Row>
      ))}
    </Panel>
  )
}
