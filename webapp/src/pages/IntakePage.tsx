import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Clock, CheckCircle2, MapPin, Stethoscope, ShieldAlert,
  Building2, User, Calendar, Search, ArrowRight, ArrowLeft,
  AlertCircle, FileText, Phone, Activity, Sparkles, Check,
  Printer, Copy, ShieldCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'

interface Department {
  id: string
  name: string
  description?: string
  is_opd?: boolean
}

interface Doctor {
  id: string
  doctor_code: string
  name: string
  department: string
  specialization: string
  fee: number
  room: string
  daily_limit: number
  availability_status: string
}

interface HospitalInfo {
  id: string
  name: string
  license?: string
  phone?: string
  email?: string
  address?: string
}

export default function IntakePage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tokenQuery = token || searchParams.get('token') || searchParams.get('t') || searchParams.get('hosp_id') || searchParams.get('hospital_id') || ''

  useSEO({
    title: 'Hospital OPD Appointment & Fast Queue Check-In — Medtech Fixaters',
    description: 'Book instant clinical appointment, select specialist doctor, and receive real-time queue token.',
  })

  // Data Loading State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hospital, setHospital] = useState<HospitalInfo | null>(null)
  const [isIndividualDoctor, setIsIndividualDoctor] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])

  // Multi-Step Workflow (1: Date & Dept, 2: Doctor, 3: Patient Info & History, 4: Confirmed Token)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Booking State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  // Patient Number Lookup State
  const [patientLookupInput, setPatientLookupInput] = useState('')
  const [isSearchingPatient, setIsSearchingPatient] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)
  const [existingPatientFound, setExistingPatientFound] = useState(false)

  // Patient Form Fields
  const [formData, setFormData] = useState({
    patient_number: '',
    name: '',
    phone: '',
    gender: 'Male',
    age: '',
    date_of_birth: '',
    symptoms: '',
    known_diseases: '',
    previous_medicine: '',
    previous_doctor_id: '',
    previous_doctor_name: '',
    emergency_contact: '',
    blood_group: '',
    consent: true
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingStep, setSubmittingStep] = useState('Creating appointment...')
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Quick Date Selectors (Today, Tomorrow, Day After)
  const todayObj = new Date()
  const tomorrowObj = new Date(Date.now() + 86400000)
  const dayAfterObj = new Date(Date.now() + 172800000)

  const dateOptions = [
    {
      label: 'Today',
      val: todayObj.toISOString().split('T')[0],
      display: todayObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    },
    {
      label: 'Tomorrow',
      val: tomorrowObj.toISOString().split('T')[0],
      display: tomorrowObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    },
    {
      label: 'Day After',
      val: dayAfterObj.toISOString().split('T')[0],
      display: dayAfterObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  ]

  // 1. Fetch Hospital Info, Departments & Doctors via Secure RPC
  useEffect(() => {
    const loadBookingData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        if (!tokenQuery.trim()) {
          throw new Error('No hospital QR booking token provided. Please scan the QR code displayed at your hospital facility.')
        }

        const { data, error: rpcErr } = await supabase.rpc('get_qr_booking_info', {
          p_token: tokenQuery.trim()
        })

        if (rpcErr) throw rpcErr

        if (!data || !data.success) {
          throw new Error(data?.error || 'Invalid or inactive hospital QR booking code.')
        }

        if (data.is_individual_doctor) {
          setIsIndividualDoctor(true)
          const clinicInfo = data.clinic || data.hospital
          setHospital({
            id: clinicInfo?.id,
            name: clinicInfo?.name || "Doctor's Clinic",
            address: clinicInfo?.address,
            phone: clinicInfo?.phone,
            email: clinicInfo?.email,
            license: clinicInfo?.license,
          })
          const docList = data.doctors || (data.doctor ? [data.doctor] : [])
          setDoctors(docList)
          if (docList.length > 0) {
            setSelectedDoctor(docList[0])
            setSelectedDept(docList[0].department || docList[0].specialization || 'Consultation')
          }
          setDepartments([])
        } else {
          setIsIndividualDoctor(false)
          setHospital(data.hospital)
          const depts: Department[] = data.departments || []
          setDepartments(depts)
          const docs: Doctor[] = data.doctors || []
          setDoctors(docs)

          // Set default selected department if available
          if (depts.length > 0) {
            const opdDept = depts.find(d => d.is_opd || d.name.toLowerCase().includes('opd'))
            setSelectedDept(opdDept ? opdDept.name : depts[0].name)
          } else {
            setSelectedDept('')
          }
        }
      } catch (err: any) {
        console.warn('QR Booking Info Load Notice:', err.message)
        // STRICT ZERO-FALLBACK MULTI-TENANT ISOLATION:
        // NEVER inject demo doctors, mock hospitals, or hardcoded profiles!
        setError(err.message || 'Hospital QR booking portal unavailable.')
        setHospital(null)
        setDepartments([])
        setDoctors([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBookingData()
  }, [tokenQuery])

  // 2. Patient Number / Mobile History Lookup
  const handlePatientLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientLookupInput.trim()) return

    setIsSearchingPatient(true)
    setLookupMessage(null)

    try {
      const isNum = patientLookupInput.trim().toUpperCase().startsWith('MR-')
      const { data, error: lookupErr } = await supabase.rpc('lookup_patient_by_qr', {
        p_token: tokenQuery.trim(),
        p_patient_number: isNum ? patientLookupInput.trim() : null,
        p_mobile: !isNum ? patientLookupInput.trim() : null
      })

      if (lookupErr) throw lookupErr

      if (data && data.found && data.patient) {
        const p = data.patient
        setFormData(prev => ({
          ...prev,
          patient_number: p.patient_number || '',
          name: p.name || prev.name,
          phone: p.phone || prev.phone,
          gender: p.gender || prev.gender,
          age: p.age ? p.age.toString() : prev.age,
          date_of_birth: p.date_of_birth || prev.date_of_birth,
          known_diseases: p.known_diseases || prev.known_diseases,
          allergies: p.allergies || '',
          previous_medicine: p.previous_medicine || prev.previous_medicine,
          previous_doctor_id: p.previous_doctor_id || '',
          previous_doctor_name: p.previous_doctor_name || ''
        }))
        setExistingPatientFound(true)
        setLookupMessage(`✓ Found medical history for: ${p.name} (Patient #${p.patient_number})`)
      } else {
        setLookupMessage('ℹ️ No previous records found in this hospital. Proceeding as New Patient.')
        setExistingPatientFound(false)
      }
    } catch (err: any) {
      console.warn('Patient lookup notice:', err.message)
      setLookupMessage('Proceeding with new registration.')
    } finally {
      setIsSearchingPatient(false)
    }
  }

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter(doc => {
    if (!selectedDept) return true
    return doc.department.toLowerCase() === selectedDept.toLowerCase() ||
           (selectedDept.toLowerCase().includes('opd') && (doc.department.toLowerCase().includes('general') || doc.department.toLowerCase().includes('opd')))
  })

  // 3. Handle Appointment Booking Submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor) {
      alert('Please select a doctor to continue.')
      return
    }

    setIsSubmitting(true)
    setSubmittingStep('Validating registration & checking patient record...')
    setError(null)

    try {
      setSubmittingStep('Generating permanent Patient ID & live queue token...')
      const { data, error: bookErr } = await supabase.rpc('book_qr_appointment', {
        p_qr_token: tokenQuery.trim(),
        p_doctor_id: selectedDoctor.id,
        p_appointment_date: selectedDate,
        p_patient_name: formData.name.trim(),
        p_patient_phone: formData.phone.trim(),
        p_patient_gender: formData.gender,
        p_patient_age: parseInt(formData.age) || 30,
        p_patient_dob: formData.date_of_birth || null,
        p_symptoms: formData.symptoms.trim(),
        p_known_diseases: formData.known_diseases.trim() || null,
        p_previous_medicine: formData.previous_medicine.trim() || null,
        p_previous_doctor_id: formData.previous_doctor_id || null,
        p_patient_number: formData.patient_number.trim() || null
      })

      if (bookErr) throw bookErr

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate appointment token.')
      }

      setConfirmedBooking(data)
      setStep(4)
    } catch (err: any) {
      console.warn('Booking error:', err.message)
      setError(err.message || 'Unable to book appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
      setSubmittingStep('Creating appointment...')
    }
  }

  // --------------------------------------------------------------------------
  // RENDER: LOADING STATE
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-spin mb-4">
          <Activity size={24} />
        </div>
        <h2 className="text-base font-black text-slate-800">Validating Hospital QR Access...</h2>
        <p className="text-xs text-slate-500 mt-1">Connecting securely to facility OPD node.</p>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // RENDER: ERROR STATE (BLOCKED HOSPITAL OR INVALID TOKEN)
  // --------------------------------------------------------------------------
  if (error && !hospital) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Booking Portal Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This clinical facility booking portal is currently restricted or inactive.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              <ArrowLeft size={14} /> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16 antialiased selection:bg-emerald-500 selection:text-white">
      {/* ─── TOP CLINICAL BAR: RESOLVED HOSPITAL / CLINIC IDENTITY ───── */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-500/20">
              {isIndividualDoctor ? <Stethoscope size={20} /> : <Building2 size={20} />}
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                {isIndividualDoctor ? "Official Clinic Booking Portal" : "Official OPD Booking Portal"}
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                {hospital?.name || (isIndividualDoctor ? "Doctor's Clinic" : "City Care Hospital")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Queue Online
            </span>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTAINER ─────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Step Indicator Tracker */}
        {step < 4 && (
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            {isIndividualDoctor ? (
              <>
                <div className={`flex items-center gap-2 font-bold ${step === 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 text-slate-400'}`}>
                    1
                  </div>
                  <span>Select Date</span>
                </div>

                <div className="w-8 h-[2px] bg-slate-200" />

                <div className={`flex items-center gap-2 font-bold ${step === 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 text-slate-400'}`}>
                    2
                  </div>
                  <span>Patient & Medical Details</span>
                </div>
              </>
            ) : (
              <>
                <div className={`flex items-center gap-2 font-bold ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 text-slate-400'}`}>
                    1
                  </div>
                  <span className="hidden sm:inline">Date & Specialty</span>
                </div>

                <div className="w-8 h-[2px] bg-slate-200" />

                <div className={`flex items-center gap-2 font-bold ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 text-slate-400'}`}>
                    2
                  </div>
                  <span className="hidden sm:inline">Select Doctor</span>
                </div>

                <div className="w-8 h-[2px] bg-slate-200" />

                <div className={`flex items-center gap-2 font-bold ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 text-slate-400'}`}>
                    3
                  </div>
                  <span className="hidden sm:inline">Patient & Medical Details</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── STEP 1: DATE SELECTION (+ DEPT FOR HOSPITALS) ────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6">
            {/* Individual Doctor Profile Banner */}
            {isIndividualDoctor && selectedDoctor && (
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                      Direct Consultation With
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedDoctor.name}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700">
                      {selectedDoctor.specialization || selectedDoctor.department}
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fee</span>
                    <span className="text-base font-black text-emerald-700">₹{selectedDoctor.fee}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {isIndividualDoctor ? "1. Select Consultation Date" : "1. Select Desired Appointment Date"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isIndividualDoctor
                  ? `Choose your preferred date to book consultation with ${selectedDoctor?.name || 'the doctor'}.`
                  : "Choose the consultation date to view doctor schedules and active queue slots."}
              </p>
            </div>

            {/* Quick Date Selector Cards */}
            <div className="grid grid-cols-3 gap-3">
              {dateOptions.map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSelectedDate(opt.val)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedDate === opt.val
                      ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block opacity-70 mb-0.5">{opt.label}</span>
                  <span className="text-sm font-black block">{opt.display}</span>
                </button>
              ))}
            </div>

            {/* Custom Date Input for Advance Booking */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Or Choose Advance Date:</label>
              <input
                type="date"
                min={todayObj.toISOString().split('T')[0]}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>

            {/* Department Selection (ONLY FOR MULTI-SPECIALTY HOSPITALS) */}
            {!isIndividualDoctor && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Select Department / Specialty
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {departments.length === 0 ? (
                    <div className="sm:col-span-2 p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold text-slate-600">No departments currently configured for this hospital.</p>
                    </div>
                  ) : (
                    departments.map(dept => {
                      const isSelected = selectedDept.toLowerCase() === dept.name.toLowerCase()
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => setSelectedDept(dept.name)}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900">{dept.name}</span>
                            {dept.is_opd && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full uppercase">
                                Default OPD
                              </span>
                            )}
                          </div>
                          {dept.description && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-tight">{dept.description}</p>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(isIndividualDoctor ? 3 : 2)}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <span>{isIndividualDoctor ? "Continue to Patient Details" : "View Available Doctors"}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: DOCTOR SELECTION (SCOPED STRICTLY TO HOSPITAL & DEPT) ──── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  2. Choose Specialist Doctor
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Available practitioners in <strong className="text-slate-800">{selectedDept || 'all departments'}</strong> for {selectedDate}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft size={13} /> Change Date
              </button>
            </div>

            {/* Doctor Cards List */}
            <div className="space-y-3">
              {filteredDoctors.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1">
                    <AlertCircle size={26} />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">No Doctors Available</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    This hospital currently has no doctors available for online appointments.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Please select another date or contact the hospital directly.
                  </p>
                </div>
              ) : (
                filteredDoctors.map(doc => {
                  const isSelected = selectedDoctor?.id === doc.id
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/25 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                            Dr.
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-base text-slate-900">{doc.name}</h3>
                              <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {doc.doctor_code}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{doc.specialization}</p>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-slate-400" /> {doc.room}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Consultation Fee</span>
                            <span className="text-base font-black text-emerald-600">₹{doc.fee}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                            Available Today
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
              >
                ← Back
              </button>

              <button
                type="button"
                disabled={!selectedDoctor}
                onClick={() => setStep(3)}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
              >
                <span>Continue to Patient Details</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: PATIENT MEDICAL FORM & HISTORY ──────────── */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                3. Patient & Clinical Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Appointments are generated with an atomic queue token for <strong className="text-slate-800">{selectedDoctor?.name}</strong>.
              </p>
            </div>

            {/* SECTION B: PATIENT NUMBER SEARCH (SCOPED TO THIS HOSPITAL) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Returning Patient History Lookup (Optional)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Hospital #{hospital?.id?.slice(0, 8)}</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={patientLookupInput}
                  onChange={e => setPatientLookupInput(e.target.value)}
                  placeholder="Enter Patient Number (e.g. MR-1234) or Mobile..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handlePatientLookup}
                  disabled={isSearchingPatient}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <Search size={13} />
                  <span>{isSearchingPatient ? 'Searching...' : 'Search'}</span>
                </button>
              </div>

              {lookupMessage && (
                <p className={`text-xs font-bold ${existingPatientFound ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {lookupMessage}
                </p>
              )}
            </div>

            {/* MAIN APPOINTMENT FORM */}
            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone (For WhatsApp Rx) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Age or DOB */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age (Years) / Date of Birth *</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Symptoms (Required) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chief Symptoms / Reason for Visit *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.symptoms}
                  onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="e.g. High fever for 3 days, dry cough, severe body aches..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Known Diseases (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Known Conditions (Optional)</label>
                  <input
                    type="text"
                    value={formData.known_diseases}
                    onChange={e => setFormData({ ...formData, known_diseases: e.target.value })}
                    placeholder="e.g. Diabetes Type 2, Hypertension, Asthma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                {/* Previous Medicine (Optional) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current / Previous Medicine (Optional)</label>
                  <input
                    type="text"
                    value={formData.previous_medicine}
                    onChange={e => setFormData({ ...formData, previous_medicine: e.target.value })}
                    placeholder="e.g. Metformin 500mg, Telmisartan 40mg"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consent}
                    onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <span>
                    I confirm that the medical information provided is accurate and consent to digital queue dispatch and WhatsApp prescription delivery.
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(isIndividualDoctor ? 1 : 2)}
                  className="px-5 py-3 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition transform hover:-translate-y-0.5"
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? 'Generating Queue Token...' : 'Confirm Appointment & Get Token →'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── LOADING OVERLAY DURING REGISTRATION ──── */}
        {isSubmitting && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center animate-spin mb-4 shadow-xl shadow-emerald-500/10">
              <Activity size={32} />
            </div>
            <h3 className="text-lg font-black tracking-tight">{submittingStep}</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Synchronizing transaction with PostgreSQL OPD node and generating live queue tokens.
            </p>
          </div>
        )}

        {/* ─── STEP 4: CONFIRMED APPOINTMENT & LIVE QUEUE TOKEN (LIQUID GLASS UI) ──── */}
        {step === 4 && confirmedBooking && (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-emerald-950/10 space-y-6 text-center animate-fade-in">
            {/* Top Success Badge */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ✓ Appointment Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {confirmedBooking.hospital_name}
              </h2>
              <p className="text-xs text-slate-500">
                Assigned directly to <strong className="text-slate-800">{confirmedBooking.doctor_name}</strong>'s live consultation queue.
              </p>
            </div>

            {/* PRIMARY GLASS BOXES: PATIENT ID & QUEUE NUMBER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Permanent Patient ID Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-50 via-teal-50/50 to-emerald-50/30 border-2 border-emerald-500/30 shadow-sm text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Permanent Patient ID
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const pid = confirmedBooking.patient_number || confirmedBooking.patient_id;
                        if (pid) {
                          navigator.clipboard.writeText(pid);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2500);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 text-[10px] font-bold shadow-xs transition active:scale-95"
                    >
                      {copiedId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
                    </button>
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-950 font-mono tracking-tight">
                    {confirmedBooking.patient_number || confirmedBooking.patient_id || '—'}
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 mt-2 font-medium leading-tight">
                  Permanent record ID. Save this for instant lookup on future visits & follow-ups.
                </p>
              </div>

              {/* Live Queue & Token Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-md text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Queue & Token Number
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                      Token #{confirmedBooking.token_number}
                    </span>
                  </div>
                  <div className="mt-2 text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    <span>{confirmedBooking.queue_number || `OPD-#${confirmedBooking.token_number}`}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-2 pt-2 border-t border-slate-700">
                  <span>Status: <strong className="text-emerald-400 font-bold">{confirmedBooking.status || 'Waiting'}</strong></span>
                  <span><strong>{confirmedBooking.patients_ahead ?? 0}</strong> ahead</span>
                </div>
              </div>
            </div>

            {/* DETAILED APPOINTMENT SUMMARY CARD */}
            <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Consultation Summary
              </h4>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-black text-slate-900">{confirmedBooking.patient_name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Assigned Doctor:</span>
                <span className="font-black text-slate-900">{confirmedBooking.doctor_name} ({confirmedBooking.doctor_code})</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.department || confirmedBooking.department_name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Appointment Date:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.appointment_date}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Consultation Fee:</span>
                <span className="font-bold text-emerald-700">₹{confirmedBooking.fee || 500}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Appointment ID:</span>
                <span className="font-mono text-slate-600 text-[11px]">{confirmedBooking.appointment_id}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <Link
                to={`/track?t=${confirmedBooking.tracking_token || confirmedBooking.queue_number || confirmedBooking.appointment_id}`}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <Activity size={16} />
                <span>Open Live Real-Time Queue Tracker →</span>
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setConfirmedBooking(null)
                    setFormData({
                      patient_number: '',
                      name: '',
                      phone: '',
                      gender: 'Male',
                      age: '',
                      date_of_birth: '',
                      symptoms: '',
                      known_diseases: '',
                      previous_medicine: '',
                      previous_doctor_id: '',
                      previous_doctor_name: '',
                      emergency_contact: '',
                      blood_group: '',
                      consent: true
                    })
                  }}
                  className="py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition"
                >
                  Book Another
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
