-- ════════════════════════════════════════════════════════════════════════════
-- 05_AI_LAYER.sql — MedTechFixaters AI feature layer (run after 00–04).
--
-- Built-in AI (no external model, no API key):
--   • public_ai_knowledge        approved public answers for the website assistant
--   • get_booking_availability   real doctor availability for conversational booking
--   • set_patient_communication_prefs  consent captured after a booking
--   • follow-up automation       notification_outbox + enqueue/claim/complete RPCs
--   • get_crm_overview           tenant-scoped CRM data for the CRM dashboard
-- Gemini clinical AI (doctor only, via the ai-assist edge function):
--   • get_clinical_ai_context    minimum patient context for one of the doctor's own visits
--   • ai_requests                audit log (no prompts or outputs stored)
-- Settings:
--   • platform_settings['ai_features'] platform switches (super admin)
--   • hospital_ai_settings              hospital switches + follow-up settings (hospital admin)
--
-- Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- The earlier Gemini "clinic insights" cache is replaced by the built-in CRM.
DROP TABLE IF EXISTS public.ai_insights;

-- ─── 1. FEATURE FLAGS ───────────────────────────────────────────────────────

INSERT INTO public.platform_settings (key, value) VALUES ('ai_features', jsonb_build_object(
    'ai_booking_enabled', true,
    'public_ai_chat_enabled', true,
    'auto_followup_enabled', true,
    'crm_ai_enabled', true,
    'clinical_ai_enabled', true,
    'medicine_suggestions_enabled', true,
    'test_suggestions_enabled', true,
    'doctor_advice_enabled', true
)) ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.hospital_ai_settings (
    hospital_id UUID PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
    -- Hospital-level switches. A hospital can turn a feature off; it cannot turn on
    -- something the platform has switched off.
    flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    followup_days_before INTEGER NOT NULL DEFAULT 1 CHECK (followup_days_before BETWEEN 0 AND 14),
    followup_overdue_days INTEGER NOT NULL DEFAULT 2 CHECK (followup_overdue_days BETWEEN 1 AND 30),
    followup_whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
    followup_email_enabled BOOLEAN NOT NULL DEFAULT true,
    followup_template TEXT CHECK (followup_template IS NULL OR LENGTH(followup_template) <= 1000),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hospital_ai_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hospital_ai_settings FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.hospital_ai_settings TO authenticated;

DROP POLICY IF EXISTS "Hospital users read AI settings" ON public.hospital_ai_settings;
CREATE POLICY "Hospital users read AI settings" ON public.hospital_ai_settings FOR SELECT TO authenticated
    USING (hospital_id = public.current_hospital_id() OR public.is_super_admin());
DROP POLICY IF EXISTS "Hospital admins insert AI settings" ON public.hospital_ai_settings;
CREATE POLICY "Hospital admins insert AI settings" ON public.hospital_ai_settings FOR INSERT TO authenticated
    WITH CHECK ((hospital_id = public.current_hospital_id() AND public.is_hospital_admin()) OR public.is_super_admin());
DROP POLICY IF EXISTS "Hospital admins update AI settings" ON public.hospital_ai_settings;
CREATE POLICY "Hospital admins update AI settings" ON public.hospital_ai_settings FOR UPDATE TO authenticated
    USING ((hospital_id = public.current_hospital_id() AND public.is_hospital_admin()) OR public.is_super_admin())
    WITH CHECK ((hospital_id = public.current_hospital_id() AND public.is_hospital_admin()) OR public.is_super_admin());

-- Keep only known boolean flags, strip markup from the template, stamp the editor.
CREATE OR REPLACE FUNCTION public.clean_hospital_ai_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_key TEXT;
    v_clean JSONB := '{}'::jsonb;
BEGIN
    FOR v_key IN SELECT jsonb_object_keys(COALESCE(NEW.flags, '{}'::jsonb)) LOOP
        IF v_key IN ('ai_booking_enabled', 'public_ai_chat_enabled', 'auto_followup_enabled', 'crm_ai_enabled',
                     'clinical_ai_enabled', 'medicine_suggestions_enabled', 'test_suggestions_enabled', 'doctor_advice_enabled')
           AND jsonb_typeof(NEW.flags->v_key) = 'boolean' THEN
            v_clean := v_clean || jsonb_build_object(v_key, NEW.flags->v_key);
        END IF;
    END LOOP;
    NEW.flags := v_clean;
    IF NEW.followup_template IS NOT NULL THEN
        NEW.followup_template := NULLIF(TRIM(regexp_replace(NEW.followup_template, '<[^>]*>', '', 'g')), '');
    END IF;
    NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clean_hospital_ai_settings ON public.hospital_ai_settings;
CREATE TRIGGER trg_clean_hospital_ai_settings BEFORE INSERT OR UPDATE ON public.hospital_ai_settings
    FOR EACH ROW EXECUTE FUNCTION public.clean_hospital_ai_settings();

-- Effective switches for a hospital: platform AND hospital. Flags are not secret, so the
-- public booking page and website assistant may read them too.
CREATE OR REPLACE FUNCTION public.get_ai_feature_flags(p_hospital_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_platform JSONB;
    v_hospital JSONB := '{}'::jsonb;
    v_hosp UUID := COALESCE(p_hospital_id, public.current_hospital_id());
    v_out JSONB := '{}'::jsonb;
    v_key TEXT;
BEGIN
    SELECT value INTO v_platform FROM public.platform_settings WHERE key = 'ai_features';
    v_platform := COALESCE(v_platform, '{}'::jsonb);
    IF v_hosp IS NOT NULL THEN
        SELECT flags INTO v_hospital FROM public.hospital_ai_settings WHERE hospital_id = v_hosp;
        v_hospital := COALESCE(v_hospital, '{}'::jsonb);
    END IF;
    FOREACH v_key IN ARRAY ARRAY['ai_booking_enabled', 'public_ai_chat_enabled', 'auto_followup_enabled', 'crm_ai_enabled',
                                 'clinical_ai_enabled', 'medicine_suggestions_enabled', 'test_suggestions_enabled', 'doctor_advice_enabled'] LOOP
        v_out := v_out || jsonb_build_object(v_key,
            COALESCE((v_platform->>v_key)::boolean, false) AND COALESCE((v_hospital->>v_key)::boolean, true));
    END LOOP;
    RETURN v_out;
END;
$$;

-- ─── 2. PUBLIC KNOWLEDGE BASE (website assistant) ───────────────────────────

CREATE TABLE IF NOT EXISTS public.public_ai_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_type TEXT NOT NULL DEFAULT 'platform' CHECK (tenant_type IN ('platform', 'hospital')),
    tenant_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL DEFAULT 'faq' CHECK (source_type IN ('faq', 'page', 'service', 'contact', 'hours', 'pricing', 'doctor', 'clinic')),
    title TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 3 AND 200),
    content TEXT NOT NULL CHECK (LENGTH(content) BETWEEN 3 AND 2000),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT public_ai_knowledge_tenant CHECK ((tenant_type = 'platform') = (tenant_id IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_public_ai_knowledge_published
    ON public.public_ai_knowledge (tenant_type, tenant_id) WHERE is_public AND status = 'published';

ALTER TABLE public.public_ai_knowledge ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.public_ai_knowledge FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_ai_knowledge TO authenticated;

-- Visitors never read this table directly: the public-assistant edge function reads only
-- published rows. Super admins manage platform answers; hospital admins their own.
DROP POLICY IF EXISTS "Manage public AI knowledge" ON public.public_ai_knowledge;
CREATE POLICY "Manage public AI knowledge" ON public.public_ai_knowledge FOR ALL TO authenticated
    USING (public.is_super_admin() OR (tenant_type = 'hospital' AND tenant_id = public.current_hospital_id() AND public.is_hospital_admin()))
    WITH CHECK (public.is_super_admin() OR (tenant_type = 'hospital' AND tenant_id = public.current_hospital_id() AND public.is_hospital_admin()));

CREATE OR REPLACE FUNCTION public.clean_public_ai_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.title := TRIM(regexp_replace(NEW.title, '<[^>]*>', '', 'g'));
    NEW.content := TRIM(regexp_replace(NEW.content, '<[^>]*>', '', 'g'));
    NEW.keywords := ARRAY(SELECT DISTINCT LOWER(TRIM(k)) FROM unnest(COALESCE(NEW.keywords, '{}')) k WHERE LENGTH(TRIM(k)) BETWEEN 2 AND 40);
    IF TG_OP = 'INSERT' THEN NEW.created_by := COALESCE(auth.uid(), NEW.created_by); END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clean_public_ai_knowledge ON public.public_ai_knowledge;
CREATE TRIGGER trg_clean_public_ai_knowledge BEFORE INSERT OR UPDATE ON public.public_ai_knowledge
    FOR EACH ROW EXECUTE FUNCTION public.clean_public_ai_knowledge();

-- Ranked search over PUBLISHED, PUBLIC rows only. Service role only (edge function).
CREATE OR REPLACE FUNCTION public.search_public_knowledge(p_query TEXT, p_hospital_id UUID DEFAULT NULL, p_limit INTEGER DEFAULT 3)
RETURNS TABLE (id UUID, title TEXT, content TEXT, source_type TEXT, score REAL)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    WITH q AS (
        SELECT LEFT(COALESCE(p_query, ''), 500) AS raw,
               websearch_to_tsquery('english', LEFT(COALESCE(p_query, ''), 500)) AS ts
    )
    SELECT k.id, k.title, k.content, k.source_type,
           (ts_rank(to_tsvector('english', k.title || ' ' || k.content || ' ' || array_to_string(k.keywords, ' ')), q.ts)
            + 0.3 * (SELECT COUNT(*) FROM unnest(k.keywords) kw WHERE q.raw ILIKE '%' || kw || '%'))::REAL AS score
    FROM public.public_ai_knowledge k, q
    WHERE k.is_public AND k.status = 'published'
      AND (k.tenant_type = 'platform' OR (p_hospital_id IS NOT NULL AND k.tenant_id = p_hospital_id))
      AND (to_tsvector('english', k.title || ' ' || k.content || ' ' || array_to_string(k.keywords, ' ')) @@ q.ts
           OR EXISTS (SELECT 1 FROM unnest(k.keywords) kw WHERE q.raw ILIKE '%' || kw || '%'))
    ORDER BY score DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 3), 1), 5);
