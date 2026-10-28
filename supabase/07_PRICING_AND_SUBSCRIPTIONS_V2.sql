-- ==============================================================================
-- 07_PRICING_AND_SUBSCRIPTIONS_V2.sql
-- MedTechFixaters Pricing & Subscription System
--
-- Implements:
-- 1. Centralized pricing plans:
--    - Plan 1: First Month Special Offer (₹500 for first month, ₹5,000 renewal)
--    - Plan 2: Doctor and Clinic Plan (₹5,000 per month)
--    - Plan 3: Hospital Solutions (Custom enterprise pricing via consultation)
-- 2. Server-side introductory offer eligibility tracking (prevents repeated 90% discount).
-- 3. Secure subscription activation RPCs with server-enforced pricing amounts.
-- 4. Hospital inquiry tracking & RLS.
-- 5. Analytics event logging & RLS.
-- ==============================================================================

-- 1. Ensure columns exist on public.individual_doctor_subscriptions
ALTER TABLE public.individual_doctor_subscriptions
    ADD COLUMN IF NOT EXISTS renewal_amount NUMERIC(10, 2) DEFAULT 5000.00,
    ADD COLUMN IF NOT EXISTS renewal_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS billing_terms TEXT DEFAULT 'Monthly billing. First month discounted; subsequent renewal at standard ₹5,000/mo.',
    ADD COLUMN IF NOT EXISTS is_introductory_offer BOOLEAN DEFAULT false;

-- Index for speedy eligibility checks
CREATE INDEX IF NOT EXISTS idx_subs_doctor_plan_status
    ON public.individual_doctor_subscriptions (doctor_id, plan_id, status);

CREATE INDEX IF NOT EXISTS idx_subs_provider_payment
    ON public.individual_doctor_subscriptions (provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;

-- 2. Hospital Consultation Inquiries Table (separate from automated subscriptions)
CREATE TABLE IF NOT EXISTS public.hospital_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT,
    doctor_count TEXT,
    department_count TEXT,
    deployment_preference TEXT DEFAULT 'cloud', -- 'cloud', 'dedicated_instance', 'hybrid'
    requirements TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'proposal_sent', 'closed', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.hospital_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit hospital inquiry" ON public.hospital_inquiries;
CREATE POLICY "Public can submit hospital inquiry"
    ON public.hospital_inquiries FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        char_length(hospital_name) >= 2 AND
        char_length(contact_person) >= 2 AND
        char_length(email) >= 5 AND
        char_length(phone) >= 8
    );

DROP POLICY IF EXISTS "Super Admins can view hospital inquiries" ON public.hospital_inquiries;
CREATE POLICY "Super Admins can view hospital inquiries"
    ON public.hospital_inquiries FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super Admins can update hospital inquiries" ON public.hospital_inquiries;
CREATE POLICY "Super Admins can update hospital inquiries"
    ON public.hospital_inquiries FOR UPDATE
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Also create contact_messages if not exists (used by existing contact forms)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    organization TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message"
    ON public.contact_messages FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Super Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Super Admins can view contact messages"
    ON public.contact_messages FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

