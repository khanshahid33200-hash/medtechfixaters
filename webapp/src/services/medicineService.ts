import { supabase } from '../lib/supabase'

// Doctor-managed medicine library, test library and suggestion rules.
// Ownership (doctor_id / hospital_id) is always set by the database from the signed-in
// session — this module never sends it — and RLS limits every query to the caller's rows.

export interface Medicine {
  id: string
  medicine_name: string
  brand_name: string | null
  generic_name: string | null
  drug_type: string | null
  category: string | null
  strength: string | null
  dosage_form: string | null
  indications: string | null
  contraindications: string | null
  usage_notes: string | null
  warnings: string | null
  default_dosage: string | null
  default_frequency: string | null
  default_duration: string | null
  route: string | null
  special_instructions: string | null
  status: 'active' | 'inactive'
  is_intentional_duplicate: boolean
  created_at: string
  updated_at: string
}

export type MedicineInput = Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'is_intentional_duplicate'>

export type MedicineSearchResult = Pick<
  Medicine,
  | 'id' | 'medicine_name' | 'brand_name' | 'generic_name' | 'category' | 'drug_type' | 'strength' | 'dosage_form'
  | 'default_dosage' | 'default_frequency' | 'default_duration' | 'route' | 'special_instructions' | 'warnings'
  | 'contraindications'
>

