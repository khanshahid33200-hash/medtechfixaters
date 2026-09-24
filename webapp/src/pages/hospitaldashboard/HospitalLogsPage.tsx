import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ScrollText, Search, ChevronLeft, ChevronRight, Filter, CheckCircle2, XCircle, Clock3 } from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { fetchActivityLogs, ActivityLog } from '../../services/auditLogService'
import { fetchHospitalUsers, HospitalUser } from '../../services/hospitalUserService'

const PAGE_SIZE = 25

const statusIcon: Record<string, any> = {
  success: CheckCircle2,
  failed: XCircle,
  pending: Clock3,
}
const statusTone: Record<string, string> = {
  success: 'text-emerald-600',
  failed: 'text-rose-600',
  pending: 'text-amber-600',
}

export default function HospitalLogsPage() {
  const { doctorProfile } = useAuth()
  const hospitalId = doctorProfile?.hospital_id || ''

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<HospitalUser[]>([])

  const [search, setSearch] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (hospitalId) fetchHospitalUsers(hospitalId).then(setUsers)
  }, [hospitalId])

  const categories = useMemo(() => Array.from(new Set(logs.map((l) => l.category))).sort(), [logs])

  const load = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    const { rows, total: t } = await fetchActivityLogs(
      hospitalId,
      {
        search: search || undefined,
        actorId: actorFilter || undefined,
        category: categoryFilter || undefined,
        from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
      },
      page,
      PAGE_SIZE
    )
    setLogs(rows)
    setTotal(t)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, page])

  const applyFilters = () => {
    setPage(0)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <HospitalDashboardLayout pageTitle="Audit Logs">
      <div className="space-y-5">
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={15} className="text-slate-400" />
            <h3 className="text-xs font-bold text-slate-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action…"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
            <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]" />
            </div>
          </div>
          <button
            onClick={applyFilters}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            Apply Filters
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-xs">Loading logs…</td></tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <ScrollText size={26} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 font-semibold">No activity recorded yet</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Actions taken across the hospital dashboard will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const StatusIcon = statusIcon[log.status] || CheckCircle2
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{log.actor_email || 'System'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 capitalize">{(log.actor_role || '—').replace('_', ' ')}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{log.category}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{log.action}</td>
                        <td className="py-3 px-4 text-slate-500">{log.target_label || '—'}</td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${statusTone[log.status] || statusTone.success}`}>
                            <StatusIcon size={12} /> {log.status}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
              <span>Page {page + 1} of {totalPages} · {total} total entries</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </HospitalDashboardLayout>
  )
}
