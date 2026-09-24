-- ==============================================================================
-- 02_SECURITY_AUDIT_FIXES.sql
-- Security audit remediation (2026-09-24) for MedTechFixaters / Clinical OS.
--
-- RUN ORDER: 00_COMPLETE_DATABASE_SETUP.sql -> 01_SECURITY_HARDENING_PATCH.sql -> THIS FILE.
-- Re-running 00 or 01 re-introduces the vulnerabilities fixed here, so this file
-- must always be applied last. It is idempotent and safe to re-run.
--
-- Fixes (IDs refer to the audit report):
--   SEC-003  handle_new_user trusted client-supplied user_metadata.role (anyone could sign up as super_admin)
--   SEC-004  any hospital member could UPDATE any profile in their hospital, including role
--   SEC-005  doctor_complete_profile / doctor_verify_and_activate_subscription / doctor_self_signup
--            / create_follow_up callable by anon with arbitrary IDs
--   SEC-006  lookup_patient_by_qr + get_live_queue_status leaked patient PHI (diseases, allergies,
--            medicines, phone, name) and searched across hospitals
--   SEC-007  anon INSERT on appointments / patients with WITH CHECK (true)
--   SEC-008  hospital-wide (not role-scoped) RLS: doctors could read/modify every appointment,
--            patient, consultation and the credentials vault in their hospital
--   SEC-009  plaintext passwords in user_credentials_vault
--   SEC-010  public storage buckets for prescriptions/lab reports; any user could overwrite/delete any file
--   SEC-012  queue token race (MAX+1 without a lock), no unique constraint
--   SEC-013  hospital_patient_daily_counters had no RLS
--   SEC-014  chat: self-join any conversation, sender spoofing, cross-hospital group members
--   SEC-015  EXECUTE on every function granted to anon
--   SEC-016  blocked/suspended users and hospitals kept full data access
--   SEC-022  anonymous read of all queue notifications; any hospital user could edit/delete them
--   SEC-023  anonymous enumeration of every hospital's QR token
--   SEC-025  no rate limiting on public booking / lookup / tracking endpoints
--   SEC-018  subscription activation without payment (adds server-verified Razorpay path + switch)
--   BUG-001  admin_create_individual_doctor signature mismatch + non-existent columns
--   BUG-002  create_follow_up always failed (NULL notification message)
-- ==============================================================================

-- ==============================================================================
-- 1. HELPER FUNCTIONS (same signatures; CREATE OR REPLACE keeps dependent policies)
-- ==============================================================================

-- Returns the caller's hospital only while the caller AND their hospital are active.
-- Every tenant-scoped policy uses this, so blocking a user/hospital now cuts off data access.
CREATE OR REPLACE FUNCTION public.current_hospital_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.hospital_id
    FROM public.profiles p
    LEFT JOIN public.hospitals h ON h.id = p.hospital_id
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND COALESCE(p.account_status, 'active') NOT IN ('suspended', 'blocked', 'banned', 'deleted')
      AND COALESCE(h.status, 'active') NOT IN ('suspended', 'blocked', 'banned', 'deleted')
    LIMIT 1;
$$;

-- Unfiltered: lets a blocked user still read their own profile/hospital row so the
-- UI can show the "account blocked" screen.
CREATE OR REPLACE FUNCTION public.own_hospital_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT hospital_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
          AND is_active = true
          AND COALESCE(account_status, 'active') NOT IN ('suspended', 'blocked', 'banned', 'deleted')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_hospital_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('hospital_admin', 'super_admin')
          AND is_active = true
          AND COALESCE(account_status, 'active') NOT IN ('suspended', 'blocked', 'banned', 'deleted')
    );
$$;

-- Front-desk level: hospital admins and staff (hospital-wide operational access).
CREATE OR REPLACE FUNCTION public.is_hospital_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('hospital_admin', 'staff')
          AND is_active = true
          AND COALESCE(account_status, 'active') NOT IN ('suspended', 'blocked', 'banned', 'deleted')
    );
$$;

-- Solo practitioners own their private clinic and act as its administrator.
CREATE OR REPLACE FUNCTION public.is_individual_doctor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'doctor' AND client_type = 'individual_doctor'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_owner(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.chat_members
        WHERE conversation_id = p_conversation_id AND user_id = auth.uid() AND role = 'owner'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_same_hospital_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND hospital_id = public.current_hospital_id()
    );
$$;

-- Storage paths are "<uuid>/<file>"; returns NULL instead of raising on a non-UUID prefix.
CREATE OR REPLACE FUNCTION public.try_uuid(p_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    RETURN p_text::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN p_name IS NULL OR TRIM(p_name) = '' THEN p_name
        ELSE (
            SELECT string_agg(LEFT(w, 1) || '***', ' ')
            FROM regexp_split_to_table(TRIM(p_name), '\s+') AS w
        )
    END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN p_phone IS NULL OR p_phone = '' THEN p_phone
        ELSE '******' || RIGHT(regexp_replace(p_phone, '[^0-9]', '', 'g'), 4)
    END;
$$;

-- ==============================================================================
-- 1B. RATE LIMITING FOR PUBLIC ENDPOINTS (SEC-025)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (key, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Client IP as forwarded by the Supabase API gateway (NULL outside an API request).
CREATE OR REPLACE FUNCTION public.request_ip()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT NULLIF(TRIM(split_part(
        COALESCE(NULLIF(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ''), ',', 1)), '');
$$;

-- True while `p_key` has made at most `p_limit` calls in the current window.
-- A NULL key (e.g. no client IP available) is never limited, so callers can
-- concatenate request_ip() without locking everyone into one shared bucket.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window TIMESTAMPTZ := to_timestamp(floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds);
    v_hits INTEGER;
BEGIN
    IF p_key IS NULL THEN
        RETURN true;
    END IF;

    INSERT INTO public.rate_limits (key, window_start, hits) VALUES (p_key, v_window, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET hits = public.rate_limits.hits + 1
    RETURNING hits INTO v_hits;

    IF random() < 0.01 THEN
        DELETE FROM public.rate_limits WHERE window_start < clock_timestamp() - INTERVAL '2 days';
    END IF;

    RETURN v_hits <= p_limit;
END;
$$;

-- ==============================================================================
-- 1C. PLATFORM SETTINGS (SEC-018)
-- ==============================================================================
-- payments_required = true disables free self-activation; subscriptions can then only be
-- activated by the `payments` edge function after it has verified the Razorpay payment.
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_settings FROM anon;
DROP POLICY IF EXISTS "Super Admin manage platform settings" ON public.platform_settings;
CREATE POLICY "Super Admin manage platform settings" ON public.platform_settings FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
INSERT INTO public.platform_settings (key, value) VALUES ('payments_required', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 2. SIGNUP TRIGGER: never trust client-controlled user_metadata for privileges (SEC-003)
-- ==============================================================================
-- supabase.auth.signUp({ options: { data: { role: 'super_admin' } } }) writes
-- raw_user_meta_data, which any anonymous visitor controls. Privileged accounts are
-- only created by (a) the super-admin SQL RPCs, which insert their own profile, or
-- (b) the admin-ops edge function, which sets raw_app_meta_data.provisioned_by
-- (app_metadata is writable only with the service-role key).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_clean_email TEXT := LOWER(TRIM(NEW.email));
    v_full_name TEXT;
    v_existing_profile_id UUID;
    v_clinic_id UUID;
    v_clinic_name TEXT;
    v_qr_token TEXT;
    v_raw_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    v_app_meta JSONB := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
BEGIN
    -- Server-provisioned accounts: the provisioning code writes the profile itself.
    IF v_app_meta ? 'provisioned_by' OR public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    v_full_name := LEFT(COALESCE(
        NULLIF(TRIM(v_raw_meta->>'full_name'), ''),
        NULLIF(TRIM(v_raw_meta->>'name'), ''),
        split_part(v_clean_email, '@', 1)
    ), 120);

    SELECT id INTO v_existing_profile_id FROM public.profiles WHERE LOWER(email) = v_clean_email LIMIT 1;
    IF v_existing_profile_id IS NOT NULL THEN
        -- Never link a new auth identity to an existing profile by e-mail alone.
        RETURN NEW;
    END IF;

    -- Every self-service signup (email or Google OAuth) becomes an individual
    -- doctor with a private clinic. Role/hospital metadata from the client is ignored.
    v_clinic_name := v_full_name || ' Clinic';

    INSERT INTO public.hospitals (name, slug, client_type, plan, subscription_plan, doctor_limit, status)
    VALUES (
        v_clinic_name,
        'clinic-' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8),
        'individual_doctor', 'Individual Doctor Solo', 'Individual Doctor Solo', 1, 'active'
    ) RETURNING id INTO v_clinic_id;

    INSERT INTO public.profiles (
        id, full_name, email, role, client_type, hospital_id, onboarding_status, is_active, account_status, doctor_code
    ) VALUES (
        NEW.id, v_full_name, v_clean_email, 'doctor', 'individual_doctor', v_clinic_id,
        'PROFILE_INCOMPLETE', true, 'active',
        'DOC-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6))
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.doctor_details (
        id, doctor_code, hospital_id, name, email, clinic_name, specialization, qualification,
        consultation_fee, slot_duration, available_days, available_hours, onboarding_status, is_active
    ) VALUES (
        NEW.id, 'DOC-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6)), v_clinic_id,
        v_full_name, v_clean_email, v_clinic_name, 'General Physician', 'MBBS, MD',
        500.00, 15, '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb,
        '{"start": "09:00 AM", "end": "05:00 PM"}'::jsonb, 'PROFILE_INCOMPLETE', true
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.individual_doctor_subscriptions (doctor_id, hospital_id, plan_id, plan_name, amount, status)
    VALUES (NEW.id, v_clinic_id, 'doctor_monthly', 'Individual Doctor Solo', 999.00, 'pending')
    ON CONFLICT DO NOTHING;

    v_qr_token := 'QR-DOC-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8));
    INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
    VALUES (v_clinic_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Repair: any profile that got a privileged role through the old trigger without
-- being created by a super admin. Review before running in production (see report).
-- Uncomment to demote every super_admin except the platform owner:
-- UPDATE public.profiles SET role = 'doctor', is_active = false, account_status = 'suspended'
--  WHERE role = 'super_admin' AND LOWER(email) <> LOWER('<platform-owner-email>');

-- ==============================================================================
-- 3. COLUMN GUARDS ON profiles / doctor_details (SEC-004)
-- ==============================================================================
-- SECURITY INVOKER on purpose: current_user is then the API role ('authenticated'/'anon')
-- for direct table writes, and the definer (postgres) inside trusted SECURITY DEFINER RPCs.
CREATE OR REPLACE FUNCTION public.enforce_role_change_guardrail()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    IF current_user NOT IN ('authenticated', 'anon') OR public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    v_is_admin := public.is_hospital_admin() AND NEW.id <> auth.uid();

    IF TG_OP = 'INSERT' THEN
        IF NEW.role IN ('super_admin', 'hospital_admin') THEN
            RAISE EXCEPTION 'Only a platform admin may create % accounts.', NEW.role USING ERRCODE = '42501';
        END IF;
        IF NEW.hospital_id IS DISTINCT FROM public.current_hospital_id() THEN
            RAISE EXCEPTION 'Profiles can only be created in your own hospital.' USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.hospital_id IS DISTINCT FROM OLD.hospital_id THEN
        RAISE EXCEPTION 'Profile id / hospital cannot be changed.' USING ERRCODE = '42501';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT v_is_admin OR NEW.role NOT IN ('doctor', 'staff') OR OLD.role NOT IN ('doctor', 'staff') THEN
            RAISE EXCEPTION 'Only a Super Admin may assign or change hospital_admin / super_admin roles.' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NOT v_is_admin AND (
        NEW.account_status IS DISTINCT FROM OLD.account_status
        OR NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status
        OR NEW.client_type IS DISTINCT FROM OLD.client_type
        OR NEW.doctor_code IS DISTINCT FROM OLD.doctor_code
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.department_id IS DISTINCT FROM OLD.department_id
    ) THEN
        RAISE EXCEPTION 'You are not allowed to change these account fields.' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_role_change_guardrail ON public.profiles;
CREATE TRIGGER trg_enforce_role_change_guardrail
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_role_change_guardrail();

CREATE OR REPLACE FUNCTION public.enforce_doctor_details_guardrail()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF current_user NOT IN ('authenticated', 'anon') OR public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.hospital_id IS DISTINCT FROM public.current_hospital_id() THEN
            RAISE EXCEPTION 'Doctor details can only be created in your own hospital.' USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.hospital_id IS DISTINCT FROM OLD.hospital_id THEN
        RAISE EXCEPTION 'Doctor id / hospital cannot be changed.' USING ERRCODE = '42501';
    END IF;

    IF NOT (public.is_hospital_admin() AND NEW.id <> auth.uid()) AND (
        NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status
        OR NEW.doctor_code IS DISTINCT FROM OLD.doctor_code
    ) THEN
        RAISE EXCEPTION 'You are not allowed to change these doctor fields.' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_doctor_details_guardrail ON public.doctor_details;
CREATE TRIGGER trg_enforce_doctor_details_guardrail
    BEFORE INSERT OR UPDATE ON public.doctor_details
    FOR EACH ROW EXECUTE FUNCTION public.enforce_doctor_details_guardrail();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY — role-scoped tenant isolation (SEC-007, SEC-008, SEC-013, SEC-014)
-- ==============================================================================

-- 4.1 HOSPITALS: a blocked user can still see their own hospital row (status screen)
DROP POLICY IF EXISTS "Users view own hospital" ON public.hospitals;
CREATE POLICY "Users view own hospital" ON public.hospitals FOR SELECT TO authenticated
    USING (id = public.own_hospital_id());

-- 4.2 DEPARTMENTS: only admins write
DROP POLICY IF EXISTS "Hospital Admin manage departments" ON public.departments;
CREATE POLICY "Hospital Admin manage departments" ON public.departments FOR ALL TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_admin())
    WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_admin());

-- 4.3 PROFILES
DROP POLICY IF EXISTS "Hospital Admin manage hospital profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view hospital profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Hospital Admin manage hospital profiles" ON public.profiles FOR ALL TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_admin())
    WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_admin());
CREATE POLICY "Users view hospital profiles" ON public.profiles FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() OR id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Anonymous visitors (booking pages) may see public doctor fields only — no e-mail/username.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, doctor_code, full_name, role, client_type, hospital_id, department_id, department,
              specialization, registration_number, onboarding_status, account_status, is_active)
    ON public.profiles TO anon;

-- 4.4 DOCTOR DETAILS
DROP POLICY IF EXISTS "Hospital Admin manage doctor_details" ON public.doctor_details;
DROP POLICY IF EXISTS "Hospital users view doctor_details" ON public.doctor_details;
CREATE POLICY "Hospital Admin manage doctor_details" ON public.doctor_details FOR ALL TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_admin())
    WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_admin());
