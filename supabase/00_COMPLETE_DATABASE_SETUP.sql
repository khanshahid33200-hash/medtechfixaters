-- ==============================================================================
-- 00_COMPLETE_DATABASE_SETUP.sql
-- COMPLETE ACCURATE MASTER DATABASE SETUP FOR CLINIC OS / MEDTECH FIXATERS
-- Target Supabase Project: https://yweywvnivyftwtglxavr.supabase.co
-- SQL Editor: https://supabase.com/dashboard/project/yweywvnivyftwtglxavr/sql/new
--
-- This script contains 100% of all required tables, security definer helpers,
-- RLS policies, automated triggers, RPCs, storage buckets, and initial platform admin.
-- Running this script sets up the entire platform from scratch with 0 errors.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE MASTER TABLES
-- ==============================================================================

-- 2.1 HOSPITALS
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT,
    subdomain TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    logo_url TEXT,
    plan TEXT DEFAULT 'Hospital Pro',
    subscription_plan TEXT DEFAULT 'Hospital Pro',
    doctor_limit INTEGER DEFAULT 20,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'blocked', 'banned', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    head_doctor_id UUID,
    avg_wait_mins INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.3 PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_code TEXT UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'doctor' NOT NULL CHECK (role IN ('super_admin', 'hospital_admin', 'doctor', 'staff')),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    department TEXT,
    specialization TEXT DEFAULT 'General Physician',
    registration_number TEXT,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'blocked', 'banned', 'deleted')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Foreign key for head_doctor_id in departments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'departments_head_doctor_id_fkey'
    ) THEN
        ALTER TABLE public.departments
        ADD CONSTRAINT departments_head_doctor_id_fkey
        FOREIGN KEY (head_doctor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2.4 DOCTOR DETAILS
CREATE TABLE IF NOT EXISTS public.doctor_details (
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

-- 2.5 USER CREDENTIALS VAULT (Stores generated passwords and access details for Super/Hospital Admin reference)
CREATE TABLE IF NOT EXISTS public.user_credentials_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_code TEXT,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    initial_password TEXT NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.6 HOSPITAL PATIENT DAILY COUNTERS (Atomic Concurrency-Safe Sequence per Hospital + Date)
CREATE TABLE IF NOT EXISTS public.hospital_patient_daily_counters (
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (hospital_id, patient_date)
);

-- 2.7 PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number TEXT,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    date_of_birth DATE,
    blood_group TEXT,
    allergies TEXT,
    known_diseases TEXT,
    medical_history TEXT,
    previous_medicine TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.8 APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number INTEGER,
    queue_number TEXT,
    tracking_token TEXT,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender TEXT,
    appointment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    appointment_time TEXT DEFAULT '09:00 AM',
    symptoms TEXT,
    notes TEXT,
    is_emergency BOOLEAN DEFAULT false,
    booking_method TEXT DEFAULT 'Manual' CHECK (LOWER(booking_method) IN ('ai', 'manual', 'qr', 'online', 'walk-in', 'walk_in', 'front_desk', 'reception', 'direct')),
    status TEXT DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'In Consultation', 'Completed', 'Cancelled', 'No Show')),
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded')),
    consultation_fee NUMERIC(10, 2) DEFAULT 500.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.8 CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT,
    patient_phone TEXT,
    patient_age INTEGER,
    patient_gender TEXT,
    diagnosis TEXT,
    clinical_notes TEXT,
    symptoms TEXT,
    vitals JSONB DEFAULT '{}'::jsonb,
    bp TEXT,
    pulse TEXT,
    temp TEXT,
    spo2 TEXT,
    weight TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'referred')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS bp TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS pulse TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS temp TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS spo2 TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS weight TEXT;

-- 2.9 PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT,
    medications JSONB DEFAULT '[]'::jsonb NOT NULL,
    medicines JSONB DEFAULT '[]'::jsonb,
    lab_tests JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    follow_up TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS follow_up TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.prescriptions ALTER COLUMN lab_tests DROP NOT NULL;
ALTER TABLE public.prescriptions ALTER COLUMN lab_tests SET DEFAULT '[]'::jsonb;
ALTER TABLE public.prescriptions ALTER COLUMN medications DROP NOT NULL;
ALTER TABLE public.prescriptions ALTER COLUMN medications SET DEFAULT '[]'::jsonb;

-- 2.10 TEST REQUESTS
CREATE TABLE IF NOT EXISTS public.test_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
    tests JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_test TEXT,
    instructions TEXT,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.11 FOLLOW-UPS
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    parent_appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    follow_up_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    follow_up_date DATE NOT NULL,
    follow_up_token TEXT,
    reason TEXT,
    instructions TEXT,
    preferred_time TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'due_today', 'completed', 'overdue', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.12 DOCTOR & EMERGENCY REQUESTS
CREATE TABLE IF NOT EXISTS public.doctor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL DEFAULT 'hospital_admin',
    title TEXT NOT NULL,
    details TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'urgent',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'responded', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.13 ACTIVITY & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    actor_email TEXT,
    actor_role TEXT,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    target_label TEXT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.14 QR CODES & TOKENS
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID UNIQUE NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    booking_url TEXT,
    intake_url TEXT,
    scans_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.15 CHAT CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    name TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    is_muted BOOLEAN DEFAULT false NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT,
    content TEXT,
    reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    edited_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_message_reads (
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);

-- 2.16 NOTIFICATIONS (Server-side In-App & Turn-Away Notifications with Idempotency)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_appointment_id_type_key'
    ) THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_appointment_id_type_key UNIQUE (appointment_id, type);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unavailable' CHECK (status IN ('unavailable', 'leave', 'holiday', 'emergency_block')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (doctor_id, date)
);

