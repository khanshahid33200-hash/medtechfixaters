import { verifySuperAdmin } from './auth-check.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://yweywvnivyftwtglxavr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROJECT_SERVICE_ROLE_KEY || '';

export default async function handler(req, res) {
  const auth = await verifySuperAdmin(req, res);
  if (!auth) return;

  const { client, user } = auth;

  // Optional privileged admin client if service role is available
  const adminClient = SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : client;

  // 1. GET: Searchable doctor directory with detailed profiles & status
  if (req.method === 'GET') {
    const query = req.query || {};
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10)));
    const offset = (page - 1) * limit;

    let dbQuery = client
      .from('profiles')
      .select(`
        id,
        doctor_code,
        username,
        full_name,
        email,
        phone,
        role,
        client_type,
        hospital_id,
        department,
        specialization,
        registration_number,
        onboarding_status,
        account_status,
        is_active,
        platform_fee_exempt,
        exemption_reason,
        exempted_at,
        exemption_expires_at,
        admin_notes,
        created_at,
        updated_at,
        hospitals (
          id,
          name,
          city,
          phone,
          status
        ),
        doctor_details (
          qualification,
          room_number,
          consultation_fee,
          daily_patient_limit,
          availability_status
        )
      `, { count: 'exact' })
      .in('role', ['doctor', 'hospital_admin']);

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('account_status', query.status);
    }

    if (query.onboarding_status && query.onboarding_status !== 'all') {
      dbQuery = dbQuery.eq('onboarding_status', query.onboarding_status);
    }

    if (query.exempt_only === 'true') {
      dbQuery = dbQuery.eq('platform_fee_exempt', true);
    }

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      dbQuery = dbQuery.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term},doctor_code.ilike.${term},specialization.ilike.${term}`);
    }

    const { data: doctors, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      doctors: doctors || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  }

  // 2. POST: Doctor Actions (Update status, Fee Exemption, Send Password Reset, Create Doctor)
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = body.action || '';

    // Action A: Set Account Status (Active, Suspended, Banned, Deleted)
    if (action === 'set_status') {
      const { doctor_id, account_status, reason, admin_notes } = body;
      if (!doctor_id || !account_status) {
        return res.status(400).json({ success: false, error: 'Doctor ID and new account status are required.' });
      }

      const { data: rpcRes, error: rpcErr } = await client.rpc('admin_set_doctor_status', {
        p_doctor_id: doctor_id,
        p_new_status: account_status,
        p_reason: reason || 'Administrative status change',
        p_admin_notes: admin_notes || null,
      });

      if (rpcErr) {
        return res.status(500).json({ success: false, error: rpcErr.message });
      }

      return res.json({ success: true, result: rpcRes });
    }

    // Action B: Grant Platform Fee Exemption
    if (action === 'grant_exemption') {
      const { doctor_id, exemption_reason, expires_at, admin_notes } = body;
      if (!doctor_id || !exemption_reason) {
        return res.status(400).json({ success: false, error: 'Doctor ID and exemption reason are required.' });
      }

      const { data: rpcRes, error: rpcErr } = await client.rpc('admin_activate_exempt_doctor', {
        p_doctor_id: doctor_id,
        p_exemption_reason: exemption_reason,
        p_expires_at: expires_at || null,
        p_admin_notes: admin_notes || null,
      });

      if (rpcErr) {
        return res.status(500).json({ success: false, error: rpcErr.message });
      }

      return res.json({ success: true, result: rpcRes });
    }

    // Action C: Initiate Password Reset Link / Invitation
    if (action === 'send_password_reset') {
      const { email, doctor_id } = body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Doctor email is required.' });
      }

      try {
        let resetLink = null;
        if (adminClient.auth?.admin?.generateLink) {
          const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
            type: 'recovery',
            email: email.trim().toLowerCase(),
          });
          if (!linkErr && linkData?.properties?.action_link) {
            resetLink = linkData.properties.action_link;
          }
        }

        // Standard Supabase Auth password reset request as fallback
        const { error: resetErr } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${process.env.VITE_APP_URL || 'https://www.medtechfixaters.in'}/reset-password`,
        });

        // Audit log
        await client.rpc('log_admin_audit_event', {
          p_action: 'send_password_reset',
          p_target_type: 'doctor',
          p_target_id: doctor_id || email,
          p_previous_state: {},
          p_new_state: { email },
          p_reason: 'Admin-initiated password setup/reset link',
          p_result: resetErr ? 'failure' : 'success',
        });

        if (resetErr && !resetLink) {
          return res.status(500).json({ success: false, error: resetErr.message });
        }

        return res.json({
          success: true,
          action_link: resetLink,
          message: 'Password reset link initiated. The doctor will receive instructions or can use the direct setup link.',
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // Action D: Super Admin Direct Doctor Profile Creation (Section 5)
    if (action === 'create_exempt_doctor') {
      const {
        full_name,
        email,
        phone,
        specialization,
        registration_number,
        clinic_name,
        account_status,
        fee_exempt,
        exemption_reason,
        exemption_expires_at,
        admin_notes,
      } = body;

      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(full_name || '').trim();

      if (!cleanEmail || !cleanName) {
        return res.status(400).json({ success: false, error: 'Doctor name and email are mandatory.' });
      }

      // Check if email already registered
      const { data: existingProf } = await client
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProf) {
        return res.status(409).json({ success: false, error: 'A user account with this email already exists.' });
      }

      const hospUuid = crypto.randomUUID();
      const qrToken = `QR-DOC-${hospUuid.slice(-6).toUpperCase()}`;

      try {
        let newUserId = null;

        // Try creating Auth user via Admin API if service role is present
        if (adminClient.auth?.admin?.createUser) {
          const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              role: 'doctor',
              phone: phone || '',
              specialization: specialization || 'General Physician',
            },
            app_metadata: {
              role: 'doctor',
              provisioned_by: 'super_admin',
            },
          });
          if (authErr) {
            return res.status(500).json({ success: false, error: 'Auth user creation failed: ' + authErr.message });
          }
          newUserId = authUser?.user?.id;
        }

        if (!newUserId) {
          newUserId = crypto.randomUUID();
        }

        // 1. Create clinic hospital record
        await client.from('hospitals').insert({
          id: hospUuid,
          name: clinic_name || `${cleanName}'s Clinic`,
          email: cleanEmail,
          phone: phone || '',
          client_type: 'individual_doctor',
          status: 'active',
          plan: 'Single OPD',
          doctor_limit: 1,
        });

        // 2. Insert Profiles record with validated schema and fee exemption
        const isExempt = fee_exempt !== false;
        const now = new Date().toISOString();

        await client.from('profiles').insert({
          id: newUserId,
          doctor_code: `DOC-${newUserId.slice(-4).toUpperCase()}`,
          full_name: cleanName,
          email: cleanEmail,
          phone: phone || '',
          role: 'doctor',
          client_type: 'individual_doctor',
          hospital_id: hospUuid,
          specialization: specialization || 'General Physician',
          registration_number: registration_number || '',
          onboarding_status: 'ACTIVE',
          account_status: account_status || 'active',
          is_active: (account_status || 'active') === 'active',
          platform_fee_exempt: isExempt,
          exemption_reason: isExempt ? (exemption_reason || 'Super Admin Administrative Exemption') : null,
          exempted_by: isExempt ? user.id : null,
          exempted_at: isExempt ? now : null,
          exemption_expires_at: exemption_expires_at || null,
          admin_notes: admin_notes || null,
          created_at: now,
          updated_at: now,
        });

        // 3. Insert doctor_details
        await client.from('doctor_details').insert({
          id: newUserId,
          doctor_code: `DOC-${newUserId.slice(-4).toUpperCase()}`,
          name: cleanName,
          email: cleanEmail,
          hospital_id: hospUuid,
          specialization: specialization || 'General Physician',
          clinic_name: clinic_name || `${cleanName}'s Clinic`,
          consultation_fee: 500,
          daily_patient_limit: 30,
          onboarding_status: 'ACTIVE',
          availability_status: 'active',
          is_active: true,
        });

        // 4. Mark onboarding_profiles completed
        await client.from('onboarding_profiles').upsert({
          user_id: newUserId,
          account_type: 'individual_doctor',
          current_step: 'completed',
          onboarding_status: 'completed',
          profile_completed_at: now,
          onboarding_completed_at: now,
          step_data: {
            admin_created: true,
            created_by: user.id,
            clinic_name,
            specialization,
          },
        });

        // 5. Provision QR Code
        await client.from('qr_codes').upsert({
          hospital_id: hospUuid,
          doctor_id: newUserId,
          token: qrToken,
          booking_url: `/book/${qrToken}`,
          intake_url: `/book/${qrToken}`,
          status: 'active',
          is_active: true,
        });

        // 6. Send password setup link or invitation
        let setupLink = null;
        if (adminClient.auth?.admin?.generateLink) {
          const { data: linkData } = await adminClient.auth.admin.generateLink({
            type: 'invite',
            email: cleanEmail,
          });
          setupLink = linkData?.properties?.action_link;
        }

        // 7. Audit Log
        await client.rpc('log_admin_audit_event', {
          p_action: 'admin_create_doctor',
          p_target_type: 'doctor',
          p_target_id: newUserId,
          p_previous_state: {},
          p_new_state: {
            doctor_id: newUserId,
            email: cleanEmail,
            full_name: cleanName,
            platform_fee_exempt: isExempt,
            exemption_reason,
          },
          p_reason: 'Admin-created doctor profile with platform fee exemption',
          p_result: 'success',
        });

        return res.json({
          success: true,
          doctor_id: newUserId,
          email: cleanEmail,
          qr_token: qrToken,
          setup_link: setupLink,
          message: 'Doctor profile successfully created with fee exemption. Account is immediately active.',
        });
      } catch (createErr) {
        return res.status(500).json({ success: false, error: 'Failed to create doctor: ' + createErr.message });
      }
    }

    return res.status(400).json({ success: false, error: `Unsupported doctor action: ${action}` });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
