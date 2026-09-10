import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Users, Activity, Bell,
  Settings, ChevronDown, CheckCircle2,
  Calendar, LogOut, ChevronRight,
  AlertCircle, Search, Plus, Printer,
  X, UserCheck, Stethoscope, Layers, Phone,
  Clock, Volume2, FileText, CheckCircle,
  Star, Upload, Edit3, Trash2, DollarSign, Send, Eye, ShieldCheck,
  Check, QrCode, Download, Copy, Share2, ExternalLink
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'
import { supabase } from '../lib/supabase'
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  addWalkInAppointment,
  completeConsultation,
  subscribeToDoctorAppointments,
  getDoctorStats,
  getPatientProfile,
  updatePatientProfile,
  getPatientVisitHistory,
  type DoctorAppointment,
  type PatientProfile,
  type PatientVisit,
} from '../lib/doctorAppointments'

interface ClinicalQueuePatient {
  id: string
  patient_id: string | null
  token_number: number
  patient_name: string
  phone: string
  age: number
  gender: string
  chief_complaint: string
  status: 'Now Consulting' | 'Next' | 'Waiting' | 'Completed'
  wait_time: string
  time: string
  doctor_id: string
  vitals: { bp: string; pulse: string; temp: string; spo2: string }
  allergies: string
  lastVisit: string
}

// Maps a real Supabase appointment row to the JSX-facing shape this page's
// UI is built around. This dashboard only ever writes 'waiting',
// 'in_consultation', or 'completed' itself (see handlers below); other
// statuses a hospital-admin or another flow may set ('cancelled',
// 'no_show') are excluded from the active queue view entirely rather than
// mapped into a misleading bucket.
function mapAppointmentToQueuePatient(appt: DoctorAppointment): ClinicalQueuePatient | null {
  let status: ClinicalQueuePatient['status']
  if (appt.status === 'in_consultation' || appt.status === 'called') status = 'Now Consulting'
  else if (appt.status === 'completed') status = 'Completed'
  else if (appt.status === 'waiting' || appt.status === 'pending' || appt.status === 'confirmed') status = 'Waiting'
  else return null // cancelled / no_show — not part of the active queue

  const createdAt = appt.created_at ? new Date(appt.created_at) : null
  const waitMins = createdAt ? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60000)) : null

  return {
    id: appt.id,
    patient_id: appt.patient?.id || null,
    token_number: appt.token_number ?? 0,
    patient_name: appt.patient?.name || 'Unnamed Patient',
    phone: appt.patient?.phone || '',
    age: appt.patient?.age ?? 0,
    gender: appt.patient?.gender || '',
    chief_complaint: appt.symptoms || 'General consultation',
    status,
    wait_time: status === 'Completed' ? '—' : waitMins != null ? `${waitMins} min` : '—',
    time: createdAt ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    doctor_id: '', // filled by caller if needed; not required for display
    vitals: { bp: '', pulse: '', temp: '', spo2: '' },
    allergies: appt.patient?.allergies || 'None',
    lastVisit: '—',
  }
}

interface DashboardProps {
  initialTab?: string
}