CREATE TABLE IF NOT EXISTS public.doctor_working_hours (
    doctor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    morning_start TIME DEFAULT '09:00:00',
    morning_end TIME DEFAULT '13:00:00',
    evening_start TIME DEFAULT '17:00:00',
    evening_end TIME DEFAULT '21:00:00',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_departments_hospital ON public.departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_profiles_hospital ON public.profiles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_profiles_doctor_code ON public.profiles(doctor_code);
CREATE INDEX IF NOT EXISTS idx_doctor_details_hospital ON public.doctor_details(hospital_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_hospital ON public.user_credentials_vault(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date ON public.appointments(hospital_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_phone ON public.patients(hospital_id, phone);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_doctor_date ON public.follow_ups(doctor_id, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_date ON public.doctor_availability(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_hospital ON public.activity_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id, created_at DESC);

-- ==============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

DROP FUNCTION IF EXISTS public.current_hospital_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_hospital_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_doctor() CASCADE;
DROP FUNCTION IF EXISTS public.is_chat_member(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.current_hospital_id()
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
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_hospital_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'hospital_admin' OR role = 'super_admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor');
$$;

CREATE OR REPLACE FUNCTION public.is_chat_member(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.chat_members WHERE conversation_id = p_conversation_id AND user_id = auth.uid());
$$;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_working_hours ENABLE ROW LEVEL SECURITY;

-- 5.1 HOSPITALS
DROP POLICY IF EXISTS "Super Admin full access to hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Hospital Admin view own hospital" ON public.hospitals;
DROP POLICY IF EXISTS "Public view active hospitals" ON public.hospitals;

CREATE POLICY "Super Admin full access to hospitals" ON public.hospitals FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin view own hospital" ON public.hospitals FOR SELECT TO authenticated USING (id = public.current_hospital_id());
CREATE POLICY "Public view active hospitals" ON public.hospitals FOR SELECT TO anon USING (status = 'active');

-- 5.2 DEPARTMENTS
DROP POLICY IF EXISTS "Super Admin full access to departments" ON public.departments;
DROP POLICY IF EXISTS "Hospital Admin manage departments" ON public.departments;
DROP POLICY IF EXISTS "Hospital Users view departments" ON public.departments;
DROP POLICY IF EXISTS "Public view departments" ON public.departments;

CREATE POLICY "Super Admin full access to departments" ON public.departments FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage departments" ON public.departments FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Hospital Users view departments" ON public.departments FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
CREATE POLICY "Public view departments" ON public.departments FOR SELECT TO anon USING (is_active = true);

-- 5.3 PROFILES
DROP POLICY IF EXISTS "Super Admin full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Hospital Admin manage hospital profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view hospital profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public view active doctors" ON public.profiles;

CREATE POLICY "Super Admin full access to profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage hospital profiles" ON public.profiles FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Users view hospital profiles" ON public.profiles FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id() OR id = auth.uid());
CREATE POLICY "Public view active doctors" ON public.profiles FOR SELECT TO anon USING (role = 'doctor' AND is_active = true AND account_status = 'active');

-- 5.4 DOCTOR DETAILS
DROP POLICY IF EXISTS "Super Admin full access to doctor_details" ON public.doctor_details;
DROP POLICY IF EXISTS "Hospital Admin manage doctor_details" ON public.doctor_details;
DROP POLICY IF EXISTS "Doctor manage own doctor_details" ON public.doctor_details;
DROP POLICY IF EXISTS "Public view active doctor_details" ON public.doctor_details;

CREATE POLICY "Super Admin full access to doctor_details" ON public.doctor_details FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage doctor_details" ON public.doctor_details FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctor manage own doctor_details" ON public.doctor_details FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Public view active doctor_details" ON public.doctor_details FOR SELECT TO anon USING (is_active = true);

-- 5.5 USER CREDENTIALS VAULT
DROP POLICY IF EXISTS "Super Admin full access to credentials vault" ON public.user_credentials_vault;
DROP POLICY IF EXISTS "Hospital Admin view own hospital credentials" ON public.user_credentials_vault;
DROP POLICY IF EXISTS "Hospital Admin manage own hospital credentials" ON public.user_credentials_vault;

CREATE POLICY "Super Admin full access to credentials vault" ON public.user_credentials_vault FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin view own hospital credentials" ON public.user_credentials_vault FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
CREATE POLICY "Hospital Admin manage own hospital credentials" ON public.user_credentials_vault FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());

-- 5.6 APPOINTMENTS
DROP POLICY IF EXISTS "Super Admin full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Hospital Admin manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctor manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointment" ON public.appointments;
DROP POLICY IF EXISTS "Public view queue for today" ON public.appointments;

CREATE POLICY "Super Admin full access to appointments" ON public.appointments FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Hospital Admin manage appointments" ON public.appointments FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctor manage own appointments" ON public.appointments FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Public insert appointment" ON public.appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public view queue for today" ON public.appointments FOR SELECT TO anon USING (appointment_date = CURRENT_DATE);

-- 5.7 CONSULTATIONS & PRESCRIPTIONS
DROP POLICY IF EXISTS "Hospital staff view consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctor manage consultations" ON public.consultations;
DROP POLICY IF EXISTS "Hospital staff view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctor manage prescriptions" ON public.prescriptions;

CREATE POLICY "Hospital staff view consultations" ON public.consultations FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctor manage consultations" ON public.consultations FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Hospital staff view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
CREATE POLICY "Doctor manage prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());

-- 5.8 PATIENTS & QR CODES
DROP POLICY IF EXISTS "Hospital users manage patients" ON public.patients;
DROP POLICY IF EXISTS "Public insert patient" ON public.patients;
DROP POLICY IF EXISTS "Hospital users manage qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Public view active qr_codes" ON public.qr_codes;

CREATE POLICY "Hospital users manage patients" ON public.patients FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Public insert patient" ON public.patients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Hospital users manage qr_codes" ON public.qr_codes FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id() OR public.is_super_admin()) WITH CHECK (hospital_id = public.current_hospital_id() OR public.is_super_admin());
CREATE POLICY "Public view active qr_codes" ON public.qr_codes FOR SELECT TO anon USING (status = 'active' OR is_active = true);

-- 5.9 WORKFLOW & TEST REQUESTS
DROP POLICY IF EXISTS "Hospital users manage test_requests" ON public.test_requests;
DROP POLICY IF EXISTS "Hospital users manage follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Hospital users manage doctor_requests" ON public.doctor_requests;
DROP POLICY IF EXISTS "Hospital users manage emergency_requests" ON public.emergency_requests;

CREATE POLICY "Hospital users manage test_requests" ON public.test_requests FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Hospital users manage follow_ups" ON public.follow_ups FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Hospital users manage doctor_requests" ON public.doctor_requests FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Hospital users manage emergency_requests" ON public.emergency_requests FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());

-- 5.10 CHAT, NOTIFICATIONS & AVAILABILITY
DROP POLICY IF EXISTS "Chat members view conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat members manage conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat members manage messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat members manage members" ON public.chat_members;
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Doctor manage own availability" ON public.doctor_availability;
DROP POLICY IF EXISTS "Public view doctor availability" ON public.doctor_availability;
DROP POLICY IF EXISTS "Doctor manage own working hours" ON public.doctor_working_hours;
DROP POLICY IF EXISTS "Public view working hours" ON public.doctor_working_hours;
DROP POLICY IF EXISTS "Hospital admin view logs" ON public.activity_logs;

CREATE POLICY "Chat members view conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id() AND public.is_chat_member(id));
CREATE POLICY "Chat members manage conversations" ON public.chat_conversations FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id()) WITH CHECK (hospital_id = public.current_hospital_id());
CREATE POLICY "Chat members manage messages" ON public.chat_messages FOR ALL TO authenticated USING (public.is_chat_member(conversation_id)) WITH CHECK (public.is_chat_member(conversation_id));
CREATE POLICY "Chat members manage members" ON public.chat_members FOR ALL TO authenticated USING (conversation_id IN (SELECT id FROM public.chat_conversations WHERE hospital_id = public.current_hospital_id()));
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL TO authenticated USING (hospital_id = public.current_hospital_id() OR user_id = auth.uid()) WITH CHECK (hospital_id = public.current_hospital_id() OR user_id = auth.uid());
CREATE POLICY "Public view notifications for appointment" ON public.notifications FOR SELECT TO anon USING (appointment_id IS NOT NULL);
CREATE POLICY "Doctor manage own availability" ON public.doctor_availability FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Public view doctor availability" ON public.doctor_availability FOR SELECT TO anon USING (true);
CREATE POLICY "Doctor manage own working hours" ON public.doctor_working_hours FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id()) WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
CREATE POLICY "Public view working hours" ON public.doctor_working_hours FOR SELECT TO anon USING (true);
CREATE POLICY "Hospital admin view logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_hospital_admin() AND (hospital_id = public.current_hospital_id() OR public.is_super_admin()));

-- ==============================================================================
-- 6. RPC FUNCTIONS & BUSINESS LOGIC
-- ==============================================================================

-- Drop all existing overloads of custom RPC functions to prevent "ERROR 42725: function name is not unique"
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc
        JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
        WHERE pg_namespace.nspname = 'public'
          AND proname IN (
              'book_qr_appointment',
              'get_qr_booking_info',
              'lookup_patient_by_qr',
              'get_live_queue_status',
              'create_manual_appointment',
              'create_follow_up',
              'log_activity',
              'get_or_create_direct_conversation',
              'create_group_conversation',
              'admin_create_hospital_with_admin',
              'handle_new_user',
              'update_updated_at_column'
          )
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE;';
    END LOOP;
END $$;

-- 6.1 AUTH USER SYNC TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        hospital_id,
        department_id,
        department,
        specialization,
        is_active,
        account_status
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
        (NEW.raw_user_meta_data->>'hospital_id')::uuid,
        (NEW.raw_user_meta_data->>'department_id')::uuid,
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'specialization',
        true,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = COALESCE(EXCLUDED.role, profiles.role),
        hospital_id = COALESCE(EXCLUDED.hospital_id, profiles.hospital_id),
        department_id = COALESCE(EXCLUDED.department_id, profiles.department_id),
        department = COALESCE(EXCLUDED.department, profiles.department),
        specialization = COALESCE(EXCLUDED.specialization, profiles.specialization),
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

-- 6.2 ATOMIC HOSPITAL & ADMIN CREATION RPC (for Super Admin /mrshahidbabu)
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
        UPDATE auth.users SET
            encrypted_password = crypt(p_admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW(),
            raw_user_meta_data = jsonb_build_object(
                'role', 'hospital_admin',
                'full_name', p_hospital_name || ' Admin',
                'hospital_id', v_hosp_id
            ),
            confirmation_token = COALESCE(confirmation_token, ''),
            recovery_token = COALESCE(recovery_token, ''),
            email_change = COALESCE(email_change, ''),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            phone_change = COALESCE(phone_change, ''),
            phone_change_token = COALESCE(phone_change_token, ''),
            reauthentication_token = COALESCE(reauthentication_token, '')
        WHERE LOWER(email) = v_clean_email
        RETURNING id INTO v_user_id;
    ELSE
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, is_anonymous, created_at, updated_at,
            confirmation_token, recovery_token, email_change,
            email_change_token_new, email_change_token_current,
            phone_change, phone_change_token, reauthentication_token
        ) VALUES (
            v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            v_clean_email, crypt(p_admin_password, gen_salt('bf')), NOW(), NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object(
                'role', 'hospital_admin',
                'full_name', p_hospital_name || ' Admin',
                'hospital_id', v_hosp_id
            ),
            false, false, NOW(), NOW(),
            '', '', '', '', '', '', '', ''
        );
    END IF;

    -- Upsert auth.identities
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
            'email', v_clean_email, NOW(), NOW(), NOW()
        );
    END IF;

    -- Upsert profiles
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

    -- Insert QR code
    INSERT INTO public.qr_codes (
        hospital_id, token, booking_url, intake_url, status, is_active
    ) VALUES (
        v_hosp_id, v_qr_token, '/book/' || v_qr_token, '/book/' || v_qr_token, 'active', true
    )
    ON CONFLICT (hospital_id) DO UPDATE SET
        token = EXCLUDED.token,
        booking_url = EXCLUDED.booking_url,
        intake_url = EXCLUDED.intake_url,
        status = 'active',
        is_active = true;

    -- Save credentials into user_credentials_vault
    INSERT INTO public.user_credentials_vault (
        hospital_id, user_id, role, full_name, email, initial_password
    ) VALUES (
        v_hosp_id, v_user_id, 'hospital_admin', p_hospital_name || ' Admin', v_clean_email, p_admin_password
    );

    RETURN jsonb_build_object(
        'success', true,
        'hospital_id', v_hosp_id,
        'user_id', v_user_id,
        'qr_token', v_qr_token,
        'message', 'Hospital & Admin login credentials created and saved successfully!'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6.3 QR BOOKING INFO RPC (Used by public /book/:token intake)
CREATE OR REPLACE FUNCTION public.get_qr_booking_info(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    IF v_qr.id IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or unrecognized hospital QR booking code.'); 
    END IF;

    UPDATE public.qr_codes SET scans_count = COALESCE(scans_count, 0) + 1, last_scanned_at = NOW() WHERE id = v_qr.id;
    SELECT id, name, phone, email, address, status INTO v_hosp FROM public.hospitals WHERE id = v_qr.hospital_id;

    IF v_hosp.id IS NULL OR v_hosp.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This hospital facility is currently inactive.');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'description', d.description, 'is_opd', (LOWER(d.name) = 'opd' OR LOWER(d.name) LIKE '%opd%')) ORDER BY (CASE WHEN LOWER(d.name) = 'opd' OR LOWER(d.name) LIKE '%opd%' THEN 0 ELSE 1 END), d.name ASC), '[]'::jsonb)
    INTO v_departments FROM public.departments d WHERE d.hospital_id = v_hosp.id AND d.is_active = true;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'doctor_code', COALESCE(p.doctor_code, 'DOC-' || SUBSTRING(p.id::text, 1, 6)), 'name', p.full_name, 'department_id', p.department_id, 'department', COALESCE(p.department, 'General OPD'), 'specialization', COALESCE(p.specialization, 'Consultant Specialist'), 'fee', COALESCE(dd.consultation_fee, 500), 'room', COALESCE(dd.room_number, 'OPD Room'), 'daily_limit', COALESCE(dd.daily_patient_limit, 40), 'availability_status', COALESCE(dd.availability_status, 'active')) ORDER BY p.full_name ASC), '[]'::jsonb)
    INTO v_doctors FROM public.profiles p LEFT JOIN public.doctor_details dd ON dd.id = p.id WHERE p.hospital_id = v_hosp.id AND p.role = 'doctor' AND p.is_active = true;

    RETURN jsonb_build_object('success', true, 'hospital', jsonb_build_object('id', v_hosp.id, 'name', v_hosp.name, 'phone', v_hosp.phone, 'email', v_hosp.email, 'address', v_hosp.address), 'departments', v_departments, 'doctors', v_doctors);
