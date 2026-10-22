import { useEffect, useRef, useState } from 'react'
import { Mail, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { emailPrescription } from '../../lib/rxEmail'

// Shown after the consultation is completed. If the hospital has "auto-email prescriptions"
// on and the patient agreed to email, it is sent once automatically. Otherwise the doctor can
// enter the patient's email, confirm the patient agreed, and send it.
export default function EmailPrescriptionCard({ appointmentId }: { appointmentId: string }) {
  const [state, setState] = useState<'checking' | 'idle' | 'sending' | 'sent' | 'error'>('checking')
  const [note, setNote] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const autoTried = useRef(false)

  useEffect(() => {
    if (autoTried.current) return
    autoTried.current = true
    emailPrescription({ appointmentId, mode: 'auto' })
      .then((r) => {
        if (r.sent) { setSentTo(r.recipient_masked || null); setState('sent'); return }
        setState('idle')
        if (r.reason === 'already_sent') { setSentTo(r.recipient_masked || null); setState('sent') }
        else if (r.reason === 'no_consent' && r.recipient_masked) setNote(`Email on file (${r.recipient_masked}), but the patient hasn’t agreed to email yet.`)
      })
      .catch(() => setState('idle'))
  }, [appointmentId])

  const send = async () => {
    setNote(null)
    if (email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())) { setNote('Please enter a valid email address.'); return }
    if (email && !agreed) { setNote('Please confirm the patient agreed to receive their prescription by email.'); return }
    setState('sending')
    try {
      const r = await emailPrescription({ appointmentId, mode: 'manual', email: email.trim() || undefined, recordConsent: Boolean(email && agreed) })
      if (r.sent) { setSentTo(r.recipient_masked || null); setState('sent') }
      else { setState('idle'); setNote(r.message || 'Not sent.') }
    } catch (e) {
      setState('error')
      setNote(e instanceof Error ? e.message : 'The prescription could not be emailed.')
    }
  }

  if (state === 'sent') {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
        <CheckCircle2 size={16} /> Prescription PDF emailed{sentTo ? ` to ${sentTo}` : ''}.
        <button onClick={() => { setState('idle'); setNote(null) }} className="ml-auto text-[11px] font-bold text-emerald-700 underline">Send again</button>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-black text-slate-900"><Mail size={16} className="text-indigo-600" /> Email prescription (PDF)</p>
      {state === 'checking' ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-400"><Loader2 size={13} className="animate-spin" /> Checking email preferences…</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">Sends the saved prescription as a PDF. Leave the email blank to use the patient’s email on file.</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com (optional)"
              aria-label="Patient email"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
            />
            <button onClick={send} disabled={state === 'sending'} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {state === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} {state === 'sending' ? 'Sending…' : 'Email PDF'}
            </button>
          </div>
          {email && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
              The patient agreed to receive their prescription by email
            </label>
          )}
        </>
      )}
      {note && <p className={`flex items-start gap-1.5 text-[11px] font-semibold ${state === 'error' ? 'text-rose-600' : 'text-slate-500'}`}><AlertCircle size={12} className="mt-0.5 shrink-0" /> {note}</p>}
    </div>
  )
}
