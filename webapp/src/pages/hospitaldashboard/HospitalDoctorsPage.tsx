import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  Search,
  Plus,
  Shield,
  Phone,
  Mail,
  Ban,
  CheckCircle2,
  Calendar,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Copy,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
  Key,
  Building2,
  UserCheck,
  DollarSign,
  DoorOpen,
  Users,
  ArrowRightLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logActivity } from '../../services/auditLogService'

interface Doctor {
  id: string
  name: string
  docId: string
  avatar: string
  deptId: string
  dept: string
  specialization: string
  phone: string
  email: string
  fee: number
  room: string
  dailyLimit: number
  availability: string
  status: 'active' | 'inactive' | 'blocked'
}

interface ActiveDepartment {
  id: string
  name: string
  is_active: boolean
}

interface CreatedCredentials {
  name: string
  docId: string
  email: string
  password: string
  role: string
  dept: string
  specialization: string
}

export default function HospitalDoctorsPage() {
  const { registerUserInSupabase, doctorProfile } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || localStorage.getItem('hospital_id') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDocDetails, setSelectedDocDetails] = useState<Doctor | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ doc: Doctor; action: 'block' | 'unblock' | 'deactivate' | 'activate' } | null>(null)
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<CreatedCredentials | null>(null)

  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [activeDepartments, setActiveDepartments] = useState<ActiveDepartment[]>([])

  // Reassignment state in details modal
  const [reassignDeptId, setReassignDeptId] = useState<string>('')
  const [isReassigning, setIsReassigning] = useState(false)
  const [reassignNotice, setReassignNotice] = useState<string | null>(null)

  // 1. Load Live Departments from Supabase
  const loadDepartments = useCallback(async () => {
    if (!currentHospId) return
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_active')
        .eq('hospital_id', currentHospId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!error && data) {
        setActiveDepartments(data)
      } else {
        setActiveDepartments([])
      }
    } catch (e) {
      console.warn('Failed to load departments from Supabase:', e)
      setActiveDepartments([])
    }
  }, [currentHospId])

  // 2. Load Doctors from Supabase
  const loadDocs = useCallback(async () => {
    if (!currentHospId) return
    setIsLoading(true)
    try {
      // 1. Fetch from profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, department_id, department, specialization, is_active, doctor_code, account_status')
        .eq('hospital_id', currentHospId)
        .eq('role', 'doctor')

      // 2. Fetch from doctor_details for consultation fee & room
      const { data: detailsData } = await supabase
        .from('doctor_details')
        .select('id, consultation_fee, room_number, daily_patient_limit, qualification, availability_status, department_id')
        .eq('hospital_id', currentHospId)

      const detailsMap = new Map((detailsData || []).map((d) => [d.id, d]))

      if (profilesData && profilesData.length > 0) {
        const mapped: Doctor[] = profilesData.map((d, idx) => {
          const detail = detailsMap.get(d.id)
          return {
            id: d.id,
            name: d.full_name || 'Doctor Specialist',
            docId: d.doctor_code || `DOC-${String(idx + 1).padStart(3, '0')}`,
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
            deptId: d.department_id || detail?.department_id || '',
            dept: d.department || 'General Medicine',
            specialization: d.specialization || detail?.qualification || 'Consultant Specialist',
            phone: '+91 98765 00000',
            email: d.email,
            fee: detail?.consultation_fee ? Number(detail.consultation_fee) : 500,
            room: detail?.room_number || 'OPD Room 101',
            dailyLimit: detail?.daily_patient_limit || 30,
            availability: 'Mon - Fri (09:00 AM - 02:00 PM)',
            status: d.account_status === 'blocked' ? 'blocked' : d.is_active ? 'active' : 'inactive',
          }
        })
        setDoctors(mapped)
      } else {
        setDoctors([])
      }
    } catch (e) {
      console.warn('Failed to load doctors:', e)
      setDoctors([])
    } finally {
      setIsLoading(false)
    }
  }, [currentHospId])

  useEffect(() => {
    loadDepartments()
    loadDocs()
  }, [loadDepartments, loadDocs])

  // Helper to generate a unique doctor code
  const getNextDocCode = () => {
    const existingNums = doctors
      .map((d) => {
        const match = d.docId.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter((n) => !isNaN(n))

    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 101
    return `DOC-${nextNum}`
  }

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    docCode: '',
    phone: '',
    deptId: '',
    dept: '',
    specialization: 'Consultant Specialist',
    room: 'Room 101',
    limit: 30,
    fee: 500,
    availability: 'Mon - Fri (09:00 AM - 02:00 PM)',
  })

  // When opening add modal, prepopulate with fresh docCode and first active department
  const handleOpenAddModal = () => {
    setFormError(null)
    const firstDept = activeDepartments[0]
    setNewDoctor({
      name: '',
      email: '',
      password: 'Password123!',
      docCode: getNextDocCode(),
      phone: '',
      deptId: firstDept ? firstDept.id : '',
      dept: firstDept ? firstDept.name : '',
      specialization: 'Consultant Specialist',
      room: 'Room 101',
      limit: 30,
      fee: 500,
      availability: 'Mon - Fri (09:00 AM - 02:00 PM)',
    })
    setShowAddModal(true)
  }

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewDoctor((prev) => ({ ...prev, password: pass }))
  }

  const filtered = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.docId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept =
      deptFilter === 'All' || d.dept === deptFilter || d.deptId === deptFilter
    return matchesSearch && matchesDept
  })

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const finalDocCode = newDoctor.docCode.trim().toUpperCase() || getNextDocCode()
    const finalEmail = newDoctor.email.trim().toLowerCase()
    const finalPass = newDoctor.password.trim()

    if (!finalEmail || !finalPass) {
      setFormError('Email and password are required.')
      setIsSubmitting(false)
      return
    }

    if (finalPass.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      setIsSubmitting(false)
      return
    }

    // Validate selected department
    const selectedDept = activeDepartments.find((d) => d.id === newDoctor.deptId)
    if (!selectedDept) {
      setFormError('Please select a valid active department from your hospital.')
      setIsSubmitting(false)
      return
    }

    try {
      await registerUserInSupabase(finalEmail, finalPass, {
        role: 'doctor',
        name: newDoctor.name.trim(),
        doctor_code: finalDocCode,
        hospital_id: currentHospId,
        department_id: selectedDept.id,
        dept: selectedDept.name,
        specialization: newDoctor.specialization.trim(),
        room: newDoctor.room.trim(),
        limit: Number(newDoctor.limit) || 30,
        fee: Number(newDoctor.fee) || 500,
      })

      await logActivity({
        category: 'Doctors',
        action: 'Doctor Created & Onboarded',
        targetType: 'profile',
        targetLabel: newDoctor.name,
        metadata: {
          doctor_code: finalDocCode,
          email: finalEmail,
          department_id: selectedDept.id,
          department: selectedDept.name,
          hospital_id: currentHospId,
        },
      })

      // Show the credentials popup
      setCreatedCredentialsModal({
        name: newDoctor.name.trim(),
        docId: finalDocCode,
        email: finalEmail,
        password: finalPass,
        role: 'Doctor',
        dept: selectedDept.name,
        specialization: newDoctor.specialization,
      })

      setShowAddModal(false)
      setNotice(`✓ Doctor "${newDoctor.name}" successfully created with ID ${finalDocCode} in ${selectedDept.name}!`)
      await loadDocs()
      setTimeout(() => setNotice(null), 4000)
    } catch (err: any) {
      console.error('Doctor registration error:', err)
      setFormError(err.message || 'Failed to create doctor account. Please verify the hospital connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Doctor Reassignment Handler
  const handleReassignDepartment = async () => {
    if (!selectedDocDetails || !reassignDeptId) return
    const targetDept = activeDepartments.find((d) => d.id === reassignDeptId)
    if (!targetDept) {
      setReassignNotice('❌ Please select a valid active department.')
      return
    }

    setIsReassigning(true)
    setReassignNotice(null)
    try {
      // 1. Update profiles table
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          department_id: targetDept.id,
          department: targetDept.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDocDetails.id)
        .eq('hospital_id', currentHospId)

      if (profErr) throw profErr

      // 2. Update doctor_details table
      const { error: docDetErr } = await supabase
        .from('doctor_details')
        .update({
          department_id: targetDept.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDocDetails.id)
        .eq('hospital_id', currentHospId)

      if (docDetErr) console.warn('doctor_details update notice:', docDetErr)

      await logActivity({
        category: 'Doctors',
        action: 'Doctor Department Reassigned',
        targetType: 'profile',
        targetLabel: selectedDocDetails.name,
        metadata: {
          doctor_id: selectedDocDetails.id,
          doctor_code: selectedDocDetails.docId,
          hospital_id: currentHospId,
          old_department: selectedDocDetails.dept,
          new_department_id: targetDept.id,
          new_department: targetDept.name,
        },
      })

      setReassignNotice(`✓ Reassigned to ${targetDept.name}!`)
      setSelectedDocDetails({
        ...selectedDocDetails,
        deptId: targetDept.id,
        dept: targetDept.name,
      })

      setNotice(`✓ ${selectedDocDetails.name} reassigned to ${targetDept.name}`)
      await loadDocs()
      setTimeout(() => {
        setReassignNotice(null)
        setNotice(null)
      }, 3000)
    } catch (err: any) {
      console.error('Department reassignment error:', err)
      setReassignNotice(`❌ Failed: ${err.message}`)
    } finally {
      setIsReassigning(false)
    }
  }

  const handleApplySecurityAction = async () => {
    if (!confirmModal) return
    const { doc, action } = confirmModal
    setConfirmModal(null)

    try {
      if (action === 'block' || action === 'unblock') {
        const nextStatus = action === 'block' ? 'blocked' : 'active'
        const nextActive = action === 'unblock'

        await supabase
          .from('profiles')
          .update({
            account_status: nextStatus,
            is_active: nextActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', doc.id)
          .eq('hospital_id', currentHospId)

        await supabase
          .from('doctor_details')
          .update({
            is_active: nextActive,
            availability_status: nextActive ? 'active' : 'offline',
            updated_at: new Date().toISOString(),
          })
          .eq('id', doc.id)
          .eq('hospital_id', currentHospId)

        await logActivity({
          category: 'Doctors',
          action: `Doctor Account ${action.toUpperCase()}`,
          targetType: 'profile',
          targetLabel: doc.name,
          metadata: { doctor_id: doc.id, doctor_code: doc.docId, status: nextStatus },
        })

        setNotice(`✓ Doctor ${doc.name} account has been ${action.toUpperCase()}ED`)
      } else if (action === 'deactivate' || action === 'activate') {
        const nextActive = action === 'activate'

        await supabase
          .from('profiles')
          .update({
            is_active: nextActive,
            account_status: nextActive ? 'active' : 'suspended',
            updated_at: new Date().toISOString(),
          })
          .eq('id', doc.id)
          .eq('hospital_id', currentHospId)

        await supabase
          .from('doctor_details')
          .update({
            is_active: nextActive,
            availability_status: nextActive ? 'active' : 'offline',
            updated_at: new Date().toISOString(),
          })
          .eq('id', doc.id)
          .eq('hospital_id', currentHospId)

        await logActivity({
          category: 'Doctors',
          action: `Doctor ${action.toUpperCase()}`,
          targetType: 'profile',
          targetLabel: doc.name,
          metadata: { doctor_id: doc.id, doctor_code: doc.docId, is_active: nextActive },
        })

        setNotice(`✓ Doctor ${doc.name} is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}`)
      }

      await loadDocs()
      setTimeout(() => setNotice(null), 3000)
    } catch (e: any) {
      console.error('Security action failed:', e)
      setNotice(`❌ Action failed: ${e.message}`)
      setTimeout(() => setNotice(null), 4000)
    }
  }

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  return (
    <HospitalDashboardLayout pageTitle="Medical Practitioners">
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 right-6 z-50 px-4 py-3 bg-slate-900/90 backdrop-blur-md text-white border border-emerald-500/40 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name, Doctor ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Department Filter (Live from Supabase) */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Departments</option>
              {activeDepartments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                loadDepartments()
                loadDocs()
              }}
              disabled={isLoading}
              title="Refresh doctor list"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs transition"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition shrink-0"
            >
              <Plus size={15} />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>

        {/* Doctors Grid */}
        {isLoading && doctors.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading registered doctors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Stethoscope size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {searchTerm || deptFilter !== 'All' ? 'No Matching Doctors Found' : 'No Doctors Registered Yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || deptFilter !== 'All'
                ? 'Try adjusting your search query or department filter.'
                : 'Click "Add Doctor" to onboard medical practitioners under your clinical departments.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              + Onboard Doctor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  doc.status === 'blocked'
                    ? 'border-rose-300 bg-rose-50/20'
                    : doc.status === 'inactive'
                    ? 'border-slate-200 opacity-75'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold">
                        <Stethoscope size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{doc.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-blue-50 text-blue-700 border border-blue-200/60">
                            {doc.docId}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : doc.status === 'blocked'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 py-3 border-t border-b border-slate-100 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-bold text-slate-900">{doc.dept}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Specialization:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{doc.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Login Email:</span>
                      <span className="font-mono text-slate-800 truncate max-w-[170px] text-[11px]">{doc.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Room / Fee:</span>
                      <span className="font-semibold text-slate-900">
                        {doc.room} · <strong className="text-emerald-600 font-bold">₹{doc.fee}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDocDetails(doc)
                        setReassignDeptId(doc.deptId || '')
                        setReassignNotice(null)
                      }}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye size={13} />
                      <span>View & Reassign</span>
                    </button>
                    <button
                      onClick={() =>
                        handleCopyText(
                          `${doc.name}\nDoctor ID: ${doc.docId}\nDepartment: ${doc.dept}\nEmail: ${doc.email}\nPortal: ${window.location.origin}/login`,
                          `card-${doc.id}`
                        )
                      }
                      title="Copy Login Details"
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs transition"
                    >
                      {copiedKey === `card-${doc.id}` ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {doc.status === 'blocked' ? (
                      <button
                        onClick={() => setConfirmModal({ doc, action: 'unblock' })}
                        className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition"
                      >
                        Unblock Doctor
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmModal({ doc, action: 'block' })}
                        className="flex-1 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition"
                      >
                        Block Doctor
                      </button>
                    )}

                    {doc.status === 'active' ? (
                      <button
                        onClick={() => setConfirmModal({ doc, action: 'deactivate' })}
                        className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                      >
                        Deactivate
                      </button>
                    ) : doc.status === 'inactive' ? (
                      <button
                        onClick={() => setConfirmModal({ doc, action: 'activate' })}
                        className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold"
                      >
                        Activate
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Confirm {confirmModal.action.toUpperCase()} Action
            </h3>
            <p className="text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to {confirmModal.action} <strong>{confirmModal.doc.name}</strong>?
              {confirmModal.action === 'block' && ' The doctor will lose dashboard access and disappear from public QR booking.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySecurityAction}
                className={`flex-1 py-2.5 rounded-xl font-bold text-white ${
                  confirmModal.action === 'block' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile View & Reassign Modal */}
      {selectedDocDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedDocDetails.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">{selectedDocDetails.docId}</span>
                </div>
              </div>
              <button onClick={() => setSelectedDocDetails(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Doctor ID (Login Code):</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-lg">
                  {selectedDocDetails.docId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Login Email:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDocDetails.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Current Department:</span>
                <span className="font-bold text-slate-800">{selectedDocDetails.dept}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Specialization:</span>
                <span className="font-semibold text-slate-700">{selectedDocDetails.specialization}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">OPD Room:</span>
                <span className="font-bold text-slate-800">{selectedDocDetails.room}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Consultation Fee:</span>
                <span className="font-bold text-emerald-600">₹{selectedDocDetails.fee}</span>
              </div>
            </div>

            {/* Department Reassignment Section */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <ArrowRightLeft size={14} className="text-blue-600" />
                <span>Reassign Department</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Change this doctor's assigned department. Existing appointments and history remain linked.
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={reassignDeptId}
                  onChange={(e) => setReassignDeptId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="">Select New Department...</option>
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleReassignDepartment}
                  disabled={isReassigning || !reassignDeptId || reassignDeptId === selectedDocDetails.deptId}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  {isReassigning ? 'Saving...' : 'Reassign'}
                </button>
              </div>

              {reassignNotice && (
                <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                  {reassignNotice}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDocDetails(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD DOCTOR MODAL ─── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Onboard Medical Specialist</h3>
                    <p className="text-[11px] text-slate-400">Create practitioner profile & dashboard login credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <p className="font-bold">Account Creation Notice</p>
                    <p className="text-[11px] mt-0.5 text-rose-600">{formError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateDoctor} className="space-y-3.5">
                {/* Name & Doctor Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Doctor Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Khanna"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Doctor ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DOC-101"
                      value={newDoctor.docCode}
                      onChange={(e) => setNewDoctor({ ...newDoctor, docCode: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono font-bold uppercase text-blue-700"
                    />
                  </div>
                </div>

                {/* Login Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Login Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="doctor@hospital.com"
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Initial Password <span className="text-rose-500">*</span></label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles size={11} /> Auto
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newDoctor.password}
                        onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                        className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Department & Specialization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    {activeDepartments.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1.5">
                        <p className="font-bold flex items-center gap-1">
                          <AlertTriangle size={13} className="text-amber-600" />
                          No active departments found
                        </p>
                        <p className="text-slate-600">Please create a clinical department before onboarding doctors.</p>
                        <Link
                          to="/hospitaldashboard/departments"
                          className="inline-block px-3 py-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                        >
                          + Create Department
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={newDoctor.deptId}
                        onChange={(e) => {
                          const selectedId = e.target.value
                          const found = activeDepartments.find((d) => d.id === selectedId)
                          setNewDoctor({
                            ...newDoctor,
                            deptId: selectedId,
                            dept: found?.name || '',
                          })
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                      >
                        {activeDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Specialization / Degree</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Specialist (MD, DM)"
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Room & Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Consultation Room</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 204, OPD Wing B"
                      value={newDoctor.room}
                      onChange={(e) => setNewDoctor({ ...newDoctor, room: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={newDoctor.fee}
                      onChange={(e) => setNewDoctor({ ...newDoctor, fee: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || activeDepartments.length === 0}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Onboarding Practitioner...</span>
                      </>
                    ) : (
                      <span>Complete Onboarding</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CREATED CREDENTIALS SUCCESS POPUP ─── */}
      <AnimatePresence>
        {createdCredentialsModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Doctor Account Ready!</h3>
                  <p className="text-[11px] text-slate-400">Share these login credentials with the practitioner</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Name:</span>
                  <span className="font-bold text-slate-900 font-sans">{createdCredentialsModal.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Doctor ID:</span>
                  <span className="font-bold text-blue-700">{createdCredentialsModal.docId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Department:</span>
                  <span className="font-bold text-slate-800 font-sans">{createdCredentialsModal.dept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Email:</span>
                  <span className="font-bold text-slate-900">{createdCredentialsModal.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Password:</span>
                  <span className="font-bold text-emerald-600">{createdCredentialsModal.password}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleCopyText(
                      `🏥 Clinic OS — Doctor Login Credentials\n\nPractitioner: ${createdCredentialsModal.name}\nDoctor ID: ${createdCredentialsModal.docId}\nDepartment: ${createdCredentialsModal.dept}\nLogin Email: ${createdCredentialsModal.email}\nInitial Password: ${createdCredentialsModal.password}\n\nLogin URL: ${window.location.origin}/login/doctordashboard`,
                      'modal-creds'
                    )
                  }
                  className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedKey === 'modal-creds' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === 'modal-creds' ? 'Copied!' : 'Copy Credentials'}</span>
                </button>
                <button
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HospitalDashboardLayout>
  )
}