END;
$$;

-- 6.4 PATIENT LOOKUP BY QR RPC
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
    v_qr RECORD;
    v_hospital_id UUID;
    v_patient RECORD;
    v_last_appt RECORD;
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

    SELECT * INTO v_patient FROM public.patients
    WHERE hospital_id = v_hospital_id
      AND (
          (p_mobile IS NOT NULL AND phone = TRIM(p_mobile)) OR
          (p_patient_number IS NOT NULL AND (patient_number = TRIM(p_patient_number) OR phone = TRIM(p_patient_number)))
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
            'previous_medicine', v_patient.previous_medicine,
            'previous_doctor_id', v_last_appt.doctor_id,
            'previous_doctor_name', v_last_appt.doctor_name
        )
    );
END;
$$;

-- 6.5 ATOMIC QR APPOINTMENT BOOKING RPC
CREATE OR REPLACE FUNCTION public.book_qr_appointment(
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
    v_hospital_id UUID := p_hospital_id;
    v_patient_id UUID;
    v_patient_number TEXT;
    v_seq INTEGER;
    v_appointment_id UUID;
    v_token_number INTEGER;
    v_queue_number TEXT;
    v_tracking_token TEXT;
    v_patients_ahead INTEGER := 0;
    v_est_wait INTEGER := 10;
    v_doctor RECORD;
    v_hosp_name TEXT := 'Hospital OPD';
    v_dept_name TEXT;
    v_fee NUMERIC(10, 2);
    v_room TEXT;
    v_method TEXT;
BEGIN
    IF TRIM(COALESCE(p_patient_name, '')) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient name is required.');
    END IF;

    IF TRIM(COALESCE(p_patient_phone, '')) = '' OR LENGTH(TRIM(p_patient_phone)) < 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Valid 10-digit phone number is required.');
    END IF;

    -- Resolve hospital_id
    IF v_hospital_id IS NULL AND p_qr_token IS NOT NULL THEN
        v_clean_token := TRIM(p_qr_token);
        IF v_clean_token LIKE 'tok_%' THEN v_clean_token := SUBSTRING(v_clean_token FROM 5); END IF;

        SELECT hospital_id INTO v_hospital_id FROM public.qr_codes
        WHERE token = v_clean_token OR token = TRIM(p_qr_token) OR booking_url LIKE '%' || v_clean_token || '%'
        LIMIT 1;

        IF v_hospital_id IS NULL THEN
            BEGIN
                v_hospital_id := v_clean_token::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_hospital_id := NULL;
            END;
        END IF;
    END IF;

    IF v_hospital_id IS NULL AND p_doctor_id IS NOT NULL THEN
        SELECT hospital_id INTO v_hospital_id FROM public.profiles WHERE id = p_doctor_id;
    END IF;

    IF v_hospital_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Hospital facility could not be determined.');
    END IF;

    SELECT name INTO v_hosp_name FROM public.hospitals WHERE id = v_hospital_id;

    -- Validate Doctor
    SELECT id, full_name, department_id, department, doctor_code, hospital_id, is_active
    INTO v_doctor
    FROM public.profiles
    WHERE id = p_doctor_id AND hospital_id = v_hospital_id AND role = 'doctor';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor not found at this hospital.');
    END IF;

    IF NOT v_doctor.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'This doctor is currently unavailable.');
    END IF;

    SELECT consultation_fee, room_number INTO v_fee, v_room
    FROM public.doctor_details WHERE id = p_doctor_id;

    v_fee := COALESCE(v_fee, 500.00);
    v_room := COALESCE(v_room, 'Room 101');
    v_dept_name := COALESCE(v_doctor.department, 'General Medicine');

    -- Create or Find Patient (Permanent Patient ID: YYYYMMDD + sequence)
    SELECT id, patient_number INTO v_patient_id, v_patient_number
    FROM public.patients
    WHERE hospital_id = v_hospital_id AND phone = TRIM(p_patient_phone) LIMIT 1;

    IF v_patient_id IS NULL THEN
        INSERT INTO public.hospital_patient_daily_counters (hospital_id, patient_date, last_number, updated_at)
        VALUES (v_hospital_id, p_appointment_date, 1, NOW())
        ON CONFLICT (hospital_id, patient_date)
        DO UPDATE SET last_number = public.hospital_patient_daily_counters.last_number + 1, updated_at = NOW()
        RETURNING last_number INTO v_seq;

        v_patient_number := TO_CHAR(p_appointment_date, 'YYYYMMDD') || LPAD(v_seq::TEXT, 2, '0');

        INSERT INTO public.patients (
            hospital_id, name, phone, age, gender, date_of_birth, known_diseases, previous_medicine, patient_number
        ) VALUES (
            v_hospital_id, TRIM(p_patient_name), TRIM(p_patient_phone), p_patient_age, p_patient_gender,
            p_patient_dob, p_known_diseases, p_previous_medicine, v_patient_number
        ) RETURNING id INTO v_patient_id;
    ELSE
        UPDATE public.patients SET
            name = TRIM(p_patient_name),
            age = COALESCE(p_patient_age, age),
            gender = COALESCE(p_patient_gender, gender),
            date_of_birth = COALESCE(p_patient_dob, date_of_birth),
            known_diseases = COALESCE(p_known_diseases, known_diseases),
            previous_medicine = COALESCE(p_previous_medicine, previous_medicine),
            updated_at = NOW()
        WHERE id = v_patient_id;
    END IF;

    -- Row lock to prevent race conditions on token assignment
    PERFORM 1 FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date
    FOR UPDATE;

    -- Calculate next token number for this doctor today
    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_token_number
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date;

    v_queue_number := UPPER(LEFT(COALESCE(v_dept_name, 'OPD'), 1)) || '-' || LPAD(v_token_number::TEXT, 3, '0');
    v_tracking_token := v_queue_number;

    -- Count waiting patients ahead of this token
    SELECT COUNT(*) INTO v_patients_ahead
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date AND status = 'Waiting';

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
        TRIM(p_patient_name), TRIM(p_patient_phone), p_patient_age, p_patient_gender,
        p_appointment_date, p_appointment_time, p_symptoms, 'Waiting', 'Pending', v_fee, v_method
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
        'hospital_name', v_hosp_name,
        'doctor_id', p_doctor_id,
        'doctor_name', v_doctor.full_name,
        'doctor_code', v_doctor.doctor_code,
        'department_id', v_doctor.department_id,
        'department', v_dept_name,
        'department_name', v_dept_name,
        'patient_id', v_patient_id,
        'patient_number', v_patient_number,
        'patient_name', TRIM(p_patient_name),
        'patient_phone', TRIM(p_patient_phone),
        'patient_age', p_patient_age,
        'patient_gender', p_patient_gender,
        'appointment_date', p_appointment_date,
        'appointment_time', p_appointment_time,
        'room', v_room,
        'fee', v_fee,
        'status', 'Waiting',
        'booking_method', v_method
    );
