import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  UserCheck,
  UserX,
  Ban,
  KeyRound,
  X,
  Stethoscope,
  Briefcase,
  Crown,
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import {
  fetchHospitalUsers,
  setUserActive,
  setUserBanStatus,
  changeUserRole,
  sendPasswordReset,
  HospitalUser,
} from '../../services/hospitalUserService'

// Full literal class strings (not template-interpolated) — Tailwind's JIT
// compiler statically scans source for class names, so `bg-${tone}-50`
// would never be generated into the CSS output and would silently render
// unstyled.
const roleMeta: Record<string, { label: string; icon: any; badgeClass: string }> = {
  hospital_admin: { label: 'Hospital Administrator', icon: Crown, badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/50' },
  doctor: { label: 'Doctor', icon: Stethoscope, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/50' },
  staff: { label: 'Staff', icon: Briefcase, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' },
}

const statusTone: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-amber-100 text-amber-700',
  blocked: 'bg-slate-200 text-slate-600',
  banned: 'bg-rose-100 text-rose-700',
  deleted: 'bg-slate-200 text-slate-500',
}

export default function HospitalUsersRolesPage() {
  const { doctorProfile, currentUser, registerUserInSupabase } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || ''
  const myUserId = currentUser?.id || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [users, setUsers] = useState<HospitalUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  const [newInvite, setNewInvite] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'doctor' | 'staff',
    department: 'General',
  })

  const loadUsers = async () => {
    if (!currentHospId) return
    setIsLoading(true)
    const data = await fetchHospitalUsers(currentHospId)
    setUsers(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [currentHospId])

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.role?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [users, searchTerm]
  )

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInvite.password || newInvite.password.length < 6) {
      alert('Password must be at least 6 characters — the new user will use it to sign in (and should change it after).')
      return
    }
    setInviting(true)
    try {
      const docCode = newInvite.role === 'doctor' ? `DOC-${Date.now().toString().slice(-3)}` : undefined
      await registerUserInSupabase(newInvite.email, newInvite.password, {
        role: newInvite.role,
        name: newInvite.name,
        hospital_id: currentHospId,
        dept: newInvite.department,
        doctor_code: docCode,
      })
      flash(`✓ ${newInvite.role === 'doctor' ? 'Doctor' : 'Staff member'} "${newInvite.name}" added.`)
      setShowInviteModal(false)
      setNewInvite({ name: '', email: '', password: '', role: 'staff', department: 'General' })
      loadUsers()
    } catch (err: any) {
      alert(`Could not create account: ${err.message || err}`)
    } finally {
      setInviting(false)
    }
  }

  const withActionGuard = async (userId: string, label: string, fn: () => Promise<void>) => {
    setActingOn(userId)
    try {
      await fn()
      flash(`✓ ${label}`)
      loadUsers()
    } catch (err: any) {
      alert(`Action failed: ${err.message || err}`)
    } finally {
      setActingOn(null)
    }
  }

  return (
    <HospitalDashboardLayout pageTitle="Users & Roles">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition shrink-0"
          >
            <Plus size={15} />
            <span>Add Team Member</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">Loading team…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                      No hospital users yet. Add your first doctor or staff member.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const meta = roleMeta[u.role] || roleMeta.staff
                    const RoleIcon = meta.icon
                    const isSelf = u.id === myUserId
                    const isAdmin = u.role === 'hospital_admin'
                    const busy = actingOn === u.id
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-5">
                          <span className="font-bold text-slate-900 block">{u.full_name}{isSelf && <span className="text-slate-400 font-medium"> (you)</span>}</span>
                          <span className="text-[11px] text-slate-400 block">{u.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          {isAdmin ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}>
                              <RoleIcon size={11} /> {meta.label}
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={busy}
                              onChange={(e) =>
                                withActionGuard(u.id, `Role changed to ${e.target.value}`, () =>
                                  changeUserRole(u.id, e.target.value as 'doctor' | 'staff', u.full_name)
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${meta.badgeClass}`}
                            >
                              <option value="doctor">Doctor</option>
                              <option value="staff">Staff</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{u.department || '—'}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusTone[u.account_status] || statusTone.active}`}>
                            {u.account_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          {isAdmin || isSelf ? (
                            <span className="text-[11px] text-slate-300">—</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Reset password"
                                disabled={busy}
                                onClick={() => withActionGuard(u.id, `Password reset email sent to ${u.email}`, () => sendPasswordReset(u.email))}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <KeyRound size={14} />
                              </button>
                              {u.account_status === 'banned' ? (
                                <button
                                  title="Unban"
                                  disabled={busy}
                                  onClick={() => withActionGuard(u.id, `${u.full_name} unbanned`, () => setUserBanStatus(u.id, false, u.full_name))}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  title="Ban"
                                  disabled={busy}
                                  onClick={() => {
                                    if (confirm(`Ban ${u.full_name}? Their login will be disabled immediately. Historical records are preserved.`)) {
                                      withActionGuard(u.id, `${u.full_name} banned`, () => setUserBanStatus(u.id, true, u.full_name))
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Ban size={14} />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  withActionGuard(u.id, `${u.full_name} marked ${u.is_active ? 'inactive' : 'active'}`, () =>
                                    setUserActive(u.id, !u.is_active, u.full_name)
                                  )
                                }
                                disabled={busy}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                                  u.is_active
                                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'
                                }`}
                              >
                                {u.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                                {u.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" /> Add Hospital Team Member
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newInvite.name}
                    onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address (Login)</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@hospital.com"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Min 6 characters — share securely"
                    value={newInvite.password}
                    onChange={(e) => setNewInvite({ ...newInvite, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Role</label>
                    <select
                      value={newInvite.role}
                      onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as 'doctor' | 'staff' })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="staff">Staff</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                    <input
                      type="text"
                      value={newInvite.department}
                      onChange={(e) => setNewInvite({ ...newInvite, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition"
                >
                  {inviting ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </HospitalDashboardLayout>
  )
}
