import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, History, Loader2 } from 'lucide-react'
import { listMedicineImports, type MedicineImportRecord } from '../../services/medicineService'

const STATUS: Record<MedicineImportRecord['status'], { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
  completed_with_errors: { label: 'With errors', cls: 'bg-orange-50 text-orange-700' },
  failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-700' },
}

export default function ImportHistory({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<MedicineImportRecord[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listMedicineImports()
      .then((r) => {
        setRows(r)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-2">
        <span className="inline-flex w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 items-center justify-center"><History size={22} /></span>
        <p className="text-xs font-semibold text-slate-500">No imports yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Filename</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Rows</th>
            <th className="px-4 py-3 text-right">Imported</th>
            <th className="px-4 py-3 text-right">Skipped</th>
            <th className="px-4 py-3 text-right">Failed</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr className={r.errors.length ? 'cursor-pointer hover:bg-slate-50' : ''} onClick={() => r.errors.length && setOpen(open === r.id ? null : r.id)}>
                <td className="px-4 py-3 font-bold text-slate-900">
                  <span className="inline-flex items-center gap-1">
                    {r.errors.length > 0 && (open === r.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                    {r.filename}
                  </span>
                  <span className="ml-1 text-[10px] font-black uppercase text-slate-400">{r.file_type}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-bold">{r.total_rows}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{r.successful_rows}{r.updated_rows ? <span className="text-blue-600"> +{r.updated_rows} upd.</span> : null}</td>
                <td className="px-4 py-3 text-right font-bold text-orange-700">{r.skipped_rows}</td>
                <td className="px-4 py-3 text-right font-bold text-rose-700">{r.failed_rows}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></td>
              </tr>
              {open === r.id && (
                <tr>
                  <td colSpan={7} className="px-4 pb-4">
                    <ul className="max-h-56 overflow-y-auto p-3 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                      {r.errors.map((e, i) => <li key={i} className="text-rose-800"><span className="font-black">Row {e.row}:</span> {e.error}</li>)}
                    </ul>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
