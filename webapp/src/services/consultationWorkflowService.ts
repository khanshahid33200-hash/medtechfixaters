import { supabase } from '../lib/supabase'
import { logActivity } from './auditLogService'

// ============================================================================
// TEST REQUESTS ("Suggest Test")
// ============================================================================
export async function createTestRequest(params: {
  hospitalId: string
  doctorId: string
  patientId?: string | null
  appointmentId?: string | null
  consultationId?: string | null
  tests: string[]
  customTest?: string
  instructions?: string
}) {
  const { error } = await supabase.from('test_requests').insert({
    hospital_id: params.hospitalId,
    doctor_id: params.doctorId,
    patient_id: params.patientId || null,
    appointment_id: params.appointmentId || null,
    consultation_id: params.consultationId || null,
    tests: params.tests,
    custom_test: params.customTest || null,
    instructions: params.instructions || null,
  })
  if (error) throw new Error(error.message)
  await logActivity({
    category: 'Tests',
    action: 'Test Request Created',
    targetType: 'test_request',
    metadata: { tests: params.tests, custom_test: params.customTest },
  })
}

// ============================================================================
// FOLLOW-UPS — real separate token/queue via the create_follow_up() RPC
// ============================================================================
export interface FollowUpRow {
  id: string
  hospital_id: string
  doctor_id: string
  patient_id: string | null
  parent_appointment_id: string
  follow_up_appointment_id: string | null
  follow_up_date: string
  follow_up_token: string | null
  reason: string | null
  instructions: string | null
  preferred_time: string | null
  status: 'scheduled' | 'due_today' | 'completed' | 'overdue' | 'cancelled'
  created_at: string
  patient?: { name: string; phone: string } | null
}

export async function createFollowUp(params: {
  parentAppointmentId: string
  followUpDate: string
  reason?: string
  instructions?: string
  preferredTime?: string
}) {
  const { data, error } = await supabase.rpc('create_follow_up', {
    p_parent_appointment_id: params.parentAppointmentId,
    p_follow_up_date: params.followUpDate,
    p_reason: params.reason || null,
    p_instructions: params.instructions || null,
    p_preferred_time: params.preferredTime || null,
  })
  if (error) throw new Error(error.message)
  const result = data as { success: boolean; error?: string; follow_up_token?: string; follow_up_id?: string }
  if (!result.success) throw new Error(result.error || 'Could not create follow-up.')
  return result
}

export async function fetchFollowUps(hospitalId: string, doctorId: string): Promise<FollowUpRow[]> {
  const { data, error } = await supabase
    .from('follow_ups')
    .select('*, patient:patients(name, phone)')
    .eq('hospital_id', hospitalId)
    .eq('doctor_id', doctorId)
    .order('follow_up_date', { ascending: true })
  if (error) {
    console.warn('fetchFollowUps error:', error.message)
    return []
  }
  return (data || []) as any
}

export async function updateFollowUpStatus(id: string, status: FollowUpRow['status']) {
  const { error } = await supabase.from('follow_ups').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  await logActivity({ category: 'Follow-Up', action: `Follow-Up ${status}`, targetType: 'follow_up', targetId: id })
}

// ============================================================================
// RAISE REQUEST (staff / receptionist / lab / pharmacy / nursing / assistance)
// ============================================================================
export type DoctorRequestType = 'hospital_staff' | 'receptionist' | 'lab' | 'pharmacy' | 'nursing' | 'assistance' | 'other'

export async function createDoctorRequest(params: {
  hospitalId: string
  doctorId: string
  patientId?: string | null
  appointmentId?: string | null
  requestType: DoctorRequestType
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
}) {
  const { data, error } = await supabase
    .from('doctor_requests')
    .insert({
      hospital_id: params.hospitalId,
      doctor_id: params.doctorId,
      patient_id: params.patientId || null,
      appointment_id: params.appointmentId || null,
      request_type: params.requestType,
      priority: params.priority || 'normal',
      notes: params.notes || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await logActivity({
    category: 'Requests',
    action: 'Request Raised',
    targetType: 'doctor_request',
    targetId: data.id,
    targetLabel: params.requestType,
    metadata: { priority: params.priority },
  })
  return data
}

// ============================================================================
// EMERGENCY ESCALATION
// ============================================================================
export async function createEmergencyRequest(params: {
  hospitalId: string
  doctorId: string
  patientId?: string | null
  appointmentId?: string | null
  patientName: string
  reason: string
  priority: 'critical' | 'high' | 'urgent'
  notes?: string
}) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .insert({
      hospital_id: params.hospitalId,
      doctor_id: params.doctorId,
      patient_id: params.patientId || null,
      appointment_id: params.appointmentId || null,
      patient_name: params.patientName,
      reason: params.reason,
      priority: params.priority,
      notes: params.notes || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  // Emergency escalation must never silently mutate the patient's clinical
  // record — this call ONLY inserts an emergency_requests row and an audit
  // log entry; it never touches consultations/prescriptions/appointments.
  await logActivity({
    category: 'Emergency',
    action: 'Emergency Escalation Raised',
    targetType: 'emergency_request',
    targetId: data.id,
    targetLabel: params.patientName,
    status: 'success',
    metadata: { priority: params.priority, reason: params.reason },
  })
  return data
}