$$;

-- Approved platform answers. Only claims the product can back today.
INSERT INTO public.public_ai_knowledge (tenant_type, source_type, title, content, keywords, is_public, status)
SELECT 'platform', v.source_type, v.title, v.content, v.keywords, true, 'published'
FROM (VALUES
    ('page', 'What is MedTechFixaters?',
     'MedTechFixaters is healthcare software that connects hospitals, clinics, doctors and patients. It covers QR appointment booking, a live OPD queue, digital prescriptions, patient history, follow-ups and hospital administration in one system.',
     ARRAY['what is', 'medtechfixaters', 'medtech', 'about', 'platform', 'software']),
    ('faq', 'Can individual doctors use it?',
     'Yes. Individual doctors and small clinics can use MedTechFixaters for appointments, patient records, the live queue, prescriptions and follow-ups, without needing a hospital setup.',
     ARRAY['individual', 'solo', 'single doctor', 'own clinic', 'small clinic']),
    ('faq', 'How does QR booking work?',
     'Each clinic or hospital gets its own QR code and booking link. Patients scan it with their phone camera, choose a doctor, enter their details and get an OPD token straight away. No app download is needed.',
     ARRAY['qr', 'scan', 'booking', 'book', 'appointment', 'token']),
    ('faq', 'How does the live queue work?',
     'Every doctor has their own live queue. Patients follow their token and position on their phone, and a waiting-area TV can show who is being seen now and who is next.',
     ARRAY['queue', 'token', 'wait', 'waiting', 'display', 'tv']),
    ('faq', 'What can doctors do in the doctor workspace?',
     'Doctors see their live queue, the patient''s visit history, allergies and past prescriptions, write digital prescriptions from their own medicine library, and schedule follow-ups.',
     ARRAY['doctor', 'workspace', 'prescription', 'consultation', 'rx']),
    ('faq', 'Is each hospital''s data kept separate?',
     'Yes. Each hospital works in its own protected workspace. Row-level security in the database keeps one hospital''s patients, doctors and records away from every other hospital, and staff only see what their role allows.',
     ARRAY['data', 'separate', 'security', 'privacy', 'isolation', 'secure', 'safe']),
    ('faq', 'Does MedTechFixaters use AI?',
     'Yes. Booking, the website assistant, follow-up reminders and the CRM use MedTechFixaters built-in automation. Doctors can also ask a Gemini-powered clinical assistant for medicine, test and advice suggestions; the doctor always reviews and decides.',
     ARRAY['ai', 'artificial intelligence', 'gemini', 'automation', 'smart']),
    ('faq', 'Are follow-up reminders sent automatically?',
     'Follow-ups get their own token and are tracked as due, upcoming, overdue or completed. Email reminders can be sent automatically when a clinic enables them and the patient has agreed. WhatsApp reminders are coming soon.',
     ARRAY['follow-up', 'followup', 'follow up', 'reminder', 'whatsapp', 'email', 'recall']),
    ('pricing', 'How much does it cost?',
     'Plans start with Clinic Starter for solo and duo doctors, Hospital Pro for polyclinics and nursing homes, and Enterprise Mesh for larger hospitals. See the pricing page for current prices, or book a free demo.',
     ARRAY['price', 'pricing', 'cost', 'plan', 'plans', 'subscription', 'fee', 'charges']),
    ('faq', 'Do you give a free website?',
     'Yes. Clinics on a yearly plan get a free custom website with their doctors, departments and online booking.',
     ARRAY['website', 'online presence', 'free website']),
    ('contact', 'How do I contact MedTechFixaters?',
     'You can call or WhatsApp +91 95878 67559, email contact@medtechfixaters.in, or book a free demo from the Book a Demo page.',
     ARRAY['contact', 'phone', 'email', 'call', 'support', 'sales', 'reach']),
    ('faq', 'How do I book a demo?',
     'Open the Book a Demo page and share your name, clinic and phone number. The team will set up a short video walkthrough with your own doctors and departments.',
     ARRAY['demo', 'trial', 'walkthrough', 'try'])
) AS v(source_type, title, content, keywords)
WHERE NOT EXISTS (SELECT 1 FROM public.public_ai_knowledge k WHERE k.tenant_type = 'platform' AND k.title = v.title);

