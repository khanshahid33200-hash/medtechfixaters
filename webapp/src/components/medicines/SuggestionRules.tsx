import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Power, ShieldCheck, Loader2, Pencil, X } from 'lucide-react'
import MedicineAutocomplete from './MedicineAutocomplete'
import {
  listSuggestionRules,
  saveSuggestionRule,
  deleteSuggestionRule,
  listClinicalTests,
  listMedicines,
  type ClinicalTest,
  type SuggestionRule,
  type SuggestionType,
  type TriggerType,
} from '../../services/medicineService'

const TRIGGERS: { value: TriggerType; label: string; hint: string }[] = [
  { value: 'SYMPTOM', label: 'Symptom', hint: 'Matches the booking reason / symptoms' },
  { value: 'COMPLAINT', label: 'Complaint', hint: 'Matches the booking reason / symptoms' },
  { value: 'KEYWORD', label: 'Keyword', hint: 'Matches the booking reason / symptoms' },
  { value: 'CONDITION', label: 'Condition', hint: 'Matches known conditions or the reason for visit' },
  { value: 'DOCTOR_DEFINED_CATEGORY', label: 'My category', hint: 'Matches the department or the reason for visit' },
]

interface Draft {
  id?: string
  trigger_type: TriggerType
  trigger_value: string
  suggestion_type: SuggestionType
  suggestion_id: string | null
  suggestion_label: string
  suggestion_text: string
  priority: number
  notes: string
  status: 'active' | 'disabled'
}

const EMPTY: Draft = {
  trigger_type: 'SYMPTOM', trigger_value: '', suggestion_type: 'MEDICINE', suggestion_id: null, suggestion_label: '',
  suggestion_text: '', priority: 100, notes: '', status: 'active',
}

