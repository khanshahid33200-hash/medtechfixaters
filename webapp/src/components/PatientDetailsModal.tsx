import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Calendar,
  Heart,
  Activity,
  AlertTriangle,
  FileText,
  Clock,
  Stethoscope,
  Shield,
  Pill,
  Sparkles,
  Printer,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  FlaskConical,
  CalendarClock,
  Share2,
  Building2,
  Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getPatientProfile, getPatientVisitHistory, completeConsultation, updateAppointmentStatus, PatientProfile, PatientVisit } from '../lib/doctorAppointments'

export interface PatientModalData {
  id?: string
  patient_id?: string | null
  patient_number?: string | null
  patient_name: string
  phone?: string
  age?: number
  gender?: string
  chief_complaint?: string
  allergies?: string
  vitals?: { bp?: string; pulse?: string; temp?: string; spo2?: string }
  lastVisit?: string
  token_number?: number | string
  queue_number?: string
  status?: string
}

interface PatientDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  patient: PatientModalData | null
  doctorId?: string
  doctorName?: string
  departmentName?: string
  hospitalName?: string
  onConsultationCompleted?: () => void
  onStartConsultation?: (patient: PatientModalData) => void
  onIssueCertificate?: (patient: PatientModalData) => void
  onLabAdvice?: (patient: PatientModalData) => void
  onScheduleFollowUp?: (patient: PatientModalData) => void
}

export interface PrescribedMedicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  instruction: string
}

const COMMON_DIAGNOSES = [
  'Acute Viral Fever & URTI',
  'Acute Bronchitis',
  'Acute Gastroenteritis',
  'Essential Hypertension (Stage 1)',
  'Type 2 Diabetes Mellitus',
  'Allergic Rhinitis & Sinusitis',
  'Gastroesophageal Reflux Disease (GERD)',
  'Tension Headache / Migraine',
  'Acute Pharyngitis / Tonsillitis',
  'Musculoskeletal Back Pain',
  'Urinary Tract Infection (UTI)',
  'Generalized Physical Fatigue',
]

const LAB_CATEGORIES = {
  'Pathology / Blood': [
    'Complete Blood Count (CBC)',
    'ESR (Westergren)',
    'Blood Group & Rh Type',
    'Peripheral Blood Smear',
    'Dengue NS1 Antigen & IgG/IgM',
  ],
  'Biochemistry': [
    'Fasting Blood Sugar (FBS)',
    'Post Prandial Blood Sugar (PPBS)',
    'HbA1c (Glycated Hemoglobin)',
    'Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)',
    'Liver Function Test (LFT)',
    'Kidney Function Test (KFT / Serum Creatinine & Urea)',
    'Serum Uric Acid',
    'Thyroid Profile (T3, T4, TSH)',
    'Serum Electrolytes (Na+, K+, Cl-)',
  ],
  'Radiology & Imaging': [
    'Chest X-Ray (PA View)',
    'Ultrasound Whole Abdomen (USG)',
    'X-Ray Lumbo-Sacral Spine (AP & Lat)',
    'CT Brain Plain',
  ],
  'Cardiology': [
    '12-Lead Electrocardiogram (ECG)',
    '2D Echocardiography',
    'Treadmill Test (TMT)',
  ],
  'Microbiology & Urine': [
    'Urine Routine & Microscopic Examination',
    'Stool Routine Examination',
    'Sputum AFB for MTB',
    'Urine Culture & Sensitivity',
  ],
}

const QUICK_MEDS = [
  { name: 'Paracetamol 650mg', dosage: '1 Tablet', frequency: '1-0-1 (Morning & Night)', duration: '5 Days', instruction: 'After food' },
  { name: 'Amoxicillin + Potassium Clavulanate 625mg', dosage: '1 Tablet', frequency: '1-0-1 (Morning & Night)', duration: '5 Days', instruction: 'After food' },
  { name: 'Pantoprazole 40mg', dosage: '1 Tablet', frequency: '1-0-0 (Morning)', duration: '7 Days', instruction: '30 min before breakfast' },
  { name: 'Cetirizine 10mg', dosage: '1 Tablet', frequency: '0-0-1 (Night)', duration: '5 Days', instruction: 'Bedtime after food' },
  { name: 'Azithromycin 500mg', dosage: '1 Tablet', frequency: '1-0-0 (Morning)', duration: '3 Days', instruction: '1 hour before food' },
  { name: 'Metformin 500mg (Extended Release)', dosage: '1 Tablet', frequency: '1-0-1 (Morning & Night)', duration: '30 Days', instruction: 'With meals' },
  { name: 'Telmisartan 40mg', dosage: '1 Tablet', frequency: '1-0-0 (Morning)', duration: '30 Days', instruction: 'Morning after food' },
  { name: 'ORS Electrolyte Sachet', dosage: '1 Sachet in 1L Water', frequency: 'Drink throughout day', duration: '3 Days', instruction: 'Frequent sips' },
]