-- ─── 3. AI AUDIT LOG ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    feature TEXT NOT NULL,
    provider TEXT NOT NULL,           -- 'builtin' or 'gemini'
    model TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'blocked', 'rate_limited', 'disabled', 'invalid_output', 'not_configured')),
    latency_ms INTEGER,
    error_code TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,  -- counts only; never prompts, outputs or patient text
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_hospital_time ON public.ai_requests (hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_requests_time ON public.ai_requests (created_at DESC);

ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_requests FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.ai_requests FROM authenticated;
GRANT SELECT ON public.ai_requests TO authenticated;

DROP POLICY IF EXISTS "Read AI usage" ON public.ai_requests;
CREATE POLICY "Read AI usage" ON public.ai_requests FOR SELECT TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (hospital_id = public.current_hospital_id() AND public.is_hospital_admin())
    );

-- ─── 4. BOOKING AVAILABILITY (conversational booking) ──────────────────────

-- Real availability for one date: working day, leave, working hours and remaining capacity.
-- Nothing is invented: every value comes from doctor_details / doctor_working_hours /
-- doctor_availability / appointments.
CREATE OR REPLACE FUNCTION public.get_booking_availability(p_token TEXT, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean TEXT := TRIM(COALESCE(p_token, ''));
    v_hospital_id UUID;
    v_day TEXT;
    v_doctors JSONB;
BEGIN
    IF v_clean LIKE 'tok\_%' THEN v_clean := SUBSTRING(v_clean FROM 5); END IF;
    IF v_clean = '' OR LENGTH(v_clean) > 64 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid booking code.');
    END IF;
    IF p_date IS NULL OR p_date < CURRENT_DATE OR p_date > CURRENT_DATE + 90 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Please choose a date between today and the next 90 days.');
    END IF;
    IF NOT public.check_rate_limit('availability:' || public.request_ip(), 120, 3600) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many requests. Please try again shortly.');
    END IF;

    SELECT q.hospital_id INTO v_hospital_id
    FROM public.qr_codes q JOIN public.hospitals h ON h.id = q.hospital_id
    WHERE (q.token = v_clean OR q.booking_url = '/book/' || v_clean OR q.hospital_id = public.try_uuid(v_clean))
      AND (q.status = 'active' OR q.is_active = true) AND h.status = 'active'
    LIMIT 1;
    IF v_hospital_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'This booking link is not active.');
    END IF;

    v_day := TO_CHAR(p_date, 'Dy');  -- Mon, Tue, …

    SELECT COALESCE(jsonb_agg(d ORDER BY (d->>'available')::boolean DESC, d->>'name'), '[]'::jsonb) INTO v_doctors
    FROM (
        SELECT jsonb_build_object(
            'doctor_id', p.id,
            'name', p.full_name,
            'specialization', COALESCE(p.specialization, dd.specialization, 'Consultant'),
            'department', COALESCE(dep.name, p.department, dd.specialization, 'OPD'),
            'department_id', p.department_id,
            'fee', COALESCE(dd.consultation_fee, 500),
            'hours', CASE
                WHEN wh.doctor_id IS NOT NULL THEN
                    CONCAT_WS(', ',
                        CASE WHEN wh.morning_start IS NOT NULL AND wh.morning_end IS NOT NULL
                             THEN TO_CHAR(wh.morning_start, 'HH12:MI AM') || ' – ' || TO_CHAR(wh.morning_end, 'HH12:MI AM') END,
                        CASE WHEN wh.evening_start IS NOT NULL AND wh.evening_end IS NOT NULL
                             THEN TO_CHAR(wh.evening_start, 'HH12:MI AM') || ' – ' || TO_CHAR(wh.evening_end, 'HH12:MI AM') END)
                ELSE COALESCE(dd.available_hours->>'start', '09:00 AM') || ' – ' || COALESCE(dd.available_hours->>'end', '05:00 PM')
            END,
            'first_time', CASE
                WHEN wh.doctor_id IS NOT NULL THEN TO_CHAR(COALESCE(wh.morning_start, wh.evening_start), 'HH12:MI AM')
                ELSE COALESCE(dd.available_hours->>'start', '09:00 AM')
            END,
            'daily_limit', COALESCE(dd.daily_patient_limit, 30),
            'booked', booked.n,
            'remaining', GREATEST(COALESCE(dd.daily_patient_limit, 30) - booked.n, 0),
            'available', (
                COALESCE(dd.available_days, '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb) ? v_day
                AND leave.status IS NULL
                AND booked.n < COALESCE(dd.daily_patient_limit, 30)
            ),
            'reason', CASE
                WHEN NOT (COALESCE(dd.available_days, '["Mon","Tue","Wed","Thu","Fri","Sat"]'::jsonb) ? v_day) THEN 'not_working_day'
                WHEN leave.status IS NOT NULL THEN 'on_leave'
                WHEN booked.n >= COALESCE(dd.daily_patient_limit, 30) THEN 'fully_booked'
                ELSE NULL
            END
        ) AS d
        FROM public.profiles p
        LEFT JOIN public.doctor_details dd ON dd.id = p.id
        LEFT JOIN public.departments dep ON dep.id = p.department_id
        LEFT JOIN public.doctor_working_hours wh ON wh.doctor_id = p.id
        LEFT JOIN LATERAL (
            SELECT a.status FROM public.doctor_availability a WHERE a.doctor_id = p.id AND a.date = p_date LIMIT 1
        ) leave ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS n FROM public.appointments ap
            WHERE ap.doctor_id = p.id AND ap.appointment_date = p_date AND ap.status NOT IN ('Cancelled', 'No Show')
        ) booked ON true
        WHERE p.hospital_id = v_hospital_id
          AND p.role = 'doctor'
          AND p.is_active = true
          AND COALESCE(p.account_status, 'active') = 'active'
          AND (p.client_type IS DISTINCT FROM 'individual_doctor' OR COALESCE(p.onboarding_status, 'ACTIVE') = 'ACTIVE')
    ) s;

    RETURN jsonb_build_object('success', true, 'date', p_date, 'weekday', v_day, 'doctors', v_doctors);
