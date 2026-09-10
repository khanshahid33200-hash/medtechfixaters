-- ============================================================================
-- MEDTECH FIXATERS — book_qr_appointment() RPC
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- ADDITIVE ONLY — does not drop the schema.
--
-- Three places in the frontend already call supabase.rpc('book_qr_appointment',
-- {...}) — the public QR self-booking flow (IntakePage.tsx), front-desk
-- check-in (Checkin.tsx), and the Doctor Dashboard's "Add Walk-In" action
-- (lib/doctorAppointments.ts addWalkInAppointment) — but the function was
-- never created in any prior migration, hence:
--   "Could not find the function public.book_qr_appointment(...) in the
--   schema cache"
-- This defines it with every parameter name any of those three call sites
-- use (all with defaults, so each caller's exact subset of named params
-- resolves to this one function).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.book_qr_appointment(
    p_qr_token TEXT,
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_patient_gender TEXT DEFAULT 'Other',
    p_patient_age INTEGER DEFAULT NULL,
    p_patient_dob DATE DEFAULT NULL,
    p_symptoms TEXT DEFAULT NULL,
    p_known_diseases TEXT DEFAULT NULL,
    p_previous_medicine TEXT DEFAULT NULL,
    p_previous_doctor_id UUID DEFAULT NULL,
    p_patient_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_hospital_id UUID;
    v_hospital_status TEXT;
    v_hospital_name TEXT;
    v_doctor RECORD;
    v_patient_id UUID;
    v_next_token INTEGER;
    v_queue_number TEXT;
    v_tracking_token TEXT;
    v_appt_id UUID;
    v_dept_name TEXT;
    v_clean_phone TEXT := TRIM(p_patient_phone);
    v_clean_name TEXT := TRIM(p_patient_name);
BEGIN
    IF v_clean_name = '' OR v_clean_phone = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Patient name and phone are required.');
    END IF;

    -- Resolve hospital from the QR token (same lookup shape as
    -- get_qr_booking_info: token match, or a raw hospital UUID).
    SELECT hospital_id INTO v_hospital_id
    FROM public.qr_codes
    WHERE (token = TRIM(p_qr_token) OR token = 'tok_' || TRIM(p_qr_token))
      AND (status = 'active' OR is_active = true)
    LIMIT 1;

    IF v_hospital_id IS NULL THEN
        BEGIN
            v_hospital_id := TRIM(p_qr_token)::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_hospital_id := NULL;
        END;
    END IF;

    IF v_hospital_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive hospital QR/booking token.');
    END IF;

    SELECT status, name INTO v_hospital_status, v_hospital_name FROM public.hospitals WHERE id = v_hospital_id;
    IF v_hospital_status IS NULL OR v_hospital_status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This hospital is not currently accepting bookings.');
    END IF;

    -- Doctor must genuinely belong to this hospital and be an active doctor
    -- — never trust the client's doctor_id/hospital_id pairing blindly.
    SELECT id, full_name, department, doctor_code, hospital_id, is_active INTO v_doctor
    FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';

    IF v_doctor.id IS NULL OR v_doctor.hospital_id <> v_hospital_id OR NOT v_doctor.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected doctor is not available at this hospital.');
    END IF;

    v_dept_name := v_doctor.department;

    -- Patient dedup: reuse an existing record for this phone within this
    -- hospital rather than creating a duplicate patient every visit.
    SELECT id INTO v_patient_id FROM public.patients WHERE hospital_id = v_hospital_id AND phone = v_clean_phone LIMIT 1;

    IF v_patient_id IS NULL THEN
        INSERT INTO public.patients (
            hospital_id, patient_number, name, phone, age, gender, date_of_birth, known_diseases, previous_medicine, previous_doctor_id
        ) VALUES (
            v_hospital_id, p_patient_number, v_clean_name, v_clean_phone, p_patient_age, p_patient_gender, p_patient_dob,
            p_known_diseases, p_previous_medicine, p_previous_doctor_id
        ) RETURNING id INTO v_patient_id;
    ELSE
        UPDATE public.patients SET
            name = v_clean_name,
            age = COALESCE(p_patient_age, age),
            gender = COALESCE(p_patient_gender, gender),
            date_of_birth = COALESCE(p_patient_dob, date_of_birth),
            known_diseases = COALESCE(p_known_diseases, known_diseases),
            previous_medicine = COALESCE(p_previous_medicine, previous_medicine),
            updated_at = NOW()
        WHERE id = v_patient_id;
    END IF;

    -- Atomic per-doctor-per-day token assignment — same row-lock pattern as
    -- create_manual_appointment(), so a QR self-booking and a front-desk
    -- walk-in for the same doctor/day can never race onto the same token.
    PERFORM 1 FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date
    FOR UPDATE;

    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_next_token
    FROM public.appointments WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date;

    v_queue_number := UPPER(LEFT(COALESCE(v_dept_name, 'OPD'), 1)) || '-' || LPAD(v_next_token::TEXT, 3, '0');
    v_tracking_token := REPLACE(gen_random_uuid()::TEXT, '-', '');

    INSERT INTO public.appointments (
        hospital_id, doctor_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, queue_number, token_number, tracking_token, status, symptoms, known_diseases,
        previous_medicine, previous_doctor_id, booking_method
    ) VALUES (
        v_hospital_id, p_doctor_id, v_patient_id, v_clean_name, v_clean_phone, p_patient_age, p_patient_gender,
        p_appointment_date, v_queue_number, v_next_token, v_tracking_token, 'Waiting', p_symptoms, p_known_diseases,
        p_previous_medicine, p_previous_doctor_id, 'Manual'
    ) RETURNING id INTO v_appt_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appt_id,
        'token_number', v_next_token,
        'queue_number', v_queue_number,
        'tracking_token', v_tracking_token,
        'doctor_name', v_doctor.full_name,
        'doctor_code', v_doctor.doctor_code,
        'department', v_dept_name,
        'hospital_id', v_hospital_id,
        'hospital_name', v_hospital_name,
        'appointment_date', p_appointment_date,
        'live_position', v_next_token,
        'patients_ahead', GREATEST(v_next_token - 1, 0)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_qr_appointment(
    TEXT, UUID, DATE, TEXT, TEXT, TEXT, INTEGER, DATE, TEXT, TEXT, TEXT, UUID, TEXT
) TO anon, authenticated;
