// Supabase-backed doctor appointment data — the ONE source of truth for
// the Doctor Dashboard (Dashboard.tsx, Queue.tsx, History.tsx, Reports.tsx).
//
// Why this file exists: the Doctor Dashboard previously read/wrote its own
// localStorage caches (two different, unsynchronized namespaces across
// Dashboard.tsx vs. doctorStore.ts) plus a legacy FastAPI backend whose
// production URL was never configured — completely disconnected from the
// `appointments`/`patients` rows a real QR booking (book_qr_appointment RPC,
// see supabase/schema.sql) actually writes. So a patient booking with
// Doctor D1 never appeared anywhere in D1's dashboard. This module queries
// the same tables the booking flow writes to, so both are finally in sync.
//
// Isolation: every query below filters by doctor_id, but that filter is
// query-shape/defense-in-depth, NOT the security boundary — the real
// enforcement is Postgres RLS ("Doctor manage ONLY own appointments" /
// "own consultations" / "own prescriptions" in supabase/schema.sql), which
// checks `doctor_id = auth.uid()` server-side regardless of what a client
// asks for.

import { supabase } from './supabase'

// Must match the CHECK constraint on public.appointments EXACTLY
// (supabase/01_master_setup.sql) — 'Waiting' | 'In Consultation' |
// 'Completed' | 'Cancelled' | 'No Show'. This file previously used its own
// lowercase/underscore status strings ('waiting', 'in_consultation',
// 'completed', ...) that never match a real row: every appointment booked
// via book_qr_appointment() comes back with status 'Waiting', which
// getDoctorAppointments/getDoctorStats/the queue mapper below all failed to
// recognize — so booked patients silently never appeared in the Live Queue
// or Dashboard stats, and status-update writes were silently rejected by
// the DB's CHECK constraint (the error was swallowed, returning false).
export type AppointmentStatus = 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show'

export interface DoctorAppointmentPatient {
  id: string
  patient_number?: string | null
  name: string
  phone: string
  age: number | null
  gender: string | null
  allergies: string | null
  known_diseases: string | null
}

export interface DoctorAppointment {
  id: string
  token_number: number | null
  queue_number?: string | null
  tracking_token?: string | null
  status: AppointmentStatus
  appointment_date: string
  appointment_time?: string | null
  created_at: string
  symptoms: string | null
  fee: number | null
  booking_method?: string | null
  patient: DoctorAppointmentPatient | null
}

const APPOINTMENT_SELECT = `
  id, token_number, queue_number, tracking_token, status, appointment_date, appointment_time, created_at, symptoms, consultation_fee, booking_method,
  patient_name, patient_phone, patient_age, patient_gender,
  patient:patients(id, patient_number, name, phone, age, gender, allergies, known_diseases)
`

function normalizeAppointment(row: any): DoctorAppointment {
  const p = Array.isArray(row.patient) ? row.patient[0] : row.patient
  return {
    id: row.id,
    token_number: row.token_number ?? null,
    queue_number: row.queue_number || (row.token_number ? `OPD-${String(row.token_number).padStart(3, '0')}` : null),
    tracking_token: row.tracking_token || row.queue_number || row.id,
    status: row.status,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time || '09:00 AM',
    created_at: row.created_at,
    symptoms: row.symptoms ?? null,
    fee: row.consultation_fee != null ? Number(row.consultation_fee) : 500,
    booking_method: row.booking_method || 'QR',
    patient: {
      id: p?.id || row.patient_id || row.id,
      patient_number: p?.patient_number || null,
      name: p?.name || row.patient_name || 'Patient',
      phone: p?.phone || row.patient_phone || '',
      age: p?.age ?? row.patient_age ?? 30,
      gender: p?.gender || row.patient_gender || 'Other',
      allergies: p?.allergies || null,
      known_diseases: p?.known_diseases || null,
    },
  }
}