CREATE POLICY "Hospital users view doctor_details" ON public.doctor_details FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id());

REVOKE SELECT ON public.doctor_details FROM anon;
GRANT SELECT (id, doctor_code, hospital_id, department_id, name, qualification, specialization,
              registration_number, room_number, clinic_name, clinic_address, city, state, pincode,
              clinic_phone, slot_duration, available_days, available_hours, unavailable_dates,
              onboarding_status, daily_patient_limit, consultation_fee, availability_status,
              is_active, created_at, updated_at)
    ON public.doctor_details TO anon;

-- 4.5 CREDENTIALS VAULT: admins only, and no plaintext passwords (SEC-009)
DROP POLICY IF EXISTS "Hospital Admin view own hospital credentials" ON public.user_credentials_vault;
DROP POLICY IF EXISTS "Hospital Admin manage own hospital credentials" ON public.user_credentials_vault;
CREATE POLICY "Hospital Admin manage own hospital credentials" ON public.user_credentials_vault FOR ALL TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_admin())
    WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_admin());

CREATE OR REPLACE FUNCTION public.redact_vault_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.initial_password := '[not stored - use password reset]';
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_redact_vault_password ON public.user_credentials_vault;
CREATE TRIGGER trg_redact_vault_password
    BEFORE INSERT OR UPDATE ON public.user_credentials_vault
    FOR EACH ROW EXECUTE FUNCTION public.redact_vault_password();

-- Destroys the stored plaintext copies. Every affected user must reset their password.
UPDATE public.user_credentials_vault SET initial_password = '[not stored - use password reset]'
WHERE initial_password IS DISTINCT FROM '[not stored - use password reset]';

-- 4.6 APPOINTMENTS: admins/staff hospital-wide, doctors only their own; no anonymous writes
DROP POLICY IF EXISTS "Hospital Admin manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Hospital staff manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointment" ON public.appointments;
DROP POLICY IF EXISTS "Public view queue for today" ON public.appointments;
CREATE POLICY "Hospital staff manage appointments" ON public.appointments FOR ALL TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_staff())
    WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_staff());
-- "Doctor manage own appointments" (doctor_id = auth.uid() AND hospital) is kept from 00.

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);

-- 4.7 PATIENTS
DROP POLICY IF EXISTS "Hospital users manage patients" ON public.patients;
DROP POLICY IF EXISTS "Public insert patient" ON public.patients;
DROP POLICY IF EXISTS "Hospital staff manage patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors view own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors update own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors insert patients" ON public.patients;
CREATE POLICY "Hospital staff manage patients" ON public.patients FOR ALL TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_staff())
    WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_staff());
CREATE POLICY "Doctors view own patients" ON public.patients FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id()
           AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = patients.id AND a.doctor_id = auth.uid()));
CREATE POLICY "Doctors update own patients" ON public.patients FOR UPDATE TO authenticated
    USING (hospital_id = public.current_hospital_id()
           AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = patients.id AND a.doctor_id = auth.uid()))
    WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctors insert patients" ON public.patients FOR INSERT TO authenticated
    WITH CHECK (hospital_id = public.current_hospital_id());

-- 4.8 CONSULTATIONS & PRESCRIPTIONS: clinical records — own doctor + hospital admin only
DROP POLICY IF EXISTS "Hospital staff view consultations" ON public.consultations;
DROP POLICY IF EXISTS "Hospital staff view prescriptions" ON public.prescriptions;
CREATE POLICY "Hospital staff view consultations" ON public.consultations FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_admin());
CREATE POLICY "Hospital staff view prescriptions" ON public.prescriptions FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_hospital_admin());

-- 4.9 WORKFLOW TABLES: staff hospital-wide, doctors their own rows
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['test_requests', 'follow_ups', 'doctor_requests', 'emergency_requests'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Hospital users manage ' || t, t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Hospital staff manage ' || t, t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Doctor manage own ' || t, t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                USING (hospital_id = public.current_hospital_id() AND public.is_hospital_staff())
                WITH CHECK (hospital_id = public.current_hospital_id() AND public.is_hospital_staff())',
            'Hospital staff manage ' || t, t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                USING (hospital_id = public.current_hospital_id() AND doctor_id = auth.uid())
                WITH CHECK (hospital_id = public.current_hospital_id() AND doctor_id = auth.uid())',
            'Doctor manage own ' || t, t);
    END LOOP;
END $$;

-- 4.10 QR CODES: only the hospital admin (or a solo doctor for their own clinic) may change them
DROP POLICY IF EXISTS "Hospital users manage qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Hospital users view qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Hospital admin manage qr_codes" ON public.qr_codes;
CREATE POLICY "Hospital users view qr_codes" ON public.qr_codes FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() OR public.is_super_admin());
CREATE POLICY "Hospital admin manage qr_codes" ON public.qr_codes FOR ALL TO authenticated
    USING ((hospital_id = public.current_hospital_id() AND (public.is_hospital_admin() OR public.is_individual_doctor()))
           OR public.is_super_admin())
    WITH CHECK ((hospital_id = public.current_hospital_id() AND (public.is_hospital_admin() OR public.is_individual_doctor()))
                OR public.is_super_admin());

-- 4.10B Anonymous visitors no longer list QR tokens; public pages resolve them via get_qr_booking_info().
DROP POLICY IF EXISTS "Public view active qr_codes" ON public.qr_codes;
REVOKE SELECT ON public.qr_codes FROM anon;

-- 4.10C NOTIFICATIONS: the patient tracker reads its own notifications through
-- get_live_queue_status(); signed-in users may only mark notifications read.
DROP POLICY IF EXISTS "Public view notifications for appointment" ON public.notifications;
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users mark notifications read" ON public.notifications;
DROP POLICY IF EXISTS "Users create hospital notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owners or admins delete notifications" ON public.notifications;
REVOKE ALL ON public.notifications FROM anon;
CREATE POLICY "Users view notifications" ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR hospital_id = public.current_hospital_id());
CREATE POLICY "Users mark notifications read" ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR hospital_id = public.current_hospital_id())
    WITH CHECK (user_id = auth.uid() OR hospital_id = public.current_hospital_id());
CREATE POLICY "Users create hospital notifications" ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Owners or admins delete notifications" ON public.notifications FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR (hospital_id = public.current_hospital_id() AND public.is_hospital_admin()));
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;

-- 4.11 PATIENT-NUMBER COUNTERS: only SECURITY DEFINER RPCs touch this table
ALTER TABLE public.hospital_patient_daily_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hospital_patient_daily_counters FROM anon, authenticated;

-- 4.12 CHAT
DROP POLICY IF EXISTS "Chat members manage conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat members create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat members update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat owners delete conversations" ON public.chat_conversations;
CREATE POLICY "Chat members create conversations" ON public.chat_conversations FOR INSERT TO authenticated
    WITH CHECK (hospital_id = public.current_hospital_id() AND created_by = auth.uid());
