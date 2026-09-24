import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export interface DoctorProfile {
  doctor_id: string
  doctor_code: string // Unique Doctor ID e.g. H1-D-0001
  hospital_id: string | null // null only for super_admin, which is hospital-less
  hospital_name: string
  hospital_status: 'active' | 'suspended' | 'blocked' | 'banned' | 'deleted'
  name: string
  email: string
  department_id: string
  department_name: string
  specialization: string
  role: 'doctor' | 'hospital_admin' | 'super_admin' | 'staff'
  account_status: 'active' | 'suspended' | 'blocked' | 'banned' | 'deleted'
  status: 'active' | 'inactive' | 'on_leave'
  client_type?: 'hospital' | 'individual_doctor'
  onboarding_status?: 'PROFILE_INCOMPLETE' | 'PAYMENT_PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
}

interface AuthContextType {
  currentUser: any | null
  doctorProfile: DoctorProfile | null
  userRole: 'hospital_admin' | 'doctor' | 'super_admin' | 'staff' | null
  isLoading: boolean
  error: string | null
  loginWithSupabase: (identifier: string, pass: string, expectedRole?: 'hospital_admin' | 'doctor') => Promise<any>
  sendSupabaseOtp: (identifier: string) => Promise<{ email: string }>
  verifySupabaseOtp: (email: string, otpToken: string, expectedRole?: 'hospital_admin' | 'doctor') => Promise<any>
  registerUserInSupabase: (
    email: string,
    pass: string,
    metadata: {
      role: string
      name: string
      doctor_code?: string
      hospital_id?: string
      department_id?: string
      dept?: string
      fee?: number
      limit?: number
      room?: string
      specialization?: string
    }
  ) => Promise<any>
  logout: () => Promise<void>
  validateActiveSession: () => Promise<boolean>
  refreshDoctorProfile: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Doctor-ID login: exact-match RPC, since anonymous visitors can no longer read
// profile e-mails directly (02_SECURITY_AUDIT_FIXES.sql). The legacy query is only
// used while that migration has not been applied yet (RPC missing: PGRST202).
async function resolveDoctorCodeEmail(doctorCode: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('resolve_login_email', { p_identifier: doctorCode })
  if (!error) return typeof data === 'string' && data ? data : null
  if (error.code !== 'PGRST202') return null

  const { data: legacy } = await supabase
    .from('profiles')
    .select('email, is_active, account_status')
    .eq('doctor_code', doctorCode.toUpperCase())
    .maybeSingle()
  return legacy?.email && legacy.is_active && legacy.account_status === 'active' ? legacy.email : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [userRole, setUserRole] = useState<'hospital_admin' | 'doctor' | 'super_admin' | 'staff' | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Initial Session Load & Two-Layer Status Verification
  const validateUserProfile = async (user: any) => {
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*, hospitals(*)')
        .eq('id', user.id)
        .maybeSingle()

      if (profileErr) {
        console.warn('Profile fetch error:', profileErr.message)
      }

      if (profileData) {
        const role = profileData.role || 'doctor'
        const hospObj = profileData.hospitals
        const hospStatus = hospObj?.status || 'active'
        const accStatus = profileData.account_status || (profileData.is_active ? 'active' : 'blocked')
        const clientType = profileData.client_type || hospObj?.client_type || 'hospital'
        const onboardingStatus = profileData.onboarding_status || 'ACTIVE'

        // Check Layer 1: Individual Profile Active Status
        // Note: Individual doctors undergoing onboarding are allowed to access onboarding wizard
        if (clientType === 'individual_doctor' && (onboardingStatus === 'PROFILE_INCOMPLETE' || onboardingStatus === 'PAYMENT_PENDING')) {
          // Allowed for onboarding
        } else if (!profileData.is_active || accStatus !== 'active') {
          console.warn('Account is inactive or blocked:', accStatus)
          await supabase.auth.signOut()
          setCurrentUser(null)
          setUserRole(null)
          setDoctorProfile(null)
          return false
        }

        // Check Layer 2: Hospital Organization Active Status (non-super_admin)
        if (role !== 'super_admin' && hospStatus !== 'active') {
          console.warn('Hospital is inactive or blocked:', hospStatus)
          await supabase.auth.signOut()
          setCurrentUser(null)
          setUserRole(null)
          setDoctorProfile(null)
          return false
        }

        const hospName = hospObj?.name || user.user_metadata?.hospital_name || (clientType === 'individual_doctor' ? 'Doctor Clinic' : 'Hospital Facility')
        const hospId = profileData.hospital_id || user.user_metadata?.hospital_id || null

        // Never default to a shared tenant bucket — a hospital-less non-admin
        // session must be rejected, not silently pooled with other hospitals.
        if (role !== 'super_admin' && !hospId && clientType !== 'individual_doctor') {
          console.warn('Profile has no hospital_id linked; rejecting session.')
          await supabase.auth.signOut()
          setCurrentUser(null)
          setUserRole(null)
          setDoctorProfile(null)
          return false
        }

        const docCode = profileData.doctor_code || user.user_metadata?.doctor_code || `DOC-${user.id.slice(-4).toUpperCase()}`

        const profile: DoctorProfile = {
          doctor_id: user.id,
          doctor_code: docCode,
          hospital_id: hospId,
          hospital_name: hospName,
          hospital_status: hospStatus,
          name: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Doctor',
          email: user.email || '',
          department_id: profileData.department_id || profileData.department || '',
          department_name: profileData.department || 'General Medicine',
          specialization: profileData.specialization || 'Consultant Specialist',
          role: role,
          account_status: accStatus,
          status: 'active',
          client_type: clientType,
          onboarding_status: onboardingStatus,
        }

        setCurrentUser(user)
        setUserRole(profile.role)
        setDoctorProfile(profile)
        localStorage.setItem('user_role', profile.role)
        localStorage.setItem('hospital_id', hospId || '')
        localStorage.setItem('hospital_name', hospName)
        localStorage.setItem('doctor_id', user.id)
        localStorage.setItem('doctor_code', docCode)
        localStorage.setItem('client_type', clientType)
        localStorage.setItem('onboarding_status', onboardingStatus)
        return true
      }
      return false
    } catch (e) {
      console.warn('Error during validateUserProfile:', e)
      return false
    }
  }