/**
 * All appointments for this doctor. Pass `date` (YYYY-MM-DD) to scope to a
 * single day (the live queue); omit it for full history.
 */
export async function getDoctorAppointments(
  doctorId: string,
  opts: { date?: string } = {}
): Promise<DoctorAppointment[]> {
  if (!doctorId) return []

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('doctor_id', doctorId)
    .order('token_number', { ascending: true })

  if (opts.date) {
    query = query.eq('appointment_date', opts.date)
  }

  const { data, error } = await query
  if (error) {
    console.warn('getDoctorAppointments error:', error.message)
    // Fallback: select without patient join in case foreign key relationship differs
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('appointments')
      .select('id, token_number, queue_number, tracking_token, status, appointment_date, appointment_time, created_at, symptoms, consultation_fee, booking_method, patient_name, patient_phone, patient_age, patient_gender')
      .eq('doctor_id', doctorId)
      .order('token_number', { ascending: true })

    if (fallbackError) {
      console.warn('getDoctorAppointments fallback error:', fallbackError.message)
      return []
    }
    return (fallbackData || []).map(normalizeAppointment)
  }
  return (data || []).map(normalizeAppointment)
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<boolean> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId)
  if (error) {
    console.warn('updateAppointmentStatus error:', error.message)
    return false
  }
  return true
}

/**
 * Add a walk-in patient to this doctor's queue. Reuses the already-audited
 * book_qr_appointment RPC (rather than duplicating its token-numbering /
 * advisory-lock / patient-dedup logic) with the doctor's own hospital's QR
 * token, so a walk-in is indistinguishable from a QR booking once created —
 * same table, same isolation guarantees.
 */
export interface WalkInBookingResult {
  success: boolean
  error?: string
  appointmentId?: string
  tokenNumber?: number
  queueNumber?: string
  patientNumber?: string | null
  trackingToken?: string
  doctorName?: string
}

export async function addWalkInAppointment(params: {
  hospitalId: string
  doctorId: string
  patientName: string
  patientPhone: string
  patientGender?: string
  patientAge?: number
  symptoms?: string
  knownDiseases?: string
  previousMedicine?: string
}): Promise<WalkInBookingResult> {
  const { data: qr, error: qrError } = await supabase
    .from('qr_codes')
    .select('token')
    .eq('hospital_id', params.hospitalId)
    .limit(1)
    .maybeSingle()

  if (qrError || !qr?.token) {
    return { success: false, error: qrError?.message || 'No active QR/booking token found for this hospital.' }
  }

  const { data, error } = await supabase.rpc('book_qr_appointment', {
    p_qr_token: qr.token,
    p_doctor_id: params.doctorId,
    p_appointment_date: new Date().toISOString().split('T')[0],
    p_patient_name: params.patientName,
    p_patient_phone: params.patientPhone,
    p_patient_gender: params.patientGender || 'Other',
    p_patient_age: params.patientAge ?? 30,
    p_patient_dob: null,
    p_symptoms: params.symptoms || null,
    p_known_diseases: params.knownDiseases || null,
    p_previous_medicine: params.previousMedicine || null,
    p_previous_doctor_id: null,
    p_booking_method: 'Walk-in',
  })

  if (error) return { success: false, error: error.message }
  if (data && data.success === false) return { success: false, error: data.error }

  return {
    success: true,
    appointmentId: data?.appointment_id,
    tokenNumber: data?.token_number,
    queueNumber: data?.queue_number,
    patientNumber: data?.patient_number,
    trackingToken: data?.tracking_token,
    doctorName: data?.doctor_name,
  }
}

/**
 * Real doctors for a hospital — used by front-desk/reception check-in flows
 * that need to let staff pick a doctor rather than trusting a client-
 * supplied doctor_id. RLS ("Users view own hospital profiles") scopes this
 * to the caller's own hospital regardless of what hospitalId is passed.
 */
