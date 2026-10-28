-- ==============================================================================
-- 09_ONBOARDING_AND_PAYMENTS_SYSTEM.sql
-- MedTechFixaters Comprehensive Onboarding, Scheduling, Fees, Invoices & Payment Support System
--
-- Implements:
-- 1. Onboarding Profiles table (persistent step-by-step state tracking)
-- 2. Doctor Schedules table (7-day weekday schedule, multiple intervals, Asia/Kolkata timezone)
-- 3. Consultation Fees table (in-person, online, duration, integer paise)
-- 4. Payment enhancement columns & Webhook Event Inbox (deduplication)
-- 5. Invoices table (unique invoice number sequence, merchant & customer snapshot)
-- 6. Payment Support Tickets table (customer care ticket tracking)
-- 7. High-performance indexes, constraints, and Row Level Security (RLS) policies
-- 8. Stored procedures / RPCs for atomic operations & access control
-- ==============================================================================

-- 1. ONBOARDING PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.onboarding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL DEFAULT 'individual_doctor'
        CHECK (account_type IN ('individual_doctor', 'clinic', 'hospital')),
    current_step TEXT NOT NULL DEFAULT 'basic_details'
        CHECK (current_step IN ('basic_details', 'organization', 'availability', 'consultation_fees', 'review', 'payment', 'completed')),
    onboarding_status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (onboarding_status IN ('in_progress', 'pending_payment', 'payment_pending', 'completed', 'needs_review')),
    step_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    profile_completed_at TIMESTAMPTZ,
    payment_completed_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user
    ON public.onboarding_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_status_step
    ON public.onboarding_profiles(onboarding_status, current_step);

ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- 2. DOCTOR SCHEDULES TABLE (Step 3: Default Availability)
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT chk_schedule_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day
    ON public.doctor_schedules(doctor_id, day_of_week);

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- 3. CONSULTATION FEES TABLE (Step 4: Consultation Fee)
CREATE TABLE IF NOT EXISTS public.consultation_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in_person', 'online', 'both')),
    amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0), -- e.g. 50000 = ₹500.00
    currency TEXT NOT NULL DEFAULT 'INR',
    duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (duration_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consultation_fees_doctor
    ON public.consultation_fees(doctor_id, is_active);

ALTER TABLE public.consultation_fees ENABLE ROW LEVEL SECURITY;

-- 4. PAYMENTS TABLE ENHANCEMENTS
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS provider_name TEXT DEFAULT 'cashfree',
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS refund_reference TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key
    ON public.payments(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- 5. PAYMENT WEBHOOK EVENTS TABLE (Inbox pattern for idempotency & deduplication)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL DEFAULT 'cashfree',
    provider_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    provider_order_reference TEXT,
    processing_status TEXT NOT NULL DEFAULT 'received'
        CHECK (processing_status IN ('received', 'processed', 'failed', 'ignored')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    receipt_timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    processed_timestamp TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_order
    ON public.payment_webhook_events(provider_order_reference);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
    ON public.payment_webhook_events(processing_status);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- 6. INVOICE RECORDS TABLE (Step 7A: Invoicing)
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    merchant_details JSONB NOT NULL,
    customer_details JSONB NOT NULL,
    item_description TEXT NOT NULL DEFAULT 'MedTechFixaters Platform Activation — First Month',
    invoice_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    invoice_status TEXT NOT NULL DEFAULT 'paid' CHECK (invoice_status IN ('paid', 'refunded', 'void')),
    secure_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_user
    ON public.invoices(user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_payment
    ON public.invoices(payment_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 7. CUSTOMER SUPPORT TICKETS TABLE (Step 7B: Payment Issues)
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START 10001;

CREATE TABLE IF NOT EXISTS public.payment_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_order_id TEXT,
    provider_payment_id TEXT,
    issue_category TEXT NOT NULL CHECK (issue_category IN ('debited_not_activated', 'gateway_timeout', 'bank_declined', 'double_charge', 'other')),
    customer_description TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    ticket_status TEXT NOT NULL DEFAULT 'open' CHECK (ticket_status IN ('open', 'under_investigation', 'resolved', 'closed')),
    assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user
    ON public.payment_support_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
    ON public.payment_support_tickets(ticket_status);

ALTER TABLE public.payment_support_tickets ENABLE ROW LEVEL SECURITY;

-- Ensure phone column exists on profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS customer_category TEXT,
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Following Supabase best practices:
-- Use TO authenticated with (select auth.uid()) = user_id
-- Never use bare TO authenticated; provide explicit WITH CHECK for UPDATE/INSERT
-- ==============================================================================

-- Onboarding Profiles Policies
DROP POLICY IF EXISTS "Users can view their own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can view their own onboarding profile"
    ON public.onboarding_profiles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can insert their own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can insert their own onboarding profile"
    ON public.onboarding_profiles FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update their own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can update their own onboarding profile"
    ON public.onboarding_profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_super_admin())
    WITH CHECK ((select auth.uid()) = user_id OR public.is_super_admin());

-- Doctor Schedules Policies
DROP POLICY IF EXISTS "Doctors can view their own schedules" ON public.doctor_schedules;
CREATE POLICY "Doctors can view their own schedules"
    ON public.doctor_schedules FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = doctor_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Doctors can insert their own schedules" ON public.doctor_schedules;
CREATE POLICY "Doctors can insert their own schedules"
    ON public.doctor_schedules FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = doctor_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Doctors can update their own schedules" ON public.doctor_schedules;
CREATE POLICY "Doctors can update their own schedules"
    ON public.doctor_schedules FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = doctor_id OR public.is_super_admin())
    WITH CHECK ((select auth.uid()) = doctor_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Doctors can delete their own schedules" ON public.doctor_schedules;
CREATE POLICY "Doctors can delete their own schedules"
    ON public.doctor_schedules FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = doctor_id OR public.is_super_admin());

-- Consultation Fees Policies
DROP POLICY IF EXISTS "Doctors can view their consultation fees" ON public.consultation_fees;
CREATE POLICY "Doctors can view their consultation fees"
    ON public.consultation_fees FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = doctor_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Doctors can insert their consultation fees" ON public.consultation_fees;
CREATE POLICY "Doctors can insert their consultation fees"
    ON public.consultation_fees FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = doctor_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Doctors can update their consultation fees" ON public.consultation_fees;
CREATE POLICY "Doctors can update their consultation fees"
    ON public.consultation_fees FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = doctor_id OR public.is_super_admin())
    WITH CHECK ((select auth.uid()) = doctor_id OR public.is_super_admin());

-- Webhook Events Policies (Server role and Super Admin only)
DROP POLICY IF EXISTS "Webhook events restricted to service operations" ON public.payment_webhook_events;
CREATE POLICY "Webhook events restricted to service operations"
    ON public.payment_webhook_events FOR ALL
    TO authenticated
    USING (public.is_super_admin());

-- Invoices Policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_super_admin());

-- Support Tickets Policies
DROP POLICY IF EXISTS "Users can view their own support tickets" ON public.payment_support_tickets;
CREATE POLICY "Users can view their own support tickets"
    ON public.payment_support_tickets FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can submit support tickets" ON public.payment_support_tickets;
CREATE POLICY "Users can submit support tickets"
    ON public.payment_support_tickets FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id OR public.is_super_admin());

