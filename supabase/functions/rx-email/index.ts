// Supabase Edge Function: rx-email — email the finalised prescription to the patient as a PDF.
//
// The PDF is generated here, server-side, from the SAVED prescription (via the
// prepare_prescription_email RPC, which runs as the signed-in caller and authorises them),
// so the emailed copy always matches the official record and can't be altered in a browser.
//
// Sent only when the patient has an email on file, agreed to receive email, and has not
// opted out. mode "auto" also needs the hospital's "auto-email prescriptions" switch and never
// sends the same prescription twice; mode "manual" is the doctor/staff "Email prescription" button.
//
// Email: Gmail SMTP (or any SMTP on port 465 — Supabase blocks ports 25 and 587).
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_USER=you@gmail.com
//   SMTP_PASS=<16-character Google App Password>  SMTP_FROM="Clinic Name <you@gmail.com>"
//
// Deploy (CLI):   supabase functions deploy rx-email
// Dashboard:      Edge Functions → Deploy a new function → Via editor → "rx-email", paste this file.
//                 "Verify JWT" stays ON (only signed-in doctors/staff call it).
// Secrets:        SMTP_* above, PROJECT_SERVICE_ROLE_KEY, SITE_URL (optional), ALLOWED_ORIGINS (optional)
// Requires supabase/05_AI_LAYER.sql and 06_RX_EMAIL.sql.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import nodemailer from 'npm:nodemailer@6.9.16'
import { Buffer } from 'node:buffer'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1'

const env = (k: string) => Deno.env.get(k) || ''
const SUPABASE_URL = env('SUPABASE_URL') || 'https://yweywvnivyftwtglxavr.supabase.co'
const SUPABASE_ANON_KEY = env('SUPABASE_ANON_KEY')
const SERVICE_ROLE_KEY = env('PROJECT_SERVICE_ROLE_KEY') || env('SUPABASE_SERVICE_ROLE_KEY')
const SITE_URL = (env('SITE_URL') || 'https://www.medtechfixaters.in').replace(/\/+$/, '')
const ALLOWED_ORIGINS = (env('ALLOWED_ORIGINS') ||
  'https://www.medtechfixaters.in,https://medtechfixaters.in,http://localhost:3000,http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean)

// ─── document shape (from prepare_prescription_email) ───────────────────────

type Med = { name?: string; strength?: string; form?: string; dosage?: string; frequency?: string; duration?: string; route?: string; instructions?: string; instruction?: string; medicine_name?: string }
export type RxDocument = {
  prescription_id: string
  rx_number: string
  version: number
  issued_at: string
  hospital: { name?: string; address?: string; city?: string; state?: string; pincode?: string; phone?: string; email?: string } | null
  doctor: { name?: string; qualification?: string; specialization?: string; registration_number?: string } | null
  patient: { name?: string; patient_number?: string; age?: number; gender?: string } | null
  consultation: { diagnosis?: string; vitals?: Record<string, string> | null; bp?: string; pulse?: string; temp?: string; spo2?: string; weight?: string } | null
  medicines: Med[]
  tests: (string | { name?: string })[]
  advice: string | null
  follow_up: string | null
}

// ─── PDF ────────────────────────────────────────────────────────────────────

/** Standard PDF fonts only cover Latin-1; replace common symbols and drop anything else. */
export function pdfSafe(text: unknown): string {
  return String(text ?? '')
    .replace(/₹/g, 'Rs.').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[•·]/g, '-')
    .replace(/…/g, '...').replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
    .trim()
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = pdfSafe(text).split(' ').filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(test, size) <= width) { line = test; continue }
    if (line) lines.push(line)
    // A single word longer than the column is hard-split.
    let rest = w
    while (font.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
      let cut = rest.length
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--
      lines.push(rest.slice(0, cut))
      rest = rest.slice(cut)
    }
    line = rest
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

const ORANGE = rgb(1, 0.416, 0)
const INK = rgb(0.09, 0.09, 0.09)
const MUTED = rgb(0.42, 0.42, 0.42)
const LINE = rgb(0.88, 0.88, 0.88)

