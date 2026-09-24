import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Pill, Plus, UploadCloud, Sparkles, History, FlaskConical, Library } from 'lucide-react'
import DoctorDashboardLayout from '../components/doctordashboard/DoctorDashboardLayout'
import MedicineLibrary from '../components/medicines/MedicineLibrary'
import MedicineFormModal from '../components/medicines/MedicineFormModal'
import MedicineImport from '../components/medicines/MedicineImport'
import SuggestionRules from '../components/medicines/SuggestionRules'
import TestLibrary from '../components/medicines/TestLibrary'
import ImportHistory from '../components/medicines/ImportHistory'
import type { Medicine } from '../services/medicineService'

type Tab = 'library' | 'import' | 'rules' | 'tests' | 'history'

const TABS: { id: Tab; label: string; path: string; icon: typeof Pill }[] = [
  { id: 'library', label: 'Medicine Library', path: '/medicines', icon: Library },
  { id: 'import', label: 'Import CSV / Excel', path: '/medicines/import', icon: UploadCloud },
  { id: 'rules', label: 'Suggestion Rules', path: '/medicines/rules', icon: Sparkles },
  { id: 'tests', label: 'Tests', path: '/medicines/tests', icon: FlaskConical },
  { id: 'history', label: 'Import History', path: '/medicines/import-history', icon: History },
]

function tabFromPath(pathname: string): Tab {
  if (pathname.startsWith('/medicines/import-history')) return 'history'
  if (pathname.startsWith('/medicines/import')) return 'import'
  if (pathname.startsWith('/medicines/rules')) return 'rules'
  if (pathname.startsWith('/medicines/tests')) return 'tests'
  return 'library'
}

export default function MedicinesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const tab = tabFromPath(location.pathname)
  const addRoute = location.pathname === '/medicines/new'
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const closeForm = () => {
    setEditing(null)
    if (addRoute) navigate('/medicines', { replace: true })
  }

  return (
    <DoctorDashboardLayout pageTitle="Medicines">
      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Pill size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Medicines</h1>
              <p className="text-xs text-slate-500">Manage your clinic's medicine library and prescribing suggestions.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/medicines/new')} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
              <Plus size={15} /> Add Medicine
            </button>
            <button type="button" onClick={() => navigate('/medicines/import')} className="px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-black flex items-center gap-1.5">
              <UploadCloud size={15} /> Import CSV / Excel
            </button>
          </div>
        </motion.div>

        <nav className="flex gap-1 p-1 bg-white/70 backdrop-blur border border-slate-200 rounded-2xl overflow-x-auto" aria-label="Medicines sections">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(t.path)}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${active ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </nav>

        {tab === 'library' && <MedicineLibrary refreshKey={refreshKey} onEdit={setEditing} />}
        {tab === 'import' && <MedicineImport onImported={() => setRefreshKey((k) => k + 1)} onViewHistory={() => navigate('/medicines/import-history')} />}
        {tab === 'rules' && <SuggestionRules />}
        {tab === 'tests' && <TestLibrary />}
        {tab === 'history' && <ImportHistory refreshKey={refreshKey} />}
      </div>

      {(addRoute || editing) && (
        <MedicineFormModal
          medicine={editing}
          onClose={closeForm}
          onSaved={() => {
            setRefreshKey((k) => k + 1)
            closeForm()
          }}
        />
      )}
    </DoctorDashboardLayout>
  )
}