CREATE POLICY "Chat members update conversations" ON public.chat_conversations FOR UPDATE TO authenticated
    USING (hospital_id = public.current_hospital_id() AND public.is_chat_member(id))
    WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Chat owners delete conversations" ON public.chat_conversations FOR DELETE TO authenticated
    USING (hospital_id = public.current_hospital_id() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Chat members manage members" ON public.chat_members;
DROP POLICY IF EXISTS "Chat members view members" ON public.chat_members;
DROP POLICY IF EXISTS "Chat owners add members" ON public.chat_members;
DROP POLICY IF EXISTS "Chat members update own membership" ON public.chat_members;
DROP POLICY IF EXISTS "Chat members leave or owners remove" ON public.chat_members;
CREATE POLICY "Chat members view members" ON public.chat_members FOR SELECT TO authenticated
    USING (public.is_chat_member(conversation_id));
CREATE POLICY "Chat owners add members" ON public.chat_members FOR INSERT TO authenticated
    WITH CHECK (public.is_chat_owner(conversation_id) AND public.is_same_hospital_user(user_id));
CREATE POLICY "Chat members update own membership" ON public.chat_members FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Chat members leave or owners remove" ON public.chat_members FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_chat_owner(conversation_id));

DROP POLICY IF EXISTS "Chat members manage messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat members read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat members send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat senders edit messages" ON public.chat_messages;
CREATE POLICY "Chat members read messages" ON public.chat_messages FOR SELECT TO authenticated
    USING (public.is_chat_member(conversation_id));
CREATE POLICY "Chat members send messages" ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK (public.is_chat_member(conversation_id) AND sender_id = auth.uid());
CREATE POLICY "Chat senders edit messages" ON public.chat_messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid() AND public.is_chat_member(conversation_id))
    WITH CHECK (sender_id = auth.uid());

-- Previously RLS-enabled with no policies, so attachment uploads always failed.
DROP POLICY IF EXISTS "Chat members manage attachments" ON public.chat_message_attachments;
CREATE POLICY "Chat members manage attachments" ON public.chat_message_attachments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id = message_id AND public.is_chat_member(m.conversation_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id = message_id AND m.sender_id = auth.uid()));

DROP POLICY IF EXISTS "Chat members manage own reads" ON public.chat_message_reads;
CREATE POLICY "Chat members manage own reads" ON public.chat_message_reads FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 5. STORAGE: private clinical buckets, tenant-scoped writes (SEC-010)
-- ==============================================================================
-- Path convention: "<hospital_id>/<file>" for hospital buckets, "<conversation_id>/<file>" for chat.
UPDATE storage.buckets SET public = false WHERE id IN ('prescriptions', 'lab-reports');

DROP POLICY IF EXISTS "Public read storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Public read branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Hospital members read own files" ON storage.objects;
DROP POLICY IF EXISTS "Hospital members upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Owners modify own files" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete own files" ON storage.objects;

CREATE POLICY "Public read branding assets" ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id IN ('hospital-logos', 'doctor-avatars'));
CREATE POLICY "Hospital members read own files" ON storage.objects FOR SELECT TO authenticated
    USING (
        (bucket_id IN ('prescriptions', 'lab-reports')
            AND public.try_uuid((storage.foldername(name))[1]) = public.current_hospital_id())
        OR (bucket_id = 'chat-attachments'
            AND public.is_chat_member(public.try_uuid((storage.foldername(name))[1])))
    );
CREATE POLICY "Hospital members upload own files" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        (bucket_id IN ('prescriptions', 'lab-reports', 'hospital-logos', 'doctor-avatars')
            AND public.try_uuid((storage.foldername(name))[1]) = public.current_hospital_id())
        OR (bucket_id = 'chat-attachments'
            AND public.is_chat_member(public.try_uuid((storage.foldername(name))[1])))
    );
CREATE POLICY "Owners modify own files" ON storage.objects FOR UPDATE TO authenticated
    USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());
CREATE POLICY "Owners delete own files" ON storage.objects FOR DELETE TO authenticated
    USING (owner = auth.uid());

-- ==============================================================================
-- 6. RPC REWRITES (SEC-005, SEC-006, SEC-012, BUG-001)
-- ==============================================================================

-- Drop every overload of the functions redefined below (none have dependents).
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS sig FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
          AND proname IN (
              'doctor_self_signup', 'doctor_complete_profile', 'doctor_verify_and_activate_subscription',
              'create_follow_up', 'log_activity', 'create_group_conversation',
              'lookup_patient_by_qr', 'get_live_queue_status', 'book_qr_appointment',
              'get_qr_booking_info', 'create_manual_appointment', 'admin_create_individual_doctor',
              'resolve_login_email', 'activate_doctor_subscription_internal', 'activate_paid_subscription'
          )
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;
END $$;

-- 6.1 Doctor-ID login: resolve exactly one e-mail for an exact doctor code.
-- Replaces the anonymous `profiles.select('email').ilike('doctor_code', input)` query,
-- which let anyone dump every doctor's e-mail (and `%` matched all rows).
CREATE FUNCTION public.resolve_login_email(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    IF NOT public.check_rate_limit('login_lookup:' || public.request_ip(), 20, 600) THEN
        RETURN NULL;
    END IF;

    SELECT email INTO v_email FROM public.profiles
    WHERE UPPER(doctor_code) = UPPER(TRIM(p_identifier))
      AND LENGTH(TRIM(COALESCE(p_identifier, ''))) BETWEEN 3 AND 40
      AND is_active = true AND COALESCE(account_status, 'active') = 'active'
    LIMIT 1;
    RETURN v_email;
END;
$$;

-- 6.2 Self-signup: only for the caller's own auth user.
CREATE FUNCTION public.doctor_self_signup(
    p_email TEXT,
    p_full_name TEXT,
    p_auth_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_full_name TEXT := LEFT(COALESCE(NULLIF(TRIM(p_full_name), ''), 'Doctor'), 120);
    v_clinic_id UUID;
    v_clinic_name TEXT;
    v_qr_token TEXT;
    v_existing_prof RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Please sign in to complete registration.');
    END IF;
    IF p_auth_user_id IS NOT NULL AND p_auth_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You can only register your own account.');
    END IF;

    SELECT * INTO v_existing_prof FROM public.profiles WHERE id = v_user_id;
    IF v_existing_prof.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'doctor_id', v_existing_prof.id,
            'hospital_id', v_existing_prof.hospital_id,
            'onboarding_status', v_existing_prof.onboarding_status
        );
    END IF;

    -- Use the verified e-mail on the auth account, not the client-supplied one.
    SELECT LOWER(email) INTO v_user_email FROM auth.users WHERE id = v_user_id;
    v_clinic_name := v_full_name || ' Clinic';

    INSERT INTO public.hospitals (name, slug, client_type, plan, subscription_plan, doctor_limit, status)
    VALUES (v_clinic_name, 'clinic-' || SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 8),
            'individual_doctor', 'Individual Doctor Solo', 'Individual Doctor Solo', 1, 'active')
    RETURNING id INTO v_clinic_id;

    INSERT INTO public.profiles (
        id, full_name, email, role, client_type, hospital_id, onboarding_status, is_active, account_status, doctor_code
    ) VALUES (
        v_user_id, v_full_name, v_user_email, 'doctor', 'individual_doctor', v_clinic_id,
        'PROFILE_INCOMPLETE', true, 'active', 'DOC-' || UPPER(SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 6))
    );

    INSERT INTO public.doctor_details (
        id, doctor_code, hospital_id, name, email, clinic_name, specialization, qualification,
        consultation_fee, slot_duration, available_days, available_hours, onboarding_status, is_active
    ) VALUES (
        v_user_id, 'DOC-' || UPPER(SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 6)), v_clinic_id,
        v_full_name, v_user_email, v_clinic_name, 'General Physician', 'MBBS, MD', 500.00, 15,
        '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb, '{"start": "09:00 AM", "end": "05:00 PM"}'::jsonb,
        'PROFILE_INCOMPLETE', true
    );

    v_qr_token := 'QR-DOC-' || UPPER(SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 8));
    INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
    VALUES (v_clinic_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
        'success', true, 'doctor_id', v_user_id, 'hospital_id', v_clinic_id,
        'qr_token', v_qr_token, 'onboarding_status', 'PROFILE_INCOMPLETE'
    );
END;
$$;