END;
$$;

-- ─── 5. PATIENT COMMUNICATION CONSENT ──────────────────────────────────────

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN;  -- NULL = not asked
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN;     -- NULL = not asked
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS communication_opt_out BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS consent_updated_at TIMESTAMPTZ;

-- Called by the booking page right after a booking. The unguessable tracking token of that
-- appointment is the proof that the caller is the person who just booked.
CREATE OR REPLACE FUNCTION public.set_patient_communication_prefs(
    p_tracking_token TEXT,
    p_email TEXT DEFAULT NULL,
    p_whatsapp_opt_in BOOLEAN DEFAULT NULL,
    p_email_opt_in BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_patient_id UUID;
    v_email TEXT := NULLIF(LOWER(TRIM(COALESCE(p_email, ''))), '');
BEGIN
    IF NOT public.check_rate_limit('comm_prefs:' || public.request_ip(), 30, 3600) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many requests.');
    END IF;
    IF p_tracking_token IS NULL OR p_tracking_token NOT LIKE 'TRK-%' OR LENGTH(p_tracking_token) > 64 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid booking reference.');
    END IF;
    IF v_email IS NOT NULL AND (LENGTH(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Please enter a valid email address.');
    END IF;

    SELECT patient_id INTO v_patient_id FROM public.appointments
    WHERE tracking_token = p_tracking_token AND created_at > NOW() - INTERVAL '2 days';
    IF v_patient_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking not found.');
    END IF;

    UPDATE public.patients SET
        email = COALESCE(v_email, email),
        whatsapp_opt_in = COALESCE(p_whatsapp_opt_in, whatsapp_opt_in),
        email_opt_in = COALESCE(p_email_opt_in, email_opt_in),
        communication_opt_out = CASE WHEN p_whatsapp_opt_in IS FALSE AND p_email_opt_in IS FALSE THEN true
                                     WHEN p_whatsapp_opt_in OR p_email_opt_in THEN false
                                     ELSE communication_opt_out END,
        consent_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = v_patient_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── 6. FOLLOW-UP AUTOMATION ────────────────────────────────────────────────

ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS email_status TEXT;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMPTZ;
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    follow_up_id UUID NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('followup_upcoming', 'followup_due', 'followup_overdue')),
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'not_configured')),
    skip_reason TEXT,
    provider TEXT,
    provider_message_id TEXT,
    last_error TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    -- Idempotency: one message per follow-up, channel, kind and day, ever.
    CONSTRAINT notification_outbox_once UNIQUE (follow_up_id, channel, notification_type, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_outbox_due ON public.notification_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_outbox_hospital ON public.notification_outbox (hospital_id, created_at DESC);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_outbox FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.notification_outbox FROM authenticated;
GRANT SELECT ON public.notification_outbox TO authenticated;

DROP POLICY IF EXISTS "Read own hospital outbox" ON public.notification_outbox;
CREATE POLICY "Read own hospital outbox" ON public.notification_outbox FOR SELECT TO authenticated
    USING (
        hospital_id = public.current_hospital_id()
        AND (public.is_hospital_staff() OR doctor_id = auth.uid())
    );

-- Marks due/overdue follow-ups and queues reminders. Called by the followup-dispatcher
-- edge function (service role) on a schedule. Returns how many messages were queued.
CREATE OR REPLACE FUNCTION public.enqueue_followup_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_platform_on BOOLEAN;
    v_count INTEGER := 0;
    v_rows INTEGER;
BEGIN
    SELECT COALESCE((value->>'auto_followup_enabled')::boolean, false) INTO v_platform_on
    FROM public.platform_settings WHERE key = 'ai_features';

    -- Keep statuses current (completed/cancelled are never touched).
    UPDATE public.follow_ups SET status = 'due_today', updated_at = NOW()
    WHERE status = 'scheduled' AND follow_up_date = CURRENT_DATE;
    UPDATE public.follow_ups SET status = 'overdue', updated_at = NOW()
    WHERE status IN ('scheduled', 'due_today') AND follow_up_date < CURRENT_DATE;

    IF NOT COALESCE(v_platform_on, false) THEN
        RETURN 0;
    END IF;

    WITH candidates AS (
        SELECT f.id AS follow_up_id, f.hospital_id, f.doctor_id, f.parent_appointment_id,
               COALESCE(f.patient_id, a.patient_id) AS patient_id, f.follow_up_date,
               CASE
                   WHEN f.follow_up_date = CURRENT_DATE THEN 'followup_due'
                   WHEN COALESCE(s.followup_days_before, 1) > 0
                        AND f.follow_up_date = CURRENT_DATE + COALESCE(s.followup_days_before, 1) THEN 'followup_upcoming'
                   WHEN f.follow_up_date = CURRENT_DATE - COALESCE(s.followup_overdue_days, 2) THEN 'followup_overdue'
               END AS notification_type,
               COALESCE(s.followup_whatsapp_enabled, true) AS wa_on,
               COALESCE(s.followup_email_enabled, true) AS email_on,
               a.status AS parent_status,
               pt.communication_opt_out, pt.whatsapp_opt_in, pt.email_opt_in, pt.email, pt.phone
        FROM public.follow_ups f
        JOIN public.hospitals h ON h.id = f.hospital_id AND h.status = 'active'
        LEFT JOIN public.appointments a ON a.id = f.parent_appointment_id
        LEFT JOIN public.hospital_ai_settings s ON s.hospital_id = f.hospital_id
        LEFT JOIN public.patients pt ON pt.id = COALESCE(f.patient_id, a.patient_id)
        WHERE f.status NOT IN ('completed', 'cancelled')
          AND COALESCE((s.flags->>'auto_followup_enabled')::boolean, true)
    ),
    typed AS (
        SELECT * FROM candidates WHERE notification_type IS NOT NULL
    ),
    per_channel AS (
        SELECT t.*, c.channel,
            CASE
                WHEN t.patient_id IS NULL THEN 'no_patient'
                WHEN t.parent_status = 'Cancelled' THEN 'appointment_cancelled'
                WHEN t.communication_opt_out THEN 'opted_out'
                WHEN c.channel = 'whatsapp' AND NOT t.wa_on THEN 'channel_disabled'
                WHEN c.channel = 'email' AND NOT t.email_on THEN 'channel_disabled'
                WHEN c.channel = 'whatsapp' AND t.whatsapp_opt_in IS DISTINCT FROM true THEN 'no_consent'
                WHEN c.channel = 'email' AND t.email_opt_in IS DISTINCT FROM true THEN 'no_consent'
                WHEN c.channel = 'email' AND COALESCE(t.email, '') = '' THEN 'no_email'
                WHEN c.channel = 'whatsapp' AND COALESCE(t.phone, '') = '' THEN 'no_phone'
            END AS skip_reason
        FROM typed t CROSS JOIN (VALUES ('whatsapp'), ('email')) AS c(channel)
    )
    INSERT INTO public.notification_outbox (
        hospital_id, follow_up_id, appointment_id, patient_id, doctor_id, channel, notification_type,
        scheduled_date, status, skip_reason
    )
    SELECT hospital_id, follow_up_id, parent_appointment_id, patient_id, doctor_id, channel, notification_type,
           CURRENT_DATE, CASE WHEN skip_reason IS NULL THEN 'pending' ELSE 'skipped' END, skip_reason
    FROM per_channel
    ON CONFLICT ON CONSTRAINT notification_outbox_once DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_count := v_count + v_rows;
    RETURN v_count;
END;
$$;

-- Hands the dispatcher a batch of messages to send, locking them so two dispatcher runs
-- can never send the same message. Stuck 'sending' rows are retried after 15 minutes.
CREATE OR REPLACE FUNCTION public.claim_notification_batch(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID, channel TEXT, notification_type TEXT, attempts INTEGER,
    patient_name TEXT, patient_phone TEXT, patient_email TEXT,
    clinic_name TEXT, doctor_name TEXT, follow_up_date DATE, follow_up_token TEXT,
    booking_token TEXT, template TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH picked AS (
        SELECT o.id FROM public.notification_outbox o
        WHERE (o.status IN ('pending', 'failed') AND o.next_attempt_at <= NOW() AND o.attempts < 3)
           OR (o.status = 'sending' AND o.updated_at < NOW() - INTERVAL '15 minutes' AND o.attempts < 3)
        ORDER BY o.next_attempt_at
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
        FOR UPDATE SKIP LOCKED
    ),
    claimed AS (
        UPDATE public.notification_outbox o
        SET status = 'sending', attempts = o.attempts + 1, updated_at = NOW()
        FROM picked WHERE o.id = picked.id
        RETURNING o.*
    )
    SELECT c.id, c.channel, c.notification_type, c.attempts,
           pt.name, pt.phone, pt.email,
           h.name, dr.full_name, f.follow_up_date, f.follow_up_token,
           (SELECT q.token FROM public.qr_codes q WHERE q.hospital_id = c.hospital_id AND (q.status = 'active' OR q.is_active) LIMIT 1),
           s.followup_template
    FROM claimed c
    JOIN public.follow_ups f ON f.id = c.follow_up_id
    JOIN public.hospitals h ON h.id = c.hospital_id
    LEFT JOIN public.patients pt ON pt.id = c.patient_id
    LEFT JOIN public.profiles dr ON dr.id = c.doctor_id
    LEFT JOIN public.hospital_ai_settings s ON s.hospital_id = c.hospital_id;
END;
$$;

-- Records the result of one send attempt. Failures back off (10 min, then 1 hour) and stop
-- after 3 attempts; "not_configured" is final (no provider set up — never faked as sent).
CREATE OR REPLACE FUNCTION public.complete_notification(
    p_id UUID, p_status TEXT, p_provider TEXT DEFAULT NULL, p_message_id TEXT DEFAULT NULL, p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.notification_outbox;
BEGIN
    IF p_status NOT IN ('sent', 'failed', 'not_configured', 'skipped') THEN
        RAISE EXCEPTION 'invalid status %', p_status;
    END IF;

    UPDATE public.notification_outbox SET
        status = p_status,
        provider = LEFT(p_provider, 40),
        provider_message_id = LEFT(p_message_id, 200),
        last_error = LEFT(p_error, 500),
        sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
        next_attempt_at = CASE WHEN p_status = 'failed'
                               THEN NOW() + (CASE WHEN attempts <= 1 THEN INTERVAL '10 minutes' ELSE INTERVAL '1 hour' END)
                               ELSE next_attempt_at END,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN RETURN; END IF;

    UPDATE public.follow_ups SET
        whatsapp_status = CASE WHEN v_row.channel = 'whatsapp' THEN p_status ELSE whatsapp_status END,
        email_status = CASE WHEN v_row.channel = 'email' THEN p_status ELSE email_status END,
        last_notification_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE last_notification_at END,
        updated_at = NOW()
    WHERE id = v_row.follow_up_id;
END;
$$;

-- ─── 7. CRM OVERVIEW ────────────────────────────────────────────────────────

-- Everything the CRM dashboard shows, from real rows, scoped to the caller's hospital.
-- Doctors only ever see their own patients; admins and staff can filter by doctor.
CREATE OR REPLACE FUNCTION public.get_crm_overview(
    p_doctor_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hosp UUID := public.current_hospital_id();
    v_role TEXT;
    v_doctor UUID;
    v_search TEXT := NULLIF(LOWER(TRIM(COALESCE(p_search, ''))), '');
    v_result JSONB;
BEGIN
    IF v_hosp IS NULL THEN
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

    IF v_role IN ('hospital_admin', 'super_admin', 'staff') THEN
        v_doctor := p_doctor_id;
        IF v_doctor IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = v_doctor AND hospital_id = v_hosp AND role = 'doctor'
        ) THEN
            RAISE EXCEPTION 'Doctor not in your hospital' USING ERRCODE = '42501';
        END IF;
    ELSIF v_role = 'doctor' THEN
        v_doctor := auth.uid();  -- doctors cannot look at another doctor's patients
    ELSE
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;

    WITH fu AS (
        SELECT f.id, f.follow_up_date, f.follow_up_token, f.reason, f.status, f.doctor_id,
               f.whatsapp_status, f.email_status, f.last_notification_at, f.parent_appointment_id,
               COALESCE(pt.name, a.patient_name) AS patient_name,
               COALESCE(pt.phone, a.patient_phone) AS patient_phone,
               pt.patient_number, pt.communication_opt_out,
               dr.full_name AS doctor_name,
               CASE WHEN f.status IN ('completed', 'cancelled') THEN f.status
                    WHEN f.follow_up_date < CURRENT_DATE THEN 'overdue'
                    WHEN f.follow_up_date = CURRENT_DATE THEN 'due_today'
                    ELSE 'upcoming' END AS bucket
        FROM public.follow_ups f
        LEFT JOIN public.appointments a ON a.id = f.parent_appointment_id
        LEFT JOIN public.patients pt ON pt.id = COALESCE(f.patient_id, a.patient_id)
        LEFT JOIN public.profiles dr ON dr.id = f.doctor_id
        WHERE f.hospital_id = v_hosp
          AND (v_doctor IS NULL OR f.doctor_id = v_doctor)
          AND f.follow_up_date >= CURRENT_DATE - 180
          AND (v_search IS NULL OR LOWER(COALESCE(pt.name, a.patient_name, '')) LIKE '%' || v_search || '%'
               OR COALESCE(pt.phone, a.patient_phone, '') LIKE '%' || v_search || '%'
               OR LOWER(COALESCE(pt.patient_number, '')) LIKE '%' || v_search || '%')
    ),
    fu_filtered AS (
        SELECT * FROM fu WHERE p_status IS NULL OR bucket = p_status
    ),
    lapsed AS (
        -- Patients whose last completed visit was 90–365 days ago and who have nothing booked since.
        SELECT pt.id, pt.name, pt.phone, pt.patient_number, MAX(a.appointment_date) AS last_visit,
               (ARRAY_AGG(dr.full_name ORDER BY a.appointment_date DESC))[1] AS doctor_name
        FROM public.appointments a
        JOIN public.patients pt ON pt.id = a.patient_id
        LEFT JOIN public.profiles dr ON dr.id = a.doctor_id
        WHERE a.hospital_id = v_hosp AND a.status = 'Completed'
          AND (v_doctor IS NULL OR a.doctor_id = v_doctor)
          AND (v_search IS NULL OR LOWER(pt.name) LIKE '%' || v_search || '%' OR pt.phone LIKE '%' || v_search || '%')
        GROUP BY pt.id, pt.name, pt.phone, pt.patient_number
        HAVING MAX(a.appointment_date) BETWEEN CURRENT_DATE - 365 AND CURRENT_DATE - 90
           AND NOT EXISTS (
               SELECT 1 FROM public.appointments a2 WHERE a2.patient_id = pt.id AND a2.appointment_date > MAX(a.appointment_date)
           )
        ORDER BY MAX(a.appointment_date) DESC
        LIMIT 50
    ),
    pending_comm AS (
        SELECT o.id, o.channel, o.notification_type, o.status, o.skip_reason, o.last_error, o.created_at,
               pt.name AS patient_name, f.follow_up_date, f.follow_up_token
        FROM public.notification_outbox o
        JOIN public.follow_ups f ON f.id = o.follow_up_id
        LEFT JOIN public.patients pt ON pt.id = o.patient_id
        WHERE o.hospital_id = v_hosp
          AND (v_doctor IS NULL OR o.doctor_id = v_doctor)
          AND o.status IN ('pending', 'sending', 'failed', 'not_configured', 'skipped')
          AND o.created_at > NOW() - INTERVAL '30 days'
        ORDER BY o.created_at DESC
        LIMIT 50
    ),
    upcoming_appts AS (
        SELECT a.id, a.patient_name, a.appointment_date, a.queue_number, a.status, dr.full_name AS doctor_name
        FROM public.appointments a
        LEFT JOIN public.profiles dr ON dr.id = a.doctor_id
        WHERE a.hospital_id = v_hosp AND (v_doctor IS NULL OR a.doctor_id = v_doctor)
          AND a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
          AND a.status IN ('Waiting', 'In Consultation')
        ORDER BY a.appointment_date, a.token_number
        LIMIT 50
    ),
    recent AS (
        SELECT a.id, a.patient_name, a.appointment_date, a.status, a.queue_number, dr.full_name AS doctor_name, a.updated_at
        FROM public.appointments a
        LEFT JOIN public.profiles dr ON dr.id = a.doctor_id
        WHERE a.hospital_id = v_hosp AND (v_doctor IS NULL OR a.doctor_id = v_doctor)
          AND a.appointment_date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE
        ORDER BY a.updated_at DESC
        LIMIT 20
    )
    SELECT jsonb_build_object(
        'counts', jsonb_build_object(
            'due_today', (SELECT COUNT(*) FROM fu WHERE bucket = 'due_today'),
            'upcoming', (SELECT COUNT(*) FROM fu WHERE bucket = 'upcoming' AND follow_up_date <= CURRENT_DATE + 30),
            'overdue', (SELECT COUNT(*) FROM fu WHERE bucket = 'overdue'),
            'completed', (SELECT COUNT(*) FROM fu WHERE bucket = 'completed' AND follow_up_date >= CURRENT_DATE - 30),
            'pending_communication', (SELECT COUNT(*) FROM pending_comm WHERE status IN ('pending', 'sending', 'failed', 'not_configured')),
            'lapsed_patients', (SELECT COUNT(*) FROM lapsed)
        ),
        'follow_ups', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.follow_up_date) FROM (SELECT * FROM fu_filtered ORDER BY follow_up_date LIMIT 200) x), '[]'::jsonb),
        'lapsed_patients', COALESCE((SELECT jsonb_agg(to_jsonb(l)) FROM lapsed l), '[]'::jsonb),
        'pending_communication', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM pending_comm p), '[]'::jsonb),
        'upcoming_appointments', COALESCE((SELECT jsonb_agg(to_jsonb(u)) FROM upcoming_appts u), '[]'::jsonb),
        'recent_activity', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM recent r), '[]'::jsonb),
        'doctors', CASE WHEN v_role = 'doctor' THEN '[]'::jsonb ELSE COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', id, 'name', full_name) ORDER BY full_name)
            FROM public.profiles WHERE hospital_id = v_hosp AND role = 'doctor' AND is_active), '[]'::jsonb) END,
        'scope', CASE WHEN v_doctor IS NULL THEN 'hospital' ELSE 'doctor' END,
        'hospital_name', (SELECT name FROM public.hospitals WHERE id = v_hosp),
        'booking_token', (SELECT q.token FROM public.qr_codes q WHERE q.hospital_id = v_hosp AND (q.status = 'active' OR q.is_active) LIMIT 1)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ─── 8. CLINICAL AI CONTEXT (Gemini, doctor only) ──────────────────────────

