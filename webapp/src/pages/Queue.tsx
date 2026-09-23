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
import PatientConsultationWorkspace, { PatientWorkspaceData } from '../components/PatientConsultationWorkspace'
import { useAuth } from '../context/AuthContext'
import { QueueItem } from '../utils/doctorStore'
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  subscribeToDoctorAppointments,
  type DoctorAppointment,
} from '../lib/doctorAppointments'

// This page's JSX is built around doctorStore's QueueItem shape — kept as
// the display type (only the data source changed, from localStorage to
// Supabase) so the large JSX below didn't need a rewrite. `patient_id` is
// carried alongside for writing real consultations/prescriptions rows.
type DoctorQueueItem = QueueItem & { patient_id: string | null }

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
  const departmentName = doctorProfile?.department_name || doctorProfile?.specialization || 'Clinical OPD'
  const hospitalName = doctorProfile?.hospital_name || 'Hospital Facility'

  const [queueItems, setQueueItems] = useState<DoctorQueueItem[]>([])

  // Patient Details & Full-Window Consultation Workspace State
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<PatientWorkspaceData | null>(null)

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
  }

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

  // Load doctor-specific queue & subscribe to live Supabase updates
  useEffect(() => {
    reloadQueue()
    const unsubscribe = subscribeToDoctorAppointments(doctorId, reloadQueue)
    return unsubscribe
  }, [doctorId])

  const activeDoctorPatient = queueItems.find((q) => q.status === 'With Doctor')

  const handleSkip = async (id: string) => {
    await updateAppointmentStatus(id, 'No Show')
    await reloadQueue()
  }

  return (
    <Layout onResetView={() => setSelectedPatientForDetails(null)}>
      {selectedPatientForDetails ? (
        <PatientConsultationWorkspace
          patient={selectedPatientForDetails}
          doctorId={doctorId}
          hospitalId={hospitalId}
          doctorName={doctorName}
          departmentName={departmentName}
          hospitalName={hospitalName}
          onBack={() => {
            setSelectedPatientForDetails(null)
            reloadQueue()
          }}
          onConsultationCompleted={() => {
            setSelectedPatientForDetails(null)
            reloadQueue()
          }}
        />
      ) : (
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
          </div>

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
                      className="text-2xl font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition flex items-center gap-2"
                    >
                      <span>{activeDoctorPatient.patient_name}</span>
                      <span className="text-xs font-normal text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">Click to Open Consultation</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Phone: {activeDoctorPatient.phone} • Check-in: {activeDoctorPatient.check_in_time}
                      {activeDoctorPatient.symptoms && ` • Symptoms: ${activeDoctorPatient.symptoms}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium">
                      {queueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openPatientDetails(item)}>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
                              <Ticket size={14} /> {item.token_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-bold text-base">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                openPatientDetails(item)
                              }}
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
                              <span className="text-indigo-600 font-semibold text-xs hover:underline">Click to start consultation →</span>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}