-- 6.3 Complete profile: caller must be that doctor (or platform admin).
CREATE FUNCTION public.doctor_complete_profile(
    p_doctor_id UUID,
    p_doctor_name TEXT,
    p_qualification TEXT,
    p_specialization TEXT,
    p_doctor_phone TEXT,
    p_registration_number TEXT,
    p_clinic_name TEXT,
    p_clinic_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_clinic_phone TEXT,
    p_consultation_fee NUMERIC DEFAULT 500.00,
    p_available_days JSONB DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb,
    p_available_hours JSONB DEFAULT '{"start": "09:00 AM", "end": "05:00 PM"}'::jsonb,
    p_slot_duration INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prof RECORD;
BEGIN
    IF auth.uid() IS NULL OR (p_doctor_id <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized to update this profile.');
    END IF;

    SELECT * INTO v_prof FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';
    IF v_prof.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor profile not found.');
    END IF;
    IF COALESCE(v_prof.account_status, 'active') IN ('suspended', 'blocked', 'banned', 'deleted') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This account is not active.');
    END IF;
    IF COALESCE(p_consultation_fee, 0) < 0 OR COALESCE(p_consultation_fee, 0) > 100000
       OR COALESCE(p_slot_duration, 15) NOT BETWEEN 5 AND 240 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid fee or slot duration.');
    END IF;

    -- Only a solo practitioner's private clinic may be renamed from here — a hospital
    -- doctor must not be able to rewrite the whole hospital's record.
    IF v_prof.client_type = 'individual_doctor' AND v_prof.hospital_id IS NOT NULL THEN
        UPDATE public.hospitals SET
            name = LEFT(COALESCE(NULLIF(TRIM(p_clinic_name), ''), TRIM(p_doctor_name) || ' Clinic'), 150),
            address = LEFT(TRIM(p_clinic_address), 300),
            city = LEFT(TRIM(p_city), 80),
            state = LEFT(TRIM(p_state), 80),
            pincode = LEFT(TRIM(p_pincode), 12),
            phone = LEFT(TRIM(COALESCE(NULLIF(p_clinic_phone, ''), p_doctor_phone)), 20),
            updated_at = NOW()
        WHERE id = v_prof.hospital_id AND client_type = 'individual_doctor';
    END IF;

    UPDATE public.profiles SET
        full_name = LEFT(TRIM(p_doctor_name), 120),
        specialization = LEFT(TRIM(p_specialization), 120),
        registration_number = LEFT(TRIM(p_registration_number), 60),
        onboarding_status = CASE WHEN onboarding_status = 'ACTIVE' THEN 'ACTIVE' ELSE 'PAYMENT_PENDING' END,
        updated_at = NOW()
    WHERE id = p_doctor_id;

    UPDATE public.doctor_details SET
        name = LEFT(TRIM(p_doctor_name), 120),
        qualification = LEFT(TRIM(p_qualification), 120),
        specialization = LEFT(TRIM(p_specialization), 120),
        registration_number = LEFT(TRIM(p_registration_number), 60),
        clinic_name = LEFT(TRIM(p_clinic_name), 150),
        clinic_address = LEFT(TRIM(p_clinic_address), 300),
        city = LEFT(TRIM(p_city), 80),
        state = LEFT(TRIM(p_state), 80),
        pincode = LEFT(TRIM(p_pincode), 12),
        clinic_phone = LEFT(TRIM(COALESCE(NULLIF(p_clinic_phone, ''), p_doctor_phone)), 20),
        consultation_fee = COALESCE(p_consultation_fee, 500.00),
        available_days = COALESCE(p_available_days, '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb),
        available_hours = COALESCE(p_available_hours, '{"start": "09:00 AM", "end": "05:00 PM"}'::jsonb),
        slot_duration = COALESCE(p_slot_duration, 15),
        onboarding_status = CASE WHEN onboarding_status = 'ACTIVE' THEN 'ACTIVE' ELSE 'PAYMENT_PENDING' END,
        updated_at = NOW()
    WHERE id = p_doctor_id;

    RETURN jsonb_build_object('success', true, 'onboarding_status', 'PAYMENT_PENDING');
END;
$$;

-- 6.4 Subscription activation.
-- activate_doctor_subscription_internal() does the work and is callable only from the
-- two wrappers below (no API role has EXECUTE on it).
CREATE FUNCTION public.activate_doctor_subscription_internal(
    p_doctor_id UUID,
    p_plan_id TEXT,
    p_payment_provider TEXT,
    p_order_id TEXT,
    p_payment_id TEXT,
    p_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prof RECORD;
    v_hosp_status TEXT;
    v_qr RECORD;
    v_plan TEXT := CASE WHEN p_plan_id = 'doctor_annual' THEN 'doctor_annual' ELSE 'doctor_monthly' END;
BEGIN
    SELECT * INTO v_prof FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';
    IF v_prof.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor profile not found.');
    END IF;

    SELECT status INTO v_hosp_status FROM public.hospitals WHERE id = v_prof.hospital_id;
    IF COALESCE(v_prof.account_status, 'active') IN ('suspended', 'blocked', 'banned', 'deleted')
       OR COALESCE(v_prof.onboarding_status, 'ACTIVE') IN ('SUSPENDED', 'CANCELLED')
       OR COALESCE(v_hosp_status, 'active') IN ('suspended', 'blocked', 'banned', 'deleted') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This account has been restricted. Please contact support.');
    END IF;

    -- Idempotent for replayed payment callbacks: one subscription per gateway payment.
    IF p_payment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.individual_doctor_subscriptions
        WHERE payment_provider = p_payment_provider AND provider_payment_id = p_payment_id
    ) THEN
        SELECT * INTO v_qr FROM public.qr_codes WHERE hospital_id = v_prof.hospital_id LIMIT 1;
        RETURN jsonb_build_object('success', true, 'onboarding_status', 'ACTIVE',
                                  'qr_token', v_qr.token, 'booking_url', v_qr.booking_url, 'duplicate', true);
    END IF;

    INSERT INTO public.individual_doctor_subscriptions (
        doctor_id, hospital_id, plan_id, plan_name, amount, status,
        payment_provider, provider_order_id, provider_payment_id, provider_signature,
        started_at, expires_at, updated_at
    ) VALUES (
        p_doctor_id, v_prof.hospital_id, v_plan,
        CASE WHEN v_plan = 'doctor_annual' THEN 'Annual Professional' ELSE 'Monthly Solo' END,
        CASE WHEN v_plan = 'doctor_annual' THEN 9999.00 ELSE 999.00 END,  -- server-side price, never the client's
        'active', LEFT(p_payment_provider, 40), LEFT(p_order_id, 100), LEFT(p_payment_id, 100), LEFT(p_signature, 200),
        NOW(), NOW() + CASE WHEN v_plan = 'doctor_annual' THEN INTERVAL '365 days' ELSE INTERVAL '30 days' END, NOW()
    );

    UPDATE public.profiles SET onboarding_status = 'ACTIVE', updated_at = NOW() WHERE id = p_doctor_id;
    UPDATE public.doctor_details SET onboarding_status = 'ACTIVE', is_active = true, updated_at = NOW() WHERE id = p_doctor_id;

    SELECT * INTO v_qr FROM public.qr_codes
    WHERE hospital_id = v_prof.hospital_id AND (status = 'active' OR is_active = true) LIMIT 1;
    IF v_qr.id IS NULL THEN
        INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
        VALUES (
            v_prof.hospital_id,
            'QR-DOC-' || UPPER(SUBSTRING(REPLACE(p_doctor_id::text, '-', ''), 1, 8)),
            '/book/QR-DOC-' || UPPER(SUBSTRING(REPLACE(p_doctor_id::text, '-', ''), 1, 8)),
            '/book/QR-DOC-' || UPPER(SUBSTRING(REPLACE(p_doctor_id::text, '-', ''), 1, 8)),
            'active', true
        )
        ON CONFLICT (hospital_id) DO UPDATE SET status = 'active', is_active = true
        RETURNING * INTO v_qr;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'onboarding_status', 'ACTIVE',
        'qr_token', v_qr.token, 'booking_url', v_qr.booking_url
    );
END;
$$;

-- Self-service activation used by the onboarding page. Free while
-- platform_settings.payments_required is false (current behaviour); refused once it is true.
CREATE FUNCTION public.doctor_verify_and_activate_subscription(
    p_doctor_id UUID,
    p_plan_id TEXT,
    p_amount NUMERIC,
    p_payment_provider TEXT DEFAULT 'razorpay',
    p_order_id TEXT DEFAULT NULL,
    p_payment_id TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR (p_doctor_id <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized to activate this account.');
    END IF;

    IF NOT public.is_super_admin()
       AND EXISTS (SELECT 1 FROM public.platform_settings WHERE key = 'payments_required' AND value = 'true'::jsonb) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Please complete the subscription payment to activate your practice.');
    END IF;

    -- The client-supplied payment fields are not trusted here; record the activation as unverified.
    RETURN public.activate_doctor_subscription_internal(
        p_doctor_id, p_plan_id,
        CASE WHEN public.is_super_admin() THEN 'manual_admin_provision' ELSE 'unverified_self_activation' END,
        NULL, NULL, NULL
    );
END;
$$;

-- Called only by the `payments` edge function (service role) after it has verified the
-- Razorpay signature and fetched the captured payment from Razorpay's API.
CREATE FUNCTION public.activate_paid_subscription(
    p_doctor_id UUID,
    p_plan_id TEXT,
    p_order_id TEXT,
    p_payment_id TEXT,
    p_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF COALESCE(p_order_id, '') = '' OR COALESCE(p_payment_id, '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing payment reference.');
    END IF;
    RETURN public.activate_doctor_subscription_internal(
        p_doctor_id, p_plan_id, 'razorpay', p_order_id, p_payment_id, p_signature
    );
END;
$$;

-- 6.5 Follow-ups: only the treating doctor or that hospital's staff.
CREATE FUNCTION public.create_follow_up(
    p_parent_appointment_id UUID,
    p_follow_up_date DATE,
    p_reason TEXT DEFAULT NULL,
    p_instructions TEXT DEFAULT NULL,
    p_preferred_time TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_parent RECORD;
    v_next_seq INTEGER;
    v_token TEXT;
    v_follow_up_id UUID;
    v_appt_id UUID;
    v_queue_token INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated.');
    END IF;

    SELECT * INTO v_parent FROM public.appointments WHERE id = p_parent_appointment_id;
    IF v_parent.id IS NULL
       OR NOT (public.is_super_admin()
               OR (v_parent.hospital_id = public.current_hospital_id()
                   AND (v_parent.doctor_id = auth.uid() OR public.is_hospital_staff()))) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Original appointment not found.');
    END IF;

    IF p_follow_up_date IS NULL OR p_follow_up_date < CURRENT_DATE OR p_follow_up_date > CURRENT_DATE + 365 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Follow-up date must be within the next year.');
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('followup:' || v_parent.doctor_id::text || ':' || p_follow_up_date::text, 0));
    PERFORM pg_advisory_xact_lock(hashtextextended('token:' || v_parent.doctor_id::text || ':' || p_follow_up_date::text, 0));

    -- BUG-002: follow-up visits used to be inserted with no token_number, which made the
    -- queue-notification trigger build a NULL message and abort the whole transaction.
    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_queue_token
    FROM public.appointments
    WHERE doctor_id = v_parent.doctor_id AND appointment_date = p_follow_up_date;

    SELECT COALESCE(MAX(NULLIF(regexp_replace(follow_up_token, '[^0-9]', '', 'g'), '')::integer), 0) + 1
    INTO v_next_seq
    FROM public.follow_ups
    WHERE doctor_id = v_parent.doctor_id AND follow_up_date = p_follow_up_date;

    v_token := 'F-' || LPAD(v_next_seq::text, 3, '0');

    INSERT INTO public.appointments (
        hospital_id, doctor_id, department_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        token_number, queue_number, tracking_token,
        appointment_date, appointment_time, symptoms, notes, status, payment_status, consultation_fee
    ) VALUES (
        v_parent.hospital_id, v_parent.doctor_id, v_parent.department_id, v_parent.patient_id, v_parent.patient_name,
        v_parent.patient_phone, v_parent.patient_age, v_parent.patient_gender,
        v_queue_token, v_token, 'TRK-' || UPPER(REPLACE(gen_random_uuid()::text, '-', '')),
        p_follow_up_date,
        LEFT(COALESCE(p_preferred_time, '09:00 AM'), 20),
        'Follow-up: ' || LEFT(COALESCE(p_reason, 'Review'), 500), 'Auto-scheduled follow-up (Token ' || v_token || ')',
        'Waiting', 'Paid', 0.00
    ) RETURNING id INTO v_appt_id;

    INSERT INTO public.follow_ups (
        hospital_id, doctor_id, patient_id, parent_appointment_id, follow_up_appointment_id,
        follow_up_date, follow_up_token, reason, instructions, preferred_time, status
    ) VALUES (
        v_parent.hospital_id, v_parent.doctor_id, v_parent.patient_id, p_parent_appointment_id, v_appt_id,
        p_follow_up_date, v_token, LEFT(p_reason, 500), LEFT(p_instructions, 2000), LEFT(p_preferred_time, 20), 'scheduled'
    ) RETURNING id INTO v_follow_up_id;

    RETURN jsonb_build_object(
        'success', true, 'follow_up_id', v_follow_up_id, 'follow_up_token', v_token,
        'appointment_id', v_appt_id, 'follow_up_date', p_follow_up_date
    );
END;
$$;

-- 6.6 Activity log: authenticated callers only.
CREATE FUNCTION public.log_activity(
    p_category TEXT,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_target_label TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor RECORD;
    v_log_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
    END IF;

    SELECT hospital_id, role, email, full_name INTO v_actor FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.activity_logs (
        hospital_id, actor_id, actor_name, actor_email, actor_role, category, action,
        target_type, target_id, target_label, status, metadata
    ) VALUES (
        v_actor.hospital_id, auth.uid(), v_actor.full_name, v_actor.email, v_actor.role,
        LEFT(p_category, 60), LEFT(p_action, 120), LEFT(p_target_type, 60), p_target_id::TEXT,
        LEFT(p_target_label, 200),
        CASE WHEN p_status IN ('success', 'failed', 'pending') THEN p_status ELSE 'success' END,
        COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 6.7 Group chat: members must belong to the caller's hospital.
CREATE FUNCTION public.create_group_conversation(p_name TEXT, p_member_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_my_hospital UUID := public.current_hospital_id();
    v_conv_id UUID;
    v_member UUID;
BEGIN
    IF v_my_hospital IS NULL THEN
        RAISE EXCEPTION 'User must belong to an active hospital.';
    END IF;

    INSERT INTO public.chat_conversations (hospital_id, type, name, created_by)
    VALUES (v_my_hospital, 'group', LEFT(p_name, 100), auth.uid())
    RETURNING id INTO v_conv_id;

    INSERT INTO public.chat_members (conversation_id, user_id, role) VALUES (v_conv_id, auth.uid(), 'owner');

    FOREACH v_member IN ARRAY COALESCE(p_member_ids, ARRAY[]::UUID[]) LOOP
        IF v_member <> auth.uid()
           AND EXISTS (SELECT 1 FROM public.profiles WHERE id = v_member AND hospital_id = v_my_hospital) THEN
            INSERT INTO public.chat_members (conversation_id, user_id, role)
            VALUES (v_conv_id, v_member, 'member')
            ON CONFLICT (conversation_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN v_conv_id;
END;
$$;

-- 6.8 Public booking info (exact token match; only bookable doctors).
CREATE FUNCTION public.get_qr_booking_info(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_token TEXT := TRIM(COALESCE(p_token, ''));
    v_qr RECORD;
    v_hosp RECORD;
    v_departments JSONB;
    v_doctors JSONB;
    v_single_doc JSONB;
    v_possible_uuid UUID;
BEGIN
    IF v_clean_token LIKE 'tok\_%' THEN v_clean_token := SUBSTRING(v_clean_token FROM 5); END IF;
    IF v_clean_token = '' OR LENGTH(v_clean_token) > 64 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or unrecognized QR booking code.');
    END IF;

    SELECT * INTO v_qr FROM public.qr_codes
    WHERE (token = v_clean_token OR booking_url = '/book/' || v_clean_token)
      AND (status = 'active' OR is_active = true)
    LIMIT 1;

    IF v_qr.id IS NULL THEN
        v_possible_uuid := public.try_uuid(v_clean_token);
        IF v_possible_uuid IS NOT NULL THEN
            SELECT * INTO v_qr FROM public.qr_codes
            WHERE hospital_id = v_possible_uuid AND (status = 'active' OR is_active = true) LIMIT 1;
            IF v_qr.id IS NULL THEN
                INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
                SELECT id, 'QR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)),
                       '/book/QR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)),
                       '/book/QR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)), 'active', true
                FROM public.hospitals
                WHERE id = v_possible_uuid AND status = 'active'
                  AND NOT EXISTS (SELECT 1 FROM public.qr_codes WHERE hospital_id = v_possible_uuid)
                RETURNING * INTO v_qr;
            END IF;
        END IF;
    END IF;

    IF v_qr.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or unrecognized QR booking code.');
    END IF;

    SELECT id, name, phone, email, address, city, state, pincode, client_type, status
    INTO v_hosp FROM public.hospitals WHERE id = v_qr.hospital_id;

    IF v_hosp.id IS NULL OR v_hosp.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This clinic/hospital facility is currently inactive.');
    END IF;

    UPDATE public.qr_codes SET scans_count = COALESCE(scans_count, 0) + 1, last_scanned_at = NOW() WHERE id = v_qr.id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'doctor_code', COALESCE(p.doctor_code, 'DOC-' || SUBSTRING(p.id::text, 1, 6)),
        'name', p.full_name,
        'department_id', p.department_id,
        'department', COALESCE(p.department, dd.specialization, 'Consultation'),
        'specialization', COALESCE(p.specialization, dd.specialization, 'Consultant Specialist'),
        'qualification', COALESCE(dd.qualification, 'MBBS, MD'),
        'registration_number', dd.registration_number,
        'fee', COALESCE(dd.consultation_fee, 500),
        'room', COALESCE(dd.room_number, 'Consultation Room'),
        'daily_limit', COALESCE(dd.daily_patient_limit, 40),
        'slot_duration', COALESCE(dd.slot_duration, 15),
        'available_days', COALESCE(dd.available_days, '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb),
        'available_hours', COALESCE(dd.available_hours, '{"start": "09:00 AM", "end": "05:00 PM"}'::jsonb),
        'clinic_name', COALESCE(dd.clinic_name, v_hosp.name),
        'clinic_address', COALESCE(dd.clinic_address, v_hosp.address),
        'city', COALESCE(dd.city, v_hosp.city),
        'availability_status', COALESCE(dd.availability_status, 'active')
    ) ORDER BY p.full_name ASC), '[]'::jsonb)
    INTO v_doctors
    FROM public.profiles p
    LEFT JOIN public.doctor_details dd ON dd.id = p.id
    WHERE p.hospital_id = v_hosp.id
      AND p.role = 'doctor'
      AND p.is_active = true
      AND COALESCE(p.account_status, 'active') = 'active'
      AND (p.client_type IS DISTINCT FROM 'individual_doctor' OR COALESCE(p.onboarding_status, 'ACTIVE') = 'ACTIVE');

    IF v_hosp.client_type = 'individual_doctor' OR jsonb_array_length(v_doctors) = 1 THEN
        v_single_doc := v_doctors->0;
        RETURN jsonb_build_object(
            'success', true,
            'is_individual_doctor', true,
            'client_type', 'individual_doctor',
            'hospital', jsonb_build_object(
                'id', v_hosp.id, 'name', v_hosp.name, 'phone', v_hosp.phone, 'email', v_hosp.email,
                'address', v_hosp.address, 'city', v_hosp.city, 'state', v_hosp.state,
                'pincode', v_hosp.pincode, 'client_type', 'individual_doctor'
            ),
            'clinic', jsonb_build_object(
                'id', v_hosp.id, 'name', v_hosp.name, 'phone', v_hosp.phone, 'email', v_hosp.email,
                'address', v_hosp.address, 'city', v_hosp.city, 'state', v_hosp.state, 'pincode', v_hosp.pincode
            ),
            'doctor', v_single_doc,
            'departments', '[]'::jsonb,
            'doctors', v_doctors
        );
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'description', d.description,
        'is_opd', (LOWER(d.name) = 'opd' OR LOWER(d.name) LIKE '%opd%')
    ) ORDER BY (CASE WHEN LOWER(d.name) = 'opd' OR LOWER(d.name) LIKE '%opd%' THEN 0 ELSE 1 END), d.name ASC), '[]'::jsonb)
    INTO v_departments FROM public.departments d WHERE d.hospital_id = v_hosp.id AND d.is_active = true;

    RETURN jsonb_build_object(
        'success', true,
        'is_individual_doctor', false,
        'client_type', 'hospital',
        'hospital', jsonb_build_object('id', v_hosp.id, 'name', v_hosp.name, 'phone', v_hosp.phone,
                                       'email', v_hosp.email, 'address', v_hosp.address, 'city', v_hosp.city),
        'departments', v_departments,
        'doctors', v_doctors
    );
END;
$$;

-- 6.9 Returning-patient lookup on the public booking page.
-- A QR token is printed on posters and a patient ID is not a secret, so this returns
-- only what is needed to recognise a returning patient — never medical history,
-- DOB, full phone number or full name.
CREATE FUNCTION public.lookup_patient_by_qr(
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
    v_clean_token TEXT := TRIM(COALESCE(p_token, ''));
    v_clean_phone TEXT := TRIM(COALESCE(p_mobile, ''));
    v_clean_pnum TEXT := TRIM(COALESCE(p_patient_number, ''));
BEGIN
    IF v_clean_token LIKE 'tok\_%' THEN v_clean_token := SUBSTRING(v_clean_token FROM 5); END IF;

    IF NOT public.check_rate_limit('patient_lookup:' || public.request_ip(), 30, 600) THEN
        RETURN jsonb_build_object('success', false, 'found', false, 'error', 'Too many lookups. Please try again in a few minutes.');
    END IF;

    SELECT q.hospital_id INTO v_hospital_id
    FROM public.qr_codes q JOIN public.hospitals h ON h.id = q.hospital_id
    WHERE (q.token = v_clean_token OR q.booking_url = '/book/' || v_clean_token OR q.hospital_id = public.try_uuid(v_clean_token))
      AND (q.status = 'active' OR q.is_active = true) AND h.status = 'active'
    LIMIT 1;

    IF v_hospital_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'found', false, 'error', 'Hospital not found for this QR code.');
    END IF;

    IF v_clean_phone = '' AND v_clean_pnum = '' THEN
        RETURN jsonb_build_object('success', false, 'found', false, 'error', 'Patient number or mobile number required.');
    END IF;

    SELECT * INTO v_patient FROM public.patients
    WHERE hospital_id = v_hospital_id
      AND ((v_clean_phone <> '' AND (phone = v_clean_phone OR patient_number = v_clean_phone))
           OR (v_clean_pnum <> '' AND (patient_number = v_clean_pnum OR phone = v_clean_pnum)))
    ORDER BY created_at DESC LIMIT 1;

    IF v_patient.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'found', false);
    END IF;

    SELECT a.doctor_id, p.full_name AS doctor_name INTO v_last_appt
    FROM public.appointments a LEFT JOIN public.profiles p ON p.id = a.doctor_id
    WHERE a.patient_id = v_patient.id
    ORDER BY a.created_at DESC LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'found', true,
        'patient', jsonb_build_object(
            'patient_number', v_patient.patient_number,
            'name', public.mask_name(v_patient.name),
            'gender', v_patient.gender,
            'age', v_patient.age,
            'previous_doctor_id', v_last_appt.doctor_id,
            'previous_doctor_name', v_last_appt.doctor_name
        )
    );
END;
$$;

-- 6.10 Atomic QR booking.
CREATE FUNCTION public.book_qr_appointment(
    p_doctor_id UUID,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_qr_token TEXT DEFAULT NULL,
    p_hospital_id UUID DEFAULT NULL,
    p_appointment_date DATE DEFAULT CURRENT_DATE,
    p_appointment_time TEXT DEFAULT '09:00 AM',
    p_patient_gender TEXT DEFAULT 'Other',
    p_patient_age INTEGER DEFAULT 30,
    p_patient_dob DATE DEFAULT NULL,
    p_symptoms TEXT DEFAULT NULL,
    p_known_diseases TEXT DEFAULT NULL,
    p_previous_medicine TEXT DEFAULT NULL,
    p_previous_doctor_id UUID DEFAULT NULL,
    p_patient_number TEXT DEFAULT NULL,
    p_booking_method TEXT DEFAULT 'QR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_token TEXT;
    v_hospital_id UUID;
    v_hosp RECORD;
    v_phone TEXT := TRIM(COALESCE(p_patient_phone, ''));
    v_phone_digits TEXT := regexp_replace(COALESCE(p_patient_phone, ''), '[^0-9]', '', 'g');
    v_name TEXT := LEFT(TRIM(COALESCE(p_patient_name, '')), 100);
    v_date DATE := COALESCE(p_appointment_date, CURRENT_DATE);
    v_patient_id UUID;
    v_patient_number TEXT;
    v_existing_name TEXT;
    v_seq INTEGER;
    v_appointment_id UUID;
    v_token_number INTEGER;
    v_queue_number TEXT;
    v_tracking_token TEXT;
    v_patients_ahead INTEGER := 0;
    v_est_wait INTEGER := 10;
    v_doctor RECORD;
    v_dept_name TEXT;
    v_fee NUMERIC(10, 2);
    v_room TEXT;
    v_method TEXT;
BEGIN
    IF v_name = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient name is required.');
    END IF;
    IF LENGTH(v_phone_digits) NOT BETWEEN 10 AND 15 OR LENGTH(v_phone) > 20 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Valid 10-digit phone number is required.');
    END IF;
    IF v_date < CURRENT_DATE - 1 OR v_date > CURRENT_DATE + 90 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Appointments can only be booked for the next 90 days.');
    END IF;
    IF p_patient_age IS NOT NULL AND (p_patient_age < 0 OR p_patient_age > 130) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid patient age.');
    END IF;
    IF LENGTH(COALESCE(p_symptoms, '')) > 2000 OR LENGTH(COALESCE(p_known_diseases, '')) > 2000
       OR LENGTH(COALESCE(p_previous_medicine, '')) > 2000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Details are too long (max 2000 characters).');
    END IF;

    -- Resolve hospital: explicit id, QR token, or the doctor's own hospital.
    v_hospital_id := p_hospital_id;
    IF v_hospital_id IS NULL AND p_qr_token IS NOT NULL THEN
        v_clean_token := TRIM(p_qr_token);
        IF v_clean_token LIKE 'tok\_%' THEN v_clean_token := SUBSTRING(v_clean_token FROM 5); END IF;
        SELECT hospital_id INTO v_hospital_id FROM public.qr_codes
        WHERE (token = v_clean_token OR booking_url = '/book/' || v_clean_token)
          AND (status = 'active' OR is_active = true)
        LIMIT 1;
        IF v_hospital_id IS NULL THEN
            v_hospital_id := public.try_uuid(v_clean_token);
        END IF;
    END IF;
    IF v_hospital_id IS NULL AND p_doctor_id IS NOT NULL THEN
        SELECT hospital_id INTO v_hospital_id FROM public.profiles WHERE id = p_doctor_id;
    END IF;

    SELECT id, name, status INTO v_hosp FROM public.hospitals WHERE id = v_hospital_id;
    IF v_hosp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Hospital facility could not be determined.');
    END IF;
    IF v_hosp.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This clinic/hospital is not accepting bookings.');
    END IF;

    IF NOT public.check_rate_limit('booking_ip:' || public.request_ip(), 30, 3600)
       OR NOT public.check_rate_limit('booking_phone:' || v_hospital_id::text || ':' || v_phone_digits, 5, 86400) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many bookings from this device or phone number. Please contact the hospital.');
    END IF;

    -- The doctor must belong to that hospital and be fully active.
    SELECT id, full_name, department_id, department, doctor_code, is_active, account_status, onboarding_status, client_type
    INTO v_doctor
    FROM public.profiles
    WHERE id = p_doctor_id AND hospital_id = v_hospital_id AND role = 'doctor';

    IF v_doctor.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor not found at this hospital.');
    END IF;
    IF NOT v_doctor.is_active OR COALESCE(v_doctor.account_status, 'active') <> 'active'
       OR (v_doctor.client_type = 'individual_doctor' AND COALESCE(v_doctor.onboarding_status, 'ACTIVE') <> 'ACTIVE') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This doctor is currently unavailable.');
    END IF;
    IF EXISTS (SELECT 1 FROM public.doctor_availability WHERE doctor_id = p_doctor_id AND date = v_date) THEN
        RETURN jsonb_build_object('success', false, 'error', 'This doctor is not available on the selected date.');
    END IF;

    SELECT consultation_fee, room_number INTO v_fee, v_room FROM public.doctor_details WHERE id = p_doctor_id;
    v_fee := COALESCE(v_fee, 500.00);
    v_room := COALESCE(v_room, 'Room 101');
    v_dept_name := COALESCE(v_doctor.department, 'General Medicine');

    -- Find-or-create the permanent patient (serialised per hospital+phone).
    PERFORM pg_advisory_xact_lock(hashtextextended('patient:' || v_hospital_id::text || ':' || v_phone, 0));

    SELECT id, patient_number, name INTO v_patient_id, v_patient_number, v_existing_name
    FROM public.patients
    WHERE hospital_id = v_hospital_id AND phone = v_phone
    ORDER BY created_at ASC LIMIT 1;

    IF v_patient_id IS NULL THEN
        INSERT INTO public.hospital_patient_daily_counters (hospital_id, patient_date, last_number, updated_at)
        VALUES (v_hospital_id, v_date, 1, NOW())
        ON CONFLICT (hospital_id, patient_date)
        DO UPDATE SET last_number = public.hospital_patient_daily_counters.last_number + 1, updated_at = NOW()
        RETURNING last_number INTO v_seq;

        v_patient_number := TO_CHAR(v_date, 'YYYYMMDD') || LPAD(v_seq::TEXT, 2, '0');

        INSERT INTO public.patients (
            hospital_id, name, phone, age, gender, date_of_birth, known_diseases, previous_medicine, patient_number
        ) VALUES (
            v_hospital_id, v_name, v_phone, p_patient_age, LEFT(p_patient_gender, 20),
            p_patient_dob, p_known_diseases, p_previous_medicine, v_patient_number
        ) RETURNING id INTO v_patient_id;
    ELSE
        -- An anonymous booker must not be able to rewrite an existing patient's record:
        -- only fill in fields that are still empty, and keep the stored name.
        UPDATE public.patients SET
            age = COALESCE(age, p_patient_age),
            gender = COALESCE(gender, LEFT(p_patient_gender, 20)),
            date_of_birth = COALESCE(date_of_birth, p_patient_dob),
            known_diseases = COALESCE(known_diseases, p_known_diseases),
            previous_medicine = COALESCE(previous_medicine, p_previous_medicine),
            updated_at = NOW()
        WHERE id = v_patient_id;
        v_name := COALESCE(v_existing_name, v_name);
    END IF;

    -- Serialise token assignment per doctor+date (also used by create_manual_appointment).
    PERFORM pg_advisory_xact_lock(hashtextextended('token:' || p_doctor_id::text || ':' || v_date::text, 0));

    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_token_number
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = v_date;

    v_queue_number := UPPER(LEFT(COALESCE(v_dept_name, 'OPD'), 1)) || '-' || LPAD(v_token_number::TEXT, 3, '0');
    -- Unguessable tracking secret (the queue number is sequential and must not unlock data).
    v_tracking_token := 'TRK-' || UPPER(REPLACE(gen_random_uuid()::text, '-', ''));

    SELECT COUNT(*) INTO v_patients_ahead
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = v_date AND status = 'Waiting';

    v_est_wait := v_patients_ahead * 12 + 10;

    v_method := CASE
        WHEN UPPER(COALESCE(p_booking_method, 'QR')) = 'AI' THEN 'AI'
        WHEN UPPER(COALESCE(p_booking_method, 'QR')) IN ('MANUAL', 'WALK-IN', 'WALK_IN', 'FRONT_DESK', 'RECEPTION') THEN 'Manual'
        WHEN UPPER(COALESCE(p_booking_method, 'QR')) = 'ONLINE' THEN 'Online'
        ELSE 'QR'
    END;

    INSERT INTO public.appointments (
        token_number, queue_number, tracking_token, hospital_id, doctor_id, department_id, patient_id,
        patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, appointment_time, symptoms, status, payment_status, consultation_fee, booking_method
    ) VALUES (
        v_token_number, v_queue_number, v_tracking_token, v_hospital_id, p_doctor_id, v_doctor.department_id, v_patient_id,
        v_name, v_phone, p_patient_age, LEFT(p_patient_gender, 20),
        v_date, LEFT(COALESCE(p_appointment_time, '09:00 AM'), 20), p_symptoms, 'Waiting', 'Pending', v_fee, v_method
    ) RETURNING id INTO v_appointment_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'token_number', v_token_number,
        'queue_number', v_queue_number,
        'tracking_token', v_tracking_token,
        'queue_position', v_token_number,
        'patients_ahead', v_patients_ahead,
        'estimated_wait_mins', v_est_wait,
        'hospital_id', v_hospital_id,
        'hospital_name', v_hosp.name,
        'doctor_id', p_doctor_id,
        'doctor_name', v_doctor.full_name,
        'doctor_code', v_doctor.doctor_code,
        'department_id', v_doctor.department_id,
        'department', v_dept_name,
        'department_name', v_dept_name,
        'patient_id', v_patient_id,
        'patient_number', v_patient_number,
        'patient_name', v_name,
        'patient_phone', v_phone,
        'patient_age', p_patient_age,
        'patient_gender', p_patient_gender,
        'appointment_date', v_date,
        'appointment_time', p_appointment_time,
        'room', v_room,
        'fee', v_fee,
        'status', 'Waiting',
        'booking_method', v_method
    );
END;
$$;

-- 6.11 Front-desk manual booking (same token lock as QR booking).
CREATE FUNCTION public.create_manual_appointment(
    p_doctor_id UUID,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_patient_age INTEGER DEFAULT NULL,
    p_patient_gender TEXT DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_symptoms TEXT DEFAULT NULL,
    p_is_emergency BOOLEAN DEFAULT false,
    p_appointment_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_hospital UUID := public.current_hospital_id();
    v_doctor_hospital UUID;
    v_next_token INTEGER;
    v_queue_number TEXT;
    v_appt_id UUID;
    v_dept_name TEXT;
    v_patient_id UUID;
    v_patient_number TEXT;
    v_seq INTEGER;
    v_date DATE := COALESCE(p_appointment_date, CURRENT_DATE);
    v_phone TEXT := TRIM(COALESCE(p_patient_phone, ''));
BEGIN
    IF NOT (public.is_hospital_staff() OR public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized to create appointments.');
    END IF;

    SELECT hospital_id INTO v_doctor_hospital FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';
    IF v_doctor_hospital IS NULL OR (NOT public.is_super_admin() AND v_doctor_hospital IS DISTINCT FROM v_caller_hospital) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor does not belong to your hospital.');
    END IF;

    IF TRIM(COALESCE(p_patient_name, '')) = '' OR v_phone = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient name and phone are required.');
    END IF;
    IF v_date < CURRENT_DATE - 1 OR v_date > CURRENT_DATE + 365 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid appointment date.');
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('patient:' || v_doctor_hospital::text || ':' || v_phone, 0));

    SELECT id, patient_number INTO v_patient_id, v_patient_number
    FROM public.patients
    WHERE hospital_id = v_doctor_hospital AND phone = v_phone
    ORDER BY created_at ASC LIMIT 1;

    IF v_patient_id IS NULL THEN
        INSERT INTO public.hospital_patient_daily_counters (hospital_id, patient_date, last_number, updated_at)
        VALUES (v_doctor_hospital, v_date, 1, NOW())
        ON CONFLICT (hospital_id, patient_date)
        DO UPDATE SET last_number = public.hospital_patient_daily_counters.last_number + 1, updated_at = NOW()
        RETURNING last_number INTO v_seq;

        v_patient_number := TO_CHAR(v_date, 'YYYYMMDD') || LPAD(v_seq::TEXT, 2, '0');

        INSERT INTO public.patients (hospital_id, name, phone, age, gender, patient_number)
        VALUES (v_doctor_hospital, LEFT(TRIM(p_patient_name), 100), v_phone, p_patient_age, LEFT(p_patient_gender, 20), v_patient_number)
        RETURNING id INTO v_patient_id;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('token:' || p_doctor_id::text || ':' || v_date::text, 0));

    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_next_token
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = v_date;

    IF p_department_id IS NOT NULL THEN
        SELECT name INTO v_dept_name FROM public.departments WHERE id = p_department_id AND hospital_id = v_doctor_hospital;
    END IF;
    v_queue_number := UPPER(LEFT(COALESCE(v_dept_name, 'OPD'), 1)) || '-' || LPAD(v_next_token::TEXT, 3, '0');

    INSERT INTO public.appointments (
        hospital_id, doctor_id, department_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, queue_number, token_number, tracking_token, status, symptoms, is_emergency, booking_method
    ) VALUES (
        v_doctor_hospital, p_doctor_id, CASE WHEN v_dept_name IS NULL THEN NULL ELSE p_department_id END, v_patient_id,
        LEFT(TRIM(p_patient_name), 100), v_phone, p_patient_age, LEFT(p_patient_gender, 20),
        v_date, v_queue_number, v_next_token, 'TRK-' || UPPER(REPLACE(gen_random_uuid()::text, '-', '')),
        'Waiting', LEFT(p_symptoms, 2000), COALESCE(p_is_emergency, false), 'Manual'
    ) RETURNING id INTO v_appt_id;

    RETURN jsonb_build_object(
        'success', true, 'appointment_id', v_appt_id, 'queue_number', v_queue_number,
        'token_number', v_next_token, 'patient_id', v_patient_id, 'patient_number', v_patient_number
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Could not create the appointment.');
END;
$$;

-- 6.12 Public live-queue status.
-- Unscoped lookups are allowed only with an unguessable TRK- secret or an appointment
-- UUID. Queue numbers, patient IDs and phone numbers require the hospital context, and
-- anything not unlocked by the TRK- secret is returned masked.
CREATE FUNCTION public.get_live_queue_status(
    p_tracking_token TEXT,
    p_hospital_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_input TEXT := TRIM(COALESCE(p_tracking_token, ''));
    v_digits_only TEXT := regexp_replace(COALESCE(p_tracking_token, ''), '[^0-9]', '', 'g');
    v_is_secret BOOLEAN := UPPER(TRIM(COALESCE(p_tracking_token, ''))) ~ '^TRK-[0-9A-F]{32}$';
    v_input_uuid UUID := public.try_uuid(TRIM(COALESCE(p_tracking_token, '')));
    v_hosp_input TEXT := TRIM(COALESCE(p_hospital_id, ''));
    v_target_hosp_id UUID := NULL;
    v_appt RECORD;
    v_waiting_count INTEGER := 0;
    v_current_token INTEGER;
    v_queue_progress JSONB := '[]'::jsonb;
    v_notifications JSONB := '[]'::jsonb;
    v_matched_appts JSONB := '[]'::jsonb;
    v_status_label TEXT := 'Waiting';
BEGIN
    IF v_clean_input = '' OR LENGTH(v_clean_input) > 64 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mobile number, Patient ID, or Tracking token is required.');
    END IF;
    IF v_is_secret THEN v_clean_input := UPPER(v_clean_input); END IF;

    -- The tracker polls every 12 s, so this still allows several open tabs per client.
    IF NOT public.check_rate_limit('queue_status:' || public.request_ip(), 400, 600) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many requests. Please try again in a few minutes.');
    END IF;

    IF v_hosp_input <> '' THEN
        v_target_hosp_id := public.try_uuid(v_hosp_input);
        IF v_target_hosp_id IS NULL THEN
            SELECT hospital_id INTO v_target_hosp_id FROM public.qr_codes
            WHERE token = v_hosp_input OR booking_url = '/book/' || v_hosp_input LIMIT 1;
        END IF;
        IF v_target_hosp_id IS NULL THEN
            SELECT id INTO v_target_hosp_id FROM public.hospitals
            WHERE subdomain = v_hosp_input OR slug = v_hosp_input LIMIT 1;
        END IF;
        IF v_target_hosp_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Hospital not found.');
        END IF;
    ELSIF NOT v_is_secret AND v_input_uuid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error',
            'Please search from your hospital''s tracking page, or use the tracking link from your booking.');
    END IF;

    -- Every appointment for this patient in the hospital (hospital-scoped search only).
    IF v_target_hosp_id IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', sub.id,
            'token_number', sub.token_number,
            'queue_number', sub.queue_number,
            'tracking_token', CASE WHEN v_is_secret THEN sub.tracking_token ELSE NULL END,
            'patient_id', sub.patient_id,
            'patient_number', sub.patient_number,
            'patient_name', CASE WHEN v_is_secret THEN sub.patient_name ELSE public.mask_name(sub.patient_name) END,
            'doctor_id', sub.doctor_id,
            'doctor_name', sub.doctor_name,
            'department', sub.department,
            'appointment_date', sub.appointment_date,
            'status', sub.status,
            'created_at', sub.created_at
        ) ORDER BY (CASE WHEN sub.appointment_date = CURRENT_DATE THEN 0 ELSE 1 END), sub.created_at DESC), '[]'::jsonb)
        INTO v_matched_appts
        FROM (
            SELECT a.*, p.full_name AS doctor_name, p.department, pt.patient_number
            FROM public.appointments a
            LEFT JOIN public.profiles p ON p.id = a.doctor_id
            LEFT JOIN public.patients pt ON pt.id = a.patient_id
            WHERE a.hospital_id = v_target_hosp_id
              AND (
                  a.id = v_input_uuid
                  OR a.tracking_token = v_clean_input
                  OR a.queue_number = v_clean_input
                  OR (pt.patient_number IS NOT NULL AND pt.patient_number = v_clean_input)
                  OR pt.id = v_input_uuid
                  OR a.patient_phone = v_clean_input
                  OR (LENGTH(v_digits_only) >= 10 AND (
                        a.patient_phone LIKE '%' || RIGHT(v_digits_only, 10)
                        OR pt.phone LIKE '%' || RIGHT(v_digits_only, 10)))
              )
            ORDER BY a.created_at DESC
            LIMIT 20
        ) sub;
    END IF;

    SELECT a.*, p.full_name AS doctor_name, p.doctor_code, p.department, dd.room_number,
           h.name AS hospital_name, pt.patient_number
    INTO v_appt
    FROM public.appointments a
    LEFT JOIN public.profiles p ON p.id = a.doctor_id
    LEFT JOIN public.doctor_details dd ON dd.id = a.doctor_id
    LEFT JOIN public.hospitals h ON h.id = a.hospital_id
    LEFT JOIN public.patients pt ON pt.id = a.patient_id
    WHERE (v_target_hosp_id IS NULL OR a.hospital_id = v_target_hosp_id)
      AND (
          a.id = v_input_uuid
          OR (v_is_secret AND a.tracking_token = v_clean_input)
          OR (v_target_hosp_id IS NOT NULL AND (
                a.tracking_token = v_clean_input
                OR a.queue_number = v_clean_input
                OR (pt.patient_number IS NOT NULL AND pt.patient_number = v_clean_input)
                OR pt.id = v_input_uuid
                OR a.patient_phone = v_clean_input
                OR (LENGTH(v_digits_only) >= 10 AND (
                      a.patient_phone LIKE '%' || RIGHT(v_digits_only, 10)
                      OR pt.phone LIKE '%' || RIGHT(v_digits_only, 10)))
          ))
      )
    ORDER BY
        (CASE WHEN a.appointment_date = CURRENT_DATE THEN 0 ELSE 1 END),
        (CASE WHEN a.status IN ('Waiting', 'In Consultation') THEN 0 ELSE 1 END),
        a.created_at DESC
    LIMIT 1;

    IF v_appt.id IS NULL THEN
        IF v_target_hosp_id IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'No active appointment found for this hospital.');
        END IF;
        RETURN jsonb_build_object('success', false, 'error', 'No active appointment found for this tracking token or patient ID.');
    END IF;

    SELECT MIN(token_number) INTO v_current_token
    FROM public.appointments
    WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date AND status = 'In Consultation';
    IF v_current_token IS NULL THEN
        SELECT COALESCE(MIN(token_number), v_appt.token_number) INTO v_current_token
        FROM public.appointments
        WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date AND status = 'Waiting';
    END IF;

    SELECT COUNT(*) INTO v_waiting_count
    FROM public.appointments
    WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date
      AND status IN ('Waiting', 'In Consultation') AND token_number < v_appt.token_number;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'token_number', sub.token_number,
        'queue_number', sub.queue_number,
        'status', sub.status,
        'is_current', (sub.token_number = v_current_token),
        'is_you', (sub.id = v_appt.id)
    ) ORDER BY sub.token_number ASC), '[]'::jsonb)
    INTO v_queue_progress
    FROM (
        SELECT id, token_number, queue_number, status FROM public.appointments
        WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date
    ) sub;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'type', type, 'title', title, 'message', message, 'created_at', created_at, 'is_read', is_read
    ) ORDER BY created_at DESC), '[]'::jsonb)
    INTO v_notifications
    FROM public.notifications WHERE appointment_id = v_appt.id;

    IF v_appt.status = 'In Consultation' THEN v_status_label := 'Now Serving';
    ELSIF v_appt.status = 'Completed' THEN v_status_label := 'Completed';
    ELSIF v_appt.status = 'Cancelled' THEN v_status_label := 'Cancelled';
    ELSIF v_appt.status = 'No Show' THEN v_status_label := 'Missed';
    ELSIF v_waiting_count <= 2 THEN v_status_label := 'Your Turn Soon';
    ELSE v_status_label := 'Waiting';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appt.id,
        'token_number', v_appt.token_number,
        'original_token', v_appt.token_number,
        'queue_number', COALESCE(v_appt.queue_number, 'OPD-' || LPAD(v_appt.token_number::TEXT, 3, '0')),
        'tracking_token', CASE WHEN v_is_secret THEN v_appt.tracking_token ELSE NULL END,
        'patient_id', v_appt.patient_id,
        'patient_number', v_appt.patient_number,
        'patient_name', CASE WHEN v_is_secret THEN v_appt.patient_name ELSE public.mask_name(v_appt.patient_name) END,
        'patient_phone', public.mask_phone(v_appt.patient_phone),
        'doctor_id', v_appt.doctor_id,
        'doctor_name', v_appt.doctor_name,
        'doctor_code', v_appt.doctor_code,
        'room_number', COALESCE(v_appt.room_number, 'Room 101'),
        'department', COALESCE(v_appt.department, 'General OPD'),
        'hospital_id', v_appt.hospital_id,
        'hospital_name', v_appt.hospital_name,
        'status', v_appt.status,
        'live_status_label', v_status_label,
        'current_serving_token', v_current_token,
        'live_position', v_current_token,
        'patients_ahead', v_waiting_count,
        'waiting_before_you', v_waiting_count,
        'estimated_wait_mins', v_waiting_count * 12,
        'appointment_date', v_appt.appointment_date,
        'queue_progress', v_queue_progress,
        'notifications', v_notifications,
        'matched_appointments', v_matched_appts
    );