export interface ClinicalTest {
  id: string
  test_name: string
  category: string | null
  purpose_notes: string | null
  indication: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export type TriggerType = 'SYMPTOM' | 'COMPLAINT' | 'KEYWORD' | 'CONDITION' | 'DOCTOR_DEFINED_CATEGORY'
export type SuggestionType = 'MEDICINE' | 'TEST' | 'OTHER'

export interface SuggestionRule {
  id: string
  trigger_type: TriggerType
  trigger_value: string
  suggestion_type: SuggestionType
  suggestion_id: string | null
  suggestion_text: string | null
  priority: number
  notes: string | null
  status: 'active' | 'disabled'
  created_at: string
}

export interface MedicineImportRecord {
  id: string
  filename: string
  file_type: string
  total_rows: number
  successful_rows: number
  updated_rows: number
  skipped_rows: number
  failed_rows: number
  status: 'completed' | 'completed_with_errors' | 'failed'
  error_summary: string | null
  errors: { row: number; error: string }[]
  created_at: string
}

export interface SuggestedMedicine {
  rule_id: string
  medicine_id: string
  name: string
  generic_name: string | null
  brand_name: string | null
  category: string | null
  strength: string | null
  dosage_form: string | null
  indications: string | null
  warnings: string | null
  contraindications: string | null
  default_dosage: string | null
  default_frequency: string | null
  default_duration: string | null
  route: string | null
  special_instructions: string | null
  trigger_type: TriggerType
  trigger_value: string
  rule_notes: string | null
  priority: number
}

export interface SuggestedTest {
  rule_id: string
  test_id: string
  name: string
  category: string | null
  purpose_notes: string | null
  indication: string | null
  trigger_type: TriggerType
  trigger_value: string
  rule_notes: string | null
}

export interface SuggestedOther {
  rule_id: string
  name: string
  trigger_type: TriggerType
  trigger_value: string
  rule_notes: string | null
}

export interface ClinicalSuggestions {
  medicines: SuggestedMedicine[]
  tests: SuggestedTest[]
  other: SuggestedOther[]
}

/** Turns database errors into messages a doctor can act on. */
function friendly(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('This already exists in your library (same name, strength and form).')
  if (error.code === '42501') return new Error('You are not allowed to change this record.')
  return new Error(error.message)
}

// ---------------------------------------------------------------- medicines
export interface MedicineListParams {
  search?: string
  category?: string
  status?: 'active' | 'inactive' | 'all'
  sort?: 'name' | 'recent'
  page?: number
  pageSize?: number
}

export async function listMedicines(params: MedicineListParams = {}) {
  const pageSize = params.pageSize ?? 25
  const page = params.page ?? 0
  let q = supabase.from('medicines').select('*', { count: 'exact' })
  if (params.status && params.status !== 'all') q = q.eq('status', params.status)
  if (params.category) q = q.or(`category.eq.${quoteFilter(params.category)},drug_type.eq.${quoteFilter(params.category)}`)
  const term = (params.search || '').trim().toLowerCase()
  if (term) {
    const like = `${escapeLike(term)}%`
    q = q.or(`name_normalized.like.${quoteFilter(like)},generic_normalized.like.${quoteFilter(like)},brand_normalized.like.${quoteFilter(like)}`)
  }
  q = params.sort === 'recent' ? q.order('created_at', { ascending: false }) : q.order('medicine_name', { ascending: true })
  const { data, error, count } = await q.range(page * pageSize, page * pageSize + pageSize - 1)
  if (error) throw friendly(error)
  return { rows: (data || []) as Medicine[], total: count || 0 }
}

/** Distinct category / drug type values for the filter dropdown. */
export async function listMedicineCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('medicines').select('category, drug_type').limit(2000)
  if (error) throw friendly(error)
  const set = new Set<string>()
  for (const r of data || []) {
    if (r.category) set.add(r.category)
    if (r.drug_type) set.add(r.drug_type)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/** Existing dedupe keys, used to flag duplicates in an import preview. */
export async function listMedicineDedupeKeys(): Promise<Set<string>> {
  const { data, error } = await supabase.from('medicines').select('dedupe_key').eq('is_intentional_duplicate', false).limit(20000)
  if (error) throw friendly(error)
  return new Set((data || []).map((r: { dedupe_key: string }) => r.dedupe_key))
}

export async function createMedicine(input: MedicineInput): Promise<Medicine> {
  const { data, error } = await supabase.from('medicines').insert([input]).select('*').single()
  if (error) throw friendly(error)
  return data as Medicine
}

export async function updateMedicine(id: string, input: Partial<MedicineInput>): Promise<Medicine> {
  const { data, error } = await supabase.from('medicines').update(input).eq('id', id).select('*').single()
  if (error) throw friendly(error)
  return data as Medicine
}

export async function deleteMedicine(id: string) {
  const { error } = await supabase.from('medicines').delete().eq('id', id)
  if (error) throw friendly(error)
}

/** Autocomplete: prefix search over the caller's ACTIVE medicines, done in the database. */
export async function searchMedicines(query: string, limit = 10): Promise<MedicineSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  const { data, error } = await supabase.rpc('search_medicines', { p_query: q, p_limit: limit })
  if (error) throw friendly(error)
  return (data || []) as MedicineSearchResult[]
}

// ---------------------------------------------------------------- tests
export async function listClinicalTests(includeInactive = true): Promise<ClinicalTest[]> {
  let q = supabase.from('clinical_tests').select('*').order('test_name')
  if (!includeInactive) q = q.eq('status', 'active')
  const { data, error } = await q
  if (error) throw friendly(error)
  return (data || []) as ClinicalTest[]
}

export async function saveClinicalTest(input: Omit<ClinicalTest, 'id' | 'created_at'>, id?: string) {
  const req = id
    ? supabase.from('clinical_tests').update(input).eq('id', id)
    : supabase.from('clinical_tests').insert([input])
  const { error } = await req
  if (error) throw friendly(error)
}

export async function deleteClinicalTest(id: string) {
  const { error } = await supabase.from('clinical_tests').delete().eq('id', id)
  if (error) throw friendly(error)
}

// ---------------------------------------------------------------- rules
export async function listSuggestionRules(): Promise<SuggestionRule[]> {
  const { data, error } = await supabase
    .from('suggestion_rules')
    .select('*')
    .order('trigger_value')
    .order('priority')
  if (error) throw friendly(error)
  return (data || []) as SuggestionRule[]
}

export async function saveSuggestionRule(
  input: Pick<SuggestionRule, 'trigger_type' | 'trigger_value' | 'suggestion_type' | 'suggestion_id' | 'suggestion_text' | 'priority' | 'notes' | 'status'>,
  id?: string
) {
  const req = id
    ? supabase.from('suggestion_rules').update(input).eq('id', id)
    : supabase.from('suggestion_rules').insert([input])
  const { error } = await req
  if (error) {
    if (error.code === '23505') throw new Error('An identical rule already exists.')
    throw friendly(error)
  }
}

export async function deleteSuggestionRule(id: string) {
  const { error } = await supabase.from('suggestion_rules').delete().eq('id', id)
  if (error) throw friendly(error)
}

/** Decision support for one appointment — read-only; nothing is prescribed. */
export async function getClinicalSuggestions(appointmentId: string): Promise<ClinicalSuggestions> {
  const { data, error } = await supabase.rpc('get_clinical_suggestions', { p_appointment_id: appointmentId })
  if (error) throw friendly(error)
  return { medicines: data?.medicines || [], tests: data?.tests || [], other: data?.other || [] }
}

// ---------------------------------------------------------------- import
export interface ImportResult {
  import_id: string
  total_rows: number
  imported: number
  updated: number
  skipped: number
  failed: number
  errors: { row: number; error: string }[]
}

export async function importMedicines(
  filename: string,
  fileType: string,
  rows: unknown[],
  clientErrors: { row: number; error: string }[] = []
): Promise<ImportResult> {
  const { data, error } = await supabase.rpc('import_medicines', {
    p_filename: filename,
    p_file_type: fileType,
    p_rows: rows,
    p_client_errors: clientErrors,
  })
  if (error) throw friendly(error)
  return data as ImportResult
}

export async function listMedicineImports(): Promise<MedicineImportRecord[]> {
  const { data, error } = await supabase
    .from('medicine_imports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw friendly(error)
  return (data || []) as MedicineImportRecord[]
}

// ---------------------------------------------------------------- prescription
export interface PrescriptionLine {
  medicine_id?: string | null
  name: string
  strength?: string | null
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions: string
  source: 'library' | 'suggestion' | 'manual'
  confirmed: boolean
}

export interface FinalizeParams {
  appointmentId: string
  diagnosis?: string
  clinicalNotes?: string
  vitals?: Record<string, string>
  items: PrescriptionLine[]
  tests: string[]
  testsUrgent?: boolean
  testInstructions?: string
  advice?: string
  followUp?: string
}

/**
 * Atomically saves the consultation, the FINAL prescription (with medicine snapshots),
 * the test order and the appointment status. Returns `{ missing: true }` when the
 * database migration that provides finalize_consultation() is not installed yet.
 */
export async function finalizeConsultation(p: FinalizeParams): Promise<{ success: boolean; missing?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('finalize_consultation', {
    p_appointment_id: p.appointmentId,
    p_diagnosis: p.diagnosis || null,
    p_clinical_notes: p.clinicalNotes || null,
    p_vitals: p.vitals || {},
    p_items: p.items,
    p_tests: p.tests,
    p_tests_urgent: Boolean(p.testsUrgent),
    p_test_instructions: p.testInstructions || null,
    p_advice: p.advice || null,
    p_follow_up: p.followUp || null,
  })
  if (error) {
    if (error.code === 'PGRST202') return { success: false, missing: true }
    return { success: false, error: error.message }
  }
  return { success: Boolean(data?.success) }
}

// ---------------------------------------------------------------- helpers
/** Escapes LIKE wildcards so user input is matched literally. */
function escapeLike(v: string) {
  return v.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** Quotes a value for a PostgREST filter list (commas/parentheses must not break the filter). */
function quoteFilter(v: string) {
  return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