-- ==============================================================================
-- STORED PROCEDURES & DATABASE RPCs
-- ==============================================================================

-- 1. Save Onboarding Step (Atomic persistence across browser refresh / re-login)
CREATE OR REPLACE FUNCTION public.save_onboarding_step(
    p_user_id UUID,
    p_step TEXT,
    p_account_type TEXT,
    p_step_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user UUID := COALESCE(p_user_id, auth.uid());
    v_record RECORD;
    v_cat TEXT;
BEGIN
    IF v_target_user IS NULL OR (v_target_user <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
    END IF;

    -- Map account type to customer category
    v_cat := CASE WHEN p_account_type = 'hospital' THEN 'hospital' ELSE 'solo_doctor_clinic' END;

    -- Upsert onboarding profile
    INSERT INTO public.onboarding_profiles (
        user_id, account_type, current_step, onboarding_status, step_data, updated_at
    ) VALUES (
        v_target_user, p_account_type, p_step, 'in_progress', p_step_data, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        account_type = EXCLUDED.account_type,
        current_step = EXCLUDED.current_step,
        step_data = public.onboarding_profiles.step_data || EXCLUDED.step_data,
        updated_at = NOW()
    RETURNING * INTO v_record;

    -- Sync category onto profiles table
    UPDATE public.profiles
    SET customer_category = v_cat,
        updated_at = NOW()
    WHERE id = v_target_user;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_target_user,
        'account_type', v_record.account_type,
        'current_step', v_record.current_step,
        'onboarding_status', v_record.onboarding_status,
        'updated_at', v_record.updated_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_onboarding_step(UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- 2. Get Onboarding Status (Resume exact progress for returning users)
CREATE OR REPLACE FUNCTION public.get_onboarding_status(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user UUID := COALESCE(p_user_id, auth.uid());
    v_ob RECORD;
    v_access JSONB;
BEGIN
    IF v_target_user IS NULL THEN
        RETURN jsonb_build_object('authenticated', false, 'can_access_dashboard', false, 'route_destination', '/login');
    END IF;

    -- Evaluate central account access status
    v_access := public.get_account_access_status(v_target_user);

    -- If already has full dashboard access, return destination immediately
    IF (v_access->>'can_access_dashboard')::boolean = true THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'is_complete', true,
            'can_access_dashboard', true,
            'route_destination', v_access->>'route_destination',
            'subscription_status', v_access->>'subscription_status'
        );
    END IF;

    -- Fetch onboarding profile
    SELECT * INTO v_ob FROM public.onboarding_profiles WHERE user_id = v_target_user;

    IF v_ob.id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'is_complete', false,
            'current_step', 'basic_details',
            'account_type', 'individual_doctor',
            'onboarding_status', 'in_progress',
            'step_data', '{}'::jsonb,
            'route_destination', '/onboarding/basic-details'
        );
    END IF;

    -- Determine step destination
    RETURN jsonb_build_object(
        'authenticated', true,
        'user_id', v_target_user,
        'is_complete', (v_ob.onboarding_status = 'completed'),
        'current_step', v_ob.current_step,
        'account_type', v_ob.account_type,
        'onboarding_status', v_ob.onboarding_status,
        'step_data', v_ob.step_data,
        'route_destination', CASE
            WHEN v_ob.onboarding_status = 'completed' THEN '/dashboard'
            WHEN v_ob.onboarding_status = 'pending_payment' THEN '/onboarding/payment'
            WHEN v_ob.current_step = 'organization' THEN '/onboarding/organization'
            WHEN v_ob.current_step = 'availability' THEN '/onboarding/availability'
            WHEN v_ob.current_step = 'consultation_fees' THEN '/onboarding/consultation-fees'
            WHEN v_ob.current_step = 'review' THEN '/onboarding/review'
            WHEN v_ob.current_step = 'payment' THEN '/onboarding/payment'
            ELSE '/onboarding/basic-details'
        END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_onboarding_status(UUID) TO anon, authenticated, service_role;

-- 3. Complete Profile (Step 5 Review Submission -> Transition to pending payment)
CREATE OR REPLACE FUNCTION public.complete_onboarding_profile(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user UUID := COALESCE(p_user_id, auth.uid());
    v_ob RECORD;
    v_org_id UUID;
    v_step_data JSONB;
    v_full_name TEXT;
    v_phone TEXT;
    v_clinic_name TEXT;
    v_address TEXT;
    v_city TEXT;
    v_state TEXT;
    v_reg_no TEXT;
    v_role TEXT;
    v_account_type TEXT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_target_user IS NULL OR (v_target_user <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
    END IF;

    SELECT * INTO v_ob FROM public.onboarding_profiles WHERE user_id = v_target_user;
    IF v_ob.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Onboarding profile not found.');
    END IF;

    v_step_data := v_ob.step_data;
    v_account_type := v_ob.account_type;

    v_full_name := COALESCE(v_step_data->'basic'->>'full_name', v_step_data->>'full_name', 'Doctor');
    v_phone := COALESCE(v_step_data->'basic'->>'phone', v_step_data->>'phone', '');
    v_clinic_name := COALESCE(v_step_data->'org'->>'clinic_name', v_step_data->'org'->>'practice_name', v_step_data->'org'->>'hospital_name', v_full_name || '''s Practice');
    v_address := COALESCE(v_step_data->'org'->>'address', '');
    v_city := COALESCE(v_step_data->'org'->>'city', '');
    v_state := COALESCE(v_step_data->'org'->>'state', '');
    v_reg_no := COALESCE(v_step_data->'org'->>'registration_number', '');
    v_role := COALESCE(v_step_data->'basic'->>'role', 'doctor');

    -- Update or create organization
    SELECT id INTO v_org_id FROM public.organizations WHERE owner_user_id = v_target_user LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (
            organization_type, organization_name, owner_user_id,
            address, city, state, registration_number, organization_status, created_at, updated_at
        ) VALUES (
            CASE WHEN v_account_type = 'hospital' THEN 'hospital' ELSE 'solo_doctor_clinic' END,
            v_clinic_name,
            v_target_user,
            v_address, v_city, v_state, v_reg_no,
            'pending_verification', v_now, v_now
        ) RETURNING id INTO v_org_id;

        INSERT INTO public.organization_members (organization_id, user_id, role, membership_status, created_at)
        VALUES (v_org_id, v_target_user, 'owner', 'active', v_now)
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    ELSE
        UPDATE public.organizations
        SET organization_name = v_clinic_name,
            address = v_address,
            city = v_city,
            state = v_state,
            registration_number = v_reg_no,
            updated_at = v_now
        WHERE id = v_org_id;
    END IF;

    -- Update profiles
    UPDATE public.profiles
    SET full_name = v_full_name,
        phone = v_phone,
        customer_category = CASE WHEN v_account_type = 'hospital' THEN 'hospital' ELSE 'solo_doctor_clinic' END,
        profile_completed = true,
        updated_at = v_now
    WHERE id = v_target_user;

    -- Update onboarding profile status to pending_payment
    UPDATE public.onboarding_profiles
    SET current_step = 'payment',
        onboarding_status = 'pending_payment',
        profile_completed_at = v_now,
        updated_at = v_now
    WHERE user_id = v_target_user;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_target_user,
        'organization_id', v_org_id,
        'onboarding_status', 'pending_payment',
        'current_step', 'payment',
        'message', 'Profile completed. Proceed to platform activation payment.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding_profile(UUID) TO authenticated, service_role;

-- 4. Generate Invoice Record on Payment Activation
CREATE OR REPLACE FUNCTION public.generate_payment_invoice(p_payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pay RECORD;
    v_org RECORD;
    v_prof RECORD;
    v_inv_no TEXT;
    v_inv_id UUID;
    v_merchant JSONB;
    v_customer JSONB;
BEGIN
    SELECT * INTO v_pay FROM public.payments WHERE id = p_payment_id;
    IF v_pay.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment record not found.');
    END IF;

    -- Check if invoice already generated for this payment
    SELECT id, invoice_number INTO v_inv_id, v_inv_no FROM public.invoices WHERE payment_id = p_payment_id LIMIT 1;
    IF v_inv_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'invoice_id', v_inv_id,
            'invoice_number', v_inv_no,
            'duplicate', true
        );
    END IF;

    SELECT * INTO v_org FROM public.organizations WHERE id = v_pay.organization_id;
    SELECT * INTO v_prof FROM public.profiles WHERE id = v_org.owner_user_id;

    -- Generate sequence invoice number: MTF-INV-YYYY-XXXXX
    v_inv_no := 'MTF-INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public.invoice_number_seq')::text, 5, '0');

    -- Merchant Snapshot
    v_merchant := jsonb_build_object(
        'legal_name', 'MedTechFixaters Healthcare Technologies Private Limited',
        'trade_name', 'MedTechFixaters.in',
        'support_email', 'support@medtechfixaters.in',
        'support_phone', '+91 98765 43210',
        'website', 'https://www.medtechfixaters.in',
        'address', 'Healthcare Innovation Hub, Bengaluru, Karnataka 560001, India',
        'hsn_sac', '998313' -- Information technology consulting and support services
    );

    -- Customer Snapshot
    v_customer := jsonb_build_object(
        'name', COALESCE(v_prof.full_name, 'Healthcare Practitioner'),
        'email', COALESCE(v_prof.email, ''),
        'phone', COALESCE(v_prof.phone, ''),
        'clinic_name', COALESCE(v_org.organization_name, 'Clinic'),
        'address', COALESCE(v_org.address, ''),
        'city', COALESCE(v_org.city, ''),
        'state', COALESCE(v_org.state, '')
    );

    INSERT INTO public.invoices (
        invoice_number, payment_id, user_id, organization_id,
        amount_paise, currency, merchant_details, customer_details,
        item_description, invoice_date, invoice_status, created_at
    ) VALUES (
        v_inv_no, v_pay.id, v_org.owner_user_id, v_org.id,
        v_pay.amount_paise, v_pay.currency, v_merchant, v_customer,
        'MedTechFixaters Platform Activation — ' || INITCAP(REPLACE(v_pay.payment_purpose, '_', ' ')),
        NOW(), 'paid', NOW()
    ) RETURNING id INTO v_inv_id;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', v_inv_id,
        'invoice_number', v_inv_no,
        'amount_paise', v_pay.amount_paise,
        'currency', v_pay.currency,
        'invoice_date', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_payment_invoice(UUID) TO authenticated, service_role;

-- 5. Enhanced Verify and Activate Payment (calls invoice generation and marks onboarding completed)
CREATE OR REPLACE FUNCTION public.verify_and_activate_payment_v2(
    p_internal_order_id TEXT,
    p_gateway_order_id TEXT,
    p_gateway_payment_id TEXT,
    p_gateway_signature TEXT,
    p_verified_by TEXT DEFAULT 'gateway_webhook'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base_res JSONB;
    v_pay RECORD;
    v_inv_res JSONB;
    v_org RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Call existing verified payment activation procedure
    v_base_res := public.verify_and_activate_payment(
        p_internal_order_id, p_gateway_order_id, p_gateway_payment_id, p_gateway_signature, p_verified_by
    );

    IF (v_base_res->>'success')::boolean <> true THEN
        RETURN v_base_res;
    END IF;

    SELECT * INTO v_pay FROM public.payments WHERE internal_order_id = p_internal_order_id;
    IF v_pay.id IS NOT NULL THEN
        -- Mark payment captured timestamp
        UPDATE public.payments
        SET captured_at = v_now
        WHERE id = v_pay.id;

        -- Generate invoice
        v_inv_res := public.generate_payment_invoice(v_pay.id);

        SELECT * INTO v_org FROM public.organizations WHERE id = v_pay.organization_id;
        IF v_org.owner_user_id IS NOT NULL THEN
            -- Update onboarding profile to completed
            UPDATE public.onboarding_profiles
            SET current_step = 'completed',
                onboarding_status = 'completed',
                payment_completed_at = v_now,
                onboarding_completed_at = v_now,
                updated_at = v_now
            WHERE user_id = v_org.owner_user_id;
        END IF;
    END IF;

    RETURN v_base_res || jsonb_build_object(
        'invoice_number', v_inv_res->>'invoice_number',
        'invoice_id', v_inv_res->>'invoice_id',
        'onboarding_completed', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_activate_payment_v2(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 6. Create Support Ticket (Step 7B Customer Care)
CREATE OR REPLACE FUNCTION public.create_payment_support_ticket(
    p_user_id UUID,
    p_order_id TEXT,
    p_provider_payment_id TEXT,
    p_category TEXT,
    p_description TEXT,
    p_email TEXT,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user UUID := COALESCE(p_user_id, auth.uid());
    v_tkt_no TEXT;
    v_tkt_id UUID;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_target_user IS NULL OR (v_target_user <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
    END IF;

    -- Generate ticket number: MTF-TKT-XXXXX
    v_tkt_no := 'MTF-TKT-' || LPAD(nextval('public.support_ticket_seq')::text, 5, '0');

    INSERT INTO public.payment_support_tickets (
        ticket_number, user_id, payment_order_id, provider_payment_id,
        issue_category, customer_description, contact_email, contact_phone,
        ticket_status, created_at, updated_at
    ) VALUES (
        v_tkt_no, v_target_user, p_order_id, p_provider_payment_id,
        p_category, p_description, p_email, p_phone,
        'open', v_now, v_now
    ) RETURNING id INTO v_tkt_id;

    RETURN jsonb_build_object(
        'success', true,
        'ticket_id', v_tkt_id,
        'ticket_number', v_tkt_no,
        'message', 'Your support ticket has been registered. Our priority billing desk will review and contact you within 2 hours.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_payment_support_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Notify PostgREST to reload schema immediately
NOTIFY pgrst, 'reload schema';
