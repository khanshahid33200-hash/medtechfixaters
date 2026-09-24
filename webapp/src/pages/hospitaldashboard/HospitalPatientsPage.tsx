import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Eye,
  CheckCircle2} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface Patient {
  id: string
  name: string
  ageGender: string
  phone: string
  lastVisit: string
  assignedDoctor: string
  department: string
  status: 'active' | 'discharged' | 'follow-up'
  history: string
}

export default function HospitalPatientsPage() {
  const { doctorProfile } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || localStorage.getItem('hospital_id') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const [patients, setPatients] = useState<Patient[]>([])

  useEffect(() => {
    async function loadPatients() {
      if (!currentHospId) return
      try {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('hospital_id', currentHospId)
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const mapped: Patient[] = data.map(p => ({
            id: p.patient_number || `P-${p.id.slice(0, 5)}`,
            name: p.name,
            ageGender: `${p.age || '30'} / ${p.gender || 'Other'}`,
            phone: p.phone,
            lastVisit: 'Recent Visit',
            assignedDoctor: 'Attending Physician',
            department: 'General OPD',
            status: 'active',
            history: p.known_diseases || 'Outpatient Consultation'
          }))
          setPatients(mapped)
        } else {
          setPatients([])
        }
      } catch (e) {
        setPatients([])
      }
    }
    loadPatients()
  }, [currentHospId])

  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    age: '35',
    gender: 'Male',
    department: 'General Medicine',
    doctor: 'Dr. Priya Patel',
    history: 'Initial consultation'
  })

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  )

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    const newP: Patient = {
      id: `P-${Math.floor(10500 + Math.random() * 900)}`,
      name: newPatient.name,
      ageGender: `${newPatient.age} / ${newPatient.gender}`,
      phone: newPatient.phone,
      lastVisit: 'Today',
      assignedDoctor: newPatient.doctor,
      department: newPatient.department,
      status: 'active',
      history: newPatient.history
    }
    setPatients([newP, ...patients])
    setShowAddModal(false)
    setNotice(`✓ Patient "${newP.name}" registered successfully with ID ${newP.id}`)
    setTimeout(() => setNotice(null), 4000)
  }

  return (
    <HospitalDashboardLayout pageTitle="Patients">
      {notice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Search & Actions Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name, ID or Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus size={15} />
            <span>New Patient</span>
          </button>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-5">Patient No & Name</th>
                  <th className="py-3.5 px-4">Demographics</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4">Assigned Doctor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No patients registered in this hospital facility directory yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-5">
                      <span className="text-[10px] font-mono font-bold text-blue-600 block">{p.id}</span>
                      <span className="font-bold text-slate-900 block mt-0.5">{p.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{p.ageGender}</td>
                    <td className="py-3 px-4 text-slate-700">{p.phone}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.lastVisit}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{p.assignedDoctor}</span>
                      <span className="text-[11px] text-slate-400 block">{p.department}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.status === 'follow-up'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 inline-flex items-center gap-1 font-bold"
                      >
                        <Eye size={13} />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedPatient.name}</h3>
                <span className="text-blue-600 font-bold">{selectedPatient.id}</span>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Age & Gender</span>
                  <span className="font-bold text-slate-800">{selectedPatient.ageGender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Contact</span>
                  <span className="font-bold text-slate-800">{selectedPatient.phone}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Doctor & Dept</span>
                <span className="font-bold text-slate-900">{selectedPatient.assignedDoctor}</span>
                <span className="text-slate-500 block text-[11px]">{selectedPatient.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Medical Notes / History</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 mt-1 border border-slate-200/60">
                  {selectedPatient.history}
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Register New Patient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. Meera Joshi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Chief Complaint / Notes</label>
                <textarea
                  value={newPatient.history}
                  onChange={(e) => setNewPatient({ ...newPatient, history: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Save Patient Record
              </button>
            </form>
          </div>
        </div>
      )}
    </HospitalDashboardLayout>
  )
}
