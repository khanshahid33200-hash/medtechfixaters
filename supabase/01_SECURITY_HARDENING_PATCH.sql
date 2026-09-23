-- ==============================================================================
-- 01_SECURITY_HARDENING_PATCH.sql
-- PRODUCTION SECURITY HARDENING PATCH FOR MEDTECHFIXATERS / CLINICAL OS
-- Supabase Project SQL Editor: https://supabase.com/dashboard/project/yweywvnivyftwtglxavr/sql/new
-- ==============================================================================

-- 1. DROP OVER-PERMISSIVE ANONYMOUS ACCESS ON APPOINTMENTS
DROP POLICY IF EXISTS "Public view queue for today" ON public.appointments;

-- 2. CLEAN UP ALL PREVIOUS OVERLOADED FUNCTION SIGNATURES
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT oid::regprocedure AS func_sig 
        FROM pg_proc 
        WHERE proname IN ('admin_create_individual_doctor', 'admin_create_hospital_with_admin', 'lookup_patient_by_qr')
          AND pronamespace = 'public'::regnamespace
    ) LOOP 
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
    END LOOP; 
END $$;

-- 3. CANONICAL SECURE FUNCTION: ATOMIC HOSPITAL & ADMIN CREATION
CREATE OR REPLACE FUNCTION public.admin_create_hospital_with_admin(
    p_hospital_name TEXT,
    p_hospital_slug TEXT,
    p_admin_email TEXT,
    p_admin_password TEXT,
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_plan TEXT DEFAULT 'Hospital Pro',
    p_doctor_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_hosp_id UUID := gen_random_uuid();
    v_user_id UUID := gen_random_uuid();
    v_clean_email TEXT := LOWER(TRIM(p_admin_email));
    v_clean_slug TEXT := LOWER(TRIM(p_hospital_slug));
    v_qr_token TEXT := 'QR-' || UPPER(SUBSTRING(REPLACE(v_hosp_id::text, '-', ''), 1, 8));
BEGIN
    -- Enforce strict authentication & authorization: caller must be an authenticated Super Admin
    IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Platform Super Admin login required.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.hospitals WHERE LOWER(email) = v_clean_email OR slug = v_clean_slug) THEN
        UPDATE public.hospitals SET
            name = p_hospital_name,
            phone = COALESCE(p_phone, phone),
            address = COALESCE(p_address, address),
            city = COALESCE(p_city, city),
            plan = COALESCE(p_plan, plan),
            subscription_plan = COALESCE(p_plan, subscription_plan),
            doctor_limit = COALESCE(p_doctor_limit, doctor_limit),
            status = 'active',
            updated_at = NOW()
        WHERE LOWER(email) = v_clean_email OR slug = v_clean_slug
        RETURNING id INTO v_hosp_id;
    ELSE
        INSERT INTO public.hospitals (
            id, name, slug, email, phone, address, city, doctor_limit, plan, subscription_plan, status
        ) VALUES (
            v_hosp_id, p_hospital_name, v_clean_slug, v_clean_email, p_phone,
            COALESCE(p_address, 'Central OPD Block'), COALESCE(p_city, 'India'), p_doctor_limit, p_plan, p_plan, 'active'
        );
    END IF;

    -- Create or update Auth user
    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
        SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
        UPDATE auth.users SET
            encrypted_password = crypt(p_admin_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object('role', 'hospital_admin', 'hospital_id', v_hosp_id, 'full_name', p_hospital_name || ' Admin'),
            raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
            v_clean_email, crypt(p_admin_password, gen_salt('bf')), NOW(),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object('role', 'hospital_admin', 'hospital_id', v_hosp_id, 'full_name', p_hospital_name || ' Admin'),
            NOW(), NOW(), '', '', '', ''
        );
    END IF;

    -- Create or update Profile
    INSERT INTO public.profiles (
        id, hospital_id, role, full_name, email, is_active, account_status, onboarding_status, client_type
    ) VALUES (
        v_user_id, v_hosp_id, 'hospital_admin', p_hospital_name || ' Admin', v_clean_email, true, 'active', 'ACTIVE', 'hospital'
    )
    ON CONFLICT (id) DO UPDATE SET
        hospital_id = v_hosp_id,
        role = 'hospital_admin',
        full_name = p_hospital_name || ' Admin',
        email = v_clean_email,
        is_active = true,
        account_status = 'active',
        onboarding_status = 'ACTIVE',
        client_type = 'hospital',
        updated_at = NOW();

    -- Create default QR Code
    INSERT INTO public.qr_codes (
        hospital_id, token, booking_url, intake_url, status, is_active
    ) VALUES (
        v_hosp_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true
    )
    ON CONFLICT (token) DO UPDATE SET
        hospital_id = v_hosp_id,
        status = 'active',
        is_active = true;

    RETURN jsonb_build_object(
        'success', true,
        'hospital_id', v_hosp_id,
        'user_id', v_user_id,
        'qr_token', v_qr_token,
        'email', v_clean_email
    );
