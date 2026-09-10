-- ============================================================================
-- MEDTECH FIXATERS — DOCTOR AVAILABILITY + NOTIFICATIONS (Phase 4)
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- ADDITIVE ONLY — does not drop the schema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: DOCTOR AVAILABILITY
-- ----------------------------------------------------------------------------
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

-- Working hours are a per-doctor default, not per-date — stored once and
-- read by both manual and AI booking to know this doctor's normal slots.
CREATE TABLE IF NOT EXISTS public.doctor_working_hours (
    doctor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    morning_start TIME,
    morning_end TIME,
    evening_start TIME,
    evening_end TIME,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_date ON public.doctor_availability(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_hospital ON public.doctor_availability(hospital_id);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_working_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctor manage own availability" ON public.doctor_availability;
CREATE POLICY "Doctor manage own availability" ON public.doctor_availability
    FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id())
    WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());

DROP POLICY IF EXISTS "Hospital users view availability" ON public.doctor_availability;
CREATE POLICY "Hospital users view availability" ON public.doctor_availability
    FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());

-- Public booking flow must see unavailable dates too, so it (and any AI
-- booking recommender) never offers a doctor who has blocked that day.
DROP POLICY IF EXISTS "Public view availability for booking" ON public.doctor_availability;
CREATE POLICY "Public view availability for booking" ON public.doctor_availability
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Super Admin full access availability" ON public.doctor_availability;
CREATE POLICY "Super Admin full access availability" ON public.doctor_availability FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Doctor manage own working hours" ON public.doctor_working_hours;
CREATE POLICY "Doctor manage own working hours" ON public.doctor_working_hours
    FOR ALL TO authenticated USING (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id())
    WITH CHECK (doctor_id = auth.uid() AND hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Hospital users view working hours" ON public.doctor_working_hours;
CREATE POLICY "Hospital users view working hours" ON public.doctor_working_hours
    FOR SELECT TO authenticated USING (hospital_id = public.current_hospital_id());
DROP POLICY IF EXISTS "Public view working hours" ON public.doctor_working_hours;
CREATE POLICY "Public view working hours" ON public.doctor_working_hours FOR SELECT TO anon USING (true);

GRANT ALL ON public.doctor_availability, public.doctor_working_hours TO authenticated, service_role;
GRANT SELECT ON public.doctor_availability, public.doctor_working_hours TO anon;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'doctor_availability') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_availability;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: NOTIFICATIONS — real table. Nothing in the schema wrote to a
-- notifications table before this; the hospital-admin Notifications page's
-- `notifications` state was declared and never populated by anything.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- audience determines who can see it; hospital_id/recipient_id narrow it
    audience TEXT NOT NULL CHECK (audience IN ('platform_all', 'hospital_admins', 'hospital_all', 'specific_user')),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE, -- required for hospital_admins/hospital_all
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- required for specific_user
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'announcement' CHECK (category IN ('announcement', 'maintenance', 'feature_update', 'account_notice', 'verification', 'schedule_change', 'emergency', 'appointment')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Per-recipient read/archive state, separate from the notification itself —
-- a broadcast notification (hospital_all / platform_all) is one row read by
-- many people, each with their own read/archived status.
CREATE TABLE IF NOT EXISTS public.notification_receipts (
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_hospital ON public.notifications(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view notifications addressed to them" ON public.notifications;
CREATE POLICY "Users view notifications addressed to them" ON public.notifications
    FOR SELECT TO authenticated USING (
        audience = 'platform_all'
        OR (audience = 'hospital_admins' AND public.is_hospital_admin() AND hospital_id = public.current_hospital_id())
        OR (audience = 'hospital_all' AND hospital_id = public.current_hospital_id())
        OR (audience = 'specific_user' AND recipient_id = auth.uid())
    );

DROP POLICY IF EXISTS "Hospital Admin send hospital notifications" ON public.notifications;
CREATE POLICY "Hospital Admin send hospital notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid() AND public.is_hospital_admin() AND audience = 'hospital_all' AND hospital_id = public.current_hospital_id()
    );

DROP POLICY IF EXISTS "Super Admin full access notifications" ON public.notifications;
CREATE POLICY "Super Admin full access notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users manage own receipts" ON public.notification_receipts;
CREATE POLICY "Users manage own receipts" ON public.notification_receipts
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT ALL ON public.notifications, public.notification_receipts TO authenticated, service_role;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
