// Shared labels for the AI feature switches (see platform_settings['ai_features'] and
// hospital_ai_settings.flags in supabase/05_AI_LAYER.sql).
export type FlagKey =
  | 'ai_booking_enabled' | 'public_ai_chat_enabled' | 'auto_followup_enabled' | 'crm_ai_enabled'
  | 'clinical_ai_enabled' | 'medicine_suggestions_enabled' | 'test_suggestions_enabled' | 'doctor_advice_enabled'

export const FLAGS: { key: FlagKey; label: string; desc: string; layer: 'MedTechFixaters AI' | 'Gemini' }[] = [
  { key: 'ai_booking_enabled', label: 'AI appointment booking', desc: 'Conversational booking on the QR / booking page, using live availability.', layer: 'MedTechFixaters AI' },
  { key: 'public_ai_chat_enabled', label: 'Website visitor assistant', desc: 'Answers from approved public information only.', layer: 'MedTechFixaters AI' },
  { key: 'auto_followup_enabled', label: 'Automatic follow-up reminders', desc: 'Email (and WhatsApp once a provider is connected) to patients who agreed.', layer: 'MedTechFixaters AI' },
  { key: 'crm_ai_enabled', label: 'CRM assistance', desc: 'Suggested next actions and reminder drafts in the CRM.', layer: 'MedTechFixaters AI' },
  { key: 'clinical_ai_enabled', label: 'Clinical AI (master switch)', desc: 'Turns all Gemini clinical assistance on or off.', layer: 'Gemini' },
  { key: 'medicine_suggestions_enabled', label: 'Medicine suggestions', desc: 'Doctor reviews and adds each suggestion.', layer: 'Gemini' },
  { key: 'test_suggestions_enabled', label: 'Test suggestions', desc: 'Doctor selects which tests to add.', layer: 'Gemini' },
  { key: 'doctor_advice_enabled', label: 'Doctor advice drafts', desc: 'Turns the doctor’s note into patient-friendly advice for review.', layer: 'Gemini' },
]

export type UsageRow = { feature: string; status: string; latency_ms: number | null; created_at: string; metadata?: { tokens?: { total?: number } } | null }

export function summariseUsage(rows: UsageRow[]) {
  const by: Record<string, { total: number; success: number; failed: number; limited: number; latency: number[]; tokens: number; tokenCalls: number }> = {}
  for (const r of rows) {
    const s = (by[r.feature] ||= { total: 0, success: 0, failed: 0, limited: 0, latency: [], tokens: 0, tokenCalls: 0 })
    s.total++
    if (r.status === 'success') s.success++
    else if (r.status === 'rate_limited') s.limited++
    else if (r.status !== 'blocked' && r.status !== 'disabled') s.failed++
    if (r.latency_ms != null) s.latency.push(r.latency_ms)
    const t = Number(r.metadata?.tokens?.total)
    if (Number.isFinite(t) && t > 0) { s.tokens += t; s.tokenCalls++ }
  }
  return Object.entries(by)
    .map(([feature, s]) => ({
      feature, total: s.total, success: s.success, failed: s.failed, limited: s.limited,
      avgMs: s.latency.length ? Math.round(s.latency.reduce((a, b) => a + b, 0) / s.latency.length) : null,
      tokens: s.tokens,
      avgTokens: s.tokenCalls ? Math.round(s.tokens / s.tokenCalls) : null,
    }))
    .sort((a, b) => b.total - a.total)
}

export const FEATURE_LABEL: Record<string, string> = {
  public_chat: 'Website assistant', auto_followup: 'Follow-up dispatcher', clinical_medicines: 'Medicine suggestions',
  clinical_tests: 'Test suggestions', clinical_advice: 'Doctor advice',
}