export async function getHospitalDoctors(hospitalId: string): Promise<{ id: string; name: string; department: string | null }[]> {
  if (!hospitalId) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .eq('hospital_id', hospitalId)
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.warn('getHospitalDoctors error:', error.message)
    return []
  }
  return (data || []).map(d => ({ id: d.id, name: d.full_name, department: d.department }))
}

/**
 * Complete a consultation: writes a real consultations row + prescriptions
 * row, then marks the appointment completed. Replaces doctorStore's
 * savePrescriptionForDoctor, which only ever touched localStorage.
 */
export async function completeConsultation(params: {
  hospitalId: string
  appointmentId: string
  doctorId: string
  patientId: string | null
  diagnosis?: string
  clinicalNotes?: string
  vitals?: Record<string, string>
  medicines?: { name: string; dosage: string; duration: string; instruction: string }[]
  labTests?: string
  advice?: string
  followUp?: string
}): Promise<{ success: boolean; error?: string }> {
  const bp = params.vitals?.bp || null
  const pulse = params.vitals?.pulse || null
  const temp = params.vitals?.temp || null
  const spo2 = params.vitals?.spo2 || null
  const weight = params.vitals?.weight || null

  const consultPayload: Record<string, any> = {
    hospital_id: params.hospitalId,
    appointment_id: params.appointmentId,
    doctor_id: params.doctorId,
    patient_id: params.patientId,
    diagnosis: params.diagnosis || null,
    clinical_notes: params.clinicalNotes || null,
    vitals: params.vitals || {},
    bp,
    pulse,
    temp,
    spo2,
    weight,
    status: 'completed',
  }

  let { data: consultation, error: consultError } = await supabase
    .from('consultations')
    .insert([consultPayload])
    .select('id')
    .single()

  // Fallback if schema cache in postgREST has not reloaded vitals JSON column yet
  if (consultError && consultError.message?.includes('vitals')) {
    delete consultPayload.vitals
    const retry = await supabase
      .from('consultations')
      .insert([consultPayload])
      .select('id')
      .single()
    consultation = retry.data
    consultError = retry.error
  }

  if (consultError || !consultation) return { success: false, error: consultError?.message || 'Failed to save consultation.' }

  // Ensure lab_tests is an array or valid JSON, never null
  const parsedLabTests = params.labTests
    ? (Array.isArray(params.labTests)
        ? params.labTests
        : typeof params.labTests === 'string'
        ? params.labTests.split(',').map(s => s.trim()).filter(Boolean)
        : [String(params.labTests)])
    : []

  const rxPayload: Record<string, any> = {
    hospital_id: params.hospitalId,
    consultation_id: consultation.id,
    appointment_id: params.appointmentId,
    doctor_id: params.doctorId,
    patient_id: params.patientId,
    medicines: params.medicines || [],
    medications: params.medicines || [],
    lab_tests: parsedLabTests,
    advice: params.advice || null,
    follow_up: params.followUp || null,
  }

  let { error: rxError } = await supabase.from('prescriptions').insert([rxPayload])

  if (rxError && (rxError.message?.includes('medicines') || rxError.message?.includes('medications') || rxError.message?.includes('follow_up') || rxError.message?.includes('lab_tests'))) {
    // If only one naming variant exists in DB
    const fallbackRx = {
      hospital_id: params.hospitalId,
      consultation_id: consultation.id,
      appointment_id: params.appointmentId,
      doctor_id: params.doctorId,
      patient_id: params.patientId,
      medications: params.medicines || [],
      lab_tests: parsedLabTests,
      advice: params.advice || null,
    }
    const retryRx = await supabase.from('prescriptions').insert([fallbackRx])
    rxError = retryRx.error
  }

  if (rxError) return { success: false, error: rxError.message }

  const updated = await updateAppointmentStatus(params.appointmentId, 'Completed')
  if (!updated) return { success: false, error: 'Consultation saved but appointment status update failed.' }

  return { success: true }
}

