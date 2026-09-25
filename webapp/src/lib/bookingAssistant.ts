// MedTechFixaters AI — built-in booking language understanding. Pure functions, no network,
// no external model. It only *reads* the patient's words; every doctor, department, time and
// fee shown to the patient comes from the database (get_booking_availability), never from here.

export type AvailableDoctor = {
  doctor_id: string
  name: string
  specialization: string
  department: string
  department_id: string | null
  fee: number
  hours: string
  first_time: string
  daily_limit: number
  booked: number
  remaining: number
  available: boolean
  reason: 'not_working_day' | 'on_leave' | 'fully_booked' | null
}

// Plain-language words → keys that appear in department / specialisation names.
const SPECIALTY_SYNONYMS: { words: RegExp; keys: string[]; label: string }[] = [
  { words: /\b(dentist|dental|teeth|tooth|gums?|cavity|braces)\b/i, keys: ['dent', 'oral'], label: 'Dental' },
  { words: /\b(skin|derma\w*|rash(es)?|acne|pimples?|eczema|hair ?fall|itch\w*)\b/i, keys: ['derma', 'skin'], label: 'Dermatology' },
  { words: /\b(heart|cardi\w*|bp|blood pressure|palpitations?)\b/i, keys: ['cardi', 'heart'], label: 'Cardiology' },
  { words: /\b(child|children|kids?|baby|babies|infant|paediatric\w*|pediatric\w*)\b/i, keys: ['paed', 'ped', 'child'], label: 'Paediatrics' },
  { words: /\b(bones?|joints?|ortho\w*|fracture|knee|back pain|spine|shoulder)\b/i, keys: ['ortho', 'bone'], label: 'Orthopaedics' },
  { words: /\b(eyes?|vision|ophthal\w*|spectacles|cataract)\b/i, keys: ['ophthal', 'eye'], label: 'Ophthalmology' },
  { words: /\b(ear|nose|throat|ent|sinus|tonsils?)\b/i, keys: ['ent', 'ear', 'otolaryng'], label: 'ENT' },
  { words: /\b(gyn\w*|obstetric\w*|pregnan\w*|women'?s health|periods?|menstrua\w*)\b/i, keys: ['gyn', 'obs', 'women'], label: 'Gynaecology' },
  { words: /\b(neuro\w*|brain|nerves?|migraine|seizures?|epilepsy|headaches?)\b/i, keys: ['neuro'], label: 'Neurology' },
  { words: /\b(stomach|gastro\w*|digest\w*|acidity|liver|abdomen|abdominal)\b/i, keys: ['gastro', 'digest'], label: 'Gastroenterology' },
  { words: /\b(kidneys?|urine|urinary|uro\w*|nephro\w*|prostate)\b/i, keys: ['uro', 'nephro', 'kidney'], label: 'Urology' },
  { words: /\b(lungs?|breathing|asthma|pulmo\w*|chest physician|tb)\b/i, keys: ['pulmo', 'chest', 'respir'], label: 'Pulmonology' },
  { words: /\b(psychiatr\w*|psycholog\w*|mental health|anxiety|depression|stress)\b/i, keys: ['psych', 'mental'], label: 'Psychiatry' },
  { words: /\b(diabet\w*|sugar|thyroid|hormones?|endocrin\w*)\b/i, keys: ['endo', 'diabet'], label: 'Endocrinology' },
  { words: /\b(general|physician|fever|cold|cough|flu|opd|family doctor|gp|medicine)\b/i, keys: ['general', 'medicine', 'opd', 'physician'], label: 'General Medicine' },
]

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export const EMERGENCY_RE =
  /\b(chest pain|heart attack|can'?t breathe|cannot breathe|difficulty breathing|unconscious|not breathing|stroke|seizure|fits|severe bleeding|bleeding heavily|suicid\w*|kill myself|overdose|poison(ed|ing)?|accident|severe burn)\b/i

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Returns an ISO date (YYYY-MM-DD) the patient asked for, or null. Never a past date. */
export function parseDate(text: string, today: Date = new Date()): string | null {
  const t = text.toLowerCase()
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (/\bday after tomorrow\b|\bparso\b/.test(t)) return iso(addDays(base, 2))
  if (/\b(today|tonight|now|abhi|aaj)\b/.test(t)) return iso(base)
  if (/\b(tomorrow|tmrw|tmr)\b/.test(t)) return iso(addDays(base, 1))

  for (let i = 0; i < 7; i++) {
    const name = WEEKDAYS[i]
    if (new RegExp(`\\b(next\\s+)?(${name}|${name.slice(0, 3)})\\b`).test(t)) {
      let diff = (i - base.getDay() + 7) % 7
      if (diff === 0 && /\bnext\b/.test(t)) diff = 7 // "next Monday" said on a Monday
      return iso(addDays(base, diff))
    }
  }

  // 25 sep / 25th september / sep 25 / 25/09 / 25-09-2026
  let day: number | null = null
  let month: number | null = null
  let year: number | null = null
  const dm = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b(?:\s+(\d{4}))?/)
  const md = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:,?\s+(\d{4}))?/)
  const num = t.match(/\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/)
  if (dm) { day = +dm[1]; month = MONTHS.indexOf(dm[2]); year = dm[3] ? +dm[3] : null }
  else if (md) { day = +md[2]; month = MONTHS.indexOf(md[1]); year = md[3] ? +md[3] : null }
  else if (num) { day = +num[1]; month = +num[2] - 1; year = num[3] ? (+num[3] < 100 ? 2000 + +num[3] : +num[3]) : null }
  else {
    const th = t.match(/\b(?:on\s+(?:the\s+)?)?(\d{1,2})(st|nd|rd|th)\b/)
    if (th) { day = +th[1]; month = base.getMonth() }
  }
  if (day === null || month === null || month < 0 || month > 11 || day < 1 || day > 31) return null
  let y = year ?? base.getFullYear()
  let d = new Date(y, month, day)
  if (d.getDate() !== day) return null // e.g. 31 Feb
  if (d < base && year === null) {
    // "25 Jan" in December means next year; "5th" after the 5th means next month
    d = /\bof\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[/.-]/.test(t) ? new Date(++y, month, day) : new Date(y, month + 1, day)
  }
  return d < base ? null : iso(d)
}