export async function buildPrescriptionPdf(d: RxDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Prescription ${d.rx_number}`)
  pdf.setAuthor(pdfSafe(d.doctor?.name || 'MedTech Fixaters'))
  pdf.setProducer('MedTech Fixaters')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const W = 595.28, H = 841.89, M = 42
  let page: PDFPage = pdf.addPage([W, H])
  let y = H - M

  const text = (s: string, x: number, yy: number, size = 10, f = font, color = INK) =>
    page.drawText(pdfSafe(s), { x, y: yy, size, font: f, color })
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M }
  const need = (h: number) => { if (y - h < M + 40) newPage() }
  const para = (s: string, size = 10, f = font, color = INK, x = M, width = W - 2 * M) => {
    for (const l of wrap(s, f, size, width)) { need(size + 4); text(l, x, y, size, f, color); y -= size + 4 }
  }
  const heading = (s: string) => { need(28); y -= 8; text(s.toUpperCase(), M, y, 9, bold, ORANGE); y -= 14 }

  // Header: clinic (left), doctor (right)
  const h = d.hospital || {}
  text(h.name || 'Clinic', M, y, 16, bold)
  const doc = d.doctor || {}
  const right = (s: string, yy: number, size: number, f: PDFFont, color = INK) => {
    const t = pdfSafe(s)
    text(t, W - M - f.widthOfTextAtSize(t, size), yy, size, f, color)
  }
  right(doc.name || '', y, 11, bold)
  y -= 14
  const addr = [h.address, h.city, h.state, h.pincode].filter(Boolean).join(', ')
  if (addr) text(addr, M, y, 8.5, font, MUTED)
  right([doc.qualification, doc.specialization].filter(Boolean).join(' - '), y, 8.5, font, MUTED)
  y -= 12
  const contact = [h.phone && `Ph: ${h.phone}`, h.email].filter(Boolean).join('  |  ')
  if (contact) text(contact, M, y, 8.5, font, MUTED)
  if (doc.registration_number) right(`Reg. No: ${doc.registration_number}`, y, 8.5, font, MUTED)
  y -= 12
  page.drawRectangle({ x: M, y, width: W - 2 * M, height: 2.5, color: ORANGE })
  y -= 20

  // Patient + prescription details
  const p = d.patient || {}
  const issued = new Date(d.issued_at)
  const issuedStr = isNaN(issued.getTime()) ? '' : issued.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const rows: [string, string, string, string][] = [
    ['Patient', p.name || '-', 'Date', issuedStr],
    ['Age / Sex', [p.age != null ? `${p.age} yrs` : '', p.gender || ''].filter(Boolean).join(' / ') || '-', 'Rx No.', `${d.rx_number}${d.version > 1 ? ` (v${d.version})` : ''}`],
    ['Patient ID', p.patient_number || '-', '', ''],
  ]
  for (const [a, b, c, e] of rows) {
    text(a, M, y, 9, bold, MUTED); text(b, M + 70, y, 10)
    if (c) { text(c, W / 2 + 40, y, 9, bold, MUTED); text(e, W / 2 + 90, y, 10) }
    y -= 15
  }

  const c = d.consultation || {}
  const v = { ...(c.vitals || {}), ...(c.bp ? { bp: c.bp } : {}), ...(c.pulse ? { pulse: c.pulse } : {}), ...(c.temp ? { temp: c.temp } : {}), ...(c.spo2 ? { spo2: c.spo2 } : {}), ...(c.weight ? { weight: c.weight } : {}) } as Record<string, string>
  const vitals = [v.bp && `BP ${v.bp}`, v.pulse && `Pulse ${v.pulse}`, v.temp && `Temp ${v.temp}`, v.spo2 && `SpO2 ${v.spo2}`, v.weight && `Wt ${v.weight}`].filter(Boolean).join('   ')
  if (c.diagnosis || vitals) {
    heading('Diagnosis')
    if (c.diagnosis) para(c.diagnosis, 10.5, bold)
    if (vitals) para(`Vitals: ${vitals}`, 9, font, MUTED)
  }

  // Medicines table
  heading('Rx - Medicines')
  const cols = [
    { label: '#', w: 18 }, { label: 'Medicine', w: 170 }, { label: 'Dosage', w: 62 },
    { label: 'Frequency', w: 70 }, { label: 'Duration', w: 58 }, { label: 'Instructions', w: W - 2 * M - 378 },
  ]
  const drawHeader = () => {
    page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 16, color: rgb(1, 0.965, 0.93) })
    let x = M + 4
    for (const col of cols) { text(col.label, x, y, 8.5, bold, MUTED); x += col.w }
    y -= 18
  }
  if (!d.medicines.length) {
    para('No medicines prescribed.', 10, font, MUTED)
  } else {
    drawHeader()
    d.medicines.forEach((m, i) => {
      const name = [m.name || m.medicine_name, m.strength, m.form].filter(Boolean).join(' ')
      const cells = [String(i + 1), name, m.dosage || '', m.frequency || '', m.duration || '', [m.route, m.instructions || m.instruction].filter(Boolean).join(', ')]
      const wrapped = cells.map((cell, k) => wrap(cell, k === 1 ? bold : font, 9, cols[k].w - 8))
      const h = Math.max(...wrapped.map((w) => w.length)) * 11 + 6
      if (y - h < M + 40) { newPage(); drawHeader() }
      let x = M + 4
      wrapped.forEach((lines, k) => {
        lines.forEach((l, j) => text(l, x, y - j * 11, 9, k === 1 ? bold : font))
        x += cols[k].w
      })
      y -= h
      // Under the row's last text line (baseline + descender), above the next row's text.
      page.drawLine({ start: { x: M, y: y + 13 }, end: { x: W - M, y: y + 13 }, thickness: 0.5, color: LINE })
    })
  }

  const tests = (d.tests || []).map((t) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean)
  if (tests.length) {
    heading('Investigations advised')
    tests.forEach((t) => para(`- ${t}`, 10))
  }
  if (d.advice?.trim()) {
    heading('Advice')
    d.advice.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('[RECOMMENDED DIAGNOSTIC TESTS')).forEach((l) => para(l, 10))
  }
  if (d.follow_up?.trim()) {
    heading('Follow-up')
    para(d.follow_up, 10, bold)
  }

  // Signature + footer on every page
  need(60)
  y -= 30
  right(doc.name || '', y, 10, bold)
  y -= 12
  right('Digitally issued prescription', y, 8, font, MUTED)

  const pages = pdf.getPages()
  pages.forEach((pg, i) => {
    pg.drawLine({ start: { x: M, y: M + 18 }, end: { x: W - M, y: M + 18 }, thickness: 0.5, color: LINE })
    pg.drawText(pdfSafe(`Generated by MedTech Fixaters from the clinic's records. Verify at ${SITE_URL}/rx  |  ${d.rx_number}`), { x: M, y: M + 6, size: 7.5, font, color: MUTED })
    const pn = `Page ${i + 1} of ${pages.length}`
    pg.drawText(pn, { x: W - M - font.widthOfTextAtSize(pn, 7.5), y: M + 6, size: 7.5, font, color: MUTED })
  })

  return await pdf.save()
}

