import { supabase } from '../lib/supabase'
import { logActivity } from './auditLogService'

export interface HospitalUser {
  id: string
  full_name: string
  email: string
  role: 'hospital_admin' | 'doctor' | 'staff'
  department: string | null
  is_active: boolean
  account_status: 'active' | 'suspended' | 'blocked' | 'banned' | 'deleted'
  created_at: string
  updated_at: string
}

export async function fetchHospitalUsers(hospitalId: string): Promise<HospitalUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department, is_active, account_status, created_at, updated_at')
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('fetchHospitalUsers error:', error.message)
    return []
  }
  return (data || []) as HospitalUser[]
}

export async function setUserActive(userId: string, isActive: boolean, targetLabel: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, account_status: isActive ? 'active' : 'suspended' })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  await logActivity({
    category: 'Users',
    action: isActive ? 'User Reactivated' : 'User Deactivated',
    targetType: 'profile',
    targetId: userId,
    targetLabel,
  })
}

export async function setUserBanStatus(userId: string, banned: boolean, targetLabel: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ account_status: banned ? 'banned' : 'active', is_active: !banned })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  await logActivity({
    category: 'Users',
    action: banned ? 'User Banned' : 'User Unbanned',
    targetType: 'profile',
    targetId: userId,
    targetLabel,
    status: banned ? 'success' : 'success',
  })
}

/** Restricted to doctor <-> staff by the DB trigger enforce_role_change_guardrail(). */
export async function changeUserRole(userId: string, newRole: 'doctor' | 'staff', targetLabel: string) {
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
  if (error) throw new Error(error.message)
  await logActivity({
    category: 'Users',
    action: 'Role Changed',
    targetType: 'profile',
    targetId: userId,
    targetLabel,
    metadata: { new_role: newRole },
  })
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw new Error(error.message)
  await logActivity({
    category: 'Users',
    action: 'Password Reset Requested',
    targetLabel: email,
  })
}