export function parseTimePreference(text: string): 'morning' | 'afternoon' | 'evening' | null {
  const t = text.toLowerCase()
  if (/\b(morning|subah)\b|\b\d{1,2}(:\d{2})?\s*a\.?m\b/.test(t)) return 'morning'
  if (/\b(afternoon|noon|lunch)\b/.test(t)) return 'afternoon'
  if (/\b(evening|night|shaam)\b|\b\d{1,2}(:\d{2})?\s*p\.?m\b/.test(t)) return 'evening'
  return null
}

/** Keys for the specialty the patient asked for, matched later against real department names. */
export function parseSpecialty(text: string): { keys: string[]; label: string } | null {
  for (const s of SPECIALTY_SYNONYMS) if (s.words.test(text)) return { keys: s.keys, label: s.label }
  return null
}

export function matchesSpecialty(doc: Pick<AvailableDoctor, 'department' | 'specialization'>, keys: string[]) {
  const hay = `${doc.department} ${doc.specialization}`.toLowerCase()
  return keys.some((k) => hay.includes(k))
}

/** A doctor the patient named ("Dr. Rahul", "Rahul Sharma"), matched only against real doctors. */
export function parseDoctor<T extends { doctor_id: string; name: string }>(text: string, doctors: T[]): T | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z\s]/g, ' ')} `
  let best: { doc: T; score: number } | null = null
  for (const doc of doctors) {
    const parts = doc.name.toLowerCase().replace(/^dr\.?\s*/, '').split(/\s+/).filter((p) => p.length >= 3)
    const score = parts.filter((p) => t.includes(` ${p} `)).length
    if (score > 0 && (!best || score > best.score)) best = { doc, score }
  }
  return best?.doc ?? null
}

export function parsePhone(text: string): string | null {
  // Join digit groups ("98765 43210", "98765-43210") before matching.
  const joined = text.replace(/(\d)[\s-]+(?=\d)/g, '$1')
  const m = joined.match(/(?:\+?91)?([6-9]\d{9})(?!\d)/)
  return m ? m[1] : null
}

export function parseAge(text: string): number | null {
  const m = text.toLowerCase().match(/\b(\d{1,3})\s*(?:years?|yrs?|y\/o|yo)\b|\bage[:\s]+(\d{1,3})\b|^\s*(\d{1,3})\s*$/)
  const n = m ? +(m[1] || m[2] || m[3]) : NaN
  return Number.isFinite(n) && n >= 0 && n <= 120 ? n : null
}

export function parseGender(text: string): 'Male' | 'Female' | 'Other' | null {
  const t = text.toLowerCase().trim()
  // Single letters only count when they are the whole answer ("M"), never inside "I'm".
  if (/\b(female|woman|girl|lady)\b/.test(t) || t === 'f') return 'Female'
  if (/\b(male|man|boy|gent)\b/.test(t) || t === 'm') return 'Male'
  if (/\b(other|non[- ]?binary|prefer not)\b/.test(t)) return 'Other'
  return null
}

export function parseName(text: string): string | null {
  const m = text.match(/\b(?:my name is|name is|i am|i'm|this is|name[:\s])\s*([A-Za-z][A-Za-z.' ]{1,60})/i)
  const raw = (m ? m[1] : text).replace(/\b(and|my|phone|number|age|years?|old|mobile)\b.*$/i, '').trim()
  const clean = raw.replace(/[^A-Za-z.' ]/g, '').replace(/\s+/g, ' ').trim()
  if (clean.length < 2 || clean.split(' ').length > 5) return null
  return clean.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export const UNAVAILABLE_REASON: Record<string, string> = {
  not_working_day: 'not working that day',
  on_leave: 'on leave that day',
  fully_booked: 'fully booked that day',
}
