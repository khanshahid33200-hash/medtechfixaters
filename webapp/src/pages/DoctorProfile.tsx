import { useState, useEffect } from 'react'
import {
  User,
  Stethoscope,
  Building2,
  Calendar,
  ShieldCheck,
  Award,
  CheckCircle,
  FileText,
  Lock,
  Save,
  DollarSign
} from 'lucide-react'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function DoctorProfile() {
  const { doctorProfile } = useAuth()
  const doctorId = doctorProfile?.doctor_id || ''

  const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'hospital' | 'consultation' | 'schedule' | 'documents' | 'patient' | 'account'>('basic')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Doctor Complete Profile State
  const [profile, setProfile] = useState({
    // Basic Info
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    title: 'Dr.',
    name: doctorProfile?.name || 'Dr. Shahid Khan',
    gender: 'Male',
    dob: '1985-06-15',
    phone: '+91-9876543210',
    email: doctorProfile?.email || 'shahid@clinic-os.com',
    language: 'English, Hindi, Bengali',

    // Professional Info
    registration_number: 'MCI-2010-847291',
    medical_council: 'State Medical Council / MCI',
    registration_date: '2010-07-20',
    qualification: 'MBBS, MD (Cardiology), FACC',
    college: 'All India Institute of Medical Sciences (AIIMS)',
    graduation_year: '2010',
    specialization: doctorProfile?.department_name || 'Cardiology',
    sub_specialization: 'Interventional Cardiology & Electrophysiology',
    years_experience: '14',
    bio: 'Dedicated Senior Cardiologist with over 14 years of clinical experience in non-invasive and interventional cardiac care.',

    // Hospital Info
    hospital_name: doctorProfile?.hospital_name || 'Metro Care Multispecialty Hospital',
    department: doctorProfile?.department_name || 'Cardiology',
    designation: 'Senior Consultant & HOD',
    branch_location: 'Main OPD Block A, 2nd Floor',
    employee_id: 'EMP-CARD-084',
    joining_date: '2018-04-01',
    room_number: 'OPD Room 204',

    // Consultation Details
    consultation_fee: '800',
    followup_fee: '400',
    duration_mins: '15',
    in_person_enabled: true,
    online_enabled: true,
    emergency_enabled: true,
    max_patients_per_day: '40',

    // Schedule
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    start_time: '09:00 AM',
    end_time: '05:00 PM',
    break_time: '01:00 PM - 02:00 PM',
    slot_duration: '15 Mins',
    leave_dates: 'None',

    // Contact & Address
    clinic_phone: '+91-33-24891000',
    clinic_email: 'opd@metrocarehospital.com',
    address: '123 Health Avenue, Medical City',
    city: 'Kolkata',
    state: 'West Bengal',
    pin_code: '700001',

    // Documents & Verification
    registration_cert_status: 'Uploaded & Verified',
    degree_cert_status: 'Uploaded & Verified',
    id_proof_status: 'Uploaded & Verified',
    signature_url: 'Uploaded',
    verification_status: 'Verified Doctor',

    // Patient Facing Info
    areas_expertise: 'Heart Attack Treatment, Angioplasty, Hypertension Management, ECG Interpretation',
    conditions_treated: 'Coronary Artery Disease, Heart Failure, Arrhythmia, Valvular Disease',
    procedures_performed: 'Coronary Angiography, Pacemaker Implantation, Echocardiogram',
    awards: 'Best Cardiologist Award 2022, National Healthcare Excellence Gold Medal',
    publications: 'Author of 12 Research Papers in International Cardiac Journals',
    memberships: 'Life Member of Cardiological Society of India (CSI), Fellow of American College of Cardiology',

    // Clinic OS Internal
    doctor_id: doctorId,
    hospital_id: doctorProfile?.hospital_id || '',
    role: 'Senior Doctor & HOD',
    account_status: 'Active',
    last_login: new Date().toLocaleString()
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`clinic_os_doctor_profile_${doctorId}`)
      if (saved) {
        setProfile(JSON.parse(saved))
      }
    } catch (e) {
      // ignore
    }
  }, [doctorId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any
    if (type === 'checkbox') {
      setProfile((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      localStorage.setItem(`clinic_os_doctor_profile_${doctorId}`, JSON.stringify(profile))
    } catch (e) {
      // ignore
    }
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 4000)
  }

  // Section Progress Calculation
  const basicCompletion = 100
  const profCompletion = 100
  const hospCompletion = profile.room_number ? 100 : 80
  const consultCompletion = profile.consultation_fee ? 100 : 60
  const scheduleCompletion = 100
  const docCompletion = profile.registration_cert_status ? 100 : 50

  const totalCompletion = Math.round(
    (basicCompletion + profCompletion + hospCompletion + consultCompletion + scheduleCompletion + docCompletion) / 6
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <User className="text-blue-600" size={32} /> Doctor Profile Management
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Manage complete medical credentials, consultation fees, schedule, and verified profile data
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-600/30 flex items-center gap-2">
            <Save size={18} /> Save Complete Profile
          </Button>
        </div>

        {/* Save Confirmation Toast */}
        {saveSuccess && (
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <CheckCircle size={20} />
              <span>Doctor Profile Updated & Saved Successfully!</span>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg">100% Synced</span>
          </div>
        )}

        {/* 1. Recommended Profile Completion Progress Bar */}
        <Card className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" size={22} /> Recommended Profile Completion
                </h3>
                <p className="text-xs text-slate-600">Completing all sections increases patient trust and streamlines hospital EMR onboarding.</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-blue-600">{totalCompletion}%</span>
                <span className="text-xs font-bold text-slate-500 block">Overall Score</span>
              </div>
            </div>

            {/* Main Progress Bar */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalCompletion}%` }}
              />
            </div>

            {/* 6 Section Breakdown Progress Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-500">Basic Info</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full inline-block">
                  {basicCompletion}%
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-500">Professional</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full inline-block">
                  {profCompletion}%
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-500">Hospital</p>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-xs rounded-full inline-block">
                  {hospCompletion}%
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-500">Consultation</p>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full inline-block">
                  {consultCompletion}%
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-500">Schedule</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full inline-block">
                  {scheduleCompletion}%
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-500">Documents</p>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full inline-block">
                  {docCompletion}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'basic', label: 'Basic Info', icon: User },
            { id: 'professional', label: 'Professional Data', icon: Stethoscope },
            { id: 'hospital', label: 'Hospital Info', icon: Building2 },
            { id: 'consultation', label: 'Consultation & Fees', icon: DollarSign },
            { id: 'schedule', label: 'Schedule & Timing', icon: Calendar },
            { id: 'documents', label: 'Documents & Verification', icon: FileText },
            { id: 'patient', label: 'Patient-Facing Bio', icon: Award },
            { id: 'account', label: 'Account & Security', icon: Lock },
          ].map((tab) => {
            const TabIcon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <TabIcon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Section Form Workspace */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <User size={18} /> Basic Information
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={profile.photo_url}
                    alt="Doctor Profile"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow"
                  />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 text-sm">Doctor Profile Photo</p>
                    <input
                      type="text"
                      name="photo_url"
                      value={profile.photo_url}
                      onChange={handleChange}
                      placeholder="Photo Image URL"
                      className="w-full sm:w-80 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Professional Title *</label>
                    <select
                      name="title"
                      value={profile.title}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Prof. Dr.">Prof. Dr.</option>
                      <option value="Lt. Col. Dr.">Lt. Col. Dr.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={profile.gender}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={profile.dob}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Languages Spoken</label>
                  <input
                    type="text"
                    name="language"
                    value={profile.language}
                    onChange={handleChange}
                    placeholder="e.g. English, Hindi, Bengali"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: PROFESSIONAL INFORMATION */}
          {activeTab === 'professional' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Stethoscope size={18} /> Professional & Medical Credentials
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medical Registration Number *</label>
                    <input
                      type="text"
                      name="registration_number"
                      value={profile.registration_number}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold font-mono text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medical Council *</label>
                    <input
                      type="text"
                      name="medical_council"
                      value={profile.medical_council}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registration Date</label>
                    <input
                      type="date"
                      name="registration_date"
                      value={profile.registration_date}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Highest Medical Qualification *</label>
                    <input
                      type="text"
                      name="qualification"
                      value={profile.qualification}
                      onChange={handleChange}
                      placeholder="e.g. MBBS, MD, MS"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">University / Medical College</label>
                    <input
                      type="text"
                      name="college"
                      value={profile.college}
                      onChange={handleChange}
                      placeholder="e.g. AIIMS"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year</label>
                    <input
                      type="text"
                      name="graduation_year"
                      value={profile.graduation_year}
                      onChange={handleChange}
                      placeholder="2010"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Specialization *</label>
                    <input
                      type="text"
                      name="specialization"
                      value={profile.specialization}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-extrabold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sub-specialization</label>
                    <input
                      type="text"
                      name="sub_specialization"
                      value={profile.sub_specialization}
                      onChange={handleChange}
                      placeholder="e.g. Interventional Cardiology"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Years of Clinical Experience *</label>
                    <input
                      type="number"
                      name="years_experience"
                      value={profile.years_experience}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="Brief overview of clinical expertise and patient care philosophy..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: HOSPITAL INFORMATION */}
          {activeTab === 'hospital' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Building2 size={18} /> Hospital & Department Assignment
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Hospital Name *</label>
                    <input
                      type="text"
                      name="hospital_name"
                      value={profile.hospital_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm font-extrabold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={profile.department}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm font-extrabold text-blue-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={profile.designation}
                      onChange={handleChange}
                      placeholder="e.g. Senior Consultant"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch / OPD Location</label>
                    <input
                      type="text"
                      name="branch_location"
                      value={profile.branch_location}
                      onChange={handleChange}
                      placeholder="e.g. OPD Block A"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Room Number *</label>
                    <input
                      type="text"
                      name="room_number"
                      value={profile.room_number}
                      onChange={handleChange}
                      placeholder="e.g. Room 204"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Employee ID</label>
                    <input
                      type="text"
                      name="employee_id"
                      value={profile.employee_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      name="joining_date"
                      value={profile.joining_date}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: CONSULTATION SETTINGS & FEES */}
          {activeTab === 'consultation' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <DollarSign size={18} /> Consultation Settings & Fees
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">In-Person Consultation Fee (₹ / $) *</label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={profile.consultation_fee}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-extrabold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Fee (₹ / $)</label>
                    <input
                      type="number"
                      name="followup_fee"
                      value={profile.followup_fee}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Average Consultation Duration</label>
                    <select
                      name="duration_mins"
                      value={profile.duration_mins}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    >
                      <option value="10">10 Minutes</option>
                      <option value="15">15 Minutes</option>
                      <option value="20">20 Minutes</option>
                      <option value="30">30 Minutes</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Available Consultation Types</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        name="in_person_enabled"
                        checked={profile.in_person_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>In-Person Consultation</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        name="online_enabled"
                        checked={profile.online_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Online Tele-Consultation</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        name="emergency_enabled"
                        checked={profile.emergency_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Emergency Priority Callout</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: SCHEDULE & AVAILABILITY */}
          {activeTab === 'schedule' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Calendar size={18} /> Schedule & OPD Hours
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">OPD Start Time *</label>
                    <input
                      type="text"
                      name="start_time"
                      value={profile.start_time}
                      onChange={handleChange}
                      placeholder="09:00 AM"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">OPD End Time *</label>
                    <input
                      type="text"
                      name="end_time"
                      value={profile.end_time}
                      onChange={handleChange}
                      placeholder="05:00 PM"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lunch / Break Time</label>
                    <input
                      type="text"
                      name="break_time"
                      value={profile.break_time}
                      onChange={handleChange}
                      placeholder="01:00 PM - 02:00 PM"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Patients Allowed Per Day</label>
                  <input
                    type="number"
                    name="max_patients_per_day"
                    value={profile.max_patients_per_day}
                    onChange={handleChange}
                    className="w-full sm:w-64 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-extrabold text-blue-700"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: DOCUMENTS & VERIFICATION */}
          {activeTab === 'documents' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <FileText size={18} /> Medical Credentials & Verification
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Medical Registration Certificate</p>
                      <p className="text-xs text-emerald-700">{profile.registration_cert_status}</p>
                    </div>
                    <CheckCircle className="text-emerald-600" size={24} />
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Degree Certificates (MBBS/MD)</p>
                      <p className="text-xs text-emerald-700">{profile.degree_cert_status}</p>
                    </div>
                    <CheckCircle className="text-emerald-600" size={24} />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-blue-900 text-sm">Doctor Profile Verification Badge</p>
                    <p className="text-xs text-blue-700">Verified by Hospital Administrator</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full">
                    ✓ Verified Doctor
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 7: PATIENT-FACING BIO */}
          {activeTab === 'patient' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Award size={18} /> Patient-Facing Information & Achievements
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Areas of Clinical Expertise</label>
                  <input
                    type="text"
                    name="areas_expertise"
                    value={profile.areas_expertise}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conditions Treated</label>
                  <input
                    type="text"
                    name="conditions_treated"
                    value={profile.conditions_treated}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Awards and Achievements</label>
                  <input
                    type="text"
                    name="awards"
                    value={profile.awards}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Memberships and Professional Associations</label>
                  <input
                    type="text"
                    name="memberships"
                    value={profile.memberships}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 8: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <Card className="rounded-3xl border border-slate-200">
              <CardHeader className="bg-slate-900 text-white py-4 rounded-t-3xl">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Lock size={18} /> Clinic OS Internal Fields & Security
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-500">Doctor ID</p>
                    <p className="font-extrabold text-slate-900 text-sm">{profile.doctor_id}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-500">Hospital ID</p>
                    <p className="font-extrabold text-slate-900 text-sm">{profile.hospital_id}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-500">System Role</p>
                    <p className="font-extrabold text-blue-700 text-sm">{profile.role}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-blue-400">Supabase Authentication Status</p>
                  <p className="text-slate-300">Account Status: <strong className="text-emerald-400">{profile.account_status}</strong></p>
                  <p className="text-slate-300">Supabase Auth ID: <span className="font-mono text-blue-200">{profile.doctor_id}</span></p>
                  <p className="text-slate-400 text-[11px]">Last Sign In: {profile.last_login}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-8 rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2">
              <Save size={18} /> Save & Apply All Profile Updates
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
