import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Layers, Shield, ChevronRight, PhoneCall, CheckCircle } from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useAppointmentsRealtime } from '../../hooks/useAppointmentsRealtime'
import { updateAppointmentStatus } from '../../services/appointmentService'
import { APPT_STATUS } from '../../hooks/useDashboardStats'

interface DoctorQueue {
  doctorId: string
  department: string
  doctor: string
  room: string
  serving: { id: string; token: string; patient: string }[]
  waiting: { id: string; token: string; patient: string; waitTime: string }[]
  completedToday: number
}

const todayStr = () => new Date().toISOString().split('T')[0]

export default function HospitalLiveQueuePage() {
  const { doctorProfile } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || ''

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [rooms, setRooms] = useState<Record<string, string>>({})

  // Today's appointments only, realtime — this IS the live queue.
  const { appointments, isLoading, refresh } = useAppointmentsRealtime(currentHospId, { date: todayStr() })

  useEffect(() => {
    if (!currentHospId) return
    supabase
      .from('doctor_details')
      .select('id, room_number')
      .eq('hospital_id', currentHospId)
      .then(({ data }) => {
        const map: Record<string, string> = {}
        ;(data || []).forEach((d) => { map[d.id] = d.room_number || 'OPD Room' })
        setRooms(map)
      })
  }, [currentHospId])

  const queues: DoctorQueue[] = useMemo(() => {
    const byDoctor = new Map<string, DoctorQueue>()
    appointments.forEach((a) => {
      if (!byDoctor.has(a.doctor_id)) {
        byDoctor.set(a.doctor_id, {
          doctorId: a.doctor_id,
          department: a.department?.name || a.doctor?.department || 'General OPD',
          doctor: a.doctor?.full_name || 'Doctor',
          room: rooms[a.doctor_id] || 'OPD Room',
          serving: [],
          waiting: [],
          completedToday: 0,
        })
      }
      const q = byDoctor.get(a.doctor_id)!
      if (a.status === APPT_STATUS.IN_CONSULTATION) {
        q.serving.push({ id: a.id, token: a.queue_number, patient: a.patient_name })
      } else if (a.status === APPT_STATUS.WAITING) {
        q.waiting.push({ id: a.id, token: a.queue_number, patient: a.patient_name, waitTime: `${(a.token_number || 1) * 8} min` })
      } else if (a.status === APPT_STATUS.COMPLETED) {
        q.completedToday += 1
      }
    })
    // Only doctors with at least one active (serving/waiting) item — a
    // fully-idle doctor doesn't clutter the live queue view.
    return Array.from(byDoctor.values())
      .filter((q) => q.serving.length > 0 || q.waiting.length > 0)
      .filter((q) => !departmentFilter || q.department === departmentFilter)
      .sort((a, b) => b.waiting.length - a.waiting.length)
  }, [appointments, rooms, departmentFilter])

  const departments = useMemo(() => Array.from(new Set(appointments.map((a) => a.department?.name || a.doctor?.department || 'General OPD'))), [appointments])

  const selectedQueue = queues.find((q) => q.doctorId === selectedDoctorId) || null

  const handleCallNext = async (q: DoctorQueue) => {
    const next = q.waiting[0]
    if (!next) return
    setBusyId(next.id)
    try {
      // Whoever is currently "In Consultation" for this doctor is done being
      // called in — move them along to Completed before calling the next
      // token, so a doctor never has two patients marked "serving" at once.
      for (const s of q.serving) {
        await updateAppointmentStatus(s.id, APPT_STATUS.COMPLETED, s.patient)
      }
      await updateAppointmentStatus(next.id, APPT_STATUS.IN_CONSULTATION, next.patient)
    } catch (e: any) {
      alert(`Could not call next patient: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  const handleCompleteServing = async (item: { id: string; patient: string }) => {
    setBusyId(item.id)
    try {
      await updateAppointmentStatus(item.id, APPT_STATUS.COMPLETED, item.patient)
    } catch (e: any) {
      alert(`Could not complete: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <HospitalDashboardLayout pageTitle="Live Queue">
      <div className="space-y-6">
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Real-Time Hospital Token Engine</h3>
              <p className="text-xs text-slate-400">Every doctor's queue is separate and updates live via Supabase Realtime</p>
            </div>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading queues…</div>
        ) : queues.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Layers size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Active Live Queues</h4>
            <p className="text-xs text-slate-500">Queues appear here once a doctor has a Waiting or In Consultation appointment today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {queues.map((q) => {
              const serving = q.serving[0]
              const nextUp = q.waiting[0]
              return (
                <motion.div
                  key={q.doctorId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Shield size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{q.department}</h4>
                          <p className="text-xs text-slate-400">{q.doctor} • {q.room}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Live</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 mb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Now Serving</span>
                        {serving ? (
                          <>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">{serving.token}</span>
                            <span className="text-xs text-slate-600 font-semibold block mt-0.5">{serving.patient}</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400 font-semibold">No one in consultation</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waiting</span>
                        <span className="text-lg font-bold text-blue-600">{q.waiting.length}</span>
                        <span className="text-xs text-slate-400 block">Completed today: {q.completedToday}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 py-1.5 px-2 bg-slate-100/60 rounded-xl">
                      <span>Next:</span>
                      <span className="font-bold text-slate-900">{nextUp ? `${nextUp.patient} (${nextUp.token})` : 'None'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedDoctorId(q.doctorId)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <span>View Lineup</span>
                      <ChevronRight size={14} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {serving && (
                        <button
                          disabled={busyId === serving.id}
                          onClick={() => handleCompleteServing(serving)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-bold disabled:opacity-40"
                        >
                          <CheckCircle size={12} /> Complete
                        </button>
                      )}
                      {nextUp && (
                        <button
                          disabled={busyId === nextUp.id}
                          onClick={() => handleCallNext(q)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-40"
                        >
                          <PhoneCall size={12} /> Call Next
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {selectedQueue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedQueue.department} Queue</h3>
                <p className="text-slate-400">{selectedQueue.doctor} • {selectedQueue.room}</p>
              </div>
              <button onClick={() => setSelectedDoctorId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2.5 my-4 max-h-96 overflow-y-auto">
              {selectedQueue.serving.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl border flex items-center justify-between bg-emerald-50/80 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-extrabold text-slate-900 shadow-sm">{item.token}</span>
                    <p className="font-bold text-slate-900">{item.patient}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">SERVING</span>
                </div>
              ))}
              {selectedQueue.waiting.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${idx === 0 ? 'bg-blue-50/80 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-extrabold text-slate-900 shadow-sm">{item.token}</span>
                    <div>
                      <p className="font-bold text-slate-900">{item.patient}</p>
                      <p className="text-[10px] text-slate-400">Est. wait: {item.waitTime}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {idx === 0 ? 'NEXT' : 'WAITING'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedDoctorId(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </HospitalDashboardLayout>
  )
}
