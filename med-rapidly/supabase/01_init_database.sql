-- ============================================================================
-- Med Rapidly - Complete Database Setup SQL
-- Database: med_rapidly
-- Version: 1.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HOSPITALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    letterhead_html TEXT,
    opening_hours JSONB,
    daily_token_cap INTEGER DEFAULT 500,
    booking_window_days INTEGER DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hospitals_created_by ON hospitals(created_by);
CREATE INDEX idx_hospitals_status ON hospitals(status);
CREATE INDEX idx_hospitals_created_at ON hospitals(created_at);

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_code VARCHAR(5) NOT NULL,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, short_code)
);

CREATE INDEX idx_departments_hospital ON departments(hospital_id);
CREATE INDEX idx_departments_short_code ON departments(short_code);

-- ============================================================================
-- USERS TABLE (Doctors, Admins, Reception Staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('doctor', 'hospital_admin', 'reception', 'super_admin')),
    qualification TEXT,
    registration_number VARCHAR,
    specialisation TEXT,
    signature_image_url TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    consultation_fee NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended'))
);

CREATE INDEX idx_users_hospital ON users(hospital_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================================
-- INTAKE LINKS TABLE (QR Codes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS intake_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    token VARCHAR(24) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    regenerated_at TIMESTAMP,
    regenerated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_intake_links_hospital ON intake_links(hospital_id);
CREATE INDEX idx_intake_links_token ON intake_links(token);

-- ============================================================================
-- PATIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR,
    age INTEGER,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, phone)
);

CREATE INDEX idx_patients_hospital ON patients(hospital_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);

-- ============================================================================
-- DOCTOR AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avail_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    room_number VARCHAR,
    daily_limit INTEGER DEFAULT 20,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, avail_date)
);

CREATE INDEX idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_date ON doctor_availability(avail_date);

-- ============================================================================
-- APPOINTMENTS TABLE (Queue Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    appt_date DATE NOT NULL,
    appt_token VARCHAR(10) NOT NULL,
    queue_number INTEGER NOT NULL,
    queue_prefix VARCHAR(5) NOT NULL,
    status VARCHAR DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consult', 'done', 'no_show', 'cancelled')),
    priority_flag BOOLEAN DEFAULT false,
    complaint TEXT,
    previous_doctor TEXT,
    previous_medicines TEXT,
    other_details TEXT,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    source VARCHAR DEFAULT 'qr' CHECK (source IN ('qr', 'voice', 'reception', 'walk_in')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(hospital_id, appt_token)
);

CREATE INDEX idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appt_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- ============================================================================
-- QUEUE COUNTERS TABLE (Per Doctor Per Day)
-- ============================================================================
CREATE TABLE IF NOT EXISTS queue_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL,
    next_number INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, counter_date)
);

CREATE INDEX idx_queue_counters_doctor ON queue_counters(doctor_id);
CREATE INDEX idx_queue_counters_date ON queue_counters(counter_date);

-- ============================================================================
-- TOKEN COUNTERS TABLE (Per Hospital Per Day)
-- ============================================================================
CREATE TABLE IF NOT EXISTS token_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL,
    next_number INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, counter_date)
);

CREATE INDEX idx_token_counters_hospital ON token_counters(hospital_id);
CREATE INDEX idx_token_counters_date ON token_counters(counter_date);

-- ============================================================================
-- CONSULTATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    symptoms TEXT,
    vitals JSONB,
    diagnosis TEXT NOT NULL,
    advice TEXT,
    follow_up_date DATE,
    private_notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consultations_appointment ON consultations(appointment_id);
CREATE INDEX idx_consultations_created_by ON consultations(created_by);

-- ============================================================================
-- PRESCRIPTION ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    duration TEXT,
    frequency TEXT,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescription_items_consultation ON prescription_items(consultation_id);

-- ============================================================================
-- PRESCRIPTION PDFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescription_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    pdf_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescription_pdfs_consultation ON prescription_pdfs(consultation_id);

-- ============================================================================
-- PRESCRIPTION ACCESS TABLE (OTP for Download)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescription_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_id UUID REFERENCES prescription_pdfs(id) ON DELETE CASCADE,
    patient_phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    accessed_at TIMESTAMP,
    accessed_from TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescription_access_pdf ON prescription_access(pdf_id);
CREATE INDEX idx_prescription_access_phone ON prescription_access(patient_phone);

-- ============================================================================
-- VOICE CALLS TABLE (Agent Transcripts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    caller_phone VARCHAR(20) NOT NULL,
    call_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    transcript TEXT,
    language_detected VARCHAR,
    outcome VARCHAR CHECK (outcome IN ('completed', 'transferred', 'failed')),
    appointment_created_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    is_recorded BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_calls_hospital ON voice_calls(hospital_id);
CREATE INDEX idx_voice_calls_caller_phone ON voice_calls(caller_phone);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    changes JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_hospital ON audit_log(hospital_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER doctor_availability_updated_at BEFORE UPDATE ON doctor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER prescription_pdfs_updated_at BEFORE UPDATE ON prescription_pdfs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
