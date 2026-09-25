import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Save, Loader2, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { FLAGS, type FlagKey } from './aiFlags'
import AiUsageTable from './AiUsageTable'

type Settings = {
  flags: Record<string, boolean>
  followup_days_before: number
  followup_overdue_days: number
  followup_whatsapp_enabled: boolean
  followup_email_enabled: boolean
  followup_template: string | null
}

const DEFAULTS: Settings = {
  flags: {}, followup_days_before: 1, followup_overdue_days: 2, followup_whatsapp_enabled: true, followup_email_enabled: true, followup_template: null,
}
const SAMPLE_TEMPLATE =
  'Hello {{patient_name}},\nThis is a follow-up reminder from {{clinic_name}}.\nYour doctor recommended a follow-up on {{followup_date}}.\nYou can book your appointment here:\n{{booking_link}}'

// Hospital admin: switch AI features off for this hospital, and configure automatic
// follow-up reminders. Platform-disabled features cannot be switched on here.
export default function HospitalAiSettings() {
  const [hospitalId, setHospitalId] = useState<string | null>(null)
  const [hospitalName, setHospitalName] = useState('Your clinic')
  const [effective, setEffective] = useState<Record<string, boolean>>({})
  const [s, setS] = useState<Settings>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('hospital_id').eq('id', user.id).maybeSingle()
      if (!p?.hospital_id) return
      setHospitalId(p.hospital_id)
      const [{ data: h }, { data: row }, { data: f }] = await Promise.all([
        supabase.from('hospitals').select('name').eq('id', p.hospital_id).maybeSingle(),
        supabase.from('hospital_ai_settings').select('*').eq('hospital_id', p.hospital_id).maybeSingle(),
        supabase.rpc('get_ai_feature_flags'),
      ])
      if (h?.name) setHospitalName(h.name)
      if (row) setS({ ...DEFAULTS, ...row, flags: row.flags || {} })
      setEffective(f || {})
    }
    load()
  }, [])

  // A feature is off at platform level when it is effectively off although this hospital hasn't switched it off.
  const platformOff = (k: FlagKey) => effective[k] === false && s.flags[k] !== false

  const preview = useMemo(() => {
    const t = s.followup_template?.trim() || SAMPLE_TEMPLATE
    return t
      .replace(/\{\{\s*patient_name\s*\}\}/g, 'Ravi')
      .replace(/\{\{\s*clinic_name\s*\}\}/g, hospitalName)
      .replace(/\{\{\s*doctor_name\s*\}\}/g, 'Dr. Sharma')
      .replace(/\{\{\s*followup_date\s*\}\}/g, '28 September 2026')
      .replace(/\{\{\s*followup_token\s*\}\}/g, 'F-021')
      .replace(/\{\{\s*booking_link\s*\}\}/g, `${window.location.origin}/book/…`)
      .replace(/\{\{[^}]*\}\}/g, '')
  }, [s.followup_template, hospitalName])

  const save = async () => {
    if (!hospitalId) return
    setSaving(true)
    setNotice(null)
    const { error } = await supabase.from('hospital_ai_settings').upsert({
      hospital_id: hospitalId,
      flags: s.flags,
      followup_days_before: s.followup_days_before,
      followup_overdue_days: s.followup_overdue_days,
      followup_whatsapp_enabled: s.followup_whatsapp_enabled,
      followup_email_enabled: s.followup_email_enabled,
      followup_template: s.followup_template?.trim() || null,
    })
    setSaving(false)
    if (error) { setNotice(`Could not save: ${error.message}`); return }
    const { data: f } = await supabase.rpc('get_ai_feature_flags')
    setEffective(f || {})
    setNotice('AI settings saved.')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><Sparkles size={18} className="text-orange-500" /> AI features</h2>
        <p className="mt-0.5 text-xs text-slate-500">Switch AI features on or off for {hospitalName}. Features switched off by the platform can’t be turned on here.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {FLAGS.map((f) => {
            const off = platformOff(f.key)
            return (
              <label key={f.key} className={`flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 ${off ? 'opacity-60' : 'cursor-pointer'}`}>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{f.label} <span className="ml-1 rounded bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-500">{f.layer}</span></p>
                  <p className="text-[11px] text-slate-500">{off ? 'Switched off by the platform.' : f.desc}</p>
                </div>
                <input
                  type="checkbox"
                  disabled={off}
                  checked={!off && s.flags[f.key] !== false}
                  onChange={(e) => setS({ ...s, flags: { ...s.flags, [f.key]: e.target.checked } })}
                  className="mt-1 h-5 w-5 accent-indigo-600"
                  aria-label={f.label}
                />
              </label>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Automatic follow-up reminders</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Sent only to patients who agreed to reminders when booking. Email uses the platform’s mail server. WhatsApp will start once a WhatsApp provider is connected; until then those reminders show as “Provider not set up” in the CRM.
          </p>
        </div>
        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Remind this many days before</span>
            <input type="number" min={0} max={14} value={s.followup_days_before} onChange={(e) => setS({ ...s, followup_days_before: Math.max(0, Math.min(14, Number(e.target.value) || 0)) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold" />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Send a missed-follow-up message after (days)</span>
            <input type="number" min={1} max={30} value={s.followup_overdue_days} onChange={(e) => setS({ ...s, followup_overdue_days: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold" />
          </label>
          <label className="flex items-center gap-2 font-bold text-slate-700">
            <input type="checkbox" checked={s.followup_email_enabled} onChange={(e) => setS({ ...s, followup_email_enabled: e.target.checked })} className="h-4 w-4 accent-indigo-600" /> Email reminders
          </label>
          <label className="flex items-center gap-2 font-bold text-slate-700">
            <input type="checkbox" checked={s.followup_whatsapp_enabled} onChange={(e) => setS({ ...s, followup_whatsapp_enabled: e.target.checked })} className="h-4 w-4 accent-indigo-600" /> WhatsApp reminders (when connected)
          </label>
        </div>
        <label className="block space-y-1 text-xs">
          <span className="font-bold text-slate-700">Message template (optional)</span>
          <textarea
            rows={5}
            value={s.followup_template ?? ''}
            onChange={(e) => setS({ ...s, followup_template: e.target.value.slice(0, 1000) })}
            placeholder={SAMPLE_TEMPLATE}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium"
          />
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Info size={11} /> Placeholders: {'{{patient_name}} {{clinic_name}} {{doctor_name}} {{followup_date}} {{followup_token}} {{booking_link}}'}. Don’t include medical advice.
          </span>
        </label>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Preview</p>
          <p className="mt-1 whitespace-pre-line text-slate-700">{preview}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {notice && <span className="text-xs font-semibold text-indigo-700">{notice}</span>}
        <button onClick={save} disabled={saving || !hospitalId} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save AI settings
        </button>
      </div>

      <AiUsageTable days={30} title="AI usage in your hospital" />
    </div>
  )
}