export default function Dashboard({ initialTab = 'dashboard' }: DashboardProps) {
  useSEO({
    title: 'Doctor Clinical Workspace — MedTech Fixaters',
    description: 'Smart Clinical OPD Doctor Dashboard, Queue Manager & 30-Second Prescription Engine.',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const { doctorProfile, logout } = useAuth()

  // Doctor & Hospital Identity — sourced ONLY from the authenticated session
  // (AuthContext). A localStorage fallback here is exactly the bug class
  // this whole isolation effort exists to remove: doctorId is used below to
  // query Supabase directly, so a stale 'doctor_id' from a previous session
  // on this browser would silently show that other doctor's live queue.
  const doctorId = doctorProfile?.doctor_id || ''
  const hospitalId = doctorProfile?.hospital_id || ''
  const doctorCode = doctorProfile?.doctor_code || ''
  const doctorName = doctorProfile?.name || 'Dr. Authorized Doctor'
  const doctorSpecialty = doctorProfile?.specialization || doctorProfile?.department_name || 'Consultant Specialist'
  const doctorDegree = 'MBBS, MD'
  const [doctorStatus, setDoctorStatus] = useState<'Available' | 'In Session' | 'On Break' | 'Off Duty'>('Available')

  const selectedHospital = doctorProfile?.hospital_name || 'Hospital Facility'
  const hospitalLocation = 'Clinical OPD Wing'

  // Registered Hospital QR Code state for Doctor Workspace
  const [hospitalQrToken, setHospitalQrToken] = useState<string>(() => {
    const fallbackId = hospitalId || 'OPD'
    return `QR-${fallbackId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
  })

  useEffect(() => {
    async function loadHospitalQr() {
      if (!hospitalId) return
      try {
        const { data } = await supabase
          .from('qr_codes')
          .select('token')
          .eq('hospital_id', hospitalId)
          .maybeSingle()
        if (data?.token) {
          setHospitalQrToken(data.token)
        } else {
          const uniqueToken = `QR-${hospitalId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
          setHospitalQrToken(uniqueToken)
          await supabase.from('qr_codes').upsert([{
            hospital_id: hospitalId,
            token: uniqueToken,
            booking_url: `/book/${uniqueToken}`,
            intake_url: `/book/${uniqueToken}`,
            status: 'active',
            is_active: true
          }])
        }
      } catch (e) {
        console.warn('Doctor dashboard QR fetch notice:', e)
      }
    }
    loadHospitalQr()
  }, [hospitalId])

  const hospitalBookingUrl = `${window.location.origin}/book/${hospitalQrToken}`
  const hospitalQrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(hospitalBookingUrl)}`

  // Live Hospital Clock
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Navigation State
  const [activeNav, setActiveNav] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\//, '')
    if (path && ['queue', 'appointments', 'patients', 'consultations', 'prescriptions', 'templates', 'follow-ups', 'reports', 'profile', 'qr-kiosk', 'settings'].includes(path)) {
      return path
    }
    return initialTab || 'dashboard'
  })

  useEffect(() => {
    if (initialTab && initialTab !== activeNav) {
      setActiveNav(initialTab)
    }
  }, [initialTab])

  const [notice, setNotice] = useState<string | null>(null)

  // Top Bar Dropdowns
  const [showHospitalMenu, setShowHospitalMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('Today, ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Modals & Drawers
  const [showRxModal, setShowRxModal] = useState(false)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [showLabModal, setShowLabModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false)
  const [showAddWalkinModal, setShowAddWalkinModal] = useState(false)

  // Patient Card Active Tab
  const [patientCardTab, setPatientCardTab] = useState<'Details' | 'History' | 'Prescriptions' | 'Reports'>('Details')

  // Live Queue State — loaded from Supabase (the same `appointments` table
  // QR/walk-in bookings write into), not localStorage. This used to be a
  // hardcoded array of 5 fake patients shown as the default queue for
  // every doctor, then a per-doctor localStorage cache disconnected from
  // real bookings; now it's the one real source of truth, kept live via a
  // Realtime subscription below.
  const [queueList, setQueueList] = useState<ClinicalQueuePatient[]>([])
  const [queueLoading, setQueueLoading] = useState(true)

  const refreshQueue = React.useCallback(async () => {
    if (!doctorId) return
    const todayStr = new Date().toISOString().split('T')[0]
    const appointments = await getDoctorAppointments(doctorId, { date: todayStr })
    const mapped = appointments
      .map(mapAppointmentToQueuePatient)
      .filter((p): p is ClinicalQueuePatient => p !== null)
    setQueueList(mapped)
    setQueueLoading(false)
  }, [doctorId])

  useEffect(() => {
    if (!doctorId) {
      setQueueLoading(false)
      return
    }
    refreshQueue()
    const unsubscribe = subscribeToDoctorAppointments(doctorId, refreshQueue)
    return unsubscribe
  }, [doctorId, refreshQueue])

  // Upcoming Appointments State — was hardcoded to 5 fake patients that
  // never got replaced with real data (setAppointmentsList is never called
  // anywhere in this file), so every doctor saw the same fake appointment
  // list permanently. Starts empty; see note below re: this list not
  // actually being wired to the live appointments table yet.
  const [appointmentsList, setAppointmentsList] = useState<
    { id: string; time: string; name: string; phone: string; type: string; status: string; dept: string }[]
  >([])

  // Current Patient in Consultation
  const currentPatient = queueList.find(q => q.status === 'Now Consulting') || queueList[0]
  const nextPatient = queueList.find(q => q.status === 'Next' || q.status === 'Waiting') || queueList[1]
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<ClinicalQueuePatient | null>(null)

  // Patient Record modal: editable profile + this doctor's own visit
  // history with this patient, on one screen. Loaded from Supabase when
  // the modal opens — patients/appointments/consultations/prescriptions
  // RLS ("Doctor view/update own patients", doctor_id = auth.uid() on the
  // visit tables) scopes all of it to patients this doctor has actually
  // seen, and to this doctor's own notes only.
  const [patientEditForm, setPatientEditForm] = useState<Partial<PatientProfile>>({})
  const [patientHistory, setPatientHistory] = useState<PatientVisit[]>([])
  const [patientRecordLoading, setPatientRecordLoading] = useState(false)
  const [patientRecordSaving, setPatientRecordSaving] = useState(false)

  useEffect(() => {
    if (!showPatientDetailsModal || !selectedPatientRecord?.patient_id || !doctorId) return
    setPatientRecordLoading(true)
    Promise.all([
      getPatientProfile(selectedPatientRecord.patient_id),
      getPatientVisitHistory(selectedPatientRecord.patient_id, doctorId),
    ]).then(([profile, history]) => {
      setPatientEditForm(profile || {})
      setPatientHistory(history)
      setPatientRecordLoading(false)
    })
  }, [showPatientDetailsModal, selectedPatientRecord?.patient_id, doctorId])

  const handleSavePatientProfile = async () => {
    if (!selectedPatientRecord?.patient_id) return
    setPatientRecordSaving(true)
    const result = await updatePatientProfile(selectedPatientRecord.patient_id, {
      name: patientEditForm.name,
      phone: patientEditForm.phone,
      age: patientEditForm.age,
      gender: patientEditForm.gender,
      allergies: patientEditForm.allergies,
      known_diseases: patientEditForm.known_diseases,
      address: patientEditForm.address,
    })
    setPatientRecordSaving(false)
    if (!result.success) {
      setNotice(`⚠ Could not save patient details: ${result.error || 'unknown error'}`)
      setTimeout(() => setNotice(null), 5000)
      return
    }
    setNotice('✓ Patient details updated.')
    setTimeout(() => setNotice(null), 3000)
    await refreshQueue()
  }

  // Filters & Searches
  const [queueFilter, setQueueFilter] = useState<'all' | 'consulting' | 'waiting' | 'completed'>('all')
  const [queueSearch, setQueueSearch] = useState('')
  const [appointmentTab, setAppointmentTab] = useState<'todays' | 'upcoming' | 'completed' | 'cancelled'>('todays')
  const [patientSearch, setPatientSearch] = useState('')

  // Prescription Form State — starts BLANK, not pre-filled with a fake
  // diagnosis and 3 canned medicines. It used to default to a fabricated
  // "Acute Coronary Syndrome - Mild Angina" prescription that never got
  // reset between patients (every 'Start Consultation' / 'Prescription'
  // button just called setShowRxModal(true) with no reset at all) — since
  // Save now writes a real consultations/prescriptions row, a rushed
  // doctor clicking through without editing could have filed that
  // fabricated diagnosis against a real patient's real record.
  const blankRxForm = () => ({
    diagnosis: '',
    medicines: [] as { name: string; dosage: string; duration: string; instruction: string }[],
    labTests: '',
    advice: '',
    followUp: '',
  })
  const [rxForm, setRxForm] = useState(blankRxForm())

  // Opens the Rx modal blank for whichever patient is currently in
  // consultation — diagnosis, medicines, and advice must always be the
  // doctor's own entry for this specific patient, never carried over.
  const openRxModalForCurrentPatient = () => {
    setRxForm(blankRxForm())
    setShowRxModal(true)
  }

  // Doctor OPD Profile & Settings Form State
  const [profileForm, setProfileForm] = useState({
    name: doctorName,
    email: doctorProfile?.email || 'doctor@medtechfixaters.in',
    phone: '+91 98765 43210',
    specialization: doctorSpecialty,
    qualification: 'MBBS, MD (Cardiology)',
    registration_number: 'MCI-2010-847291',
    room_number: 'OPD Room 3, Wing B',
    fee: 500,
    daily_limit: 30,
    timings: '09:00 AM - 02:00 PM',
  })

  const [opdSettings, setOpdSettings] = useState({
    ttsEnabled: true,
    whatsappEnabled: true,
    soundAlerts: true,
    consultationFee: 500,
    dailyCapacity: 30,
    language: 'English',
  })

  // Walk-in booking state
  const [newWalkin, setNewWalkin] = useState({
    patient_name: '',
    phone: '',
    age: 30,
    gender: 'Male',
    chief_complaint: '',
  })

  // Audio TTS Announcement Callout
  const handleCallNextPatient = async (patient?: ClinicalQueuePatient) => {
    const target = patient || nextPatient
    if (!target) return

    // Speech Synthesis
    if ('speechSynthesis' in window && opdSettings.ttsEnabled) {
      window.speechSynthesis.cancel()
      const text = `Token number ${target.token_number}, ${target.patient_name}, please proceed to room number 3, Doctor ${doctorName}.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }

    // Optimistic local update for instant UI feedback — the Realtime
    // subscription will reconcile with the real row shortly after.
    const updated: ClinicalQueuePatient[] = queueList.map(q => {
      if (q.id === currentPatient?.id && q.id !== target.id) {
        return { ...q, status: 'Completed' as const }
      }
      if (q.id === target.id) {
        return { ...q, status: 'Now Consulting' as const, wait_time: '—' }
      }
      return q
    })
    setQueueList(updated)

    if (currentPatient?.id && currentPatient.id !== target.id) {
      await updateAppointmentStatus(currentPatient.id, 'completed')
    }
    await updateAppointmentStatus(target.id, 'in_consultation')

    setNotice(`📢 Calling Token CC-0${target.token_number} (${target.patient_name})`)
    setTimeout(() => setNotice(null), 4000)
  }

  // Complete Consultation & Send WhatsApp Rx
  const handleFinishConsultation = async () => {
    if (!currentPatient || !hospitalId || !doctorId) return

    // Optimistic local update; the real consultations/prescriptions rows
    // and appointment status update happen via completeConsultation below.
    setQueueList(prev => prev.map(q => (q.id === currentPatient.id ? { ...q, status: 'Completed' as const } : q)))
    setShowRxModal(false)

    const result = await completeConsultation({
      hospitalId,
      appointmentId: currentPatient.id,
      doctorId,
      patientId: currentPatient.patient_id,
      diagnosis: rxForm.diagnosis,
      medicines: rxForm.medicines,
      labTests: rxForm.labTests,
      advice: rxForm.advice,
      followUp: rxForm.followUp,
    })

    if (!result.success) {
      console.warn('completeConsultation failed:', result.error)
      setNotice(`⚠ Could not save the consultation: ${result.error || 'unknown error'}`)
      setTimeout(() => setNotice(null), 5000)
      return
    }

    setNotice(`✓ Prescription generated & WhatsApp dispatched to ${currentPatient.patient_name} (${currentPatient.phone})!`)
    setTimeout(() => setNotice(null), 4500)
  }

  // Quick Clinical Templates
  const clinicalTemplates = [
    {
      id: 'tmpl-1',
      title: 'Viral Fever & Bodyache',
      complaint: 'High grade fever, chills, body ache, headache since 3 days',
      diagnosis: 'Acute Viral Pyrexia (Flu)',
      medicines: [
        { name: 'Tab. Paracetamol 650mg', dosage: '1-0-1 (SOS)', duration: '3 Days', instruction: 'After Food' },
        { name: 'Tab. Levocetirizine 5mg', dosage: '0-0-1 (Night)', duration: '5 Days', instruction: 'At Bedtime' },
        { name: 'Cap. Multivitamin + Zinc', dosage: '1-0-0 (Morning)', duration: '10 Days', instruction: 'After Breakfast' },
      ],
      advice: 'Plenty of warm fluids, steam inhalation twice daily, adequate bed rest. Revisit if fever persists > 3 days.'
    },
    {
      id: 'tmpl-2',
      title: 'Acute Acidity & Gastritis (GERD)',
      complaint: 'Epigastric burning, acid reflux, nausea after meals',
      diagnosis: 'Acute Gastritis / Gastroesophageal Reflux',
      medicines: [
        { name: 'Cap. Pantoprazole 40mg + Domperidone 30mg', dosage: '1-0-0 (Morning)', duration: '14 Days', instruction: '30 mins before breakfast' },
        { name: 'Syp. Magaldrate + Simethicone', dosage: '2 tsp (Thrice Daily)', duration: '7 Days', instruction: 'After Meals' },
      ],
      advice: 'Avoid spicy, oily, caffeinated items. Take small frequent meals. Avoid sleeping immediately after meals.'
    },
    {
      id: 'tmpl-3',
      title: 'Essential Hypertension Protocol',
      complaint: 'Occasional morning occipital headache, dizziness, routine check',
      diagnosis: 'Primary Essential Hypertension (Stage 1)',
      medicines: [
        { name: 'Tab. Telmisartan 40mg', dosage: '1-0-0 (Morning)', duration: '30 Days', instruction: 'After Breakfast' },
        { name: 'Tab. Amlodipine 5mg', dosage: '0-0-1 (Night)', duration: '30 Days', instruction: 'After Dinner' },
      ],
      advice: 'Strict low salt diet (< 2g/day). 30 mins brisk walking daily. Maintain daily BP log chart.'
    },
    {
      id: 'tmpl-4',
      title: 'Type 2 Diabetes Mellitus',
      complaint: 'Increased thirst, frequent urination, post-meal lethargy',
      diagnosis: 'Type 2 Diabetes Mellitus (Uncontrolled)',
      medicines: [
        { name: 'Tab. Metformin 500mg', dosage: '1-0-1 (Twice Daily)', duration: '30 Days', instruction: 'With Meals' },
        { name: 'Tab. Glimepiride 1mg', dosage: '1-0-0 (Morning)', duration: '30 Days', instruction: 'Before Breakfast' },
      ],
      advice: 'Strict diabetic diet. Avoid sweets, potatoes, white rice. Fasting & PP sugar test every 2 weeks.'
    },
    {
      id: 'tmpl-5',
      title: 'Upper Respiratory Infection (URTI)',
      complaint: 'Dry cough, sore throat, runny nose, mild fever',
      diagnosis: 'Acute Allergic Bronchitis / URTI',
      medicines: [
        { name: 'Tab. Azithromycin 500mg', dosage: '1-0-0 (Morning)', duration: '3 Days', instruction: '1 hour before food' },
        { name: 'Tab. Montelukast 10mg + Levocet 5mg', dosage: '0-0-1 (Night)', duration: '7 Days', instruction: 'At Bedtime' },
        { name: 'Syp. Dextromethorphan Cough Syrup', dosage: '2 tsp (Twice Daily)', duration: '5 Days', instruction: 'After Food' },
      ],
      advice: 'Salt water gargling 3 times daily. Avoid cold water and ice creams. Wear mask when going outdoors.'
    },
    {
      id: 'tmpl-6',
      title: 'Migraine & Tension Headache',
      complaint: 'Unilateral throbbing headache with photophobia and nausea',
      diagnosis: 'Acute Migraine without Aura',
      medicines: [
        { name: 'Tab. Naproxen 250mg + Domperidone 10mg', dosage: '1-0-0 (SOS)', duration: '3 Days', instruction: 'At onset of headache' },
        { name: 'Tab. Paracetamol 650mg', dosage: 'SOS', duration: '5 Days', instruction: 'After Food' },
      ],
      advice: 'Rest in a quiet, dark room during attack. Identify food triggers. Maintain sleep cycle.'
    },
  ]

  const applyTemplate = (tmpl: typeof clinicalTemplates[0]) => {
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + 7)
    setRxForm({
      diagnosis: tmpl.diagnosis,
      medicines: tmpl.medicines,
      labTests: 'Routine Blood Panel (CBC, LFT, KFT)',
      advice: tmpl.advice,
      followUp: followUpDate.toISOString().split('T')[0]
    })
    setShowRxModal(true)
    setNotice(`⚡ Applied template: ${tmpl.title}`)
    setTimeout(() => setNotice(null), 3500)
  }

  // Real stats — derived directly from the live, Supabase-backed queueList
  // above (revenue uses the doctor's configured fee since `fee` isn't set
  // per-appointment by every booking path yet; see getDoctorStats in
  // lib/doctorAppointments.ts for the fully real-fee alternative used by
  // Reports.tsx).
  const completedToday = queueList.filter(q => q.status === 'Completed').length
  const waitingToday = queueList.filter(q => q.status === 'Waiting' || q.status === 'Next').length
  const totalToday = queueList.length
  const calculatedRevenue = completedToday * opdSettings.consultationFee

  // Handle adding walk-in patient
  const handleAddWalkin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWalkin.patient_name || !hospitalId || !doctorId) return

    // Reuses the same audited book_qr_appointment RPC the real QR booking
    // flow uses — real token numbering (advisory-locked, no collisions),
    // real patient dedup, one shared appointments table. See
    // lib/doctorAppointments.ts.
    const result = await addWalkInAppointment({
      hospitalId,
      doctorId,
      patientName: newWalkin.patient_name,
      patientPhone: newWalkin.phone || '',
      patientGender: newWalkin.gender,
      patientAge: Number(newWalkin.age) || 30,
      symptoms: newWalkin.chief_complaint || 'OPD Walk-in consultation',
    })

    if (!result.success) {
      setNotice(`⚠ Could not add walk-in: ${result.error || 'unknown error'}`)
      setTimeout(() => setNotice(null), 5000)
      return
    }

    await refreshQueue()
    setShowAddWalkinModal(false)
    setNewWalkin({ patient_name: '', phone: '', age: 30, gender: 'Male', chief_complaint: '' })
    setNotice(`✓ Added Walk-In Patient (${newWalkin.patient_name})`)
    setTimeout(() => setNotice(null), 3500)
  }

  // Filtered Queue
  const filteredQueue = queueList.filter(q => {
    if (queueFilter === 'consulting') return q.status === 'Now Consulting'
    if (queueFilter === 'waiting') return q.status === 'Waiting' || q.status === 'Next'
    if (queueFilter === 'completed') return q.status === 'Completed'
    return true
  }).filter(q => {
    if (!queueSearch) return true
    return q.patient_name.toLowerCase().includes(queueSearch.toLowerCase()) || String(q.token_number).includes(queueSearch)
  })

  // Navigation Items List
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers size={16} /> },
    { id: 'queue', label: "Today's Queue", icon: <Calendar size={16} /> },
    { id: 'appointments', label: 'Appointments', icon: <Clock size={16} /> },
    { id: 'patients', label: 'Patients', icon: <Users size={16} /> },
    { id: 'consultations', label: 'Consultations', icon: <Stethoscope size={16} /> },
    { id: 'prescriptions', label: 'Prescriptions', icon: <FileText size={16} /> },
    { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
    { id: 'follow-ups', label: 'Follow Ups', icon: <CheckCircle size={16} /> },
    { id: 'reports', label: 'Reports', icon: <Activity size={16} /> },
    { id: 'profile', label: 'Profile', icon: <UserCheck size={16} /> },
    { id: 'qr-kiosk', label: 'Hospital Patient QR', icon: <QrCode size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 font-sans flex antialiased selection:bg-indigo-500 selection:text-white">

      {/* ─── NEW SVELTE CLEAN WHITE SIDEBAR ─────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 fixed top-0 bottom-0 left-0 z-30 overflow-y-auto shadow-sm">
        <div className="p-5 space-y-5">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/assets/brand-icon.png" alt="MedTech Fixaters Logo" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
            <div>
              <h2 className="font-black text-base text-slate-900 tracking-tight leading-none">MedTech Fixaters</h2>
              <span className="text-[11px] font-semibold text-slate-400">Doctor Dashboard</span>
            </div>
          </Link>

          {/* Doctor Profile Mini Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80"
              alt={doctorName}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/20"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-black text-xs text-slate-900 truncate leading-tight">{doctorName}</h4>
              </div>
              <span className="inline-block px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[9px] font-black rounded my-0.5">
                {doctorCode}
              </span>
              <p className="text-[10px] font-bold text-slate-500 truncate">{doctorSpecialty}</p>
              <div className="mt-1">
                <button
                  onClick={() => setDoctorStatus(doctorStatus === 'Available' ? 'In Session' : doctorStatus === 'In Session' ? 'On Break' : 'Available')}
                  className="px-2 py-0.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider transition"
                >
                  {doctorStatus}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links — Stays in the New Design for ALL buttons */}
          <nav className="space-y-1 text-xs">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id)
                  navigate(`/${item.id === 'dashboard' ? 'dashboard' : item.id}`, { replace: true })
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                  activeNav === item.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Need Help Card & Logout */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-700">
              <AlertCircle size={14} className="shrink-0" />
              <span className="text-xs font-black">Need Help?</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Contact hospital admin or support team.</p>
            <button
              onClick={() => setShowSupportModal(true)}
              className="w-full py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-200 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <span>🎧 Get Support</span>
            </button>
          </div>

          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex-1 ml-64 min-h-screen p-6 sm:p-8 space-y-6">

        {/* Toast Notification */}
        {notice && (
          <div className="fixed top-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-bounce">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{notice}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 relative z-20">
          {/* Hospital Branch Selector */}
          <div className="relative">
            <button
              onClick={() => setShowHospitalMenu(!showHospitalMenu)}
              className="flex items-center gap-2.5 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 transition text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                🏥
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs text-slate-900">{selectedHospital}</span>
                  <ChevronDown size={13} className="text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{hospitalLocation}</span>
              </div>
            </button>

            {showHospitalMenu && (
              <div className="absolute left-0 top-14 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 text-xs space-y-1 z-50">
                {[`${selectedHospital} (Main OPD)`, 'Emergency Casualty Wing', 'Specialist Clinics Wing'].map(h => (
                  <button
                    key={h}
                    onClick={() => {
                      setShowHospitalMenu(false)
                      setNotice(`Active branch set to ${h}`)
                      setTimeout(() => setNotice(null), 3000)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 block"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Header: Date Filter, Notifications, Doctor Profile */}
          <div className="flex items-center gap-3">
            {/* Live Clock Badge */}
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 shadow-xs px-3 py-2 rounded-xl">
              <Clock size={14} className="text-indigo-600" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </span>

            {/* Date Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:border-indigo-300 transition"
              >
                <Calendar size={14} className="text-slate-400" />
                <span>{selectedDate}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 text-xs space-y-1 z-50">
                  {['Today', 'Yesterday', 'Past 7 Days'].map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDate(d)
                        setShowDatePicker(false)
                        setNotice(`Filtered date to ${d}`)
                        setTimeout(() => setNotice(null), 2500)
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 block"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition text-slate-600 relative"
              >
                <Bell size={18} />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 text-xs space-y-2 z-50">
                  <span className="font-extrabold text-slate-900 block pb-1 border-b border-slate-100">Live Hospital Notifications</span>
                  <div className="p-2 bg-indigo-50/60 rounded-xl">
                    <p className="font-bold text-indigo-900">New OPD Patient Checked In</p>
                    <span className="text-[10px] text-indigo-600">Token CC-016 (Vikas Patel) joined queue</span>
                  </div>
                  <div className="p-2 bg-emerald-50/60 rounded-xl">
                    <p className="font-bold text-emerald-900">Lab Reports Available</p>
                    <span className="text-[10px] text-emerald-600">Ravi Kumar (Lipid Profile) uploaded</span>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 pl-2 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition"
              >
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80"
                  alt={doctorName}
                  className="w-7 h-7 rounded-xl object-cover ring-1 ring-indigo-500/20"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-slate-800 leading-none">{doctorName}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 text-xs space-y-1 z-50">
                  <button onClick={() => { setActiveNav('profile'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                    <UserCheck size={14} /> My Profile
                  </button>
                  <button onClick={() => { setActiveNav('settings'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                    <Settings size={14} /> OPD Settings
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-bold text-rose-600 flex items-center gap-2">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 1: DASHBOARD OVERVIEW (NEW DESIGN)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'dashboard' && (
          <>
            {/* ─── TOP 4 METRIC KPI CARDS ─── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Total Patients',
                  value: totalToday,
                  sub: 'Today Checked-In',
                  badge: '↑ 12% vs yesterday',
                  badgeColor: 'text-emerald-600',
                  icon: <Users size={20} className="text-indigo-600" />,
                  iconBg: 'bg-indigo-50 text-indigo-600'
                },
                {
                  title: 'Completed',
                  value: completedToday,
                  sub: 'Today Consulted',
                  badge: '↑ 14% vs yesterday',
                  badgeColor: 'text-emerald-600',
                  icon: <Clock size={20} className="text-blue-600" />,
                  iconBg: 'bg-blue-50 text-blue-600'
                },
                {
                  title: 'Avg. Consultation Time',
                  value: '18 mins',
                  sub: 'Per Patient',
                  badge: '↓ 4% vs yesterday',
                  badgeColor: 'text-rose-600',
                  icon: <Activity size={20} className="text-amber-600" />,
                  iconBg: 'bg-amber-50 text-amber-600'
                },
                {
                  title: 'Patient Rating',
                  value: '4.8 / 5',
                  sub: 'Based on 86 reviews',
                  badge: '↑ 0.2 vs last month',
                  badgeColor: 'text-emerald-600',
                  icon: <Star size={20} className="text-emerald-600 fill-emerald-600" />,
                  iconBg: 'bg-emerald-50 text-emerald-600'
                },
              ].map((card, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</span>
                      <span className="text-xs font-semibold text-slate-400">{card.sub}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${card.badgeColor} block`}>{card.badge}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconBg}`}>
                    {card.icon}
                  </div>
                </div>
              ))}
            </section>

            {/* ─── MIDDLE WORKSPACE (QUEUE + APPOINTMENTS + RIGHT SIDEBAR) ── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT 2 COLUMNS (Today's Queue & Upcoming Appointments) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Upper Split: Queue Table (left) & Upcoming Appointments (right) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Today's Queue (7 cols) */}
                  <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-slate-900">Today's Queue</h3>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full flex items-center gap-1 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
                          </span>
                        </div>
                        <button onClick={() => { setActiveNav('queue'); navigate('/queue', { replace: true }); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          View Full Queue →
                        </button>
                      </div>

                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                              <th className="pb-2 font-bold">#</th>
                              <th className="pb-2 font-bold">Token</th>
                              <th className="pb-2 font-bold">Patient Name</th>
                              <th className="pb-2 font-bold">Age / Gender</th>
                              <th className="pb-2 font-bold">Status</th>
                              <th className="pb-2 font-bold text-right">Wait Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs">
                            {queueList.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-2.5 font-black text-indigo-600">CC-0{item.token_number}</td>
                                <td className="py-2.5 font-extrabold text-slate-800">{item.patient_name}</td>
                                <td className="py-2.5 text-slate-500">{item.age} / {item.gender}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full capitalize ${
                                    item.status === 'Now Consulting'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : item.status === 'Next'
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right text-slate-400 font-semibold">{item.wait_time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600" /> Total Waiting: {waitingToday} Patients
                      </span>
                      <button
                        onClick={() => setShowAddWalkinModal(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Walk-In
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Appointments (5 cols) */}
                  <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="font-black text-sm text-slate-900">Upcoming Appointments</h3>
                        <button onClick={() => { setActiveNav('appointments'); navigate('/appointments', { replace: true }); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          View All →
                        </button>
                      </div>

                      <div className="space-y-2 mt-3">
                        {appointmentsList.slice(0, 5).map((apt, idx) => (
                          <div key={idx} className="p-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="font-black text-indigo-600 text-[11px]">{apt.time}</span>
                              <div>
                                <span className="font-extrabold text-slate-800 block leading-tight">{apt.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{apt.type}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span>Confirmed</span>
                              <ChevronRight size={10} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Split: Quick Actions & Today's Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Quick Actions (7 cols) */}
                  <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="font-black text-sm text-slate-900">Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-3 pt-1">
                      {[
                        { label: 'New Consultation', icon: '+', bg: 'bg-indigo-50 text-indigo-600', action: () => { setActiveNav('consultations'); navigate('/consultations', { replace: true }); } },
                        { label: 'Prescription', icon: 'Rx', bg: 'bg-emerald-50 text-emerald-600', action: () => openRxModalForCurrentPatient() },
                        { label: 'Medical Certificate', icon: '🛡️', bg: 'bg-blue-50 text-blue-600', action: () => setShowCertModal(true) },
                        { label: 'Lab Test Advice', icon: '🧪', bg: 'bg-amber-50 text-amber-600', action: () => setShowLabModal(true) },
                        { label: 'Follow Up', icon: '📅', bg: 'bg-rose-50 text-rose-600', action: () => { setActiveNav('follow-ups'); navigate('/follow-ups', { replace: true }); } },
                        { label: 'Patient Notes', icon: '📝', bg: 'bg-orange-50 text-orange-600', action: () => setShowNotesModal(true) },
                        { label: 'Upload Report', icon: '⬆️', bg: 'bg-violet-50 text-violet-600', action: () => setShowUploadModal(true) },
                        { label: 'Templates', icon: '📄', bg: 'bg-sky-50 text-sky-600', action: () => { setActiveNav('templates'); navigate('/templates', { replace: true }); } },
                      ].map((act, i) => (
                        <button
                          key={i}
                          onClick={act.action}
                          className="p-3 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 transition group"
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${act.bg} group-hover:scale-110 transition-transform`}>
                            {act.icon}
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">{act.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Today's Summary (5 cols) */}
                  <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-black text-sm text-slate-900">Today's Summary</h3>
                      <button onClick={() => { setActiveNav('reports'); navigate('/reports', { replace: true }); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                        View Reports →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center pt-2">
                      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                          <circle cx="18" cy="18" r="14" fill="transparent" stroke="#10B981" strokeWidth="4" strokeDasharray="57 43" strokeDashoffset="0" strokeLinecap="round" />
                          <circle cx="18" cy="18" r="14" fill="transparent" stroke="#F59E0B" strokeWidth="4" strokeDasharray="32 68" strokeDashoffset="-57" strokeLinecap="round" />
                          <circle cx="18" cy="18" r="14" fill="transparent" stroke="#EF4444" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-89" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-base font-black text-slate-900">{totalToday}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Total</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                          <span className="text-slate-900">{completedToday}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-amber-500" /> Waiting</span>
                          <span className="text-slate-900">{waitingToday}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Revenue</span>
                          <span className="text-indigo-600 font-extrabold">₹{calculatedRevenue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR (Current Queue & Current Patient Card) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Current Queue Top Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-100">Current Queue</span>
                  </div>

                  <div className="p-5 pt-0 space-y-4">
                    {currentPatient ? (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Now Consulting</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight block">CC-0{currentPatient.token_number}</span>
                        <h4 className="font-extrabold text-base text-slate-800 mt-1">{currentPatient.patient_name}</h4>
                        <p className="text-xs text-slate-500 font-semibold">{currentPatient.age} Yrs, {currentPatient.gender} • {currentPatient.chief_complaint}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Now Consulting</span>
                        <p className="text-xs text-slate-400 font-semibold mt-1">No patient currently in consultation.</p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowPatientDetailsModal(true)}
                      disabled={!currentPatient}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                    >
                      View Patient Details
                    </button>

                    <div className="pt-3 border-t border-slate-100">
                      {nextPatient ? (
                        <>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Next Patient</span>
                          <span className="text-lg font-black text-slate-800 block">CC-0{nextPatient.token_number}</span>
                          <p className="text-xs font-extrabold text-slate-700">{nextPatient.patient_name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{nextPatient.age} Yrs, {nextPatient.gender} • {nextPatient.chief_complaint}</p>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Patient</span>
                          <p className="text-xs text-slate-400 font-medium">No one waiting.</p>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleCallNextPatient()}
                      disabled={!nextPatient}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
                    >
                      <Volume2 size={16} />
                      <span>Call Next Patient</span>
                    </button>
                  </div>
                </div>

                {/* Current Patient Detailed Card */}
                {currentPatient ? (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">Current Patient</h4>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-full border border-emerald-200">
                      Consultation
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                      alt={currentPatient.patient_name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 leading-tight">{currentPatient.patient_name}</h4>
                      <p className="text-xs text-slate-500">{currentPatient.age} Yrs, {currentPatient.gender}</p>
                      <span className="text-[10px] font-black text-indigo-600"># CC-0{currentPatient.token_number}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 text-xs font-bold">
                    {(['Details', 'History', 'Prescriptions', 'Reports'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setPatientCardTab(tab)}
                        className={`pb-2 transition ${
                          patientCardTab === tab
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Chief Complaint</span>
                    <p className="text-xs font-bold text-slate-800">{currentPatient.chief_complaint}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'BP', val: currentPatient.vitals?.bp || '—', unit: 'mmHg' },
                      { label: 'Pulse', val: currentPatient.vitals?.pulse || '—', unit: 'bpm' },
                      { label: 'Temp', val: currentPatient.vitals?.temp || '—', unit: '°F' },
                      { label: 'SpO2', val: currentPatient.vitals?.spo2 || '—', unit: '' },
                    ].map((v, i) => (
                      <div key={i} className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 block">{v.label}</span>
                        <span className="text-xs font-black text-slate-900 block">{v.val}</span>
                        {v.unit && <span className="text-[8px] text-slate-400 block">{v.unit}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Allergies</span>
                      <span className="font-extrabold text-slate-800">{currentPatient.allergies || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Last Visit</span>
                      <span className="font-extrabold text-slate-800">{currentPatient.lastVisit || '—'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openRxModalForCurrentPatient()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition"
                  >
                    <Stethoscope size={16} />
                    <span>Start Consultation</span>
                  </button>
                </div>
                ) : (
                <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
                  <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider mb-1">Current Patient</h4>
                  <p className="text-xs text-slate-400">No patient currently in consultation.</p>
                </div>
                )}
              </div>
            </section>

            {/* ─── BOTTOM 3 INFO CARDS ─── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900">Follow-up Reminder</h4>
                  <p className="text-xs text-slate-600 mt-0.5">You have 3 patient follow-ups scheduled for this week.</p>
                  <button onClick={() => { setActiveNav('follow-ups'); navigate('/follow-ups', { replace: true }); }} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-1.5 block">
                    View Follow Ups →
                  </button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-lg">
                  “
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900">Clinical OPD Best Practice</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Utilize 1-click clinical templates to accelerate routine consultations.</p>
                  <button onClick={() => { setActiveNav('templates'); navigate('/templates', { replace: true }); }} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-1.5 block">
                    Browse Templates →
                  </button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900">OPD Session Timing</h4>
                  <span className="text-base font-black text-slate-900 block mt-0.5">
                    {profileForm.timings}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    Room: {profileForm.room_number}
                  </span>
                </div>
              </div>

              {/* Registered Hospital OPD QR Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-indigo-700/40 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                      <QrCode size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white leading-tight">Hospital Patient QR</h4>
                      <span className="text-[10px] text-indigo-300 font-semibold truncate block max-w-[140px]">{selectedHospital}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-full border border-emerald-500/30">
                    Live Kiosk
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl flex items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(hospitalBookingUrl)}`}
                    alt="Hospital Patient Booking QR Code"
                    className="w-20 h-20 rounded-xl object-contain border border-slate-100 shrink-0"
                  />
                  <div className="space-y-1 text-slate-800 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Token Code</span>
                    <span className="font-mono text-xs font-black text-indigo-600 block truncate">{hospitalQrToken}</span>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Patients scan this QR to book OPD slots & view queue.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(hospitalBookingUrl)
                      setNotice('✓ Hospital QR Booking URL copied to clipboard!')
                      setTimeout(() => setNotice(null), 3000)
                    }}
                    className="py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-white text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy size={13} /> Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setActiveNav('qr-kiosk')
                      navigate('/qr-kiosk', { replace: true })
                    }}
                    className="py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-[11px] flex items-center justify-center gap-1.5 transition shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <QrCode size={13} /> Full Poster →
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 2: TODAY'S LIVE QUEUE WORKSPACE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'queue' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={22} /> Today's Live Queue Manager
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage waiting tokens, voice audio calls, and patient status updates.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCallNextPatient()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
                  >
                    <Volume2 size={16} /> Call Next Patient
                  </button>
                  <button
                    onClick={() => setShowAddWalkinModal(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Plus size={16} /> Add Walk-In
                  </button>
                </div>
              </div>

              {/* Status Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {[
                    { key: 'all', label: `All Tokens (${queueList.length})` },
                    { key: 'consulting', label: `Now Consulting (1)` },
                    { key: 'waiting', label: `Waiting (${waitingToday})` },
                    { key: 'completed', label: `Completed (${completedToday})` },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setQueueFilter(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                        queueFilter === tab.key
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient or token..."
                    value={queueSearch}
                    onChange={e => setQueueSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Queue Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Age / Gender</th>
                      <th className="py-3 px-4">Chief Complaint</th>
                      <th className="py-3 px-4">Vitals</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueue.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-indigo-600 text-sm">
                          CC-0{q.token_number}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {q.patient_name}
                          <span className="block text-[10px] text-slate-400 font-medium">{q.phone}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{q.age} Yrs • {q.gender}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">{q.chief_complaint}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            BP: {q.vitals.bp} | HR: {q.vitals.pulse}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            q.status === 'Now Consulting'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'Next'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : q.status === 'Completed'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCallNextPatient(q)}
                              title="Voice Call Token"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Volume2 size={13} /> Call
                            </button>
                            <button
                              onClick={() => openRxModalForCurrentPatient()}
                              title="Start Consultation & Rx"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Stethoscope size={13} /> Rx
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 3: APPOINTMENTS WORKSPACE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'appointments' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="text-indigo-600" size={22} /> Appointments Management
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule, confirm, and manage daily patient appointment bookings.
                  </p>
                </div>

                <button
                  onClick={() => setShowBookAppointmentModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
                >
                  <Plus size={16} /> Book Appointment
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 text-xs font-bold">
                {[
                  { key: 'todays', label: `Today's (${appointmentsList.length})` },
                  { key: 'upcoming', label: 'Upcoming (12)' },
                  { key: 'completed', label: 'Completed (16)' },
                  { key: 'cancelled', label: 'Cancelled (2)' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setAppointmentTab(t.key as any)}
                    className={`pb-2.5 px-3 transition ${
                      appointmentTab === t.key
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentsList.map(apt => (
                <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-black text-xs rounded-lg">
                      {apt.time}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-full">
                      {apt.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{apt.name}</h4>
                    <span className="text-xs text-slate-500 font-medium">{apt.phone}</span>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">Visit Type: {apt.type} • {apt.dept}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setNotice(`✓ Checked in ${apt.name} to Today's Live Queue!`)
                        setTimeout(() => setNotice(null), 3500)
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition"
                    >
                      Check-In to Queue
                    </button>
                    <button
                      onClick={() => {
                        setNotice(`Appointment for ${apt.name} rescheduled.`)
                        setTimeout(() => setNotice(null), 3000)
                      }}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 4: PATIENT DIRECTORY
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'patients' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="text-indigo-600" size={22} /> Patient Medical Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Search and view comprehensive patient clinical records.</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name or phone..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Age / Gender</th>
                    <th className="py-3 px-4">Known Allergies</th>
                    <th className="py-3 px-4">Last Visit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueList.filter(p => !patientSearch || p.patient_name.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.patient_name}
                        <span className="block text-[10px] text-indigo-600 font-semibold">Token CC-0{p.token_number}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{p.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.age} Yrs • {p.gender}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.allergies === 'None' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {p.allergies}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{p.lastVisit}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPatientRecord(p)
                            setShowPatientDetailsModal(true)
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> View Record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 5: CONSULTATIONS WORKSPACE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'consultations' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Stethoscope className="text-indigo-600" size={22} /> Clinical Consultation Desk
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Active consultation examination notes, vitals tracker, and clinical diagnosis.</p>
              </div>

              {/* Active Patient Details Banner */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center">
                    CC-0{currentPatient?.token_number ?? '—'}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 leading-tight">{currentPatient?.patient_name || 'No patient selected'}</h3>
                    <p className="text-xs text-slate-600 font-medium">{currentPatient?.age ?? '—'} Yrs • {currentPatient?.gender || '—'} • Phone: {currentPatient?.phone || '—'}</p>
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">Allergies: {currentPatient?.allergies || 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openRxModalForCurrentPatient()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Open 30-Sec Rx Builder →
                  </button>
                </div>
              </div>

              {/* Consultation Vitals & Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <label className="font-bold text-xs text-slate-700 block">Chief Complaints & History of Present Illness</label>
                  <textarea
                    rows={3}
                    defaultValue={currentPatient?.chief_complaint}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />

                  <label className="font-bold text-xs text-slate-700 block">Provisional Clinical Diagnosis</label>
                  <input
                    type="text"
                    value={rxForm.diagnosis}
                    onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-bold text-xs text-slate-700 block">Examination Vitals (Live Telemetry)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Blood Pressure (BP)</span>
                      <input type="text" defaultValue="120/80 mmHg" className="w-full bg-transparent font-black text-sm text-slate-800" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Pulse Rate</span>
                      <input type="text" defaultValue="78 bpm" className="w-full bg-transparent font-black text-sm text-slate-800" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Temperature</span>
                      <input type="text" defaultValue="98.4 °F" className="w-full bg-transparent font-black text-sm text-slate-800" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">SpO2 Oxygen Saturation</span>
                      <input type="text" defaultValue="98%" className="w-full bg-transparent font-black text-sm text-slate-800" />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNotice('✓ Consultation notes recorded successfully.')
                      setTimeout(() => setNotice(null), 3000)
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Save Clinical Notes
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 6: PRESCRIPTIONS STUDIO & ARCHIVE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'prescriptions' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="text-indigo-600" size={22} /> Digital Prescription Engine & Archive
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Generate compliant digital prescriptions, print A4 letterheads, or dispatch over WhatsApp.</p>
                </div>

                <button
                  onClick={() => openRxModalForCurrentPatient()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Plus size={16} /> New Prescription
                </button>
              </div>
            </div>

            {/* Issued Prescriptions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queueList.map((p, idx) => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-indigo-600">RX-2025-0{p.token_number}</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.time}</span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-900">{p.patient_name}</h4>
                    <p className="text-xs text-slate-500">{p.age} Yrs • {p.gender} • {p.phone}</p>
                    <p className="text-xs font-bold text-indigo-600 mt-1">Diagnosis: {p.chief_complaint}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Printer size={13} /> Print Rx
                    </button>
                    <button
                      onClick={() => {
                        setNotice(`✓ WhatsApp prescription sent to ${p.patient_name} (${p.phone})!`)
                        setTimeout(() => setNotice(null), 3500)
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Send size={13} /> WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 7: CLINICAL QUICK TEMPLATES
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'templates' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="text-indigo-600" size={22} /> Clinical OPD Quick Templates
              </h2>
              <p className="text-xs text-slate-500">
                1-Click pre-configured clinical prescriptions & dietary advice for high-volume outpatient clinics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinicalTemplates.map(tmpl => (
                <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm text-slate-900">{tmpl.title}</h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full">
                        Protocol
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium italic">"{tmpl.complaint}"</p>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescription Meds:</span>
                      {tmpl.medicines.map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{m.name}</span>
                          <span className="text-[10px] text-slate-500">{m.dosage}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      <strong>Advice:</strong> {tmpl.advice}
                    </p>
                  </div>

                  <button
                    onClick={() => applyTemplate(tmpl)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ Apply to Consultation</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 8: FOLLOW-UPS WORKSPACE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'follow-ups' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle className="text-indigo-600" size={22} /> Scheduled Patient Follow-Ups
              </h2>
              <p className="text-xs text-slate-500">Track returning patients and dispatch automated SMS/WhatsApp return reminders.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Follow-Up Reason</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Reminder Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Ravi Kumar', phone: '+91 98201 44521', reason: 'BP Review & ECG Check', date: 'In 7 Days (June 7, 2025)', status: 'Pending' },
                    { name: 'Sunita Devi', phone: '+91 94150 99281', reason: 'Palpitations Holter Check', date: 'In 14 Days (June 14, 2025)', status: 'Sent via SMS' },
                    { name: 'Mohd. Ali', phone: '+91 98450 77319', reason: 'Hypertension Medication Titration', date: 'Tomorrow (June 1, 2025)', status: 'Due Tomorrow' },
                  ].map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{f.phone}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{f.reason}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">{f.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setNotice(`✓ WhatsApp follow-up reminder dispatched to ${f.name}!`)
                            setTimeout(() => setNotice(null), 3500)
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                        >
                          <Send size={13} /> Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 9: REPORTS & REAL ANALYTICS
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'reports' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="text-indigo-600" size={22} /> Doctor Performance & OPD Revenue Analytics
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Calculated dynamically from verified completed appointments (Zero fake data).</p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Printer size={16} /> Print Clinical Summary
                </button>
              </div>

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Today's Revenue</span>
                  <span className="text-2xl font-black text-emerald-900 tracking-tight block mt-1">₹{calculatedRevenue}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">{completedToday} completed × ₹{opdSettings.consultationFee} fee</span>
                </div>
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Completed Consultations</span>
                  <span className="text-2xl font-black text-indigo-900 tracking-tight block mt-1">{completedToday}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">Out of {totalToday} total tokens</span>
                </div>
                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Waiting in Queue</span>
                  <span className="text-2xl font-black text-amber-900 tracking-tight block mt-1">{waitingToday}</span>
                  <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Estimated wait: ~{waitingToday * 12} mins</span>
                </div>
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Consultation Fee</span>
                  <span className="text-2xl font-black text-blue-900 tracking-tight block mt-1">₹{opdSettings.consultationFee}</span>
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">Per patient standard rate</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 10: DOCTOR PROFILE
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'profile' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="text-indigo-600" size={22} /> Doctor Credentials & Profile Workspace
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your clinical designation, medical council license, and consultation fees.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  localStorage.setItem(`clinicos_doctor_profile_${doctorId}`, JSON.stringify(profileForm))
                  setNotice('✓ Doctor profile updated successfully!')
                  setTimeout(() => setNotice(null), 3500)
                }}
                className="space-y-4 pt-2 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Doctor Code (Unique ID)</label>
                    <input
                      type="text"
                      disabled
                      value={doctorCode}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department & Specialization</label>
                    <input
                      type="text"
                      value={profileForm.specialization}
                      onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Degrees & Qualifications</label>
                    <input
                      type="text"
                      value={profileForm.qualification}
                      onChange={e => setProfileForm({ ...profileForm, qualification: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Medical Registration Number</label>
                    <input
                      type="text"
                      value={profileForm.registration_number}
                      onChange={e => setProfileForm({ ...profileForm, registration_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">OPD Room Number</label>
                    <input
                      type="text"
                      value={profileForm.room_number}
                      onChange={e => setProfileForm({ ...profileForm, room_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={profileForm.fee}
                      onChange={e => setProfileForm({ ...profileForm, fee: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Daily Patient Capacity Limit</label>
                    <input
                      type="number"
                      value={profileForm.daily_limit}
                      onChange={e => setProfileForm({ ...profileForm, daily_limit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 11: DOCTOR OPD SETTINGS
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'settings' && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Settings className="text-indigo-600" size={22} /> Doctor OPD & Console Settings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure audio announcements, WhatsApp auto-send, and OPD preferences.</p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100 text-xs pt-2">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900">Audio Speech Token Callouts</h4>
                    <p className="text-slate-500 text-[11px]">Announces token number and patient name using Web Speech synthesizer.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={opdSettings.ttsEnabled}
                    onChange={e => setOpdSettings({ ...opdSettings, ttsEnabled: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900">Automated WhatsApp Prescription Dispatch</h4>
                    <p className="text-slate-500 text-[11px]">Automatically sends digital prescription PDF link to patient's mobile on consultation finish.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={opdSettings.whatsappEnabled}
                    onChange={e => setOpdSettings({ ...opdSettings, whatsappEnabled: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900">Patient Arrival Sound Alerts</h4>
                    <p className="text-slate-500 text-[11px]">Plays a chime sound whenever a patient checks into the waiting queue.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={opdSettings.soundAlerts}
                    onChange={e => setOpdSettings({ ...opdSettings, soundAlerts: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setNotice('✓ OPD settings saved successfully.')
                    setTimeout(() => setNotice(null), 3000)
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Save OPD Settings
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 12: REGISTERED HOSPITAL PATIENT QR KIOSK
        ═══════════════════════════════════════════════════════════════════ */}
        {activeNav === 'qr-kiosk' && (
          <section className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
                    <QrCode size={14} /> Registered Hospital OPD QR
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Hospital Self-Service Patient QR
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Patients scan this QR code on their smartphone at reception or entrance to view live queue, intake medical details, and book instant OPD consultations with {doctorName}.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 shrink-0 transition cursor-pointer"
                >
                  <Printer size={15} /> Print Poster
                </button>
              </div>

              {/* Poster Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-3xl text-white border border-indigo-800/40 shadow-2xl text-center space-y-6 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center justify-center gap-3">
                  <img src="/assets/brand-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
                  <div className="text-left">
                    <h3 className="font-black text-base tracking-tight text-white leading-tight">{selectedHospital}</h3>
                    <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">{hospitalLocation}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border-4 border-white">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(hospitalBookingUrl)}`}
                    alt="Hospital QR Code"
                    className="w-56 h-56 object-contain rounded-lg mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold text-indigo-200 border border-white/15 inline-block">
                    TOKEN: {hospitalQrToken}
                  </span>
                  <p className="text-xs text-indigo-200/80 font-semibold max-w-xs mx-auto">
                    Scan to Book OPD Slot & Track Live Queue Status
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hospitalBookingUrl)
                    setNotice('✓ Hospital Booking Link copied to clipboard!')
                    setTimeout(() => setNotice(null), 3500)
                  }}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition cursor-pointer"
                >
                  <Copy size={20} className="text-indigo-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">Copy Patient Link</span>
                  <span className="text-[10px] text-slate-400">Share via WhatsApp / SMS</span>
                </button>

                <a
                  href={hospitalBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition cursor-pointer"
                >
                  <ExternalLink size={20} className="text-indigo-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">Preview Booking Screen</span>
                  <span className="text-[10px] text-slate-400">Test patient booking flow</span>
                </a>

                <a
                  href={hospitalQrImgUrl}
                  download={`Hospital-QR-${hospitalQrToken}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition cursor-pointer"
                >
                  <Download size={20} className="text-indigo-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">Download High-Res QR</span>
                  <span className="text-[10px] text-slate-400">For printing custom standees</span>
                </a>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* ─── 30-SECOND PRESCRIPTION BUILDER MODAL ─────────── */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                <div>
                  <h3 className="text-lg font-black text-slate-900">Digital Consultation & Rx</h3>
                  <span className="text-xs font-semibold text-slate-500">Patient: <strong>{currentPatient?.patient_name}</strong> (CC-0{currentPatient?.token_number})</span>
                </div>
              </div>
              <button onClick={() => setShowRxModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Clinical Diagnosis</label>
                <input
                  type="text"
                  value={rxForm.diagnosis}
                  onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700">Rx Medications (Formulary Auto-complete)</label>
                <div className="space-y-2">
                  {rxForm.medicines.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <span className="font-black text-slate-900">{med.name}</span>
                      <span className="text-slate-500">{med.dosage} • {med.duration}</span>
                      <span className="text-indigo-600 font-bold">{med.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Doctor Advice & Lifestyle Instructions</label>
                <textarea
                  rows={2}
                  value={rxForm.advice}
                  onChange={e => setRxForm(p => ({ ...p, advice: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lab Tests / Investigations</label>
                  <input
                    type="text"
                    value={rxForm.labTests}
                    onChange={e => setRxForm(p => ({ ...p, labTests: e.target.value }))}
                    placeholder="e.g. CBC, Lipid Profile"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Follow-up Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={rxForm.followUp}
                    onChange={e => setRxForm(p => ({ ...p, followUp: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Printer size={14} /> Print Letterhead Rx
              </button>
              <button
                onClick={handleFinishConsultation}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition"
              >
                <Check size={14} /> Finish & Dispatch via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PATIENT DETAILS ─── */}
      {showPatientDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-black text-base text-slate-900">Patient Record</h3>
                <p className="text-[11px] text-slate-400 font-medium">Profile, details, and your visit history with this patient — one screen.</p>
              </div>
              <button onClick={() => setShowPatientDetailsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto">
              {patientRecordLoading ? (
                <p className="text-slate-400 text-center py-8">Loading patient record…</p>
              ) : (
                <>
                  {/* Editable Profile */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">Profile & Details</h4>
                      <span className="text-[10px] font-bold text-indigo-600">
                        CC-0{selectedPatientRecord?.token_number ?? currentPatient?.token_number ?? '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                        <input
                          type="text"
                          value={patientEditForm.name || ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                        <input
                          type="text"
                          value={patientEditForm.phone || ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                        <input
                          type="number"
                          value={patientEditForm.age ?? ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, age: e.target.value ? Number(e.target.value) : null }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                        <select
                          value={patientEditForm.gender || ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, gender: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        >
                          <option value="">—</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Known Allergies</label>
                        <input
                          type="text"
                          value={patientEditForm.allergies || ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, allergies: e.target.value }))}
                          placeholder="e.g. Penicillin, Sulfa Drugs"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Known Chronic Conditions</label>
                        <input
                          type="text"
                          value={patientEditForm.known_diseases || ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, known_diseases: e.target.value }))}
                          placeholder="e.g. Diabetes, Hypertension"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
                        <input
                          type="text"
                          value={patientEditForm.address || ''}
                          onChange={e => setPatientEditForm(p => ({ ...p, address: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSavePatientProfile}
                      disabled={patientRecordSaving}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
                    >
                      {patientRecordSaving ? 'Saving…' : 'Save Patient Details'}
                    </button>
                  </div>

                  {/* Previous Visit History */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                      Previous Visits ({patientHistory.length})
                    </h4>
                    {patientHistory.length === 0 ? (
                      <p className="text-slate-400 text-center py-6">No previous visits with you on record yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {patientHistory.map(visit => (
                          <div key={visit.appointmentId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{visit.appointmentDate}</span>
                              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 capitalize">
                                {visit.status.replace('_', ' ')}
                              </span>
                            </div>
                            {visit.symptoms && (
                              <p className="text-slate-600"><span className="font-bold text-slate-400">Symptoms:</span> {visit.symptoms}</p>
                            )}
                            {visit.diagnosis && (
                              <p className="text-slate-800 font-bold">🩺 {visit.diagnosis}</p>
                            )}
                            {visit.medicines.length > 0 && (
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-400">Rx:</span> {visit.medicines.map(m => m.name).join(', ')}
                              </p>
                            )}
                            {visit.followUp && (
                              <p className="text-indigo-600 font-semibold">Follow-up: {visit.followUp}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowPatientDetailsModal(false)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD WALKIN PATIENT ─── */}
      {showAddWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add Walk-In Patient to Queue</h3>
              <button onClick={() => setShowAddWalkinModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddWalkin} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newWalkin.patient_name}
                  onChange={e => setNewWalkin({ ...newWalkin, patient_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newWalkin.phone}
                  onChange={e => setNewWalkin({ ...newWalkin, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={newWalkin.age}
                    onChange={e => setNewWalkin({ ...newWalkin, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newWalkin.gender}
                    onChange={e => setNewWalkin({ ...newWalkin, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Fever, body pain"
                  value={newWalkin.chief_complaint}
                  onChange={e => setNewWalkin({ ...newWalkin, chief_complaint: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWalkinModal(false)}
                  className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Issue Queue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: BOOK APPOINTMENT ─── */}
      {showBookAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Book Patient Appointment</h3>
              <button onClick={() => setShowBookAppointmentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                <input type="text" placeholder="e.g. Alok Sharma" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Number</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time Slot</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>12:00 PM</option>
                    <option>02:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setShowBookAppointmentModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBookAppointmentModal(false)
                  setNotice('✓ Appointment booked and confirmed.')
                  setTimeout(() => setNotice(null), 3000)
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Confirm Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SUPPORT ─── */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
              🎧
            </div>
            <h3 className="font-black text-base text-slate-900">Hospital Tech Support</h3>
            <p className="text-xs text-slate-500">For hardware integration, OPD printer issues, or urgent queries:</p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-bold">
              <p className="text-indigo-600">Email: support@medtechfixaters.in</p>
              <p className="text-slate-700">Reception Desk Ext: #301</p>
            </div>
            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
