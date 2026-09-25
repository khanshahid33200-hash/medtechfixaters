import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building,
  Palette,
  User,
  KeyRound,
  Bell,
  QrCode,
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  Save} from 'lucide-react'
import HospitalAiSettings from '../../components/ai/HospitalAiSettings'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'

export default function HospitalSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [notice, setNotice] = useState<string | null>(null)

  const { currentUser, doctorProfile } = useAuth()

  // Hospital Profile Form State
  const [hospProfile, setHospProfile] = useState({
    name: localStorage.getItem('hospital_name') || doctorProfile?.hospital_name || 'City Care Hospital',
    logo: localStorage.getItem('clinicos_hospital_logo') || '',
    address: 'Plot 42, Medical Enclave, Health Square',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    phone: '+91 98765 12345',
    email: 'admin@citycare.com',
    website: 'https://citycare.hospital.org',
    regNumber: 'HOSP-MH-2024-9981',
    description: 'Premier multi-specialty tertiary care hospital offering comprehensive outpatient and inpatient clinical services.'
  })

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: ''
  })

  // Branding Form State
  const [branding, setBranding] = useState({
    primaryColor: '#2563eb',
    accentColor: '#10b981',
    displayName: 'City Care Hospital'
  })

  // Notification Toggles
  const [toggles, setToggles] = useState({
    newAppt: true,
    queueAlert: true,
    doctorLogin: true,
    patientReg: true,
    systemEmail: false
  })

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setHospProfile(prev => ({ ...prev, logo: dataUrl }))
      localStorage.setItem('clinicos_hospital_logo', dataUrl)
      setNotice('✓ Hospital Logo updated! Reflected on sidebar and QR cards.')
      setTimeout(() => setNotice(null), 4000)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setHospProfile(prev => ({ ...prev, logo: '' }))
    localStorage.removeItem('clinicos_hospital_logo')
    setNotice('Hospital logo removed')
    setTimeout(() => setNotice(null), 3000)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('hospital_name', hospProfile.name)
    if (hospProfile.logo) {
      localStorage.setItem('clinicos_hospital_logo', hospProfile.logo)
    }
    setNotice('✓ Hospital Profile and Branding saved successfully!')
    setTimeout(() => setNotice(null), 4000)
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault()
    if (securityForm.newPass !== securityForm.confirmPass) {
      alert('New passwords do not match.')
      return
    }
    setNotice('✓ Security credentials updated successfully!')
    setSecurityForm({ currentPass: '', newPass: '', confirmPass: '' })
    setTimeout(() => setNotice(null), 4000)
  }

  return (
    <HospitalDashboardLayout pageTitle="Settings">
      {notice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Settings Tabs Header */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-1 text-xs font-bold">
          {[
            { id: 'profile', label: 'Hospital Profile', icon: Building },
            { id: 'branding', label: 'Branding', icon: Palette },
            { id: 'account', label: 'Account Profile', icon: User },
            { id: 'security', label: 'Security', icon: KeyRound },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'qr', label: 'QR Settings', icon: QrCode },
            { id: 'ai', label: 'AI & Follow-ups', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSearchParams({ tab: tab.id })
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab 1: Hospital Profile */}
        {activeTab === 'ai' && <HospitalAiSettings />}

        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Identity & Institutional Profile</h3>
              <p className="text-slate-400 mt-0.5">Manage branding assets, addresses, and official contact information</p>
            </div>

            {/* Logo Upload Block */}
            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-300/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm text-3xl">
                {hospProfile.logo ? (
                  <img src={hospProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>🏥</span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-bold text-slate-900">Hospital Brand Logo</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Appears in sidebar, printable QR badges, patient booking forms, and reports.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3">
                  <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5">
                    <Upload size={13} />
                    <span>Upload New Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {hospProfile.logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-white rounded-xl font-semibold transition flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Hospital Name</label>
                <input
                  type="text"
                  required
                  value={hospProfile.name}
                  onChange={(e) => setHospProfile({ ...hospProfile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration / License Number</label>
                <input
                  type="text"
                  value={hospProfile.regNumber}
                  onChange={(e) => setHospProfile({ ...hospProfile, regNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Email Address</label>
                <input
                  type="email"
                  value={hospProfile.email}
                  onChange={(e) => setHospProfile({ ...hospProfile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Phone Number</label>
                <input
                  type="tel"
                  value={hospProfile.phone}
                  onChange={(e) => setHospProfile({ ...hospProfile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={hospProfile.address}
                  onChange={(e) => setHospProfile({ ...hospProfile, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={hospProfile.city}
                  onChange={(e) => setHospProfile({ ...hospProfile, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">State / Province</label>
                <input
                  type="text"
                  value={hospProfile.state}
                  onChange={(e) => setHospProfile({ ...hospProfile, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
              >
                <Save size={15} />
                <span>Save Hospital Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Branding */}
        {activeTab === 'branding' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Brand Customization</h3>
              <p className="text-slate-400 mt-0.5">Customize UI accent colors and brand highlights</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Brand Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono font-bold text-slate-800">{branding.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Secondary Status Accent</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono font-bold text-slate-800">{branding.accentColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleSaveSecurity} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Access Security & Credentials</h3>
              <p className="text-slate-400 mt-0.5">Update password and manage session authorization</p>
            </div>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={securityForm.currentPass}
                  onChange={(e) => setSecurityForm({ ...securityForm, currentPass: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={securityForm.newPass}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPass: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={securityForm.confirmPass}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPass: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Update Password
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Notifications Settings */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
              <p className="text-slate-400 mt-0.5">Toggle alert channels and real-time push events</p>
            </div>

            <div className="space-y-4 max-w-lg divide-y divide-slate-100">
              {[
                { key: 'newAppt', label: 'New Patient Appointment Alerts', desc: 'Notify immediately when an appointment is booked via QR or portal' },
                { key: 'queueAlert', label: 'Queue Milestone Updates', desc: 'Alert when a doctor queue waiting list exceeds 10 patients' },
                { key: 'doctorLogin', label: 'Doctor Availability & Logins', desc: 'Alert when a doctor starts consultation in OPD' },
                { key: 'patientReg', label: 'New Patient Registrations', desc: 'Notify when an emergency patient record is created' }
              ].map(item => (
                <div key={item.key} className="pt-3 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800">{item.label}</h5>
                    <p className="text-slate-400 text-[11px]">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(toggles as any)[item.key]}
                    onChange={(e) => setToggles({ ...toggles, [item.key]: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </HospitalDashboardLayout>
  )
}
