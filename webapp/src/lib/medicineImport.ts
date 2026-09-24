// Spreadsheet import for the doctor's medicine library.
//
// Uploaded files are untrusted: the type is detected from the file's bytes (not its
// extension), size / row / cell limits are enforced while parsing, formulas and HTML are
// never evaluated or rendered, and every row is validated again server-side by the
// import_medicines() RPC before anything is written.

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_ROWS_PER_IMPORT = 2000 // must not exceed c_max_rows in import_medicines()
export const MAX_COLUMNS = 60

export type FileKind = 'csv' | 'xlsx' | 'xls'

export type MedicineField =
  | 'medicine_name' | 'brand_name' | 'generic_name' | 'drug_type' | 'category' | 'strength' | 'dosage_form'
  | 'indications' | 'contraindications' | 'usage_notes' | 'warnings' | 'default_dosage' | 'default_frequency'
  | 'default_duration' | 'route' | 'special_instructions' | 'status'

export interface FieldDef {
  key: MedicineField
  label: string
  maxLength: number
  required?: boolean
  aliases: string[]
}

// Aliases are compared after lower-casing and stripping non-alphanumerics.
export const MEDICINE_FIELDS: FieldDef[] = [
  { key: 'medicine_name', label: 'Medicine Name', maxLength: 200, required: true, aliases: ['medicine name', 'medicine', 'tablet name', 'drug name', 'drug', 'name', 'product name', 'item name'] },
  { key: 'brand_name', label: 'Brand Name', maxLength: 200, aliases: ['brand name', 'brand', 'trade name'] },
  { key: 'generic_name', label: 'Generic Name', maxLength: 200, aliases: ['generic name', 'generic', 'salt', 'salt name', 'composition', 'molecule'] },
  { key: 'drug_type', label: 'Drug Type', maxLength: 120, aliases: ['drug type', 'type', 'drug class', 'class'] },
  { key: 'category', label: 'Category', maxLength: 120, aliases: ['category', 'therapeutic category', 'group'] },
  { key: 'strength', label: 'Strength', maxLength: 60, aliases: ['strength', 'dose strength', 'power', 'mg'] },
  { key: 'dosage_form', label: 'Dosage Form', maxLength: 60, aliases: ['dosage form', 'form', 'formulation'] },
  { key: 'indications', label: 'Indications', maxLength: 2000, aliases: ['indications', 'indication', 'when to use it', 'when to use', 'uses', 'used for'] },
  { key: 'contraindications', label: 'Contraindications', maxLength: 2000, aliases: ['contraindications', 'contraindication', 'do not use', 'avoid in'] },
  { key: 'usage_notes', label: 'Usage Notes', maxLength: 2000, aliases: ['usage notes', 'usage', 'how to use', 'notes', 'note'] },
  { key: 'warnings', label: 'Warnings', maxLength: 2000, aliases: ['warnings', 'warning', 'precautions', 'side effects'] },
  { key: 'default_dosage', label: 'Default Dosage', maxLength: 120, aliases: ['default dosage', 'dosage', 'dose'] },
  { key: 'default_frequency', label: 'Default Frequency', maxLength: 120, aliases: ['default frequency', 'frequency', 'times per day'] },
  { key: 'default_duration', label: 'Default Duration', maxLength: 120, aliases: ['default duration', 'duration', 'days'] },
  { key: 'route', label: 'Route', maxLength: 60, aliases: ['route', 'route of administration'] },
  { key: 'special_instructions', label: 'Special Instructions', maxLength: 1000, aliases: ['special instructions', 'instructions', 'instruction', 'directions'] },
  { key: 'status', label: 'Status', maxLength: 20, aliases: ['status', 'active'] },
]

const FIELD_BY_KEY = Object.fromEntries(MEDICINE_FIELDS.map((f) => [f.key, f])) as Record<MedicineField, FieldDef>
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export class ImportError extends Error {}

/** Detects the real file type from its first bytes; the extension must agree. */
export function detectFileKind(bytes: Uint8Array, fileName: string): FileKind {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0
  if (ext === 'xlsx' && isZip) return 'xlsx'
  if (ext === 'xls' && isOle) return 'xls'
  if (ext === 'csv' && !isZip && !isOle) {
    const sample = bytes.subarray(0, Math.min(bytes.length, 8192))
    if (sample.includes(0)) throw new ImportError('This CSV contains binary data and cannot be imported.')
    return 'csv'
  }
  if (!['csv', 'xlsx', 'xls'].includes(ext)) throw new ImportError('Only .csv, .xlsx and .xls files are supported.')
  throw new ImportError(`The file content does not match its .${ext} extension.`)
}

