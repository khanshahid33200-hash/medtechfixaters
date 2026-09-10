import { supabase } from '../lib/supabase'
import { logActivity } from './auditLogService'

export interface AvailabilityBlock {
  id: string
  doctor_id: string
  hospital_id: string
  date: string
  status: 'unavailable' | 'leave' | 'holiday' | 'emergency_block'
  reason: string | null
}

export async function fetchAvailability(doctorId: string, hospitalId: string): Promise<AvailabilityBlock[]> {
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('hospital_id', hospitalId)
    .order('date', { ascending: true })
  if (error) {
    console.warn('fetchAvailability error:', error.message)
    return []
  }
  return (data || []) as AvailabilityBlock[]
}

export async function setUnavailableDate(params: {
  doctorId: string
  hospitalId: string
  date: string
  status: AvailabilityBlock['status']
  reason?: string
}) {
  const { error } = await supabase.from('doctor_availability').upsert(
    {
      doctor_id: params.doctorId,
      hospital_id: params.hospitalId,
      date: params.date,
      status: params.status,
      reason: params.reason || null,
    },
    { onConflict: 'doctor_id,date' }
  )
  if (error) throw new Error(error.message)
  await logActivity({ category: 'Availability', action: 'Marked Unavailable', targetLabel: params.date, metadata: { status: params.status, reason: params.reason } })
}

export async function clearUnavailableDate(doctorId: string, date: string) {
  const { error } = await supabase.from('doctor_availability').delete().eq('doctor_id', doctorId).eq('date', date)
  if (error) throw new Error(error.message)
  await logActivity({ category: 'Availability', action: 'Availability Cleared', targetLabel: date })
}

export interface WorkingHours {
  doctor_id: string
  hospital_id: string
  morning_start: string | null
  morning_end: string | null
  evening_start: string | null
  evening_end: string | null
}

export async function fetchWorkingHours(doctorId: string): Promise<WorkingHours | null> {
  const { data } = await supabase.from('doctor_working_hours').select('*').eq('doctor_id', doctorId).maybeSingle()
  return (data as WorkingHours) || null
}

export async function saveWorkingHours(params: WorkingHours) {
  const { error } = await supabase.from('doctor_working_hours').upsert(params, { onConflict: 'doctor_id' })
  if (error) throw new Error(error.message)
  await logActivity({ category: 'Availability', action: 'Working Hours Updated' })
}