-- 3. Analytics Events Table for tracking conversions, views, checkout flows
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created
    ON public.analytics_events (event_name, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow event ingestion" ON public.analytics_events;
CREATE POLICY "Allow event ingestion"
    ON public.analytics_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (char_length(event_name) > 0);

DROP POLICY IF EXISTS "Super Admins view analytics events" ON public.analytics_events;
CREATE POLICY "Super Admins view analytics events"
    ON public.analytics_events FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

-- 4. Check Introductory Offer Eligibility Function
CREATE OR REPLACE FUNCTION public.check_intro_eligibility(
    p_doctor_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_redeemed BOOLEAN := false;
BEGIN
    -- Check by doctor UID if logged in
    IF p_doctor_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.individual_doctor_subscriptions
            WHERE doctor_id = p_doctor_id
              AND (plan_id = 'doctor_intro_500' OR is_introductory_offer = true)
              AND status IN ('active', 'expired', 'completed')
        ) INTO v_redeemed;
    END IF;

    -- Check by email address if provided
    IF NOT v_redeemed AND p_email IS NOT NULL AND TRIM(p_email) <> '' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.individual_doctor_subscriptions s
            JOIN public.profiles p ON p.id = s.doctor_id
            WHERE LOWER(p.email) = LOWER(TRIM(p_email))
              AND (s.plan_id = 'doctor_intro_500' OR s.is_introductory_offer = true)
              AND s.status IN ('active', 'expired', 'completed')
        ) INTO v_redeemed;
    END IF;

    RETURN jsonb_build_object(
        'eligible', NOT v_redeemed,
        'plan_id', 'doctor_intro_500',
        'intro_price', 500.00,
        'regular_price', 5000.00,
        'discount_percent', 90,
        'renewal_amount', 5000.00,
        'message', CASE 
            WHEN v_redeemed THEN 'Introductory 90% discount has already been used for this account.'
            ELSE 'Eligible for 90% OFF first month introductory offer.'
        END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_intro_eligibility(UUID, TEXT) TO anon, authenticated, service_role;

-- 5. Updated Internal Subscription Activation with strict server-side pricing
CREATE OR REPLACE FUNCTION public.activate_doctor_subscription_internal(
    p_doctor_id UUID,
    p_plan_id TEXT,
    p_payment_provider TEXT,
    p_order_id TEXT,
    p_payment_id TEXT,
    p_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prof RECORD;
    v_hosp_status TEXT;
    v_qr RECORD;
    v_clean_plan TEXT;
    v_amount NUMERIC(10, 2);
    v_renewal_amount NUMERIC(10, 2);
    v_plan_name TEXT;
    v_is_intro BOOLEAN := false;
    v_duration INTERVAL := INTERVAL '30 days';
BEGIN
    SELECT * INTO v_prof FROM public.profiles WHERE id = p_doctor_id AND role = 'doctor';
    IF v_prof.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor profile not found.');
    END IF;

    SELECT status INTO v_hosp_status FROM public.hospitals WHERE id = v_prof.hospital_id;
    IF COALESCE(v_prof.account_status, 'active') IN ('suspended', 'blocked', 'banned', 'deleted')
       OR COALESCE(v_prof.onboarding_status, 'ACTIVE') IN ('SUSPENDED', 'CANCELLED')
       OR COALESCE(v_hosp_status, 'active') IN ('suspended', 'blocked', 'banned', 'deleted') THEN
        RETURN jsonb_build_object('success', false, 'error', 'This account has been restricted. Please contact support.');
    END IF;

    -- Strict server-side pricing enforcement:
    -- Never trust any client-supplied amount.
    IF p_plan_id = 'doctor_intro_500' THEN
        -- Check if already redeemed
        IF EXISTS (
            SELECT 1 FROM public.individual_doctor_subscriptions
            WHERE doctor_id = p_doctor_id
              AND (plan_id = 'doctor_intro_500' OR is_introductory_offer = true)
              AND status IN ('active', 'expired', 'completed')
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'The 90% OFF First Month offer has already been redeemed for this account. Please select the monthly subscription.');
        END IF;

        v_clean_plan := 'doctor_intro_500';
        v_plan_name := 'First Month Special Offer (90% OFF)';
        v_amount := 500.00;
        v_renewal_amount := 5000.00;
        v_is_intro := true;
        v_duration := INTERVAL '30 days';
    ELSE
        v_clean_plan := 'doctor_monthly_5000';
        v_plan_name := 'Doctor and Clinic Plan (Monthly)';
        v_amount := 5000.00;
        v_renewal_amount := 5000.00;
        v_is_intro := false;
        v_duration := INTERVAL '30 days';
    END IF;

    -- Idempotent for replayed payment callbacks: one subscription per gateway payment.
    IF p_payment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.individual_doctor_subscriptions
        WHERE payment_provider = p_payment_provider AND provider_payment_id = p_payment_id
    ) THEN
        SELECT * INTO v_qr FROM public.qr_codes WHERE hospital_id = v_prof.hospital_id LIMIT 1;
        RETURN jsonb_build_object(
            'success', true,
            'onboarding_status', 'ACTIVE',
            'qr_token', v_qr.token,
            'booking_url', v_qr.booking_url,
            'duplicate', true
        );
    END IF;

    -- Insert confirmed subscription with verified billing terms
    INSERT INTO public.individual_doctor_subscriptions (
        doctor_id, hospital_id, plan_id, plan_name, amount,
        renewal_amount, renewal_due_at, billing_terms, is_introductory_offer,
        status, payment_provider, provider_order_id, provider_payment_id, provider_signature,
        started_at, expires_at, updated_at
    ) VALUES (
        p_doctor_id, v_prof.hospital_id, v_clean_plan, v_plan_name, v_amount,
        v_renewal_amount, NOW() + v_duration,
        CASE
            WHEN v_is_intro THEN 'First month promotional rate of ₹500. Renewal from month two at standard ₹5,000/month.'
            ELSE 'Standard monthly billing at ₹5,000/month.'
        END,
        v_is_intro,
        'active',
        LEFT(p_payment_provider, 40),
        LEFT(p_order_id, 100),
        LEFT(p_payment_id, 100),
        LEFT(p_signature, 200),
        NOW(),
        NOW() + v_duration,
        NOW()
    );

    UPDATE public.profiles
    SET onboarding_status = 'ACTIVE', updated_at = NOW()
    WHERE id = p_doctor_id;

    UPDATE public.doctor_details
    SET onboarding_status = 'ACTIVE', is_active = true, updated_at = NOW()
    WHERE id = p_doctor_id;

    -- Ensure QR code exists and is activated
    SELECT * INTO v_qr FROM public.qr_codes
    WHERE hospital_id = v_prof.hospital_id AND (status = 'active' OR is_active = true)
    LIMIT 1;

    IF v_qr.id IS NULL THEN
        INSERT INTO public.qr_codes (hospital_id, token, booking_url, intake_url, status, is_active)
        VALUES (
            v_prof.hospital_id,
            'QR-DOC-' || UPPER(SUBSTRING(REPLACE(p_doctor_id::text, '-', ''), 1, 8)),
            '/book/QR-DOC-' || UPPER(SUBSTRING(REPLACE(p_doctor_id::text, '-', ''), 1, 8)),
            '/book/QR-DOC-' || UPPER(SUBSTRING(REPLACE(p_doctor_id::text, '-', ''), 1, 8)),
            'active', true
        )
        ON CONFLICT (hospital_id) DO UPDATE SET status = 'active', is_active = true
        RETURNING * INTO v_qr;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'onboarding_status', 'ACTIVE',
        'plan_id', v_clean_plan,
        'amount_paid', v_amount,
        'renewal_amount', v_renewal_amount,
        'renewal_due_at', NOW() + v_duration,
        'qr_token', v_qr.token,
        'booking_url', v_qr.booking_url
    );
END;
$$;

-- Protect internal activation: callable only by service_role and verified wrappers
REVOKE EXECUTE ON FUNCTION public.activate_doctor_subscription_internal(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated, anon;

-- Wrapper for Edge Function (service role)
GRANT EXECUTE ON FUNCTION public.activate_paid_subscription(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
