// Supabase Edge Function: followup-dispatcher
//
// MedTechFixaters automatic follow-up — built in, no external AI model.
// On each run (schedule it hourly with Supabase Cron):
//   1. enqueue_followup_notifications()  marks due/overdue follow-ups and queues reminders
//      (skipping opted-out / no-consent / cancelled / duplicates — enforced in the database)
//   2. claim_notification_batch()        locks a batch so parallel runs never double-send
//   3. sends each message through its provider and records the result with complete_notification()
//
// Providers:
//   Email     SMTP (any mailbox). Supabase blocks outbound ports 25 and 587 — use port 465 (SSL).
//   WhatsApp  provider interface only. No provider is connected yet, so WhatsApp messages are
//             recorded as "not_configured" — they are never reported as sent.
//
// Deploy (CLI):   supabase functions deploy followup-dispatcher --no-verify-jwt
// Dashboard:      Edge Functions → Deploy a new function → Via editor → "followup-dispatcher",
//                 paste this file, turn OFF "Verify JWT" (it is protected by CRON_SECRET instead).
// Secrets:
//   CRON_SECRET               required; the scheduler must send it in the x-cron-secret header
//   PROJECT_SERVICE_ROLE_KEY  required (already set for admin-ops)
//   SMTP_HOST, SMTP_PORT (465), SMTP_USER, SMTP_PASS, SMTP_FROM   for email
//   SITE_URL                  optional, default https://www.medtechfixaters.in (booking links)
// Requires supabase/05_AI_LAYER.sql.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import nodemailer from 'npm:nodemailer@6.9.16'

const env = (k: string) => Deno.env.get(k) || ''
const SUPABASE_URL = env('SUPABASE_URL') || 'https://yweywvnivyftwtglxavr.supabase.co'
const SERVICE_ROLE_KEY = env('PROJECT_SERVICE_ROLE_KEY') || env('SUPABASE_SERVICE_ROLE_KEY')
const SITE_URL = (env('SITE_URL') || 'https://www.medtechfixaters.in').replace(/\/+$/, '')

export type Job = {
  id: string
  channel: 'whatsapp' | 'email'
  notification_type: 'followup_upcoming' | 'followup_due' | 'followup_overdue'
  attempts: number
  patient_name: string | null
  patient_phone: string | null
  patient_email: string | null
  clinic_name: string | null
  doctor_name: string | null
  follow_up_date: string | null
  follow_up_token: string | null
  booking_token: string | null
  template: string | null
}

export type SendResult = { status: 'sent' | 'failed' | 'not_configured' | 'skipped'; provider: string; messageId?: string; error?: string }

// ─── templates ───────────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATES: Record<Job['notification_type'], string> = {
  followup_upcoming:
    'Hello {{patient_name}},\nThis is a reminder from {{clinic_name}}. Your doctor recommended a follow-up on {{followup_date}}.\nYou can book your visit here: {{booking_link}}',
  followup_due:
    'Hello {{patient_name}},\nThis is a follow-up reminder from {{clinic_name}}. Your doctor recommended a follow-up today, {{followup_date}}.\nYou can book your visit here: {{booking_link}}',
  followup_overdue:
    'Hello {{patient_name}},\n{{clinic_name}} noticed your follow-up on {{followup_date}} was missed. Please book a visit when you can: {{booking_link}}',
}

const ALLOWED_VARS = ['patient_name', 'clinic_name', 'doctor_name', 'followup_date', 'followup_token', 'booking_link'] as const

export function formatDate(isoDate: string | null) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Fills only known {{placeholders}}; anything else in braces is removed, never evaluated. */
export function render(template: string, vars: Record<(typeof ALLOWED_VARS)[number], string>) {
  return template
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k: string) => ((ALLOWED_VARS as readonly string[]).includes(k) ? vars[k as keyof typeof vars] ?? '' : ''))
    .replace(/\{\{[^}]*\}\}/g, '')
    .slice(0, 1600)
}