END;
$$;

-- 6.13 Platform admin: provision an individual doctor (BUG-001).
-- Signature matches the call in OwnerAdmin.tsx; the previous live version expected
-- different parameter names and wrote to columns that do not exist.
CREATE FUNCTION public.admin_create_individual_doctor(
    p_doctor_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_clinic_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_specialization TEXT DEFAULT 'General Physician',
    p_consultation_fee NUMERIC DEFAULT 500.00,
    p_plan_tier TEXT DEFAULT 'doctor_monthly',
    p_city TEXT DEFAULT NULL,
    p_slug TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_clean_email TEXT := LOWER(TRIM(p_email));
    v_name TEXT := LEFT(TRIM(p_doctor_name), 120);
    v_user_id UUID;
    v_clinic_id UUID;
    v_clinic_name TEXT := LEFT(COALESCE(NULLIF(TRIM(p_clinic_name), ''), TRIM(p_doctor_name) || ' Clinic'), 150);
    v_plan TEXT := CASE WHEN p_plan_tier ILIKE '%annual%' THEN 'doctor_annual' ELSE 'doctor_monthly' END;
    v_doc_code TEXT;
    v_qr_token TEXT;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Platform Super Admin login required.');
    END IF;
    IF v_clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR LENGTH(COALESCE(p_password, '')) < 8 OR COALESCE(v_name, '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Name, a valid e-mail and a password of at least 8 characters are required.');
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'An account with this e-mail already exists.');
    END IF;

    v_user_id := gen_random_uuid();
    v_doc_code := 'DOC-' || UPPER(SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 6));
    v_qr_token := 'QR-DOC-' || UPPER(SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 8));

    INSERT INTO public.hospitals (name, slug, client_type, phone, email, city, plan, subscription_plan, doctor_limit, status)
    VALUES (
        v_clinic_name,
        COALESCE(NULLIF(LOWER(REGEXP_REPLACE(TRIM(p_slug), '[^a-zA-Z0-9-]+', '-', 'g')), ''),
                 'clinic-' || SUBSTRING(REPLACE(v_user_id::text, '-', ''), 1, 8)),
        'individual_doctor', LEFT(p_phone, 20), v_clean_email, LEFT(p_city, 80), v_plan, v_plan, 1, 'active'
    ) RETURNING id INTO v_clinic_id;

    -- auth.users insert fires handle_new_user, which skips because the caller is a super admin.
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        v_clean_email, crypt(p_password, gen_salt('bf')), NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'provisioned_by', 'admin_create_individual_doctor'),
        jsonb_build_object('full_name', v_name),
        NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
            'email', v_user_id::text, NOW(), NOW(), NOW());

    INSERT INTO public.profiles (
        id, doctor_code, full_name, email, role, client_type, hospital_id, specialization,
        onboarding_status, account_status, is_active
    ) VALUES (
        v_user_id, v_doc_code, v_name, v_clean_email, 'doctor', 'individual_doctor', v_clinic_id,
        LEFT(TRIM(p_specialization), 120), 'ACTIVE', 'active', true
    );

    INSERT INTO public.doctor_details (
        id, doctor_code, hospital_id, name, email, specialization, clinic_name, city, clinic_phone,
        consultation_fee, onboarding_status, availability_status, is_active
    ) VALUES (
        v_user_id, v_doc_code, v_clinic_id, v_name, v_clean_email, LEFT(TRIM(p_specialization), 120),
        v_clinic_name, LEFT(p_city, 80), LEFT(p_phone, 20), COALESCE(p_consultation_fee, 500.00),
        'ACTIVE', 'active', true
    );

    INSERT INTO public.individual_doctor_subscriptions (
        doctor_id, hospital_id, plan_id, plan_name, amount, status, payment_provider, started_at, expires_at
    ) VALUES (
        v_user_id, v_clinic_id, v_plan,
        CASE WHEN v_plan = 'doctor_annual' THEN 'Annual Professional' ELSE 'Monthly Solo' END,
        CASE WHEN v_plan = 'doctor_annual' THEN 9999.00 ELSE 999.00 END,
        'active', 'manual_admin_provision', NOW(),
        NOW() + CASE WHEN v_plan = 'doctor_annual' THEN INTERVAL '365 days' ELSE INTERVAL '30 days' END
    );

    INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
    VALUES (v_clinic_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true);

    RETURN jsonb_build_object(
        'success', true, 'doctor_id', v_user_id, 'clinic_id', v_clinic_id,
        'doctor_code', v_doc_code, 'qr_token', v_qr_token, 'booking_url', '/book/' || v_qr_token
    );
