-- ════════════════════════════════════════════════════════════════════════════
-- 06_PRESCRIPTION_PDF.sql — official prescription PDF: generate, store, download, email.
-- Used by the prescription-pdf edge function (supabase/functions/prescription-pdf).
-- Run after 00–05. Safe to re-run.
--
--   get_prescription_document()     authorises the caller and returns the FINALISED record
--                                   (only doctor-saved data; nothing is invented)
--   storage bucket "prescriptions"  private; PDFs are only reachable through short signed URLs
--   prescription_events             audit trail: generated / downloaded / emailed
--   prescription_emails             email send log (also stops double auto-sends)
--   prepare_prescription_email()    consent + auto-send rules on top of get_prescription_document
--   hospital_ai_settings.rx_email_auto  hospital switch: email automatically after a consultation
--
-- Versioning: prescriptions already carry version / superseded_by / amends_prescription_id
-- (03_MEDICINE_DECISION_SUPPORT.sql). A PDF is stored per version and never overwritten, so an
-- issued document is never silently changed; a revision produces a new version and a new PDF.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.hospital_ai_settings ADD COLUMN IF NOT EXISTS rx_email_auto BOOLEAN NOT NULL DEFAULT false;

-- ─── private storage ────────────────────────────────────────────────────────
-- No storage policies are created on purpose: browsers can't list or read this bucket.
-- The edge function (service role) uploads and hands out signed URLs after authorising.
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ─── audit trail ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('pdf_generated', 'pdf_regenerated', 'pdf_downloaded', 'emailed', 'email_failed')),
    version INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prescription_events_rx ON public.prescription_events (prescription_id, created_at DESC);

ALTER TABLE public.prescription_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prescription_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.prescription_events FROM authenticated;
GRANT SELECT ON public.prescription_events TO authenticated;
DROP POLICY IF EXISTS "Read own hospital prescription events" ON public.prescription_events;
CREATE POLICY "Read own hospital prescription events" ON public.prescription_events FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() AND (public.is_hospital_staff() OR doctor_id = auth.uid()));

-- ─── email log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescription_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('auto', 'manual')),
    recipient_masked TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'not_configured')),
    provider TEXT,
    provider_message_id TEXT,
    error TEXT,
    sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_prescription_email_auto_sent
    ON public.prescription_emails (prescription_id) WHERE mode = 'auto' AND status = 'sent';
CREATE INDEX IF NOT EXISTS idx_prescription_emails_rx ON public.prescription_emails (prescription_id, created_at DESC);

