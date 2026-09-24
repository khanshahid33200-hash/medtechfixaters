import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logActivity } from '../../services/auditLogService'

interface DepartmentDoctor {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface Department {
  id: string
  name: string
  description: string
  avgWaitMins: number
  doctorsCount: number
  assignedDoctors: DepartmentDoctor[]
  status: 'active' | 'inactive'
  createdAt: string
}

export default function HospitalDepartmentsPage() {
  const { doctorProfile } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || localStorage.getItem('hospital_id') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null)

  const [departments, setDepartments] = useState<Department[]>([])

  const loadDepartments = useCallback(async () => {
    if (!currentHospId) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      // 1. Fetch departments for the current hospital from Supabase
      const { data: deptsData, error: deptsErr } = await supabase
        .from('departments')
        .select('*')
        .eq('hospital_id', currentHospId)
        .order('created_at', { ascending: false })

      if (deptsErr) throw deptsErr

      // 2. Fetch doctors for the current hospital to compute real dynamic associations
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, doctor_code, department_id, department, is_active')
        .eq('hospital_id', currentHospId)
        .eq('role', 'doctor')

      const doctorsList = profilesData || []

      if (deptsData && deptsData.length > 0) {
        const mapped: Department[] = deptsData.map((d) => {
          // Match doctors assigned to this department by ID or by name
          const assigned: DepartmentDoctor[] = doctorsList
            .filter((p) => p.department_id === d.id || p.department === d.name)
            .map((p) => ({
              id: p.id,
              name: p.full_name || 'Dr. Specialist',
              code: p.doctor_code || `DOC-${p.id.slice(0, 4)}`,
              isActive: p.is_active !== false,
            }))

          return {
            id: d.id,
            name: d.name,
            description: d.description || 'Clinical Outpatient Department',
            avgWaitMins: d.avg_wait_mins || 15,
            doctorsCount: assigned.length,
            assignedDoctors: assigned,
            status: d.is_active ? 'active' : 'inactive',
            createdAt: d.created_at,
          }
        })
        setDepartments(mapped)
      } else {
        setDepartments([])
      }
    } catch (err: any) {
      console.warn('Failed to load departments from Supabase:', err)
      setErrorMessage(err.message || 'Could not load departments from Supabase.')
      setDepartments([])
    } finally {
      setIsLoading(false)
    }
  }, [currentHospId])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  // Form State for creating department
  const [newDept, setNewDept] = useState({
    name: '',
    description: '',
    avgWaitMins: 15,
    status: 'active' as 'active' | 'inactive',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleOpenAddModal = () => {
    setFormError(null)
    setNewDept({
      name: '',
      description: '',
      avgWaitMins: 15,
      status: 'active',
    })
    setShowAddModal(true)
  }

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const cleanName = newDept.name.trim()
    if (!cleanName) {
      setFormError('Department name is required.')
      return
    }

    if (!currentHospId) {
      setFormError('Authenticated hospital session not found. Please re-login.')
      return
    }

    // Check for duplicate department name within current hospital
    const isDuplicate = departments.some(
      (d) => d.name.toLowerCase() === cleanName.toLowerCase()
    )
    if (isDuplicate) {
      setFormError(`A department named "${cleanName}" already exists in your hospital.`)
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([
          {
            hospital_id: currentHospId,
            name: cleanName,
            description: newDept.description.trim() || null,
            avg_wait_mins: Number(newDept.avgWaitMins) || 15,
            is_active: newDept.status === 'active',
          },
        ])
        .select()
        .single()

      if (error) throw error

      await logActivity({
        category: 'Departments',
        action: 'Department Created',
        targetType: 'department',
        targetLabel: cleanName,
        metadata: {
          department_id: data.id,
          hospital_id: currentHospId,
          name: cleanName,
        },
      })

      setShowAddModal(false)
      setNotice(`✓ Department "${cleanName}" created successfully in Supabase!`)
      await loadDepartments()
      setTimeout(() => setNotice(null), 4000)
    } catch (err: any) {
      console.error('Error inserting department:', err)
      setFormError(err.message || 'Failed to save department to Supabase. Please check permissions.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (dept: Department) => {
    const nextActive = dept.status !== 'active'
    const nextStatusStr = nextActive ? 'active' : 'inactive'

    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: nextActive })
        .eq('id', dept.id)
        .eq('hospital_id', currentHospId)

      if (error) throw error

      await logActivity({
        category: 'Departments',
        action: `Department ${nextActive ? 'Activated' : 'Deactivated'}`,
        targetType: 'department',
        targetLabel: dept.name,
        metadata: {
          department_id: dept.id,
          hospital_id: currentHospId,
          is_active: nextActive,
        },
      })

      setNotice(`✓ Department "${dept.name}" is now ${nextStatusStr.toUpperCase()}`)
      await loadDepartments()
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      console.error('Failed to update department status:', err)
      setNotice(`❌ Failed to update status: ${err.message}`)
      setTimeout(() => setNotice(null), 4000)
    }
  }

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <HospitalDashboardLayout pageTitle="Clinical Departments">
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
              placeholder="Search departments by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={loadDepartments}
              disabled={isLoading}
              title="Refresh departments"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs transition"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition shrink-0"
            >
              <Plus size={15} />
              <span>Create Department</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Departments Grid */}
        {isLoading && departments.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading departments from Supabase...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Building2 size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {searchTerm ? 'No Matching Departments Found' : 'No Departments Configured'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Try adjusting your search query.'
                : 'Create your hospital clinical departments (e.g. General Medicine, Orthopedics, Cardiology) to onboard doctors and accept bookings.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              + Create First Department
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((dept) => {
              const isExpanded = expandedDeptId === dept.id

              return (
                <div
                  key={dept.id}
                  className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                    dept.status === 'inactive'
                      ? 'border-slate-200 bg-slate-50/40 opacity-75'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base leading-tight">{dept.name}</h4>
                          <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">
                            {dept.description}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          dept.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {dept.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-4 py-3 border-t border-b border-slate-100 text-center">
                      <div className="border-r border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Doctors</span>
                        <span className="text-lg font-black text-slate-900">{dept.doctorsCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Wait Time</span>
                        <span className="text-lg font-black text-blue-600">{dept.avgWaitMins}m</span>
                      </div>
                    </div>

                    {/* Assigned Doctors Dropdown List */}
                    {dept.assignedDoctors.length > 0 ? (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-blue-600 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <Stethoscope size={13} className="text-blue-500" />
                            <span>Doctors ({dept.assignedDoctors.length}):</span>
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 border border-slate-200/70 rounded-2xl max-h-36 overflow-y-auto">
                            {dept.assignedDoctors.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-800">{doc.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-blue-700 border border-slate-200">
                                  {doc.code}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 text-[11px] text-slate-400 italic">
                        No doctors assigned to this department yet.
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleStatus(dept)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        dept.status === 'active'
                          ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      ID: {dept.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Create Department</h3>
                    <p className="text-[11px] text-slate-400">Add a clinical specialty to your hospital</p>
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
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-700 text-xs">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateDept} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Medicine, Cardiology, Orthopedics"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Primary outpatient medical care and consultation"
                    value={newDept.description}
                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Avg Wait Time (Mins)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={newDept.avgWaitMins}
                      onChange={(e) => setNewDept({ ...newDept, avgWaitMins: Number(e.target.value) || 15 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
                    <select
                      value={newDept.status}
                      onChange={(e) => setNewDept({ ...newDept, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <span>Create Department</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HospitalDashboardLayout>
  )
}