-- Minimum context for ONE of the calling doctor's own appointments. Runs as the caller
-- (via the edge function's user-scoped client): a doctor can never pull another doctor's
-- or another hospital's patient. Names, phone numbers and IDs are not returned.
CREATE OR REPLACE FUNCTION public.get_clinical_ai_context(p_appointment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appt RECORD;
    v_pt RECORD;
    v_history JSONB;
BEGIN
    IF NOT public.is_doctor() THEN
        RAISE EXCEPTION 'Only doctors can use clinical AI' USING ERRCODE = '42501';
    END IF;

    SELECT a.id, a.hospital_id, a.doctor_id, a.patient_id, a.patient_age, a.patient_gender, a.symptoms
    INTO v_appt FROM public.appointments a WHERE a.id = p_appointment_id;

    IF v_appt.id IS NULL OR v_appt.doctor_id IS DISTINCT FROM auth.uid()
       OR v_appt.hospital_id IS DISTINCT FROM public.current_hospital_id() THEN
        RAISE EXCEPTION 'Appointment not found' USING ERRCODE = '42501';
    END IF;

    SELECT age, gender, allergies, known_diseases, previous_medicine, medical_history
    INTO v_pt FROM public.patients WHERE id = v_appt.patient_id AND hospital_id = v_appt.hospital_id;

    -- This doctor's own last three visits with the patient (diagnosis only).
    SELECT COALESCE(jsonb_agg(jsonb_build_object('date', c.created_at::date, 'diagnosis', LEFT(c.diagnosis, 200))), '[]'::jsonb)
    INTO v_history
    FROM (
        SELECT created_at, diagnosis FROM public.consultations
        WHERE patient_id = v_appt.patient_id AND doctor_id = auth.uid() AND appointment_id <> v_appt.id
          AND diagnosis IS NOT NULL
        ORDER BY created_at DESC LIMIT 3
    ) c;

    RETURN jsonb_build_object(
        'hospital_id', v_appt.hospital_id,
        'patient_id', v_appt.patient_id,
        'age', COALESCE(v_pt.age, v_appt.patient_age),
        'gender', COALESCE(v_pt.gender, v_appt.patient_gender),
        'allergies', LEFT(v_pt.allergies, 500),
        'known_diseases', LEFT(v_pt.known_diseases, 500),
        'current_medicines', LEFT(v_pt.previous_medicine, 500),
        'medical_history', LEFT(v_pt.medical_history, 800),
        'symptoms', LEFT(v_appt.symptoms, 800),
        'previous_visits', v_history
    );
END;
$$;

-- ─── 9. GRANTS ──────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.get_ai_feature_flags(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_feature_flags(UUID) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_public_knowledge(TEXT, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_knowledge(TEXT, UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.get_booking_availability(TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_availability(TEXT, DATE) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.set_patient_communication_prefs(TEXT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_patient_communication_prefs(TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.enqueue_followup_notifications() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_notification_batch(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_notification(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_followup_notifications(), public.claim_notification_batch(INTEGER),
    public.complete_notification(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.get_crm_overview(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_crm_overview(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_clinical_ai_context(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_clinical_ai_context(UUID) TO authenticated;

-- Trigger functions are not callable endpoints.
REVOKE ALL ON FUNCTION public.clean_hospital_ai_settings(), public.clean_public_ai_knowledge() FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- END OF 05_AI_LAYER.sql
-- ==============================================================================