export default function SuggestionRules() {
  const [rules, setRules] = useState<SuggestionRule[]>([])
  const [tests, setTests] = useState<ClinicalTest[]>([])
  const [medNames, setMedNames] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, t] = await Promise.all([listSuggestionRules(), listClinicalTests()])
      setRules(r)
      setTests(t)
      // Resolve medicine names for the rules shown (one page is plenty for labels).
      const ids = new Set(r.filter((x) => x.suggestion_type === 'MEDICINE').map((x) => x.suggestion_id))
      if (ids.size) {
        const { rows } = await listMedicines({ status: 'all', pageSize: 1000 })
        setMedNames(Object.fromEntries(rows.filter((m) => ids.has(m.id)).map((m) => [m.id, [m.medicine_name, m.strength].filter(Boolean).join(' ')])))
      }
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const labelFor = (r: SuggestionRule) =>
    r.suggestion_type === 'MEDICINE'
      ? medNames[r.suggestion_id || ''] || 'Medicine'
      : r.suggestion_type === 'TEST'
        ? tests.find((t) => t.id === r.suggestion_id)?.test_name || 'Test'
        : r.suggestion_text || ''

  const save = async () => {
    if (!draft) return
    if (draft.trigger_value.trim().length < 2) return setError('Enter the trigger word (at least 2 characters).')
    if (draft.suggestion_type !== 'OTHER' && !draft.suggestion_id) return setError('Choose the medicine or test to suggest.')
    if (draft.suggestion_type === 'OTHER' && !draft.suggestion_text.trim()) return setError('Enter the suggestion text.')
    setSaving(true)
    setError(null)
    try {
      await saveSuggestionRule(
        {
          trigger_type: draft.trigger_type,
          trigger_value: draft.trigger_value.trim(),
          suggestion_type: draft.suggestion_type,
          suggestion_id: draft.suggestion_type === 'OTHER' ? null : draft.suggestion_id,
          suggestion_text: draft.suggestion_type === 'OTHER' ? draft.suggestion_text.trim() : null,
          priority: Math.min(1000, Math.max(1, Number(draft.priority) || 100)),
          notes: draft.notes.trim() || null,
          status: draft.status,
        },
        draft.id
      )
      setDraft(null)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (r: SuggestionRule) => {
    try {
      const { trigger_type, trigger_value, suggestion_type, suggestion_id, suggestion_text, priority, notes } = r
      await saveSuggestionRule(
        { trigger_type, trigger_value, suggestion_type, suggestion_id, suggestion_text, priority, notes, status: r.status === 'active' ? 'disabled' : 'active' },
        r.id
      )
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const remove = async (r: SuggestionRule) => {
    if (!window.confirm('Delete this suggestion rule?')) return
    try {
      await deleteSuggestionRule(r.id)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const edit = (r: SuggestionRule) =>
    setDraft({
      id: r.id, trigger_type: r.trigger_type, trigger_value: r.trigger_value, suggestion_type: r.suggestion_type,
      suggestion_id: r.suggestion_id, suggestion_label: labelFor(r), suggestion_text: r.suggestion_text || '',
      priority: r.priority, notes: r.notes || '', status: r.status,
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 rounded-3xl bg-gradient-to-br from-blue-50/80 to-orange-50/60 border border-blue-100">
        <div className="flex gap-3">
          <ShieldCheck className="text-blue-600 shrink-0" />
          <div>
            <h3 className="text-sm font-black text-slate-900">Doctor Decision Support — your rules only</h3>
            <p className="text-xs text-slate-600 max-w-2xl">
              A rule shows a medicine or test from your own library as a <strong>suggestion</strong> when a patient’s booking reason matches the trigger word.
              Suggestions never become prescriptions or test orders on their own — you review and add each one.
            </p>
          </div>
        </div>
        {!draft && (
          <button type="button" onClick={() => setDraft({ ...EMPTY })} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
            <Plus size={15} /> Add Rule
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

      {draft && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">{draft.id ? 'Edit rule' : 'New rule'}</h3>
            <button type="button" onClick={() => setDraft(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Cancel"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">When</span>
              <select value={draft.trigger_type} onChange={(e) => setDraft({ ...draft, trigger_type: e.target.value as TriggerType })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input value={draft.trigger_value} maxLength={120} onChange={(e) => setDraft({ ...draft, trigger_value: e.target.value })} placeholder='e.g. "fever"' className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
              <p className="text-[11px] text-slate-500">{TRIGGERS.find((t) => t.value === draft.trigger_type)?.hint}. Whole-word, case-insensitive.</p>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Suggest</span>
              <select
                value={draft.suggestion_type}
                onChange={(e) => setDraft({ ...draft, suggestion_type: e.target.value as SuggestionType, suggestion_id: null, suggestion_label: '' })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="MEDICINE">A medicine from my library</option>
                <option value="TEST">A test from my test list</option>
                <option value="OTHER">Other (free-text reminder)</option>
              </select>
              {draft.suggestion_type === 'MEDICINE' &&
                (draft.suggestion_id ? (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-bold text-blue-800">
                    {draft.suggestion_label}
                    <button type="button" onClick={() => setDraft({ ...draft, suggestion_id: null, suggestion_label: '' })} className="text-blue-500" aria-label="Change medicine"><X size={14} /></button>
                  </div>
                ) : (
                  <MedicineAutocomplete onSelect={(m) => setDraft({ ...draft, suggestion_id: m.id, suggestion_label: [m.medicine_name, m.strength].filter(Boolean).join(' ') })} />
                ))}
              {draft.suggestion_type === 'TEST' && (
                <select value={draft.suggestion_id || ''} onChange={(e) => setDraft({ ...draft, suggestion_id: e.target.value || null })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                  <option value="">{tests.length ? 'Choose a test…' : 'Add tests in the Tests tab first'}</option>
                  {tests.filter((t) => t.status === 'active').map((t) => <option key={t.id} value={t.id}>{t.test_name}</option>)}
                </select>
              )}
              {draft.suggestion_type === 'OTHER' && (
                <input value={draft.suggestion_text} maxLength={200} onChange={(e) => setDraft({ ...draft, suggestion_text: e.target.value })} placeholder="e.g. Check hydration status" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
              )}
            </div>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600">Priority (1 = shown first)</span>
              <input type="number" min={1} max={1000} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600">Notes (shown with the suggestion)</span>
              <input value={draft.notes} maxLength={1000} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button>
            <button type="button" disabled={saving} onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black disabled:opacity-60">{saving ? 'Saving…' : 'Save Rule'}</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : rules.length === 0 ? (
          <p className="p-8 text-center text-xs font-semibold text-slate-500">No suggestion rules yet. Nothing is suggested during consultations until you create one.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rules.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${r.status === 'disabled' ? 'opacity-60' : ''}`}>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase text-slate-600">{TRIGGERS.find((t) => t.value === r.trigger_type)?.label}</span>
                <span className="text-sm font-black text-slate-900">“{r.trigger_value}”</span>
                <span className="text-xs text-slate-400">suggests</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${r.suggestion_type === 'MEDICINE' ? 'bg-blue-50 text-blue-700' : r.suggestion_type === 'TEST' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>{labelFor(r)}</span>
                <span className="text-[11px] font-bold text-slate-400">priority {r.priority}</span>
                {r.notes && <span className="text-[11px] text-slate-500 truncate max-w-xs">· {r.notes}</span>}
                <div className="ml-auto flex gap-1">
                  <button type="button" onClick={() => edit(r)} className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50" aria-label="Edit rule"><Pencil size={15} /></button>
                  <button type="button" onClick={() => toggle(r)} className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50" aria-label={r.status === 'active' ? 'Disable rule' : 'Enable rule'} title={r.status === 'active' ? 'Disable' : 'Enable'}><Power size={15} /></button>
                  <button type="button" onClick={() => remove(r)} className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label="Delete rule"><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