  // Periodic Authorization Heartbeat to terminate sessions if blocked
  const validateActiveSession = async (): Promise<boolean> => {
    if (!currentUser) return false
    return await validateUserProfile(currentUser)
  }

  useEffect(() => {
    // One-time cleanup: older builds cached created users' plaintext passwords here.
    try {
      const raw = localStorage.getItem('clinicos_user_registry')
      if (raw && raw.includes('"password"')) {
        const cleaned = (JSON.parse(raw) as any[]).map(({ password: _pw, ...rest }) => rest)
        localStorage.setItem('clinicos_user_registry', JSON.stringify(cleaned))
      }
    } catch {
      localStorage.removeItem('clinicos_user_registry')
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user) {
          await validateUserProfile(session.user)
        }
      } catch (e) {
        console.warn('Supabase Auth init notice:', e)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await validateUserProfile(session.user)
      } else {
        setCurrentUser(null)
        setUserRole(null)
        setDoctorProfile(null)
      }
    })

    // 60-second periodic heartbeat checking hospital/account status
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const isValid = await validateUserProfile(session.user)
        if (!isValid && window.location.pathname !== '/account-blocked' && window.location.pathname !== '/login') {
          window.location.href = '/account-blocked'
        }
      }
    }, 60000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // 2. SUPABASE PASSWORD AUTHENTICATION WITH TWO-LAYER SECURITY CHECKS
  const loginWithSupabase = async (identifier: string, pass: string, expectedRole?: 'hospital_admin' | 'doctor') => {
    setIsLoading(true)
    setError(null)
    const cleanId = identifier.trim()
    const cleanPass = pass.trim()

    let resolvedEmail = cleanId.toLowerCase()

    try {
      // If identifier is a Doctor ID (e.g. H1-D-0001, H1-CARDIO-01) without @ symbol:
      if (!cleanId.includes('@')) {
        const matchedEmail = await resolveDoctorCodeEmail(cleanId)

        if (typeof matchedEmail === 'string' && matchedEmail) {
          resolvedEmail = matchedEmail.toLowerCase()
        } else {
          // Local registry fallback check
          const localRegistryRaw = localStorage.getItem('clinicos_user_registry')
          const localRegistry: any[] = localRegistryRaw ? JSON.parse(localRegistryRaw) : []
          const found = localRegistry.find(
            (u) =>
              (u.doctor_code && u.doctor_code.toUpperCase() === cleanId.toUpperCase()) ||
              (u.id && u.id.toUpperCase() === cleanId.toUpperCase())
          )

          if (found && found.email) {
            resolvedEmail = found.email.toLowerCase()
          } else {
            throw new Error(`Doctor ID "${cleanId}" not found. Please verify your assigned Doctor ID.`)
          }
        }
      }

      // Step 1: Authenticate strictly with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: cleanPass,
      })

      if (authError || !data?.user) {
        throw new Error(authError?.message || 'Invalid Email / Doctor ID or Password. Please check your credentials.')
      }

      const user = data.user

      // Step 2: Fetch Profile and Hospital Node for Two-Layer Security
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, hospitals(*)')
        .eq('id', user.id)
        .maybeSingle()

      const role = profileData?.role || expectedRole || 'doctor'
      const hospObj = profileData?.hospitals
      const hospStatus = hospObj?.status || 'active'
      const accStatus = profileData?.account_status || (profileData?.is_active ? 'active' : 'blocked')

      // Wrong-portal rejection: a definitively-known role (from the real
      // profiles row or auth metadata, not the expectedRole fallback used
      // only when neither of those set a role) that doesn't match the
      // portal being logged into must be rejected outright, not silently
      // logged into its own real dashboard. Previously the caller
      // (Login.tsx) just redirected based on whatever role came back,
      // which meant the role-selector toggle on the login form was
      // cosmetic — hospital admin credentials on the Doctor Portal (or
      // vice versa) logged in successfully and landed on the correct
      // dashboard for their real role instead of being told to use the
      // right portal, and any authenticated user could then navigate
      // straight to the other portal's URL since routes didn't check role.
      const definitiveRole = profileData?.role
      if (expectedRole && definitiveRole && definitiveRole !== expectedRole && definitiveRole !== 'super_admin') {
        await supabase.auth.signOut()
        setIsLoading(false)
        const portalName = definitiveRole === 'hospital_admin' ? 'Hospital Administration' : definitiveRole === 'doctor' ? 'Doctor' : definitiveRole
        throw new Error(`Wrong portal. This account belongs to ${portalName}. Please use the ${portalName} login.`)
      }

      const clientType = profileData?.client_type || hospObj?.client_type || 'hospital'
      const onboardingStatus = profileData?.onboarding_status || 'ACTIVE'

      // Layer 1 Check: Individual Profile Status
      if (clientType === 'individual_doctor' && (onboardingStatus === 'PROFILE_INCOMPLETE' || onboardingStatus === 'PAYMENT_PENDING')) {
        // Allowed for onboarding
      } else if (profileData && (!profileData.is_active || accStatus !== 'active')) {
        await supabase.auth.signOut()
        setIsLoading(false)
        throw new Error('Access Denied: Your account is currently restricted. Please contact your facility administrator.')
      }

      // Layer 2 Check: Hospital Node Status (non-super_admin)
      if (role !== 'super_admin' && hospStatus !== 'active') {
        await supabase.auth.signOut()
        setIsLoading(false)
        throw new Error('Access Denied: Your facility account is currently unavailable. Please contact the platform administrator.')
      }

      const hospId = profileData?.hospital_id || user.user_metadata?.hospital_id || null

      // super_admin is legitimately hospital-less; every other role must
      // resolve to a real hospital — never silently default to a shared
      // tenant bucket (that was the 'hosp-001' bug: any broken session
      // collapsed onto one shared hospital and could see its data).
      if (role !== 'super_admin' && !hospId && clientType !== 'individual_doctor') {
        await supabase.auth.signOut()
        setIsLoading(false)
        throw new Error('Account setup incomplete: no clinic/hospital is linked to this account. Please contact your platform administrator on /mrshahidbabu.')
      }

      // Mandatory Hospital Registration Verification (/mrshahidbabu)
      if (role === 'hospital_admin') {
        let isRegistered = false

        // Check 1: Join object from profiles query
        if (hospObj && hospObj.id) {
          isRegistered = true
          if (hospObj.status !== 'active') {
            await supabase.auth.signOut()
            setIsLoading(false)
            throw new Error(`Access Denied: Hospital "${hospObj.name}" status is ${hospObj.status}. Please contact Platform Super Admin (/mrshahidbabu).`)
          }
        }

        // Check 2: Direct database query to hospitals table
        if (!isRegistered && hospId) {
          const { data: hospDb } = await supabase
            .from('hospitals')
            .select('id, name, status')
            .eq('id', hospId)
            .maybeSingle()

          if (hospDb && hospDb.id) {
            isRegistered = true
            if (hospDb.status !== 'active') {
              await supabase.auth.signOut()
              setIsLoading(false)
              throw new Error(`Access Denied: Hospital "${hospDb.name}" status is ${hospDb.status}. Please contact Platform Super Admin (/mrshahidbabu).`)
            }
          }
        }

        // Check 3: Registered hospitals list from Super Admin (/mrshahidbabu)
        if (!isRegistered) {
          try {
            const regHospitals: any[] = JSON.parse(localStorage.getItem('clinicos_hospitals') || '[]')
            const matched = regHospitals.find(
              (h: any) =>
                (h.id && h.id === hospId) ||
                (h.email && h.email.toLowerCase() === resolvedEmail.toLowerCase())
            )
            if (matched) {
              isRegistered = true
              if (matched.status && matched.status !== 'active') {
                await supabase.auth.signOut()
                setIsLoading(false)
                throw new Error(`Access Denied: Hospital "${matched.name}" is ${matched.status} on /mrshahidbabu.`)
              }
            }
          } catch (e) {}
        }

        if (!isRegistered) {
          await supabase.auth.signOut()
          setIsLoading(false)
          throw new Error('Access Denied: Only hospitals registered by Super Admin on /mrshahidbabu are allowed to log in.')
        }
      }

      const hospName = hospObj?.name || user.user_metadata?.hospital_name || (clientType === 'individual_doctor' ? 'Doctor Clinic' : 'Hospital Facility')
      const docCode = profileData?.doctor_code || user.user_metadata?.doctor_code || cleanId.toUpperCase()

      const profile: DoctorProfile = {
        doctor_id: user.id,
        doctor_code: docCode,
        hospital_id: hospId,
        hospital_name: hospName,
        hospital_status: hospStatus,
        name: profileData?.full_name || user.user_metadata?.full_name || resolvedEmail.split('@')[0],
        email: resolvedEmail,
        department_id: profileData?.department_id || profileData?.department || '',
        department_name: profileData?.department || 'General Medicine',
        specialization: profileData?.specialization || 'Consultant Specialist',
        role: role as any,
        account_status: accStatus,
        status: 'active',
        client_type: clientType,
        onboarding_status: onboardingStatus,
      }

      setCurrentUser(user)
      setUserRole(role as any)
      setDoctorProfile(profile)
      localStorage.setItem('user_role', role)
      localStorage.setItem('hospital_id', hospId || '')
      localStorage.setItem('hospital_name', hospName)
      localStorage.setItem('doctor_id', user.id)
      localStorage.setItem('doctor_code', docCode)
      localStorage.setItem('client_type', clientType)
      localStorage.setItem('onboarding_status', onboardingStatus)
      setIsLoading(false)
      return { user, profile, role, client_type: clientType, onboarding_status: onboardingStatus }
    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || 'Login failed')
      throw err
    }
  }

  // 2.1 SEND SUPABASE MAIL OTP (6-DIGIT CODE)
  const sendSupabaseOtp = async (identifier: string) => {
    setIsLoading(true)
    setError(null)
    const cleanId = identifier.trim()
    let resolvedEmail = cleanId.toLowerCase()

    try {
      // If identifier is a Doctor ID (e.g. H1-D-0001) without @ symbol:
      if (!cleanId.includes('@')) {
        const matchedEmail = await resolveDoctorCodeEmail(cleanId)

        if (typeof matchedEmail === 'string' && matchedEmail) {
          resolvedEmail = matchedEmail.toLowerCase()
        } else {
          // Local registry fallback
          const localRegistryRaw = localStorage.getItem('clinicos_user_registry')
          const localRegistry: any[] = localRegistryRaw ? JSON.parse(localRegistryRaw) : []
          const found = localRegistry.find(
            (u) =>
              (u.doctor_code && u.doctor_code.toUpperCase() === cleanId.toUpperCase()) ||
              (u.id && u.id.toUpperCase() === cleanId.toUpperCase())
          )
          if (found && found.email) {
            resolvedEmail = found.email.toLowerCase()
          } else {
            throw new Error(`Doctor ID "${cleanId}" not found. Please verify your assigned Doctor ID.`)
          }
        }
      }

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          shouldCreateUser: false,
        },
      })

      if (otpErr) {
        const msg = otpErr.message?.toLowerCase() || ''
        if (msg.includes('signups are not allowed') || msg.includes('signup') || msg.includes('user not found')) {
          // Attempt retry with shouldCreateUser: true in case user registration is permitted
          const { error: retryErr } = await supabase.auth.signInWithOtp({
            email: resolvedEmail,
            options: {
              shouldCreateUser: true,
            },
          })

          if (retryErr) {
            throw new Error(`Account Not Registered: The email/Doctor ID "${cleanId}" was not found in Supabase Auth. Please verify your credentials or ask your hospital administrator to register your email on /mrshahidbabu.`)
          }
        } else {
          throw new Error(otpErr.message || 'Could not send Mail OTP code.')
        }
      }

      setIsLoading(false)
      return { email: resolvedEmail }
    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || 'Could not send OTP code.')
      throw err
    }
  }

  // 2.2 VERIFY SUPABASE MAIL OTP
  const verifySupabaseOtp = async (email: string, otpToken: string, expectedRole?: 'hospital_admin' | 'doctor') => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpToken.trim(),
        type: 'email',
      })

      if (error || !data?.user) {
        throw new Error(error?.message || 'Invalid or expired 6-digit OTP code.')
      }

      const user = data.user

      // Check role gate
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const definitiveRole = profileData?.role
      if (expectedRole && definitiveRole && definitiveRole !== expectedRole && definitiveRole !== 'super_admin') {
        await supabase.auth.signOut()
        setIsLoading(false)
        const portalName = definitiveRole === 'hospital_admin' ? 'Hospital Administration' : definitiveRole === 'doctor' ? 'Doctor' : definitiveRole
        throw new Error(`Wrong portal. This account belongs to ${portalName}. Please use the ${portalName} login.`)
      }

      setIsLoading(false)
      return { user, role: definitiveRole }
    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || 'OTP verification failed.')
      throw err
    }
  }

  // 3. REGISTER USER IN SUPABASE AUTH & PROFILES TABLE
  const registerUserInSupabase = async (
    email: string,
    pass: string,
    metadata: {
      role: string
      name: string
      doctor_code?: string
      hospital_id?: string
      department_id?: string
      dept?: string
      fee?: number
      limit?: number
      room?: string
      specialization?: string
    }
  ) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = pass.trim()
    const docCode = metadata.doctor_code || `H1-D-${Date.now().toString().slice(-4)}`

    // Validate UUID format so PostgreSQL trigger (hospital_id)::uuid never fails
    const isUUID = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str || '')
    
    let rawHospId = metadata.hospital_id || doctorProfile?.hospital_id || localStorage.getItem('hospital_id') || ''
    
    // If still not a valid UUID, attempt resolution from current session profile
    if (!isUUID(rawHospId) && currentUser?.id) {
      try {
        const { data: cp } = await supabase.from('profiles').select('hospital_id').eq('id', currentUser.id).maybeSingle()
        if (cp?.hospital_id && isUUID(cp.hospital_id)) {
          rawHospId = cp.hospital_id
        }
      } catch {}
    }

    const validHospitalId = isUUID(rawHospId) ? rawHospId : null
    if (!validHospitalId && metadata.role !== 'super_admin') {
      throw new Error('No active Hospital ID found. Please make sure you are logged into an active Hospital Administrator session.')
    }

    let createdUserId: string | null = null
    // Collected so the real failure reason can reach the caller instead of
    // a generic "please try again" — both steps below used to only
    // console.warn their errors, which meant diagnosing a failure required
    // opening DevTools every time.
    const failureReasons: string[] = []

    try {
      // Step A: Creation via the server-side admin-ops Edge Function, which
      // holds the service_role key ONLY server-side and independently
      // re-checks that the caller (current session) is a hospital_admin for
      // this exact hospital_id (or super_admin) before creating anything —
      // see supabase/functions/admin-ops/index.ts. Never call the service
      // role directly from the browser.
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-ops', {
          body: {
            action: 'create_doctor_auth_user',
            payload: {
              email: cleanEmail,
              password: cleanPass,
              full_name: metadata.name,
              role: metadata.role,
              doctor_code: docCode,
              hospital_id: validHospitalId,
              department_id: metadata.department_id,
              department: metadata.dept || 'General',
              specialization: metadata.specialization,
              room: metadata.room,
              limit: metadata.limit,
              fee: metadata.fee,
            },
          },
        })

        if (fnError) {
          // supabase-js's FunctionsHttpError only carries a generic
          // "Edge Function returned a non-2xx status code" in .message —
          // the real reason is in the JSON body of the error response,
          // reachable only via .context, and has to be read separately.
          let detail = fnError.message
          try {
            const body = await fnError.context?.json?.()
            if (body?.error) detail = body.error
          } catch {
            // context wasn't JSON (e.g. a raw network failure) — keep the generic message
          }
          console.warn('admin-ops create_doctor_auth_user notice:', detail)
          failureReasons.push(`Edge Function: ${detail}`)
        } else if (fnData?.success && fnData?.user_id) {
          createdUserId = fnData.user_id
        } else if (fnData && !fnData.success) {
          console.warn('admin-ops create_doctor_auth_user rejected:', fnData.error)
          failureReasons.push(`Edge Function: ${fnData.error}`)
        }
      } catch (adminErr: any) {
        console.warn('admin-ops invoke exception:', adminErr)
        failureReasons.push(`Edge Function unreachable: ${adminErr?.message || adminErr}`)
      }

      // There used to be a Step B here that fell back to client-side
      // supabase.auth.signUp() when the edge function failed. That is
      // deliberately gone: calling signUp() from the browser SILENTLY
      // REPLACES the caller's current session with the newly created
      // user's session (a well-known Supabase gotcha). For an
      // admin-initiated privileged creation flow like this one, that meant
      // a super_admin creating a second hospital's login would suddenly,
      // invisibly become logged in AS the account they just created —
      // explaining a real bug where every hospital after the first failed
      // with RLS violations. Privileged creation must go only through the
      // service-role edge function, which never touches the caller's
      // session; if it fails, fail loudly with the real reason instead of
      // falling back to something that can hijack the session.
      if (!createdUserId) {
        throw new Error(
          failureReasons.length > 0
            ? `Could not create the account: ${failureReasons.join(' | ')}`
            : 'Could not create the account in Supabase Auth. Please try again.'
        )
      }
      const finalUserId = createdUserId
      // doctor_details (for role === 'doctor') is already written by the
      // edge function's create_doctor_auth_user action — nothing left to
      // do here now that the client-side fallback path is gone.

      // Step D: Synchronize to Local Registry for instant offline/resilient sign-in
      try {
        const regRaw = localStorage.getItem('clinicos_user_registry')
        const registry: any[] = regRaw ? JSON.parse(regRaw) : []
        const existingIdx = registry.findIndex(u => u.email === cleanEmail || u.doctor_code === docCode)
        const userEntry = {
          id: finalUserId,
          email: cleanEmail,
          role: metadata.role,
          name: metadata.name,
          doctor_code: docCode,
          hospital_id: validHospitalId,
          department: metadata.dept || 'General',
          is_active: true,
          created_at: new Date().toISOString()
        }
        // Older builds stored plaintext passwords here; strip them from every entry.
        registry.forEach((u) => { delete u.password })
        if (existingIdx >= 0) {
          registry[existingIdx] = userEntry
        } else {
          registry.unshift(userEntry)
        }
        localStorage.setItem('clinicos_user_registry', JSON.stringify(registry))
      } catch (regErr) {
        console.warn('Local registry sync notice:', regErr)
      }

      return { user: { id: finalUserId, email: cleanEmail } }
    } catch (err: any) {
      console.warn('Supabase registerUser error:', err.message)
      throw err
    }
  }

  const logout = async () => {
    // Capture the outgoing session's identity BEFORE clearing it, so the
    // tenant-scoped caches below can actually be found and removed.
    const outgoingDoctorId = doctorProfile?.doctor_id || localStorage.getItem('doctor_id')
    const outgoingHospitalId = doctorProfile?.hospital_id || localStorage.getItem('hospital_id')

    try {
      await supabase.auth.signOut()
    } catch (e) {}
    setCurrentUser(null)
    setDoctorProfile(null)
    setUserRole(null)
    localStorage.removeItem('user_role')
    localStorage.removeItem('hospital_id')
    localStorage.removeItem('hospital_name')
    localStorage.removeItem('doctor_id')
    localStorage.removeItem('doctor_code')

    // Previously only the four keys above were cleared — every per-doctor
    // and per-hospital cache below survived logout, so the next person to
    // log into this browser (a different hospital/doctor) could still see
    // stale queue/appointment/doctor-list data from the outgoing session.
    if (outgoingDoctorId) {
      localStorage.removeItem(`clinic_os_queue_${outgoingDoctorId}`)
      localStorage.removeItem(`clinic_os_appointments_${outgoingDoctorId}`)
      localStorage.removeItem(`clinic_os_reports_${outgoingDoctorId}`)
      localStorage.removeItem(`clinic_os_doctor_profile_${outgoingDoctorId}`)
    }
    if (outgoingHospitalId) {
      localStorage.removeItem(`clinicos_hospital_doctors_${outgoingHospitalId}`)
    }
    // Not yet hospital-scoped in storage — clear entirely rather than risk
    // showing it to the next session on this device.
    localStorage.removeItem('clinicos_appointments')
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        doctorProfile,
        userRole,
        isLoading,
        error,
        loginWithSupabase,
        sendSupabaseOtp,
        verifySupabaseOtp,
        registerUserInSupabase,
        logout,
        validateActiveSession,
        refreshDoctorProfile: validateActiveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
