import { Check, Pencil, Trash2, AlertTriangle } from 'lucide-react'

export interface PrescriptionDraftItem {
  key: string
  medicine_id?: string | null
  name: string
  strength?: string | null
  dosage: string
  frequency: string
  duration: string
  route: string
  instruction: string
  source: 'library' | 'suggestion' | 'manual'
  confirmed: boolean
  warnings?: string | null
}

interface Props {
  index: number
  item: PrescriptionDraftItem
  onChange: (patch: Partial<PrescriptionDraftItem>) => void
  onRemove: () => void
}

const FIELDS: { key: 'dosage' | 'frequency' | 'duration' | 'route' | 'instruction'; label: string; placeholder: string; span: string }[] = [
  { key: 'dosage', label: 'Dosage', placeholder: 'e.g. 1 tablet', span: 'sm:col-span-2' },
  { key: 'frequency', label: 'Frequency', placeholder: 'e.g. 1-0-1', span: 'sm:col-span-2' },
  { key: 'duration', label: 'Duration', placeholder: 'e.g. 5 days', span: 'sm:col-span-2' },
  { key: 'route', label: 'Route', placeholder: 'e.g. Oral', span: 'sm:col-span-2' },
  { key: 'instruction', label: 'Instructions', placeholder: 'e.g. After food', span: 'sm:col-span-4' },
]

// One prescription line. Library defaults may be pre-filled, but a line only counts as
// prescribed once the doctor has reviewed it and pressed Save (confirmed).
export default function PrescriptionItemCard({ index, item, onChange, onRemove }: Props) {
  const canConfirm = item.dosage.trim() && item.frequency.trim() && item.duration.trim()

  if (item.confirmed) {
    return (
      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0">{index + 1}</span>
          <div className="min-w-0">
            <h4 className="font-black text-sm text-slate-900 truncate">{item.name}{item.strength ? ` ${item.strength}` : ''}</h4>
            <p className="text-xs text-slate-500 font-semibold">
              {[item.dosage, item.frequency, item.duration, item.route].filter(Boolean).join(' • ')}
              {item.instruction && <span className="text-blue-600"> • {item.instruction}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={() => onChange({ confirmed: false })} className="p-2 text-slate-400 hover:text-blue-600" aria-label={`Edit ${item.name}`}><Pencil size={15} /></button>
          <button type="button" onClick={onRemove} className="p-2 text-slate-400 hover:text-rose-600" aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-black text-sm text-slate-900">
            <span className="text-slate-400 mr-1.5">{index + 1}.</span>{item.name}{item.strength ? <span className="text-blue-600"> {item.strength}</span> : null}
          </h4>
          <p className="text-[11px] font-bold text-amber-700">Doctor review required — check every field, then Save.</p>
        </div>
        {item.source !== 'manual' && (
          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-500">
            {item.source === 'suggestion' ? 'From your suggestion rule' : 'From your library'}
          </span>
        )}
      </div>
      {item.warnings && (
        <p className="text-[11px] text-orange-700 flex gap-1"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> {item.warnings}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`space-y-1 ${f.span}`}>
            <span className="text-[10px] font-bold text-slate-600">{f.label}</span>
            <input
              value={item[f.key]}
              maxLength={f.key === 'instruction' ? 500 : 120}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onRemove} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1"><Trash2 size={13} /> Remove</button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onChange({ confirmed: true })}
          title={canConfirm ? '' : 'Dosage, frequency and duration are required'}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1"
        >
          <Check size={13} /> Save
        </button>
      </div>
    </div>
  )
}