END;
$$;

-- 4. CANONICAL SECURE FUNCTION: ATOMIC INDIVIDUAL DOCTOR CREATION
CREATE OR REPLACE FUNCTION public.admin_create_individual_doctor(
    p_doctor_name TEXT,
    p_doctor_email TEXT,
    p_doctor_password TEXT,
    p_doctor_phone TEXT DEFAULT NULL,
    p_qualification TEXT DEFAULT 'MBBS, MD',
    p_specialization TEXT DEFAULT 'General Physician',
    p_doctor_code TEXT DEFAULT NULL,
    p_registration_number TEXT DEFAULT NULL,
    p_clinic_name TEXT DEFAULT NULL,
    p_clinic_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pincode TEXT DEFAULT NULL,
    p_clinic_phone TEXT DEFAULT NULL,
    p_consultation_fee NUMERIC DEFAULT 500.00,
    p_daily_limit INTEGER DEFAULT 30,
    p_slot_duration INTEGER DEFAULT 15,
    p_plan_id TEXT DEFAULT 'doctor_monthly',
    p_is_paid BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_clinic_id UUID := gen_random_uuid();
    v_user_id UUID := gen_random_uuid();
    v_clean_email TEXT := LOWER(TRIM(p_doctor_email));
    v_clean_name TEXT := TRIM(p_doctor_name);
    v_clinic_display TEXT := COALESCE(NULLIF(TRIM(p_clinic_name), ''), v_clean_name || ' Clinic');
    v_clean_slug TEXT := (LOWER(REGEXP_REPLACE(v_clinic_display, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 6));
    v_doc_code TEXT := COALESCE(NULLIF(TRIM(p_doctor_code), ''), 'DOC-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6)));
    v_qr_token TEXT := 'QR-' || UPPER(SUBSTRING(REPLACE(v_clinic_id::text, '-', ''), 1, 8));
    v_onboarding_status TEXT := CASE WHEN p_is_paid THEN 'ACTIVE' ELSE 'PAYMENT_PENDING' END;
    v_account_status TEXT := CASE WHEN p_is_paid THEN 'active' ELSE 'pending' END;
BEGIN
    -- Enforce strict authentication & authorization: caller must be an authenticated Super Admin
    IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Platform Super Admin login required.');
    END IF;

    -- 1. Create or Update Clinic Hospital Entity (client_type = 'individual_doctor')
    IF EXISTS (SELECT 1 FROM public.hospitals WHERE LOWER(email) = v_clean_email) THEN
        UPDATE public.hospitals SET
            name = v_clinic_display,
            phone = COALESCE(p_clinic_phone, p_doctor_phone, phone),
            address = COALESCE(p_clinic_address, address),
            city = COALESCE(p_city, city),
            state = COALESCE(p_state, state),
            pincode = COALESCE(p_pincode, pincode),
            client_type = 'individual_doctor',
            plan = p_plan_id,
            subscription_plan = p_plan_id,
            status = 'active',
            updated_at = NOW()
        WHERE LOWER(email) = v_clean_email
        RETURNING id INTO v_clinic_id;
    ELSE
        INSERT INTO public.hospitals (
            id, name, slug, email, phone, address, city, state, pincode, doctor_limit, client_type, plan, subscription_plan, status
        ) VALUES (
            v_clinic_id, v_clinic_display, v_clean_slug, v_clean_email, COALESCE(p_clinic_phone, p_doctor_phone, '+91 9876543210'),
            COALESCE(p_clinic_address, 'Private OPD Clinic'), COALESCE(p_city, 'India'), p_state, p_pincode, 1, 'individual_doctor', p_plan_id, p_plan_id, 'active'
        );
    END IF;

    -- 2. Create or Update Auth user
    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
        SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;
        UPDATE auth.users SET
            encrypted_password = crypt(p_doctor_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object('role', 'doctor', 'hospital_id', v_clinic_id, 'full_name', v_clean_name, 'client_type', 'individual_doctor'),
            raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
            v_clean_email, crypt(p_doctor_password, gen_salt('bf')), NOW(),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object('role', 'doctor', 'hospital_id', v_clinic_id, 'full_name', v_clean_name, 'client_type', 'individual_doctor'),
            NOW(), NOW(), '', '', '', ''
        );
    END IF;

    -- 3. Create or update Profiles table
    INSERT INTO public.profiles (
        id, doctor_code, full_name, email, role, client_type,
        hospital_id, specialization, registration_number,
        onboarding_status, account_status, is_active
    ) VALUES (
        v_user_id, v_doc_code, v_clean_name, v_clean_email, 'doctor', 'individual_doctor',
        v_clinic_id, p_specialization, p_registration_number,
        v_onboarding_status, v_account_status, true
    )
    ON CONFLICT (id) DO UPDATE SET
        doctor_code = v_doc_code,
        full_name = v_clean_name,
        email = v_clean_email,
        role = 'doctor',
        client_type = 'individual_doctor',
        hospital_id = v_clinic_id,
        specialization = p_specialization,
        registration_number = p_registration_number,
        onboarding_status = v_onboarding_status,
        account_status = v_account_status,
        is_active = true,
        updated_at = NOW();

    -- 4. Create or update doctor_details table
    INSERT INTO public.doctor_details (
        id, doctor_code, hospital_id, qualification, specialization,
        registration_number, room_number, consultation_fee, daily_limit, slot_duration,
        timings, experience_years, is_available, is_active
    ) VALUES (
        v_user_id, v_doc_code, v_clinic_id, p_qualification, p_specialization,
        p_registration_number, 'Consultation Room 1', p_consultation_fee, p_daily_limit, p_slot_duration,
        '09:00 AM - 02:00 PM', 5, true, true
    )
    ON CONFLICT (id) DO UPDATE SET
        doctor_code = v_doc_code,
        hospital_id = v_clinic_id,
        qualification = p_qualification,
        specialization = p_specialization,
        registration_number = p_registration_number,
        consultation_fee = p_consultation_fee,
        daily_limit = p_daily_limit,
        slot_duration = p_slot_duration,
        is_active = true,
        updated_at = NOW();

    -- 5. Create or update Registered QR Code
    INSERT INTO public.qr_codes (
        hospital_id, token, booking_url, intake_url, status, is_active
    ) VALUES (
        v_clinic_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true
    )
    ON CONFLICT (token) DO UPDATE SET
        hospital_id = v_clinic_id,
        status = 'active',
        is_active = true;

    RETURN jsonb_build_object(
        'success', true,
        'doctor_id', v_user_id,
        'clinic_id', v_clinic_id,
        'doctor_code', v_doc_code,
        'qr_token', v_qr_token,
        'email', v_clean_email
    );
END;
$$;

-- 5. CANONICAL SECURE FUNCTION: PATIENT LOOKUP BY QR
CREATE OR REPLACE FUNCTION public.lookup_patient_by_qr(
    p_token TEXT,
    p_patient_number TEXT DEFAULT NULL,
    p_mobile TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hospital_id UUID;
    v_patient RECORD;
    v_last_appt RECORD;
    v_clean_phone TEXT := TRIM(COALESCE(p_mobile, ''));
    v_clean_pnum TEXT := TRIM(COALESCE(p_patient_number, ''));
BEGIN
    SELECT hospital_id INTO v_hospital_id FROM public.qr_codes WHERE token = TRIM(p_token) OR booking_url LIKE '%' || TRIM(p_token) || '%' LIMIT 1;
    
    IF v_hospital_id IS NULL THEN
        BEGIN
            v_hospital_id := TRIM(p_token)::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_hospital_id := NULL;
        END;
    END IF;

    IF v_hospital_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'found', false, 'error', 'Hospital not found for this QR code.');
    END IF;

    IF v_clean_phone = '' AND v_clean_pnum = '' THEN
        RETURN jsonb_build_object('success', false, 'found', false, 'error', 'Patient number or mobile number required.');
    END IF;

    SELECT * INTO v_patient FROM public.patients
    WHERE hospital_id = v_hospital_id
      AND (
          (v_clean_phone <> '' AND phone = v_clean_phone) OR
          (v_clean_pnum <> '' AND (patient_number = v_clean_pnum OR phone = v_clean_pnum))
      )
    ORDER BY created_at DESC LIMIT 1;

    IF v_patient.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'found', false);
    END IF;

    SELECT a.doctor_id, p.full_name AS doctor_name INTO v_last_appt
    FROM public.appointments a
    LEFT JOIN public.profiles p ON p.id = a.doctor_id
    WHERE a.patient_id = v_patient.id
    ORDER BY a.created_at DESC LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'found', true,
        'patient', jsonb_build_object(
            'id', v_patient.id,
            'patient_number', v_patient.patient_number,
            'name', v_patient.name,
            'phone', v_patient.phone,
            'gender', v_patient.gender,
            'age', v_patient.age,
            'date_of_birth', v_patient.date_of_birth,
            'known_diseases', v_patient.known_diseases,
            'allergies', v_patient.allergies,
            'previous_doctor_id', v_last_appt.doctor_id,
            'previous_doctor_name', v_last_appt.doctor_name
        )
    );
END;
$$;
