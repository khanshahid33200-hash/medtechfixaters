// Supabase Edge Function: admin-ops
//
// Hosts privileged server-side operations with elevated service-role privileges.
// Automatically archives all user credentials into public.user_credentials_vault.
//
// Deploy:
//   supabase functions deploy admin-ops --no-verify-jwt
//
// Set project secrets:
//   supabase secrets set PROJECT_SERVICE_ROLE_KEY=your_service_role_key

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://yweywvnivyftwtglxavr.supabase.co'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('PROJECT_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const isUUID = (str?: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str || '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''

    // 1. Authenticate caller with their JWT
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userErr,
    } = await callerClient.auth.getUser()

    if (userErr || !user) {
      return json({ success: false, error: 'Not authenticated.' }, 401)
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role, hospital_id, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (!callerProfile || !callerProfile.is_active) {
      return json({ success: false, error: 'Account inactive or not found.' }, 403)
    }

    const { action, payload } = await req.json()

    // 2. Initialize Service-Role Admin Client for privileged operations
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    switch (action) {
      // ------------------------------------------------------------------
      // Action 1: Create Doctor or Staff User (with Vault Auto-Archiving)
      // ------------------------------------------------------------------
      case 'create_doctor_auth_user': {
        const isOwnHospitalAdmin =
          callerProfile.role === 'hospital_admin' && callerProfile.hospital_id === payload?.hospital_id
        const isSuperAdmin = callerProfile.role === 'super_admin'

        if (!isOwnHospitalAdmin && !isSuperAdmin) {
          return json({ success: false, error: 'Not authorized to create users for this hospital.' }, 403)
        }

        if (!isUUID(payload?.hospital_id)) {
          return json({ success: false, error: 'A valid hospital_id is required.' }, 400)
        }

        const email = String(payload?.email || '').trim().toLowerCase()
        const password = String(payload?.password || '').trim()
        const role = payload?.role || 'doctor'
        const fullName = payload?.full_name || email.split('@')[0]
        const doctorCode = payload?.doctor_code || `DOC-${Math.floor(1000 + Math.random() * 9000)}`

        if (!email || password.length < 6) {
          return json({ success: false, error: 'A valid email and password (min 6 chars) are required.' }, 400)
        }

        let resolvedDeptId: string | null = null
        let resolvedDeptName: string = payload?.department || 'General Medicine'

        if (payload?.department_id) {
          if (!isUUID(payload.department_id)) {
            return json({ success: false, error: 'Invalid department ID format.' }, 400)
          }
          const { data: deptRow, error: deptErr } = await admin
            .from('departments')
            .select('id, name, hospital_id, is_active')
            .eq('id', payload.department_id)
            .eq('hospital_id', payload.hospital_id)
            .maybeSingle()

          if (deptErr || !deptRow || !deptRow.is_active) {
            return json({ success: false, error: 'Selected department does not belong to your hospital or is inactive.' }, 400)
          }
          resolvedDeptId = deptRow.id
          resolvedDeptName = deptRow.name
        }

        // Create user in Supabase Auth
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            doctor_code: doctorCode,
            hospital_id: payload.hospital_id,
            department_id: resolvedDeptId,
            department: resolvedDeptName,
          },
        })

        if (createError || !createData?.user?.id) {
          return json({ success: false, error: createError?.message || 'Could not create user.' }, 400)
        }

        const newUserId = createData.user.id

        // Upsert public.profiles
        await admin.from('profiles').upsert({
          id: newUserId,
          doctor_code: doctorCode,
          full_name: fullName,
          email,
          role,
          hospital_id: payload.hospital_id,
          department_id: resolvedDeptId,
          department: resolvedDeptName,
          specialization: payload?.specialization || 'Consultant Specialist',
          account_status: 'active',
          is_active: true,
        })

        // If role is doctor, upsert doctor_details
        if (role === 'doctor') {
          await admin.from('doctor_details').upsert([
            {
              id: newUserId,
              doctor_code: doctorCode,
              hospital_id: payload.hospital_id,
              department_id: resolvedDeptId,
              name: fullName,
              email,
              specialization: payload?.specialization || 'Consultant Specialist',
              qualification: payload?.qualification || 'MBBS, MD',
              room_number: payload?.room || 'Room 101',
              daily_patient_limit: payload?.limit || 30,
              consultation_fee: payload?.fee || 500,
              availability_status: 'active',
              is_active: true,
            },
          ])
        }

        // Auto-save credentials in public.user_credentials_vault
        await admin.from('user_credentials_vault').insert([
          {
            hospital_id: payload.hospital_id,
            user_id: newUserId,
            doctor_code: doctorCode,
            role,
            full_name: fullName,
            email,
            initial_password: password,
            department: resolvedDeptName,
          },
        ])

        return json({
          success: true,
          user_id: newUserId,
          doctor_code: doctorCode,
          message: 'User created and credentials securely vaulted successfully.',
        })
      }

      // ------------------------------------------------------------------
      // Action 2: Update Doctor Department
      // ------------------------------------------------------------------
      case 'update_doctor_department': {
        const isOwnHospitalAdmin =
          callerProfile.role === 'hospital_admin' && callerProfile.hospital_id === payload?.hospital_id
        const isSuperAdmin = callerProfile.role === 'super_admin'

        if (!isOwnHospitalAdmin && !isSuperAdmin) {
          return json({ success: false, error: 'Not authorized to modify doctors for this hospital.' }, 403)
        }

        if (!isUUID(payload?.doctor_id) || !isUUID(payload?.hospital_id) || !isUUID(payload?.department_id)) {
          return json({ success: false, error: 'Valid doctor_id, hospital_id, and department_id are required.' }, 400)
        }

        const { data: deptRow, error: deptErr } = await admin
          .from('departments')
          .select('id, name, hospital_id, is_active')
          .eq('id', payload.department_id)
          .eq('hospital_id', payload.hospital_id)
          .maybeSingle()

        if (deptErr || !deptRow || !deptRow.is_active) {
          return json({ success: false, error: 'Selected department does not belong to your hospital or is inactive.' }, 400)
        }

        await admin
          .from('profiles')
          .update({
            department_id: deptRow.id,
            department: deptRow.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.doctor_id)
          .eq('hospital_id', payload.hospital_id)

        await admin
          .from('doctor_details')
          .update({
            department_id: deptRow.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.doctor_id)
          .eq('hospital_id', payload.hospital_id)

        return json({
          success: true,
          department_id: deptRow.id,
          department_name: deptRow.name,
        })
      }

      // ------------------------------------------------------------------
      // Action 3: Regenerate QR Token
      // ------------------------------------------------------------------
      case 'regenerate_qr_token': {
        const targetHospitalId =
          callerProfile.role === 'super_admin' ? payload?.hospital_id : callerProfile.hospital_id

        if (!isUUID(targetHospitalId)) {
          return json({ success: false, error: 'A valid hospital_id is required.' }, 400)
        }
        if (callerProfile.role !== 'super_admin' && callerProfile.role !== 'hospital_admin') {
          return json({ success: false, error: 'Not authorized.' }, 403)
        }

        const newToken = `QR-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
        const { data, error } = await admin
          .from('qr_codes')
          .update({
            token: newToken,
            booking_url: `/book/${newToken}`,
            intake_url: `/book/${newToken}`,
            status: 'active',
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('hospital_id', targetHospitalId)
          .select()
          .maybeSingle()

        if (error) return json({ success: false, error: error.message }, 400)
        return json({ success: true, qr: data })
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400)
    }
  } catch (e) {
    return json({ success: false, error: String(e) }, 500)
  }
})
