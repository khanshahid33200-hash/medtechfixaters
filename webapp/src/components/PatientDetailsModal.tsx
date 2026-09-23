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
  ExternalLink,
  Edit3,
  Check,
  Building2,
  CalendarClock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getPatientProfile, getPatientVisitHistory, updatePatientProfile, PatientProfile, PatientVisit } from '../lib/doctorAppointments'

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
  hospitalName?: string
  onStartConsultation?: (patient: PatientModalData) => void
  onIssueCertificate?: (patient: PatientModalData) => void
  onLabAdvice?: (patient: PatientModalData) => void
  onScheduleFollowUp?: (patient: PatientModalData) => void
}

export default function PatientDetailsModal({
  isOpen,
  onClose,
  patient,
  doctorId,
  hospitalName = 'Clinical Facility',
  onStartConsultation,
  onIssueCertificate,
  onLabAdvice,
  onScheduleFollowUp,
}: PatientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'prescriptions' | 'edit'>('summary')
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [visits, setVisits] = useState<PatientVisit[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    age: 0,
    gender: 'Male',
    allergies: '',
    known_diseases: '',
    address: '',
  })

  useEffect(() => {
    if (!isOpen || !patient) return

    setActiveTab('summary')
    setSaveSuccess(false)
    setEditForm({
      name: patient.patient_name || '',
      phone: patient.phone || '',
      age: patient.age || 0,
      gender: patient.gender || 'Male',
      allergies: patient.allergies || '',
      known_diseases: '',
      address: '',
    })

    const patientId = patient.patient_id
    if (!patientId) {
      setProfile(null)
      setVisits([])
      return
    }

    setLoading(true)
    Promise.all([
      getPatientProfile(patientId),
      doctorId ? getPatientVisitHistory(patientId, doctorId) : Promise.resolve([]),
    ])
      .then(([prof, hist]) => {
        if (prof) {
          setProfile(prof)
          setEditForm({
            name: prof.name || patient.patient_name || '',
            phone: prof.phone || patient.phone || '',
            age: prof.age || patient.age || 0,
            gender: prof.gender || patient.gender || 'Male',
            allergies: prof.allergies || patient.allergies || '',
            known_diseases: prof.known_diseases || '',
            address: prof.address || '',
          })
        }
        setVisits(hist)
      })
      .catch(err => {
        console.warn('Failed to load patient profile:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, patient, doctorId])

  if (!isOpen || !patient) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient.patient_id) return
    setIsSaving(true)
    try {
      const res = await updatePatientProfile(patient.patient_id, {
        name: editForm.name,
        phone: editForm.phone,
        age: editForm.age,
        gender: editForm.gender,
        allergies: editForm.allergies,
        known_diseases: editForm.known_diseases,
        address: editForm.address,
      })
      if (res.success) {
        setSaveSuccess(true)
        setProfile(prev => prev ? { ...prev, ...editForm } : null)
        setTimeout(() => {
          setSaveSuccess(false)
          setActiveTab('summary')
        }, 1500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const patientIdDisplay = profile?.patient_number || patient.patient_number || (patient.patient_id ? `PID-${patient.patient_id.slice(0, 6).toUpperCase()}` : '—')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-12">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-inner shrink-0">
                {patient.patient_name ? patient.patient_name.charAt(0).toUpperCase() : <User size={32} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/20 text-white text-[11px] font-mono font-black rounded-md tracking-wider">
                    {patientIdDisplay}
                  </span>
                  {patient.queue_number && (
                    <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-200 text-[11px] font-black rounded-md border border-emerald-400/30">
                      {patient.queue_number}
                    </span>
                  )}
                  {patient.status && (
                    <span className="px-2 py-0.5 bg-indigo-400/30 text-indigo-100 text-[10px] font-bold rounded-md">
                      {patient.status}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  {profile?.name || patient.patient_name}
                </h2>
                <p className="text-xs text-indigo-100 font-semibold mt-0.5 flex items-center gap-2">
                  <span>{profile?.age || patient.age || '—'} Years</span> • 
                  <span>{profile?.gender || patient.gender || '—'}</span> • 
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> {profile?.phone || patient.phone || 'No phone'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Action Top Button */}
            {onStartConsultation && (
              <button
                onClick={() => {
                  onClose()
                  onStartConsultation(patient)
                }}
                className="px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <Stethoscope size={15} />
                <span>Start Consultation</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 mt-6 pt-3 border-t border-white/15 text-xs font-bold">
            {[
              { id: 'summary', label: 'Clinical Summary' },
              { id: 'history', label: `Visits History (${visits.length})` },
              { id: 'prescriptions', label: 'Prescriptions & Rx' },
              { id: 'edit', label: 'Edit Profile' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-1 transition cursor-pointer relative ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-white font-extrabold'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {loading && (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Fetching verified patient clinical records…</p>
            </div>
          )}

          {/* ─── TAB 1: CLINICAL SUMMARY ─── */}
          {!loading && activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Chief Complaint Banner */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">Chief Complaint / Symptoms</span>
                <p className="text-sm font-bold text-slate-800">
                  {patient.chief_complaint || 'General consultation & clinical evaluation'}
                </p>
              </div>

              {/* Vitals Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Current Vitals & Biometrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Blood Pressure', val: patient.vitals?.bp || '120/80', unit: 'mmHg', color: 'text-rose-600', icon: Heart },
                    { label: 'Pulse Rate', val: patient.vitals?.pulse || '74', unit: 'bpm', color: 'text-emerald-600', icon: Activity },
                    { label: 'Body Temp', val: patient.vitals?.temp || '98.6', unit: '°F', color: 'text-amber-600', icon: Shield },
                    { label: 'Oxygen SpO2', val: patient.vitals?.spo2 || '99%', unit: '', color: 'text-indigo-600', icon: Activity },
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

              {/* Medical Alerts & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-700 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={14} /> Allergies & Drug Reactions
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {profile?.allergies || patient.allergies || 'No known drug allergies reported'}
                  </p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-800 text-xs font-black uppercase tracking-wider">
                    <Shield size={14} /> Known Chronic Conditions
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {profile?.known_diseases || 'No major chronic illnesses recorded'}
                  </p>
                </div>
              </div>

              {/* Patient Contact & Address Details */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2 text-xs">
                <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-wider">Demographics & Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                    <span>{profile?.phone || patient.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Residential Address</span>
                    <span>{profile?.address || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Facility Clinic</span>
                    <span>{hospitalName}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Footer Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                {onStartConsultation && (
                  <button
                    onClick={() => {
                      onClose()
                      onStartConsultation(patient)
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Stethoscope size={14} /> Write Prescription (Rx)
                  </button>
                )}
                {onIssueCertificate && (
                  <button
                    onClick={() => {
                      onClose()
                      onIssueCertificate(patient)
                    }}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText size={14} /> Medical Certificate
                  </button>
                )}
                {onLabAdvice && (
                  <button
                    onClick={() => {
                      onClose()
                      onLabAdvice(patient)
                    }}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    🧪 Lab Advice
                  </button>
                )}
                {onScheduleFollowUp && (
                  <button
                    onClick={() => {
                      onClose()
                      onScheduleFollowUp(patient)
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CalendarClock size={14} /> Schedule Follow-Up
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB 2: VISIT HISTORY ─── */}
          {!loading && activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in">
              {visits.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <Clock size={32} className="text-slate-300 mx-auto" />
                  <h4 className="font-black text-sm text-slate-700">No Past Visits Logged</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    This is the patient's first consultation visit or all prior visits were archived.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit, idx) => (
                    <div
                      key={visit.appointmentId || idx}
                      className="p-5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-xs space-y-3 transition"
                    >
                      <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center">
                            #{visits.length - idx}
                          </span>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{visit.appointmentDate}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{hospitalName}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full capitalize ${
                          visit.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {visit.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported Symptoms</span>
                          <p className="font-bold text-slate-800">{visit.symptoms || 'General OPD'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Doctor Diagnosis</span>
                          <p className="font-bold text-indigo-700">{visit.diagnosis || 'Clinical evaluation completed'}</p>
                        </div>
                      </div>

                      {visit.clinicalNotes && (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Clinical Notes</span>
                          <p className="text-slate-700 italic font-medium">{visit.clinicalNotes}</p>
                        </div>
                      )}

                      {visit.medicines && visit.medicines.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Prescribed Medicines</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visit.medicines.map((m: any, mi: number) => (
                              <div key={mi} className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                                <span className="font-bold text-slate-800">{m.name || m.medicine_name}</span>
                                <span className="text-[10px] font-bold text-indigo-600">{m.dosage}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 3: PRESCRIPTIONS & RX ─── */}
          {!loading && activeTab === 'prescriptions' && (
            <div className="space-y-4 animate-in fade-in">
              {visits.filter(v => (v.medicines && v.medicines.length > 0) || v.diagnosis).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <Pill size={32} className="text-slate-300 mx-auto" />
                  <h4 className="font-black text-sm text-slate-700">No Prior Prescriptions on Record</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Write Prescription" to create the first digital Rx for this patient.
                  </p>
                </div>
              ) : (
                visits
                  .filter(v => (v.medicines && v.medicines.length > 0) || v.diagnosis)
                  .map((v, i) => (
                    <div key={i} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                        <div>
                          <h4 className="font-black text-xs text-slate-900">Rx Date: {v.appointmentDate}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold">Diagnosis: {v.diagnosis || 'Clinical OPD'}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {v.medicines?.length || 0} Medicines
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {v.medicines?.map((med: any, mi: number) => (
                          <div key={mi} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block">{med.name || med.medicine_name}</span>
                              <span className="text-[10px] text-slate-500">{med.instruction || med.instructions || 'After food'}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-indigo-600 block">{med.dosage}</span>
                              <span className="text-[10px] text-slate-400">{med.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {v.advice && (
                        <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                          💡 <strong>Advice:</strong> {v.advice}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* ─── TAB 4: EDIT PROFILE ─── */}
          {!loading && activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in text-xs font-bold">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <Check size={16} className="text-emerald-600" /> Patient details successfully updated in database!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 block">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 block">Age (Years)</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={e => setEditForm(p => ({ ...p, age: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">Allergies / Adverse Drug Reactions</label>
                <input
                  type="text"
                  value={editForm.allergies}
                  onChange={e => setEditForm(p => ({ ...p, allergies: e.target.value }))}
                  placeholder="e.g. Penicillin, Sulfa, Dust"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">Known Chronic Diseases / Medical History</label>
                <input
                  type="text"
                  value={editForm.known_diseases}
                  onChange={e => setEditForm(p => ({ ...p, known_diseases: e.target.value }))}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">Full Address / City</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Street, City, Pin code"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isSaving ? 'Saving…' : <><Check size={14} /> Update Patient Profile</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
