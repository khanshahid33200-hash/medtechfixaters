-- ============================================================================
-- MEDTECH FIXATERS — REGISTER HOSPITAL & HOSPITAL ADMIN CREDENTIALS
-- RUN THIS IN YOUR SUPABASE PROJECT SQL EDITOR:
-- https://supabase.com/dashboard/project/taszwtgrgvhkjvqdieqh/sql/new
-- ============================================================================

DO $$
DECLARE
  v_hosp_id UUID := gen_random_uuid();
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'khanshahid33200@gmail.com';
  v_password TEXT := 'Shahid@19019';
  v_hosp_name TEXT := 'Khan Shahid Medical Center';
  v_hosp_slug TEXT := 'khan-shahid-medical-center';
  v_qr_token TEXT := 'QR-' || UPPER(SUBSTRING(REPLACE(v_hosp_id::text, '-', ''), 1, 8));
BEGIN
  -- 1. Wipe any old record for this email if it exists
  DELETE FROM public.profiles WHERE LOWER(email) = LOWER(v_email);
  DELETE FROM auth.users WHERE LOWER(email) = LOWER(v_email);
  DELETE FROM public.hospitals WHERE LOWER(email) = LOWER(v_email) OR slug = v_hosp_slug;

  -- 2. Insert Hospital record
  INSERT INTO public.hospitals (
    id, name, slug, email, phone, address, city, state, doctor_limit, plan, status
  ) VALUES (
    v_hosp_id, v_hosp_name, v_hosp_slug, v_email, '+91 9876543210',
    'Main Healthcare Complex', 'Mumbai', 'Maharashtra', 15, 'Hospital Pro', 'active'
  );

  -- 3. Insert Auth User into auth.users (Email confirmed)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_anonymous, created_at, updated_at
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email, crypt(v_password, gen_salt('bf')), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object(
      'role', 'hospital_admin',
      'full_name', 'Khan Shahid (Hospital Admin)',
      'hospital_id', v_hosp_id
    ),
    false, false, NOW(), NOW()
  );

  -- 3.5. Insert into auth.identities (Required for Supabase Auth GoTrue)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', LOWER(v_email)),
    'email', LOWER(v_email), NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  -- 4. Insert Profile into public.profiles
  INSERT INTO public.profiles (
    id, full_name, email, role, hospital_id, is_active, account_status
  ) VALUES (
    v_user_id, 'Khan Shahid (Hospital Admin)', v_email, 'hospital_admin', v_hosp_id, true, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'hospital_admin',
    hospital_id = v_hosp_id,
    is_active = true,
    account_status = 'active',
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- 5. Auto-provision QR Code for this hospital
  INSERT INTO public.qr_codes (
    hospital_id, token, booking_url, intake_url, status, is_active
  ) VALUES (
    v_hosp_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true
  )
  ON CONFLICT (token) DO UPDATE SET status = 'active', is_active = true;

  RAISE NOTICE 'Hospital "%" and Admin "%" successfully registered!', v_hosp_name, v_email;
END $$;