/** Cell text that would run as a formula when the sheet is opened in Excel / Sheets. */
export const looksLikeFormula = (v: string) => /^\s*[=+@]/.test(v) || /^\s*-\s*[A-Za-z(]/.test(v)

/** Plain text only: trims, removes control characters and HTML tags. */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex -- removing control characters is the point
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ParsedSheet {
  kind: FileKind
  headers: string[]
  rows: string[][] // raw cell text, header row excluded
  truncated: boolean
}

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  if (file.size === 0) throw new ImportError('The file is empty.')
  if (file.size > MAX_FILE_SIZE) {
    throw new ImportError(`The file is larger than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB. Split it into smaller files.`)
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = detectFileKind(bytes, file.name)

  // Loaded on demand so the spreadsheet parser is not part of the main bundle.
  const XLSX = await import('xlsx')
  let workbook
  try {
    workbook = XLSX.read(bytes, {
      type: 'array',
      // Parse one extra row so we can tell the doctor the file was over the limit.
      sheetRows: MAX_ROWS_PER_IMPORT + 2,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      bookVBA: false,
      dense: true,
      raw: kind === 'csv', // keep CSV text exactly as typed (no date/number coercion)
    })
  } catch {
    throw new ImportError('The spreadsheet could not be read. It may be corrupted or password-protected.')
  }
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new ImportError('The spreadsheet has no sheets.')
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })
  if (matrix.length === 0) throw new ImportError('The first sheet is empty.')

  const headers = (matrix[0] || []).slice(0, MAX_COLUMNS).map((h) => sanitizeCell(h).slice(0, 100))
  if (headers.every((h) => !h)) throw new ImportError('The first row must contain column headers.')

  const body = matrix.slice(1).map((r) => headers.map((_, i) => (r[i] === undefined || r[i] === null ? '' : String(r[i]))))
  const truncated = body.length > MAX_ROWS_PER_IMPORT
  return { kind, headers, rows: body.slice(0, MAX_ROWS_PER_IMPORT), truncated }
}

export type ColumnMapping = Record<number, MedicineField | ''>

/** Suggests a database field for each spreadsheet column from its header text. */
export function autoMapHeaders(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<MedicineField>()
  headers.forEach((h, i) => {
    const norm = normalizeHeader(h)
    const match = MEDICINE_FIELDS.find((f) => !used.has(f.key) && (normalizeHeader(f.label) === norm || f.aliases.includes(norm)))
    mapping[i] = match ? match.key : ''
    if (match) used.add(match.key)
  })
  return mapping
}

export type DuplicateAction = 'skip' | 'update' | 'separate'

export interface PreviewRow {
  row: number // 1-based spreadsheet row number (header is row 1)
  values: Partial<Record<MedicineField, string>>
  errors: string[]
  duplicate: boolean
  action: DuplicateAction
}

export interface ImportPreview {
  rows: PreviewRow[]
  total: number
  valid: number
  duplicates: number
  invalid: number
}

export const dedupeKey = (name: string, strength?: string | null, form?: string | null) =>
  `${name.trim().toLowerCase()}|${(strength || '').trim().toLowerCase()}|${(form || '').trim().toLowerCase()}`

/**
 * Applies the column mapping and validates every row. `existingKeys` are the doctor's
 * current medicine dedupe keys; duplicates inside the file are flagged too.
 */
export function buildPreview(sheet: ParsedSheet, mapping: ColumnMapping, existingKeys: Set<string>): ImportPreview {
  const mapped = Object.entries(mapping).filter(([, f]) => f) as [string, MedicineField][]
  const seenInFile = new Set<string>()
  const rows: PreviewRow[] = sheet.rows.map((cells, idx) => {
    const values: Partial<Record<MedicineField, string>> = {}
    const errors: string[] = []
    for (const [col, field] of mapped) {
      const raw = cells[Number(col)] ?? ''
      if (looksLikeFormula(raw)) {
        errors.push(`${FIELD_BY_KEY[field].label} looks like a spreadsheet formula`)
        continue
      }
      const clean = sanitizeCell(raw)
      if (clean.length > FIELD_BY_KEY[field].maxLength) {
        errors.push(`${FIELD_BY_KEY[field].label} is longer than ${FIELD_BY_KEY[field].maxLength} characters`)
        continue
      }
      if (clean) values[field] = clean
    }
    if (!values.medicine_name) errors.push('Medicine name is missing')
    if (values.status && !['active', 'inactive'].includes(values.status.toLowerCase())) {
      values.status = values.status.toLowerCase() === 'no' || values.status === '0' ? 'inactive' : 'active'
    }

    let duplicate = false
    if (values.medicine_name && errors.length === 0) {
      const key = dedupeKey(values.medicine_name, values.strength, values.dosage_form)
      duplicate = existingKeys.has(key) || seenInFile.has(key)
      seenInFile.add(key)
    }
    return { row: idx + 2, values, errors, duplicate, action: 'skip' }
  })

  const invalid = rows.filter((r) => r.errors.length > 0).length
  const duplicates = rows.filter((r) => r.duplicate).length
  return { rows, total: rows.length, invalid, duplicates, valid: rows.length - invalid - duplicates }
}

/** Rows sent to import_medicines(): valid rows, plus duplicates the doctor chose to update/keep. */
export function rowsForImport(preview: ImportPreview) {
  return preview.rows
    .filter((r) => r.errors.length === 0 && (!r.duplicate || r.action !== 'skip'))
    .map((r) => ({ row: r.row, action: r.duplicate ? r.action : 'skip', ...r.values }))
}

/** CSV-safe cell: quotes values and neutralises formula prefixes (CSV injection). */
export function csvCell(value: string): string {
  let v = value ?? ''
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** Header-only template, so no sample medicine can be imported by accident. */
export function templateCsv(): string {
  return MEDICINE_FIELDS.map((f) => csvCell(f.label)).join(',') + '\r\n'
}
