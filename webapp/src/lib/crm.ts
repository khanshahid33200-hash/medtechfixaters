// MedTechFixaters AI — built-in CRM assistance. Pure, deterministic helpers over real rows
// returned by get_crm_overview. They organise and phrase; they never invent clinical facts
// and never make medical decisions.
import { supabase } from './supabase'

export type CrmFollowUp = {
  id: string
  follow_up_date: string
  follow_up_token: string | null
  reason: string | null
  status: string
  bucket: 'due_today' | 'upcoming' | 'overdue' | 'completed' | 'cancelled'
  doctor_id: string
  doctor_name: string | null
  patient_name: string | null
  patient_phone: string | null
  patient_number: string | null
  communication_opt_out: boolean | null
  whatsapp_status: string | null
  email_status: string | null
  last_notification_at: string | null
}

export type CrmOverview = {
  counts: { due_today: number; upcoming: number; overdue: number; completed: number; pending_communication: number; lapsed_patients: number }
  follow_ups: CrmFollowUp[]
  lapsed_patients: { id: string; name: string; phone: string; patient_number: string | null; last_visit: string; doctor_name: string | null }[]
  pending_communication: {
    id: string; channel: 'whatsapp' | 'email'; notification_type: string; status: string; skip_reason: string | null
    last_error: string | null; created_at: string; patient_name: string | null; follow_up_date: string; follow_up_token: string | null
  }[]
  upcoming_appointments: { id: string; patient_name: string; appointment_date: string; queue_number: string | null; status: string; doctor_name: string | null }[]
  recent_activity: { id: string; patient_name: string; appointment_date: string; status: string; queue_number: string | null; doctor_name: string | null; updated_at: string }[]
  doctors: { id: string; name: string }[]
  scope: 'doctor' | 'hospital'
  hospital_name: string | null
  booking_token: string | null
}

export async function fetchCrmOverview(filters: { doctorId?: string | null; status?: string | null; search?: string | null } = {}) {
  const { data, error } = await supabase.rpc('get_crm_overview', {
    p_doctor_id: filters.doctorId || null,
    p_status: filters.status || null,
    p_search: filters.search?.trim() || null,
  })
  if (error) throw new Error(error.message)
  return data as CrmOverview
}

const DAY = 86400000
export const daysBetween = (fromIso: string, to: Date = new Date()) => {
  const [y, m, d] = fromIso.split('-').map(Number)
  const from = Date.UTC(y, m - 1, d)
  const t = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((t - from) / DAY)
}

export const prettyDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export type NextAction = { id: string; title: string; detail: string; priority: 'high' | 'medium' | 'low' }

const SKIP_LABEL: Record<string, string> = {
  no_consent: 'the patient has not agreed to reminders',
  opted_out: 'the patient opted out',
  no_email: 'no email on file',
  no_phone: 'no phone on file',
  channel_disabled: 'that channel is switched off',
  appointment_cancelled: 'the original visit was cancelled',
  no_patient: 'no patient record is linked',
}

/** Rule-based "what to do next", ordered by priority, from real counts and rows only. */
export function nextActions(o: CrmOverview, today: Date = new Date()): NextAction[] {
  const actions: NextAction[] = []
  const overdue = o.follow_ups.filter((f) => f.bucket === 'overdue')
  if (overdue.length) {
    const oldest = overdue.reduce((a, b) => (a.follow_up_date < b.follow_up_date ? a : b))
    actions.push({
      id: 'overdue',
      priority: 'high',
      title: `Contact ${overdue.length} overdue patient${overdue.length === 1 ? '' : 's'}`,
      detail: `The oldest, ${oldest.patient_name || 'a patient'}, was due ${daysBetween(oldest.follow_up_date, today)} day(s) ago. Call or send a reminder, then mark the follow-up done or reschedule it.`,
    })
  }
  if (o.counts.due_today) {
    actions.push({
      id: 'today',
      priority: 'high',
      title: `Confirm today’s ${o.counts.due_today} follow-up${o.counts.due_today === 1 ? '' : 's'}`,
      detail: 'Check that each patient is coming in today and add them to the queue when they arrive.',
    })
  }
  const failed = o.pending_communication.filter((p) => p.status === 'failed')
  if (failed.length) {
    actions.push({
      id: 'failed',
      priority: 'medium',
      title: `${failed.length} reminder${failed.length === 1 ? '' : 's'} failed to send`,
      detail: 'Email delivery failed. Check the SMTP settings, or contact these patients directly.',
    })
  }
  const notConfigured = o.pending_communication.filter((p) => p.status === 'not_configured')
  if (notConfigured.length) {
    actions.push({
      id: 'not_configured',
      priority: 'medium',
      title: `${notConfigured.length} reminder${notConfigured.length === 1 ? '' : 's'} not sent: provider not set up`,
      detail: notConfigured.some((p) => p.channel === 'whatsapp')
        ? 'WhatsApp reminders need a provider to be connected. Until then, use the reminder drafts below to message patients yourself.'
        : 'Email is not configured yet. Use the reminder drafts below meanwhile.',
    })
  }
  const skipped = o.pending_communication.filter((p) => p.status === 'skipped')
  if (skipped.length) {
    const reasons = Array.from(new Set(skipped.map((s) => SKIP_LABEL[s.skip_reason || ''] || 'no consent'))).slice(0, 2).join('; ')
    actions.push({
      id: 'skipped',
      priority: 'low',
      title: `${skipped.length} reminder${skipped.length === 1 ? ' was' : 's were'} not sent`,
      detail: `Reason: ${reasons}. Ask patients at their next visit whether they’d like reminders.`,
    })
  }
  if (o.counts.lapsed_patients) {
    actions.push({
      id: 'lapsed',
      priority: 'low',
      title: `${o.counts.lapsed_patients} patient${o.counts.lapsed_patients === 1 ? ' has' : 's have'} not returned in 3+ months`,
      detail: 'Consider a courtesy check-in call. The doctor decides whether a visit is needed.',
    })
  }
  if (!actions.length) {
    actions.push({ id: 'clear', priority: 'low', title: 'All caught up', detail: 'No overdue follow-ups or pending reminders right now.' })
  }
  return actions
}

/** A reminder message the staff member can review, edit and send themselves. */
export function reminderDraft(input: {
  patientName: string | null
  clinicName: string | null
  followUpDate?: string | null
  kind: 'due' | 'overdue' | 'upcoming' | 'lapsed'
  bookingLink?: string | null
}) {
  const name = (input.patientName || 'there').split(' ')[0]
  const clinic = input.clinicName || 'your clinic'
  const date = input.followUpDate ? prettyDate(input.followUpDate) : null
  const link = input.bookingLink ? `\nBook here: ${input.bookingLink}` : ''
  switch (input.kind) {
    case 'overdue':
      return `Hello ${name}, this is ${clinic}. Your follow-up${date ? ` on ${date}` : ''} was missed. Please book a visit when convenient.${link}`
    case 'upcoming':
      return `Hello ${name}, this is a reminder from ${clinic} about your follow-up${date ? ` on ${date}` : ''}.${link}`
    case 'lapsed':
      return `Hello ${name}, greetings from ${clinic}. It has been a while since your last visit. If you would like a check-up, you can book here.${link}`
    default:
      return `Hello ${name}, this is ${clinic}. Your doctor recommended a follow-up${date ? ` today, ${date}` : ' today'}.${link}`
  }
}

export const whatsappLink = (phone: string | null, text: string) => {
  const digits = (phone || '').replace(/\D/g, '')
  const intl = digits.length === 10 ? `91${digits}` : digits
  return intl ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : null
}