export function buildMessage(job: Job) {
  const vars = {
    patient_name: (job.patient_name || 'there').split(' ')[0],
    clinic_name: job.clinic_name || 'your clinic',
    doctor_name: job.doctor_name || 'your doctor',
    followup_date: formatDate(job.follow_up_date),
    followup_token: job.follow_up_token || '',
    booking_link: job.booking_token ? `${SITE_URL}/book/${encodeURIComponent(job.booking_token)}` : SITE_URL,
  }
  const text = render(job.template || DEFAULT_TEMPLATES[job.notification_type], vars)
  const subject = job.notification_type === 'followup_overdue'
    ? `Missed follow-up at ${vars.clinic_name}`
    : `Follow-up reminder from ${vars.clinic_name}`
  return { subject, text }
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// ─── providers ───────────────────────────────────────────────────────────────

export interface WhatsAppProvider {
  name: string
  configured(): boolean
  sendTemplateMessage(to: string, text: string): Promise<SendResult>
}

export interface EmailProvider {
  name: string
  configured(): boolean
  sendTemplate(to: string, subject: string, text: string): Promise<SendResult>
}

// No WhatsApp provider is connected yet. Add Meta Cloud API / MSG91 / Twilio here later,
// selected by WHATSAPP_PROVIDER. Until then every WhatsApp message is "not_configured".
class NoWhatsAppProvider implements WhatsAppProvider {
  name = 'none'
  configured() { return false }
  async sendTemplateMessage(): Promise<SendResult> {
    return { status: 'not_configured', provider: this.name, error: 'No WhatsApp provider is configured.' }
  }
}

class SmtpEmailProvider implements EmailProvider {
  name = 'smtp'
  private transport: ReturnType<typeof nodemailer.createTransport> | null = null
  configured() {
    return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS') && env('SMTP_FROM'))
  }
  async sendTemplate(to: string, subject: string, text: string): Promise<SendResult> {
    if (!this.configured()) return { status: 'not_configured', provider: this.name, error: 'SMTP is not configured.' }
    const port = Number(env('SMTP_PORT') || 465)
    if (port === 25 || port === 587) {
      return { status: 'not_configured', provider: this.name, error: 'Supabase blocks SMTP ports 25 and 587. Use port 465.' }
    }
    this.transport ||= nodemailer.createTransport({
      host: env('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
    try {
      const info = await this.transport.sendMail({
        from: env('SMTP_FROM'),
        to,
        subject,
        text,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#171717">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`,
      })
      return { status: 'sent', provider: this.name, messageId: String(info.messageId || '') }
    } catch (e) {
      // Never log credentials; the error message from nodemailer does not include them.
      return { status: 'failed', provider: this.name, error: e instanceof Error ? e.message.slice(0, 300) : 'send failed' }
    }
  }
}

export async function deliver(job: Job, providers: { whatsapp: WhatsAppProvider; email: EmailProvider }): Promise<SendResult> {
  const { subject, text } = buildMessage(job)
  if (job.channel === 'email') {
    if (!job.patient_email) return { status: 'skipped', provider: providers.email.name, error: 'No email on file.' }
    return providers.email.sendTemplate(job.patient_email, subject, text)
  }
  if (!job.patient_phone) return { status: 'skipped', provider: providers.whatsapp.name, error: 'No phone on file.' }
  return providers.whatsapp.sendTemplateMessage(job.patient_phone, text)
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ─── handler ────────────────────────────────────────────────────────────────

export async function handle(req: Request): Promise<Response> {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!safeEqual(req.headers.get('x-cron-secret') || '', env('CRON_SECRET'))) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const providers = { whatsapp: new NoWhatsAppProvider() as WhatsAppProvider, email: new SmtpEmailProvider() as EmailProvider }
  const started = Date.now()
  const totals = { queued: 0, sent: 0, failed: 0, not_configured: 0, skipped: 0 }

  try {
    const { data: queued, error: qErr } = await admin.rpc('enqueue_followup_notifications')
    if (qErr) throw new Error(qErr.message)
    totals.queued = Number(queued) || 0

    for (let batch = 0; batch < 4 && Date.now() - started < 50_000; batch++) {
      const { data: jobs, error: cErr } = await admin.rpc('claim_notification_batch', { p_limit: 50 })
      if (cErr) throw new Error(cErr.message)
      if (!jobs?.length) break
      for (const job of jobs as Job[]) {
        const r = await deliver(job, providers)
        totals[r.status]++
        await admin.rpc('complete_notification', {
          p_id: job.id, p_status: r.status, p_provider: r.provider, p_message_id: r.messageId ?? null, p_error: r.error ?? null,
        })
      }
    }

    await admin.from('ai_requests').insert({
      feature: 'auto_followup', provider: 'builtin', status: 'success', latency_ms: Date.now() - started,
      completed_at: new Date().toISOString(), metadata: totals,
    })
    return json({ success: true, ...totals })
  } catch (err) {
    console.error('followup-dispatcher:', err instanceof Error ? err.message : err)
    await admin.from('ai_requests').insert({
      feature: 'auto_followup', provider: 'builtin', status: 'error', latency_ms: Date.now() - started,
      completed_at: new Date().toISOString(), metadata: totals,
    }).then(() => undefined, () => undefined)
    return json({ success: false, error: 'Dispatcher failed. See function logs.', ...totals }, 500)
  }
}

Deno.serve(handle)
