import { ShieldCheck, Plus, Check, AlertTriangle, Info, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ClinicalSuggestions, SuggestedMedicine, SuggestedTest } from '../../services/medicineService'

interface Props {
  mode: 'medicines' | 'tests'
  reason?: string
  suggestions: ClinicalSuggestions | null
  loading: boolean
  unavailable?: boolean
  addedMedicineIds?: Set<string>
  addedTests?: string[]
  onAddMedicine?: (m: SuggestedMedicine) => void
  onAddTest?: (t: SuggestedTest) => void
}

// Shows ONLY items produced by the treating doctor's own suggestion rules. Nothing here
// is applied automatically — each suggestion needs an explicit "Add" by the doctor.
export default function DecisionSupportPanel({
  mode, reason, suggestions, loading, unavailable, addedMedicineIds, addedTests, onAddMedicine, onAddTest,
}: Props) {
  if (unavailable) return null
  const meds = suggestions?.medicines || []
  const tests = suggestions?.tests || []
  const other = suggestions?.other || []
  const items = mode === 'medicines' ? meds : tests

  return (
    <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-orange-50/40 p-4 space-y-3" aria-label="Doctor Decision Support">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><ShieldCheck size={16} /></span>
          <div>
            <h4 className="text-sm font-black text-slate-900">Doctor Decision Support</h4>
            <p className="text-[11px] font-semibold text-slate-500">
              Suggested {mode === 'medicines' ? 'medicines' : 'tests'} based on your configured rules · Review before adding · Doctor confirmation required
            </p>
          </div>
        </div>
        <Link to="/medicines/rules" target="_blank" rel="noopener" className="text-[11px] font-bold text-blue-700 flex items-center gap-1 hover:underline">
          <Settings2 size={12} /> Manage rules
        </Link>
      </div>

      {reason && (
        <p className="text-xs text-slate-700 bg-white/70 border border-slate-100 rounded-xl px-3 py-2">
          <span className="font-black text-slate-500 uppercase text-[10px] tracking-wider mr-1.5">Reason / symptoms from booking</span>
          {reason}
        </p>
      )}

      {loading ? (
        <p className="text-xs font-semibold text-slate-400">Checking your rules…</p>
      ) : items.length === 0 ? (
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Info size={13} /> No configured suggestions match this visit.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mode === 'medicines'
            ? meds.map((m) => {
                const added = addedMedicineIds?.has(m.medicine_id)
                return (
                  <div key={m.medicine_id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-slate-900">{m.name} {m.strength && <span className="text-xs font-bold text-blue-600">{m.strength}</span>}</div>
                        <div className="text-[11px] font-semibold text-slate-500">{[m.category, m.dosage_form, m.generic_name].filter(Boolean).join(' · ') || '—'}</div>
                      </div>
                      <button
                        type="button"
                        disabled={added}
                        onClick={() => onAddMedicine?.(m)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 ${added ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {added ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add to Prescription</>}
                      </button>
                    </div>
                    {m.indications && <p className="text-[11px] text-slate-600"><span className="font-bold">Your indication:</span> {m.indications}</p>}
                    {(m.warnings || m.contraindications) && (
                      <p className="text-[11px] text-orange-700 flex gap-1"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> {[m.warnings, m.contraindications].filter(Boolean).join(' · ')}</p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400">Rule: {m.trigger_value}{m.rule_notes ? ` — ${m.rule_notes}` : ''}</p>
                  </div>
                )
              })
            : tests.map((t) => {
                const added = addedTests?.includes(t.name)
                return (
                  <div key={t.test_id} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-start justify-between gap-2 shadow-sm">
                    <div className="space-y-0.5">
                      <div className="text-sm font-black text-slate-900">{t.name}</div>
                      <div className="text-[11px] font-semibold text-slate-500">{[t.category, t.purpose_notes].filter(Boolean).join(' · ') || '—'}</div>
                      <p className="text-[10px] font-bold text-slate-400">Rule: {t.trigger_value}{t.rule_notes ? ` — ${t.rule_notes}` : ''}</p>
                    </div>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => onAddTest?.(t)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 ${added ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                    >
                      {added ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                    </button>
                  </div>
                )
              })}
        </div>
      )}

      {mode === 'medicines' && other.length > 0 && (
        <ul className="text-[11px] text-slate-600 space-y-0.5">
          {other.map((o) => (
            <li key={o.rule_id} className="flex gap-1.5"><Info size={12} className="text-blue-500 shrink-0 mt-0.5" /> <span><span className="font-bold">{o.name}</span>{o.rule_notes ? ` — ${o.rule_notes}` : ''} <span className="text-slate-400">(reminder: {o.trigger_value})</span></span></li>
          ))}
        </ul>
      )}
    </section>
  )
}
