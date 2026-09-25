import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle2, XCircle, Loader2, Plus, Save, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AiCallError, getAiStatus, type AiStatus } from '../../lib/aiAssist'
import { FLAGS, type FlagKey } from './aiFlags'
import AiUsageTable from './AiUsageTable'

type Knowledge = { id: string; title: string; content: string; keywords: string[]; source_type: string; is_public: boolean; status: string }

// Super admin: platform-wide AI switches, Gemini provider status, usage, and the approved
// public answers the website assistant is allowed to use.
export default function PlatformAiSettings() {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [kb, setKb] = useState<Knowledge[]>([])
  const [editing, setEditing] = useState<Partial<Knowledge> | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadKb = () =>
    supabase.from('public_ai_knowledge').select('id, title, content, keywords, source_type, is_public, status').eq('tenant_type', 'platform').order('title')
      .then(({ data }) => setKb((data || []) as Knowledge[]))

  useEffect(() => {
    supabase.from('platform_settings').select('value').eq('key', 'ai_features').maybeSingle()
      .then(({ data }) => setFlags((data?.value as Record<string, boolean>) || {}))
    getAiStatus(true).then(setStatus, (e) => setStatusError(e instanceof AiCallError ? e.diagnosis : String(e?.message || e)))
    loadKb()
  }, [])

  const toggle = async (key: FlagKey) => {
    if (!flags) return
    const next = { ...flags, [key]: !flags[key] }
    setSaving(key)
    const { error } = await supabase.from('platform_settings').upsert({ key: 'ai_features', value: next, updated_at: new Date().toISOString() })
    setSaving(null)
    if (error) setMessage(`Could not save: ${error.message}`)
    else setFlags(next)
  }

  const saveKb = async () => {
    if (!editing?.title?.trim() || !editing.content?.trim()) return
    const row = {
      tenant_type: 'platform', tenant_id: null, source_type: editing.source_type || 'faq',
      title: editing.title.trim(), content: editing.content.trim(),
      keywords: (editing.keywords || []).map((k) => k.trim()).filter(Boolean),
      is_public: editing.is_public ?? true, status: editing.status || 'published',
    }
    const { error } = editing.id
      ? await supabase.from('public_ai_knowledge').update(row).eq('id', editing.id)
      : await supabase.from('public_ai_knowledge').insert(row)
    if (error) setMessage(`Could not save answer: ${error.message}`)
    else { setEditing(null); setMessage('Answer saved.'); loadKb() }
  }

  const togglePublish = async (k: Knowledge) => {
    const next = k.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase.from('public_ai_knowledge').update({ status: next }).eq('id', k.id)
    if (!error) loadKb()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-indigo-200/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-base font-black text-slate-900"><Sparkles size={17} className="text-orange-500" /> AI configuration</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status?.gemini_configured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {status ? (status.gemini_configured ? <CheckCircle2 size={13} /> : <XCircle size={13} />) : <Loader2 size={13} className="animate-spin" />}
            {statusError ? 'ai-assist not reachable' : !status ? 'Checking Gemini…' : status.gemini_configured ? `Gemini configured · ${status.model}` : 'Gemini key not set (GEMINI_API_KEY)'}
          </span>
        </div>
        {statusError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{statusError}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">Platform switches apply to every hospital. Hospitals can switch features off for themselves but never on when they are off here.</p>
        {message && <p className="mt-2 text-xs font-semibold text-indigo-700">{message}</p>}
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {FLAGS.map((f) => (
            <label key={f.key} className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div>
                <p className="text-xs font-extrabold text-slate-900">{f.label} <span className="ml-1 rounded bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-500">{f.layer}</span></p>
                <p className="text-[11px] text-slate-500">{f.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(flags?.[f.key])}
                disabled={!flags || saving === f.key}
                onChange={() => toggle(f.key)}
                className="mt-1 h-5 w-5 accent-indigo-600"
                aria-label={f.label}
              />
            </label>
          ))}
        </div>
      </div>

      <AiUsageTable days={7} title="AI usage (all hospitals)" />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Website assistant: approved answers</p>
            <p className="text-[11px] text-slate-500">The assistant can only answer from published answers here. Never put private or internal information in them.</p>
          </div>
          <button onClick={() => setEditing({ is_public: true, status: 'published', source_type: 'faq', keywords: [] })} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
            <Plus size={13} /> New answer
          </button>
        </div>

        {editing && (
          <div className="mt-4 space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs">
            <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value.slice(0, 200) })} placeholder="Question / title" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold" />
            <textarea value={editing.content || ''} onChange={(e) => setEditing({ ...editing, content: e.target.value.slice(0, 2000) })} rows={4} placeholder="Approved answer (public information only)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
            <input value={(editing.keywords || []).join(', ')} onChange={(e) => setEditing({ ...editing, keywords: e.target.value.split(',') })} placeholder="Keywords, comma separated" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
            <div className="flex gap-2">
              <button onClick={saveKb} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 font-bold text-white"><Save size={12} /> Save</button>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white px-3 py-2 font-bold text-slate-600">Cancel</button>
            </div>
          </div>
        )}

        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
          {kb.map((k) => (
            <li key={k.id} className="flex items-start justify-between gap-3 p-3 text-xs">
              <button onClick={() => setEditing(k)} className="min-w-0 text-left">
                <p className="font-extrabold text-slate-900">{k.title}</p>
                <p className="line-clamp-2 text-slate-500">{k.content}</p>
              </button>
              <button onClick={() => togglePublish(k)} className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-bold ${k.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {k.status === 'published' ? <><Eye size={12} /> Published</> : <><EyeOff size={12} /> Draft</>}
              </button>
            </li>
          ))}
          {!kb.length && <li className="p-3 text-xs italic text-slate-400">No answers yet. Run 05_AI_LAYER.sql to add the starter set.</li>}
        </ul>
      </div>
    </div>
  )
}