export interface DoctorStats {
  totalToday: number
  completedToday: number
  waitingToday: number
  revenueToday: number
}

/**
 * Replaces doctorStore.getDoctorRealStats, which derived counts from three
 * separate localStorage buckets. One query, real data.
 */
export async function getDoctorStats(doctorId: string, dateStr?: string): Promise<DoctorStats> {
  const today = dateStr || new Date().toISOString().split('T')[0]
  const appointments = await getDoctorAppointments(doctorId, { date: today })

  const completed = appointments.filter(a => a.status === 'Completed')
  const waiting = appointments.filter(a => a.status === 'Waiting')
  const revenue = completed.reduce((sum, a) => sum + (a.fee || 0), 0)

  return {
    totalToday: appointments.length,
    completedToday: completed.length,
    waitingToday: waiting.length,
    revenueToday: revenue,
  }
}

export interface DoctorPrescription {
  appointmentId: string
  diagnosis: string | null
  clinicalNotes: string | null
  medicines: { name: string; dosage: string; duration: string; instruction: string }[]
  advice: string | null
  followUp: string | null
}

/**
 * All prescriptions this doctor has written, keyed by appointment_id, so
 * callers can merge them onto the appointment list they already have (see
 * Reports.tsx). Real rows from `prescriptions`/`consultations`, replacing
 * the prescription object doctorStore used to embed directly on a
 * localStorage-only queue item.
 */
export async function getDoctorPrescriptions(doctorId: string): Promise<Map<string, DoctorPrescription>> {
  const map = new Map<string, DoctorPrescription>()
  if (!doctorId) return map

  const { data, error } = await supabase
    .from('prescriptions')
    .select('appointment_id, medicines, lab_tests, advice, follow_up, consultation:consultations(diagnosis, clinical_notes)')
    .eq('doctor_id', doctorId)

  if (error) {
    console.warn('getDoctorPrescriptions error:', error.message)
    return map
  }

  for (const row of data || []) {
    if (!row.appointment_id) continue
    const consultation = Array.isArray(row.consultation) ? row.consultation[0] : row.consultation
    map.set(row.appointment_id, {
      appointmentId: row.appointment_id,
      diagnosis: consultation?.diagnosis ?? null,
      clinicalNotes: consultation?.clinical_notes ?? null,
      medicines: row.medicines || [],
      advice: row.advice ?? null,
      followUp: row.follow_up ?? null,
    })
  }
  return map
}

/**
 * Live updates: fires `onChange` whenever any appointment row belonging to
 * this doctor is inserted/updated/deleted. The `filter` is required, not
 * optional — without it, Realtime evaluates the permissive anon "Public
 * view queue for display" RLS policy (scoped only by appointment_date, not
 * hospital/doctor) and pushes every hospital's changes to every subscriber
 * (see the same fix already applied in TrackPage.tsx). Returns an
 * unsubscribe function; always call it on unmount.
 */
