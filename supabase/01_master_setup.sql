-- ============================================================================
-- MEDTECH FIXATERS — DEFINITIVE PRODUCTION MASTER SETUP
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- This is the ONE authoritative schema file. It supersedes every other .sql
-- file in this folder.
--
-- Verified against actual `.from('table_name')` calls across webapp/src —
-- every table below is confirmed in live use by the React app.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: CLEAN SLATE
-- ----------------------------------------------------------------------------
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT USAGE, CREATE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;

DELETE FROM auth.users;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- STEP 2: TABLES
-- ----------------------------------------------------------------------------

-- 2.1 HOSPITALS
CREATE TABLE public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    doctor_limit INTEGER DEFAULT 10,
    plan TEXT DEFAULT 'Hospital Pro',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'blocked', 'banned', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 PROFILES (extends auth.users — every logged-in identity: super_admin, hospital_admin, doctor, staff)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_code TEXT UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'doctor' NOT NULL CHECK (role IN ('super_admin', 'hospital_admin', 'doctor', 'staff')),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID,
    department TEXT,
    specialization TEXT DEFAULT 'General Physician',
    registration_number TEXT,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'blocked', 'banned', 'deleted')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.3 DEPARTMENTS
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    head_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    avg_wait_mins INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.4 DOCTOR DETAILS (extended profile data for role = 'doctor')
CREATE TABLE public.doctor_details (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_code TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    qualification TEXT DEFAULT 'MBBS, MD',
    specialization TEXT DEFAULT 'Consultant Specialist',
    registration_number TEXT,
    room_number TEXT DEFAULT 'Room 101',
    daily_patient_limit INTEGER DEFAULT 30,
    consultation_fee NUMERIC(10, 2) DEFAULT 500.00,
    availability_status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.5 PATIENTS
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number TEXT,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    gender TEXT,
    date_of_birth DATE,
    known_diseases TEXT,
    allergies TEXT,
    previous_medicine TEXT,
    previous_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    abha_id TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.6 APPOINTMENTS (queue items)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender TEXT,
    appointment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    queue_number TEXT NOT NULL,
    token_number INTEGER,
    tracking_token TEXT,
    status TEXT DEFAULT 'Waiting' NOT NULL CHECK (status IN ('Waiting', 'In Consultation', 'Completed', 'Cancelled', 'No Show')),
    fee NUMERIC(10, 2) DEFAULT 0.00,
    symptoms TEXT,
    known_diseases TEXT,
    previous_medicine TEXT,
    previous_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_emergency BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.7 CONSULTATIONS
CREATE TABLE public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    diagnosis TEXT,
    clinical_notes TEXT,
    vitals JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.8 PRESCRIPTIONS
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    diagnosis TEXT,
    medicines JSONB DEFAULT '[]'::jsonb NOT NULL,
    lab_tests TEXT,
    advice TEXT,
    follow_up TEXT,
    follow_up_date DATE,
    pdf_url TEXT,
    whatsapp_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.9 QR CODES
CREATE TABLE public.qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    booking_url TEXT,
    intake_url TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    scans_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.10 CONTACT MESSAGES
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    organization TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.11 AI BOOKING INTAKES
CREATE TABLE public.ai_booking_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    primary_concern TEXT,
    symptoms TEXT,
    symptom_duration TEXT,
    recommended_department_id TEXT,
    recommended_doctor_id TEXT,
    patient_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.12 MESSAGES
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.13 ACTIVITY LOGS
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    category TEXT DEFAULT 'General',
    action TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- STEP 3: INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_profiles_doctor_code ON public.profiles(doctor_code);
CREATE INDEX idx_profiles_hospital ON public.profiles(hospital_id);
CREATE INDEX idx_doctor_details_hospital ON public.doctor_details(hospital_id);
CREATE INDEX idx_doctor_details_code ON public.doctor_details(doctor_code);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_hospital ON public.appointments(hospital_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX idx_messages_doctor ON public.messages(sender_id, recipient_id);
CREATE INDEX idx_patients_hospital ON public.patients(hospital_id);
CREATE INDEX idx_qr_codes_hospital ON public.qr_codes(hospital_id);
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_ai_booking_intakes_hospital ON public.ai_booking_intakes(hospital_id);

-- ----------------------------------------------------------------------------
-- STEP 4: SECURITY HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_hospital_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT hospital_id FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_hospital_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'hospital_admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'doctor' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- STEP 5: ENABLE RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_booking_intakes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- STEP 6: RLS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Super Admin full access to hospitals" ON public.hospitals FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Users view own hospital" ON public.hospitals FOR SELECT TO authenticated USING (id = public.current_hospital_id());
CREATE POLICY "Public view active hospital" ON public.hospitals FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "Super Admin full access to profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Users view own hospital profiles" ON public.profiles FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id() OR id = auth.uid());
CREATE POLICY "Hospital Admin manage hospital profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id()) WITH CHECK (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());

CREATE POLICY "Super Admin full access to doctor_details" ON public.doctor_details FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage own doctor_details" ON public.doctor_details FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctors view own doctor_details" ON public.doctor_details FOR SELECT TO authenticated USING (id = auth.uid() OR hospital_id = public.current_hospital_id());

CREATE POLICY "Super Admin full access to appointments" ON public.appointments FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage hospital appointments" ON public.appointments FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctor manage ONLY own appointments" ON public.appointments FOR ALL TO authenticated USING (public.is_doctor() AND doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (public.is_doctor() AND doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Public insert self-appointment" ON public.appointments FOR INSERT TO anon WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = appointments.doctor_id AND hospital_id = appointments.hospital_id AND role = 'doctor' AND is_active = true));
CREATE POLICY "Public view queue for display" ON public.appointments FOR SELECT TO anon USING (appointment_date = CURRENT_DATE);

CREATE POLICY "Super Admin full access to consultations" ON public.consultations FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Doctor manage ONLY own consultations" ON public.consultations FOR ALL TO authenticated USING (public.is_doctor() AND doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (public.is_doctor() AND doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());

CREATE POLICY "Super Admin full access to prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Doctor manage ONLY own prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (public.is_doctor() AND doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (public.is_doctor() AND doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());

CREATE POLICY "Super Admin full access to departments" ON public.departments FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Users view departments" ON public.departments FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
CREATE POLICY "Public view departments" ON public.departments FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Super Admin full access to patients" ON public.patients FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage patients" ON public.patients FOR ALL TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id()) WITH CHECK (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Doctor view hospital patients" ON public.patients FOR SELECT TO authenticated USING (public.is_doctor() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Public insert patient" ON public.patients FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Super Admin full access to qr_codes" ON public.qr_codes FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Users view qr_codes" ON public.qr_codes FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
CREATE POLICY "Public view active qr_codes" ON public.qr_codes FOR SELECT TO anon USING (status = 'active' OR is_active = true);

CREATE POLICY "Super Admin full access to messages" ON public.messages FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Users manage own messages" ON public.messages FOR ALL TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Super Admin full access to activity_logs" ON public.activity_logs FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin view own hospital logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Authenticated insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public submit contact message" ON public.contact_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated submit contact message" ON public.contact_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Super Admin view contact messages" ON public.contact_messages FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Public insert ai_booking_intakes" ON public.ai_booking_intakes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Super Admin full access to ai_booking_intakes" ON public.ai_booking_intakes FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Users view own ai_booking_intakes" ON public.ai_booking_intakes FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());

-- ----------------------------------------------------------------------------
-- STEP 7: AUTO-SYNC PROFILES TRIGGER (fires when a new auth.users row is created)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_hosp_id UUID := NULL;
    v_raw_hosp TEXT;
BEGIN
    v_raw_hosp := NEW.raw_user_meta_data->>'hospital_id';

    IF v_raw_hosp IS NOT NULL AND v_raw_hosp ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_hosp_id := v_raw_hosp::UUID;
    END IF;

    INSERT INTO public.profiles (
        id, doctor_code, full_name, email, role, hospital_id, department, is_active
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'doctor_code',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
        v_hosp_id,
        NEW.raw_user_meta_data->>'department',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        doctor_code = COALESCE(EXCLUDED.doctor_code, profiles.doctor_code),
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        hospital_id = COALESCE(EXCLUDED.hospital_id, profiles.hospital_id),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;

-- ----------------------------------------------------------------------------
-- STEP 8: QR BOOKING RPC (used by the public /book/:token intake flow)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_qr_booking_info(p_token text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
    v_clean_token TEXT;
    v_qr RECORD;
    v_hosp RECORD;
    v_departments JSONB;
    v_doctors JSONB;
    v_possible_uuid UUID;
BEGIN
    v_clean_token := TRIM(p_token);
    IF v_clean_token LIKE 'tok_%' THEN v_clean_token := SUBSTRING(v_clean_token FROM 5); END IF;

    SELECT * INTO v_qr FROM public.qr_codes
    WHERE (token = v_clean_token OR token = TRIM(p_token) OR booking_url LIKE '%' || v_clean_token || '%')
      AND (status = 'active' OR is_active = true) LIMIT 1;

    IF v_qr.id IS NULL THEN
        BEGIN
            v_possible_uuid := v_clean_token::UUID;
            SELECT * INTO v_qr FROM public.qr_codes WHERE hospital_id = v_possible_uuid AND (status = 'active' OR is_active = true) LIMIT 1;
            IF v_qr.id IS NULL THEN
                INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
                SELECT id, 'QR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)), '/book/QR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)), '/book/QR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)), 'active', true
                FROM public.hospitals WHERE id = v_possible_uuid AND status = 'active' RETURNING * INTO v_qr;
            END IF;
        EXCEPTION WHEN OTHERS THEN v_possible_uuid := NULL; END;
    END IF;

    IF v_qr.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid or unrecognized hospital QR booking code.'); END IF;

    UPDATE public.qr_codes SET scans_count = COALESCE(scans_count, 0) + 1, last_scanned_at = NOW() WHERE id = v_qr.id;
    SELECT id, name, phone, email, address, status INTO v_hosp FROM public.hospitals WHERE id = v_qr.hospital_id;

    IF v_hosp.id IS NULL OR v_hosp.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This hospital facility booking portal is currently unavailable or inactive.');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'description', d.description, 'is_opd', (LOWER(d.name) = 'opd' OR LOWER(d.name) LIKE '%opd%')) ORDER BY (CASE WHEN LOWER(d.name) = 'opd' OR LOWER(d.name) LIKE '%opd%' THEN 0 ELSE 1 END), d.name ASC), '[]'::jsonb)
    INTO v_departments FROM public.departments d WHERE d.hospital_id = v_hosp.id AND d.is_active = true;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'doctor_code', COALESCE(p.doctor_code, 'DOC-' || SUBSTRING(p.id::text, 1, 6)), 'name', p.full_name, 'department', COALESCE(p.department, 'General OPD'), 'specialization', COALESCE(p.specialization, 'Medical Officer'), 'fee', COALESCE(dd.consultation_fee, 500), 'room', COALESCE(dd.room_number, 'OPD Room'), 'daily_limit', COALESCE(dd.daily_patient_limit, 40), 'availability_status', COALESCE(dd.availability_status, 'active')) ORDER BY p.full_name ASC), '[]'::jsonb)
    INTO v_doctors FROM public.profiles p LEFT JOIN public.doctor_details dd ON dd.id = p.id WHERE p.hospital_id = v_hosp.id AND p.role = 'doctor' AND p.is_active = true;

    RETURN jsonb_build_object('success', true, 'hospital', jsonb_build_object('id', v_hosp.id, 'name', v_hosp.name, 'phone', v_hosp.phone, 'email', v_hosp.email, 'address', v_hosp.address), 'departments', v_departments, 'doctors', v_doctors);
