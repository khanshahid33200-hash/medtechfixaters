import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { FEATURE_LABEL, summariseUsage, type UsageRow } from './aiFlags'

// AI usage from the ai_requests audit log. RLS decides what each viewer sees:
// super admins everything, hospital admins their hospital, doctors their own requests.
export default function AiUsageTable({ days = 7, title = 'AI usage' }: { days?: number; title?: string }) {
  const [rows, setRows] = useState<ReturnType<typeof summariseUsage>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    supabase
      .from('ai_requests')
      .select('feature, status, latency_ms, created_at, metadata')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000)
      .then(({ data, error: e }) => {
        if (e) setError('AI usage is not available yet. Run 05_AI_LAYER.sql.')
        else setRows(summariseUsage((data || []) as UsageRow[]))
        setLoading(false)
      })
  }, [days])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-black text-slate-900"><Activity size={15} className="text-indigo-600" /> {title} · last {days} days</p>
      {error ? (
        <p className="mt-3 text-xs text-slate-500">{error}</p>
      ) : loading ? (
        <p className="mt-3 text-xs text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs italic text-slate-400">No AI requests yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-2">Feature</th><th className="py-2 text-right">Requests</th><th className="py-2 text-right">Succeeded</th>
                <th className="py-2 text-right">Failed</th><th className="py-2 text-right">Rate limited</th><th className="py-2 text-right">Avg time</th><th className="py-2 text-right">Avg tokens</th><th className="py-2 text-right">Total tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r) => (
                <tr key={r.feature}>
                  <td className="py-2 font-bold text-slate-800">{FEATURE_LABEL[r.feature] || r.feature}</td>
                  <td className="py-2 text-right">{r.total}</td>
                  <td className="py-2 text-right text-emerald-700">{r.success}</td>
                  <td className={`py-2 text-right ${r.failed ? 'font-bold text-rose-600' : ''}`}>{r.failed}</td>
                  <td className="py-2 text-right">{r.limited}</td>
                  <td className="py-2 text-right text-slate-500">{r.avgMs != null ? `${(r.avgMs / 1000).toFixed(1)}s` : '—'}</td>
                  <td className="py-2 text-right text-slate-500">{r.avgTokens != null ? r.avgTokens.toLocaleString('en-IN') : '—'}</td>
                  <td className="py-2 text-right text-slate-500">{r.tokens ? r.tokens.toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