END;
$$;

-- 6.6 AUTOMATED SERVER-SIDE QUEUE THRESHOLD NOTIFICATIONS (Idempotent 2-Away, 1-Away, Your-Turn)
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
    IF v_current_appt_id IS NOT NULL THEN
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

DROP TRIGGER IF EXISTS trg_evaluate_queue_notifications ON public.appointments;
CREATE TRIGGER trg_evaluate_queue_notifications
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.evaluate_queue_notifications();

-- 6.7 LIVE QUEUE STATUS RPC (for /track/:token)
CREATE OR REPLACE FUNCTION public.get_live_queue_status(p_tracking_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appt RECORD;
    v_doctor RECORD;
    v_hosp RECORD;
    v_waiting_count INTEGER;
    v_current_token INTEGER;
    v_queue_progress JSONB;
    v_notifications JSONB;
    v_est_wait INTEGER;
    v_status_label TEXT;
BEGIN
    SELECT a.*, p.full_name AS doctor_name, p.doctor_code, p.department, dd.room_number, h.name AS hospital_name, pt.patient_number
    INTO v_appt
    FROM public.appointments a
    LEFT JOIN public.profiles p ON p.id = a.doctor_id
    LEFT JOIN public.doctor_details dd ON dd.id = a.doctor_id
    LEFT JOIN public.hospitals h ON h.id = a.hospital_id
    LEFT JOIN public.patients pt ON pt.id = a.patient_id
    WHERE a.id::TEXT = TRIM(p_tracking_token)
       OR a.queue_number = TRIM(p_tracking_token)
       OR a.tracking_token = TRIM(p_tracking_token)
    ORDER BY a.created_at DESC LIMIT 1;

    IF v_appt.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Appointment record not found.');
    END IF;

    SELECT COALESCE(MIN(token_number), v_appt.token_number) INTO v_current_token
    FROM public.appointments
    WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date AND status = 'In Consultation';

    IF v_current_token IS NULL THEN
        SELECT COALESCE(MIN(token_number), v_appt.token_number) INTO v_current_token
        FROM public.appointments
        WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date AND status = 'Waiting';
    END IF;

    SELECT COUNT(*) INTO v_waiting_count
    FROM public.appointments
    WHERE doctor_id = v_appt.doctor_id 
      AND appointment_date = v_appt.appointment_date 
      AND status IN ('Waiting', 'In Consultation')
      AND token_number < v_appt.token_number;

    -- Build queue progress array (anonymized tokens only)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'token_number', sub.token_number,
            'queue_number', sub.queue_number,
            'status', sub.status,
            'is_current', (sub.token_number = v_current_token),
            'is_you', (sub.id = v_appt.id)
        ) ORDER BY sub.token_number ASC
    ), '[]'::jsonb)
    INTO v_queue_progress
    FROM (
        SELECT id, token_number, queue_number, status
        FROM public.appointments
        WHERE doctor_id = v_appt.doctor_id AND appointment_date = v_appt.appointment_date
        ORDER BY token_number ASC
    ) sub;

    -- Fetch notifications for this appointment
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'type', type,
            'title', title,
            'message', message,
            'created_at', created_at,
            'is_read', is_read
        ) ORDER BY created_at DESC
    ), '[]'::jsonb)
    INTO v_notifications
    FROM public.notifications
    WHERE appointment_id = v_appt.id;

    -- Calculate estimated wait
    v_est_wait := v_waiting_count * 12;

    -- Compute live status label
    IF v_appt.status = 'In Consultation' THEN
        v_status_label := 'Now Serving';
    ELSIF v_appt.status = 'Completed' THEN
        v_status_label := 'Completed';
    ELSIF v_appt.status = 'Cancelled' THEN
        v_status_label := 'Cancelled';
    ELSIF v_appt.status = 'No Show' THEN
        v_status_label := 'Missed';
    ELSIF v_waiting_count = 0 THEN
        v_status_label := 'Now Serving';
    ELSIF v_waiting_count <= 2 THEN
        v_status_label := 'Your Turn Soon';
    ELSE
        v_status_label := 'Waiting';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appt.id,
        'token_number', v_appt.token_number,
        'original_token', v_appt.token_number,
        'queue_number', COALESCE(v_appt.queue_number, 'OPD-' || LPAD(v_appt.token_number::TEXT, 3, '0')),
        'patient_id', v_appt.patient_id,
        'patient_number', v_appt.patient_number,
        'patient_name', v_appt.patient_name,
        'doctor_name', v_appt.doctor_name,
        'doctor_code', v_appt.doctor_code,
        'room_number', COALESCE(v_appt.room_number, 'Room 101'),
        'department', COALESCE(v_appt.department, 'General OPD'),
        'hospital_name', v_appt.hospital_name,
        'status', v_appt.status,
        'live_status_label', v_status_label,
        'current_serving_token', v_current_token,
        'live_position', v_current_token,
        'patients_ahead', v_waiting_count,
        'waiting_before_you', v_waiting_count,
        'estimated_wait_mins', v_est_wait,
        'appointment_date', v_appt.appointment_date,
        'queue_progress', v_queue_progress,
        'notifications', v_notifications
    );
