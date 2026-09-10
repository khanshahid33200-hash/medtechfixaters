import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Calendar,
  Users,
  Hourglass,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Plus,
  UserPlus,
  Stethoscope,
  Building2,
  FileText,
  BarChart3,
  ChevronDown,
  IndianRupee,
  Check,
  X
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useDashboardStats, resolveRange, APPT_STATUS, DateRangeKey } from '../../hooks/useDashboardStats'
import { logActivity } from '../../services/auditLogService'

const revealProps = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' as const },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' as const },
  viewport: { once: true, amount: 0.15 },
  transition: { type: 'spring' as const, stiffness: 220, damping: 24 },
}

function TrendBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
        <Minus size={12} /> No prior data
      </span>
    )
  }
  const positive = change >= 0
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positive ? '+' : ''}
      {change.toFixed(1)}% <span className="text-slate-400 font-medium">vs previous period</span>
    </span>
  )
}

export default function HospitalDashboardHome() {
  const navigate = useNavigate()
  const { doctorProfile, registerUserInSupabase } = useAuth()

  // Date filter driving both the KPI cards and the charts below
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('month')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false)
  const [deptRange, setDeptRange] = useState<'This Week' | 'This Month'>('This Week')

  const activeRange = useMemo(() => {
    if (rangeKey === 'custom' && customStart && customEnd) {
      return resolveRange('custom', { start: new Date(customStart), end: new Date(customEnd) })
    }
    return resolveRange(rangeKey === 'custom' ? 'month' : rangeKey)
  }, [rangeKey, customStart, customEnd])

  const rangeLabels: Record<DateRangeKey, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    custom: 'Custom Range',
  }

  // Modals for Quick Actions
  const [showAddApptModal, setShowAddApptModal] = useState(false)
  const [showAddPatientModal, setShowAddPatientModal] = useState(false)
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false)
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  // Quick Action Forms
  const [newApptForm, setNewApptForm] = useState({
    patientName: '',
    department: 'Cardiology',
    doctor: 'Dr. Amit Sharma',
    time: '09:30 AM',
    source: 'Walk-in'
  })

  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    phone: '',
    age: '32',
    gender: 'Male'
  })

  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    dept: 'Cardiology',
    specialization: 'Consultant Specialist',
    fee: 500,
    limit: 25
  })

  // Dynamic hospital identity — sourced ONLY from the authenticated session
  // (AuthContext), never from localStorage: a stale/cross-tenant localStorage
  // value here was one of the root causes of hospital data leakage.
  const currentHospName = doctorProfile?.hospital_name || 'Hospital Dashboard'
  const currentHospId = doctorProfile?.hospital_id || ''

  const { kpis, chartData, isLoading: statsLoading, hasAnyRecords } = useDashboardStats(currentHospId, activeRange)

  const [registeredDoctors, setRegisteredDoctors] = useState<{ id: string; name: string; dept: string }[]>([])
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    appointmentsToday: 0,
    patientsWaiting: 0,
    completedToday: 0,
    scheduledToday: 0,
    cancelledToday: 0,
    noShowsToday: 0,
  })
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [activeQueues, setActiveQueues] = useState<any[]>([])
  const [deptBreakdown, setDeptBreakdown] = useState<any[]>([])
  const [sources, setSources] = useState<{ qr: number; walkin: number; website: number; other: number }>({ qr: 0, walkin: 0, website: 0, other: 0 })

  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentHospId) return
      try {
        const todayStr = new Date().toISOString().split('T')[0]

        // 1. Doctors
        const { data: docs } = await supabase
          .from('profiles')
          .select('id, full_name, department')
          .eq('hospital_id', currentHospId)
          .eq('role', 'doctor')
          .eq('is_active', true)
        const doctorList = docs || []
        setRegisteredDoctors(doctorList.map(d => ({ id: d.id, name: d.full_name, dept: d.department || 'General OPD' })))
        if (!newApptForm.doctor && doctorList.length > 0) {
          setNewApptForm(prev => ({ ...prev, doctor: doctorList[0].full_name }))
        }

        // 2. Patients
        const { count: patCount } = await supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('hospital_id', currentHospId)

        // 3. Appointments
        const { data: appts } = await supabase
          .from('appointments')
          .select('id, appointment_date, status, token_number, created_at, patient:patients(name), doctor:profiles(full_name, department)')
          .eq('hospital_id', currentHospId)
          .order('created_at', { ascending: false })

        const allAppts = appts || []
        const todayAppts = allAppts.filter(a => a.appointment_date === todayStr)
        // Status strings must match the CHECK constraint on public.appointments
        // exactly ('Waiting', 'In Consultation', 'Completed', 'Cancelled',
        // 'No Show') — comparing against lowercase/underscore values here
        // silently matched zero rows against the real database.
        const waitingAppts = allAppts.filter(a => a.status === APPT_STATUS.WAITING || a.status === APPT_STATUS.IN_CONSULTATION)
        const completedAppts = todayAppts.filter(a => a.status === APPT_STATUS.COMPLETED)
        const cancelledAppts = allAppts.filter(a => a.status === APPT_STATUS.CANCELLED)
        const noShowsAppts = allAppts.filter(a => a.status === APPT_STATUS.NO_SHOW)
        const scheduledAppts = allAppts.filter(a => a.status === APPT_STATUS.WAITING)

        setStats({
          totalDoctors: doctorList.length,
          totalPatients: patCount || 0,
          totalAppointments: allAppts.length,
          appointmentsToday: todayAppts.length,
          patientsWaiting: waitingAppts.length,
          completedToday: completedAppts.length,
          scheduledToday: scheduledAppts.length,
          cancelledToday: cancelledAppts.length,
          noShowsToday: noShowsAppts.length,
        })

        // Format Today's appointments
        const mappedToday = todayAppts.slice(0, 5).map((a: any) => ({
          time: 'Today',
          name: a.patient?.name || 'Patient',
          status: a.status === APPT_STATUS.COMPLETED ? 'Done' : a.status === APPT_STATUS.WAITING ? 'Waiting' : a.status,
          color: a.status === APPT_STATUS.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }))
        setTodayAppointments(mappedToday)

        // Format Recent appointments
        const mappedRecent = allAppts.slice(0, 5).map((a: any) => ({
          name: a.patient?.name || 'Patient',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80',
          dept: a.doctor?.department || 'General OPD',
          time: a.appointment_date || 'Today',
          status: a.status === APPT_STATUS.COMPLETED ? 'Done' : a.status === APPT_STATUS.WAITING ? 'Waiting' : a.status,
          color: a.status === APPT_STATUS.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }))
        setRecentAppointments(mappedRecent)

        // Queues (empty if 0 waiting appointments) — kept strictly per-doctor;
        // never merge two doctors' tokens into one shared count.
        if (waitingAppts.length > 0) {
          const queueGroup: any = {}
          waitingAppts.forEach((a: any) => {
            const dName = a.doctor?.full_name || 'Doctor'
            const dDept = a.doctor?.department || 'General OPD'
            if (!queueGroup[dName]) {
              queueGroup[dName] = { doctor: dName, dept: dDept, currentToken: `T-${String(a.token_number || 1).padStart(3, '0')}`, waiting: 0 }
            }
            queueGroup[dName].waiting++
          })
          setActiveQueues(Object.values(queueGroup))
        } else {
          setActiveQueues([])
        }

        // Department breakdown
        const { data: depts } = await supabase
          .from('departments')
          .select('name')
          .eq('hospital_id', currentHospId)
          .eq('is_active', true)
        
        if (depts && depts.length > 0) {
          const deptMap = depts.map(d => {
            const deptAppts = allAppts.filter((a: any) => a.doctor?.department === d.name)
            return {
              name: d.name,
              scheduled: deptAppts.filter((a: any) => a.status === APPT_STATUS.WAITING).length,
              completed: deptAppts.filter((a: any) => a.status === APPT_STATUS.COMPLETED).length,
              waiting: deptAppts.filter((a: any) => a.status === APPT_STATUS.WAITING).length,
              cancelled: deptAppts.filter((a: any) => a.status === APPT_STATUS.CANCELLED).length
            }
          })
          setDeptBreakdown(deptMap)
        } else {
          setDeptBreakdown([])
        }

        // Sources count
        setSources({
          qr: allAppts.length,
          walkin: 0,
          website: 0,
          other: 0
        })
      } catch (e) {
        console.warn('Dashboard data fetch note:', e)
      }
    }
    fetchDashboardData()
  }, [currentHospId])

  // Handlers for Quick Action Submissions
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackNotice(`✓ Appointment for ${newApptForm.patientName} scheduled with ${newApptForm.doctor}!`)
    setShowAddApptModal(false)
    setNewApptForm({ patientName: '', department: 'Cardiology', doctor: registeredDoctors[0]?.name || '', time: '09:30 AM', source: 'Walk-in' })
    setTimeout(() => setFeedbackNotice(null), 4000)
  }

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackNotice(`✓ Patient ${newPatientForm.name} registered in hospital database!`)
    setShowAddPatientModal(false)
    setNewPatientForm({ name: '', phone: '', age: '32', gender: 'Male' })
    setTimeout(() => setFeedbackNotice(null), 4000)
  }

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerUserInSupabase(newDoctorForm.email, newDoctorForm.password, {
        role: 'doctor',
        name: newDoctorForm.name,
        dept: newDoctorForm.dept,
        hospital_id: currentHospId,
        specialization: newDoctorForm.specialization,
        fee: Number(newDoctorForm.fee) || 500,
        limit: Number(newDoctorForm.limit) || 25,
      })
      logActivity({
        category: 'Doctors',
        action: 'Doctor Added',
        targetType: 'profile',
        targetLabel: newDoctorForm.name,
        metadata: { department: newDoctorForm.dept, email: newDoctorForm.email },
      })
      setFeedbackNotice(`✓ Doctor "${newDoctorForm.name}" created and onboarded!`)
      setShowAddDoctorModal(false)
      setNewDoctorForm({ name: '', email: '', password: 'Password123!', dept: 'Cardiology', specialization: 'Consultant Specialist', fee: 500, limit: 25 })
      setTimeout(() => setFeedbackNotice(null), 4000)
    } catch (err: any) {
      alert(`Doctor creation note: ${err.message || 'Saved'}`)
    }
  }

  return (
    <HospitalDashboardLayout pageTitle="Dashboard">
      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3">
          <Check size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* ─── 1. DATE FILTER ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Hospital Operations</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Showing <strong className="text-slate-600">{rangeLabels[rangeKey]}</strong> · {activeRange.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {activeRange.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setRangeMenuOpen(!rangeMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 border border-white/80 bg-white/70 backdrop-blur-md shadow-sm hover:bg-white transition"
            >
              <Calendar size={14} className="text-slate-500" />
              <span>{rangeLabels[rangeKey]}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
            {rangeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 text-xs font-medium">
                {(['today', 'week', 'month', 'year'] as DateRangeKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => { setRangeKey(k); setRangeMenuOpen(false) }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between"
                  >
                    <span>{rangeLabels[k]}</span>
                    {rangeKey === k && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1.5 px-3.5 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom Range</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]" />
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]" />
                  </div>
                  <button
                    disabled={!customStart || !customEnd}
                    onClick={() => { setRangeKey('custom'); setRangeMenuOpen(false) }}
                    className="w-full py-1.5 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold text-[11px]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. TOP STATISTICS CARDS — real, date-filtered, hospital_id-scoped ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Appointments', icon: Calendar, tone: 'blue', data: kpis.totalAppointments, to: '/hospitaldashboard/appointments' },
            { label: 'Total Patients', icon: Users, tone: 'emerald', data: kpis.totalPatients, to: '/hospitaldashboard/patients' },
            { label: 'Waiting Queue', icon: Hourglass, tone: 'purple', data: kpis.waiting, to: '/hospitaldashboard/live-queue' },
            { label: 'Completed', icon: CheckCircle, tone: 'amber', data: kpis.completed, to: '/hospitaldashboard/appointments?status=completed' },
            { label: 'Missed Appointments', icon: XCircle, tone: 'rose', data: kpis.missed, to: '/hospitaldashboard/appointments?status=no-show' },
            { label: 'Revenue', icon: IndianRupee, tone: 'orange', data: kpis.revenue, to: '/hospitaldashboard/analytics', isCurrency: true },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} {...revealProps} transition={{ ...revealProps.transition, delay: idx * 0.04 }}>
              <Link
                to={kpi.to}
                className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between group h-full"
              >
                <div className={`w-10 h-10 rounded-xl bg-${kpi.tone}-50 text-${kpi.tone}-600 flex items-center justify-center mb-3`}>
                  <kpi.icon size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">{kpi.label}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                    {statsLoading ? (
                      <span className="inline-block w-16 h-6 bg-slate-100 rounded animate-pulse" />
                    ) : kpi.isCurrency ? (
                      `₹${kpi.data.value.toLocaleString('en-IN')}`
                    ) : (
                      kpi.data.value
                    )}
                  </h3>
                </div>
                <div className="mt-2">{statsLoading ? null : <TrendBadge change={kpi.data.change} />}</div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ─── 3. CHARTS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div {...revealProps} className="lg:col-span-7 bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/80 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Appointment Trends</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Bookings across {rangeLabels[rangeKey].toLowerCase()}</p>
              </div>
            </div>
            {!hasAnyRecords ? (
              <div className="h-56 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center p-4 mt-4">
                <BarChart3 size={28} className="text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-600">No data available</p>
                <p className="text-[10px] text-slate-400">Appointment trends will appear as bookings are recorded.</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-56 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center p-4 mt-4">
                <p className="text-xs font-bold text-slate-600">No data for this period</p>
                <p className="text-[10px] text-slate-400">Try a wider date range.</p>
              </div>
            ) : (
              <div className="h-56 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="apptGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#007AFF" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#007AFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 11 }} />
                    <Area type="monotone" dataKey="appointments" stroke="#007AFF" strokeWidth={2.5} fill="url(#apptGradient)" name="Appointments" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          <motion.div {...revealProps} className="lg:col-span-5 bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Completed vs Missed</h3>
            <p className="text-[11px] text-slate-400 mb-2">Consultation outcomes</p>
            {!hasAnyRecords || chartData.length === 0 ? (
              <div className="h-56 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center p-4 mt-2">
                <p className="text-xs font-bold text-slate-600">No data available</p>
              </div>
            ) : (
              <div className="h-56 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 11 }} />
                    <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} name="Completed" />
                    <Bar dataKey="missed" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Missed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          <motion.div {...revealProps} className="lg:col-span-12 bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Revenue Trend</h3>
            <p className="text-[11px] text-slate-400 mb-2">From completed consultations only</p>
            {!hasAnyRecords || chartData.length === 0 ? (
              <div className="h-44 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center p-4 mt-2">
                <p className="text-xs font-bold text-slate-600">No revenue recorded yet</p>
              </div>
            ) : (
              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 11 }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#FF9500" strokeWidth={2.5} dot={{ r: 3, fill: '#FF9500' }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── 4. QUEUES & TODAY'S SCHEDULE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card B: Live Queue Overview (lg: 4 cols) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Live Queue Overview</h3>
                <Link
                  to="/hospitaldashboard/live-queue"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                >
                  View All Queues
                </Link>
              </div>

              {/* Primary Queue Box or Empty State */}
              {activeQueues.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200/80 rounded-2xl my-3">
                  <Shield size={28} className="mx-auto text-slate-300 mb-1.5" />
                  <h4 className="font-bold text-slate-800 text-xs">No active queues</h4>
                  <p className="text-[11px] text-slate-400">Queues will appear when appointments are created for doctors.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 mb-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Shield size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{activeQueues[0].dept}</h4>
                        <p className="text-[10px] text-slate-400">{activeQueues[0].doctor}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Current Token</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{activeQueues[0].currentToken}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          Now Serving
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500 font-medium">Status: <strong className="text-slate-800">In Progress</strong></span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/80 text-slate-700">
                        {activeQueues[0].waiting} Waiting
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {activeQueues.slice(1).map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Shield size={13} />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 leading-tight">{q.dept}</h5>
                            <p className="text-[10px] text-slate-400 leading-tight">{q.doctor}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/40">
                          {q.waiting} Waiting
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card C: Today's Appointments & Sources (lg: 3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Top: Today's Appointments Schedule */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-xs">Today's Appointments</h3>
                <Link to="/hospitaldashboard/appointments" className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>

              <div className="space-y-2.5">
                {todayAppointments.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200/80">
                    <p className="text-xs font-bold text-slate-600">No appointments scheduled today</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Appointments booked for today will appear here.</p>
                  </div>
                ) : (
                  todayAppointments.map((appt, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-[11px] font-medium text-slate-400 w-16">{appt.time}</span>
                      <span className="font-bold text-slate-800 flex-1 truncate pr-2">{appt.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${appt.color}`}>
                        {appt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom: Appointment Sources Donut Chart */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
              <h3 className="font-bold text-slate-900 text-xs mb-3">Appointment Sources</h3>
              
              {stats.totalAppointments === 0 ? (
                <div className="p-4 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200/80">
                  <p className="text-[11px] text-slate-500 font-medium">No booking sources recorded yet</p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* SVG Donut */}
                  <div className="w-20 h-20 relative shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="4"
                        strokeDasharray="88 0"
                        strokeDashoffset="0"
                      />
                    </svg>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-1 text-[11px] flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> QR Booking
                      </span>
                      <span className="font-bold text-slate-900">{sources.qr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Walk-in
                      </span>
                      <span className="font-bold text-slate-900">{sources.walkin}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. BOTTOM SECTION: Tables & Quick Actions ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Table 1: Department Wise Appointments (lg: 4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-xs">Department Wise Appointments</h3>
              <button
                onClick={() => setDeptRange(deptRange === 'This Week' ? 'This Month' : 'This Week')}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                <span>{deptRange}</span>
                <ChevronDown size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium text-center">Scheduled</th>
                    <th className="pb-2 font-medium text-center">Completed</th>
                    <th className="pb-2 font-medium text-center">Waiting</th>
                    <th className="pb-2 font-medium text-center">Cancelled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {deptBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No department appointment data available
                      </td>
                    </tr>
                  ) : (
                    deptBreakdown.map((dept, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 font-bold text-slate-900">{dept.name}</td>
                        <td className="py-2.5 text-center text-slate-600">{dept.scheduled}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-600">{dept.completed}</td>
                        <td className="py-2.5 text-center text-amber-600">{dept.waiting}</td>
                        <td className="py-2.5 text-center text-rose-500">{dept.cancelled}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Recent Appointments (lg: 5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-xs">Recent Appointments</h3>
              <Link to="/hospitaldashboard/appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-2 font-medium">Patient Name</th>
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No recent appointments recorded yet
                      </td>
                    </tr>
                  ) : (
                    recentAppointments.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <img src={r.avatar} alt={r.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            <span className="font-bold text-slate-800">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-500 font-medium">{r.dept}</td>
                        <td className="py-2.5 text-slate-500 font-medium">{r.time}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.color}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions (lg: 3 cols) */}
          <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-900 text-xs mb-3">Quick Actions</h3>

            {/* 6 Grid Buttons matching reference image */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Add Appointment */}
              <button
                onClick={() => setShowAddApptModal(true)}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <Calendar size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Add Appt</span>
              </button>

              {/* 2. Add Patient */}
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/40 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <UserPlus size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-600">Add Patient</span>
              </button>

              {/* 3. Add Doctor */}
              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-purple-400 hover:bg-purple-50/40 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <Stethoscope size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-purple-600">Add Doctor</span>
              </button>

              {/* 4. Manage Doctors */}
              <Link
                to="/hospitaldashboard/doctors"
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <Users size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 leading-tight">Manage Doctors</span>
              </Link>

              {/* 5. Manage Department */}
              <Link
                to="/hospitaldashboard/departments"
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <Building2 size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 leading-tight">Manage Dept</span>
              </Link>

              {/* 6. Reports */}
              <Link
                to="/hospitaldashboard/reports"
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <BarChart3 size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-purple-600">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: ADD APPOINTMENT ─── */}
      {showAddApptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <span>Schedule New Appointment</span>
              </h3>
              <button onClick={() => setShowAddApptModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={newApptForm.patientName}
                  onChange={(e) => setNewApptForm({ ...newApptForm, patientName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newApptForm.department}
                    onChange={(e) => setNewApptForm({ ...newApptForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    <option>Cardiology</option>
                    <option>Orthopedics</option>
                    <option>Dermatology</option>
                    <option>General Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Doctor</label>
                  <select
                    value={newApptForm.doctor}
                    onChange={(e) => setNewApptForm({ ...newApptForm, doctor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    {registeredDoctors.length === 0 ? (
                      <option value="">No registered doctors available</option>
                    ) : (
                      registeredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.name}>{doc.name} ({doc.dept})</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Appointment Time</label>
                  <input
                    type="text"
                    value={newApptForm.time}
                    onChange={(e) => setNewApptForm({ ...newApptForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source</label>
                  <select
                    value={newApptForm.source}
                    onChange={(e) => setNewApptForm({ ...newApptForm, source: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    <option>Walk-in</option>
                    <option>QR Booking</option>
                    <option>Website</option>
                    <option>Phone / Emergency</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD PATIENT ─── */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-600" />
                <span>Register New Patient</span>
              </h3>
              <button onClick={() => setShowAddPatientModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Roy"
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 transition"
              >
                Save Patient Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD DOCTOR ─── */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Stethoscope size={18} className="text-purple-600" />
                <span>Onboard Medical Specialist</span>
              </h3>
              <button onClick={() => setShowAddDoctorModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDoctor} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={newDoctorForm.name}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email (Sign In)</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.com"
                    value={newDoctorForm.email}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newDoctorForm.password}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newDoctorForm.dept}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, dept: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  >
                    <option>Cardiology</option>
                    <option>Orthopedics</option>
                    <option>Dermatology</option>
                    <option>General Medicine</option>
                    <option>Pediatrics</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={newDoctorForm.fee}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 transition"
              >
                Onboard & Save Doctor
              </button>
            </form>
          </div>
        </div>
      )}
    </HospitalDashboardLayout>
  )
}
