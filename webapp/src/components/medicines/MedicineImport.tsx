import { useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, Download, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import {
  MAX_FILE_SIZE,
  MAX_ROWS_PER_IMPORT,
  MEDICINE_FIELDS,
  ImportError,
  autoMapHeaders,
  buildPreview,
  parseSpreadsheet,
  rowsForImport,
  templateCsv,
  type ColumnMapping,
  type DuplicateAction,
  type ImportPreview,
  type MedicineField,
  type ParsedSheet,
} from '../../lib/medicineImport'
import { importMedicines, listMedicineDedupeKeys, type ImportResult } from '../../services/medicineService'

type Step = 'upload' | 'map' | 'preview' | 'done'

interface Props {
  onImported: () => void
  onViewHistory: () => void
}

export default function MedicineImport({ onImported, onViewHistory }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setSheet(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setFileName('')
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const parsed = await parseSpreadsheet(file)
      if (parsed.rows.length === 0) throw new ImportError('The spreadsheet has headers but no medicine rows.')
      setFileName(file.name)
      setSheet(parsed)
      setMapping(autoMapHeaders(parsed.headers))
      setStep('map')
    } catch (e: any) {
      setError(e instanceof ImportError ? e.message : 'The file could not be read.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'medicine-library-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const mappedFields = new Set(Object.values(mapping).filter(Boolean))
  const nameMapped = mappedFields.has('medicine_name')

  const setColumn = (col: number, field: MedicineField | '') => {
    setMapping((prev) => {
      const next = { ...prev }
      // One spreadsheet column per database field.
      if (field) for (const k of Object.keys(next)) if (next[Number(k)] === field) next[Number(k)] = ''
      next[col] = field
      return next
    })
  }

  const goPreview = async () => {
    if (!sheet) return
    setBusy(true)
    setError(null)
    try {
      const keys = await listMedicineDedupeKeys()
      setPreview(buildPreview(sheet, mapping, keys))
      setStep('preview')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const setDupAction = (row: number | 'all', action: DuplicateAction) => {
    setPreview((p) =>
      p ? { ...p, rows: p.rows.map((r) => (r.duplicate && (row === 'all' || r.row === row) ? { ...r, action } : r)) } : p
    )
  }

  const runImport = async () => {
    if (!preview || !sheet) return
    const payload = rowsForImport(preview)
    if (payload.length === 0) {
      setError('There are no rows to import. Fix invalid rows or choose an action for duplicates.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      // Rows rejected in the browser are recorded in the import history too.
      const clientErrors = preview.rows
        .filter((r) => r.errors.length > 0)
        .map((r) => ({ row: r.row, error: r.errors.join('; ') }))
      setResult(await importMedicines(fileName, sheet.kind, payload, clientErrors))
      setStep('done')
      onImported()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const importable = preview ? rowsForImport(preview).length : 0

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFile(e.dataTransfer.files?.[0])
            }}
            className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${dragOver ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 bg-white/80'}`}
          >
            <span className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-orange-50 text-blue-600 items-center justify-center">
              {busy ? <Loader2 className="animate-spin" /> : <UploadCloud size={26} />}
            </span>
            <h3 className="mt-3 text-base font-black text-slate-900">Upload Medicine Spreadsheet</h3>
            <p className="text-xs text-slate-500 mt-1">Drag & drop a CSV / Excel file here</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/20 disabled:opacity-60"
            >
              Choose File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              Supported: CSV, XLSX, XLS · up to {Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB and {MAX_ROWS_PER_IMPORT.toLocaleString()} rows per file
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-slate-500 max-w-xl">
              The first row must contain column names. You review every row before anything is saved, and you are responsible for the clinical content you import.
            </p>
            <button type="button" onClick={downloadTemplate} className="px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 flex items-center gap-1.5 hover:border-blue-300">
              <Download size={14} /> Download Sample Template
            </button>
          </div>
        </div>
      )}

      {step === 'map' && sheet && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-blue-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Map columns — {fileName}</h3>
              <p className="text-xs text-slate-500">
                {sheet.rows.length} row{sheet.rows.length === 1 ? '' : 's'} found.
                {sheet.truncated && <span className="text-orange-600 font-bold"> Only the first {MAX_ROWS_PER_IMPORT.toLocaleString()} rows will be imported — split the file for the rest.</span>}
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
            {sheet.headers.map((h, col) => (
              <div key={col} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5">
                <div className="text-xs font-bold text-slate-800 truncate" title={h}>{h || <em className="text-slate-400">(no header)</em>}</div>
                <ArrowRight size={14} className="hidden sm:block text-slate-300" />
                <select
                  value={mapping[col] || ''}
                  onChange={(e) => setColumn(col, e.target.value as MedicineField | '')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold ${mapping[col] ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                  <option value="">Don’t import</option>
                  {MEDICINE_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {!nameMapped && <p className="text-xs font-bold text-orange-600">Map one column to “Medicine Name” to continue.</p>}
          <div className="flex justify-between">
            <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1"><ArrowLeft size={14} /> Choose another file</button>
            <button type="button" disabled={!nameMapped || busy} onClick={goPreview} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Validate & Preview <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900">Import Preview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Total Rows', value: preview.total, cls: 'bg-slate-50 text-slate-800' },
              { label: 'Valid Rows', value: preview.valid, cls: 'bg-emerald-50 text-emerald-700' },
              { label: 'Duplicates', value: preview.duplicates, cls: 'bg-orange-50 text-orange-700' },
              { label: 'Invalid Rows', value: preview.invalid, cls: 'bg-rose-50 text-rose-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl p-3 ${s.cls}`}>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-70">{s.label}</div>
                <div className="text-xl font-black">{s.value}</div>
              </div>
            ))}
          </div>

          {preview.duplicates > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-orange-50/70 border border-orange-100 text-xs">
              <span className="font-black text-orange-800">Duplicate detected — for all duplicates:</span>
              {(['skip', 'update', 'separate'] as DuplicateAction[]).map((a) => (
                <button key={a} type="button" onClick={() => setDupAction('all', a)} className="px-2.5 py-1 rounded-lg bg-white border border-orange-200 font-bold text-orange-800 hover:bg-orange-100">
                  {a === 'skip' ? 'Skip' : a === 'update' ? 'Update existing' : 'Create as separate entry'}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-96 overflow-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Medicine</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Category</th>
                  <th className="px-3 py-2 hidden md:table-cell">Indications</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.rows.map((r) => (
                  <tr key={r.row} className={r.errors.length ? 'bg-rose-50/40' : r.duplicate ? 'bg-orange-50/40' : ''}>
                    <td className="px-3 py-2 font-bold text-slate-400">{r.row}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">
                      {r.values.medicine_name || '—'}
                      {r.values.strength && <span className="ml-1 font-semibold text-slate-400">{r.values.strength}</span>}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-slate-600">{r.values.category || r.values.drug_type || '—'}</td>
                    <td className="px-3 py-2 hidden md:table-cell text-slate-500 max-w-xs truncate">{r.values.indications || '—'}</td>
                    <td className="px-3 py-2">
                      {r.errors.length > 0 ? (
                        <span className="text-rose-700 font-bold">{r.errors.join('; ')}</span>
                      ) : r.duplicate ? (
                        <select value={r.action} onChange={(e) => setDupAction(r.row, e.target.value as DuplicateAction)} className="px-2 py-1 rounded-lg border border-orange-200 bg-white text-[11px] font-bold text-orange-800">
                          <option value="skip">Duplicate — Skip</option>
                          <option value="update">Update existing</option>
                          <option value="separate">Create as separate entry</option>
                        </select>
                      ) : (
                        <span className="text-emerald-700 font-bold">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" onClick={() => setStep('map')} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1"><ArrowLeft size={14} /> Back to mapping</button>
            <div className="flex gap-2">
              <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button>
              <button type="button" disabled={busy || importable === 0} onClick={runImport} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />} Import Valid Medicines ({importable})
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={28} />
            <div>
              <h3 className="text-base font-black text-slate-900">Import completed</h3>
              <p className="text-xs text-slate-500">{fileName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              ['Imported', result.imported, 'text-emerald-700'],
              ['Updated', result.updated, 'text-blue-700'],
              ['Skipped', result.skipped, 'text-orange-700'],
              ['Failed', result.failed, 'text-rose-700'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="rounded-2xl bg-slate-50 p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
                <div className={`text-xl font-black ${cls}`}>{value}</div>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <ul className="max-h-48 overflow-y-auto text-xs space-y-1 p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
              {result.errors.map((e, i) => <li key={i} className="text-rose-800"><span className="font-black">Row {e.row}:</span> {e.error}</li>)}
            </ul>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black">Import another file</button>
            <button type="button" onClick={onViewHistory} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">View import history</button>
          </div>
        </div>
      )}
    </div>
  )
}
