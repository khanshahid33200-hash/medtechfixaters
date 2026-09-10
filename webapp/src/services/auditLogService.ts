import { supabase } from '../lib/supabase'

export interface ActivityLog {
  id: string
  hospital_id: string
  actor_id: string | null
  actor_email: string | null
  actor_role: string | null
  category: string
  action: string
  target_type: string | null
  target_id: string | null
  target_label: string | null
  status: 'success' | 'failed' | 'pending'
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

/**
 * Write one audit log entry via the log_activity() RPC — never insert into
 * activity_logs directly, the RPC is SECURITY DEFINER and derives
 * hospital_id/actor from auth.uid() so a caller can't forge either.
 * Logging failures are swallowed (console-only): an audit trail write should
 * never block the actual admin action it's describing.
 */
export async function logActivity(params: {
  category: string
  action: string
  targetType?: string
  targetId?: string
  targetLabel?: string
  status?: 'success' | 'failed' | 'pending'
  metadata?: Record<string, unknown>
}) {
  try {
    await supabase.rpc('log_activity', {
      p_category: params.category,
      p_action: params.action,
      p_target_type: params.targetType || null,
      p_target_id: params.targetId || null,
      p_target_label: params.targetLabel || null,
      p_status: params.status || 'success',
      p_metadata: params.metadata || {},
    })
  } catch (e) {
    console.warn('logActivity note:', e)
  }
}

export interface LogFilters {
  from?: string
  to?: string
  actorId?: string
  category?: string
  search?: string
}

export async function fetchActivityLogs(hospitalId: string, filters: LogFilters = {}, page = 0, pageSize = 25) {
  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })

  if (filters.from) query = query.gte('created_at', filters.from)
  if (filters.to) query = query.lte('created_at', filters.to)
  if (filters.actorId) query = query.eq('actor_id', filters.actorId)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.search) query = query.ilike('action', `%${filters.search}%`)

  const { data, count, error } = await query.range(page * pageSize, page * pageSize + pageSize - 1)
  if (error) {
    console.warn('fetchActivityLogs error:', error.message)
    return { rows: [] as ActivityLog[], total: 0 }
  }
  return { rows: (data || []) as ActivityLog[], total: count || 0 }
}