export function subscribeToDoctorAppointments(doctorId: string, onChange: () => void): () => void {
  if (!doctorId) return () => {}

  const channel = supabase
    .channel(`doctor_queue_${doctorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `doctor_id=eq.${doctorId}`,
      },
      onChange
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export interface PatientProfile {
  id: string
  patient_number?: string | null
  name: string
  phone: string
  age: number | null
  gender: string | null
  allergies: string | null
  known_diseases: string | null
  address: string | null
}

/**
 * Full profile for one patient. RLS ("Doctor view own patients") only
 * allows this when the caller actually has an appointment with the
 * patient — a doctor cannot browse the full hospital patient database
 * through this, only patients they've actually seen.
 */
export async function getPatientProfile(patientId: string): Promise<PatientProfile | null> {
  if (!patientId) return null
  const { data, error } = await supabase
    .from('patients')
    .select('id, patient_number, name, phone, age, gender, allergies, known_diseases, address')
    .eq('id', patientId)
    .maybeSingle()

  if (error) {
    console.warn('getPatientProfile error:', error.message)
    return null
  }
  return data
}

/**
 * Updates a patient's own profile fields. RLS ("Doctor update own
 * patients") restricts this to patients the doctor has an appointment
 * with, same as read access.
 */
export async function updatePatientProfile(
  patientId: string,
  updates: Partial<Pick<PatientProfile, 'name' | 'phone' | 'age' | 'gender' | 'allergies' | 'known_diseases' | 'address'>>
): Promise<{ success: boolean; error?: string }> {
  if (!patientId) return { success: false, error: 'Missing patient id.' }
  const { error } = await supabase.from('patients').update(updates).eq('id', patientId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Updates both the patient master record and the active appointment row
 * so changes made by doctor during consultation are immediately reflected
 * everywhere (live queue, prescription, patient records).
 */
export async function updateAppointmentAndPatientDetails(params: {
  appointmentId?: string
  patientId?: string | null
  name: string
  phone: string
  age?: number
  gender?: string
  symptoms?: string
  allergies?: string
  known_diseases?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (params.patientId) {
      const { error: pErr } = await supabase
        .from('patients')
        .update({
          name: params.name,
          phone: params.phone,
          age: params.age,
          gender: params.gender,
          allergies: params.allergies,
          known_diseases: params.known_diseases,
        })
        .eq('id', params.patientId)

      if (pErr) {
        console.warn('Error updating patient profile:', pErr.message)
      }
    }

    if (params.appointmentId) {
      const { error: aErr } = await supabase
        .from('appointments')
        .update({
          patient_name: params.name,
          patient_phone: params.phone,
          patient_age: params.age,
          patient_gender: params.gender,
          symptoms: params.symptoms,
        })
        .eq('id', params.appointmentId)

      if (aErr) {
        console.warn('Error updating appointment patient info:', aErr.message)
      }
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Update failed' }
  }
}

export interface PatientVisit {
  appointmentId: string
  appointmentDate: string
  status: AppointmentStatus
  symptoms: string | null
  diagnosis: string | null
  clinicalNotes: string | null
  medicines: { name: string; dosage: string; duration: string; instruction: string }[]
  advice: string | null
  followUp: string | null
}

/**
 * This doctor's own visit history with one patient — every appointment
 * this doctor has had with them, each merged with its consultation/
 * prescription if one was written. Scoped to doctor_id = this doctor (RLS
 * enforces the same server-side): a doctor sees their own past visits
 * with a shared patient, not every other doctor's notes on that patient.
 */
export async function getPatientVisitHistory(patientId: string, doctorId: string): Promise<PatientVisit[]> {
  if (!patientId || !doctorId) return []

  const [{ data: appts, error: apptErr }, { data: rx, error: rxErr }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, appointment_date, status, symptoms')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: false }),
    supabase
      .from('prescriptions')
      .select('appointment_id, medicines, advice, follow_up, consultation:consultations(diagnosis, clinical_notes)')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId),
  ])

  if (apptErr) console.warn('getPatientVisitHistory appointments error:', apptErr.message)
  if (rxErr) console.warn('getPatientVisitHistory prescriptions error:', rxErr.message)

  const rxByAppointment = new Map<string, any>()
  for (const row of rx || []) {
    if (row.appointment_id) rxByAppointment.set(row.appointment_id, row)
  }

  return (appts || []).map(a => {
    const prescription = rxByAppointment.get(a.id)
    const consultation = Array.isArray(prescription?.consultation) ? prescription.consultation[0] : prescription?.consultation
    return {
      appointmentId: a.id,
      appointmentDate: a.appointment_date,
      status: a.status,
      symptoms: a.symptoms ?? null,
      diagnosis: consultation?.diagnosis ?? null,
      clinicalNotes: consultation?.clinical_notes ?? null,
      medicines: prescription?.medicines || [],
      advice: prescription?.advice ?? null,
      followUp: prescription?.follow_up ?? null,
    }
  })
}
