import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Power, FlaskConical, Loader2, X } from 'lucide-react'
import { listClinicalTests, saveClinicalTest, deleteClinicalTest, type ClinicalTest } from '../../services/medicineService'
import { looksLikeFormula } from '../../lib/medicineImport'

type Draft = { id?: string; test_name: string; category: string; purpose_notes: string; indication: string; status: 'active' | 'inactive' }
const EMPTY: Draft = { test_name: '', category: '', purpose_notes: '', indication: '', status: 'active' }

export default function TestLibrary() {
  const [tests, setTests] = useState<ClinicalTest[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTests(await listClinicalTests())
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

  const save = async () => {
    if (!draft) return
    if (!draft.test_name.trim()) return setError('Test name is required.')
    if ([draft.test_name, draft.category, draft.purpose_notes, draft.indication].some(looksLikeFormula)) return setError('Text cannot start with =, + or @.')
    setSaving(true)
    setError(null)
    try {
      await saveClinicalTest(
        {
          test_name: draft.test_name.trim(),
          category: draft.category.trim() || null,
          purpose_notes: draft.purpose_notes.trim() || null,
          indication: draft.indication.trim() || null,
          status: draft.status,
        },
        draft.id
      )
      setDraft(null)
      await load()
    } catch (e: any) {
      setError(e.code === '23505' || /already exists/i.test(e.message) ? 'A test with this name already exists.' : e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (t: ClinicalTest) => {
    try {
      await saveClinicalTest({ test_name: t.test_name, category: t.category, purpose_notes: t.purpose_notes, indication: t.indication, status: t.status === 'active' ? 'inactive' : 'active' }, t.id)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const remove = async (t: ClinicalTest) => {
    if (!window.confirm(`Delete "${t.test_name}"? Suggestion rules that use it will be removed.`)) return
    try {
      await deleteClinicalTest(t.id)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const field = (key: keyof Omit<Draft, 'id' | 'status'>, label: string, max: number, multiline = false) =>
    draft && (
      <label className={`space-y-1 ${multiline ? 'md:col-span-2' : ''}`}>
        <span className="text-[11px] font-bold text-slate-600">{label}</span>
        {multiline ? (
          <textarea rows={2} maxLength={max} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" />
        ) : (
          <input maxLength={max} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
        )}
      </label>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 max-w-2xl">Your own list of tests. Suggestion rules can point at these; the consultation screen never orders a test unless you add it.</p>
        {!draft && (
          <button type="button" onClick={() => setDraft({ ...EMPTY })} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
            <Plus size={15} /> Add Test
          </button>
        )}
      </div>
      {error && <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}
      {draft && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">{draft.id ? 'Edit test' : 'New test'}</h3>
            <button type="button" onClick={() => setDraft(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Cancel"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {field('test_name', 'Test Name *', 200)}
            {field('category', 'Category', 120)}
            {field('purpose_notes', 'Purpose / Notes', 2000, true)}
            {field('indication', 'Your indication', 2000, true)}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button>
            <button type="button" disabled={saving} onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black disabled:opacity-60">{saving ? 'Saving…' : 'Save Test'}</button>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : tests.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <span className="inline-flex w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 items-center justify-center"><FlaskConical size={22} /></span>
            <p className="text-xs font-semibold text-slate-500">No tests yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tests.map((t) => (
              <li key={t.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${t.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div>
                  <div className="text-sm font-black text-slate-900">{t.test_name}</div>
                  <div className="text-[11px] font-semibold text-slate-500">{[t.category, t.purpose_notes].filter(Boolean).join(' · ') || '—'}</div>
                </div>
                <div className="ml-auto flex gap-1">
                  <button type="button" onClick={() => setDraft({ id: t.id, test_name: t.test_name, category: t.category || '', purpose_notes: t.purpose_notes || '', indication: t.indication || '', status: t.status })} className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50" aria-label={`Edit ${t.test_name}`}><Pencil size={15} /></button>
                  <button type="button" onClick={() => toggle(t)} className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50" aria-label={t.status === 'active' ? 'Deactivate' : 'Activate'}><Power size={15} /></button>
                  <button type="button" onClick={() => remove(t)} className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${t.test_name}`}><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
