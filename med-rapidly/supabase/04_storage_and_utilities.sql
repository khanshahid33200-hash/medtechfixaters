-- ============================================================================
-- Med Rapidly - Storage & Utilities Setup
-- This file contains storage bucket setup and utility functions
-- Note: Storage buckets are typically created via Supabase dashboard or API
-- ============================================================================

-- ============================================================================
-- FUNCTION: Create Hospital (with auto-generated intake link)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_hospital(
    p_name TEXT,
    p_phone VARCHAR,
    p_address TEXT,
    p_daily_token_cap INTEGER DEFAULT 500,
    p_booking_window_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    hospital_id UUID,
    intake_token VARCHAR
) AS $$
DECLARE
    v_hospital_id UUID;
    v_intake_token VARCHAR;
BEGIN
    -- Insert hospital
    INSERT INTO hospitals (name, phone, address, daily_token_cap, booking_window_days, status)
    VALUES (p_name, p_phone, p_address, p_daily_token_cap, p_booking_window_days, 'active')
    RETURNING id INTO v_hospital_id;

    -- Generate unique intake token
    v_intake_token := 'INTAKE_' || UPPER(SUBSTRING(p_name, 1, 3)) || '_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS');

    -- Insert intake link
    INSERT INTO intake_links (hospital_id, token)
    VALUES (v_hospital_id, v_intake_token);

    RETURN QUERY SELECT v_hospital_id, v_intake_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Department
