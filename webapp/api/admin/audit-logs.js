import { verifySuperAdmin } from './auth-check.js';

export default async function handler(req, res) {
  const auth = await verifySuperAdmin(req, res);
  if (!auth) return;

  const { client } = auth;

  if (req.method === 'GET') {
    const query = req.query || {};
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '30', 10)));
    const offset = (page - 1) * limit;

    let dbQuery = client
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    if (query.action && query.action !== 'all') {
      dbQuery = dbQuery.eq('action', query.action);
    }

    if (query.target_type && query.target_type !== 'all') {
      dbQuery = dbQuery.eq('target_type', query.target_type);
    }

    if (query.result && query.result !== 'all') {
      dbQuery = dbQuery.eq('result', query.result);
    }

    if (query.actor_email) {
      dbQuery = dbQuery.ilike('actor_email', `%${query.actor_email.trim()}%`);
    }

    if (query.start_date) {
      dbQuery = dbQuery.gte('created_at', query.start_date);
    }
    if (query.end_date) {
      dbQuery = dbQuery.lte('created_at', query.end_date);
    }

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      dbQuery = dbQuery.or(`action.ilike.${term},target_id.ilike.${term},actor_email.ilike.${term},reason.ilike.${term}`);
    }

    // Export mode: return complete records for CSV or JSON download
    if (query.export === 'csv' || query.export === 'json') {
      const { data: allLogs, error: exportErr } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(1000);

      if (exportErr) {
        return res.status(500).json({ success: false, error: exportErr.message });
      }

      if (query.export === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="admin_audit_logs.json"');
        return res.send(JSON.stringify(allLogs, null, 2));
      }

      // Format CSV
      const headers = ['id', 'created_at', 'actor_email', 'actor_role', 'target_type', 'target_id', 'action', 'result', 'reason'];
      const csvRows = [headers.join(',')];
      for (const row of allLogs || []) {
        csvRows.push([
          `"${row.id}"`,
          `"${row.created_at}"`,
          `"${(row.actor_email || '').replace(/"/g, '""')}"`,
          `"${row.actor_role}"`,
          `"${row.target_type}"`,
          `"${(row.target_id || '').replace(/"/g, '""')}"`,
          `"${row.action}"`,
          `"${row.result}"`,
          `"${(row.reason || '').replace(/"/g, '""')}"`,
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="admin_audit_logs.csv"');
      return res.send(csvRows.join('\n'));
    }

    const { data: logs, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  }

  // POST: Record new custom audit event
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { action, target_type, target_id, previous_state, new_state, reason, evidence, result } = body;

    if (!action || !target_type) {
      return res.status(400).json({ success: false, error: 'Action and target_type are mandatory.' });
    }

    const { data: logId, error: logErr } = await client.rpc('log_admin_audit_event', {
      p_action: action,
      p_target_type: target_type,
      p_target_id: target_id ? String(target_id) : null,
      p_previous_state: previous_state || {},
      p_new_state: new_state || {},
      p_reason: reason || null,
      p_evidence: evidence || {},
      p_result: result || 'success',
      p_ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      p_user_agent: req.headers['user-agent'] || null,
    });

    if (logErr) {
      return res.status(500).json({ success: false, error: logErr.message });
    }

    return res.json({ success: true, log_id: logId });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
