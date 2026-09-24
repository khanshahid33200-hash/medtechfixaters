import { useState } from 'react'
import { motion } from 'motion/react'
import { Pill, X, Save, AlertCircle } from 'lucide-react'
import { createMedicine, updateMedicine, type Medicine, type MedicineInput } from '../../services/medicineService'
import { MEDICINE_FIELDS, looksLikeFormula, sanitizeCell } from '../../lib/medicineImport'

interface Props {
  medicine?: Medicine | null
  initialName?: string
  onClose: () => void
  onSaved: (medicine: Medicine) => void
}

const EMPTY: MedicineInput = {
  medicine_name: '', brand_name: null, generic_name: null, drug_type: null, category: null, strength: null,
  dosage_form: null, indications: null, contraindications: null, usage_notes: null, warnings: null,
  default_dosage: null, default_frequency: null, default_duration: null, route: null, special_instructions: null,
  status: 'active',
}

const MAX_LEN = Object.fromEntries(MEDICINE_FIELDS.map((f) => [f.key, f.maxLength])) as Record<string, number>

type TextKey = Exclude<keyof MedicineInput, 'status'>

const SECTIONS: { title: string; fields: { key: TextKey; label: string; multiline?: boolean; placeholder?: string }[] }[] = [
  {
    title: 'Medicine',
    fields: [
      { key: 'medicine_name', label: 'Medicine Name *' },
      { key: 'brand_name', label: 'Brand Name' },
      { key: 'generic_name', label: 'Generic Name' },
      { key: 'drug_type', label: 'Drug Type' },
      { key: 'category', label: 'Category' },
      { key: 'strength', label: 'Strength', placeholder: 'e.g. 500 mg' },
      { key: 'dosage_form', label: 'Dosage Form', placeholder: 'e.g. Tablet' },
      { key: 'route', label: 'Route', placeholder: 'e.g. Oral' },
    ],
  },
  {
    title: 'Your clinical notes',
    fields: [
      { key: 'indications', label: 'Indications', multiline: true },
      { key: 'contraindications', label: 'Contraindications', multiline: true },
      { key: 'usage_notes', label: 'Usage Notes', multiline: true },
      { key: 'warnings', label: 'Warnings', multiline: true },
    ],
  },
  {
    title: 'Prescribing defaults (pre-filled, always reviewed before prescribing)',
    fields: [
      { key: 'default_dosage', label: 'Default Dosage' },
      { key: 'default_frequency', label: 'Default Frequency' },
      { key: 'default_duration', label: 'Default Duration' },
      { key: 'special_instructions', label: 'Special Instructions', multiline: true },
    ],
  },
]

export default function MedicineFormModal({ medicine, initialName, onClose, onSaved }: Props) {
  const [form, setForm] = useState<MedicineInput>(() => {
    if (!medicine) return { ...EMPTY, medicine_name: initialName || '' }
    const { id: _id, created_at: _c, updated_at: _u, is_intentional_duplicate: _d, ...rest } = medicine
    return rest
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const set = (key: TextKey, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const next: Record<string, string> = {}
    for (const section of SECTIONS) {
      for (const { key, label } of section.fields) {
        const v = String(form[key] ?? '')
        if (v.length > (MAX_LEN[key] ?? 2000)) next[key] = `${label.replace(' *', '')} must be ${MAX_LEN[key]} characters or fewer.`
        else if (looksLikeFormula(v)) next[key] = 'Text cannot start with =, + or @.'
        else if (/<[^>]*>/.test(v)) next[key] = 'HTML is not allowed.'
      }
    }
    if (!sanitizeCell(form.medicine_name)) next.medicine_name = 'Medicine name is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    setServerError(null)
    if (!validate()) return
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, k === 'status' ? v : sanitizeCell(v) || null])
    ) as MedicineInput
    setSaving(true)
    try {
      const saved = medicine ? await updateMedicine(medicine.id, payload) : await createMedicine(payload)
      onSaved(saved)
    } catch (e: any) {
      setServerError(e.message || 'Could not save the medicine.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="medicine-form-title">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl bg-white/95 rounded-3xl border border-slate-200 shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Pill size={20} /></span>
            <div>
              <h2 id="medicine-form-title" className="text-base font-black text-slate-900">{medicine ? 'Edit Medicine' : 'Add Medicine'}</h2>
              <p className="text-xs text-slate-500">Saved to your private medicine library. You are responsible for its content.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {serverError}
            </div>
          )}
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">{section.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.fields.map(({ key, label, multiline, placeholder }) => (
                  <label key={key} className={`space-y-1 ${multiline ? 'sm:col-span-2' : ''}`}>
                    <span className="text-[11px] font-bold text-slate-600">{label}</span>
                    {multiline ? (
                      <textarea
                        rows={2}
                        value={form[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)}
                        maxLength={MAX_LEN[key]}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors[key] ? 'border-rose-300' : 'border-slate-200'}`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)}
                        maxLength={MAX_LEN[key]}
                        placeholder={placeholder}
                        autoFocus={key === 'medicine_name'}
                        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${errors[key] ? 'border-rose-300' : 'border-slate-200'}`}
                      />
                    )}
                    {errors[key] && <span className="block text-[11px] font-semibold text-rose-600">{errors[key]}</span>}
                  </label>
                ))}
              </div>
            </section>
          ))}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.status === 'active'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'active' : 'inactive' }))}
              className="rounded border-slate-300 text-blue-600"
            />
            Active (shown in prescription search and suggestions)
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save Medicine'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
