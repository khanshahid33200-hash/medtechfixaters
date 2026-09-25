import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  Phone,
  Heart,
  Activity,
  AlertTriangle,
  FileText,
  Stethoscope,
  Shield,
  Pill,
  Printer,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  FlaskConical,
  CheckCircle2,
  Edit3,
  Save,
  X
} from 'lucide-react'
import {
  getPatientProfile,
  getPatientVisitHistory,
  completeConsultation,
  updateAppointmentStatus,
  updateAppointmentAndPatientDetails,
  PatientProfile,
  PatientVisit
} from '../lib/doctorAppointments'
import { validateName, validatePhone, validateAge } from '../utils/validation'
import { logActivity } from '../services/auditLogService'
import {
  finalizeConsultation,
  getClinicalSuggestions,
  type ClinicalSuggestions,
  type MedicineSearchResult,
  type SuggestedMedicine,
  type SuggestedTest,
} from '../services/medicineService'
import MedicineAutocomplete from './medicines/MedicineAutocomplete'
import MedicineFormModal from './medicines/MedicineFormModal'
import DecisionSupportPanel from './medicines/DecisionSupportPanel'
import ClinicalAiPanel from './ai/ClinicalAiPanel'
import type { ClinicalDraft, MedicineSuggestion } from '../lib/aiAssist'
import PrescriptionItemCard, { type PrescriptionDraftItem } from './medicines/PrescriptionItemCard'

export interface PatientWorkspaceData {
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

interface PatientConsultationWorkspaceProps {
  patient: PatientWorkspaceData
  doctorId: string
  hospitalId?: string
  doctorName?: string
  departmentName?: string
  hospitalName?: string
  onBack: () => void
  onConsultationCompleted: () => void
}

export type PrescribedMedicine = PrescriptionDraftItem

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

// No platform-supplied medicine presets: every medicine comes from the doctor's own
// library, the doctor's own suggestion rules, or is typed in by the doctor.

export default function PatientConsultationWorkspace({
  patient,
  doctorId,
  hospitalId = '',
  doctorName = 'Dr. Authorized Doctor',
  departmentName = 'Clinical OPD',
  hospitalName = 'Medical Facility',
  onBack,
  onConsultationCompleted,
}: PatientConsultationWorkspaceProps) {
  // 5-Step Stepper: 1: Details -> 2: Diagnose -> 3: Tests -> 4: Medicine & Follow-up -> 5: Complete
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false)

  // Patient Profile Data from DB
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [pastVisits, setPastVisits] = useState<PatientVisit[]>([])

