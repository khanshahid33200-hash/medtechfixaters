import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, Check, AlertTriangle, Loader2, RefreshCw, Info, ShieldAlert, Wand2 } from 'lucide-react'
import {
  AI_UNAVAILABLE, type AdviceResult, type ClinicalDraft, type Confidence, type MedicineSuggestion, type MedicinesResult,
  type TestsResult, generateAdvice, getAiStatus, suggestMedicines, suggestTests,
} from '../../lib/aiAssist'

// Gemini-powered clinical assistance inside the consultation. AI only suggests:
// nothing is added, saved or sent until the doctor explicitly clicks, and added
// medicines still need the doctor's review and Save like any other line.

type Mode = 'medicines' | 'tests' | 'advice'

interface Props {
  mode: Mode
  appointmentId?: string
  buildDraft: () => ClinicalDraft
  addedMedicines?: string[]
  addedTests?: string[]
  onAddMedicine?: (m: MedicineSuggestion) => void
  onAddTests?: (names: string[]) => void
  onUseAdvice?: (text: string) => void
  initialAdviceNote?: string
}

const FLAG: Record<Mode, string> = {
  medicines: 'medicine_suggestions_enabled',
  tests: 'test_suggestions_enabled',
  advice: 'doctor_advice_enabled',
}

const CONF_STYLE: Record<Confidence, string> = {
  HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
}
const CONF_LABEL: Record<Confidence, string> = { HIGH: 'High', MEDIUM: 'Moderate', LOW: 'Low' }

