// Browser-side calls to the `ai-assist` edge function (Gemini-powered clinical assistance).
// The Gemini API key lives only in that function; nothing here talks to the AI provider directly.
import { supabase } from './supabase'

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type ClinicalDraft = {
  chief_complaint?: string
  diagnosis?: string
  clinical_notes?: string
  vitals?: Record<string, string>
  selected_tests?: string[]
  medicines?: { name: string; dosage?: string; frequency?: string; duration?: string }[]
  advice_prompt?: string
}

export type MedicineSuggestion = {
  name: string; reason: string; confidence: Confidence; considerations: string[]; warnings: string[]; alternative: string
}
export type TestSuggestion = { name: string; reason: string; confidence: Confidence; considerations: string[] }
export type MedicinesResult = { insufficient_information: boolean; suggestions: MedicineSuggestion[]; limitations: string[] }
export type TestsResult = { insufficient_information: boolean; suggestions: TestSuggestion[]; limitations: string[] }
export type AdviceResult = { advice: string; confidence: Confidence; notes_for_doctor: string[] }

export type AiStatus = { gemini_configured: boolean; model: string; flags: Record<string, boolean> }

export const AI_UNAVAILABLE = 'AI assistance is temporarily unavailable. You can continue manually.'

/** Error from the ai-assist function, with a plain-language diagnosis for admins. */
export class AiCallError extends Error {
  constructor(message: string, public diagnosis: string, public status?: number) { super(message) }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  let data: any = null
  let error: any = null

  try {
    const res = await supabase.functions.invoke('ai-assist', { body })
    data = res.data
    error = res.error
  } catch (err: any) {
    error = err
  }

  // Localhost development fallback via Vite server proxy if Edge Function is CORS-blocked
  if (error && typeof window !== 'undefined' && (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin))) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const proxyRes = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json()
        if (proxyData?.success) {
          return proxyData as T
        }
      }
    } catch {
      // Continue to diagnosis below
    }

    // Direct platform_settings fallback for status check
    if (body.action === 'status') {
      try {
        const { data: ps } = await supabase.from('platform_settings').select('value').eq('key', 'ai_features').maybeSingle()
        return {
          success: true,
          gemini_configured: false,
          model: 'gemini-1.5-flash (Local Dev)',
          flags: (ps?.value as Record<string, boolean>) || {},
        } as unknown as T
      } catch {}
    }
  }

  if (error) {
    const ctx = (error as { context?: Response }).context
    const status = ctx?.status
    let serverMessage = ''
    try {
      const parsed = ctx ? await ctx.clone().json() : null
      serverMessage = parsed?.error || parsed?.msg || parsed?.message || ''
    } catch {
      /* not JSON */
    }
    let diagnosis: string
    if (error.name === 'FunctionsFetchError') {
      diagnosis = `Couldn’t reach ai-assist from ${window.location.origin}. Either it isn’t deployed, or this address is missing from the ALLOWED_ORIGINS secret (CORS).`
    } else if (status === 404) {
      diagnosis = 'ai-assist is not deployed (404). The function name must be exactly “ai-assist”.'
    } else if (status === 401) {
      diagnosis = 'The function rejected the sign-in (401). Sign out and in again; check SUPABASE_ANON_KEY is available to the function.'
    } else if (status === 400 && /unknown action/i.test(serverMessage)) {
      diagnosis = 'An older version of ai-assist is deployed. Paste the latest supabase/functions/ai-assist/index.ts and deploy again.'
    } else if (status && status >= 500 && !serverMessage) {
      diagnosis = `ai-assist crashed (${status}). Open Edge Functions → ai-assist → Logs for the error.`
    } else {
      diagnosis = serverMessage || `ai-assist returned an error${status ? ` (${status})` : ''}.`
    }
    throw new AiCallError(serverMessage || AI_UNAVAILABLE, diagnosis, status)
  }
  if (!data?.success) throw new AiCallError(data?.error || AI_UNAVAILABLE, data?.error || 'ai-assist returned an error.')
  return data as T
}

let statusCache: Promise<AiStatus> | null = null
export function getAiStatus(force = false): Promise<AiStatus> {
  if (!statusCache || force) {
    statusCache = call<AiStatus>({ action: 'status' }).catch((e) => {
      statusCache = null
      throw e
    })
  }
  return statusCache
}

export const suggestMedicines = (appointmentId: string, draft: ClinicalDraft) =>
  call<{ result: MedicinesResult }>({ action: 'clinical_medicines', appointment_id: appointmentId, draft }).then((r) => r.result)

export const suggestTests = (appointmentId: string, draft: ClinicalDraft) =>
  call<{ result: TestsResult }>({ action: 'clinical_tests', appointment_id: appointmentId, draft }).then((r) => r.result)

export const generateAdvice = (appointmentId: string, draft: ClinicalDraft) =>
  call<{ result: AdviceResult }>({ action: 'clinical_advice', appointment_id: appointmentId, draft }).then((r) => r.result)