export default function PatientDetailsModal({
  isOpen,
  onClose,
  patient,
  doctorId,
  doctorName = 'Dr. Authorized Doctor',
  departmentName = 'Clinical OPD',
  hospitalName = 'Medical Facility',
  onConsultationCompleted,
}: PatientDetailsModalProps) {
  // Step navigation: 1: Details -> 2: Diagnose -> 3: Tests -> 4: Medicine & Follow-up -> 5: Complete
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false)

  // Patient Profile Data from DB
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [pastVisits, setPastVisits] = useState<PatientVisit[]>([])

  // Step 2: Diagnosis State
  const [diagnosis, setDiagnosis] = useState('')
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')

  // Step 3: Suggested Tests State
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [customTestInput, setCustomTestInput] = useState('')
  const [isUrgentTests, setIsUrgentTests] = useState(false)
  const [testInstructions, setTestInstructions] = useState('')

  // Step 4: Write Medicine & Follow-up State (Clean defaults, no demo/mock items)
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>([])
  const [newMed, setNewMed] = useState<PrescribedMedicine>({
    name: '',
    dosage: '1 Tablet',
    frequency: '1-0-1 (Morning & Night)',
    duration: '5 Days',
    instruction: 'After food',
  })
  const [clinicalAdvice, setClinicalAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  // Load Patient Profile & Past History on Open
  useEffect(() => {
    if (!isOpen || !patient) return

    setCurrentStep(1)
    setIsCompletedSuccess(false)
    setIsSubmitting(false)
    setDiagnosis(patient.chief_complaint && patient.chief_complaint !== 'General consultation' ? `Provisional: ${patient.chief_complaint}` : '')
    setSecondaryDiagnosis('')
    setClinicalNotes('')
    setSelectedTests([])
    setMedicines([])
    setClinicalAdvice('')
    setFollowUpDate('')

    const patientId = patient.patient_id
    if (!patientId) {
      setProfile(null)
      setPastVisits([])
      return
    }

    setLoading(true)
    Promise.all([
      getPatientProfile(patientId),
      doctorId ? getPatientVisitHistory(patientId, doctorId) : Promise.resolve([]),
    ])
      .then(([prof, hist]) => {
        if (prof) setProfile(prof)
        setPastVisits(hist)
      })
      .catch(err => console.warn('Error loading patient details:', err))
      .finally(() => setLoading(false))
  }, [isOpen, patient, doctorId])

  if (!isOpen || !patient) return null

  // Step 3 Test toggle
  const toggleTest = (testName: string) => {
    setSelectedTests(prev =>
      prev.includes(testName) ? prev.filter(t => t !== testName) : [...prev, testName]
    )
  }

  const handleAddCustomTest = () => {
    if (!customTestInput.trim()) return
    if (!selectedTests.includes(customTestInput.trim())) {
      setSelectedTests(prev => [...prev, customTestInput.trim()])
    }
    setCustomTestInput('')
  }

  // Step 4 Medicine Handlers
  const handleAddMedicine = () => {
    if (!newMed.name.trim()) return
    setMedicines(prev => [...prev, { ...newMed }])
    setNewMed({
      name: '',
      dosage: '1 Tablet',
      frequency: '1-0-1 (Morning & Night)',
      duration: '5 Days',
      instruction: 'After food',
    })
  }

  const handleRemoveMedicine = (index: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddQuickMed = (med: PrescribedMedicine) => {
    if (!medicines.some(m => m.name === med.name)) {
      setMedicines(prev => [...prev, { ...med }])
    }
  }

  // Step 5: Save & Complete Consultation
  const handleCompleteConsultation = async () => {
    if (!patient.id) {
      alert('Missing appointment identifier.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Build composite advice including suggested tests if any
      let finalAdvice = clinicalAdvice.trim()
      if (selectedTests.length > 0) {
        finalAdvice += `\n\n[RECOMMENDED DIAGNOSTIC TESTS (${isUrgentTests ? 'STAT/URGENT' : 'Routine'})]:\n• ` + selectedTests.join('\n• ')
        if (testInstructions) finalAdvice += `\nTest Notes: ${testInstructions}`
      }

      // 2. Persist consultation & prescription to database
      const success = await completeConsultation({
        hospitalId: '',
        appointmentId: patient.id,
        doctorId: doctorId || '',
        patientId: patient.patient_id || null,
        diagnosis: diagnosis || 'Clinical evaluation completed',
        clinicalNotes: clinicalNotes || undefined,
        vitals: patient.vitals || { bp: '120/80', pulse: '74', temp: '98.6', spo2: '99%' },
        medicines: medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          duration: m.duration,
          instruction: `${m.frequency} — ${m.instruction}`,
        })),
        advice: finalAdvice,
        followUp: followUpDate || 'As needed',
      })

      if (success) {
        // 3. Mark appointment Completed
        await updateAppointmentStatus(patient.id, 'Completed')
        setIsCompletedSuccess(true)
        if (onConsultationCompleted) onConsultationCompleted()
      } else {
        alert('Could not save consultation. Please try again.')
      }
    } catch (err: any) {
      console.error('Error completing consultation:', err)
      alert(`Error saving consultation: ${err?.message || 'Server error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const patientIdDisplay = profile?.patient_number || patient.patient_number || (patient.patient_id ? `PID-${patient.patient_id.slice(0, 6).toUpperCase()}` : '—')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with 5-Step Stepper */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Top Patient Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0">
                {patient.patient_name ? patient.patient_name.charAt(0).toUpperCase() : <User size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-mono font-black rounded-md tracking-wider">
                    {patientIdDisplay}
                  </span>
                  {patient.queue_number && (
                    <span className="px-2 py-0.5 bg-emerald-400/25 text-emerald-100 text-[10px] font-black rounded-md border border-emerald-400/40">
                      {patient.queue_number}
                    </span>
                  )}
                  <span className="text-[11px] text-indigo-100 font-bold">
                    {profile?.age || patient.age || '—'} Yrs • {profile?.gender || patient.gender || '—'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  {profile?.name || patient.patient_name}
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-indigo-100 font-semibold">
              <p className="flex items-center sm:justify-end gap-1"><Phone size={12} /> {profile?.phone || patient.phone || 'No phone'}</p>
              <p className="text-[10px] text-indigo-200 mt-0.5">{hospitalName} • {departmentName}</p>
            </div>
          </div>

          {/* 5-Step Process Bar */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-5 pt-3 border-t border-white/15">
            {[
              { step: 1, label: '1. Patient Details' },
              { step: 2, label: '2. Diagnose' },
              { step: 3, label: '3. Suggested Tests' },
              { step: 4, label: '4. Rx & Follow-up' },
              { step: 5, label: '5. Complete' },
            ].map(s => {
              const isActive = currentStep === s.step
              const isDone = currentStep > s.step
              return (
                <button
                  key={s.step}
                  onClick={() => !isCompletedSuccess && setCurrentStep(s.step as any)}
                  className={`py-1.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer text-center truncate ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-md font-black'
                      : isDone
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'text-indigo-200 hover:text-white bg-transparent'
                  }`}
                >
                  {isDone && <Check size={12} className="shrink-0" />}
                  <span className="truncate">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          
          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: PATIENT FILLED DETAILS
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-indigo-600" /> Patient Filled Intake Details & Vitals
                </h3>
                <span className="text-xs font-bold text-slate-400">Step 1 of 5</span>
              </div>

              {/* Patient Intake Chief Complaint */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                    Reported Symptoms / Chief Complaints
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    Patient Input
                  </span>
                </div>
                <p className="text-base font-extrabold text-slate-800">
                  {patient.chief_complaint || 'General checkup & routine clinical evaluation'}
                </p>
              </div>

              {/* Vitals Snapshot */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  Current Vitals & Biometrics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Blood Pressure', val: patient.vitals?.bp || '120/80', unit: 'mmHg', icon: Heart, color: 'text-rose-600 bg-rose-50' },
                    { label: 'Pulse Rate', val: patient.vitals?.pulse || '74', unit: 'bpm', icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Body Temp', val: patient.vitals?.temp || '98.6', unit: '°F', icon: Shield, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Oxygen (SpO2)', val: patient.vitals?.spo2 || '99%', unit: '', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
                  ].map((v, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold">{v.label}</span>
                        <v.icon size={13} className={v.color} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">{v.val}</span>
                        {v.unit && <span className="text-[10px] font-bold text-slate-400">{v.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies and Chronic Illnesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={14} /> Allergies & Drug Reactions
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {profile?.allergies || patient.allergies || 'No known drug allergies reported'}
                  </p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 text-xs font-black uppercase tracking-wider">
                    <Shield size={14} /> Chronic Diseases / History
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {profile?.known_diseases || 'No major chronic illnesses recorded'}
                  </p>
                </div>
              </div>

              {/* Demographics & Contact */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs space-y-2">
                <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider block">Patient Demographics</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Full Name & ID</span>
                    <span className="font-bold text-slate-900">{profile?.name || patient.patient_name}</span>
                    <span className="text-[10px] text-slate-400 block">{patientIdDisplay}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Age & Gender</span>
                    <span>{profile?.age || patient.age || '—'} Years, {profile?.gender || patient.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Contact Phone</span>
                    <span>{profile?.phone || patient.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Past Visits Summary */}
              {pastVisits.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                  <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider block">
                    Previous Doctor Visits ({pastVisits.length})
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {pastVisits.slice(0, 3).map((v, i) => (
                      <div key={i} className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{v.appointmentDate} — {v.diagnosis || 'General Consultation'}</span>
                        <span className="text-slate-400 font-semibold">{v.medicines?.length || 0} meds</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Step Action */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Proceed to Diagnose</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: DIAGNOSE
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope size={16} className="text-indigo-600" /> Step 2: Clinical Examination & Diagnosis
                </h3>
                <span className="text-xs font-bold text-slate-400">Step 2 of 5</span>
              </div>

              {/* Primary Diagnosis */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Primary Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Viral Bronchitis with Pharyngitis"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              {/* 1-Click Common Diagnosis Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick 1-Click Diagnosis Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiagnosis(d)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        diagnosis === d
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Diagnosis */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Secondary Diagnosis / Comorbidities (Optional)
                </label>
                <input
                  type="text"
                  value={secondaryDiagnosis}
                  onChange={e => setSecondaryDiagnosis(e.target.value)}
                  placeholder="e.g. Mild Dehydration, History of Hypertension"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Clinical / Examination SOAP Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Doctor Clinical Examination & SOAP Notes
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="Chest clear, B/L vesicular breath sounds, throat congested, abdomen soft non-tender..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Step Navigation */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Details
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Proceed to Suggested Tests</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: SUGGESTED TESTS
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical size={16} className="text-indigo-600" /> Step 3: Diagnostic Lab & Imaging Tests
                </h3>
                <span className="text-xs font-bold text-slate-400">Step 3 of 5</span>
              </div>

              {/* Selected Tests Summary Badge */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                    Selected Tests ({selectedTests.length})
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedTests.length > 0 ? selectedTests.join(', ') : 'No tests advised (optional)'}
                  </p>
                </div>
                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTests([])}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Urgent Toggle & Custom Test */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Add Custom Test Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTestInput}
                      onChange={e => setCustomTestInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTest())}
                      placeholder="e.g. Serum Vitamin D, Cortisol"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTest}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="urgentToggle"
                    checked={isUrgentTests}
                    onChange={e => setIsUrgentTests(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                  <label htmlFor="urgentToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                    🚨 Mark as STAT / Urgent Requisition
                  </label>
                </div>
              </div>

              {/* Categorized Test Catalog */}
              <div className="space-y-3">
                {Object.entries(LAB_CATEGORIES).map(([category, tests]) => (
                  <div key={category} className="p-3 bg-slate-50/60 border border-slate-200/80 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tests.map(t => {
                        const isSelected = selectedTests.includes(t)
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTest(t)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Navigation */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Diagnosis
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Proceed to Write Medicine & Follow-up</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 4: WRITE MEDICINE & FOLLOW-UP
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Pill size={16} className="text-indigo-600" /> Step 4: 30-Second Rx Engine & Follow-Up
                </h3>
                <span className="text-xs font-bold text-slate-400">Step 4 of 5</span>
              </div>

              {/* Quick Add Medicine Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1-Click Standard Drug Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MEDS.map(qm => (
                    <button
                      key={qm.name}
                      type="button"
                      onClick={() => handleAddQuickMed(qm)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-xl transition cursor-pointer"
                    >
                      + {qm.name.split(' ')[0]} {qm.dosage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Medicine Form */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                  Add Medicine to Prescription
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4 space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-600">Drug / Generic Name *</label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Tab. Azithromycin 500mg"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-600">Dosage</label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={e => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                      placeholder="1 Tab / 5ml"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-600">Frequency</label>
                    <select
                      value={newMed.frequency}
                      onChange={e => setNewMed(p => ({ ...p, frequency: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="1-0-1 (Morning & Night)">1-0-1 (Morning & Night)</option>
                      <option value="1-1-1 (Morning, Noon & Night)">1-1-1 (TDS / Thrice Daily)</option>
                      <option value="1-0-0 (Morning)">1-0-0 (OD Morning)</option>
                      <option value="0-0-1 (Night)">0-0-1 (OD Night / Bedtime)</option>
                      <option value="1-0-0-1 (QID)">1-0-0-1 (Four times daily)</option>
                      <option value="SOS (When needed)">SOS (When needed for pain/fever)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-600">Duration</label>
                    <input
                      type="text"
                      value={newMed.duration}
                      onChange={e => setNewMed(p => ({ ...p, duration: e.target.value }))}
                      placeholder="5 Days"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescribed Medicines Table */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Active Prescription Items ({medicines.length})
                </span>
                <div className="space-y-2">
                  {medicines.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-black text-xs text-slate-900">{m.name}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            {m.dosage} • {m.frequency} • {m.duration} • <span className="text-indigo-600">{m.instruction}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Advice & Follow-Up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">General Advice / Diet</label>
                  <textarea
                    rows={2}
                    value={clinicalAdvice}
                    onChange={e => setClinicalAdvice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Scheduled Follow-Up</label>
                  <input
                    type="text"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    placeholder="e.g. After 7 Days or Next Monday"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <div className="flex gap-1.5">
                    {['+3 Days', '+5 Days', '+7 Days', '+14 Days', '+1 Month'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFollowUpDate(f)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Tests
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Review & Complete Consultation</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 5: REVIEW, COMPLETE & GENERATE PRESCRIPTION
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" /> Step 5: Official Prescription Preview & Complete
                </h3>
                <span className="text-xs font-bold text-slate-400">Step 5 of 5</span>
              </div>

              {/* Success Badge */}
              {isCompletedSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm">Consultation Successfully Completed!</h4>
                      <p className="text-xs text-emerald-700 font-medium">
                        Prescription generated, token completed in live queue, and digital record saved.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              )}

              {/* Live Official Letterhead Preview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-sans text-slate-800">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-3">
                    <img src="/assets/brand-icon.png" alt="Logo" className="w-9 h-9 object-contain" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{hospitalName}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">{departmentName} • {doctorName}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <span className="font-mono font-bold text-indigo-600">Token #{patient.token_number || '001'}</span><br />
                    <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {/* Patient Bar */}
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Patient Name</span>
                    <span className="font-bold text-slate-900">{profile?.name || patient.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Age / Gender</span>
                    <span>{profile?.age || patient.age || '—'} Yrs / {profile?.gender || patient.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Patient ID</span>
                    <span className="font-mono">{patientIdDisplay}</span>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Diagnosis</span>
                  <p className="text-sm font-black text-indigo-700">
                    🩺 {diagnosis || 'Clinical evaluation completed'}
                    {secondaryDiagnosis && <span className="text-slate-500 text-xs font-semibold"> • {secondaryDiagnosis}</span>}
                  </p>
                </div>

                {/* Suggested Tests (if any) */}
                {selectedTests.length > 0 && (
                  <div className="space-y-1.5 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                      🧪 Recommended Diagnostic Tests ({isUrgentTests ? 'STAT/URGENT' : 'Routine'})
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-semibold">
                      {selectedTests.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Medicines List */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                    <span className="text-indigo-600 text-lg">℞</span> Prescribed Medicines
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {medicines.map((m, i) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">• {m.name}</span>
                          <span className="text-[11px] text-slate-500">{m.instruction}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-600 block">{m.dosage} ({m.frequency})</span>
                          <span className="text-[10px] text-slate-400">{m.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advice & Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Doctor's Advice</span>
                    <p className="text-slate-700 italic font-medium">{clinicalAdvice}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Review / Follow-Up</span>
                    <p className="font-bold text-indigo-700">{followUpDate}</p>
                  </div>
                </div>
              </div>

              {/* Bottom Complete Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft size={16} /> Edit Prescription
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer size={15} /> Print Rx
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || isCompletedSuccess}
                    onClick={handleCompleteConsultation}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      'Saving & Completing…'
                    ) : isCompletedSuccess ? (
                      <>✓ Consultation Completed</>
                    ) : (
                      <>
                        <Check size={16} /> Complete & Save Consultation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