END;
$$;


-- 6.14 Queue-notification trigger: ignore appointments without a token (BUG-002).
CREATE OR REPLACE FUNCTION public.evaluate_queue_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doctor_id UUID := NEW.doctor_id;
    v_appointment_date DATE := NEW.appointment_date;
    v_doctor RECORD;
    v_current_token INTEGER;
    v_current_appt_id UUID;
    v_appt RECORD;
    v_patients_ahead INTEGER;
    v_room TEXT;
BEGIN
    IF v_doctor_id IS NULL OR v_appointment_date IS NULL THEN
        RETURN NEW;
    END IF;

    -- Fetch doctor info
    SELECT p.full_name, dd.room_number INTO v_doctor
    FROM public.profiles p
    LEFT JOIN public.doctor_details dd ON dd.id = p.id
    WHERE p.id = v_doctor_id;

    v_room := COALESCE(v_doctor.room_number, 'Consultation Room');

    -- Determine currently serving token for this doctor today
    SELECT token_number, id INTO v_current_token, v_current_appt_id
    FROM public.appointments
    WHERE doctor_id = v_doctor_id AND appointment_date = v_appointment_date AND status = 'In Consultation'
    ORDER BY token_number ASC LIMIT 1;

    IF v_current_token IS NULL THEN
        SELECT token_number, id INTO v_current_token, v_current_appt_id
        FROM public.appointments
        WHERE doctor_id = v_doctor_id AND appointment_date = v_appointment_date AND status = 'Waiting'
        ORDER BY token_number ASC LIMIT 1;
    END IF;

    -- If a patient is In Consultation, trigger QUEUE_YOUR_TURN for that patient
    IF v_current_appt_id IS NOT NULL AND v_current_token IS NOT NULL THEN
        INSERT INTO public.notifications (
            hospital_id, appointment_id, type, title, message, metadata
        ) VALUES (
            NEW.hospital_id,
            v_current_appt_id,
            'QUEUE_YOUR_TURN',
            'It''s your turn!',
            'Token #' || v_current_token || ' is now being called by Dr. ' || COALESCE(v_doctor.full_name, 'Doctor') || '. Please proceed to ' || v_room || ' for your consultation.',
            jsonb_build_object(
                'token_number', v_current_token,
                'doctor_name', v_doctor.full_name,
                'room_number', v_room,
                'threshold', 0
            )
        )
        ON CONFLICT (appointment_id, type) DO NOTHING;
    END IF;

    -- Evaluate all active Waiting appointments for this doctor today
    FOR v_appt IN (
        SELECT id, token_number, hospital_id, patient_id, patient_name
        FROM public.appointments
        WHERE doctor_id = v_doctor_id
          AND appointment_date = v_appointment_date
          AND status = 'Waiting'
          AND token_number IS NOT NULL
        ORDER BY token_number ASC
    ) LOOP
        -- Count real active patients ahead
        SELECT COUNT(*) INTO v_patients_ahead
        FROM public.appointments
        WHERE doctor_id = v_doctor_id
          AND appointment_date = v_appointment_date
          AND status IN ('Waiting', 'In Consultation')
          AND token_number < v_appt.token_number;

        -- 1. TWO TURNS AWAY (patients_ahead = 2)
        IF v_patients_ahead = 2 THEN
            INSERT INTO public.notifications (
                hospital_id, appointment_id, type, title, message, metadata
            ) VALUES (
                v_appt.hospital_id,
                v_appt.id,
                'QUEUE_TWO_AWAY',
                'You''re 2 turns away',
                'Dr. ' || COALESCE(v_doctor.full_name, 'Doctor') || ' will be ready for you shortly. Current serving token is #' || COALESCE(v_current_token, 0) || '. Your token is #' || v_appt.token_number || '. Please be ready.',
                jsonb_build_object(
                    'token_number', v_appt.token_number,
                    'current_token', v_current_token,
                    'doctor_name', v_doctor.full_name,
                    'patients_ahead', 2
                )
            )
            ON CONFLICT (appointment_id, type) DO NOTHING;

        -- 2. ONE TURN AWAY / NEXT (patients_ahead = 1)
        ELSIF v_patients_ahead = 1 THEN
            INSERT INTO public.notifications (
                hospital_id, appointment_id, type, title, message, metadata
            ) VALUES (
                v_appt.hospital_id,
                v_appt.id,
                'QUEUE_ONE_AWAY',
                'You''re next!',
                'Your token #' || v_appt.token_number || ' is immediately next! Current token is #' || COALESCE(v_current_token, 0) || '. Please proceed toward the consultation area.',
                jsonb_build_object(
                    'token_number', v_appt.token_number,
                    'current_token', v_current_token,
                    'doctor_name', v_doctor.full_name,
                    'patients_ahead', 1
                )
            )
            ON CONFLICT (appointment_id, type) DO NOTHING;

        -- 3. YOUR TURN (patients_ahead = 0)
        ELSIF v_patients_ahead = 0 THEN
            INSERT INTO public.notifications (
                hospital_id, appointment_id, type, title, message, metadata
            ) VALUES (
                v_appt.hospital_id,
                v_appt.id,
                'QUEUE_YOUR_TURN',
                'It''s your turn!',
                'Token #' || v_appt.token_number || ' is now being called by Dr. ' || COALESCE(v_doctor.full_name, 'Doctor') || '. Please proceed to ' || v_room || ' for your consultation.',
                jsonb_build_object(
                    'token_number', v_appt.token_number,
                    'doctor_name', v_doctor.full_name,
                    'room_number', v_room,
                    'patients_ahead', 0
                )
            )
            ON CONFLICT (appointment_id, type) DO NOTHING;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