END;
$function$;

-- ----------------------------------------------------------------------------
-- STEP 8B: ATOMIC HOSPITAL + HOSPITAL_ADMIN CREATION RPC
-- ----------------------------------------------------------------------------
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
    IF NOT public.is_super_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Super Admin may create hospitals.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.hospitals WHERE LOWER(email) = v_clean_email OR slug = v_clean_slug) THEN
        UPDATE public.hospitals SET
            name = p_hospital_name,
            phone = COALESCE(p_phone, phone),
            address = COALESCE(p_address, address),
            city = COALESCE(p_city, city),
            plan = COALESCE(p_plan, plan),
            doctor_limit = COALESCE(p_doctor_limit, doctor_limit),
            status = 'active',
            updated_at = NOW()
        WHERE LOWER(email) = v_clean_email OR slug = v_clean_slug
        RETURNING id INTO v_hosp_id;
    ELSE
        INSERT INTO public.hospitals (
            id, name, slug, email, phone, address, city, doctor_limit, plan, status
        ) VALUES (
            v_hosp_id, p_hospital_name, v_clean_slug, v_clean_email, p_phone,
            COALESCE(p_address, 'Central OPD Block'), COALESCE(p_city, 'India'), p_doctor_limit, p_plan, 'active'
        );
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
        UPDATE auth.users SET
            encrypted_password = crypt(p_admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW(),
            raw_user_meta_data = jsonb_build_object(
                'role', 'hospital_admin',
                'full_name', p_hospital_name || ' Admin',
                'hospital_id', v_hosp_id
            )
        WHERE LOWER(email) = v_clean_email
        RETURNING id INTO v_user_id;
    ELSE
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, is_anonymous, created_at, updated_at
        ) VALUES (
            v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            v_clean_email, crypt(p_admin_password, gen_salt('bf')), NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object(
                'role', 'hospital_admin',
                'full_name', p_hospital_name || ' Admin',
                'hospital_id', v_hosp_id
            ),
            false, false, NOW(), NOW()
        );
    END IF;

    INSERT INTO public.profiles (
        id, full_name, email, role, hospital_id, is_active, account_status
    ) VALUES (
        v_user_id, p_hospital_name || ' Admin', v_clean_email, 'hospital_admin', v_hosp_id, true, 'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        hospital_id = v_hosp_id,
        role = 'hospital_admin',
        is_active = true,
        account_status = 'active',
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    INSERT INTO public.qr_codes (
        hospital_id, token, booking_url, intake_url, status, is_active
    ) VALUES (
        v_hosp_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true
    )
    ON CONFLICT (token) DO UPDATE SET status = 'active', is_active = true;

    RETURN jsonb_build_object(
        'success', true,
        'hospital_id', v_hosp_id,
        'user_id', v_user_id,
        'qr_token', v_qr_token,
        'message', 'Hospital & Admin login credentials created successfully!'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_hospital_with_admin TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- STEP 9: STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('prescriptions', 'prescriptions', true),
  ('hospital-logos', 'hospital-logos', true),
  ('doctor-avatars', 'doctor-avatars', true),
  ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access for Prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Hospital Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Hospital Logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Doctor Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Doctor Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Lab Reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Lab Reports" ON storage.objects;

CREATE POLICY "Public Read Access for Prescriptions" ON storage.objects FOR SELECT TO public USING (bucket_id = 'prescriptions');
CREATE POLICY "Authenticated Upload for Prescriptions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prescriptions');

CREATE POLICY "Public Read Access for Hospital Logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hospital-logos');
CREATE POLICY "Authenticated Upload for Hospital Logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hospital-logos');

CREATE POLICY "Public Read Access for Doctor Avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'doctor-avatars');
CREATE POLICY "Authenticated Upload for Doctor Avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'doctor-avatars');

CREATE POLICY "Public Read Access for Lab Reports" ON storage.objects FOR SELECT TO public USING (bucket_id = 'lab-reports');
CREATE POLICY "Authenticated Upload for Lab Reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lab-reports');

-- ----------------------------------------------------------------------------
-- STEP 10: SEED SUPER ADMIN (/mrshahidbabu)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'shahidbcsm@gmail.com';
  v_password TEXT := 'Shahideeba@19019';
BEGIN
  DELETE FROM public.profiles WHERE LOWER(email) = LOWER(v_email);
  DELETE FROM auth.users WHERE LOWER(email) = LOWER(v_email);

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_anonymous, created_at, updated_at
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email, crypt(v_password, gen_salt('bf')), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "super_admin", "full_name": "Platform Super Admin"}'::jsonb,
    false, false, NOW(), NOW()
  );

  INSERT INTO public.profiles (
    id, full_name, email, role, is_active, account_status
  ) VALUES (
    v_user_id, 'Platform Super Admin', v_email, 'super_admin', true, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    account_status = 'active',
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  RAISE NOTICE 'Production setup complete. Super Admin shahidbcsm@gmail.com is active.';
END $$;

-- ----------------------------------------------------------------------------
-- STEP 11: FINAL PERMISSION RE-GRANT
-- ----------------------------------------------------------------------------
GRANT USAGE, CREATE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
