import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Calendar, Clock, Ticket, Receipt, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, CardContent } from '../components/Card'
import Button from '../components/Button'
import PatientDetailsModal, { PatientModalData } from '../components/PatientDetailsModal'
import { useAuth } from '../context/AuthContext'
import {
  getDoctorAppointments,
  subscribeToDoctorAppointments,
  addWalkInAppointment,
  updateAppointmentStatus,
  type DoctorAppointment
} from '../lib/doctorAppointments'

export default function Appointments() {
  const { doctorProfile } = useAuth()
  const doctorId = doctorProfile?.doctor_id || ''
  const doctorName = doctorProfile?.name || 'Authorized Doctor'
  const hospitalId = doctorProfile?.hospital_id || ''

  const [filterTab, setFilterTab] = useState<'todays' | 'upcoming' | 'completed' | 'cancelled'>('todays')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Patient Details Modal State
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<PatientModalData | null>(null)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)

  const openPatientDetails = (apt: DoctorAppointment) => {
    setSelectedPatientForDetails({
      id: apt.id,
      patient_id: apt.patient?.id || null,
      patient_number: apt.patient?.patient_number || null,
      patient_name: apt.patient?.name || 'Unnamed Patient',
      phone: apt.patient?.phone || '',
      age: apt.patient?.age ?? undefined,
      gender: apt.patient?.gender ?? undefined,
      chief_complaint: apt.symptoms || '',
      allergies: apt.patient?.allergies || '',
      token_number: apt.token_number ?? undefined,
      queue_number: apt.queue_number ?? undefined,
      status: apt.status,
    })
    setShowPatientDetailsModal(true)
  }
  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    phone: '',
    age: 30,
    gender: 'Male',
    appointment_date: new Date().toISOString().split('T')[0],
    department: doctorProfile?.department_name || 'General Medicine',
    symptoms: '',
  })

  const [appointmentsList, setAppointmentsList] = useState<DoctorAppointment[]>([])

  const reloadAppointments = useCallback(async () => {
    if (!doctorId) return
    const appointments = await getDoctorAppointments(doctorId)
    setAppointmentsList(appointments)
  }, [doctorId])

  useEffect(() => {
    reloadAppointments()
    if (!doctorId) return
    const unsubscribe = subscribeToDoctorAppointments(doctorId, reloadAppointments)
    return unsubscribe
  }, [doctorId, reloadAppointments])

  const todayStr = new Date().toISOString().split('T')[0]

  const filteredAppointments = appointmentsList.filter((apt) => {
    if (filterTab === 'todays') return apt.appointment_date === todayStr && (apt.status === 'Waiting' || apt.status === 'In Consultation')
    if (filterTab === 'upcoming') return apt.appointment_date > todayStr && apt.status === 'Waiting'
    if (filterTab === 'completed') return apt.status === 'Completed'
    if (filterTab === 'cancelled') return apt.status === 'Cancelled' || apt.status === 'No Show'
    return true
  })

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingForm.patient_name.trim() || !bookingForm.phone.trim()) {
      alert('Patient name and valid phone number are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await addWalkInAppointment({
        hospitalId,
        doctorId,
        patientName: bookingForm.patient_name.trim(),
        patientPhone: bookingForm.phone.trim(),
        patientAge: Number(bookingForm.age) || 30,
        patientGender: bookingForm.gender,
        symptoms: bookingForm.symptoms.trim() || 'General consultation',
      })

      if (!res.success) {
        throw new Error(res.error || 'Failed to book appointment.')
      }

      await reloadAppointments()
      setShowBookingModal(false)
      setBookingForm({
        patient_name: '',
        phone: '',
        age: 30,
        gender: 'Male',
        appointment_date: todayStr,
        department: doctorProfile?.department_name || 'General Medicine',
        symptoms: '',
      })
    } catch (err: any) {
      alert(err.message || 'Error creating appointment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Appointments Management for {doctorName}</h1>
            <p className="text-gray-600 text-sm mt-1">
              Live queue from Supabase with instant token assignment
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setShowBookingModal(true)} className="shadow-lg shadow-blue-600/20">
            <Plus size={20} />
            New Walk-in Appointment
          </Button>
        </div>

        {/* 4 Tabs: Today's, Upcoming, Completed, Cancelled */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {[
            { id: 'todays', label: "Today's Appointments", count: appointmentsList.filter(a => a.appointment_date === todayStr && (a.status === 'Waiting' || a.status === 'In Consultation')).length },
            { id: 'upcoming', label: 'Upcoming', count: appointmentsList.filter(a => a.appointment_date > todayStr && a.status === 'Waiting').length },
            { id: 'completed', label: 'Completed', count: appointmentsList.filter(a => a.status === 'Completed').length },
            { id: 'cancelled', label: 'Cancelled', count: appointmentsList.filter(a => a.status === 'Cancelled' || a.status === 'No Show').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${filterTab === tab.id ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 font-medium">No appointments found for {doctorName}.</p>
                <p className="text-xs text-gray-400 mt-1">Book an appointment or share your doctor QR code for patient check-in.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((apt) => {
              const patientName = apt.patient?.name || 'Unnamed Patient'
              const patientPhone = apt.patient?.phone || ''
              return (
                <Card key={apt.id} className="hover:shadow-md transition border border-gray-200">
                  <div className="px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Patient Info & Token / Receipt */}
                      <div className="flex items-start gap-4">
                        <div
                          onClick={() => openPatientDetails(apt)}
                          className="w-12 h-12 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-blue-100 flex-shrink-0 cursor-pointer transition"
                        >
                          {patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              onClick={() => openPatientDetails(apt)}
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline text-base cursor-pointer transition"
                            >
                              {patientName}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-200">
                              <Ticket size={12} /> {apt.queue_number || (apt.token_number ? `Token #${apt.token_number}` : 'Token')}
                            </span>
                            {apt.tracking_token && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 font-mono text-xs rounded-lg border border-gray-200">
                                <Receipt size={12} /> {apt.tracking_token}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                            {patientPhone && <span>Phone: {patientPhone}</span>}
                            {patientPhone && <span>•</span>}
                            <span className="flex items-center gap-1"><Clock size={13} /> {apt.appointment_date} {apt.appointment_time ? `(${apt.appointment_time})` : ''}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-3">
                        {apt.status === 'Waiting' && (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-full border border-amber-200 flex items-center gap-1">
                            <Clock size={13} /> Waiting
                          </span>
                        )}
                        {apt.status === 'In Consultation' && (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-200 flex items-center gap-1">
                            <Clock size={13} /> In Consultation
                          </span>
                        )}
                        {apt.status === 'Completed' && (
                          <span className="px-3 py-1 bg-green-50 text-green-700 font-semibold text-xs rounded-full border border-green-200 flex items-center gap-1">
                            <CheckCircle size={13} /> Completed
                          </span>
                        )}
                        {(apt.status === 'Cancelled' || apt.status === 'No Show') && (
                          <span className="px-3 py-1 bg-red-50 text-red-700 font-semibold text-xs rounded-full border border-red-200 flex items-center gap-1">
                            <XCircle size={13} /> {apt.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
                <h2 className="text-lg font-bold">Book Appointment for {doctorName}</h2>
                <button onClick={() => setShowBookingModal(false)} className="p-1 hover:bg-blue-700 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Patient Name *</label>
                  <input
                    type="text"
                    name="patient_name"
                    value={bookingForm.patient_name}
                    onChange={handleBookingChange}
                    placeholder="Enter full patient name"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={bookingForm.phone}
                    onChange={handleBookingChange}
                    placeholder="+91-9876543210"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={bookingForm.department}
                    readOnly
                    className="w-full px-3.5 py-2.5 border border-gray-300 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Appointment Date / Time</label>
                  <input
                    type="text"
                    name="appointment_date"
                    value={bookingForm.appointment_date}
                    onChange={handleBookingChange}
                    placeholder="e.g. Tomorrow at 10:30 AM"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowBookingModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1">
                    Generate Token
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Patient Details Modal */}
        <PatientDetailsModal
          isOpen={showPatientDetailsModal}
          onClose={() => setShowPatientDetailsModal(false)}
          patient={selectedPatientForDetails}
          doctorId={doctorId}
          hospitalName={doctorProfile?.hospital_name || 'Hospital Facility'}
        />
      </div>
    </Layout>
  )
}