  // Doctor Patient Detail Editing State
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editForm, setEditForm] = useState({
    name: patient.patient_name || '',
    phone: patient.phone || '',
    age: patient.age ?? 30,
    gender: patient.gender || 'Male',
    symptoms: patient.chief_complaint || '',
    allergies: patient.allergies || '',
    known_diseases: '',
  })
  const [editErrors, setEditErrors] = useState<{ name?: string; phone?: string; age?: string }>({})
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [detailsSaveNotice, setDetailsSaveNotice] = useState<string | null>(null)

  // Live Consultation Vitals (starts from patient's recorded vitals if any, otherwise empty for doctor to enter)
  const [consultationVitals, setConsultationVitals] = useState({
    bp: patient.vitals?.bp || '',
    pulse: patient.vitals?.pulse || '',
    temp: patient.vitals?.temp || '',
    spo2: patient.vitals?.spo2 || '',
  })

  // Step 2: Diagnosis State
  const [diagnosis, setDiagnosis] = useState(() =>
    patient.chief_complaint && patient.chief_complaint !== 'General consultation'
      ? `Provisional: ${patient.chief_complaint}`
      : ''
  )
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')

  // Step 3: Suggested Tests State
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [customTestInput, setCustomTestInput] = useState('')
  const [isUrgentTests, setIsUrgentTests] = useState(false)
  const [testInstructions, setTestInstructions] = useState('')

  // Step 4: Write Medicine & Follow-up State (Starts blank with NO demo medicines or hardcoded text)
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>([])
  // Manual entry starts blank: no dosage is ever assumed for the doctor.
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '', instruction: '' })
  const [suggestions, setSuggestions] = useState<ClinicalSuggestions | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsUnavailable, setSuggestionsUnavailable] = useState(false)
  const [newMedicineName, setNewMedicineName] = useState<string | null>(null)
  const [clinicalAdvice, setClinicalAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  // Sync edit form when profile or patient data is loaded
  useEffect(() => {
    setEditForm({
      name: profile?.name || patient.patient_name || '',
      phone: profile?.phone || patient.phone || '',
      age: profile?.age ?? patient.age ?? 30,
      gender: profile?.gender || patient.gender || 'Male',
      symptoms: patient.chief_complaint || '',
      allergies: profile?.allergies || patient.allergies || '',
      known_diseases: profile?.known_diseases || '',
    })
  }, [profile, patient])

  const handleSavePatientDetails = async () => {
    const newErrors: { name?: string; phone?: string; age?: string } = {}
    const nameCheck = validateName(editForm.name)
    if (!nameCheck.isValid) newErrors.name = nameCheck.error

    const phoneCheck = validatePhone(editForm.phone)
    if (!phoneCheck.isValid) newErrors.phone = phoneCheck.error

    const ageCheck = validateAge(editForm.age)
    if (!ageCheck.isValid) newErrors.age = ageCheck.error

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors)
      return
    }

    setEditErrors({})
    setIsSavingDetails(true)

    const res = await updateAppointmentAndPatientDetails({
      appointmentId: patient.id,
      patientId: patient.patient_id,
      name: editForm.name.trim(),
      phone: phoneCheck.cleaned,
      age: ageCheck.ageNum,
      gender: editForm.gender,
      symptoms: editForm.symptoms.trim(),
      allergies: editForm.allergies.trim(),
      known_diseases: editForm.known_diseases.trim(),
    })

    setIsSavingDetails(false)
    if (res.success) {
      setProfile(prev => prev ? ({
        ...prev,
        name: editForm.name.trim(),
        phone: phoneCheck.cleaned,
        age: ageCheck.ageNum,
        gender: editForm.gender,
        allergies: editForm.allergies.trim(),
        known_diseases: editForm.known_diseases.trim(),
      }) : null)
      patient.patient_name = editForm.name.trim()
      patient.phone = phoneCheck.cleaned
      patient.age = ageCheck.ageNum
      patient.gender = editForm.gender
      patient.chief_complaint = editForm.symptoms.trim()
      patient.allergies = editForm.allergies.trim()

      setIsEditingDetails(false)
      setDetailsSaveNotice('✓ Patient details updated and saved successfully.')
      setTimeout(() => setDetailsSaveNotice(null), 4000)
    } else {
      alert(`Could not save changes: ${res.error || 'Server error'}`)
    }
  }

  // Load Patient Profile & Past History from Supabase
  useEffect(() => {
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
  }, [patient, doctorId])

  // Doctor Decision Support: read-only suggestions from this doctor's own rules.
  useEffect(() => {
    if (!patient.id) return
    let cancelled = false
    setSuggestionsLoading(true)
    getClinicalSuggestions(patient.id)
      .then((res) => {
        if (!cancelled) setSuggestions(res)
      })
      .catch(() => {
        // Feature not installed yet (or offline): the consultation works without it.
        if (!cancelled) setSuggestionsUnavailable(true)
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [patient.id])

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
  const newKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

  // Audit metadata carries identifiers only — never patient or clinical text.
  const auditMedicine = (action: 'MEDICINE_ADDED_TO_PRESCRIPTION' | 'MEDICINE_REMOVED_FROM_PRESCRIPTION', item: PrescribedMedicine) =>
    logActivity({
      category: 'Clinical',
      action,
      targetType: 'appointment',
      targetId: patient.id,
      metadata: { medicine_id: item.medicine_id || null, source: item.source },
    })

  const handleAddMedicine = () => {
    if (!newMed.name.trim()) return
    // Typed entirely by the doctor, so it is confirmed as entered.
    const item: PrescribedMedicine = {
      key: newKey(),
      medicine_id: null,
      name: newMed.name.trim(),
      dosage: newMed.dosage.trim(),
      frequency: newMed.frequency.trim(),
      duration: newMed.duration.trim(),
      route: '',
      instruction: newMed.instruction.trim(),
      source: 'manual',
      confirmed: Boolean(newMed.dosage.trim() && newMed.frequency.trim() && newMed.duration.trim()),
    }
    setMedicines(prev => [...prev, item])
    auditMedicine('MEDICINE_ADDED_TO_PRESCRIPTION', item)
    setNewMed({ name: '', dosage: '', frequency: '', duration: '', instruction: '' })
  }

  // Library / suggestion items: the doctor's own defaults may be pre-filled, but the
  // line stays unconfirmed until the doctor reviews it and presses Save.
  const addLibraryMedicine = (
    m: Pick<MedicineSearchResult, 'medicine_name' | 'strength' | 'default_dosage' | 'default_frequency' | 'default_duration' | 'route' | 'special_instructions' | 'warnings' | 'contraindications'> & { id: string },
    source: 'library' | 'suggestion'
  ) => {
    if (medicines.some(x => x.medicine_id === m.id)) return
    const item: PrescribedMedicine = {
      key: newKey(),
      medicine_id: m.id,
      name: m.medicine_name,
      strength: m.strength,
      dosage: m.default_dosage || '',
      frequency: m.default_frequency || '',
      duration: m.default_duration || '',
      route: m.route || '',
      instruction: m.special_instructions || '',
      source,
      confirmed: false,
      warnings: [m.warnings, m.contraindications].filter(Boolean).join(' · ') || null,
    }
    setMedicines(prev => [...prev, item])
    auditMedicine('MEDICINE_ADDED_TO_PRESCRIPTION', item)
  }

  const addSuggestedMedicine = (m: SuggestedMedicine) =>
    addLibraryMedicine({ ...m, id: m.medicine_id, medicine_name: m.name }, 'suggestion')

  const addSuggestedTest = (t: SuggestedTest) => {
    if (!selectedTests.includes(t.name)) setSelectedTests(prev => [...prev, t.name])
  }

  // Gemini suggestions: added as an unconfirmed line the doctor must review and Save.
  const addAiMedicine = (m: MedicineSuggestion) => {
    if (medicines.some(x => x.name.toLowerCase() === m.name.toLowerCase())) return
    const item: PrescribedMedicine = {
      key: newKey(),
      medicine_id: null,
      name: m.name,
      dosage: '',
      frequency: '',
      duration: '',
      route: '',
      instruction: '',
      source: 'ai',
      confirmed: false,
      warnings: m.warnings.join(' · ') || null,
    }
    setMedicines(prev => [...prev, item])
    auditMedicine('MEDICINE_ADDED_TO_PRESCRIPTION', item)
  }

  // Only what the doctor has entered in this consultation; the server adds the minimum
  // patient context itself (never names, phone numbers or IDs).
  const buildAiDraft = (): ClinicalDraft => ({
    chief_complaint: patient.chief_complaint || '',
    diagnosis: [diagnosis, secondaryDiagnosis].filter(Boolean).join('; '),
    clinical_notes: clinicalNotes,
    vitals: Object.fromEntries(Object.entries(consultationVitals).filter(([, v]) => Boolean(v && String(v).trim())).map(([k, v]) => [k, String(v)])),
    selected_tests: selectedTests,
    medicines: medicines.map(m => ({ name: m.strength ? `${m.name} ${m.strength}` : m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration })),
  })

  const updateMedicine = (key: string, patch: Partial<PrescribedMedicine>) =>
    setMedicines(prev => prev.map(m => (m.key === key ? { ...m, ...patch } : m)))

  const handleRemoveMedicine = (key: string) => {
    const item = medicines.find(m => m.key === key)
    setMedicines(prev => prev.filter(m => m.key !== key))
    if (item) auditMedicine('MEDICINE_REMOVED_FROM_PRESCRIPTION', item)
  }

  const unconfirmedCount = medicines.filter(m => !m.confirmed).length

  // Step 5: Save & Complete Consultation
  const handleCompleteConsultation = async () => {
    if (!patient.id) {
      alert('Missing appointment identifier.')
      return
    }

    if (unconfirmedCount > 0) {
      alert('Review and save every medicine before completing the consultation.')
      setCurrentStep(4)
      return
    }

    setIsSubmitting(true)
    try {
      const activeVitalsForRpc = Object.fromEntries(
        Object.entries(consultationVitals).filter(([_, v]) => Boolean(v && v.trim()))
      )
      // Preferred path: one atomic, server-validated save with medicine snapshots.
      const rpc = await finalizeConsultation({
        appointmentId: patient.id,
        diagnosis: diagnosis || 'Clinical evaluation completed',
        clinicalNotes: clinicalNotes || undefined,
        vitals: Object.keys(activeVitalsForRpc).length > 0 ? activeVitalsForRpc : (patient.vitals as Record<string, string>) || undefined,
        items: medicines.map(m => ({
          medicine_id: m.medicine_id || null,
          name: m.name,
          strength: m.strength || null,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          route: m.route,
          instructions: m.instruction,
          // An AI suggestion becomes the doctor's own line once reviewed and saved; its AI origin
          // stays in the activity log (MEDICINE_ADDED_TO_PRESCRIPTION, source 'ai').
          source: m.source === 'ai' ? 'manual' : m.source,
          confirmed: m.confirmed,
        })),
        tests: selectedTests,
        testsUrgent: isUrgentTests,
        testInstructions: testInstructions || undefined,
        advice: clinicalAdvice.trim() || undefined,
        followUp: followUpDate || 'As needed',
      })
      if (rpc.success) {
        setIsCompletedSuccess(true)
        if (onConsultationCompleted) onConsultationCompleted()
        return
      }
      if (!rpc.missing) {
        alert(`Could not save consultation: ${rpc.error || 'Server error'}`)
        return
      }

      // Fallback while the 03 migration is not installed: previous save path.
      let finalAdvice = clinicalAdvice.trim()
      if (selectedTests.length > 0) {
        finalAdvice += `\n\n[RECOMMENDED DIAGNOSTIC TESTS (${isUrgentTests ? 'STAT/URGENT' : 'Routine'})]:\n• ` + selectedTests.join('\n• ')
        if (testInstructions) finalAdvice += `\nTest Notes: ${testInstructions}`
      }

      const activeVitals = Object.fromEntries(
        Object.entries(consultationVitals).filter(([_, v]) => Boolean(v && v.trim()))
      )

      const success = await completeConsultation({
        hospitalId: hospitalId || '',
        appointmentId: patient.id,
        doctorId: doctorId || '',
        patientId: patient.patient_id || null,
        diagnosis: diagnosis || 'Clinical evaluation completed',
        clinicalNotes: clinicalNotes || undefined,
        vitals: Object.keys(activeVitals).length > 0 ? activeVitals : patient.vitals || undefined,
        medicines: medicines.map(m => ({
          name: m.strength ? `${m.name} ${m.strength}` : m.name,
          dosage: m.dosage,
          duration: m.duration,
          instruction: [m.frequency, m.route, m.instruction].filter(Boolean).join(' — '),
        })),
        advice: finalAdvice || undefined,
        followUp: followUpDate || 'As needed',
      })

      if (success) {
        await updateAppointmentStatus(patient.id, 'Completed')
        setIsCompletedSuccess(true)
        if (onConsultationCompleted) onConsultationCompleted()
      } else {
        alert('Could not save consultation. Please check connection and try again.')
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
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Live Queue</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          Patient Consultation Workspace • <strong className="text-indigo-600">{hospitalName}</strong>
        </span>
      </div>

      {/* Main Full-Window Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Full-Width Header Bar */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Patient Snapshot */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-inner shrink-0">
                {patient.patient_name ? patient.patient_name.charAt(0).toUpperCase() : <User size={28} />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-white/20 text-white text-[11px] font-mono font-black rounded-md tracking-wider">
                    {patientIdDisplay}
                  </span>
                  {patient.queue_number && (
                    <span className="px-2.5 py-0.5 bg-emerald-400/25 text-emerald-100 text-[11px] font-black rounded-md border border-emerald-400/30">
                      {patient.queue_number}
                    </span>
                  )}
                  {patient.status && (
                    <span className="px-2.5 py-0.5 bg-indigo-400/30 text-indigo-100 text-[10px] font-bold rounded-md">
                      {patient.status}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
                  {profile?.name || patient.patient_name}
                </h1>
                <p className="text-xs text-indigo-100 font-semibold mt-0.5 flex items-center gap-3">
                  <span>{profile?.age || patient.age || '—'} Years</span> • 
                  <span>{profile?.gender || patient.gender || '—'}</span> • 
                  <span className="flex items-center gap-1"><Phone size={12} /> {profile?.phone || patient.phone || 'No phone'}</span>
                </p>
              </div>
            </div>

            {/* Doctor & Facility Info */}
            <div className="text-left md:text-right text-xs text-indigo-100 font-semibold border-t md:border-t-0 pt-2 md:pt-0 border-white/15">
              <span className="text-sm font-black text-white block">{doctorName}</span>
              <span className="text-indigo-200 block text-[11px]">{departmentName}</span>
              <span className="text-[10px] text-indigo-300 mt-1 block font-mono">Date: {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* 5-Step Process Tab Navigation */}
          <div className="grid grid-cols-5 gap-2 mt-6 pt-4 border-t border-white/15 text-xs">
            {[
              { step: 1, label: '1. Patient Details' },
              { step: 2, label: '2. Diagnose' },
              { step: 3, label: '3. Suggested Tests' },
              { step: 4, label: '4. Write Rx & Follow-Up' },
              { step: 5, label: '5. Complete Consultation' },
            ].map(s => {
              const isActive = currentStep === s.step
              const isDone = currentStep > s.step
              return (
                <button
                  key={s.step}
                  onClick={() => !isCompletedSuccess && setCurrentStep(s.step as any)}
                  className={`py-2 px-2 sm:px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center truncate ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-md font-black scale-102'
                      : isDone
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'text-indigo-200 hover:text-white bg-transparent'
                  }`}
                >
                  {isDone && <Check size={14} className="shrink-0" />}
                  <span className="truncate">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 text-slate-800">
          
          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: PATIENT FILLED DETAILS & EDITABLE DEMOGRAPHICS
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User size={18} className="text-indigo-600" /> Patient Intake Details & Vitals
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and update details provided during check-in or update patient profile directly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingDetails ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(true)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-indigo-200"
                    >
                      <Edit3 size={14} />
                      <span>Edit Patient Details</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDetails(false)
                        setEditErrors({})
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  )}
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Step 1 of 5</span>
                </div>
              </div>

              {/* Save Success Notice */}
              {detailsSaveNotice && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{detailsSaveNotice}</span>
                </div>
              )}

              {isEditingDetails ? (
                /* ─── DOCTOR PATIENT EDIT FORM ─── */
                <div className="bg-slate-50/90 p-5 sm:p-6 rounded-3xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                    <div className="flex items-center gap-2">
                      <Edit3 size={16} className="text-indigo-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">Update Patient Demographic & Intake Records</h4>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Updates both master patient profile & current visit</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      {editErrors.name && <p className="text-[11px] text-rose-600 mt-1">{editErrors.name}</p>}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="10-digit mobile"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      {editErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{editErrors.phone}</p>}
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Age *</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={editForm.age}
                          onChange={e => setEditForm({ ...editForm, age: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                        {editErrors.age && <p className="text-[10px] text-rose-600 mt-0.5">{editErrors.age}</p>}
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Gender</label>
                        <select
                          value={editForm.gender}
                          onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                          className="w-full px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms & Chief Complaints */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Chief Complaints / Presenting Symptoms</label>
                    <input
                      type="text"
                      value={editForm.symptoms}
                      onChange={e => setEditForm({ ...editForm, symptoms: e.target.value })}
                      placeholder="e.g. High grade fever, throat pain for 3 days"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Allergies & Chronic Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Known Allergies / Drug Sensitivity</label>
                      <input
                        type="text"
                        value={editForm.allergies}
                        onChange={e => setEditForm({ ...editForm, allergies: e.target.value })}
                        placeholder="e.g. Penicillin, Sulfa drugs (or leave None)"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Known Chronic Diseases / Medical History</label>
                      <input
                        type="text"
                        value={editForm.known_diseases}
                        onChange={e => setEditForm({ ...editForm, known_diseases: e.target.value })}
                        placeholder="e.g. Hypertension, Type 2 Diabetes"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingDetails}
                      onClick={handleSavePatientDetails}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Save size={14} />
                      <span>{isSavingDetails ? 'Saving...' : 'Save & Update Records'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Reported Chief Complaints */}
                  <div className="p-5 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                        Reported Symptoms / Chief Complaints
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                        Patient Intake Input
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900">
                      {patient.chief_complaint || 'No specific symptoms entered by patient'}
                    </p>
                  </div>

                  {/* Demographics & Contact Bar */}
                  <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs space-y-2">
                    <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider block">Patient Demographics</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-semibold text-slate-700">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Full Legal Name</span>
                        <span className="font-bold text-slate-900 text-sm">{profile?.name || patient.patient_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{patientIdDisplay}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Age & Gender</span>
                        <span className="text-sm">{profile?.age || patient.age || '—'} Years, {profile?.gender || patient.gender || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Contact Phone</span>
                        <span className="text-sm">{profile?.phone || patient.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Allergies & Chronic Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-700 text-xs font-black uppercase tracking-wider">
                        <AlertTriangle size={14} /> Known Allergies & Drug Reactions
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {profile?.allergies || patient.allergies || 'None reported'}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-800 text-xs font-black uppercase tracking-wider">
                        <Shield size={14} /> Known Chronic Illnesses / History
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {profile?.known_diseases || 'None recorded'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Current Vitals & Biometrics */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    Patient Vitals & Biometrics
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Editable by Doctor / Staff</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Blood Pressure', key: 'bp', val: consultationVitals.bp, placeholder: '120/80', unit: 'mmHg', icon: Heart, color: 'text-rose-600 bg-rose-50' },
                    { label: 'Pulse Rate', key: 'pulse', val: consultationVitals.pulse, placeholder: '72', unit: 'bpm', icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Body Temp', key: 'temp', val: consultationVitals.temp, placeholder: '98.6', unit: '°F', icon: Shield, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Oxygen (SpO2)', key: 'spo2', val: consultationVitals.spo2, placeholder: '99', unit: '%', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
                  ].map((v, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold">{v.label}</span>
                        <v.icon size={15} className={v.color} />
                      </div>
                      <div className="flex items-baseline gap-1 pt-1">
                        <input
                          type="text"
                          value={v.val}
                          onChange={e => setConsultationVitals(prev => ({ ...prev, [v.key]: e.target.value }))}
                          placeholder={v.placeholder}
                          className="w-full text-xl font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                        {v.unit && <span className="text-xs font-bold text-slate-400 shrink-0">{v.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Proceed to Diagnosis</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: DIAGNOSE
          ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Stethoscope size={18} className="text-indigo-600" /> Step 2: Clinical Examination & Diagnosis
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Specify primary diagnosis, secondary conditions, and clinical examination notes.</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Step 2 of 5</span>
              </div>

              {/* Primary Diagnosis */}
              <div className="space-y-2">
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

              {/* 1-Click Popular Diagnosis Tags */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1-Click Quick Diagnosis Presets
                </span>
                <div className="flex flex-wrap gap-2">
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Secondary Diagnosis / Comorbidities (Optional)
                </label>
                <input
                  type="text"
                  value={secondaryDiagnosis}
                  onChange={e => setSecondaryDiagnosis(e.target.value)}
                  placeholder="e.g. Mild Dehydration, Underlying Hypertension"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Examination & SOAP Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Doctor Clinical Examination & SOAP Progress Notes
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="Chest clear, B/L breath sounds equal, throat congested, abdomen soft non-tender..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
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
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FlaskConical size={18} className="text-indigo-600" /> Step 3: Diagnostic Lab & Imaging Tests
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select recommended investigations to include in patient prescription and lab orders.</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Step 3 of 5</span>
              </div>

              <DecisionSupportPanel
                mode="tests"
                reason={patient.chief_complaint}
                suggestions={suggestions}
                loading={suggestionsLoading}
                unavailable={suggestionsUnavailable}
                addedTests={selectedTests}
                onAddTest={addSuggestedTest}
              />

              <ClinicalAiPanel
                mode="tests"
                appointmentId={patient.id}
                buildDraft={buildAiDraft}
                addedTests={selectedTests}
                onAddTests={names => setSelectedTests(prev => Array.from(new Set([...prev, ...names])))}
              />

              {/* Selected Tests Summary Banner */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                    Selected Diagnostic Tests ({selectedTests.length})
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedTests.length > 0 ? selectedTests.join(', ') : 'No diagnostic tests advised (optional step)'}
                  </p>
                </div>
                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTests([])}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All Tests
                  </button>
                )}
              </div>

              {/* Custom Test & STAT Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Add Custom Test Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTestInput}
                      onChange={e => setCustomTestInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTest())}
                      placeholder="e.g. Serum Vitamin D3, Cortisol"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTest}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="urgentToggleWorkspace"
                    checked={isUrgentTests}
                    onChange={e => setIsUrgentTests(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                  <label htmlFor="urgentToggleWorkspace" className="text-xs font-bold text-slate-800 cursor-pointer">
                    🚨 Mark as STAT / Urgent Requisition
                  </label>
                </div>
              </div>

              {/* Categorized Test Catalog */}
              <div className="space-y-3">
                {Object.entries(LAB_CATEGORIES).map(([category, tests]) => (
                  <div key={category} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-2">
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

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
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
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Pill size={18} className="text-indigo-600" /> Step 4: 30-Second Rx Engine & Follow-Up
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Prescribe medications, dietary instructions, and review schedule.</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Step 4 of 5</span>
              </div>

              <DecisionSupportPanel
                mode="medicines"
                reason={patient.chief_complaint}
                suggestions={suggestions}
                loading={suggestionsLoading}
                unavailable={suggestionsUnavailable}
                addedMedicineIds={new Set(medicines.map(m => m.medicine_id).filter(Boolean) as string[])}
                onAddMedicine={addSuggestedMedicine}
              />

              <ClinicalAiPanel
                mode="medicines"
                appointmentId={patient.id}
                buildDraft={buildAiDraft}
                addedMedicines={medicines.map(m => m.name)}
                onAddMedicine={addAiMedicine}
              />

              {/* Doctor's own medicine library */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Prescription — search your medicine library
                </span>
                <MedicineAutocomplete
                  onSelect={m => addLibraryMedicine(m, 'library')}
                  onCreateNew={name => setNewMedicineName(name)}
                  placeholder="Type a medicine name (e.g. P, PA, PAR…)"
                />
              </div>

              {/* Add Custom Medicine Form */}
              <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider block">
                  Or type a medicine that is not in your library
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Drug / Generic Name *</label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                      placeholder="Medicine name and strength"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Dosage</label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={e => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                      placeholder="e.g. 1 tablet"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Frequency</label>
                    <select
                      value={newMed.frequency}
                      onChange={e => setNewMed(p => ({ ...p, frequency: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="">Select frequency…</option>
                      <option value="1-0-1 (Morning & Night)">1-0-1 (Morning & Night)</option>
                      <option value="1-1-1 (Morning, Noon & Night)">1-1-1 (TDS / Thrice Daily)</option>
                      <option value="1-0-0 (Morning)">1-0-0 (OD Morning)</option>
                      <option value="0-0-1 (Night)">0-0-1 (OD Night / Bedtime)</option>
                      <option value="1-0-0-1 (QID)">1-0-0-1 (Four times daily)</option>
                      <option value="SOS (When needed)">SOS (When needed for pain/fever)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Duration</label>
                    <input
                      type="text"
                      value={newMed.duration}
                      onChange={e => setNewMed(p => ({ ...p, duration: e.target.value }))}
                      placeholder="e.g. 5 days"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescribed Medicines List */}
              <div className="space-y-2.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Active Prescription Items ({medicines.length})
                </span>
                {medicines.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-bold text-slate-600">No medicines added to this prescription yet.</p>
                    <p className="text-[11px] text-slate-400">Search your library, add a reviewed suggestion, or type a medicine above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {medicines.map((m, idx) => (
                      <PrescriptionItemCard
                        key={m.key}
                        index={idx}
                        item={m}
                        onChange={patch => updateMedicine(m.key, patch)}
                        onRemove={() => handleRemoveMedicine(m.key)}
                      />
                    ))}
                  </div>
                )}
                {unconfirmedCount > 0 && (
                  <p className="text-[11px] font-bold text-amber-700">
                    {unconfirmedCount} medicine{unconfirmedCount === 1 ? '' : 's'} awaiting your review — press Save on each before continuing.
                  </p>
                )}
              </div>

              <ClinicalAiPanel
                mode="advice"
                appointmentId={patient.id}
                buildDraft={buildAiDraft}
                initialAdviceNote={clinicalAdvice}
                onUseAdvice={text => setClinicalAdvice(prev => (prev.trim() ? `${prev.trim()}
${text}` : text))}
              />

              {/* Advice & Follow-Up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Doctor Advice / Diet</label>
                  <textarea
                    rows={2}
                    value={clinicalAdvice}
                    onChange={e => setClinicalAdvice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Scheduled Review / Follow-Up</label>
                  <input
                    type="text"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    placeholder="e.g. After 7 Days or Next Monday"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['+3 Days', '+5 Days', '+7 Days', '+14 Days', '+1 Month'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFollowUpDate(f)}
                        className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Tests
                </button>
                <button
                  type="button"
                  disabled={unconfirmedCount > 0}
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
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
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" /> Step 5: Official Prescription Preview & Final Completion
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verify prescription contents before finalizing the consultation.</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Step 5 of 5</span>
              </div>

              {/* Success Banner */}
              {isCompletedSuccess && (
                <div className="p-5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                      <Check size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-base">Consultation Successfully Completed!</h4>
                      <p className="text-xs text-emerald-700 font-medium">
                        Prescription saved to database and token completed in today's live queue.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onBack}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    Done & Return to Queue
                  </button>
                </div>
              )}

              {/* Official Letterhead Preview */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 font-sans text-slate-800">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                  <div className="flex items-center gap-3">
                    <img src="/assets/brand-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <div>
                      <h4 className="font-black text-base text-slate-900">{hospitalName}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{departmentName} • {doctorName}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-mono font-black text-indigo-600 text-sm">Token #{patient.token_number || '001'}</span><br />
                    <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {/* Patient Information Grid */}
                <div className="p-4 bg-slate-50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Patient Name</span>
                    <span className="font-bold text-slate-900 text-sm">{profile?.name || patient.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Age / Gender</span>
                    <span className="text-sm">{profile?.age || patient.age || '—'} Yrs / {profile?.gender || patient.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Patient Registration ID</span>
                    <span className="font-mono text-sm">{patientIdDisplay}</span>
                  </div>
                </div>

                {/* Clinical Diagnosis */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Clinical Diagnosis</span>
                  <p className="text-base font-black text-indigo-700">
                    🩺 {diagnosis || 'Clinical evaluation completed'}
                    {secondaryDiagnosis && <span className="text-slate-500 text-xs font-semibold"> • {secondaryDiagnosis}</span>}
                  </p>
                </div>

                {/* Suggested Tests (if any) */}
                {selectedTests.length > 0 && (
                  <div className="space-y-1.5 p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                      🧪 Recommended Diagnostic Investigations ({isUrgentTests ? 'STAT/URGENT' : 'Routine'})
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
                  <div className="flex items-center gap-1.5 font-black text-base text-slate-900">
                    <span className="text-indigo-600 text-xl font-serif">℞</span> Prescribed Medicines
                  </div>
                  {medicines.length === 0 ? (
                    <p className="text-xs italic text-slate-400 py-2">No medications prescribed for this consultation visit.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {medicines.map((m) => (
                        <div key={m.key} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">• {m.name}{m.strength ? ` ${m.strength}` : ''}</span>
                            <span className="text-xs text-slate-500">{[m.route, m.instruction].filter(Boolean).join(' • ')}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-600 block text-xs">{m.dosage} ({m.frequency})</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{m.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Advice & Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Doctor's Advice & Diet</span>
                    <p className="text-slate-700 italic font-medium mt-0.5">{clinicalAdvice || 'Standard precautions and routine care.'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Review / Follow-Up</span>
                    <p className="font-bold text-indigo-700 text-sm mt-0.5">{followUpDate || 'SOS / As needed'}</p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
                    <Printer size={16} /> Print Rx
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || isCompletedSuccess}
                    onClick={handleCompleteConsultation}
                    className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      'Saving & Completing…'
                    ) : isCompletedSuccess ? (
                      <>✓ Consultation Completed</>
                    ) : (
                      <>
                        <Check size={16} /> Save & Complete Consultation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {newMedicineName !== null && (
        <MedicineFormModal
          initialName={newMedicineName}
          onClose={() => setNewMedicineName(null)}
          onSaved={saved => {
            setNewMedicineName(null)
            if (saved.status === 'active') addLibraryMedicine(saved, 'library')
          }}
        />
      )}
    </div>
  )
}
