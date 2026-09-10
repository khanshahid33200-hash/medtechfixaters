-- ============================================================================
-- MEDTECH FIXATERS — LIVE QUEUE + QR + APPOINTMENTS (Phase 4)
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- ADDITIVE ONLY — does not drop the schema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: appointments — booking method + realtime
-- ----------------------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_method TEXT DEFAULT 'Manual' CHECK (booking_method IN ('AI', 'Manual'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: create_manual_appointment — atomic token assignment. Client-side
-- "SELECT max(token_number) then INSERT" would race under concurrent walk-in
-- registrations at the front desk; this RPC does both under one row lock.
-- ----------------------------------------------------------------------------
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller_hospital UUID;
    v_caller_role TEXT;
    v_doctor_hospital UUID;
    v_next_token INTEGER;
    v_queue_number TEXT;
    v_appt_id UUID;
    v_dept_name TEXT;
BEGIN
    SELECT hospital_id, role INTO v_caller_hospital, v_caller_role FROM public.profiles WHERE id = auth.uid();
    SELECT hospital_id INTO v_doctor_hospital FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';

    IF v_caller_role NOT IN ('hospital_admin', 'staff', 'super_admin') THEN
        RAISE EXCEPTION 'Not authorized to create appointments.';
    END IF;
    IF v_doctor_hospital IS NULL OR (v_caller_role <> 'super_admin' AND v_doctor_hospital <> v_caller_hospital) THEN
        RAISE EXCEPTION 'Doctor does not belong to your hospital.';
    END IF;
    IF TRIM(COALESCE(p_patient_name, '')) = '' OR TRIM(COALESCE(p_patient_phone, '')) = '' THEN
        RAISE EXCEPTION 'Patient name and phone are required.';
    END IF;

    -- Lock this doctor's rows for the day so concurrent inserts serialize
    -- rather than racing on the same token number.
    PERFORM 1 FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date
    FOR UPDATE;

    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_next_token
    FROM public.appointments
    WHERE doctor_id = p_doctor_id AND appointment_date = p_appointment_date;

    IF p_department_id IS NOT NULL THEN
        SELECT name INTO v_dept_name FROM public.departments WHERE id = p_department_id;
    END IF;
    v_queue_number := UPPER(LEFT(COALESCE(v_dept_name, 'OPD'), 1)) || '-' || LPAD(v_next_token::TEXT, 3, '0');

    INSERT INTO public.appointments (
        hospital_id, doctor_id, department_id, patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, queue_number, token_number, status, symptoms, is_emergency, booking_method
    ) VALUES (
        v_doctor_hospital, p_doctor_id, p_department_id, TRIM(p_patient_name), TRIM(p_patient_phone), p_patient_age, p_patient_gender,
        p_appointment_date, v_queue_number, v_next_token, 'Waiting', p_symptoms, COALESCE(p_is_emergency, false), 'Manual'
    ) RETURNING id INTO v_appt_id;

    PERFORM public.log_activity(
        'Appointments', 'Appointment Created', 'appointment', v_appt_id, p_patient_name || ' — ' || v_queue_number,
        'success', jsonb_build_object('doctor_id', p_doctor_id, 'token', v_queue_number)
    );

    RETURN jsonb_build_object('success', true, 'appointment_id', v_appt_id, 'queue_number', v_queue_number, 'token_number', v_next_token);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_manual_appointment(UUID, TEXT, TEXT, INTEGER, TEXT, UUID, TEXT, BOOLEAN, DATE) TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 3: QR management — hospital_admin needs INSERT/UPDATE on their own
-- hospital's qr_codes row (previously only SELECT existed for that role,
-- silently making "Regenerate" / "Activate/Deactivate" no-ops under RLS).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Hospital Admin manage own qr_codes" ON public.qr_codes;
CREATE POLICY "Hospital Admin manage own qr_codes" ON public.qr_codes
    FOR ALL TO authenticated
    USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id())
    WITH CHECK (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