END;
$$;

-- 6.7 CREATE MANUAL APPOINTMENT RPC (Front Desk / OPD)
CREATE OR REPLACE FUNCTION public.create_manual_appointment(
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
    v_caller_hospital UUID;
    v_caller_role TEXT;
    v_doctor_hospital UUID;
    v_next_token INTEGER;
    v_queue_number TEXT;
    v_appt_id UUID;
    v_dept_name TEXT;
    v_patient_id UUID;
    v_patient_number TEXT;
    v_seq INTEGER;
BEGIN
    SELECT hospital_id, role INTO v_caller_hospital, v_caller_role FROM public.profiles WHERE id = auth.uid();
    SELECT hospital_id INTO v_doctor_hospital FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';

    IF v_caller_role NOT IN ('hospital_admin', 'staff', 'super_admin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized to create appointments.');
    END IF;

    IF v_doctor_hospital IS NULL OR (v_caller_role <> 'super_admin' AND v_doctor_hospital <> v_caller_hospital) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor does not belong to your hospital.');
    END IF;

    IF TRIM(COALESCE(p_patient_name, '')) = '' OR TRIM(COALESCE(p_patient_phone, '')) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient name and phone are required.');
    END IF;

    -- Upsert patient with atomic permanent patient_number
    SELECT id, patient_number INTO v_patient_id, v_patient_number
    FROM public.patients
    WHERE hospital_id = v_doctor_hospital AND phone = TRIM(p_patient_phone)
    LIMIT 1;

    IF v_patient_id IS NULL THEN
        INSERT INTO public.hospital_patient_daily_counters (hospital_id, patient_date, last_number, updated_at)
        VALUES (v_doctor_hospital, p_appointment_date, 1, NOW())
        ON CONFLICT (hospital_id, patient_date)
        DO UPDATE SET last_number = public.hospital_patient_daily_counters.last_number + 1, updated_at = NOW()
        RETURNING last_number INTO v_seq;

        v_patient_number := TO_CHAR(p_appointment_date, 'YYYYMMDD') || LPAD(v_seq::TEXT, 2, '0');

        INSERT INTO public.patients (hospital_id, name, phone, age, gender, patient_number)
        VALUES (v_doctor_hospital, TRIM(p_patient_name), TRIM(p_patient_phone), p_patient_age, p_patient_gender, v_patient_number)
        RETURNING id INTO v_patient_id;
    END IF;

    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_next_token
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date;

    IF p_department_id IS NOT NULL THEN
        SELECT name INTO v_dept_name FROM public.departments WHERE id = p_department_id;
    END IF;
    v_queue_number := UPPER(LEFT(COALESCE(v_dept_name, 'OPD'), 1)) || '-' || LPAD(v_next_token::TEXT, 3, '0');

    INSERT INTO public.appointments (
        hospital_id, doctor_id, department_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, queue_number, token_number, status, symptoms, is_emergency, booking_method
    ) VALUES (
        v_doctor_hospital, p_doctor_id, p_department_id, v_patient_id, TRIM(p_patient_name), TRIM(p_patient_phone), p_patient_age, p_patient_gender,
        p_appointment_date, v_queue_number, v_next_token, 'Waiting', p_symptoms, COALESCE(p_is_emergency, false), 'Manual'
    ) RETURNING id INTO v_appt_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appt_id,
        'queue_number', v_queue_number,
        'token_number', v_next_token,
        'patient_id', v_patient_id,
        'patient_number', v_patient_number
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6.8 CREATE FOLLOW UP PROCEDURE
CREATE OR REPLACE FUNCTION public.create_follow_up(
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
BEGIN
    SELECT * INTO v_parent FROM public.appointments WHERE id = p_parent_appointment_id;
    IF v_parent.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Original appointment not found.');
    END IF;

    SELECT COALESCE(MAX(NULLIF(regexp_replace(follow_up_token, '[^0-9]', '', 'g'), '')::integer), 0) + 1
    INTO v_next_seq
    FROM public.follow_ups
    WHERE doctor_id = v_parent.doctor_id AND follow_up_date = p_follow_up_date;

    v_token := 'F-' || LPAD(v_next_seq::text, 3, '0');

    INSERT INTO public.appointments (
        hospital_id, doctor_id, department_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, appointment_time, symptoms, notes, status, payment_status, consultation_fee
    ) VALUES (
        v_parent.hospital_id, v_parent.doctor_id, v_parent.department_id, v_parent.patient_id, v_parent.patient_name, v_parent.patient_phone,
        v_parent.patient_age, v_parent.patient_gender, p_follow_up_date, COALESCE(p_preferred_time, '09:00 AM'),
        'Follow-up: ' || COALESCE(p_reason, 'Review'), 'Auto-scheduled follow-up (Token ' || v_token || ')',
        'Waiting', 'Paid', 0.00
    ) RETURNING id INTO v_appt_id;

    INSERT INTO public.follow_ups (
        hospital_id, doctor_id, patient_id, parent_appointment_id, follow_up_appointment_id,
        follow_up_date, follow_up_token, reason, instructions, preferred_time, status
    ) VALUES (
        v_parent.hospital_id, v_parent.doctor_id, v_parent.patient_id, p_parent_appointment_id, v_appt_id,
        p_follow_up_date, v_token, p_reason, p_instructions, p_preferred_time, 'scheduled'
    ) RETURNING id INTO v_follow_up_id;

    RETURN jsonb_build_object(
        'success', true,
        'follow_up_id', v_follow_up_id,
        'follow_up_token', v_token,
        'appointment_id', v_appt_id,
        'follow_up_date', p_follow_up_date
    );
END;
$$;

-- 6.9 ACTIVITY LOGGING RPC
CREATE OR REPLACE FUNCTION public.log_activity(
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
    v_actor_hospital UUID;
    v_actor_role TEXT;
    v_actor_email TEXT;
    v_actor_name TEXT;
    v_log_id UUID;
BEGIN
    SELECT hospital_id, role, email, full_name INTO v_actor_hospital, v_actor_role, v_actor_email, v_actor_name
    FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.activity_logs (
        hospital_id, actor_id, actor_name, actor_email, actor_role, category, action,
        target_type, target_id, target_label, status, metadata
    ) VALUES (
        v_actor_hospital, auth.uid(), v_actor_name, v_actor_email, v_actor_role, p_category, p_action,
        p_target_type, p_target_id::TEXT, p_target_label, COALESCE(p_status, 'success'), COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 6.10 CHAT HELPERS
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_my_hospital UUID;
    v_other_hospital UUID;
    v_conv_id UUID;
BEGIN
    SELECT hospital_id INTO v_my_hospital FROM public.profiles WHERE id = auth.uid();
    SELECT hospital_id INTO v_other_hospital FROM public.profiles WHERE id = p_other_user_id;

    IF v_my_hospital IS NULL OR v_other_hospital IS NULL OR v_my_hospital <> v_other_hospital THEN
        RAISE EXCEPTION 'Both users must belong to the same hospital.';
    END IF;

    SELECT cc.id INTO v_conv_id
    FROM public.chat_conversations cc
    WHERE cc.type = 'direct' AND cc.hospital_id = v_my_hospital
      AND EXISTS (SELECT 1 FROM public.chat_members m1 WHERE m1.conversation_id = cc.id AND m1.user_id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.chat_members m2 WHERE m2.conversation_id = cc.id AND m2.user_id = p_other_user_id)
      AND (SELECT COUNT(*) FROM public.chat_members m WHERE m.conversation_id = cc.id) = 2
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    INSERT INTO public.chat_conversations (hospital_id, type, created_by)
    VALUES (v_my_hospital, 'direct', auth.uid())
    RETURNING id INTO v_conv_id;

    INSERT INTO public.chat_members (conversation_id, user_id, role) VALUES
        (v_conv_id, auth.uid(), 'owner'),
        (v_conv_id, p_other_user_id, 'member');

    RETURN v_conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_group_conversation(p_name TEXT, p_member_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_my_hospital UUID;
    v_conv_id UUID;
    v_member UUID;
BEGIN
    SELECT hospital_id INTO v_my_hospital FROM public.profiles WHERE id = auth.uid();
    IF v_my_hospital IS NULL THEN
        RAISE EXCEPTION 'User must belong to a hospital.';
    END IF;

    INSERT INTO public.chat_conversations (hospital_id, type, name, created_by)
    VALUES (v_my_hospital, 'group', p_name, auth.uid())
    RETURNING id INTO v_conv_id;

    INSERT INTO public.chat_members (conversation_id, user_id, role)
    VALUES (v_conv_id, auth.uid(), 'owner');

    FOREACH v_member IN ARRAY p_member_ids
    LOOP
        IF v_member <> auth.uid() THEN
            INSERT INTO public.chat_members (conversation_id, user_id, role)
            VALUES (v_conv_id, v_member, 'member')
            ON CONFLICT (conversation_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN v_conv_id;
END;
$$;

-- 6.11 FUNCTION PERMISSIONS (Universal Schema Grants)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- ==============================================================================
-- 7. STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('prescriptions', 'prescriptions', true),
  ('hospital-logos', 'hospital-logos', true),
  ('doctor-avatars', 'doctor-avatars', true),
  ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public read storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete storage objects" ON storage.objects;

CREATE POLICY "Public read storage objects" ON storage.objects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated upload storage objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update storage objects" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete storage objects" ON storage.objects FOR DELETE TO authenticated USING (true);

-- ==============================================================================
-- 8. REALTIME PUBLICATIONS
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'patients'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'consultations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'follow_ups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- ==============================================================================
-- 9. INITIAL PLATFORM SUPER ADMIN ACCOUNT (/mrshahidbabu)
-- ==============================================================================

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'shahidbcsm@gmail.com';
  user_password TEXT := 'Shahideeba@19019';
BEGIN
  -- 1. Create account in Supabase Auth
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(user_email)) THEN
    UPDATE auth.users SET
      encrypted_password = crypt(user_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, '')
    WHERE LOWER(email) = LOWER(user_email)
    RETURNING id INTO new_user_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_anonymous, created_at, updated_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      user_email, crypt(user_password, gen_salt('bf')), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"role": "super_admin", "full_name": "Platform Super Admin"}'::jsonb,
      false, false, NOW(), NOW(),
      '', '', '', '', '', '', '', ''
    );
  END IF;

  -- 2. Insert into auth.identities
  IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = new_user_id AND provider = 'email') THEN
    UPDATE auth.identities SET
      identity_data = jsonb_build_object('sub', new_user_id::text, 'email', LOWER(user_email)),
      updated_at = NOW()
    WHERE user_id = new_user_id AND provider = 'email';
  ELSE
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', LOWER(user_email)),
      'email', LOWER(user_email), NOW(), NOW(), NOW()
    );
  END IF;

  -- 3. Upsert profile record
  INSERT INTO public.profiles (
    id, full_name, email, role, is_active, account_status
  ) VALUES (
    new_user_id, 'Platform Super Admin', user_email, 'super_admin', true, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    account_status = 'active';

  -- 4. Store initial Super Admin credentials in user_credentials_vault
  INSERT INTO public.user_credentials_vault (
    user_id, role, full_name, email, initial_password
  ) VALUES (
    new_user_id, 'super_admin', 'Platform Super Admin', user_email, user_password
  );

  RAISE NOTICE 'Platform Super Admin created! Email: %, Password: %', user_email, user_password;
END $$;