function ConfidenceChip({ c }: { c: Confidence }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${CONF_STYLE[c]}`} title="AI confidence reflects model confidence, not clinical correctness.">
      Confidence: {CONF_LABEL[c]}
    </span>
  )
}

export default function ClinicalAiPanel(props: Props) {
  const { mode, appointmentId, buildDraft } = props
  const [status, setStatus] = useState<'checking' | 'ready' | 'off' | 'not_configured' | 'unknown'>('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meds, setMeds] = useState<MedicinesResult | null>(null)
  const [tests, setTests] = useState<TestsResult | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState(props.initialAdviceNote || '')
  const [advice, setAdvice] = useState<AdviceResult | null>(null)
  const [adviceText, setAdviceText] = useState('')
  const [used, setUsed] = useState(false)
  // Saves tokens: an identical request (nothing changed in the consultation) reuses the last result.
  const [lastKey, setLastKey] = useState<string | null>(null)
  const [unchanged, setUnchanged] = useState(false)

  useEffect(() => {
    let alive = true
    getAiStatus()
      .then((s) => {
        if (!alive) return
        if (!s.flags?.clinical_ai_enabled || !s.flags?.[FLAG[mode]]) setStatus('off')
        else if (!s.gemini_configured) setStatus('not_configured')
        else setStatus('ready')
      })
      .catch(() => alive && setStatus('unknown'))
    return () => { alive = false }
  }, [mode])

  if (status === 'off') return null

  const run = async () => {
    if (!appointmentId) { setError('Open a consultation first.'); return }
    const draft = buildDraft()
    const key = JSON.stringify([mode, draft, mode === 'advice' ? note.trim() : ''])
    const haveResult = mode === 'medicines' ? meds : mode === 'tests' ? tests : advice
    if (key === lastKey && haveResult) {
      setUnchanged(true)
      return
    }
    setUnchanged(false)
    setLoading(true)
    setError(null)
    setUsed(false)
    try {
      if (mode === 'medicines') setMeds(await suggestMedicines(appointmentId, draft))
      else if (mode === 'tests') { setTests(await suggestTests(appointmentId, draft)); setPicked([]) }
      else {
        const r = await generateAdvice(appointmentId, { ...draft, advice_prompt: note })
        setAdvice(r)
        setAdviceText(r.advice)
      }
      setLastKey(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : AI_UNAVAILABLE)
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'medicines' ? 'Suggested Medicines' : mode === 'tests' ? 'Suggested Tests' : 'AI Doctor Advice'
  const buttonLabel = mode === 'advice' ? (advice ? 'Regenerate' : 'Generate Advice') : (mode === 'medicines' ? meds : tests) ? 'Refresh suggestions' : 'Get AI suggestions'

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-4 shadow-[0_12px_40px_-20px_rgba(37,99,235,0.35)] backdrop-blur-xl"
      aria-label={`AI Clinical Assistant: ${title}`}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-300/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-orange-400 text-white shadow-md shadow-blue-500/25">
            <Sparkles size={16} />
          </span>
          <div>
            <h4 className="text-sm font-black text-slate-900">AI Clinical Assistant · {title}</h4>
            <p className="text-[11px] font-semibold text-slate-500">Gemini-powered clinical assistance</p>
          </div>
        </div>
        {status === 'ready' || status === 'unknown' ? (
          <button
            type="button"
            onClick={run}
            disabled={loading || (mode === 'advice' && !note.trim() && !(buildDraft().medicines || []).length)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : mode === 'advice' ? <Wand2 size={13} /> : advice || meds || tests ? <RefreshCw size={13} /> : <Sparkles size={13} />}
            {loading ? 'Thinking…' : buttonLabel}
          </button>
        ) : null}
      </div>

      <p className="relative mt-3 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] font-bold text-amber-800">
        <ShieldAlert size={13} className="shrink-0" /> AI-generated suggestion. Doctor review required.
      </p>

      {status === 'not_configured' && (
        <p className="relative mt-3 text-xs font-semibold text-slate-500">Clinical AI features require Gemini configuration. Ask your platform administrator.</p>
      )}
      {status === 'checking' && <p className="relative mt-3 text-xs text-slate-400">Checking AI availability…</p>}

      {mode === 'advice' && status !== 'not_configured' && (
        <label className="relative mt-3 block space-y-1">
          <span className="text-[11px] font-bold text-slate-600">Doctor’s advice note</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 600))}
            placeholder="e.g. avoid spicy food, take medicines regularly, come for follow-up"
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold"
          />
        </label>
      )}

      {error && <p className="relative mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
      {unchanged && !error && (
        <p className="relative mt-3 text-[11px] font-semibold text-slate-500">Nothing has changed since the last suggestions, so they’re still current. Update the consultation to get new ones.</p>
      )}

      <AnimatePresence mode="wait">
        {mode === 'medicines' && meds && !loading && (
          <motion.div key="meds" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-3 space-y-2">
            {meds.insufficient_information || meds.suggestions.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">Insufficient information for a reliable suggestion. Add the assessment, symptoms or vitals and try again.</p>
            ) : (
              meds.suggestions.map((m) => {
                const added = (props.addedMedicines || []).some((n) => n.toLowerCase() === m.name.toLowerCase())
                return (
                  <div key={m.name} className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-900">{m.name}</p>
                      <ConfidenceChip c={m.confidence} />
                    </div>
                    <p className="mt-1 text-slate-600"><span className="font-bold text-slate-700">Potential medicine to consider:</span> {m.reason}</p>
                    {m.considerations.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-slate-600">{m.considerations.map((c) => <li key={c} className="flex gap-1"><Info size={11} className="mt-0.5 shrink-0 text-blue-500" /> {c}</li>)}</ul>
                    )}
                    {m.warnings.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-orange-700">{m.warnings.map((w) => <li key={w} className="flex gap-1"><AlertTriangle size={11} className="mt-0.5 shrink-0" /> {w}</li>)}</ul>
                    )}
                    {m.alternative && <p className="mt-1.5 text-[11px] text-slate-500">Alternative: {m.alternative}</p>}
                    <button
                      type="button"
                      onClick={() => props.onAddMedicine?.(m)}
                      disabled={added}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 font-bold text-blue-700 transition hover:bg-blue-100 disabled:bg-emerald-50 disabled:text-emerald-700"
                    >
                      {added ? <><Check size={12} /> Added for review</> : <><Plus size={12} /> Add to Prescription</>}
                    </button>
                  </div>
                )
              })
            )}
            <Limitations items={meds.limitations} />
          </motion.div>
        )}

        {mode === 'tests' && tests && !loading && (
          <motion.div key="tests" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-3 space-y-2">
            {tests.insufficient_information || tests.suggestions.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">Insufficient information for a reliable suggestion.</p>
            ) : (
              <>
                {tests.suggestions.map((t) => {
                  const already = (props.addedTests || []).includes(t.name)
                  return (
                    <label key={t.name} className={`flex gap-3 rounded-2xl border bg-white/90 p-3 text-xs ${already ? 'border-emerald-200' : 'border-slate-200'}`}>
                      <input
                        type="checkbox"
                        disabled={already}
                        checked={already || picked.includes(t.name)}
                        onChange={(e) => setPicked((p) => (e.target.checked ? [...p, t.name] : p.filter((x) => x !== t.name)))}
                        className="mt-0.5 h-4 w-4 accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black text-slate-900">{t.name}</span>
                          <ConfidenceChip c={t.confidence} />
                        </div>
                        <p className="mt-0.5 text-slate-600">{t.reason}</p>
                        {t.considerations.length > 0 && <p className="mt-0.5 text-[11px] text-slate-500">{t.considerations.join(' · ')}</p>}
                      </div>
                    </label>
                  )
                })}
                <button
                  type="button"
                  disabled={!picked.length}
                  onClick={() => { props.onAddTests?.(picked); setPicked([]) }}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  <Plus size={12} /> Add Selected Tests{picked.length ? ` (${picked.length})` : ''}
                </button>
              </>
            )}
            <Limitations items={tests.limitations} />
          </motion.div>
        )}

        {mode === 'advice' && advice && !loading && (
          <motion.div key="advice" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">AI Generated Advice (edit before use)</span>
              <ConfidenceChip c={advice.confidence} />
            </div>
            <textarea value={adviceText} onChange={(e) => setAdviceText(e.target.value.slice(0, 1500))} rows={4} className="w-full rounded-xl border border-slate-200 bg-white/90 p-3 text-xs leading-relaxed" />
            {advice.notes_for_doctor.length > 0 && (
              <ul className="space-y-0.5 text-[11px] text-orange-700">{advice.notes_for_doctor.map((n) => <li key={n} className="flex gap-1"><AlertTriangle size={11} className="mt-0.5 shrink-0" /> {n}</li>)}</ul>
            )}
            <button
              type="button"
              disabled={!adviceText.trim()}
              onClick={() => { props.onUseAdvice?.(adviceText.trim()); setUsed(true) }}
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              {used ? <><Check size={12} /> Added to advice</> : 'Use Advice'}
            </button>
            <p className="text-[10px] text-slate-400">Never sent to the patient automatically. It becomes part of the prescription only when you complete the consultation.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {(meds || tests || advice) && (
        <p className="relative mt-3 text-[10px] text-slate-400">AI confidence reflects model confidence, not clinical correctness.</p>
      )}
    </section>
  )
}

function Limitations({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
      <span className="font-bold text-slate-600">Limitations: </span>{items.join(' · ')}
    </div>
  )
}
