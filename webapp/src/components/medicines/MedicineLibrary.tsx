import { useCallback, useEffect, useState } from 'react'
import { Search, Pencil, Trash2, Power, Pill, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import {
  listMedicines,
  listMedicineCategories,
  updateMedicine,
  deleteMedicine,
  type Medicine,
} from '../../services/medicineService'

interface Props {
  refreshKey: number
  onEdit: (m: Medicine) => void
}

const PAGE_SIZE = 25

export default function MedicineLibrary({ refreshKey, onEdit }: Props) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('all')
  const [sort, setSort] = useState<'name' | 'recent'>('name')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<Medicine[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => setPage(0), [debounced, category, status, sort])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMedicines({ search: debounced, category, status, sort, page, pageSize: PAGE_SIZE })
      setRows(res.rows)
      setTotal(res.total)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [debounced, category, status, sort, page])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  useEffect(() => {
    listMedicineCategories().then(setCategories).catch(() => setCategories([]))
  }, [refreshKey])

  const toggleStatus = async (m: Medicine) => {
    setBusyId(m.id)
    try {
      await updateMedicine(m.id, { status: m.status === 'active' ? 'inactive' : 'active' })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (m: Medicine) => {
    if (!window.confirm(`Delete "${m.medicine_name}" from your library?\n\nPast prescriptions keep their own copy and are not affected. Suggestion rules that use this medicine will be removed.`)) return
    setBusyId(m.id)
    try {
      await deleteMedicine(m.id)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines..."
            maxLength={100}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700" aria-label="Drug type or category">
            <option value="">All drug types / categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700" aria-label="Status">
            <option value="all">Active & inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <button
            type="button"
            onClick={() => setSort(sort === 'recent' ? 'name' : 'recent')}
            className={`px-3 py-2 rounded-xl border text-xs font-bold ${sort === 'recent' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            Recently added
          </button>
          <span className="ml-auto self-center text-xs font-bold text-slate-400">{total} medicine{total === 1 ? '' : 's'}</span>
        </div>
      </div>

      {error && <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <span className="inline-flex w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center"><Pill size={22} /></span>
            <p className="text-sm font-black text-slate-800">{debounced || category || status !== 'all' ? 'No medicines match these filters' : 'Your medicine library is empty'}</p>
            <p className="text-xs text-slate-500">Add medicines one by one or import a CSV / Excel file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Indications</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="text-sm font-black text-slate-900">
                        {m.medicine_name}
                        {m.brand_name && <span className="ml-1.5 text-xs font-semibold text-slate-400">({m.brand_name})</span>}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500">
                        {[m.generic_name, m.strength, m.dosage_form].filter(Boolean).join(' • ') || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs font-semibold text-slate-600">{[m.drug_type, m.category].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 max-w-xs truncate" title={m.indications || ''}>{m.indications || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => onEdit(m)} className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50" aria-label={`Edit ${m.medicine_name}`}><Pencil size={15} /></button>
                        <button type="button" disabled={busyId === m.id} onClick={() => toggleStatus(m)} className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50" aria-label={m.status === 'active' ? `Deactivate ${m.medicine_name}` : `Activate ${m.medicine_name}`} title={m.status === 'active' ? 'Deactivate' : 'Activate'}><Power size={15} /></button>
                        <button type="button" disabled={busyId === m.id} onClick={() => remove(m)} className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${m.medicine_name}`}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs font-bold text-slate-500">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="flex items-center gap-1 disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
            <span>Page {page + 1} of {pages}</span>
            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="flex items-center gap-1 disabled:opacity-40">Next <ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
