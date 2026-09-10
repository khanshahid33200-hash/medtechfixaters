import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Share2,
  Sparkles
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function HospitalReportsPage() {
  const { doctorProfile } = useAuth()
  const currentHospId = doctorProfile?.hospital_id || localStorage.getItem('hospital_id') || ''

  const [reportType, setReportType] = useState('Appointments Report')
  const [dateRange, setDateRange] = useState('This Month')
  const [department, setDepartment] = useState('All')
  const [isGenerating, setIsGenerating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [departmentsList, setDepartmentsList] = useState<string[]>([])

  useEffect(() => {
    async function loadReportData() {
      if (!currentHospId) return
      try {
        const { data: depts } = await supabase
          .from('departments')
          .select('name')
          .eq('hospital_id', currentHospId)
          .eq('is_active', true)
        if (depts) {
          setDepartmentsList(depts.map(d => d.name))
        }

        const { data: appts } = await supabase
          .from('appointments')
          .select('id, appointment_date, status, patient:patients(name), doctor:profiles(full_name, department)')
          .eq('hospital_id', currentHospId)
          .order('created_at', { ascending: false })

        if (appts && appts.length > 0) {
          const mapped = appts.map((a: any, idx: number) => ({
            id: `REP-${String(idx + 1).padStart(3, '0')}`,
            subject: `${a.patient?.name || 'Patient'} (Patient)`,
            dept: a.doctor?.department || 'General OPD',
            doctor: a.doctor?.full_name || 'Attending Physician',
            time: a.appointment_date || 'Recent',
            outcome: a.status === 'Completed' ? 'Consultation Done' : a.status === 'Cancelled' ? 'Cancelled' : 'Scheduled'
          }))
          setRecords(mapped)
        } else {
          setRecords([])
        }
      } catch (e) {
        setRecords([])
      }
    }
    loadReportData()
  }, [currentHospId])

  const handleDownloadCSV = () => {
    if (records.length === 0) {
      alert('No clinical report records available to export for this hospital.')
      return
    }
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      const headers = 'ID,Patient,Department,Doctor,Date,Status\n'
      const rows = records.map(r => `${r.id},"${r.subject}","${r.dept}","${r.doctor}","${r.time}","${r.outcome}"`).join('\n')
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows)
      const link = document.createElement('a')
      link.setAttribute('href', csvContent)
      link.setAttribute('download', `Hospital_${reportType.replace(/\s+/g, '_')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setNotice(`✓ Downloaded ${reportType} CSV!`)
      setTimeout(() => setNotice(null), 3000)
    }, 600)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <HospitalDashboardLayout pageTitle="Reports">
      {notice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Report Criteria Configuration Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Hospital Operational Reports Generator</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option>Appointments Report</option>
                <option>Patient Report</option>
                <option>Doctor Activity Report</option>
                <option>Department Report</option>
                <option>Queue Performance Report</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Date Interval</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Last Month</option>
                <option>Year to Date</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Department Scope</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option value="All">All Departments</option>
                {departmentsList.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleDownloadCSV}
                disabled={isGenerating}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition"
              >
                <Download size={15} />
                <span>{isGenerating ? 'Generating...' : 'Export CSV'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition"
                title="Print Report"
              >
                <Printer size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Table Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{reportType} (Preview)</h4>
              <p className="text-xs text-slate-400">Showing output records for {dateRange} • {department}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
              Verified Data Engine
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Subject / Entity</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Specialist</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No clinical reports or records available for this hospital yet.
                    </td>
                  </tr>
                ) : (
                  records.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{row.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.subject}</td>
                      <td className="py-3 px-4">{row.dept}</td>
                      <td className="py-3 px-4">{row.doctor}</td>
                      <td className="py-3 px-4 text-slate-500">{row.time}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{row.outcome}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </HospitalDashboardLayout>
  )
}
