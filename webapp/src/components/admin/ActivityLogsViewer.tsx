import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_email?: string;
  actor_role: string;
  target_id?: string;
  target_type: string;
  action: string;
  previous_state?: any;
  new_state?: any;
  reason?: string;
  evidence?: any;
  ip_address?: string;
  user_agent?: string;
  result: 'success' | 'failure' | 'pending';
  request_correlation_id?: string;
  created_at: string;
}

export default function ActivityLogsViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for JSON Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        target_type: targetTypeFilter,
        result: resultFilter,
        search,
      });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to load audit logs: ${res.statusText}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to retrieve audit trail');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, targetTypeFilter, resultFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export CSV or JSON
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        export: format,
        target_type: targetTypeFilter,
        result: resultFilter,
        search,
      });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medtechfixaters_audit_logs_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const getResultBadge = (result: string) => {
    if (result === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={11} className="text-emerald-600" />
          <span>Success</span>
        </span>
      );
    }
    if (result === 'failure') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={11} className="text-rose-600" />
          <span>Failed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={11} className="text-amber-600" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity size={22} className="text-indigo-600" />
            <span>Immutable Application & Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Append-only security log capturing administrative decisions, payment lifecycle, and authentication events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download size={13} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Action, Target ID, Actor Email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <select
              value={targetTypeFilter}
              onChange={e => { setTargetTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="all">All Resource Types</option>
              <option value="doctor">Doctor</option>
              <option value="transaction">Transaction</option>
              <option value="fee_exemption">Fee Exemption</option>
              <option value="auth">Authentication</option>
              <option value="hospital">Hospital / Clinic</option>
              <option value="system">System / Operations</option>
            </select>
          </div>

          <div>
            <select
              value={resultFilter}
              onChange={e => { setResultFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success Only</option>
              <option value="failure">Failure Only</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              title="From timestamp"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Retrieving audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Activity size={36} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-slate-700">No Audit Events Logged</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              System events, administrator modifications, and payment verifications will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action / Event</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-bold text-slate-800 block truncate max-w-[150px]">
                        {log.actor_email || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {log.actor_role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-700">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">{log.target_type}</span>
                      <span className="font-mono text-[10px] text-slate-600 truncate block max-w-[140px]" title={log.target_id}>
                        {log.target_id || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      {getResultBadge(log.result)}
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-600 truncate max-w-[200px]" title={log.reason}>
                      {log.reason || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(log)}
                        title="View Full Audit Snapshot"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{logs.length}</span> of <span className="font-bold text-slate-800">{total}</span> total audit events
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── AUDIT EVENT JSON DRAWER ─────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Audit Record Snapshot</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Event ID:</span>
                <span className="text-[11px] text-slate-800 break-all">{selectedLog.id}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Correlation ID:</span>
                <span className="text-[11px] text-slate-800 break-all">{selectedLog.request_correlation_id || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Event Payload Snapshot:</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(
                  {
                    action: selectedLog.action,
                    actor: { email: selectedLog.actor_email, role: selectedLog.actor_role, id: selectedLog.actor_id },
                    target: { type: selectedLog.target_type, id: selectedLog.target_id },
                    result: selectedLog.result,
                    reason: selectedLog.reason,
                    previous_state: selectedLog.previous_state,
                    new_state: selectedLog.new_state,
                    evidence: selectedLog.evidence,
                    timestamp: selectedLog.created_at,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
