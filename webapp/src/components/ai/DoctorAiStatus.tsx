import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { getAiStatus, type AiStatus } from '../../lib/aiAssist'
import { FLAGS } from './aiFlags'
import AiUsageTable from './AiUsageTable'

// Doctor settings: which AI assistants are available to this doctor, and their own usage.
export default function DoctorAiStatus() {
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getAiStatus(true).then(setStatus, () => setFailed(true))
  }, [])

  const clinical = FLAGS.filter((f) => f.layer === 'Gemini' || f.key === 'crm_ai_enabled')

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900"><Sparkles size={18} className="text-orange-500" /> AI Assistant</h2>
        <p className="mt-0.5 text-xs text-slate-500">AI suggests; you review and decide. Nothing is added to a prescription or sent to a patient without your click.</p>
        {failed ? (
          <p className="mt-3 text-xs text-slate-500">AI status is unavailable right now.</p>
        ) : (
          <>
            {status && !status.gemini_configured && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Clinical AI features require Gemini configuration. Ask your platform administrator.</p>
            )}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {clinical.map((f) => {
                const on = Boolean(status?.flags?.[f.key]) && (f.layer !== 'Gemini' || Boolean(status?.flags?.clinical_ai_enabled && status?.gemini_configured))
                return (
                  <li key={f.key} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                    <span>
                      <span className="block font-extrabold text-slate-900">{f.label}</span>
                      <span className="text-[10px] text-slate-500">{f.layer === 'Gemini' ? 'Gemini-powered clinical assistance' : 'MedTechFixaters AI'}</span>
                    </span>
                    {status ? (on ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-slate-400" />) : <span className="text-slate-300">…</span>}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
      <AiUsageTable days={30} title="Your AI requests" />
    </section>
  )
}
