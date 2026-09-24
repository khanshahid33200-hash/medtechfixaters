import { useEffect, useId, useRef, useState } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { searchMedicines, type MedicineSearchResult } from '../../services/medicineService'

interface Props {
  onSelect: (medicine: MedicineSearchResult) => void
  onCreateNew?: (typedName: string) => void
  placeholder?: string
}

const DEBOUNCE_MS = 150

export default function MedicineAutocomplete({ onSelect, onCreateNew, placeholder = 'Search your medicine library…' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MedicineSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const requestSeq = useRef(0)
  const listId = useId()

  // Debounced database search; stale responses are ignored.
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const seq = ++requestSeq.current
    const t = setTimeout(async () => {
      try {
        const rows = await searchMedicines(q, 10)
        if (seq !== requestSeq.current) return
        setResults(rows)
        setError(null)
        setActive(0)
      } catch (e: any) {
        if (seq === requestSeq.current) setError(e.message || 'Search failed')
      } finally {
        if (seq === requestSeq.current) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const choose = (m: MedicineSearchResult) => {
    onSelect(m)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && results[active]) choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && query.trim().length > 0

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          value={query}
          maxLength={100}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
        {loading && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
      </div>

      {showList && (
        <div className="absolute z-40 mt-2 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {error ? (
            <p className="px-4 py-3 text-xs font-semibold text-rose-600">{error}</p>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-4 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">No medicines found</span>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew(query.trim())
                    setOpen(false)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-black flex items-center gap-1 hover:bg-orange-100"
                >
                  <Plus size={14} /> Add New Medicine
                </button>
              )}
            </div>
          ) : (
            <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
              {results.map((m, i) => (
                <li
                  key={m.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(m)
                  }}
                  className={`px-4 py-2.5 cursor-pointer ${i === active ? 'bg-blue-50' : ''}`}
                >
                  <div className="text-sm font-black text-slate-900">
                    {m.medicine_name}
                    {m.brand_name && <span className="ml-1.5 text-xs font-semibold text-slate-400">({m.brand_name})</span>}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {[m.generic_name, m.category || m.drug_type].filter(Boolean).join(' · ') || 'Uncategorised'}
                  </div>
                  {(m.strength || m.dosage_form) && (
                    <div className="text-[11px] font-bold text-blue-600">{[m.strength, m.dosage_form].filter(Boolean).join(' • ')}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
