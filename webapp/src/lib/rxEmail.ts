// Calls the rx-email edge function, which builds the prescription PDF from the saved record
// and emails it to the patient through the clinic's SMTP (Gmail) account.
import { supabase } from './supabase'

export type RxEmailResult = {
  sent: boolean
  reason?: string
  message?: string
  recipient_masked?: string | null
  rx_number?: string
}

export async function emailPrescription(input: {
  appointmentId: string
  mode: 'auto' | 'manual'
  email?: string
  recordConsent?: boolean
}): Promise<RxEmailResult> {
  const { data, error } = await supabase.functions.invoke('rx-email', {
    body: { appointment_id: input.appointmentId, mode: input.mode, email: input.email || null, record_consent: Boolean(input.recordConsent) },
  })
  if (error) {
    let message = 'The prescription could not be emailed. Please try again.'
    try {
      const ctx = (error as { context?: Response }).context
      const parsed = ctx ? await ctx.json() : null
      if (parsed?.error) message = parsed.error
    } catch {
      /* keep the generic message */
    }
    throw new Error(message)
  }
  if (!data?.success) throw new Error(data?.error || 'The prescription could not be emailed.')
  return data as RxEmailResult
}
