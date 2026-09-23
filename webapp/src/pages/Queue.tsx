import { useState, useEffect } from 'react'
import {
  Play,
  CheckCircle,
  SkipForward,
  RotateCcw,
  Volume2,
  Ticket,
  UserCheck,
  Building2,
  Users,
  FileText,
  Plus,
  Trash2,
  Printer,
  X,
  Activity,
  Pill
} from 'lucide-react'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import PatientDetailsModal, { PatientModalData } from '../components/PatientDetailsModal'
import { useAuth } from '../context/AuthContext'
import { QueueItem, ClinicalPrescription, MedicinePrescription } from '../utils/doctorStore'
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  completeConsultation,
  subscribeToDoctorAppointments,
  type DoctorAppointment,
  type AppointmentStatus,
} from '../lib/doctorAppointments'

// This page's JSX is built around doctorStore's QueueItem shape — kept as
// the display type (only the data source changed, from localStorage to
// Supabase) so the large JSX below didn't need a rewrite. `patient_id` is
// carried alongside for writing real consultations/prescriptions rows.
type DoctorQueueItem = QueueItem & { patient_id: string | null }

// Status strings must match the DB CHECK constraint on public.appointments
// exactly ('Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' |
// 'No Show') — comparing against lowercase/underscore values here matched
// zero real rows, so booked patients never showed up in this queue.
function mapAppointmentToQueueItem(appt: DoctorAppointment): DoctorQueueItem | null {
  let status: DoctorQueueItem['status']
  if (appt.status === 'In Consultation') status = 'With Doctor'
  else if (appt.status === 'Completed') status = 'Completed'
  else if (appt.status === 'Waiting') status = 'Waiting'
  else if (appt.status === 'Cancelled' || appt.status === 'No Show') status = 'Skipped'
  else return null

  return {
    id: appt.id,
    patient_id: appt.patient?.id || null,
    doctor_id: '',
    token_number: String(appt.token_number ?? ''),
    patient_name: appt.patient?.name || 'Unnamed Patient',
    phone: appt.patient?.phone || '',
    age: appt.patient?.age ?? undefined,
    gender: appt.patient?.gender ?? undefined,
    symptoms: appt.symptoms ?? undefined,
    allergies: appt.patient?.allergies ?? undefined,
    status,
    check_in_time: appt.created_at ? new Date(appt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    date: appt.appointment_date,
  }
}

export default function Queue() {
  const { doctorProfile } = useAuth()
  const doctorId = doctorProfile?.doctor_id || ''
  const hospitalId = doctorProfile?.hospital_id || ''
  const doctorName = doctorProfile?.name || 'Dr. Authorized Doctor'
  const departmentName = doctorProfile?.department_name || 'Cardiology'
  const hospitalName = doctorProfile?.hospital_name || 'Metro Care General Hospital'

  const [queueItems, setQueueItems] = useState<DoctorQueueItem[]>([])
  const [announcedToken, setAnnouncedToken] = useState<string | null>(null)

  // Patient Details Modal State
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<PatientModalData | null>(null)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)

  const openPatientDetails = (item: DoctorQueueItem) => {
    setSelectedPatientForDetails({
      id: item.id,
      patient_id: item.patient_id,
      patient_name: item.patient_name,
      phone: item.phone,
      age: item.age,
      gender: item.gender,
      chief_complaint: item.symptoms,
      allergies: item.allergies,
      token_number: item.token_number,
      status: item.status,
    })
    setShowPatientDetailsModal(true)
  }

  // Consultation & Prescription Modal State
  const [activeConsultationPatient, setActiveConsultationPatient] = useState<DoctorQueueItem | null>(null)
  const [prescriptionForm, setPrescriptionForm] = useState<ClinicalPrescription>({
    chief_complaints: '',
    diagnosis: '',
    clinical_notes: '',
    vitals: { bp: '120/80', pulse: '72', temperature: '98.6', weight: '70' },
    medicines: [
      { medicine_name: 'Paracetamol 650mg', dosage: '1 Tablet', frequency: '1-0-1 (Morning & Night)', duration: '5 Days', instructions: 'After meal' }
    ],
    advice: 'Drink warm water, take rest, and avoid cold food.',
    followup_date: 'After 7 Days'
  })

  const reloadQueue = async (): Promise<DoctorQueueItem[]> => {
    if (!doctorId) return []
    const todayStr = new Date().toISOString().split('T')[0]
    const appointments = await getDoctorAppointments(doctorId, { date: todayStr })
    const mapped = appointments
      .map(mapAppointmentToQueueItem)
      .filter((q): q is DoctorQueueItem => q !== null)
    setQueueItems(mapped)
    return mapped
  }

  // Load doctor-specific queue & subscribe to live Supabase updates —
  // replaces the old BroadcastChannel/2s-polling combo (which only synced
  // localStorage across tabs, never reflecting a real booking) with a
  // Realtime subscription scoped to this doctor's own appointments.
  useEffect(() => {
    reloadQueue()
    const unsubscribe = subscribeToDoctorAppointments(doctorId, reloadQueue)
    return unsubscribe
  }, [doctorId])

  const activeDoctorPatient = queueItems.find((q) => q.status === 'With Doctor')
  const waitingPatients = queueItems.filter((q) => q.status === 'Waiting')

  // Action 1: Call Next Patient
  const handleCallNext = async () => {
    if (waitingPatients.length === 0) return
    const nextPatient = waitingPatients[0]

    const updated = queueItems.map((item) => {
      if (item.id === nextPatient.id) return { ...item, status: 'With Doctor' as const }
      if (item.status === 'With Doctor') return { ...item, status: 'Completed' as const }
      return item
    })
    setQueueItems(updated)
    setAnnouncedToken(nextPatient.token_number)

    if (activeDoctorPatient) {
      await updateAppointmentStatus(activeDoctorPatient.id, 'Completed')
    }
    await updateAppointmentStatus(nextPatient.id, 'In Consultation')
  }

  // Open Prescription Editor for Patient
  const handleOpenConsultationModal = (patient: DoctorQueueItem) => {
    setActiveConsultationPatient(patient)
    setPrescriptionForm({
      chief_complaints: patient.symptoms || 'General Checkup & Consultation',
      diagnosis: patient.prescription?.diagnosis || '',
      clinical_notes: patient.prescription?.clinical_notes || '',
      vitals: patient.prescription?.vitals || { bp: '120/80', pulse: '72', temperature: '98.6', weight: '70' },
      medicines: patient.prescription?.medicines && patient.prescription.medicines.length > 0
        ? patient.prescription.medicines
        : [{ medicine_name: 'Paracetamol 650mg', dosage: '1 Tablet', frequency: '1-0-1 (Morning & Night)', duration: '5 Days', instructions: 'After meal' }],
      advice: patient.prescription?.advice || 'Drink warm water and take rest.',
      followup_date: patient.prescription?.followup_date || 'After 7 Days'
    })
  }

  // Handle Prescription Form Changes
  const handlePrescriptionTextChange = (field: keyof ClinicalPrescription, val: any) => {
    setPrescriptionForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleVitalsChange = (vitalKey: string, val: string) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [vitalKey]: val }
    }))
  }

  // Medicine Row Actions
  const handleAddMedicine = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [
        ...(prev.medicines || []),
        { medicine_name: '', dosage: '1 Tablet', frequency: '1-0-1', duration: '5 Days', instructions: 'After meal' }
      ]
    }))
  }

  const handleUpdateMedicine = (index: number, field: keyof MedicinePrescription, val: string) => {
    setPrescriptionForm((prev) => {
      const updatedMeds = [...(prev.medicines || [])]
      updatedMeds[index] = { ...updatedMeds[index], [field]: val }
      return { ...prev, medicines: updatedMeds }
    })
  }

  const handleRemoveMedicine = (index: number) => {
    setPrescriptionForm((prev) => {
      const updatedMeds = (prev.medicines || []).filter((_, i) => i !== index)
      return { ...prev, medicines: updatedMeds }
    })
  }

  // Save Prescription & Complete Consultation — writes real
  // consultations/prescriptions rows and marks the appointment completed,
  // replacing the old localStorage-only savePrescriptionForDoctor.
  const handleSavePrescription = async () => {
    if (!activeConsultationPatient || !hospitalId || !doctorId) return

    setQueueItems(prev => prev.map(q => (q.id === activeConsultationPatient.id ? { ...q, status: 'Completed' as const } : q)))
    const closingPatient = activeConsultationPatient
    setActiveConsultationPatient(null)

    const result = await completeConsultation({
      hospitalId,
      appointmentId: closingPatient.id,
      doctorId,
      patientId: closingPatient.patient_id,
      diagnosis: prescriptionForm.diagnosis,
      clinicalNotes: prescriptionForm.clinical_notes,
      vitals: prescriptionForm.vitals as Record<string, string> | undefined,
      medicines: (prescriptionForm.medicines || []).map(m => ({
        name: m.medicine_name,
        dosage: m.dosage,
        duration: m.duration,
        instruction: m.instructions || '',
      })),
      advice: prescriptionForm.advice,
      followUp: prescriptionForm.followup_date,
    })

    if (!result.success) {
      console.warn('completeConsultation failed:', result.error)
    }
    await reloadQueue()
  }

  const handlePrintPrescription = () => {
    window.print()
  }

  // Quick Actions
  const handleStartConsultation = async (id: string) => {
    await updateAppointmentStatus(id, 'In Consultation')
    const updated = await reloadQueue()
    const item = updated.find((q) => q.id === id)
    if (item) {
      setAnnouncedToken(item.token_number)
      handleOpenConsultationModal(item)
    }
  }

  const handleSkip = async (id: string) => {
    await updateAppointmentStatus(id, 'No Show')
    await reloadQueue()
  }

  const handleRecall = async (id: string) => {
    await updateAppointmentStatus(id, 'Waiting')
    const updated = await reloadQueue()
    const item = updated.find((q) => q.id === id)
    if (item) setAnnouncedToken(item.token_number)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="text-blue-600" size={30} /> Live Patient Queue & Consultations
            </h1>
            <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
              <span>{doctorName} • {departmentName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-time Sync Active
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCallNext}
              disabled={waitingPatients.length === 0}
              className="shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Volume2 size={20} />
              Call Next Patient
            </Button>
          </div>
        </div>

        {/* Announcer Alert */}
        {announcedToken && (
          <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between border border-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">
                <Volume2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-blue-200 tracking-wider">Audio Announcement</p>
                <p className="font-bold text-lg">{announcedToken} — Called to Consultation Room for {doctorName}</p>
              </div>
            </div>
            <button
              onClick={() => setAnnouncedToken(null)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Currently With Doctor Banner */}
        {activeDoctorPatient && (
          <Card className="border-2 border-emerald-500 bg-emerald-50/50">
            <CardHeader className="bg-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck size={22} />
                  <h2 className="text-xl font-bold">Patient Currently With {doctorName}</h2>
                </div>
                <span className="text-2xl font-black bg-white/20 px-3 py-1 rounded-xl">
                  {activeDoctorPatient.token_number}
                </span>
              </div>
            </CardHeader>
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3
                    onClick={() => openPatientDetails(activeDoctorPatient)}
                    className="text-2xl font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition"
                  >
                    {activeDoctorPatient.patient_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Phone: {activeDoctorPatient.phone} • Check-in: {activeDoctorPatient.check_in_time}
                    {activeDoctorPatient.symptoms && ` • Symptoms: ${activeDoctorPatient.symptoms}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="md" onClick={() => handleOpenConsultationModal(activeDoctorPatient)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2">
                    <FileText size={16} /> Write Prescription & Diagnosis
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => handleSkip(activeDoctorPatient.id)}>
                    <SkipForward size={16} /> Skip Patient
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Table */}
        <Card>
          <CardHeader title={`Doctor Queue & Prescription Records (${queueItems.length} Patients)`} />
          <CardContent className="p-0">
            {queueItems.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100">
                  <Building2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Patients in Queue Yet</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  When patients scan <strong>{doctorName}</strong>'s QR code at the kiosk or on their phone, their live queue tokens will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5">Token</th>
                      <th className="px-6 py-3.5">Patient Info</th>
                      <th className="px-6 py-3.5">Symptoms / Concerns</th>
                      <th className="px-6 py-3.5">Diagnosis / Rx Summary</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Doctor Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium">
                    {queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
                            <Ticket size={14} /> {item.token_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-bold text-base">
                          <button
                            type="button"
                            onClick={() => openPatientDetails(item)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="group-hover:text-blue-600 group-hover:underline block transition">
                              {item.patient_name}
                            </span>
                            <p className="text-xs text-gray-400 font-normal">{item.phone}</p>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-xs max-w-xs truncate">
                          {item.symptoms || 'General Checkup'}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {item.prescription?.diagnosis ? (
                             <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                               {item.prescription.diagnosis}
                             </span>
                          ) : (
                            <span className="text-gray-400 italic">No Diagnosis Yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.status === 'With Doctor' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                              With Doctor
                            </span>
                          )}
                          {item.status === 'Waiting' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300">
                              Waiting
                            </span>
                          )}
                          {item.status === 'Completed' && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-full border border-gray-300">
                              Completed
                            </span>
                          )}
                          {item.status === 'Skipped' && (
                            <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-300">
                              Skipped
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenConsultationModal(item)}
                              title="Write / Edit Prescription & Clinical Notes"
                              className="px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                            >
                              <FileText size={12} /> Rx Notes
                            </button>
                            {item.status === 'Waiting' && (
                              <button
                                onClick={() => handleStartConsultation(item.id)}
                                title="Start Consultation"
                                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <Play size={12} /> Start
                              </button>
                            )}
                            {(item.status === 'Skipped' || item.status === 'Completed') && (
                              <button
                                onClick={() => handleRecall(item.id)}
                                title="Recall Patient"
                                className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <RotateCcw size={12} /> Recall
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Full Clinical Consultation & Prescription Modal */}
        {activeConsultationPatient && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                    Rx
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-wide">Doctor Clinical Workspace & Prescription</h2>
                    <p className="text-xs text-blue-200">{hospitalName} • {departmentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintPrescription} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                    <Printer size={15} /> Print Rx Card
                  </button>
                  <button onClick={() => setActiveConsultationPatient(null)} className="p-1.5 hover:bg-white/20 text-blue-200 hover:text-white rounded-xl transition">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* 1. Patient Profile Summary Header Card */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-gray-900">{activeConsultationPatient.patient_name}</h3>
                      <span className="px-2.5 py-0.5 bg-blue-600 text-white font-bold text-xs rounded-full">
                        {activeConsultationPatient.token_number}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Phone: <strong>{activeConsultationPatient.phone}</strong> • Age: <strong>{activeConsultationPatient.age || '32'} Yrs</strong> • Gender: <strong>{activeConsultationPatient.gender || 'M'}</strong>
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-blue-100">
                    <p className="font-bold text-blue-700">QR Check-in Symptoms:</p>
                    <p className="italic text-gray-800">{activeConsultationPatient.symptoms || 'General Checkup'}</p>
                  </div>
                </div>

                {/* 2. Patient Vitals */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={16} className="text-rose-500" /> Patient Vitals
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Blood Pressure (BP)</label>
                      <input
                        type="text"
                        value={prescriptionForm.vitals?.bp || ''}
                        onChange={(e) => handleVitalsChange('bp', e.target.value)}
                        placeholder="120/80 mmHg"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Pulse Rate</label>
                      <input
                        type="text"
                        value={prescriptionForm.vitals?.pulse || ''}
                        onChange={(e) => handleVitalsChange('pulse', e.target.value)}
                        placeholder="72 bpm"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Temperature</label>
                      <input
                        type="text"
                        value={prescriptionForm.vitals?.temperature || ''}
                        onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                        placeholder="98.6 °F"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Body Weight</label>
                      <input
                        type="text"
                        value={prescriptionForm.vitals?.weight || ''}
                        onChange={(e) => handleVitalsChange('weight', e.target.value)}
                        placeholder="70 kg"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Chief Symptoms & Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Chief Symptoms / Patient Complaints *
                    </label>
                    <textarea
                      rows={2}
                      value={prescriptionForm.chief_complaints || ''}
                      onChange={(e) => handlePrescriptionTextChange('chief_complaints', e.target.value)}
                      placeholder="e.g. Chest tightness, fever for 3 days, body pain..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Doctor Diagnosis / Disease Name *
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.diagnosis || ''}
                      onChange={(e) => handlePrescriptionTextChange('diagnosis', e.target.value)}
                      placeholder="e.g. Acute Bronchitis, Essential Hypertension..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 4. Doctor Freeform Examination Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Doctor Clinical Notes & Clinical Examination (Type Anything Here)
                  </label>
                  <textarea
                    rows={3}
                    value={prescriptionForm.clinical_notes || ''}
                    onChange={(e) => handlePrescriptionTextChange('clinical_notes', e.target.value)}
                    placeholder="Write detailed clinical notes, test recommendations, lab investigation findings, or specific medical observations..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 5. Prescribed Medicines (Rx Table) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <Pill className="text-blue-600" size={18} /> Prescribed Medicines & Dosage (Rx)
                    </h4>
                    <Button variant="secondary" size="sm" onClick={handleAddMedicine} className="text-xs font-bold flex items-center gap-1">
                      <Plus size={14} /> Add Medicine
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {prescriptionForm.medicines?.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl items-center">
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                            value={med.medicine_name}
                            onChange={(e) => handleUpdateMedicine(idx, 'medicine_name', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Dosage (1 Tab)"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Frequency (1-0-1 After Meal)"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Duration (5 Days)"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <button
                            onClick={() => handleRemoveMedicine(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. General Advice & Follow-up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      General Advice & Instructions
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.advice || ''}
                      onChange={(e) => handlePrescriptionTextChange('advice', e.target.value)}
                      placeholder="e.g. Avoid cold drinks, take 8 hours of rest..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Follow-up Date / Review
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.followup_date || ''}
                      onChange={(e) => handlePrescriptionTextChange('followup_date', e.target.value)}
                      placeholder="e.g. After 7 Days or Next Monday"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button variant="secondary" onClick={() => setActiveConsultationPatient(null)}>
                  Cancel
                </Button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button variant="primary" onClick={handleSavePrescription} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex-1 sm:flex-none">
                    <CheckCircle size={18} /> Save & Complete Consultation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Details Modal */}
        <PatientDetailsModal
          isOpen={showPatientDetailsModal}
          onClose={() => setShowPatientDetailsModal(false)}
          patient={selectedPatientForDetails}
          doctorId={doctorId}
          hospitalName={hospitalName}
          onStartConsultation={(p) => {
            const match = queueItems.find(q => q.id === p.id)
            if (match) handleOpenConsultationModal(match)
          }}
        />
      </div>
    </Layout>
  )
}
