import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import {
  Building2, ShieldCheck, Search, Users, Activity, Bell,
  Plus, Settings, ChevronDown, CheckCircle2,
  Calendar, CreditCard, LogOut, ChevronRight,
  TrendingUp, BarChart3, AlertCircle, Trash2, Edit3, Key,
  Radio, X, UserCheck, Stethoscope, Layers, Sliders, Phone,
  Server, Globe, QrCode, Download, Printer, Copy, ExternalLink,
  Eye, EyeOff, LockKeyhole, Mail, ArrowRight, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'
import { supabase } from '../lib/supabase'
import PlatformAiSettings from '../components/ai/PlatformAiSettings'

interface HospitalItem {
  id: string
  name: string
  location: string
  license: string
  phone: string
  email: string
  intake_token?: string
  qr_token?: string
  address: string
  doctor_limit: number
  doctor_count: number
  joinedOn: string
  plan: 'Single OPD' | 'Hospital Pro' | 'Enterprise'
  revenue: number
  status: 'active' | 'pending' | 'suspended'
}

interface IndividualDoctorItem {
  doctor_id: string
  doctor_code: string
  doctor_name: string
  clinic_name: string
  clinic_id: string
  email: string
  phone: string
  specialization: string
  consultation_fee: number
  plan_tier: string
  onboarding_status: string
  account_status: string
  is_active: boolean
  qr_token: string
  booking_url: string
  joined_on: string
}

interface LeadItem {
  id?: string
  name?: string
  phone?: string
  email?: string
  clinic_name?: string
  city?: string
  speciality?: string
  plan?: string
  message?: string
  timestamp?: string
  status?: 'new' | 'contacted' | 'converted'
}

interface DoctorItem {
  id: string
  name: string
  doctor_code?: string
  hospital: string
  hospital_id?: string
  specialty: string
  email: string
  phone: string
  status: 'online' | 'in_session' | 'off_duty'
  account_status?: string
  is_active?: boolean
  auth_provider?: string
  todayConsults: number
  onboarding_status?: string
  joinedOn?: string
}

interface SupportTicket {
  id: string
  hospital: string
  subject: string
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved'
  date: string
}

interface DepartmentItem {
  id: string
  name: string
  headDoctor: string
  hospitalsCount: number
  activeDoctors: number
  avgWaitMins: number
  todayConsults: number
  status: 'optimal' | 'high_load'
}

interface AnnouncementItem {
  id: string
  title: string
  message: string
  audience: 'All Hospitals' | 'Doctors Only' | 'Staff Only'
  priority: 'Critical' | 'Maintenance' | 'Update'
  createdAt: string
  active: boolean
}

export default function OwnerAdmin() {
  useSEO({
    title: 'Super Admin OS — MedTech Fixaters Platform Infrastructure',
    description: 'Master Platform Control Dashboard for MedTech Fixaters Multi-Tenant Infrastructure.',
  })

  const { registerUserInSupabase } = useAuth()
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(false)
  const [checkingOwnerSession, setCheckingOwnerSession] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [ownerLoginLoading, setOwnerLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Mouse reactive glow coordinates for Super Admin Login screen
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const glowX = useTransform(springX, [-500, 500], [-80, 80])
  const glowY = useTransform(springY, [-500, 500], [-50, 50])

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    mouseX.set(event.clientX - rect.left - rect.width / 2)
    mouseY.set(event.clientY - rect.top - rect.height / 2)
  }

  // Navigation State
  const [activeNav, setActiveNav] = useState<string>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  // Top Bar Dropdowns & Drawers
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Chart State
  const [chartDateRange, setChartDateRange] = useState('Current Period')
  const [chartFreq, setChartFreq] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily')

  // Modals State
  const [showCreateHospitalModal, setShowCreateHospitalModal] = useState(false)
  const [showInviteAdminModal, setShowInviteAdminModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [showSystemHealthModal, setShowSystemHealthModal] = useState(false)
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState<SupportTicket | null>(null)
  const [ticketReply, setTicketReply] = useState('')

  const [editingHospital, setEditingHospital] = useState<HospitalItem | null>(null)
  const [selectedHospitalForQR, setSelectedHospitalForQR] = useState<HospitalItem | null>(null)
  const [selectedIndividualDoctorForQR, setSelectedIndividualDoctorForQR] = useState<IndividualDoctorItem | null>(null)
  const [clientTypeToCreate, setClientTypeToCreate] = useState<'hospital' | 'individual_doctor'>('hospital')
  const [individualDoctorsList, setIndividualDoctorsList] = useState<IndividualDoctorItem[]>([])
  const [individualDoctorForm, setIndividualDoctorForm] = useState({
    doctor_name: '',
    clinic_name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'General Physician',
    consultation_fee: 500,
    plan_tier: 'starter',
    city: 'Mumbai',
  })
  const [qrCopied, setQrCopied] = useState(false)
  const [hospSecurityModal, setHospSecurityModal] = useState<{ hospital: HospitalItem; action: 'blocked' | 'banned' | 'suspended' | 'deleted' | 'unblock' } | null>(null)
  const [hospSecurityReason, setHospSecurityReason] = useState('Administrative Action / Compliance Review')
  const [resettingHospital, setResettingHospital] = useState<HospitalItem | null>(null)
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('All')
  const [newPassword, setNewPassword] = useState('')

  // Feature Flags
  const [featuresState, setFeaturesState] = useState({
    whatsappNotifications: true,
    audioVoiceCallouts: true,
    abdmGateway: true,
    aiPrescriptionAssist: true,
    offlineCacheSync: true,
    maintenanceMode: false,
  })

  // Integrations State
  const [integrationKeys, setIntegrationKeys] = useState({
    whatsappToken: '',
    abdmClientId: '',
    razorpayKey: '',
    smsGatewayKey: '',
  })

  // Forms
  const [hospitalForm, setHospitalForm] = useState<{
    name: string
    location: string
    license: string
    phone: string
    email: string
    password: string
    address: string
    plan: 'Single OPD' | 'Hospital Pro' | 'Enterprise'
    doctor_limit: number
  }>({
    name: '',
    location: '',
    license: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    plan: 'Hospital Pro',
    doctor_limit: 10,
  })

  const [newDeptForm, setNewDeptForm] = useState({ name: '', headDoctor: '', avgWaitMins: 10 })
  const [newAnnouncementForm, setNewAnnouncementForm] = useState({
    title: '',
    message: '',
    audience: 'All Hospitals' as const,
    priority: 'Update' as const
  })
  const [inviteForm, setInviteForm] = useState({ email: '', hospitalName: '', role: 'hospital_admin' })
  const [pricingPlanForm, setPricingPlanForm] = useState({ name: '', price: 2499, doctorLimit: 10, features: '' })

  // Clean Real State (No demo mock data)
  const [hospitalsList, setHospitalsList] = useState<HospitalItem[]>(() => {
    try {
      const saved = localStorage.getItem('clinicos_hospitals')
      if (saved) {
        return JSON.parse(saved)
      }
      return []
    } catch {
      return []
    }
  })

  const [doctorsList, setDoctorsList] = useState<DoctorItem[]>([])

  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('clinicos_departments')
      if (saved) return JSON.parse(saved)
      return []
    } catch {
      return []
    }
  })

  const [announcementsList, setAnnouncementsList] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('clinicos_announcements')
      if (saved) return JSON.parse(saved)
      return []
    } catch {
      return []
    }
  })

  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('clinicos_tickets')
      if (saved) return JSON.parse(saved)
      return []
    } catch {
      return []
    }
  })

  const [leadsList, setLeadsList] = useState<LeadItem[]>(() => {
    try {
      const savedLeads = JSON.parse(localStorage.getItem('clinicos_leads') || '[]')
      return savedLeads
    } catch {
      return []
    }
  })

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    try {
      const savedLogs = JSON.parse(localStorage.getItem('clinicos_audit_logs') || '[]')
      return savedLogs
    } catch {
      return []
    }
  })

  const [realDoctorCount, setRealDoctorCount] = useState(0)
  const [realApptCount, setRealApptCount] = useState(0)
  const [realRevenue, setRealRevenue] = useState(0)

  // Verify against a REAL Supabase Auth session with role = 'super_admin' —
  // this used to be a hardcoded email/password check in this file's source
  // plus a forgeable localStorage flag, backed only by the service-role key
  // bypassing RLS. Now it's a real authenticated session and RLS's existing
  // is_super_admin() policies are what actually grant cross-hospital access.
  useEffect(() => {
    let cancelled = false
    async function checkOwnerSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        if (!cancelled) setCheckingOwnerSession(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', session.user.id)
        .maybeSingle()
      if (cancelled) return
      if (profile?.role === 'super_admin' && profile.is_active) {
        setIsOwnerAuthenticated(true)
      } else {
        await supabase.auth.signOut()
        setIsOwnerAuthenticated(false)
      }
      setCheckingOwnerSession(false)
    }
    checkOwnerSession()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isOwnerAuthenticated) return

    async function loadPlatformData() {
      try {
        // 1. Fetch ALL real hospitals and clinics (never exclude individual doctor clinics)
        const { data: dbHosps } = await supabase
          .from('hospitals')
          .select('*')
          .order('created_at', { ascending: false })

        // 2. Fetch distinct QR codes
        const { data: dbQrs } = await supabase
          .from('qr_codes')
          .select('*')

        const qrMap = new Map((dbQrs || []).map(q => [q.hospital_id, q.token]))
        const docQrMap = new Map((dbQrs || []).filter(q => q.doctor_id).map(q => [q.doctor_id, q.token]))

        // 3. Fetch Individual Doctors & Clinics
        try {
          const { data: indDocs } = await supabase
            .from('doctor_details')
            .select(`
              user_id,
              clinic_name,
              specialization,
              consultation_fee,
              onboarding_status,
              created_at,
              profiles(id, full_name, email, doctor_code, is_active, account_status, client_type, hospital_id),
              hospitals(id, name, city, phone, status, client_type)
            `)
            .order('created_at', { ascending: false })

          if (indDocs) {
            const mappedIndDocs: IndividualDoctorItem[] = (indDocs as any[]).map(d => {
              const docId = d.user_id
              const hospId = d.hospitals?.id || d.profiles?.hospital_id
              const token = docQrMap.get(docId) || qrMap.get(hospId) || `QR-DOC-${docId.slice(-6).toUpperCase()}`
              return {
                doctor_id: docId,
                doctor_code: d.profiles?.doctor_code || `DOC-${docId.slice(-4).toUpperCase()}`,
                doctor_name: d.profiles?.full_name || 'Doctor',
                clinic_name: d.clinic_name || d.hospitals?.name || 'Clinic',
                clinic_id: hospId || '',
                email: d.profiles?.email || '',
                phone: d.hospitals?.phone || '',
                specialization: d.specialization || 'General Physician',
                consultation_fee: Number(d.consultation_fee) || 500,
                plan_tier: d.onboarding_status === 'ACTIVE' ? 'Pro' : 'Starter',
                onboarding_status: d.onboarding_status || 'ACTIVE',
                account_status: d.profiles?.account_status || (d.profiles?.is_active ? 'active' : 'inactive'),
                is_active: Boolean(d.profiles?.is_active),
                qr_token: token,
                booking_url: `/book/${token}`,
                joined_on: d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
              }
            })
            setIndividualDoctorsList(mappedIndDocs)
          }
        } catch (indErr) {
          console.warn('Individual doctors fetch notice:', indErr)
        }

        if (dbHosps) {
          const mapped: HospitalItem[] = dbHosps.map(h => {
            let uniqueToken = qrMap.get(h.id)
            if (!uniqueToken) {
              uniqueToken = `QR-${h.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
              // Auto-provision distinct QR code in Supabase qr_codes table
              supabase.from('qr_codes').upsert([{
                hospital_id: h.id,
                token: uniqueToken,
                booking_url: `/book/${uniqueToken}`,
                intake_url: `/book/${uniqueToken}`,
                status: 'active',
                is_active: true
              }]).then(() => {})
            }
            return {
              id: h.id,
              name: h.name,
              location: h.city || 'India',
              license: h.license || `LIC-${h.id.slice(0, 4).toUpperCase()}`,
              phone: h.phone || '',
              email: h.email,
              intake_token: uniqueToken,
              qr_token: uniqueToken,
              address: h.address || 'Central OPD Block',
              doctor_limit: h.doctor_limit || 10,
              doctor_count: 0,
              joinedOn: new Date(h.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
              plan: (h.plan as any) || (h.client_type === 'individual_doctor' ? 'Single OPD' : 'Hospital Pro'),
              revenue: 0,
              status: h.status || 'active'
            }
          })
          setHospitalsList(mapped)
          localStorage.setItem('clinicos_hospitals', JSON.stringify(mapped))
        }

        // 4. Fetch ALL doctors (hospital specialists, private clinics, and Google account registrations)
        try {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, doctor_code, hospital_id, is_active, account_status, role, client_type, created_at')
            .order('created_at', { ascending: false })

          const { data: docDetails } = await supabase
            .from('doctor_details')
            .select('user_id, specialization, clinic_name, consultation_fee, onboarding_status, created_at')

          const { data: allHosps } = await supabase
            .from('hospitals')
            .select('id, name, phone, client_type, city')

          const todayStr = new Date().toISOString().split('T')[0]
          const { data: todayAppts } = await supabase
            .from('appointments')
            .select('doctor_id')
            .gte('created_at', `${todayStr}T00:00:00`)

          const docDetailMap = new Map((docDetails || []).map(d => [d.user_id, d]))
          const hospMap = new Map((allHosps || []).map(h => [h.id, h]))
          const apptCountMap = new Map<string, number>()
          todayAppts?.forEach(a => {
            if (a.doctor_id) {
              apptCountMap.set(a.doctor_id, (apptCountMap.get(a.doctor_id) || 0) + 1)
            }
          })

          const doctorMap = new Map<string, any>()

          // A) Profiles marked as doctor or individual doctor
          ;(allProfiles || []).forEach(p => {
            const detail = docDetailMap.get(p.id)
            const isDoc = p.role === 'doctor' || p.client_type === 'individual_doctor' || Boolean(detail) || (p.doctor_code && p.doctor_code.startsWith('DOC'))
            if (isDoc) {
              doctorMap.set(p.id, p)
            }
          })

          // B) Records in doctor_details (including Google signups before profile role update)
          ;(docDetails || []).forEach(d => {
            if (d.user_id && !doctorMap.has(d.user_id)) {
              const prof = (allProfiles || []).find(p => p.id === d.user_id)
              doctorMap.set(d.user_id, prof || {
                id: d.user_id,
                full_name: 'Dr. (Google Registered)',
                email: '',
                doctor_code: `DOC-${d.user_id.slice(0, 4).toUpperCase()}`,
                role: 'doctor',
                is_active: true,
                account_status: 'active',
                created_at: d.created_at,
              })
            }
          })

          // C) Any other user who signed up as doctor or with Google for clinic
          ;(allProfiles || []).forEach(p => {
            if (!doctorMap.has(p.id) && p.role !== 'super_admin' && p.role !== 'hospital_admin' && p.role !== 'staff') {
              if (p.email?.toLowerCase().includes('doc') || p.full_name?.toLowerCase().includes('dr') || p.doctor_code) {
                doctorMap.set(p.id, p)
              }
            }
          })

          const mappedDoctors: DoctorItem[] = Array.from(doctorMap.values()).map(p => {
            const detail = docDetailMap.get(p.id)
            const hosp = p.hospital_id ? hospMap.get(p.hospital_id) : null
            const hospName = hosp?.name || detail?.clinic_name || (p.client_type === 'individual_doctor' ? 'Solo Clinic' : 'Clinical OPD')
            const docPhone = hosp?.phone || ''
            const isGoogle = Boolean(p.email && p.email.toLowerCase().endsWith('@gmail.com'))
            const authProvider = isGoogle ? 'Google Auth' : (p.doctor_code ? 'Doctor ID / Password' : 'Email Auth')

            return {
              id: p.id,
              name: p.full_name || 'Dr. Consultant',
              doctor_code: p.doctor_code || `DOC-${p.id.slice(0, 4).toUpperCase()}`,
              hospital: hospName,
              hospital_id: p.hospital_id || undefined,
              specialty: detail?.specialization || 'General Physician',
              email: p.email || '',
              phone: docPhone,
              status: p.is_active !== false ? 'online' : 'off_duty',
              account_status: p.account_status || (p.is_active !== false ? 'active' : 'suspended'),
              is_active: p.is_active !== false,
              auth_provider: authProvider,
              todayConsults: apptCountMap.get(p.id) || 0,
              onboarding_status: detail?.onboarding_status || 'ACTIVE',
              joinedOn: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
            }
          })

          setDoctorsList(mappedDoctors)
          setRealDoctorCount(mappedDoctors.filter(d => d.is_active).length)
        } catch (docErr) {
          console.warn('Doctors list load error:', docErr)
        }

        // 5. Count real appointments
        const { count: apptCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
        setRealApptCount(apptCount || 0)

        // 6. Calculate real revenue from completed appointments
        const { data: paidAppts } = await supabase
          .from('appointments')
          .select('id, fee')
          .eq('status', 'completed')
        const rev = (paidAppts || []).reduce((acc: number, curr: any) => acc + (Number(curr.fee) || 0), 0)
        setRealRevenue(rev)
      } catch (e) {
        console.warn('Platform data load error:', e)
      }
    }
    loadPlatformData()
  }, [isOwnerAuthenticated])

  // Dynamic real calculations from live database
  const totalHospitals = hospitalsList.length
  const totalDoctors = realDoctorCount
  const totalAppointments = realApptCount
  const totalRevenue = realRevenue

  // Login handler. The super_admin role is granted only in the database; this
  // screen never creates accounts or writes roles (a browser-side signUp with
  // role metadata was previously enough to mint a platform admin).
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setOwnerLoginLoading(true)
    const em = loginForm.email.trim().toLowerCase()
    const pw = loginForm.password.trim()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: em, password: pw })
      const user = data?.user

      if (!user) {
        setLoginError(error?.message || 'Invalid login credentials. Please check your email and password.')
        return
      }

      // Verify role in public.profiles table (never trust client-supplied user_metadata)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role === 'super_admin' && profile?.is_active) {
        setIsOwnerAuthenticated(true)
        localStorage.setItem('owner_authenticated', 'true')
      } else {
        await supabase.auth.signOut()
        setLoginError('Access denied: This account does not have Super Admin permissions.')
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please try again.')
    } finally {
      setOwnerLoginLoading(false)
    }
  }

  const handleOwnerLogout = async () => {
    await supabase.auth.signOut()
    setIsOwnerAuthenticated(false)
    localStorage.removeItem('owner_authenticated')
  }

  // Create Hospital Action
  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault()
    const hospUuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : '11111111-1111-1111-1111-' + Date.now().toString().slice(-12).padStart(12, '0')

    const cleanEmail = hospitalForm.email.trim().toLowerCase()
    const cleanName = hospitalForm.name.trim()
    const cleanSlug = (cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) || 'hospital') + '-' + Date.now().toString().slice(-4)

    setNotice(`Saving hospital "${cleanName}" and hashing password in Supabase Auth...`)

    let createdViaRpc = false
    let uniqueQrToken = `QR-${hospUuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`

    // 1. Try atomic PostgreSQL RPC for creating hospital & confirmed auth admin
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_create_hospital_with_admin', {
        p_hospital_name: cleanName,
        p_hospital_slug: cleanSlug,
        p_admin_email: cleanEmail,
        p_admin_password: hospitalForm.password.trim(),
        p_phone: hospitalForm.phone || '+91 9876543210',
        p_address: hospitalForm.address || 'Central OPD Block',
        p_city: hospitalForm.location || 'Mumbai',
        p_plan: hospitalForm.plan,
        p_doctor_limit: Number(hospitalForm.doctor_limit) || 10
      })

      if (rpcRes?.success) {
        createdViaRpc = true
        if (rpcRes.qr_token) uniqueQrToken = rpcRes.qr_token
        setNotice(`✅ Hospital "${cleanName}" & Admin account "${cleanEmail}" created in Supabase Auth!`)
        console.log('Hospital and Admin successfully created via RPC:', rpcRes)
      } else {
        const errMsg = rpcRes?.error || rpcErr?.message || 'RPC returned unsuccessful'
        console.warn('RPC create hospital notice:', errMsg)
        setNotice(`RPC note: ${errMsg}. Attempting direct registration...`)
      }
    } catch (err: any) {
      console.warn('RPC invocation notice:', err)
    }

    // 2. Fallback to client-side upsert & Auth signup if RPC not present in database
    if (!createdViaRpc) {
      try {
        await supabase.from('hospitals').upsert([
          {
            id: hospUuid,
            name: cleanName,
            slug: cleanSlug,
            email: cleanEmail,
            phone: hospitalForm.phone || '+91 9876543210',
            address: hospitalForm.address || 'Central OPD Block',
            city: hospitalForm.location || 'Mumbai',
            plan: hospitalForm.plan,
            doctor_limit: Number(hospitalForm.doctor_limit) || 10,
            status: 'active',
          }
        ])

        try {
          await registerUserInSupabase(cleanEmail, hospitalForm.password, {
            role: 'hospital_admin',
            name: cleanName,
            hospital_id: hospUuid,
          })
          setNotice(`✅ Hospital "${cleanName}" registered with Supabase Auth admin!`)
        } catch (authRegErr: any) {
          console.warn('Auth user registration warning:', authRegErr?.message)
          setNotice(`⚠️ Hospital saved in database, but Auth User requires running setup SQL in Supabase: ${authRegErr?.message}`)
        }

        await supabase.from('qr_codes').upsert([{
          hospital_id: hospUuid,
          token: uniqueQrToken,
          booking_url: `/book/${uniqueQrToken}`,
          intake_url: `/book/${uniqueQrToken}`,
          status: 'active',
          is_active: true
        }])
      } catch (err: any) {
        console.warn('Fallback creation notice:', err)
      }
    }

    const newHosp: HospitalItem = {
      id: hospUuid,
      name: cleanName,
      location: hospitalForm.location || 'India',
      license: hospitalForm.license || `LIC-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: hospitalForm.phone,
      email: cleanEmail,
      intake_token: uniqueQrToken,
      qr_token: uniqueQrToken,
      address: hospitalForm.address || 'Central OPD Block',
      doctor_limit: Number(hospitalForm.doctor_limit) || 10,
      doctor_count: 0,
      joinedOn: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      plan: hospitalForm.plan,
      revenue: hospitalForm.plan === 'Enterprise' ? 7999 : hospitalForm.plan === 'Hospital Pro' ? 2499 : 999,
      status: 'active',
    }

    const updated = [newHosp, ...hospitalsList]
    setHospitalsList(updated)
    localStorage.setItem('clinicos_hospitals', JSON.stringify(updated))

    // Log activity
    const newLog = {
      id: `log-${Date.now()}`,
      category: 'Tenant Management',
      time: 'Just now',
      actor: 'Platform Super Admin',
      action: `Registered hospital "${newHosp.name}" (${newHosp.plan}) with Supabase Auth & DB`,
      ip: '127.0.0.1',
      status: 'Success'
    }
    const updatedLogs = [newLog, ...auditLogs]
    setAuditLogs(updatedLogs)
    localStorage.setItem('clinicos_audit_logs', JSON.stringify(updatedLogs))

    setShowCreateHospitalModal(false)
    setHospitalForm({ name: '', location: '', license: '', phone: '', email: '', password: '', address: '', plan: 'Hospital Pro', doctor_limit: 10 })
    setNotice(`✓ Hospital "${newHosp.name}" & Admin (${cleanEmail}) saved to Supabase Auth! Login active at /login.`)
    setTimeout(() => setNotice(null), 6000)
  }

  // Create Individual Doctor Action (Admin Mode)
  const handleCreateIndividualDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(`Creating Individual Doctor account for "${individualDoctorForm.doctor_name}" in Supabase...`)

    try {
      const cleanSlug = (individualDoctorForm.clinic_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) || 'clinic') + '-' + Date.now().toString().slice(-4)
      const { data: res, error: err } = await supabase.rpc('admin_create_individual_doctor', {
        p_doctor_name: individualDoctorForm.doctor_name.trim(),
        p_clinic_name: individualDoctorForm.clinic_name.trim(),
        p_email: individualDoctorForm.email.trim().toLowerCase(),
        p_password: individualDoctorForm.password.trim(),
        p_phone: individualDoctorForm.phone.trim(),
        p_specialization: individualDoctorForm.specialization.trim(),
        p_consultation_fee: Number(individualDoctorForm.consultation_fee) || 500,
        p_plan_tier: individualDoctorForm.plan_tier,
        p_city: individualDoctorForm.city.trim(),
        p_slug: cleanSlug,
      })

      if (res?.success) {
        setNotice(`✅ Individual Doctor created! Doctor ID: ${res.doctor_code}, QR Token: ${res.qr_token}`)
        setShowCreateHospitalModal(false)
        setIndividualDoctorForm({
          doctor_name: '',
          clinic_name: '',
          email: '',
          password: '',
          phone: '',
          specialization: 'General Physician',
          consultation_fee: 500,
          plan_tier: 'starter',
          city: 'Mumbai',
        })

        // Refresh list
        const { data: indDocs } = await supabase
          .from('doctor_details')
          .select(`
            user_id,
            clinic_name,
            specialization,
            consultation_fee,
            onboarding_status,
            created_at,
            profiles(id, full_name, email, doctor_code, is_active, account_status, client_type, hospital_id),
            hospitals(id, name, city, phone, status, client_type)
          `)
          .order('created_at', { ascending: false })

        if (indDocs) {
          const { data: dbQrs } = await supabase.from('qr_codes').select('*')
          const qrMap = new Map((dbQrs || []).map(q => [q.hospital_id, q.token]))
          const docQrMap = new Map((dbQrs || []).filter(q => q.doctor_id).map(q => [q.doctor_id, q.token]))

          const mappedIndDocs: IndividualDoctorItem[] = (indDocs as any[])
            .filter(d => d.profiles?.client_type === 'individual_doctor' || d.hospitals?.client_type === 'individual_doctor')
            .map(d => {
              const docId = d.user_id
              const hospId = d.hospitals?.id || d.profiles?.hospital_id
              const token = docQrMap.get(docId) || qrMap.get(hospId) || `QR-DOC-${docId.slice(-6).toUpperCase()}`
              return {
                doctor_id: docId,
                doctor_code: d.profiles?.doctor_code || `DOC-${docId.slice(-4).toUpperCase()}`,
                doctor_name: d.profiles?.full_name || 'Doctor',
                clinic_name: d.clinic_name || d.hospitals?.name || 'Clinic',
                clinic_id: hospId || '',
                email: d.profiles?.email || '',
                phone: d.hospitals?.phone || '',
                specialization: d.specialization || 'General Physician',
                consultation_fee: Number(d.consultation_fee) || 500,
                plan_tier: d.onboarding_status === 'ACTIVE' ? 'Pro' : 'Starter',
                onboarding_status: d.onboarding_status || 'ACTIVE',
                account_status: d.profiles?.account_status || (d.profiles?.is_active ? 'active' : 'inactive'),
                is_active: Boolean(d.profiles?.is_active),
                qr_token: token,
                booking_url: `/book/${token}`,
                joined_on: d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
              }
            })
          setIndividualDoctorsList(mappedIndDocs)
        }
      } else {
        throw new Error(res?.error || err?.message || 'Failed to create individual doctor.')
      }
    } catch (createErr: any) {
      setNotice(`❌ Error creating individual doctor: ${createErr.message}`)
    }
  }

  // Toggle Individual Doctor Active Status
  const handleToggleIndividualDoctorStatus = async (doctor: IndividualDoctorItem) => {
    const nextStatus = doctor.is_active ? false : true
    const nextAccStatus = nextStatus ? 'active' : 'suspended'

    try {
      await supabase
        .from('profiles')
        .update({ is_active: nextStatus, account_status: nextAccStatus })
        .eq('id', doctor.doctor_id)

      if (doctor.clinic_id) {
        await supabase
          .from('hospitals')
          .update({ status: nextStatus ? 'active' : 'suspended' })
          .eq('id', doctor.clinic_id)
      }

      setIndividualDoctorsList(prev => prev.map(d => d.doctor_id === doctor.doctor_id ? { ...d, is_active: nextStatus, account_status: nextAccStatus } : d))
      setNotice(`Status for Dr. ${doctor.doctor_name} updated to ${nextStatus ? 'ACTIVE' : 'SUSPENDED'}`)
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice(`Failed to update status: ${err.message}`)
    }
  }

  // Handle Hospital Security Action (Block / Ban / Suspend / Unblock)
  const handleExecuteHospitalSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospSecurityModal) return
    const { hospital, action } = hospSecurityModal
    const newStatus = action === 'unblock' ? 'active' : action

    setHospitalsList(prev => prev.map(h => h.id === hospital.id ? { ...h, status: newStatus as any } : h))

    try {
      await supabase.from('hospitals').update({ status: newStatus }).eq('id', hospital.id)
    } catch (err) {
      console.warn('Supabase update hospital status notice:', err)
    }

    const logItem = {
      id: `log-${Date.now()}`,
      category: 'Security & Compliance',
      time: 'Just now',
      actor: 'Platform Super Admin',
      action: `${action.toUpperCase()} applied to hospital "${hospital.name}" (${hospital.id}) - Reason: ${hospSecurityReason}`,
      ip: '127.0.0.1',
      status: 'Success'
    }
    setAuditLogs(prev => [logItem, ...prev])
    setNotice(`Hospital "${hospital.name}" security status updated to ${newStatus.toUpperCase()}!`)
    setTimeout(() => setNotice(null), 4000)
    setHospSecurityModal(null)
  }

  // Toggle status
  const handleToggleStatus = (id: string) => {
    const updated = hospitalsList.map(h => {
      if (h.id === id) {
        const nextStatus: 'active' | 'suspended' = h.status === 'active' ? 'suspended' : 'active'
        return { ...h, status: nextStatus }
      }
      return h
    })
    setHospitalsList(updated)
    localStorage.setItem('clinicos_hospitals', JSON.stringify(updated))
    setNotice('Hospital status updated.')
    setTimeout(() => setNotice(null), 3000)
  }

  // Delete Hospital — previously this only filtered local React state and a
  // localStorage cache, never touching Supabase at all, so the hospital
  // reappeared on every refresh once loadPlatformData() re-fetched the real
  // (unchanged) table. Now actually deletes the row; RLS's "Super Admin full
  // access to hospitals" policy authorizes this for the real super_admin
  // session. Cascades (ON DELETE CASCADE) to every hospital-owned table —
  // doctors, patients, appointments, qr_codes, departments — irreversibly.
  const handleDeleteHospital = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" permanently? This also deletes every doctor, patient, appointment, and QR code under it. This cannot be undone.`)) return

    const { error } = await supabase.from('hospitals').delete().eq('id', id)
    if (error) {
      alert(`Could not delete "${name}": ${error.message}`)
      return
    }

    const updated = hospitalsList.filter(h => h.id !== id)
    setHospitalsList(updated)
    localStorage.setItem('clinicos_hospitals', JSON.stringify(updated))
    setNotice(`Hospital "${name}" permanently deleted.`)
    setTimeout(() => setNotice(null), 3000)
  }

  // Edit hospital submit
  const handleSaveEditHospital = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHospital) return
    const updated = hospitalsList.map(h => h.id === editingHospital.id ? editingHospital : h)
    setHospitalsList(updated)
    localStorage.setItem('clinicos_hospitals', JSON.stringify(updated))
    setEditingHospital(null)
    setNotice('Hospital profile details updated.')
    setTimeout(() => setNotice(null), 3000)
  }

  // Lead status updater
  const handleUpdateLeadStatus = (leadId: string, nextStatus: 'new' | 'contacted' | 'converted') => {
    const updated = leadsList.map(l => l.id === leadId ? { ...l, status: nextStatus } : l)
    setLeadsList(updated)
    localStorage.setItem('clinicos_leads', JSON.stringify(updated))
    setNotice(`Lead status updated to ${nextStatus.toUpperCase()}`)
    setTimeout(() => setNotice(null), 3000)
  }

  // Add Department
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault()
    const newDept: DepartmentItem = {
      id: `dept-${Date.now().toString().slice(-3)}`,
      name: newDeptForm.name,
      headDoctor: newDeptForm.headDoctor || 'Specialist Doctor',
      hospitalsCount: hospitalsList.length,
      activeDoctors: 0,
      avgWaitMins: Number(newDeptForm.avgWaitMins) || 10,
      todayConsults: 0,
      status: 'optimal'
    }
    const updated = [newDept, ...departmentsList]
    setDepartmentsList(updated)
    localStorage.setItem('clinicos_departments', JSON.stringify(updated))
    setShowAddDepartmentModal(false)
    setNewDeptForm({ name: '', headDoctor: '', avgWaitMins: 10 })
    setNotice(`Department "${newDept.name}" added.`)
    setTimeout(() => setNotice(null), 3000)
  }

  // Add Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    const newAnn: AnnouncementItem = {
      id: `ann-${Date.now().toString().slice(-4)}`,
      title: newAnnouncementForm.title,
      message: newAnnouncementForm.message,
      audience: newAnnouncementForm.audience,
      priority: newAnnouncementForm.priority,
      createdAt: 'Just now',
      active: true
    }
    const updated = [newAnn, ...announcementsList]
    setAnnouncementsList(updated)
    localStorage.setItem('clinicos_announcements', JSON.stringify(updated))
    setShowAnnouncementModal(false)
    setNewAnnouncementForm({ title: '', message: '', audience: 'All Hospitals', priority: 'Update' })
    setNotice('Platform announcement broadcasted live to all dashboards!')
    setTimeout(() => setNotice(null), 3000)
  }

  // Toggle Doctor Active / Suspended Status
  const handleToggleDoctorStatus = async (doctor: DoctorItem) => {
    const nextActive = !doctor.is_active
    const nextAccStatus = nextActive ? 'active' : 'suspended'
    try {
      await supabase
        .from('profiles')
        .update({ is_active: nextActive, account_status: nextAccStatus })
        .eq('id', doctor.id)

      setDoctorsList(prev => prev.map(d => d.id === doctor.id ? {
        ...d,
        is_active: nextActive,
        account_status: nextAccStatus,
        status: nextActive ? 'online' : 'off_duty'
      } : d))
      setNotice(`Status for Dr. ${doctor.name} updated to ${nextActive ? 'ACTIVE' : 'SUSPENDED'}`)
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice(`Failed to update doctor status: ${err.message}`)
    }
  }

  // Filtered lists
  const filteredHospitals = hospitalsList.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDoctors = doctorsList.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.doctor_code && d.doctor_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.auth_provider && d.auth_provider.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredLogs = auditLogs.filter(l =>
    (activityCategoryFilter === 'All' || l.category === activityCategoryFilter) &&
    (l.action.toLowerCase().includes(searchQuery.toLowerCase()) || l.actor.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (checkingOwnerSession) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
        <p className="text-white/40 text-sm font-semibold">Checking session…</p>
      </div>
    )
  }

  if (!isOwnerAuthenticated) {
    return (
      <main
        onMouseMove={handleMouseMove}
        className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0A0C14] px-4 py-8 font-sans text-slate-100 selection:bg-indigo-500/30 select-none"
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.25) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated glowing liquid background blobs */}
        <motion.div
          style={{ x: glowX, y: glowY }}
          className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none"
        />

        <motion.div
          className="absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-purple-600/20 blur-[130px] pointer-events-none"
          animate={{
            x: [0, -80, 40, 0],
            y: [0, 60, -50, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="absolute -bottom-48 left-1/3 h-[520px] w-[520px] rounded-full bg-blue-600/15 blur-[150px] pointer-events-none"
          animate={{
            x: [0, 60, -60, 0],
            y: [0, -50, 30, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating glass particles */}
        {[...Array(14)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full border border-white/20 bg-white/10 backdrop-blur-md pointer-events-none"
            style={{
              width: `${5 + (index % 4) * 4}px`,
              height: `${5 + (index % 4) * 4}px`,
              left: `${(index * 14 + 5) % 95}%`,
              top: `${(index * 19 + 7) % 90}%`,
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.15, 0.65, 0.15],
              scale: [1, 1.35, 1],
            }}
            transition={{
              duration: 4.5 + index,
              delay: index * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Main liquid glass card container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 50, filter: 'blur(20px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 130, damping: 20, mass: 0.8 }}
          className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/15 bg-white/[0.04] shadow-[0_32px_100px_rgba(0,0,0,0.6)] backdrop-blur-[45px] lg:grid-cols-[1fr_1.1fr]"
        >
          {/* Moving liquid glass reflection */}
          <motion.div
            animate={{ x: ['-120%', '200%'] }}
            transition={{ duration: 7, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-y-0 z-20 w-[35%] -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl"
          />

          {/* LEFT PANEL: Super Admin Feature Showcase */}
          <section className="relative hidden min-h-[580px] overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between text-left bg-gradient-to-b from-white/[0.02] to-transparent">
            {/* Top Brand Logo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 20 }}
              className="relative z-10 flex items-center gap-3.5"
            >
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div
                  animate={{ rotate: [0, 3, -3, 0], y: [0, -3, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-13 w-13 items-center justify-center rounded-[18px] border border-white/20 bg-white/10 shadow-[0_12px_32px_rgba(99,102,241,0.25)] backdrop-blur-xl group-hover:scale-105 transition-transform"
                >
                  <img src="/assets/brand-icon.png" alt="MedTech Fixaters Logo" className="h-8 w-8 object-contain" />
                </motion.div>

                <div>
                  <p className="text-base font-black tracking-tight text-white">
                    MedTech Fixaters
                  </p>
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                    Platform Master Console
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Middle Value Proposition Cards */}
            <div className="relative z-10 space-y-6 my-auto py-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
                <span>Super Admin Authorization Required</span>
              </div>

              <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                Global Infrastructure & Tenant Management
              </h2>

              <p className="text-xs text-white/60 leading-relaxed font-medium">
                Master control portal for provisioned OPD hospitals, live queue telemetry, doctor quota management, and platform-wide analytics.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Server size={14} />
                    <span className="text-xs font-bold text-white">Multi-Tenant</span>
                  </div>
                  <p className="text-[11px] text-white/50">Full database & schema isolation</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Activity size={14} />
                    <span className="text-xs font-bold text-white">Live Monitoring</span>
                  </div>
                  <p className="text-[11px] text-white/50">Real-time OPD patient flow</p>
                </div>
              </div>
            </div>

            {/* Bottom Status Indicator */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/40 font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Platform Cluster Active</span>
              </div>
              <span className="text-[11px] font-mono text-white/30">v2.4.0 • Enterprise</span>
            </div>
          </section>

          {/* RIGHT PANEL: Login Form */}
          <section className="relative p-8 sm:p-10 flex flex-col justify-center text-left">
            {/* Top Header Mobile */}
            <div className="mb-6 lg:hidden flex items-center gap-3">
              <img src="/assets/brand-icon.png" alt="Logo" className="w-8 h-8 object-contain" />
              <div>
                <h2 className="text-sm font-black text-white">MedTech Fixaters</h2>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Super Admin OS</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold tracking-wide uppercase">
                <Key size={12} />
                <span>Restricted Master Access</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Platform Sign In
              </h1>
              <p className="text-xs text-white/50">
                Enter your authorized Super Admin credentials to unlock control tools.
              </p>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-950/30"
              >
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <form onSubmit={handleOwnerLogin} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 flex items-center justify-between">
                  <span>Super Admin Email</span>
                  <span className="text-[10px] font-normal text-white/40">Verified domain</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@medtechfixaters.in"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/15 rounded-2xl text-white text-sm focus:outline-none focus:border-indigo-400 focus:bg-white/[0.09] transition placeholder:text-white/20 shadow-inner"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 flex items-center justify-between">
                  <span>Master Access Password</span>
                </label>
                <div className="relative">
                  <LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-white/[0.06] border border-white/15 rounded-2xl text-white text-sm focus:outline-none focus:border-indigo-400 focus:bg-white/[0.09] transition placeholder:text-white/20 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={ownerLoginLoading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {ownerLoginLoading ? (
                  <span>Verifying Authorization…</span>
                ) : (
                  <>
                    <span>Unlock Master Panel</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs">
              <Link to="/" className="text-white/40 hover:text-white transition flex items-center gap-1.5 font-medium">
                <ArrowLeft size={14} />
                <span>Return to Homepage</span>
              </Link>
              <span className="text-[11px] text-white/30">End-to-End Encrypted</span>
            </div>
          </section>
        </motion.div>
      </main>
    )
  }

  // ----------------------------------------------------
  // FULL ACTIVE CLEAN SUPER ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 font-sans flex antialiased selection:bg-indigo-500 selection:text-white">

      {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 fixed top-0 bottom-0 left-0 z-30 overflow-y-auto shadow-sm">
        <div className="p-5 space-y-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/assets/brand-icon.png" alt="MedTech Fixaters Logo" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
            <div>
              <h2 className="font-black text-base text-slate-900 tracking-tight leading-none">MedTech Fixaters</h2>
              <span className="text-[11px] font-semibold text-slate-400">Platform Admin</span>
            </div>
          </Link>

          {/* Badge */}
          <div className="px-3 py-2 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-2 text-indigo-700">
            <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
            <span className="text-xs font-bold">Super Admin Panel</span>
          </div>

          {/* Nav Categories */}
          <div className="space-y-6 text-xs">
            {/* OVERVIEW */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">OVERVIEW</span>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <Layers size={16} /> },
                { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
                { id: 'revenue', label: 'Revenue', icon: <CreditCard size={16} /> },
                { id: 'activity', label: 'Activity Logs', icon: <Activity size={16} /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                    activeNav === item.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* HOSPITAL & CLIENT MANAGEMENT */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">CLIENT & CLINIC MANAGEMENT</span>
              {[
                { id: 'hospitals', label: 'Hospitals', icon: <Building2 size={16} /> },
                { id: 'individual_doctors', label: 'Individual Doctors', icon: <Stethoscope size={16} /> },
                { id: 'create-hospital', label: 'Add New Client', icon: <Plus size={16} />, isAction: true },
                { id: 'hospital-admins', label: 'Hospital Admins', icon: <UserCheck size={16} /> },
                { id: 'departments', label: 'Departments', icon: <Sliders size={16} /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isAction) {
                      setShowCreateHospitalModal(true)
                    } else {
                      setActiveNav(item.id)
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all ${
                    activeNav === item.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.isAction && <span className="text-slate-400 hover:text-indigo-600 font-bold">+</span>}
                </button>
              ))}
            </div>

            {/* USER MANAGEMENT */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">USER MANAGEMENT</span>
              {[
                { id: 'doctors', label: 'Doctors', icon: <Stethoscope size={16} /> },
                { id: 'staff', label: 'Staff', icon: <Users size={16} /> },
                { id: 'patients', label: 'Patients', icon: <Users size={16} /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                    activeNav === item.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* PLATFORM */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">PLATFORM</span>
              {[
                { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard size={16} /> },
                { id: 'plans', label: 'Plans & Pricing', icon: <CreditCard size={16} /> },
                { id: 'features', label: 'Feature Settings', icon: <Settings size={16} /> },
                { id: 'integrations', label: 'Integrations', icon: <Layers size={16} /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                    activeNav === item.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* SUPPORT & ENGAGEMENT */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">SUPPORT & ENGAGEMENT</span>
              {[
                { id: 'leads', label: 'Leads', icon: <TrendingUp size={16} />, badge: leadsList.filter(l => l.status === 'new').length },
                { id: 'support', label: 'Support Tickets', icon: <AlertCircle size={16} />, badge: ticketsList.filter(t => t.status === 'open').length },
                { id: 'announcements', label: 'Announcements', icon: <Radio size={16} />, badge: announcementsList.length },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all ${
                    activeNav === item.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badge) && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            <Globe size={14} />
            <span>Public Website</span>
          </Link>
          <button
            onClick={handleOwnerLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
          >
            <LogOut size={14} />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex-1 ml-64 min-h-screen p-6 sm:p-8 space-y-6">

        {/* Toast alert notification */}
        {notice && (
          <div className="fixed top-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-bounce">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{notice}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 relative z-20">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Welcome back, Platform Administrator 👋</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input (⌘ K) */}
            <div className="relative w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search registered hospitals, doctors, logs..."
                className="w-full pl-9 pr-12 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 cursor-pointer">
                ⌘ K
              </span>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm transition"
              >
                <Bell size={16} />
              </button>
              {announcementsList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white pointer-events-none">
                  {announcementsList.length}
                </span>
              )}

              {/* Notifications Popup Drawer */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">System Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 text-xs hover:text-slate-700">Close</button>
                  </div>
                  <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                    {announcementsList.length === 0 ? (
                      <p className="text-slate-400 text-xs py-4 text-center">No unread alerts or notifications.</p>
                    ) : (
                      announcementsList.map(n => (
                        <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                          <p className="font-bold text-slate-800 text-[11px]">{n.title}</p>
                          <p className="text-[10px] text-slate-500">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-80 transition"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs ring-2 ring-indigo-500/20">
                  PA
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-slate-800 leading-none">Platform Owner</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Super Admin</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 text-xs space-y-1 z-50">
                  <button onClick={() => { setActiveNav('features'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                    <Settings size={14} /> Feature Settings
                  </button>
                  <button onClick={() => { setShowSystemHealthModal(true); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
                    <Activity size={14} /> System Health
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={handleOwnerLogout} className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-bold text-rose-600 flex items-center gap-2">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── VIEW 1: DASHBOARD (CLEAN & DYNAMIC) ─────────────── */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            {/* Top 5 KPI Cards (Calculated from Real Data) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  title: 'Total Hospitals',
                  value: totalHospitals.toString(),
                  badge: totalHospitals > 0 ? `${totalHospitals} Registered` : 'No Hospitals',
                  icon: <Building2 size={18} className="text-indigo-600" />,
                  iconBg: 'bg-indigo-50 text-indigo-600',
                  onClick: () => setActiveNav('hospitals')
                },
                {
                  title: 'Total Doctors',
                  value: totalDoctors.toString(),
                  badge: totalDoctors > 0 ? `${totalDoctors} Active` : '0 Active',
                  icon: <Users size={18} className="text-blue-600" />,
                  iconBg: 'bg-blue-50 text-blue-600',
                  onClick: () => setActiveNav('doctors')
                },
                {
                  title: 'Total Patients',
                  value: '0',
                  badge: 'Live Database Clean',
                  icon: <ShieldCheck size={18} className="text-emerald-600" />,
                  iconBg: 'bg-emerald-50 text-emerald-600',
                  onClick: () => setActiveNav('patients')
                },
                {
                  title: 'Appointments Today',
                  value: '0',
                  badge: '0 Queue In Progress',
                  icon: <Calendar size={18} className="text-amber-600" />,
                  iconBg: 'bg-amber-50 text-amber-600',
                  onClick: () => setActiveNav('analytics')
                },
                {
                  title: 'Revenue (MTD)',
                  value: `₹${totalRevenue.toLocaleString('en-IN')}`,
                  badge: totalRevenue > 0 ? 'Active Subscriptions' : '₹0 Collected',
                  icon: <CreditCard size={18} className="text-purple-600" />,
                  iconBg: 'bg-purple-50 text-purple-600',
                  onClick: () => setActiveNav('revenue')
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  onClick={card.onClick}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:border-indigo-200 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                      {card.icon}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.title}</span>
                  </div>

                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight block">{card.value}</span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                      <TrendingUp size={11} className="text-indigo-600" /> {card.badge}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* Middle Row: Appointments Chart + Recent Hospitals + Quick Actions */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Appointments Overview (6 Cols) */}
              <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Appointments Overview</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChartDateRange(chartDateRange === 'Current Period' ? 'Previous Period' : 'Current Period')}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1 transition"
                    >
                      {chartDateRange} <ChevronDown size={12} />
                    </button>
                    <button
                      onClick={() => setChartFreq(chartFreq === 'Daily' ? 'Weekly' : chartFreq === 'Weekly' ? 'Monthly' : 'Daily')}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1 transition"
                    >
                      {chartFreq} <ChevronDown size={12} />
                    </button>
                  </div>
                </div>

                {/* Clean Zero Baseline Chart / Empty State */}
                <div className="h-60 w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <BarChart3 size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No Patient Queue Activity Recorded Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">When registered hospitals begin OPD check-ins, real-time consultation spline metrics will render here.</p>
                </div>
              </div>

              {/* Recent Hospitals Table (4 Cols) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900">Recent Hospitals ({hospitalsList.length})</h3>
                  <button onClick={() => setActiveNav('hospitals')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    View All
                  </button>
                </div>

                <div className="space-y-2 overflow-x-auto">
                  {hospitalsList.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-600">No Hospitals Registered</p>
                      <p className="text-[11px] text-slate-400">Click below to create your first hospital tenant.</p>
                      <button
                        onClick={() => setShowCreateHospitalModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow mt-2"
                      >
                        + Register Hospital
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                          <th className="pb-2 font-bold">Hospital Name</th>
                          <th className="pb-2 font-bold">Location</th>
                          <th className="pb-2 font-bold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {filteredHospitals.slice(0, 5).map(h => (
                          <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 pr-2 font-bold text-slate-800 truncate max-w-[120px]">{h.name}</td>
                            <td className="py-2.5 text-slate-500 text-[11px] truncate max-w-[90px]">{h.location}</td>
                            <td className="py-2.5 text-right">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full capitalize ${
                                h.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Quick Actions & System Health (2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Quick Actions Card (Gradient Blue) */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-wider text-indigo-100">Quick Actions</h4>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { label: 'Create Hospital', action: () => setShowCreateHospitalModal(true), icon: '+ ' },
                      { label: 'Invite Hospital Admin', action: () => setShowInviteAdminModal(true), icon: '👥 ' },
                      { label: 'Add Platform Notice', action: () => setShowAnnouncementModal(true), icon: '📢 ' },
                      { label: 'Create Pricing Tier', action: () => setShowPricingModal(true), icon: '💳 ' },
                      { label: 'View Activity Logs', action: () => setActiveNav('activity'), icon: '📋 ' },
                    ].map((act, i) => (
                      <button
                        key={i}
                        onClick={act.action}
                        className="w-full text-left py-2 px-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold flex items-center justify-between transition"
                      >
                        <span>{act.icon}{act.label}</span>
                        <ChevronRight size={13} className="text-white/60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Health Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">System Health</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Platform Engine', val: 'Online', dot: 'bg-emerald-500', c: 'text-emerald-600' },
                      { label: 'Postgres Vault', val: 'Clean / Ready', dot: 'bg-emerald-500', c: 'text-emerald-600' },
                      { label: 'WhatsApp Gateway', val: 'Standby', dot: 'bg-emerald-500', c: 'text-emerald-600' },
                      { label: 'ABDM Signing', val: 'Compliant', dot: 'bg-emerald-500', c: 'text-emerald-600' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                        <span className={`text-[11px] font-bold ${s.c}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowSystemHealthModal(true)}
                    className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold rounded-xl border border-slate-200 transition"
                  >
                    View System Status
                  </button>
                </div>
              </div>

            </section>

            {/* Bottom Section: Revenue + Top Hospitals + Platform Activity */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Revenue Overview */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900">Revenue Overview</h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                    Live Total
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</span>
                  <span className="text-2xl font-black text-slate-900 block leading-none">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold text-slate-500">Based on {hospitalsList.length} registered hospital subscriptions.</span>
                </div>
              </div>

              {/* Top Performing Hospitals */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900">Top Performing Hospitals</h3>
                  <button onClick={() => setActiveNav('hospitals')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    View All
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {hospitalsList.length === 0 ? (
                    <p className="text-slate-400 text-center py-6 text-xs">No active hospitals registered.</p>
                  ) : (
                    hospitalsList.slice(0, 3).map(h => (
                      <div key={h.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="font-bold text-slate-800">{h.name}</span>
                        <span className="font-black text-indigo-600">{h.plan}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Platform Activity */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900">Platform Activity</h3>
                  <button onClick={() => setActiveNav('activity')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    View All
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {auditLogs.length === 0 ? (
                    <p className="text-slate-400 text-center py-6 text-xs">No recent activity logs.</p>
                  ) : (
                    auditLogs.slice(0, 4).map((act, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-indigo-600" />
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold text-slate-700 leading-tight">{act.action}</p>
                          <span className="text-[9px] text-slate-400 font-medium">{act.time} • {act.actor}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </section>

            {/* Bottom Clean Platform Banner */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-2xl">
                  🖥️
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">MedTech Fixaters Platform Infrastructure</h3>
                  <p className="text-xs text-slate-500 font-medium">Clean live environment ready for hospital onboarding and clinical operations.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div>
                  <span className="text-lg font-black text-slate-900 block">{totalHospitals}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hospitals</span>
                </div>
                <div>
                  <span className="text-lg font-black text-slate-900 block">{totalDoctors}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Doctors</span>
                </div>
                <div>
                  <span className="text-lg font-black text-slate-900 block">100%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">System Ready</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ─── VIEW 2: ANALYTICS SUITE (CLEAN) ─────────────────── */}
        {activeNav === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Platform Clinical Analytics</h2>
                <p className="text-xs text-slate-500">Cross-hospital OPD throughput, department load, and patient queue metrics.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { title: 'Total Consultations', val: '0', sub: 'No consults logged today' },
                { title: 'Avg Wait Turnaround', val: '0 min', sub: 'Real-time telemetry standby' },
                { title: 'Patient Retention', val: '0%', sub: 'Awaiting clinical data' },
                { title: 'Peak OPD Window', val: 'Standby', sub: '0 active sessions' },
              ].map((k, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{k.title}</span>
                  <span className="text-2xl font-black text-slate-900 block">{k.val}</span>
                  <span className="text-[10px] font-bold text-slate-400">{k.sub}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <BarChart3 size={36} className="mx-auto text-slate-300" />
              <h3 className="font-black text-base text-slate-800">Clean Analytics Environment</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No mock records found. When doctors start consultations and patients check in via QR kiosks, charts and productivity metrics will appear automatically.
              </p>
            </div>
          </div>
        )}

        {/* ─── VIEW 3: REVENUE & FINANCE (CLEAN) ───────────────── */}
        {activeNav === 'revenue' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Platform Revenue & Billing Suite</h2>
                <p className="text-xs text-slate-500">Real-time subscription collections, Razorpay settlements, and payout logs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Total Revenue MTD', val: `₹${totalRevenue.toLocaleString('en-IN')}`, badge: `${hospitalsList.length} Active Accounts` },
                { title: 'Active Paid Accounts', val: hospitalsList.length.toString(), badge: 'Monthly Auto-Renewal' },
                { title: 'Settlement Status', val: 'Standby', badge: 'Razorpay Gateway Ready' },
              ].map((f, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{f.title}</span>
                  <span className="text-2xl font-black text-slate-900 block">{f.val}</span>
                  <span className="text-[10px] font-bold text-indigo-600">{f.badge}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-900">Hospital Billing Ledger ({hospitalsList.length})</h3>
              </div>
              {hospitalsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CreditCard size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No Invoices Generated Yet</p>
                  <p className="text-[11px]">When hospitals are registered, their subscription invoices will be logged here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Hospital Tenant</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Joined On</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hospitalsList.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-black text-slate-900">{h.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{h.plan}</td>
                        <td className="py-3 px-4 font-black text-indigo-600">₹{(h.revenue || (h.plan === 'Enterprise' ? 7999 : h.plan === 'Hospital Pro' ? 2499 : 999)).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-500">{h.joinedOn}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 4: ACTIVITY AUDIT LOGS (CLEAN) ─────────────── */}
        {activeNav === 'activity' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Platform Security & Audit Trail</h2>
                <p className="text-xs text-slate-500">Immutable chronological stream of administrative events and system telemetry.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {auditLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Activity size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No Activity Logs Yet</p>
                  <p className="text-[11px]">System events and admin operations will be recorded here in real-time.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action Details</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-700">{log.category}</td>
                        <td className="py-3 px-4 font-black text-slate-800">{log.actor}</td>
                        <td className="py-3 px-4 text-slate-600">{log.action}</td>
                        <td className="py-3 px-4 text-slate-400">{log.time}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 5: DEPARTMENTS (CLEAN) ────────────────────── */}
        {activeNav === 'departments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hospital Department Framework ({departmentsList.length})</h2>
                <p className="text-xs text-slate-500">Configure medical specialties, default turnaround times & quotas.</p>
              </div>
              <button
                onClick={() => setShowAddDepartmentModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
              >
                <Plus size={15} /> Add Specialty Department
              </button>
            </div>

            {departmentsList.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Sliders size={32} className="mx-auto text-slate-300" />
                <h3 className="font-black text-base text-slate-800">No Custom Departments Created</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Click below to add standard specialties like Cardiology, Orthopedics, Pediatrics, or Dermatology.</p>
                <button
                  onClick={() => setShowAddDepartmentModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  + Add Specialty
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departmentsList.map(dept => (
                  <div key={dept.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base text-slate-900">{dept.name}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200 uppercase">
                        Optimal
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Head: {dept.headDoctor || 'N/A'}</p>
                    <p className="text-xs text-slate-400">Target Wait: {dept.avgWaitMins} mins</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── VIEW 6: SUBSCRIPTIONS & PLANS (CLEAN) ──────────── */}
        {(activeNav === 'subscriptions' || activeNav === 'plans') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">SaaS Subscription Plans & Pricing</h2>
                <p className="text-xs text-slate-500">Manage tier limits, quota ceilings, and pricing models.</p>
              </div>
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
              >
                <Plus size={15} /> Create Pricing Tier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Single OPD Clinic', price: '₹999', period: '/month', doctors: 'Up to 3 Doctors', features: ['Instant QR Registration', '30-sec WhatsApp Rx', 'Live Queue Display', 'Standard Analytics'] },
                { name: 'Hospital Pro', price: '₹2,499', period: '/month', popular: true, doctors: 'Up to 15 Doctors', features: ['All Single OPD Features', 'Smart Hindi/Eng Voice Calling', 'ABDM M1/M2/M3 Signing', '50K Formulary DB', 'Multi-room TV Display'] },
                { name: 'Multi-Specialty Enterprise', price: '₹7,999', period: '/month', doctors: 'Unlimited Doctors', features: ['All Hospital Pro Features', 'Dedicated Database Cluster', 'Custom Domain & Logo', '24/7 SLA Priority Support', 'Custom HIS/EMR Integration'] },
              ].map((tier, idx) => (
                <div key={idx} className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between space-y-6 ${tier.popular ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-base text-slate-900">{tier.name}</h3>
                      {tier.popular && <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase">Standard</span>}
                    </div>

                    <div>
                      <span className="text-3xl font-black text-slate-900">{tier.price}</span>
                      <span className="text-xs text-slate-500 font-semibold">{tier.period}</span>
                      <span className="block text-xs font-bold text-indigo-600 mt-1">{tier.doctors}</span>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                      {tier.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {hospitalsList.filter(h => h.plan === tier.name).length} Active Hospitals
                    </span>
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── VIEW 7: INTEGRATIONS HUB (CLEAN) ────────────────── */}
        {activeNav === 'integrations' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Master Cloud Integrations & Gateways</h2>
              <p className="text-xs text-slate-500">Configure platform webhook secrets, API endpoints, and cryptographic health gateways.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'WhatsApp Cloud API (Meta)', desc: 'Direct webhook dispatcher for PDF prescriptions & tokens.', key: integrationKeys.whatsappToken, setterKey: 'whatsappToken' as const, status: 'Ready for Credentials', icon: '💬' },
                { name: 'ABDM Production Gateway (M1/M2/M3)', desc: 'Ayushman Bharat Digital Mission cryptographic health records signing.', key: integrationKeys.abdmClientId, setterKey: 'abdmClientId' as const, status: 'Compliant & Standby', icon: '🔒' },
                { name: 'Razorpay Payment & Settlement Engine', desc: 'Automated hospital subscription billing & payout deposits.', key: integrationKeys.razorpayKey, setterKey: 'razorpayKey' as const, status: 'Ready for Live Key', icon: '💳' },
                { name: 'Fast2SMS OTP Failover', desc: 'Secondary fallback for critical token SMS delivery.', key: integrationKeys.smsGatewayKey, setterKey: 'smsGatewayKey' as const, status: 'Ready for Live Key', icon: '📱' },
              ].map((integ, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integ.icon}</span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{integ.name}</h4>
                        <span className="text-[10px] text-indigo-600 font-bold">{integ.status}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{integ.desc}</p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">API Key / Token</label>
                    <input
                      type="password"
                      placeholder="Paste live API key here..."
                      value={integ.key}
                      onChange={e => setIntegrationKeys(p => ({ ...p, [integ.setterKey]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <button
                    onClick={() => { setNotice(`Configuration for ${integ.name} saved.`); setTimeout(() => setNotice(null), 3000); }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                  >
                    Save & Verify Connection →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── VIEW 8: ANNOUNCEMENTS (CLEAN) ───────────────────── */}
        {activeNav === 'announcements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Platform Announcements ({announcementsList.length})</h2>
                <p className="text-xs text-slate-500">Broadcast banner alerts across all connected doctor and hospital admin dashboards.</p>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
              >
                <Plus size={15} /> Create Broadcast Notice
              </button>
            </div>

            {announcementsList.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Radio size={32} className="mx-auto text-slate-300" />
                <h3 className="font-black text-base text-slate-800">No Active Announcements</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Create a broadcast notice to alert all hospital reception desks and doctors simultaneously.</p>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  + Create Notice
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {announcementsList.map(ann => (
                  <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">{ann.title}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded uppercase">
                          {ann.priority}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                          Audience: {ann.audience}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{ann.message}</p>
                      <span className="text-[10px] text-slate-400 font-medium block pt-1">Dispatched {ann.createdAt}</span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = announcementsList.filter(a => a.id !== ann.id)
                        setAnnouncementsList(updated)
                        localStorage.setItem('clinicos_announcements', JSON.stringify(updated))
                        setNotice('Announcement deleted.')
                        setTimeout(() => setNotice(null), 3000)
                      }}
                      className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── VIEW 8.5: INDIVIDUAL DOCTORS & CLINICS DIRECTORY ────── */}
        {activeNav === 'individual_doctors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Individual Doctors & Solo Clinics ({individualDoctorsList.length})</h2>
                <p className="text-xs text-slate-500">Dedicated single-doctor client accounts with unique QR booking and direct patient intake.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setClientTypeToCreate('individual_doctor')
                    setShowCreateHospitalModal(true)
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
                >
                  <Plus size={15} /> Add Individual Doctor
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {individualDoctorsList.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <Stethoscope size={36} className="mx-auto text-slate-300" />
                  <h3 className="font-black text-base text-slate-800">No Individual Doctors Registered Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create your first single-doctor client account or share the signup link with practitioners.
                  </p>
                  <button
                    onClick={() => {
                      setClientTypeToCreate('individual_doctor')
                      setShowCreateHospitalModal(true)
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow mt-2"
                  >
                    + Register Individual Doctor
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Doctor & Practice</th>
                      <th className="py-3 px-4">Doctor ID & Email</th>
                      <th className="py-3 px-4">Specialty & Fee</th>
                      <th className="py-3 px-4">Plan & Onboarding</th>
                      <th className="py-3 px-4">Unique QR Booking</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {individualDoctorsList.map(doc => (
                      <tr key={doc.doctor_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                              🩺
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block text-sm">{doc.doctor_name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{doc.clinic_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-indigo-700 block">{doc.doctor_code}</span>
                          <span className="text-[11px] text-slate-500">{doc.email}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{doc.specialization}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">₹{doc.consultation_fee} / consult</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-black text-[10px] rounded-lg inline-block mb-0.5">
                            {doc.plan_tier}
                          </span>
                          <span className={`text-[10px] block font-bold ${
                            doc.onboarding_status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {doc.onboarding_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 font-mono text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                              {doc.qr_token}
                            </span>
                            <button
                              onClick={() => setSelectedIndividualDoctorForQR(doc)}
                              title="View & Download Unique Doctor QR"
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                            >
                              <QrCode size={12} />
                              <span>QR</span>
                            </button>
                            <button
                              onClick={() => {
                                const fullUrl = `${window.location.origin}/book/${doc.qr_token}`
                                navigator.clipboard.writeText(fullUrl)
                                setNotice(`Copied direct booking link: ${fullUrl}`)
                                setTimeout(() => setNotice(null), 3000)
                              }}
                              title="Copy Direct Patient Booking Link"
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] transition cursor-pointer"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleIndividualDoctorStatus(doc)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                              doc.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            {doc.is_active ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/book/${doc.qr_token}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Test Direct Booking Link"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              onClick={() => setSelectedIndividualDoctorForQR(doc)}
                              title="Doctor QR Standee"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <QrCode size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 9: HOSPITALS & ADMINS DIRECTORY (CLEAN) ────── */}
        {(activeNav === 'hospitals' || activeNav === 'hospital-admins') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hospital Multi-Tenant Directory ({hospitalsList.length})</h2>
                <p className="text-xs text-slate-500">Manage registered clinics, doctor quotas, and login credentials.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowInviteAdminModal(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
                >
                  <UserCheck size={15} /> Invite Admin
                </button>
                <button
                  onClick={() => setShowCreateHospitalModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
                >
                  <Plus size={15} /> Register New Hospital
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {hospitalsList.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <Building2 size={36} className="mx-auto text-slate-300" />
                  <h3 className="font-black text-base text-slate-800">No Hospitals Registered Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The platform database is clean. Register a hospital to auto-generate admin credentials and an intake token.
                  </p>
                  <button
                    onClick={() => setShowCreateHospitalModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow mt-2"
                  >
                    + Register First Hospital
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Hospital Name & ID</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Admin Login</th>
                      <th className="py-3 px-4">Plan & Quota</th>
                      <th className="py-3 px-4">Unique QR Code</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHospitals.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                              🏥
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block text-sm">{h.name}</span>
                              <span className="text-[10px] text-slate-400">{h.id} • Lic: {h.license}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{h.location}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{h.email}</span>
                          <span className="text-[10px] text-slate-400">{h.phone}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-black text-[10px] rounded-lg inline-block mb-0.5">
                            {h.plan}
                          </span>
                          <span className="text-slate-500 text-[10px] block font-semibold">
                            {h.doctor_count} / {h.doctor_limit} Doctors
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 font-mono text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                              {h.qr_token || `QR-${h.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                            </span>
                            <button
                              onClick={() => setSelectedHospitalForQR(h)}
                              title="View & Download Separate Hospital QR"
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition"
                            >
                              <QrCode size={12} />
                              <span>QR</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(h.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition ${
                              h.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            {h.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedHospitalForQR(h)}
                              title="Separate Hospital QR Code"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              onClick={() => setEditingHospital(h)}
                              title="Edit Hospital Profile"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setResettingHospital(h)}
                              title="Reset Password"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"
                            >
                              <Key size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteHospital(h.id, h.name)}
                              title="Delete Hospital"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 10: DOCTORS DIRECTORY (CLEAN) ──────────────── */}
        {activeNav === 'doctors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Consulting Doctors Directory ({doctorsList.length})</h2>
                <p className="text-xs text-slate-500">Live roster of active OPD specialists and private clinic doctors across all hospital tenants.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
                  {doctorsList.filter(d => d.is_active).length} Active / {doctorsList.length} Total
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {doctorsList.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <Stethoscope size={36} className="mx-auto text-slate-300" />
                  <h3 className="font-black text-base text-slate-800">No Doctors Registered Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When hospital administrators or individual clinics onboard doctors, they will automatically appear in this master platform roster.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Doctor Name & ID</th>
                      <th className="py-3 px-4">Hospital / Clinic</th>
                      <th className="py-3 px-4">Specialty</th>
                      <th className="py-3 px-4">Login Email</th>
                      <th className="py-3 px-4">Auth Method</th>
                      <th className="py-3 px-4">Today Consults</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                              Dr
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block text-sm">{doc.name}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">{doc.doctor_code || `ID: ${doc.id.slice(0, 8)}`}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{doc.hospital}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px]">
                            {doc.specialty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-600 block">{doc.email || '—'}</span>
                          {doc.phone && <span className="text-[10px] text-slate-400">{doc.phone}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          {doc.auth_provider === 'Google Auth' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/80 rounded-full text-[10px] font-extrabold shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                              <span>Google Account</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                              {doc.auth_provider || 'Email Auth'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-800">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-extrabold">
                            {doc.todayConsults} Patients
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleDoctorStatus(doc)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                              doc.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title="Click to toggle status"
                          >
                            {doc.is_active ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.phone && (
                              <a
                                href={`https://wa.me/${doc.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold rounded-lg inline-flex items-center gap-1 text-[11px] transition"
                              >
                                <Phone size={11} /> WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => handleToggleDoctorStatus(doc)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                            >
                              {doc.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 11: STAFF & PATIENTS (CLEAN) ───────────────── */}
        {(activeNav === 'staff' || activeNav === 'patients') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">{activeNav === 'staff' ? 'Hospital Nursing & Front Desk Staff' : 'Registered Patient Master Directory'}</h2>
              <p className="text-xs text-slate-500">Cross-tenant operational directory with ABDM compliance metrics.</p>
            </div>

            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
              <Users size={36} className="mx-auto text-slate-300" />
              <h3 className="font-black text-base text-slate-800">No {activeNav === 'staff' ? 'Staff Members' : 'Patients'} Logged</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {activeNav === 'staff'
                  ? 'Receptionists and triage nurses registered by hospital administrators will be listed here.'
                  : 'Patients registering via QR posters or reception check-in will be synchronized here with ABHA metrics.'}
              </p>
            </div>
          </div>
        )}

        {/* ─── VIEW 12: LEADS & INQUIRIES ─────────────────────── */}
        {activeNav === 'leads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hospital Inbound Leads ({leadsList.length})</h2>
                <p className="text-xs text-slate-500">Live prospective clinic registrations & demo requests from public site.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {leadsList.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <TrendingUp size={36} className="mx-auto text-slate-300" />
                  <h3 className="font-black text-base text-slate-800">No Inbound Leads Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When clinics submit contact or demo requests on the homepage, they will appear here instantly with 1-click WhatsApp links.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Doctor / Clinic</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">City & Speciality</th>
                      <th className="py-3 px-4">Inquiry / Note</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leadsList.map((lead, idx) => (
                      <tr key={lead.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 block">{lead.name || 'Anonymous Doctor'}</span>
                          <span className="text-[10px] text-indigo-600 font-bold">{lead.clinic_name || 'Clinic'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{lead.phone}</span>
                          <span className="text-[10px] text-slate-400">{lead.email}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lead.city || 'N/A'} • {lead.speciality || 'General'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {lead.message || 'Interested in live queue software.'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={lead.status || 'new'}
                            onChange={e => handleUpdateLeadStatus(lead.id || '', e.target.value as any)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`https://wa.me/${(lead.phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 inline-flex items-center gap-1"
                          >
                            <Phone size={11} /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 13: SUPPORT TICKETS (CLEAN) ────────────────── */}
        {activeNav === 'support' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Hospital Support Desk ({ticketsList.length})</h2>
              <p className="text-xs text-slate-500">Live operational inquiries from clinic receptionists and doctors.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {ticketsList.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <AlertCircle size={36} className="mx-auto text-slate-300" />
                  <h3 className="font-black text-base text-slate-800">Support Desk Clean & Clear</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Zero open tickets. When hospital staff submit assistance requests, they will appear here for 1-click resolution.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Hospital</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ticketsList.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-black text-indigo-600">{t.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{t.hospital}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{t.subject}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            t.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            t.status === 'open' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setShowTicketModal(t)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow"
                          >
                            Resolve →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 14: FEATURE SETTINGS ──────────────────────── */}
        {activeNav === 'features' && (
          <div className="space-y-6">
            <PlatformAiSettings />

            <div>
              <h2 className="text-xl font-black text-slate-900">Platform Feature Flags & Switchboard</h2>
              <p className="text-xs text-slate-500">Toggle live microservices and operational features across all hospital instances.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'whatsappNotifications' as const, title: 'WhatsApp PDF Delivery Engine', desc: 'Automatic prescription & token delivery via WhatsApp Cloud API.' },
                { key: 'audioVoiceCallouts' as const, title: 'Smart Reception Audio Voice Engine', desc: 'Automated Hindi & English token speech announcements.' },
                { key: 'abdmGateway' as const, title: 'ABDM M1/M2/M3 Gateway Signing', desc: 'Cryptographic ABHA and Ayushman Bharat digital health compliance.' },
                { key: 'aiPrescriptionAssist' as const, title: '50,000+ Smart Formulary Auto-complete', desc: 'Real-time drug interaction warnings and dosage chips.' },
                { key: 'offlineCacheSync' as const, title: 'Offline-First LocalDB Failover', desc: 'Consultation & token issuance continue during ISP outages.' },
                { key: 'maintenanceMode' as const, title: 'Platform Maintenance Mode', desc: 'Lock patient registrations for scheduled core database migrations.' },
              ].map(item => (
                <div key={item.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFeaturesState(p => ({ ...p, [item.key]: !p[item.key] }))
                      setNotice(`${item.title} ${!featuresState[item.key] ? 'ENABLED' : 'DISABLED'}`)
                      setTimeout(() => setNotice(null), 3000)
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-1 ${
                      featuresState[item.key] ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      featuresState[item.key] ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ─── CREATE CLIENT / HOSPITAL / INDIVIDUAL DOCTOR MODAL ──────── */}
      {showCreateHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {clientTypeToCreate === 'individual_doctor' ? (
                  <Stethoscope size={20} className="text-blue-600" />
                ) : (
                  <Building2 size={20} className="text-indigo-600" />
                )}
                <h3 className="text-lg font-black text-slate-900">
                  {clientTypeToCreate === 'individual_doctor' ? 'Onboard Individual Doctor' : 'Register New Hospital'}
                </h3>
              </div>
              <button onClick={() => setShowCreateHospitalModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Client Type Selector */}
            <div className="p-1 bg-slate-100 rounded-2xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setClientTypeToCreate('hospital')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  clientTypeToCreate === 'hospital'
                    ? 'bg-white text-indigo-700 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 size={14} />
                <span>Multi-Specialty Hospital</span>
              </button>
              <button
                type="button"
                onClick={() => setClientTypeToCreate('individual_doctor')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  clientTypeToCreate === 'individual_doctor'
                    ? 'bg-white text-blue-700 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope size={14} />
                <span>Individual Doctor / Clinic</span>
              </button>
            </div>

            {clientTypeToCreate === 'individual_doctor' ? (
              <form onSubmit={handleCreateIndividualDoctor} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Doctor Full Name *</label>
                    <input
                      type="text"
                      required
                      value={individualDoctorForm.doctor_name}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, doctor_name: e.target.value }))}
                      placeholder="Dr. Rajesh Sharma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Clinic / Practice Name *</label>
                    <input
                      type="text"
                      required
                      value={individualDoctorForm.clinic_name}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, clinic_name: e.target.value }))}
                      placeholder="Sharma Dental Clinic"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Doctor Email *</label>
                    <input
                      type="email"
                      required
                      value={individualDoctorForm.email}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="doctor@sharmaclinic.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Password *</label>
                    <input
                      type="password"
                      required
                      value={individualDoctorForm.password}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Secure password"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={individualDoctorForm.phone}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Specialization *</label>
                    <input
                      type="text"
                      required
                      value={individualDoctorForm.specialization}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, specialization: e.target.value }))}
                      placeholder="e.g. Dentist / Dermatologist / Cardiologist"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      required
                      value={individualDoctorForm.consultation_fee}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, consultation_fee: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">City / Location</label>
                    <input
                      type="text"
                      required
                      value={individualDoctorForm.city}
                      onChange={e => setIndividualDoctorForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subscription Plan Tier</label>
                  <select
                    value={individualDoctorForm.plan_tier}
                    onChange={e => setIndividualDoctorForm(p => ({ ...p, plan_tier: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="starter">Starter Plan (₹499/mo) — 1 Doctor + QR Standee</option>
                    <option value="growth">Growth Plan (₹999/mo) — WhatsApp Rx + Audio Speech</option>
                    <option value="pro">Pro Plan (₹1,999/mo) — Full AI Prescriptions + Teleconsults</option>
                    <option value="enterprise">Enterprise (Custom)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateHospitalModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    Create Doctor & Generate QR →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateHospital} className="space-y-3 text-left text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Hospital Name</label>
                    <input
                      type="text"
                      required
                      value={hospitalForm.name}
                      onChange={e => setHospitalForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Metro Care Hospital"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Location / City</label>
                    <input
                      type="text"
                      required
                      value={hospitalForm.location}
                      onChange={e => setHospitalForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Admin Login Email</label>
                    <input
                      type="email"
                      required
                      value={hospitalForm.email}
                      onChange={e => setHospitalForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="admin@metrocare.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Admin Password</label>
                    <input
                      type="password"
                      required
                      value={hospitalForm.password}
                      onChange={e => setHospitalForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Temporary password"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={hospitalForm.phone}
                      onChange={e => setHospitalForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Doctor Limit</label>
                    <input
                      type="number"
                      value={hospitalForm.doctor_limit}
                      onChange={e => setHospitalForm(p => ({ ...p, doctor_limit: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subscription Plan</label>
                  <select
                    value={hospitalForm.plan}
                    onChange={e => setHospitalForm(p => ({ ...p, plan: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Single OPD">Single OPD Clinic (₹999/mo)</option>
                    <option value="Hospital Pro">Hospital Pro (₹2,499/mo)</option>
                    <option value="Enterprise">Multi-Specialty Enterprise (Custom)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateHospitalModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    Create & Issue Credentials →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── ADD DEPARTMENT MODAL ───────────────────────── */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add New Department</h3>
              <button onClick={() => setShowAddDepartmentModal(false)} className="text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialty Name</label>
                <input
                  type="text"
                  required
                  value={newDeptForm.name}
                  onChange={e => setNewDeptForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Cardiology / Orthopedics / Pediatrics"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Head Specialist (Optional)</label>
                <input
                  type="text"
                  value={newDeptForm.headDoctor}
                  onChange={e => setNewDeptForm(p => ({ ...p, headDoctor: e.target.value }))}
                  placeholder="Dr. Full Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Consultation Turnaround (Mins)</label>
                <input
                  type="number"
                  value={newDeptForm.avgWaitMins}
                  onChange={e => setNewDeptForm(p => ({ ...p, avgWaitMins: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDepartmentModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold">Add Specialty →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ANNOUNCEMENT MODAL ─────────────────────────── */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Broadcast Platform Announcement</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAnnouncementForm.title}
                  onChange={e => setNewAnnouncementForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Platform Version v2.7 Rollout"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Audience</label>
                  <select
                    value={newAnnouncementForm.audience}
                    onChange={e => setNewAnnouncementForm(p => ({ ...p, audience: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All Hospitals">All Hospitals</option>
                    <option value="Doctors Only">Doctors Only</option>
                    <option value="Staff Only">Staff Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newAnnouncementForm.priority}
                    onChange={e => setNewAnnouncementForm(p => ({ ...p, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Update">Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  value={newAnnouncementForm.message}
                  onChange={e => setNewAnnouncementForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Announcement text to be displayed across hospital panels..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Broadcast Notice Now →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT HOSPITAL MODAL ─────────────────────────── */}
      {editingHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Edit Hospital Profile</h3>
              <button onClick={() => setEditingHospital(null)} className="text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEditHospital} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={editingHospital.name}
                  onChange={e => setEditingHospital(p => p ? { ...p, name: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  value={editingHospital.location}
                  onChange={e => setEditingHospital(p => p ? { ...p, location: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingHospital.phone}
                    onChange={e => setEditingHospital(p => p ? { ...p, phone: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Doctor Quota Limit</label>
                  <input
                    type="number"
                    value={editingHospital.doctor_limit}
                    onChange={e => setEditingHospital(p => p ? { ...p, doctor_limit: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingHospital(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ───────────────────────── */}
      {resettingHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Reset Admin Password</h3>
              <button onClick={() => setResettingHospital(null)} className="text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-500">Resetting credentials for <strong>{resettingHospital.name}</strong> ({resettingHospital.email}).</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <button
                onClick={() => {
                  setResettingHospital(null)
                  setNewPassword('')
                  setNotice(`Password for ${resettingHospital.email} updated successfully.`)
                  setTimeout(() => setNotice(null), 3000)
                }}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl"
              >
                Confirm & Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INVITE ADMIN MODAL ─────────────────────────── */}
      {showInviteAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Invite Hospital Administrator</h3>
              <button onClick={() => setShowInviteAdminModal(false)} className="text-slate-400"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="doctor.admin@hospital.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Hospital</label>
                <select
                  value={inviteForm.hospitalName}
                  onChange={e => setInviteForm(p => ({ ...p, hospitalName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Choose registered hospital...</option>
                  {hospitalsList.map(h => (
                    <option key={h.id} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setShowInviteAdminModal(false)
                  setNotice(`Invitation link generated and dispatched to ${inviteForm.email || 'administrator'}!`)
                  setTimeout(() => setNotice(null), 3000)
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-2"
              >
                Send Invite Link →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRICING PLAN MODAL ─────────────────────────── */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Create / Modify Pricing Tier</h3>
              <button onClick={() => setShowPricingModal(false)} className="text-slate-400"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Plan Name</label>
                <input
                  type="text"
                  value={pricingPlanForm.name}
                  onChange={e => setPricingPlanForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Polyclinic Super Plus"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={pricingPlanForm.price}
                    onChange={e => setPricingPlanForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Doctor Seats</label>
                  <input
                    type="number"
                    value={pricingPlanForm.doctorLimit}
                    onChange={e => setPricingPlanForm(p => ({ ...p, doctorLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPricingModal(false)
                  setNotice('Pricing plan saved successfully.')
                  setTimeout(() => setNotice(null), 3000)
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Save Pricing Tier →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SYSTEM HEALTH MODAL ────────────────────────── */}
      {showSystemHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">System Telemetry & Health</h3>
              </div>
              <button onClick={() => setShowSystemHealthModal(false)} className="text-slate-400"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              {[
                { name: 'WebSocket Realtime Edge', status: 'Optimal (< 38ms)', uptime: '99.99%', load: '18% CPU' },
                { name: 'PostgreSQL Primary Cluster', status: 'Healthy', uptime: '100%', load: 'Ready' },
                { name: 'WhatsApp Cloud Webhook API', status: 'Connected', uptime: '99.95%', load: '0 Queue Lag' },
                { name: 'ABDM Health Locker Vault', status: 'Compliant (M1/M2/M3)', uptime: '100%', load: 'Encrypted' },
                { name: 'Speech TTS Audio Engine', status: 'Operational', uptime: '99.98%', load: '5ms render' },
              ].map((svc, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-800 block">{svc.name}</span>
                    <span className="text-[10px] text-slate-500">Uptime: {svc.uptime} • Load: {svc.load}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TICKET RESOLUTION MODAL ────────────────────── */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Resolve Ticket: {showTicketModal.id}</h3>
              <button onClick={() => setShowTicketModal(null)} className="text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-800 block">{showTicketModal.hospital}</span>
              <p className="text-slate-600">{showTicketModal.subject}</p>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Resolution Note to Hospital Admin</label>
              <textarea
                rows={3}
                value={ticketReply}
                onChange={e => setTicketReply(e.target.value)}
                placeholder="Enter resolution response..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                onClick={() => {
                  const updated = ticketsList.map(t => t.id === showTicketModal.id ? { ...t, status: 'resolved' as const } : t)
                  setTicketsList(updated)
                  setShowTicketModal(null)
                  setTicketReply('')
                  setNotice(`Ticket ${showTicketModal.id} marked as RESOLVED and response sent.`)
                  setTimeout(() => setNotice(null), 3000)
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2"
              >
                Mark Resolved & Send Response →
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── MODAL: HOSPITAL BLOCK / BAN / SUSPEND / UNBLOCK ─── */}
      {hospSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 size={20} className={hospSecurityModal.action === 'unblock' ? 'text-emerald-600' : 'text-rose-600'} />
                <h3 className="text-base font-black text-slate-900 capitalize">
                  {hospSecurityModal.action} Hospital Tenant
                </h3>
              </div>
              <button onClick={() => setHospSecurityModal(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteHospitalSecurity} className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-sm">
                  Hospital: {hospSecurityModal.hospital.name} ({hospSecurityModal.hospital.id})
                </p>
                <p className="text-slate-500">
                  Plan: {hospSecurityModal.hospital.plan} • Email: {hospSecurityModal.hospital.email}
                </p>
              </div>

              {hospSecurityModal.action !== 'unblock' ? (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                    <p className="font-bold">⚠️ Impact of Blocking this Hospital:</p>
                    <p>
                      All associated Hospital Admins, Doctors, and Staff will immediately have their Supabase Auth sessions revoked and database access restricted.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Select Security Action *</label>
                    <select
                      value={hospSecurityModal.action}
                      onChange={(e) => setHospSecurityModal({ ...hospSecurityModal, action: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="blocked">Block Hospital (Deny All Hospital User Access)</option>
                      <option value="suspended">Suspend Hospital (Billing / Temporary Hold)</option>
                      <option value="banned">Ban Hospital (Permanent Policy Violation)</option>
                      <option value="deleted">Archive / Delete Hospital (Retain Legal Records)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Reason for Action *</label>
                    <textarea
                      rows={2}
                      required
                      value={hospSecurityReason}
                      onChange={(e) => setHospSecurityReason(e.target.value)}
                      placeholder="e.g. Non-payment of subscription, security investigation, or hospital request..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
                  <p className="font-bold">✓ Restoration Rule:</p>
                  <p>
                    Unblocking this hospital will restore Supabase Auth and dashboard access for all eligible hospital admins and doctors. Previously individually banned doctors will remain restricted.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHospSecurityModal(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow ${
                    hospSecurityModal.action === 'unblock' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {hospSecurityModal.action.toUpperCase()} →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DEDICATED SEPARATE HOSPITAL QR KIOSK & STANDEE ─── */}
      {selectedHospitalForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
            {/* Top Close Button */}
            <button
              onClick={() => { setSelectedHospitalForQR(null); setQrCopied(false); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div>
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-inner">
                🏥
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedHospitalForQR.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedHospitalForQR.location} • Plan: {selectedHospitalForQR.plan}
              </p>
            </div>

            {/* QR Poster Preview Box */}
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 shadow-inner flex flex-col items-center space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    `${window.location.origin}/book/${selectedHospitalForQR.qr_token || 'QR-' + selectedHospitalForQR.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
                  )}`}
                  alt={`QR for ${selectedHospitalForQR.name}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Dedicated Intake Token
                </span>
                <span className="text-base font-mono font-black text-indigo-600">
                  {selectedHospitalForQR.qr_token || `QR-${selectedHospitalForQR.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                </span>
              </div>

              {/* Direct Booking URL */}
              <div className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-left flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-600 truncate">
                  {`${window.location.origin}/book/${selectedHospitalForQR.qr_token || 'QR-' + selectedHospitalForQR.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                </span>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/book/${selectedHospitalForQR.qr_token || 'QR-' + selectedHospitalForQR.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
                    navigator.clipboard.writeText(url)
                    setQrCopied(true)
                    setTimeout(() => setQrCopied(false), 3000)
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition"
                >
                  {qrCopied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{qrCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                  `${window.location.origin}/book/${selectedHospitalForQR.qr_token || 'QR-' + selectedHospitalForQR.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
                )}`}
                download={`${selectedHospitalForQR.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Download size={14} />
                <span>PNG</span>
              </a>

              <button
                onClick={() => window.print()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Printer size={14} />
                <span>Print Poster</span>
              </button>

              <a
                href={`${window.location.origin}/book/${selectedHospitalForQR.qr_token || 'QR-' + selectedHospitalForQR.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <ExternalLink size={14} />
                <span>Open Kiosk</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INDIVIDUAL DOCTOR QR STANDEE & DIRECT BOOKING LINK ─── */}
      {selectedIndividualDoctorForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
            {/* Top Close Button */}
            <button
              onClick={() => { setSelectedIndividualDoctorForQR(null); setQrCopied(false); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div>
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-inner">
                🩺
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedIndividualDoctorForQR.doctor_name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedIndividualDoctorForQR.clinic_name} • {selectedIndividualDoctorForQR.specialization}
              </p>
            </div>

            {/* QR Poster Preview Box */}
            <div className="bg-gradient-to-b from-blue-50/70 to-slate-50 p-6 rounded-3xl border-2 border-blue-100 shadow-inner flex flex-col items-center space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    `${window.location.origin}/book/${selectedIndividualDoctorForQR.qr_token}`
                  )}`}
                  alt={`QR for ${selectedIndividualDoctorForQR.doctor_name}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Direct Doctor Intake Token
                </span>
                <span className="text-base font-mono font-black text-blue-700">
                  {selectedIndividualDoctorForQR.qr_token}
                </span>
              </div>

              {/* Direct Booking URL */}
              <div className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-left flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-600 truncate">
                  {`${window.location.origin}/book/${selectedIndividualDoctorForQR.qr_token}`}
                </span>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/book/${selectedIndividualDoctorForQR.qr_token}`
                    navigator.clipboard.writeText(url)
                    setQrCopied(true)
                    setTimeout(() => setQrCopied(false), 3000)
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition cursor-pointer"
                >
                  {qrCopied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{qrCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                  `${window.location.origin}/book/${selectedIndividualDoctorForQR.qr_token}`
                )}`}
                download={`${selectedIndividualDoctorForQR.doctor_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Download size={14} />
                <span>PNG</span>
              </a>

              <button
                onClick={() => window.print()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Standee</span>
              </button>

              <a
                href={`${window.location.origin}/book/${selectedIndividualDoctorForQR.qr_token}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <ExternalLink size={14} />
                <span>Test Booking</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
