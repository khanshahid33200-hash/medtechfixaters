// Supabase Edge Function: public-assistant
//
// MedTechFixaters AI for website visitors — built in, no external AI model, no API key.
// Every answer is either an approved, published entry from public_ai_knowledge or one of the
// fixed safety messages below. It cannot read private tables, so it cannot leak patient,
// revenue, staff or security data, and prompt-injection text has nothing to act on.
//
// Deploy (CLI):   supabase functions deploy public-assistant --no-verify-jwt
// Dashboard:      Edge Functions → Deploy a new function → Via editor → name "public-assistant",
//                 paste this file, then turn OFF "Verify JWT" (website visitors are not logged in).
// Secrets:        PROJECT_SERVICE_ROLE_KEY (already set for admin-ops); ALLOWED_ORIGINS optional.
// Requires supabase/04_AI_FEATURES.sql and 05_AI_LAYER.sql.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://yweywvnivyftwtglxavr.supabase.co'
const SERVICE_ROLE_KEY = Deno.env.get('PROJECT_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://www.medtechfixaters.in,https://medtechfixaters.in,http://localhost:3000,http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean)

const MAX_MESSAGE = 500
const HOURLY_LIMIT = 40

export type Intent = 'secret' | 'injection' | 'private_data' | 'emergency' | 'diagnosis' | 'greeting' | 'demo' | 'question'

export type Reply = {
  answer: string
  intent: Intent
  sources: string[]
  links: { label: string; href: string }[]
  suggestions: string[]
}

export const MESSAGES = {
  secret: 'I can’t provide confidential or security-sensitive information.',
  injection: 'I can’t do that. I can only answer questions about MedTechFixaters from approved public information.',
  private_data: 'I can’t share private information such as patient records, appointments, staff details or business figures. Please contact the clinic or the MedTechFixaters team directly.',
  emergency: 'This sounds like it could be urgent. Please call 112 or go to the nearest emergency department now. I can’t assess symptoms.',
  diagnosis: 'I can provide general information about MedTechFixaters, but I can’t diagnose conditions or recommend treatment. Please consult a qualified doctor. You can book an appointment through your clinic’s MedTechFixaters booking link.',
  greeting: 'Hello! I’m the MedTechFixaters assistant. Ask me about QR booking, the live queue, the doctor workspace, data security, pricing, or booking a demo.',
  fallback: 'I don’t have approved information about that yet. You can call or WhatsApp +91 95878 67559, email contact@medtechfixaters.in, or book a free demo.',
  disabled: 'The assistant is switched off right now. You can reach the team at contact@medtechfixaters.in.',
  rate_limited: 'You’ve sent a lot of messages. Please wait a little and try again, or email contact@medtechfixaters.in.',
}

const DEFAULT_SUGGESTIONS = ['How does QR booking work?', 'Is patient data kept separate?', 'Can individual doctors use it?', 'How do I book a demo?']

const RULES: { intent: Intent; re: RegExp }[] = [
  // Order matters: security first, then clinical safety, then routing.
  { intent: 'injection', re: /\b(ignore|disregard|forget|override)\b.{0,40}\b(instructions?|rules?|prompt|previous|above|system)\b|\bsystem prompt\b|\bdeveloper mode\b|\bjailbreak\b|\byou are now\b|\bact as (an? )?(admin|developer|system)\b|\breveal\b.{0,30}\b(prompt|instructions?|database|schema|tables?|config)/i },
  { intent: 'secret', re: /\b(api[\s_-]?keys?|passwords?|passcodes?|secrets?|service[\s_-]?role|jwt|bearer|access tokens?|auth tokens?|private keys?|credentials?|env(ironment)?[\s_-]?(var|variable)s?|connection strings?|database (url|password|host)|supabase (url|key|anon|service)|admin (login|account|credentials?)|ssh)\b/i },
  // Requests to SEE or EXTRACT private data. Questions about how data is protected are fine.
  { intent: 'private_data', re: /\b(show|give|list|send|share|export|download|dump|get|access|display|fetch)\b[^.?!]{0,25}\b(patients?|appointments?|bookings?|medical records?|users?|staff|doctors?|admins?)('s)?\s+(list|records?|data|details|names?|numbers?|phones?|emails?|history|reports?|addresses?)\b|\b(what|how much) (is|was|are|were)\b[^.?!]{0,25}\b(revenue|earnings|income|profit|turnover|collections?)\b|\b(your|their|hospital'?s|clinic'?s|doctor'?s)\s+(revenue|earnings|income|profit|turnover)\b|\b(phone|mobile|contact|whatsapp) (number|no\.?) of (a |the )?(patient|staff|admin|user)\b|\bwho (visited|booked|came)\b|\b(patient|user) (named|called)\b/i },
  { intent: 'emergency', re: /\b(chest pain|heart attack|can'?t breathe|cannot breathe|difficulty breathing|unconscious|not breathing|stroke|seizure|severe bleeding|bleeding heavily|suicid\w*|kill myself|overdose|poison(ed|ing)?)\b/i },
  { intent: 'diagnosis', re: /\bwhat (disease|illness|condition|infection) (do|might|could) i have\b|\bdiagnos\w*\b|\b(should|can) i take\b|\bwhich (medicine|tablet|drug)\b|\bdose of\b|\bdosage\b|\bis (it|this) (cancer|serious|dangerous)\b|\bmy (symptoms?|pain|fever)\b/i },
  { intent: 'demo', re: /\b(demo|trial|walkthrough|talk to (sales|team)|call ?back)\b/i },
  { intent: 'greeting', re: /^\s*(hi|hello|hey|namaste|good (morning|afternoon|evening))\b[\s!.?]*$/i },
]

export function sanitize(input: unknown): string {
  if (typeof input !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE)
}

export function classify(text: string): Intent {
  for (const r of RULES) if (r.re.test(text)) return r.intent
  return 'question'
}

type KnowledgeHit = { title: string; content: string; source_type: string; score: number }

// Builds the reply. Answers are copied from approved knowledge, never generated.
export function compose(intent: Intent, hits: KnowledgeHit[]): Reply {
  const base = { intent, sources: [] as string[], links: [] as { label: string; href: string }[], suggestions: DEFAULT_SUGGESTIONS }
  if (intent === 'secret' || intent === 'injection' || intent === 'private_data') return { ...base, answer: MESSAGES[intent], suggestions: DEFAULT_SUGGESTIONS }
  if (intent === 'emergency') return { ...base, answer: MESSAGES.emergency, suggestions: [] }
  if (intent === 'diagnosis') return { ...base, answer: MESSAGES.diagnosis }
  if (intent === 'greeting') return { ...base, answer: MESSAGES.greeting }

  const best = hits.filter((h) => h.score >= 0.05).slice(0, 2)
  const links: { label: string; href: string }[] = []
  if (intent === 'demo' || best.some((h) => /demo/i.test(h.title))) links.push({ label: 'Book a free demo', href: '/book-demo' })
  if (best.some((h) => h.source_type === 'pricing')) links.push({ label: 'See pricing', href: '/pricing' })

  if (!best.length) {
    return { ...base, answer: MESSAGES.fallback, links: [{ label: 'Book a free demo', href: '/book-demo' }, { label: 'Contact us', href: '/contact' }] }
  }
  const answer = best.length > 1 && best[1].score > best[0].score * 0.8
    ? `${best[0].content}\n\n${best[1].content}`
    : best[0].content
  return { ...base, answer: answer.slice(0, 1500), sources: best.map((h) => h.title), links }
}

// ─── HTTP handler ────────────────────────────────────────────────────────────

let corsHeaders: Record<string, string> = {}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') ?? ''
  corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed.' }, 405)

  const started = Date.now()
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const audit = (status: string, intent: Intent | null, extra: Record<string, unknown> = {}) =>
    admin.from('ai_requests').insert({
      feature: 'public_chat', provider: 'builtin', status, latency_ms: Date.now() - started,
      completed_at: new Date().toISOString(), metadata: { intent, ...extra },
    }).then(() => undefined, () => undefined)

  try {
    const raw = await req.text()
    if (raw.length > 4000) return json({ success: false, error: 'Message too long.' }, 413)
    let body: Record<string, unknown> = {}
    try { body = JSON.parse(raw || '{}') } catch { return json({ success: false, error: 'Invalid request.' }, 400) }

    const message = sanitize(body.message)
    if (message.length < 1) return json({ success: false, error: 'Please type a question.' }, 400)

    const { data: flags } = await admin.rpc('get_ai_feature_flags', { p_hospital_id: null })
    if (!flags?.public_ai_chat_enabled) {
      await audit('disabled', null)
      return json({ success: true, reply: { ...compose('greeting', []), answer: MESSAGES.disabled, suggestions: [] } })
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const { data: allowed } = await admin.rpc('ai_rate_limit_hit', { p_bucket: `chat:ip:${await sha256(ip)}`, p_limit: HOURLY_LIMIT })
    if (allowed !== true) {
      await audit('rate_limited', null)
      return json({ success: false, error: MESSAGES.rate_limited }, 429)
    }

    const intent = classify(message)
    let hits: KnowledgeHit[] = []
    if (intent === 'question' || intent === 'demo') {
      const { data, error } = await admin.rpc('search_public_knowledge', { p_query: message, p_hospital_id: null, p_limit: 3 })
      if (error) throw new Error(error.message)
      hits = (data || []) as KnowledgeHit[]
    }
    const reply = compose(intent, hits)
    await audit(['secret', 'injection', 'private_data'].includes(intent) ? 'blocked' : 'success', intent, { matched: reply.sources.length })
    return json({ success: true, reply })
  } catch (err) {
    console.error('public-assistant:', err)
    await audit('error', null)
    return json({ success: false, error: 'The assistant is unavailable right now. Please try again shortly.' }, 500)
  }
}

Deno.serve(handle)
