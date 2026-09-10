import { useState, useEffect } from 'react'
import { FileText, Calendar, TrendingUp, Users, Building2, Printer, Pill, Eye, X } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import {
  getDoctorAppointments,
  getDoctorPrescriptions,
  type DoctorAppointment,
  type DoctorPrescription,
} from '../lib/doctorAppointments'

interface ReportRow {
  id: string
  token_number: string
  patient_name: string
  phone: string
  symptoms: string
  status: string
  prescription: DoctorPrescription | null
}

function mapToReportRow(appt: DoctorAppointment, prescriptions: Map<string, DoctorPrescription>): ReportRow {
  return {
    id: appt.id,
    token_number: String(appt.token_number ?? ''),
    patient_name: appt.patient?.name || 'Unnamed Patient',
    phone: appt.patient?.phone || '',
    symptoms: appt.symptoms || '',
    status: appt.status,
    prescription: prescriptions.get(appt.id) || null,
  }
}

export default function Reports() {
  const { doctorProfile } = useAuth()
  const doctorId = doctorProfile?.doctor_id || ''
  const doctorName = doctorProfile?.name || 'Dr. Authorized Doctor'
  const departmentName = doctorProfile?.department_name || 'Cardiology'
  const hospitalName = doctorProfile?.hospital_name || 'Metro Care General Hospital'

  const [queueList, setQueueList] = useState<ReportRow[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null)

  useEffect(() => {
    if (!doctorId) return
    Promise.all([getDoctorAppointments(doctorId), getDoctorPrescriptions(doctorId)]).then(
      ([appointments, prescriptions]) => {
        setQueueList(appointments.map(a => mapToReportRow(a, prescriptions)))
      }
    )
  }, [doctorId])

  // status is passed through raw from public.appointments — must match its
  // CHECK constraint exactly ('Completed' / 'Waiting'), not a lowercase guess.
  const completedCount = queueList.filter((q) => q.status === 'Completed').length
  const waitingCount = queueList.filter((q) => q.status === 'Waiting').length
  const totalCheckins = queueList.length

  const handlePrint = () => {
    window.print()
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="text-blue-600" size={30} /> Prescriptions & Clinical Reports
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {doctorName} • {departmentName} Clinical Archive
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={handlePrint} className="shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <Printer size={18} /> Print Reports Archive
          </Button>
        </div>

        {/* Dynamic Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Total Patient Check-ins</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{totalCheckins}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Scanned via Doctor QR Code</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Completed Prescriptions</p>
                  <p className="text-3xl font-black text-emerald-600 mt-2">{completedCount}</p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">Saved Prescriptions</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Currently Waiting Patients</p>
                  <p className="text-3xl font-black text-amber-600 mt-2">{waitingCount}</p>
                  <p className="text-xs text-amber-700 mt-1 font-medium">In waiting room</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Calendar size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Patient Records Table */}
        <Card className="border border-gray-200">
          <CardHeader title={`Clinical Prescriptions & Patient Archive (${queueList.length} Patients)`} />
          <CardContent className="p-0">
            {queueList.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100">
                  <Building2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Patient Reports Yet</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  When patients check in via <strong>{doctorName}</strong>'s QR code, their symptom reports will be generated here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5">Token</th>
                      <th className="px-6 py-3.5">Patient Details</th>
                      <th className="px-6 py-3.5">Symptoms / Concerns</th>
                      <th className="px-6 py-3.5">Diagnosis / Prescribed Rx</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">View Prescription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium">
                    {queueList.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-blue-700">{q.token_number}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {q.patient_name}
                          <p className="text-xs text-gray-400 font-normal">{q.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 max-w-xs truncate">{q.symptoms || 'Routine Checkup'}</td>
                        <td className="px-6 py-4 text-xs">
                          {q.prescription?.diagnosis ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">
                              🩺 {q.prescription.diagnosis}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pending Diagnosis</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedReport(q)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg border border-blue-200 flex items-center gap-1.5 ml-auto transition"
                          >
                            <Eye size={14} /> View Rx Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Prescription Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                    Rx
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{hospitalName}</h2>
                    <p className="text-xs text-blue-200">Prescription for {selectedReport.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-xs font-bold rounded-xl flex items-center gap-1">
                    <Printer size={14} /> Print
                  </button>
                  <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-white/20 rounded-xl">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{selectedReport.patient_name}</p>
                    <p className="text-gray-600">Phone: {(selectedReport as any).phone || (selectedReport as any).patient_phone || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">{doctorName}</p>
                    <p className="text-gray-500">{departmentName}</p>
                  </div>
                </div>

                {selectedReport.prescription?.diagnosis && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                    🩺 Diagnosis: {selectedReport.prescription.diagnosis}
                  </div>
                )}

                {selectedReport.prescription?.medicines && selectedReport.prescription.medicines.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-gray-900 flex items-center gap-1">
                      <Pill size={14} className="text-blue-600" /> Prescribed Rx Medicines:
                    </p>
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                      {selectedReport.prescription.medicines.map((med, i) => (
                        <div key={i} className="p-2.5 flex justify-between items-center">
                          <span className="font-bold text-gray-900">{med.name}</span>
                          <span className="text-gray-600">{med.dosage} ({med.duration}) — {med.instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.prescription?.clinicalNotes && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                    <p className="font-bold text-gray-700">Doctor Clinical Notes:</p>
                    <p className="text-gray-800 mt-1 whitespace-pre-wrap">{selectedReport.prescription.clinicalNotes}</p>
                  </div>
                )}

                <Button variant="primary" onClick={() => setSelectedReport(null)} className="w-full">
                  Close Window
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
