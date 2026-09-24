import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Plus,
  Printer,
  XCircle,
  CheckCircle2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useAppointmentsRealtime } from '../../hooks/useAppointmentsRealtime'
import { createManualAppointment, updateAppointmentStatus, AppointmentRow } from '../../services/appointmentService'
import { APPT_STATUS } from '../../hooks/useDashboardStats'

const STATUS_TONE: Record<string, string> = {
  [APPT_STATUS.COMPLETED]: 'bg-emerald-100 text-emerald-700',
  [APPT_STATUS.WAITING]: 'bg-blue-100 text-blue-700',
  [APPT_STATUS.IN_CONSULTATION]: 'bg-amber-100 text-amber-700',
  [APPT_STATUS.CANCELLED]: 'bg-orange-100 text-orange-700',
  [APPT_STATUS.NO_SHOW]: 'bg-rose-100 text-rose-700',
}

const PAGE_SIZE = 15

export default function HospitalAppointmentsPage() {
  const { doctorProfile } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(0)
  const [selectedAppt, setSelectedAppt] = useState<AppointmentRow | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [registeredDoctors, setRegisteredDoctors] = useState<{ id: string; name: string; dept: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])

  const { appointments, isLoading, refresh } = useAppointmentsRealtime(currentHospId, {
    doctorId: doctorFilter || undefined,
    status: statusFilter || undefined,
    date: dateFilter || undefined,
  })

  useEffect(() => {
    if (!currentHospId) return
    supabase
      .from('profiles')
      .select('id, full_name, department')
      .eq('hospital_id', currentHospId)
      .eq('role', 'doctor')
      .eq('is_active', true)
      .then(({ data }) => setRegisteredDoctors((data || []).map((d) => ({ id: d.id, name: d.full_name, dept: d.department || 'General OPD' }))))

    supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', currentHospId)
      .eq('is_active', true)
      .then(({ data }) => setDepartments(data || []))
  }, [currentHospId])

  const [newForm, setNewForm] = useState({
    patientName: '',
    phone: '',
    age: '',
    gender: 'Male',
    doctorId: '',
    departmentId: '',
    symptoms: '',
    isEmergency: false,
  })

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return appointments
    const q = searchTerm.toLowerCase()
    return appointments.filter(
      (a) => a.patient_name?.toLowerCase().includes(q) || a.patient_phone?.includes(q) || a.queue_number?.toLowerCase().includes(q)
    )
  }, [appointments, searchTerm])

  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.doctorId) {
      alert('Select a doctor for this appointment.')
      return
    }
    setCreating(true)
    try {
      const result = await createManualAppointment({
        doctorId: newForm.doctorId,
        patientName: newForm.patientName,
        patientPhone: newForm.phone,
        patientAge: newForm.age ? Number(newForm.age) : undefined,
        patientGender: newForm.gender,
        departmentId: newForm.departmentId || undefined,
        symptoms: newForm.symptoms || undefined,
        isEmergency: newForm.isEmergency,
      })
      flash(`✓ Appointment ${result.queue_number} scheduled for ${newForm.patientName}!`)
      setShowAddModal(false)
      setNewForm({ patientName: '', phone: '', age: '', gender: 'Male', doctorId: '', departmentId: '', symptoms: '', isEmergency: false })
      refresh()
    } catch (err: any) {
      alert(`Could not create appointment: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (appt: AppointmentRow, status: string) => {
    setBusyId(appt.id)
    try {
      await updateAppointmentStatus(appt.id, status, appt.patient_name)
      flash(`Status updated to ${status}`)
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <HospitalDashboardLayout pageTitle="Appointments">
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
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, phone or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(0) }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            />
            <select
              value={doctorFilter}
              onChange={(e) => { setDoctorFilter(e.target.value); setPage(0) }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Doctors</option>
              {registeredDoctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              {Object.values(APPT_STATUS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Plus size={15} />
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-5">Token</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor & Department</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-xs">Loading appointments…</td></tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No appointments match these filters.
                    </td>
                  </tr>
                ) : (
                  paged.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200/50">
                          {appt.queue_number}
                        </span>
                        {appt.is_emergency && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-[9.5px] font-bold text-rose-600">
                            <AlertCircle size={10} /> Urgent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{appt.patient_name}</div>
                        <div className="text-[11px] text-slate-400">{appt.patient_age || '—'} / {appt.patient_gender?.[0] || '—'} • {appt.patient_phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{appt.doctor?.full_name || '—'}</div>
                        <div className="text-[11px] text-slate-400">{appt.department?.name || appt.doctor?.department || 'General OPD'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{appt.booking_method}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_TONE[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button onClick={() => setSelectedAppt(appt)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600" title="View">
                            <Eye size={13} />
                          </button>
                          {appt.status !== APPT_STATUS.COMPLETED && (
                            <button
                              disabled={busyId === appt.id}
                              onClick={() => handleStatusChange(appt, APPT_STATUS.COMPLETED)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40"
                              title="Mark Completed"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          {appt.status !== APPT_STATUS.NO_SHOW && appt.status !== APPT_STATUS.COMPLETED && (
                            <button
                              disabled={busyId === appt.id}
                              onClick={() => handleStatusChange(appt, APPT_STATUS.NO_SHOW)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-40"
                              title="Mark Missed"
                            >
                              <AlertCircle size={13} />
                            </button>
                          )}
                          {appt.status !== APPT_STATUS.CANCELLED && appt.status !== APPT_STATUS.COMPLETED && (
                            <button
                              disabled={busyId === appt.id}
                              onClick={() => handleStatusChange(appt, APPT_STATUS.CANCELLED)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                              title="Cancel"
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {paged.length} of {filtered.length} appointments</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">{page + 1} / {totalPages}</span>
              <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Appointment Details</h3>
                <span className="text-blue-600 font-bold">{selectedAppt.queue_number}</span>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <span className="text-slate-400 font-medium block">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAppt.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Phone</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAppt.patient_phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Doctor & Department</span>
                <span className="font-bold text-slate-900">{selectedAppt.doctor?.full_name}</span>
                <span className="text-slate-500 block text-[11px]">{selectedAppt.department?.name || 'General OPD'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Date</span>
                <span className="font-bold text-slate-900">{selectedAppt.appointment_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Booking Method</span>
                <span className="font-semibold text-slate-800">{selectedAppt.booking_method}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Current Status</span>
                <span className="font-bold text-emerald-600">{selectedAppt.status}</span>
              </div>
              {selectedAppt.symptoms && (
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium block">Symptoms</span>
                  <span className="font-semibold text-slate-800">{selectedAppt.symptoms}</span>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50">
                <Printer size={14} />
                <span>Print Slip</span>
              </button>
              <button onClick={() => setSelectedAppt(null)} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Appointment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={newForm.patientName}
                  onChange={(e) => setNewForm({ ...newForm, patientName: e.target.value })}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Age" value={newForm.age} onChange={(e) => setNewForm({ ...newForm, age: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                <select value={newForm.gender} onChange={(e) => setNewForm({ ...newForm, gender: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
                <input type="tel" required placeholder="Phone" value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select value={newForm.departmentId} onChange={(e) => setNewForm({ ...newForm, departmentId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Unassigned</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Doctor</label>
                  <select required value={newForm.doctorId} onChange={(e) => setNewForm({ ...newForm, doctorId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select doctor</option>
                    {registeredDoctors.length === 0 ? (
                      <option disabled value="">No doctors registered</option>
                    ) : (
                      registeredDoctors.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.dept})</option>)
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Symptoms (optional)</label>
                <input type="text" value={newForm.symptoms} onChange={(e) => setNewForm({ ...newForm, symptoms: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <label className="flex items-center gap-2 text-slate-600 font-semibold">
                <input type="checkbox" checked={newForm.isEmergency} onChange={(e) => setNewForm({ ...newForm, isEmergency: e.target.checked })} />
                Mark as urgent / emergency
              </label>
              <button type="submit" disabled={creating} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition">
                {creating ? 'Scheduling…' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </HospitalDashboardLayout>
  )
}
