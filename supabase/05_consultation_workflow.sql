-- ============================================================================
-- MEDTECH FIXATERS — CONSULTATION WORKFLOW: TEST REQUESTS, FOLLOW-UPS,
-- DOCTOR REQUESTS, EMERGENCY ESCALATION (Doctor Dashboard Phase 2)
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- ADDITIVE ONLY — does not drop the schema. Reuses the existing
-- public.consultations / public.prescriptions tables from 01_master_setup.sql
-- (prescriptions.medicines is already a JSONB array — no separate
-- prescription_items table needed). This file adds the four genuinely
-- missing pieces: test_requests, follow_ups, doctor_requests,
-- emergency_requests.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: TEST REQUESTS ("Suggest Test")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
    tests JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["CBC","Blood Sugar","X-Ray",...]
    custom_test TEXT,
    instructions TEXT,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- STEP 2: FOLLOW-UPS — separate token/queue system. A follow-up visit must
-- NEVER reuse the original consultation's token, so follow_up_token is
-- generated from its own counter (F-001, F-002, ...) scoped per doctor per
-- day, exactly parallel to how appointments.token_number works for regular
-- tokens, but in its own sequence.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    parent_appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    follow_up_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL, -- set once the follow-up date's queue token exists
    follow_up_date DATE NOT NULL,
    follow_up_token TEXT, -- e.g. F-001, assigned when the follow-up appointment row is created for that date
    reason TEXT,
    instructions TEXT,
    preferred_time TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'due_today', 'completed', 'overdue', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_doctor_date ON public.follow_ups(doctor_id, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_hospital ON public.follow_ups(hospital_id);

-- Atomic follow-up creation: generates today's-or-future F-### token for the
-- given doctor+date under its own counter (never the same sequence as
-- appointments.token_number), and creates the linked appointment row that
-- actually seats the patient in that date's follow-up queue.
CREATE OR REPLACE FUNCTION public.create_follow_up(
    p_parent_appointment_id UUID,
    p_follow_up_date DATE,
    p_reason TEXT DEFAULT NULL,
    p_instructions TEXT DEFAULT NULL,
    p_preferred_time TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    IF v_parent.doctor_id <> auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the treating doctor may schedule this follow-up.');
    END IF;

    -- Lock this doctor's follow_ups rows for the target date to serialize
    -- token assignment under concurrent saves.
    PERFORM 1 FROM public.follow_ups WHERE doctor_id = v_parent.doctor_id AND follow_up_date = p_follow_up_date FOR UPDATE;

    SELECT COALESCE(MAX(
        CASE WHEN follow_up_token ~ '^F-[0-9]+$' THEN SUBSTRING(follow_up_token FROM 3)::INTEGER ELSE 0 END
    ), 0) + 1 INTO v_next_seq
    FROM public.follow_ups WHERE doctor_id = v_parent.doctor_id AND follow_up_date = p_follow_up_date;

    v_token := 'F-' || LPAD(v_next_seq::TEXT, 3, '0');

    -- Seat the follow-up in that date's real queue as its own appointment
    -- row (appointment_type distinguished via queue_number prefix 'F-' so
    -- it's never visually or numerically confused with a regular token).
    INSERT INTO public.appointments (
        hospital_id, doctor_id, department_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        appointment_date, queue_number, token_number, status, booking_method
    ) VALUES (
        v_parent.hospital_id, v_parent.doctor_id, v_parent.department_id, v_parent.patient_id, v_parent.patient_name, v_parent.patient_phone,
        v_parent.patient_age, v_parent.patient_gender, p_follow_up_date, v_token, v_next_seq, 'Waiting', 'Manual'
    ) RETURNING id INTO v_appt_id;

    INSERT INTO public.follow_ups (
        hospital_id, doctor_id, patient_id, parent_appointment_id, follow_up_appointment_id,
        follow_up_date, follow_up_token, reason, instructions, preferred_time, status
    ) VALUES (
        v_parent.hospital_id, v_parent.doctor_id, v_parent.patient_id, p_parent_appointment_id, v_appt_id,
        p_follow_up_date, v_token, p_reason, p_instructions, p_preferred_time,
        CASE WHEN p_follow_up_date = CURRENT_DATE THEN 'due_today' ELSE 'scheduled' END
    ) RETURNING id INTO v_follow_up_id;

    PERFORM public.log_activity('Follow-Up', 'Follow-Up Created', 'follow_up', v_follow_up_id, v_parent.patient_name || ' — ' || v_token);

    RETURN jsonb_build_object('success', true, 'follow_up_id', v_follow_up_id, 'follow_up_token', v_token, 'appointment_id', v_appt_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_follow_up(UUID, DATE, TEXT, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 3: DOCTOR REQUESTS ("Raise Request" — staff/receptionist/lab/pharmacy/
-- nursing/assistance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('hospital_staff', 'receptionist', 'lab', 'pharmacy', 'nursing', 'assistance', 'other')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- STEP 4: EMERGENCY REQUESTS ("Send to Emergency Ward")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'high' CHECK (priority IN ('critical', 'high', 'urgent')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- STEP 5: RLS — doctor sees/manages only their own hospital+doctor_id rows;
-- hospital_admin sees everything in their hospital (to action requests /
-- monitor emergencies); super_admin unrestricted.
-- ----------------------------------------------------------------------------
ALTER TABLE public.test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctor manage own test_requests" ON public.test_requests;
CREATE POLICY "Doctor manage own test_requests" ON public.test_requests
    FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id())
    WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Hospital Admin view test_requests" ON public.test_requests;
CREATE POLICY "Hospital Admin view test_requests" ON public.test_requests
    FOR SELECT TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Super Admin full access test_requests" ON public.test_requests;
CREATE POLICY "Super Admin full access test_requests" ON public.test_requests FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Doctor manage own follow_ups" ON public.follow_ups;
CREATE POLICY "Doctor manage own follow_ups" ON public.follow_ups
    FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id())
    WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Hospital Admin view follow_ups" ON public.follow_ups;
CREATE POLICY "Hospital Admin view follow_ups" ON public.follow_ups
    FOR SELECT TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Super Admin full access follow_ups" ON public.follow_ups;
CREATE POLICY "Super Admin full access follow_ups" ON public.follow_ups FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Doctor manage own doctor_requests" ON public.doctor_requests;
CREATE POLICY "Doctor manage own doctor_requests" ON public.doctor_requests
    FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id())
    WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Hospital Admin manage doctor_requests" ON public.doctor_requests;
CREATE POLICY "Hospital Admin manage doctor_requests" ON public.doctor_requests
    FOR ALL TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id())
    WITH CHECK (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Super Admin full access doctor_requests" ON public.doctor_requests;
CREATE POLICY "Super Admin full access doctor_requests" ON public.doctor_requests FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Doctor manage own emergency_requests" ON public.emergency_requests;
CREATE POLICY "Doctor manage own emergency_requests" ON public.emergency_requests
    FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id())
    WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Hospital Admin manage emergency_requests" ON public.emergency_requests;
CREATE POLICY "Hospital Admin manage emergency_requests" ON public.emergency_requests
    FOR ALL TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id())
    WITH CHECK (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Super Admin full access emergency_requests" ON public.emergency_requests;
CREATE POLICY "Super Admin full access emergency_requests" ON public.emergency_requests FOR ALL TO authenticated USING (public.is_super_admin());

GRANT ALL ON public.test_requests, public.follow_ups, public.doctor_requests, public.emergency_requests TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- STEP 6: REALTIME
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'follow_ups') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'emergency_requests') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'doctor_requests') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_requests;
    END IF;
END $$;