ALTER TABLE public.prescription_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prescription_emails FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.prescription_emails FROM authenticated;
GRANT SELECT ON public.prescription_emails TO authenticated;
DROP POLICY IF EXISTS "Read own hospital prescription emails" ON public.prescription_emails;
CREATE POLICY "Read own hospital prescription emails" ON public.prescription_emails FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() AND (public.is_hospital_staff() OR doctor_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.mask_email(p_email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE WHEN p_email IS NULL OR position('@' IN p_email) < 2 THEN NULL
                ELSE LEFT(p_email, 1) || '***' || SUBSTRING(p_email FROM position('@' IN p_email)) END;
$$;

-- ─── the official document ──────────────────────────────────────────────────
-- Validates, as the caller, that:
--   appointment exists and belongs to the caller's hospital;
--   caller is the prescribing doctor, or hospital admin / staff of that hospital;
--   patient exists in the same hospital;
--   a finalised, current (non-superseded) prescription exists for this appointment.
-- Returns only saved data. Empty values are omitted (the PDF hides empty sections).
CREATE OR REPLACE FUNCTION public.get_prescription_document(p_appointment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hosp UUID := public.current_hospital_id();
    v_appt RECORD;
    v_rx RECORD;
    v_pt JSONB;
    v_h JSONB;
    v_items JSONB;
    v_tests JSONB;
    v_tr RECORD;
    v_consult JSONB;
    v_fu RECORD;
    v_issued TIMESTAMPTZ;
    v_fu_text TEXT;
BEGIN
    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id;
    IF v_appt.id IS NULL OR v_hosp IS NULL OR v_appt.hospital_id <> v_hosp
       OR NOT (v_appt.doctor_id = auth.uid() OR public.is_hospital_staff()) THEN
        RAISE EXCEPTION 'Not authorised for this appointment' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_rx FROM public.prescriptions
    WHERE appointment_id = v_appt.id AND hospital_id = v_hosp AND superseded_by IS NULL
    ORDER BY COALESCE(version, 1) DESC, created_at DESC LIMIT 1;
    IF v_rx.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_prescription');
    END IF;
    IF v_rx.status IS DISTINCT FROM 'final' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_finalized');
    END IF;
    v_issued := COALESCE(v_rx.finalized_at, v_rx.created_at);   -- rows saved before 03 have no finalized_at
    v_fu_text := NULLIF(TRIM(COALESCE(v_rx.follow_up, '')), '');
    IF LOWER(v_fu_text) = 'as needed' THEN v_fu_text := NULL; END IF;  -- old UI default, not a doctor instruction

    SELECT to_jsonb(p) INTO v_pt FROM public.patients p WHERE p.id = v_appt.patient_id AND p.hospital_id = v_hosp;
    IF v_pt IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_patient');
    END IF;
    SELECT to_jsonb(h) INTO v_h FROM public.hospitals h WHERE h.id = v_hosp;

    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'name', NULLIF(TRIM(i.medicine_name_snapshot), ''), 'generic', NULLIF(TRIM(i.generic_name_snapshot), ''),
        'strength', NULLIF(TRIM(i.strength_snapshot), ''), 'form', NULLIF(TRIM(i.dosage_form_snapshot), ''),
        'dosage', NULLIF(TRIM(i.dosage), ''), 'frequency', NULLIF(TRIM(i.frequency), ''), 'duration', NULLIF(TRIM(i.duration), ''),
        'route', NULLIF(TRIM(i.route), ''), 'instructions', NULLIF(TRIM(i.instructions), '')
    )) ORDER BY i.position), '[]'::jsonb)
    INTO v_items FROM public.prescription_items i WHERE i.prescription_id = v_rx.id;
    IF jsonb_array_length(v_items) = 0 THEN
        -- Older consultations saved medicines only as JSON on the prescription row.
        SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
            'name', NULLIF(TRIM(COALESCE(m->>'name', m->>'medicine_name')), ''),
            'dosage', NULLIF(TRIM(m->>'dosage'), ''), 'frequency', NULLIF(TRIM(m->>'frequency'), ''),
            'duration', NULLIF(TRIM(m->>'duration'), ''), 'route', NULLIF(TRIM(m->>'route'), ''),
            'instructions', NULLIF(TRIM(COALESCE(m->>'instructions', m->>'instruction')), '')
        ))), '[]'::jsonb)
        INTO v_items
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(COALESCE(v_rx.medicines, v_rx.medications)) = 'array'
                                       THEN COALESCE(v_rx.medicines, v_rx.medications) ELSE '[]'::jsonb END) m;
    END IF;

    -- Doctor-selected tests only (what was saved with the consultation).
    SELECT * INTO v_tr FROM public.test_requests WHERE appointment_id = v_appt.id AND hospital_id = v_hosp
    ORDER BY created_at DESC LIMIT 1;
    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(CASE
        WHEN jsonb_typeof(t) = 'string' THEN jsonb_build_object('name', t #>> '{}')
        ELSE jsonb_build_object('name', t->>'name', 'purpose', NULLIF(t->>'purpose', ''), 'notes', NULLIF(t->>'notes', ''))
    END)), '[]'::jsonb)
    INTO v_tests
    FROM jsonb_array_elements(CASE
        WHEN v_tr.id IS NOT NULL AND jsonb_typeof(v_tr.tests) = 'array' THEN v_tr.tests
        WHEN jsonb_typeof(v_rx.lab_tests) = 'array' THEN v_rx.lab_tests
        ELSE '[]'::jsonb END) t
    WHERE COALESCE(CASE WHEN jsonb_typeof(t) = 'string' THEN t #>> '{}' ELSE t->>'name' END, '') <> '';

    SELECT jsonb_strip_nulls(jsonb_build_object(
        'diagnosis', NULLIF(TRIM(c.diagnosis), ''), 'findings', NULLIF(TRIM(c.clinical_notes), ''),
        'symptoms', NULLIF(TRIM(c.symptoms), ''),
        'vitals', jsonb_strip_nulls(COALESCE(c.vitals, '{}'::jsonb) || jsonb_build_object(
            'bp', NULLIF(c.bp, ''), 'pulse', NULLIF(c.pulse, ''), 'temp', NULLIF(c.temp, ''),
            'spo2', NULLIF(c.spo2, ''), 'weight', NULLIF(c.weight, '')))
    )) INTO v_consult
    FROM public.consultations c WHERE c.appointment_id = v_appt.id AND c.hospital_id = v_hosp
    ORDER BY c.created_at DESC LIMIT 1;

    SELECT follow_up_date, reason, instructions INTO v_fu FROM public.follow_ups
    WHERE parent_appointment_id = v_appt.id AND hospital_id = v_hosp AND status <> 'cancelled'
    ORDER BY created_at DESC LIMIT 1;

    RETURN jsonb_build_object(
        'ok', true,
        'hospital_id', v_hosp,
        'appointment_id', v_appt.id,
        'patient_id', v_appt.patient_id,
        'doctor_id', v_appt.doctor_id,
        'prescription_id', v_rx.id,
        'version', COALESCE(v_rx.version, 1),
        'document', jsonb_strip_nulls(jsonb_build_object(
            'rx_number', 'RX-' || TO_CHAR(v_issued AT TIME ZONE 'Asia/Kolkata', 'YYYY') || '-' || UPPER(LEFT(REPLACE(v_rx.id::text, '-', ''), 6)),
            'version', COALESCE(v_rx.version, 1),
            'revised', COALESCE(v_rx.version, 1) > 1 OR v_rx.amends_prescription_id IS NOT NULL,
            'issued_at', v_issued,
            'hospital', jsonb_strip_nulls(jsonb_build_object(
                'name', v_h->>'name', 'address', NULLIF(v_h->>'address', ''), 'city', NULLIF(v_h->>'city', ''),
                'state', NULLIF(v_h->>'state', ''), 'pincode', NULLIF(v_h->>'pincode', ''), 'phone', NULLIF(v_h->>'phone', ''),
                'email', NULLIF(v_h->>'email', ''), 'website', NULLIF(v_h->>'website', ''), 'logo_url', NULLIF(v_h->>'logo_url', ''))),
            'doctor', (SELECT jsonb_strip_nulls(jsonb_build_object(
                'name', p.full_name, 'qualification', NULLIF(dd.qualification, ''),
                'specialization', NULLIF(COALESCE(dd.specialization, p.specialization), ''),
                'registration_number', NULLIF(COALESCE(dd.registration_number, p.registration_number), ''),
                'department', NULLIF(COALESCE(dep.name, p.department), '')))
                FROM public.profiles p
                LEFT JOIN public.doctor_details dd ON dd.id = p.id
                LEFT JOIN public.departments dep ON dep.id = p.department_id
                WHERE p.id = v_appt.doctor_id),
            'patient', jsonb_strip_nulls(jsonb_build_object(
                'name', v_pt->>'name', 'patient_number', NULLIF(v_pt->>'patient_number', ''),
                'age', COALESCE(NULLIF(v_pt->'age', 'null'::jsonb), to_jsonb(v_appt.patient_age)), 'gender', COALESCE(NULLIF(v_pt->>'gender', ''), v_appt.patient_gender),
                'phone', NULLIF(v_pt->>'phone', ''), 'address', NULLIF(v_pt->>'address', ''),
                'dob', NULLIF(v_pt->>'date_of_birth', ''), 'allergies', NULLIF(TRIM(v_pt->>'allergies'), ''),
                'known_diseases', NULLIF(TRIM(v_pt->>'known_diseases'), ''), 'medical_history', NULLIF(TRIM(v_pt->>'medical_history'), ''),
                'current_medicines', NULLIF(TRIM(v_pt->>'previous_medicine'), ''),
                'chief_complaint', NULLIF(TRIM(v_appt.symptoms), ''))),
            'consultation', v_consult,
            'tests', v_tests,
            'tests_note', NULLIF(TRIM(COALESCE(v_tr.instructions, '')), ''),
            'medicines', v_items,
            'advice', NULLIF(TRIM(v_rx.advice), ''),
            'follow_up', CASE
                WHEN v_fu.follow_up_date IS NOT NULL THEN jsonb_strip_nulls(jsonb_build_object(
                    'date', v_fu.follow_up_date, 'purpose', NULLIF(TRIM(v_fu.reason), ''), 'notes', NULLIF(TRIM(v_fu.instructions), '')))
                WHEN v_rx.follow_up_date IS NOT NULL OR v_fu_text ~ '^\d{4}-\d{2}-\d{2}$' THEN jsonb_strip_nulls(jsonb_build_object(
                    'date', COALESCE(v_rx.follow_up_date::text, v_fu_text),
                    'notes', CASE WHEN v_fu_text !~ '^\d{4}-\d{2}-\d{2}$' THEN v_fu_text END))
                WHEN v_fu_text IS NOT NULL THEN jsonb_build_object('notes', v_fu_text)
            END,
            'booking_token', (SELECT q.token FROM public.qr_codes q WHERE q.hospital_id = v_hosp AND q.status = 'active' AND q.is_active LIMIT 1)
        ))
    );
END;
$$;

-- Email rules on top of the document: recipient + consent + auto-send switch + limits.
CREATE OR REPLACE FUNCTION public.prepare_prescription_email(
    p_appointment_id UUID,
    p_email TEXT DEFAULT NULL,
    p_record_consent BOOLEAN DEFAULT false,
    p_mode TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doc JSONB;
    v_pt RECORD;
    v_email TEXT := NULLIF(LOWER(TRIM(COALESCE(p_email, ''))), '');
    v_recipient TEXT;
BEGIN
    IF p_mode NOT IN ('auto', 'manual') THEN
        RETURN jsonb_build_object('send', false, 'reason', 'invalid_mode');
    END IF;
    v_doc := public.get_prescription_document(p_appointment_id);   -- raises if not authorised
    IF NOT (v_doc->>'ok')::boolean THEN
        RETURN jsonb_build_object('send', false, 'reason', v_doc->>'reason');
    END IF;

    SELECT * INTO v_pt FROM public.patients WHERE id = (v_doc->>'patient_id')::uuid;

    IF v_email IS NOT NULL THEN
        IF LENGTH(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
            RETURN jsonb_build_object('send', false, 'reason', 'invalid_email');
        END IF;
        IF p_record_consent THEN
            UPDATE public.patients SET email = v_email, email_opt_in = true, communication_opt_out = false,
                consent_updated_at = NOW(), updated_at = NOW()
            WHERE id = v_pt.id
            RETURNING * INTO v_pt;
        END IF;
    END IF;

    v_recipient := COALESCE(CASE WHEN p_record_consent THEN v_email END, v_pt.email);
    IF v_recipient IS NULL THEN
        RETURN jsonb_build_object('send', false, 'reason', 'no_email');
    END IF;
    IF v_pt.communication_opt_out OR v_pt.email_opt_in IS DISTINCT FROM true THEN
        RETURN jsonb_build_object('send', false, 'reason', 'no_consent', 'recipient_masked', public.mask_email(v_recipient));
    END IF;

    IF p_mode = 'auto' THEN
        IF NOT COALESCE((SELECT rx_email_auto FROM public.hospital_ai_settings WHERE hospital_id = (v_doc->>'hospital_id')::uuid), false) THEN
            RETURN jsonb_build_object('send', false, 'reason', 'auto_off');
        END IF;
        IF EXISTS (SELECT 1 FROM public.prescription_emails WHERE prescription_id = (v_doc->>'prescription_id')::uuid AND mode = 'auto' AND status = 'sent') THEN
            RETURN jsonb_build_object('send', false, 'reason', 'already_sent', 'recipient_masked', public.mask_email(v_recipient));
        END IF;
    ELSIF (SELECT COUNT(*) FROM public.prescription_emails
           WHERE prescription_id = (v_doc->>'prescription_id')::uuid AND created_at > NOW() - INTERVAL '1 day') >= 5 THEN
        RETURN jsonb_build_object('send', false, 'reason', 'too_many');
    END IF;

    RETURN v_doc || jsonb_build_object('send', true, 'recipient', v_recipient, 'recipient_masked', public.mask_email(v_recipient));
END;
$$;

-- Service-role writers (the edge function), after it has authorised the caller.
CREATE OR REPLACE FUNCTION public.log_prescription_event(
    p_hospital_id UUID, p_prescription_id UUID, p_appointment_id UUID, p_patient_id UUID, p_doctor_id UUID,
    p_user_id UUID, p_action TEXT, p_version INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.prescription_events (hospital_id, prescription_id, appointment_id, patient_id, doctor_id, user_id, action, version)
    VALUES (p_hospital_id, p_prescription_id, p_appointment_id, p_patient_id, p_doctor_id, p_user_id, p_action, p_version);
$$;

CREATE OR REPLACE FUNCTION public.record_prescription_email(
    p_hospital_id UUID, p_prescription_id UUID, p_appointment_id UUID, p_patient_id UUID, p_doctor_id UUID,
    p_mode TEXT, p_recipient_masked TEXT, p_status TEXT, p_provider TEXT, p_message_id TEXT, p_error TEXT, p_sent_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.prescription_emails (
        hospital_id, prescription_id, appointment_id, patient_id, doctor_id, mode, recipient_masked,
        status, provider, provider_message_id, error, sent_by
    ) VALUES (
        p_hospital_id, p_prescription_id, p_appointment_id, p_patient_id, p_doctor_id, p_mode, LEFT(p_recipient_masked, 120),
        p_status, LEFT(p_provider, 40), LEFT(p_message_id, 200), LEFT(p_error, 500), p_sent_by
    );
    RETURN true;
EXCEPTION WHEN unique_violation THEN
    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.get_prescription_document(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_prescription_document(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.prepare_prescription_email(UUID, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_prescription_email(UUID, TEXT, BOOLEAN, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.log_prescription_event(UUID, UUID, UUID, UUID, UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_prescription_event(UUID, UUID, UUID, UUID, UUID, UUID, TEXT, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.record_prescription_email(UUID, UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_prescription_email(UUID, UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mask_email(TEXT) TO authenticated, service_role;

-- ==============================================================================
-- END OF 06_PRESCRIPTION_PDF.sql
-- ==============================================================================