-- ==============================================================================
-- 7. DATA INTEGRITY CONSTRAINTS (SEC-012)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.appointments
        WHERE token_number IS NOT NULL AND doctor_id IS NOT NULL
        GROUP BY doctor_id, appointment_date, token_number HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_date_token
            ON public.appointments (doctor_id, appointment_date, token_number)
            WHERE token_number IS NOT NULL AND doctor_id IS NOT NULL;
    ELSE
        RAISE WARNING 'Duplicate queue tokens exist; uq_appointments_doctor_date_token NOT created. De-duplicate and re-run.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.patients WHERE patient_number IS NOT NULL
        GROUP BY hospital_id, patient_number HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_hospital_number
            ON public.patients (hospital_id, patient_number) WHERE patient_number IS NOT NULL;
    ELSE
        RAISE WARNING 'Duplicate patient numbers exist; uq_patients_hospital_number NOT created. De-duplicate and re-run.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.individual_doctor_subscriptions
        WHERE payment_provider = 'razorpay' AND provider_payment_id IS NOT NULL
        GROUP BY provider_payment_id HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_razorpay_payment
            ON public.individual_doctor_subscriptions (provider_payment_id)
            WHERE payment_provider = 'razorpay' AND provider_payment_id IS NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.appointments WHERE tracking_token LIKE 'TRK-%'
        GROUP BY tracking_token HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_tracking_secret
            ON public.appointments (tracking_token) WHERE tracking_token LIKE 'TRK-%';
    END IF;
END $$;

-- ==============================================================================
-- 8. FUNCTION PRIVILEGES (SEC-015)
-- ==============================================================================
-- 00 granted EXECUTE on every function to anon. Anonymous visitors only need the
-- public booking / tracking / doctor-ID-login endpoints.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_qr_booking_info(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_patient_by_qr(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.book_qr_appointment(UUID, TEXT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, INTEGER, DATE, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_live_queue_status(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon;
-- Helpers referenced by policies/functions evaluated for anon requests.
GRANT EXECUTE ON FUNCTION public.try_uuid(TEXT), public.mask_name(TEXT), public.mask_phone(TEXT) TO anon;
-- Internal only: callable from the SECURITY DEFINER endpoints above, not directly.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_doctor_subscription_internal(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_paid_subscription(UUID, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_subscription(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ==============================================================================
-- END OF 02_SECURITY_AUDIT_FIXES.sql
-- ==============================================================================