// ─── email ──────────────────────────────────────────────────────────────────

export function emailBody(d: RxDocument) {
  const first = pdfSafe(d.patient?.name || 'there').split(' ')[0] || 'there'
  const clinic = d.hospital?.name || 'your clinic'
  const lines = [
    `Hello ${first},`,
    '',
    `Please find attached your prescription from ${clinic}${d.doctor?.name ? `, issued by ${d.doctor.name}` : ''}.`,
    d.follow_up ? `Follow-up: ${d.follow_up}.` : '',
    '',
    'Please take your medicines exactly as your doctor advised. If you have questions, contact the clinic.',
    '',
    `Prescription number: ${d.rx_number}`,
    '',
    `— ${clinic}`,
  ].filter((l, i, a) => !(l === '' && a[i - 1] === ''))
  return { subject: `Your prescription from ${clinic} (${d.rx_number})`, text: lines.join('\n') }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function sendMail(to: string, subject: string, text: string, pdfBytes: Uint8Array, filename: string) {
  if (!env('SMTP_HOST') || !env('SMTP_USER') || !env('SMTP_PASS') || !env('SMTP_FROM')) {
    return { status: 'not_configured' as const, error: 'SMTP is not configured.' }
  }
  const port = Number(env('SMTP_PORT') || 465)
  if (port === 25 || port === 587) return { status: 'not_configured' as const, error: 'Supabase blocks SMTP ports 25 and 587. Use 465.' }
  const transport = nodemailer.createTransport({
    host: env('SMTP_HOST'), port, secure: port === 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  })
  try {
    const info = await transport.sendMail({
      from: env('SMTP_FROM'), to, subject, text,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#171717">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`,
      attachments: [{ filename, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }],
    })
    return { status: 'sent' as const, messageId: String(info.messageId || '') }
  } catch (e) {
    return { status: 'failed' as const, error: e instanceof Error ? e.message.slice(0, 300) : 'send failed' }
  }
}

// ─── handler ────────────────────────────────────────────────────────────────

const REASON_TEXT: Record<string, string> = {
  no_prescription: 'Complete the consultation first.',
  no_patient: 'No patient record is linked to this visit.',
  no_email: 'No email address on file for this patient.',
  no_consent: 'The patient has not agreed to receive email.',
  invalid_email: 'Please enter a valid email address.',
  auto_off: 'Automatic prescription email is switched off for this hospital.',
  already_sent: 'This prescription was already emailed.',
  too_many: 'This prescription has been emailed too many times today.',
}

export async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed.' }, 405)

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return json({ success: false, error: 'Invalid request.' }, 400) }
  const appointmentId = typeof body.appointment_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.appointment_id) ? body.appointment_id : null
  if (!appointmentId) return json({ success: false, error: 'Missing appointment.' }, 400)
  const mode = body.mode === 'auto' ? 'auto' : 'manual'

  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return json({ success: false, error: 'Not authenticated.' }, 401)

  // Authorisation + saved prescription, checked in the database as the caller.
  const { data: prep, error: prepErr } = await caller.rpc('prepare_prescription_email', {
    p_appointment_id: appointmentId,
    p_email: typeof body.email === 'string' ? body.email.slice(0, 254) : null,
    p_record_consent: body.record_consent === true,
    p_mode: mode,
  })
  if (prepErr) return json({ success: false, error: 'You can’t email this prescription.' }, 403)
  if (!prep?.send) {
    return json({ success: true, sent: false, reason: prep?.reason, message: REASON_TEXT[prep?.reason] || 'Not sent.', recipient_masked: prep?.recipient_masked ?? null })
  }

  const d = prep.document as RxDocument
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const log = (status: string, messageId: string | null, error: string | null) =>
    admin.rpc('record_prescription_email', {
      p_hospital_id: prep.hospital_id, p_prescription_id: d.prescription_id, p_appointment_id: prep.appointment_id,
      p_patient_id: prep.patient_id, p_doctor_id: prep.doctor_id, p_mode: mode, p_recipient_masked: prep.recipient_masked,
      p_status: status, p_provider: 'smtp', p_message_id: messageId, p_error: error, p_sent_by: user.id,
    })

  try {
    const pdfBytes = await buildPrescriptionPdf(d)
    const { subject, text } = emailBody(d)
    const safeName = pdfSafe(d.patient?.name || 'Patient').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40)
    const r = await sendMail(prep.recipient, subject, text, pdfBytes, `Prescription_${d.rx_number}_${safeName}.pdf`)
    await log(r.status, r.status === 'sent' ? r.messageId : null, r.status === 'sent' ? null : r.error)
    if (r.status === 'sent') return json({ success: true, sent: true, recipient_masked: prep.recipient_masked, rx_number: d.rx_number })
    if (r.status === 'not_configured') return json({ success: false, sent: false, error: 'Email is not set up yet (SMTP secrets missing).' }, 503)
    return json({ success: false, sent: false, error: 'The email could not be sent. Please try again.' }, 502)
  } catch (err) {
    console.error('rx-email:', err instanceof Error ? err.message : err)
    await log('failed', null, 'pdf or send error')
    return json({ success: false, sent: false, error: 'The prescription could not be emailed. Please try again.' }, 500)
  }
}

Deno.serve(handle)