-- ============================================================================
CREATE OR REPLACE FUNCTION create_department(
    p_hospital_id UUID,
    p_name TEXT,
    p_short_code VARCHAR,
    p_display_order INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_department_id UUID;
BEGIN
    -- Verify hospital exists
    IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
        RAISE EXCEPTION 'Hospital not found';
    END IF;

    INSERT INTO departments (hospital_id, name, short_code, display_order)
    VALUES (p_hospital_id, p_name, p_short_code, p_display_order)
    RETURNING id INTO v_department_id;

    RETURN v_department_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Register Patient
-- ============================================================================
CREATE OR REPLACE FUNCTION register_patient(
    p_hospital_id UUID,
    p_name TEXT,
    p_phone VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_age INTEGER DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_patient_id UUID;
BEGIN
    -- Verify hospital exists
    IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
        RAISE EXCEPTION 'Hospital not found';
    END IF;

    -- Check if patient already exists
    SELECT id INTO v_patient_id FROM patients
    WHERE hospital_id = p_hospital_id AND phone = p_phone;

    IF v_patient_id IS NOT NULL THEN
        -- Patient exists, update if needed
        UPDATE patients
        SET
            name = COALESCE(p_name, name),
            email = COALESCE(p_email, email),
            age = COALESCE(p_age, age),
            address = COALESCE(p_address, address)
        WHERE id = v_patient_id;
        RETURN v_patient_id;
    END IF;

    -- Create new patient
    INSERT INTO patients (hospital_id, name, phone, email, age, address)
    VALUES (p_hospital_id, p_name, p_phone, p_email, p_age, p_address)
    RETURNING id INTO v_patient_id;

    RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Available Doctors
-- ============================================================================
CREATE OR REPLACE FUNCTION get_available_doctors(
    p_hospital_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    doctor_id UUID,
    full_name TEXT,
    specialisation TEXT,
    department_name TEXT,
    room_number VARCHAR,
    daily_limit INTEGER,
    current_queue_count INTEGER,
    is_available BOOLEAN,
    consultation_fee NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.full_name,
        u.specialisation,
        d.name,
        da.room_number,
        da.daily_limit,
        COUNT(a.id)::INTEGER,
        da.is_available,
        u.consultation_fee
    FROM users u
    JOIN departments d ON u.department_id = d.id
    LEFT JOIN doctor_availability da ON u.id = da.doctor_id AND da.avail_date = p_date
    LEFT JOIN appointments a ON u.id = a.doctor_id AND a.appt_date = p_date AND a.status != 'cancelled'
    WHERE u.hospital_id = p_hospital_id
        AND u.role = 'doctor'
        AND u.status = 'active'
        AND (da.is_available = true OR da.avail_date IS NULL)
    GROUP BY u.id, u.full_name, u.specialisation, d.name, da.room_number, da.daily_limit, da.is_available, u.consultation_fee
    ORDER BY u.full_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Appointment (Queue Item)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_appointment(
    p_hospital_id UUID,
    p_patient_id UUID,
    p_doctor_id UUID,
    p_appt_date DATE,
    p_queue_prefix VARCHAR,
    p_complaint TEXT DEFAULT NULL,
    p_previous_medicines TEXT DEFAULT NULL,
    p_consent_given BOOLEAN DEFAULT true,
    p_source VARCHAR DEFAULT 'qr'
)
RETURNS TABLE (
    appointment_id UUID,
    appt_token VARCHAR,
    queue_number INTEGER
) AS $$
DECLARE
    v_appointment_id UUID;
    v_queue_number INTEGER;
    v_appt_token VARCHAR;
    v_next_token_number INTEGER;
BEGIN
    -- Verify hospital, patient, and doctor exist
    IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
        RAISE EXCEPTION 'Hospital not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id AND hospital_id = p_hospital_id) THEN
        RAISE EXCEPTION 'Patient not found in this hospital';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_doctor_id AND hospital_id = p_hospital_id AND role = 'doctor') THEN
        RAISE EXCEPTION 'Doctor not found in this hospital';
    END IF;

    -- Get next queue number for this doctor
    SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_queue_number
    FROM appointments
    WHERE doctor_id = p_doctor_id AND appt_date = p_appt_date;

    -- Get next token number for hospital
    INSERT INTO token_counters (hospital_id, counter_date, next_number)
    VALUES (p_hospital_id, p_appt_date, 1)
    ON CONFLICT (hospital_id, counter_date) DO UPDATE
    SET next_number = token_counters.next_number + 1
    RETURNING next_number INTO v_next_token_number;

    v_appt_token := p_queue_prefix || '-' || LPAD(v_next_token_number::TEXT, 3, '0');

    -- Create appointment
    INSERT INTO appointments (
        hospital_id,
        patient_id,
        doctor_id,
        appt_date,
        appt_token,
        queue_number,
        queue_prefix,
        complaint,
        previous_medicines,
        consent_given,
        source,
        status
    ) VALUES (
        p_hospital_id,
        p_patient_id,
        p_doctor_id,
        p_appt_date,
        v_appt_token,
        v_queue_number,
        p_queue_prefix,
        p_complaint,
        p_previous_medicines,
        p_consent_given,
        p_source,
        'waiting'
    )
    RETURNING id INTO v_appointment_id;

    RETURN QUERY SELECT v_appointment_id, v_appt_token, v_queue_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Appointment Queue Status
-- ============================================================================
CREATE OR REPLACE FUNCTION get_appointment_queue_status(p_appointment_id UUID)
RETURNS TABLE (
    appointment_id UUID,
    patient_name TEXT,
    doctor_name TEXT,
    appt_token VARCHAR,
    queue_number INTEGER,
    status VARCHAR,
    patients_ahead INTEGER,
    estimated_wait_minutes INTEGER
) AS $$
DECLARE
    v_doctor_id UUID;
    v_appt_date DATE;
    v_queue_number INTEGER;
    v_patients_ahead INTEGER;
BEGIN
    -- Get appointment details
    SELECT
        a.doctor_id,
        a.appt_date,
        a.queue_number
    INTO v_doctor_id, v_appt_date, v_queue_number
    FROM appointments
    WHERE id = p_appointment_id;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Appointment not found';
    END IF;

    -- Count patients ahead
    SELECT COUNT(*) INTO v_patients_ahead
    FROM appointments
    WHERE doctor_id = v_doctor_id
        AND appt_date = v_appt_date
        AND queue_number < v_queue_number
        AND status IN ('waiting', 'in_consult');

    RETURN QUERY
    SELECT
        a.id,
        p.name,
        u.full_name,
        a.appt_token,
        a.queue_number,
        a.status,
        v_patients_ahead,
        (v_patients_ahead * 15)::INTEGER  -- Assume 15 min per patient
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN users u ON a.doctor_id = u.id
    WHERE a.id = p_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Update Appointment Status
-- ============================================================================
CREATE OR REPLACE FUNCTION update_appointment_status(
    p_appointment_id UUID,
    p_new_status VARCHAR
)
RETURNS VOID AS $$
BEGIN
    IF p_new_status NOT IN ('waiting', 'in_consult', 'done', 'no_show', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    UPDATE appointments
    SET
        status = p_new_status,
        called_at = CASE WHEN p_new_status = 'in_consult' THEN CURRENT_TIMESTAMP ELSE called_at END,
        started_at = CASE WHEN p_new_status = 'in_consult' THEN CURRENT_TIMESTAMP ELSE started_at END,
        completed_at = CASE WHEN p_new_status = 'done' THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = p_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Hospital Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_hospital_statistics(p_hospital_id UUID)
RETURNS TABLE (
    total_patients BIGINT,
    total_doctors BIGINT,
    today_appointments BIGINT,
    today_completed BIGINT,
    today_waiting BIGINT,
    active_departments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM patients WHERE hospital_id = p_hospital_id),
        (SELECT COUNT(*) FROM users WHERE hospital_id = p_hospital_id AND role = 'doctor' AND status = 'active'),
        (SELECT COUNT(*) FROM appointments WHERE hospital_id = p_hospital_id AND appt_date = CURRENT_DATE),
        (SELECT COUNT(*) FROM appointments WHERE hospital_id = p_hospital_id AND appt_date = CURRENT_DATE AND status = 'done'),
        (SELECT COUNT(*) FROM appointments WHERE hospital_id = p_hospital_id AND appt_date = CURRENT_DATE AND status = 'waiting'),
        (SELECT COUNT(*) FROM departments WHERE hospital_id = p_hospital_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORAGE BUCKET SETUP (Supabase Format)
-- Note: These need to be created via Supabase Dashboard or API
-- ============================================================================

-- Storage Buckets to create:
-- 1. "hospital-logos" - For hospital branding
-- 2. "prescription-pdfs" - For prescription documents
-- 3. "doctor-signatures" - For digital signatures
-- 4. "patient-documents" - For patient medical documents
-- 5. "voice-recordings" - For call recordings

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to cleanup old completed appointments (archival)
CREATE OR REPLACE FUNCTION archive_old_appointments(p_days_back INTEGER DEFAULT 90)
RETURNS TABLE (
    archived_count INTEGER
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM appointments
    WHERE
        status = 'done'
        AND completed_at < CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL
        AND appt_date < CURRENT_DATE - (p_days_back || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily counters (run at midnight)
CREATE OR REPLACE FUNCTION reset_daily_counters()
RETURNS TABLE (
    reset_count INTEGER
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Delete old counters (keep 30 days of history)
    DELETE FROM queue_counters
    WHERE counter_date < CURRENT_DATE - INTERVAL '30 days';

    DELETE FROM token_counters
    WHERE counter_date < CURRENT_DATE - INTERVAL '30 days';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View: Active Doctors with Patient Load
CREATE OR REPLACE VIEW active_doctors_with_load AS
SELECT
    u.id,
    u.hospital_id,
    u.full_name,
    u.specialisation,
    d.name as department,
    COUNT(DISTINCT a.patient_id) as total_patients_today,
    COUNT(CASE WHEN a.status = 'waiting' THEN 1 END) as waiting_count,
    COUNT(CASE WHEN a.status = 'in_consult' THEN 1 END) as consulting_count,
    COUNT(CASE WHEN a.status = 'done' THEN 1 END) as completed_count
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN appointments a ON u.id = a.doctor_id AND a.appt_date = CURRENT_DATE
WHERE u.role = 'doctor' AND u.status = 'active'
GROUP BY u.id, u.hospital_id, u.full_name, u.specialisation, d.name;

-- View: Hospital Daily Statistics
CREATE OR REPLACE VIEW hospital_daily_statistics AS
SELECT
    h.id,
    h.name,
    CURRENT_DATE as stat_date,
    COUNT(DISTINCT p.id) as total_registered_patients,
    COUNT(DISTINCT u.id) as active_doctors,
    COUNT(DISTINCT CASE WHEN a.status != 'cancelled' THEN a.id END) as total_appointments_today,
    COUNT(DISTINCT CASE WHEN a.status = 'done' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'waiting' THEN a.id END) as waiting_appointments
FROM hospitals h
LEFT JOIN patients p ON h.id = p.hospital_id
LEFT JOIN users u ON h.id = u.hospital_id AND u.role = 'doctor' AND u.status = 'active'
LEFT JOIN appointments a ON h.id = a.hospital_id AND a.appt_date = CURRENT_DATE
GROUP BY h.id, h.name;

-- ============================================================================
-- NOTES FOR SUPABASE SETUP
-- ============================================================================
-- 1. Create storage buckets via Supabase Dashboard:
--    - Navigate to Storage > Buckets
--    - Create public buckets for: hospital-logos, patient-documents, doctor-signatures
--    - Create private buckets for: prescription-pdfs, voice-recordings
--
-- 2. Set up storage policies (RLS) via SQL or Dashboard
--
-- 3. Enable realtime on tables if using websockets:
--    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
--
-- 4. For production, enable Row Level Security (RLS) for sensitive tables
--
-- 5. Create database triggers for audit logging on data modifications
