-- ==============================================================================
-- 08_REGISTRATION_SUBSCRIPTION_SYSTEM.sql
-- MedTechFixaters Registration, Subscription, & Payment Management System
--
-- Implements:
-- 1. Profiles enhancement (customer_category, profile_completed)
-- 2. Organizations table (solo_doctor_clinic, hospital)
-- 3. Organization Members table (role-based association)
-- 4. Subscriptions table (plan_code, status, periods, integer paise amounts, intro tracking)
-- 5. Payments table (internal_order_id, gateway IDs, paise amounts, verification timestamps)
-- 6. Hospital Inquiries table (multi-state commercial pipeline, custom quotes, contract status)
-- 7. Renewal Notifications table (idempotent 7d, 3d, 0d reminders)
-- 8. PostgreSQL Stored Procedures & Central Access Control function
-- 9. Row Level Security policies for complete tenant and role isolation
-- ==============================================================================

-- 1. Profiles Table Enhancements
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS customer_category TEXT CHECK (customer_category IN ('solo_doctor_clinic', 'hospital')),
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone TEXT;

NOTIFY pgrst, 'reload schema';

CREATE INDEX IF NOT EXISTS idx_profiles_customer_category
    ON public.profiles(customer_category);

-- 2. Organizations Entity
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_type TEXT NOT NULL CHECK (organization_type IN ('solo_doctor_clinic', 'hospital')),
    organization_name TEXT NOT NULL,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    registration_number TEXT,
    organization_status TEXT DEFAULT 'pending_verification'
        CHECK (organization_status IN ('pending_verification', 'pending_commercial_review', 'active', 'suspended', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner
    ON public.organizations(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_organizations_type_status
    ON public.organizations(organization_type, organization_status);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Ensure columns exist if table was already created
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS organization_type TEXT,
    ADD COLUMN IF NOT EXISTS organization_name TEXT,
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS registration_number TEXT,
    ADD COLUMN IF NOT EXISTS organization_status TEXT DEFAULT 'pending_verification';

-- 3. Organization Members Entity
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'doctor', 'admin', 'staff')),
    membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'invited', 'suspended', 'removed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner',
    ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_org_members_user
    ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_org
    ON public.organization_members(organization_id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. Subscriptions Entity (Money in integer paise)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL CHECK (plan_code IN ('solo_first_month_500', 'solo_monthly_5000', 'hospital_custom')),
    status TEXT NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN ('pending_payment', 'active', 'grace_period', 'expired', 'suspended', 'cancelled')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    next_billing_amount INTEGER NOT NULL DEFAULT 500000, -- 500000 paise = ₹5,000.00
    currency TEXT NOT NULL DEFAULT 'INR',
    introductory_offer_used BOOLEAN NOT NULL DEFAULT false,
    grace_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT 'solo_monthly_5000',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_payment',
    ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS next_billing_amount INTEGER DEFAULT 500000,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS introductory_offer_used BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_org
    ON public.subscriptions(organization_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period
    ON public.subscriptions(status, current_period_end);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Payments Entity (Money in integer paise)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    internal_order_id TEXT UNIQUE NOT NULL,
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    amount_paise INTEGER NOT NULL, -- 50000 for intro ₹500, 500000 for renewal ₹5,000
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_purpose TEXT NOT NULL CHECK (payment_purpose IN ('introductory_first_month', 'monthly_renewal', 'hospital_contract')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS internal_order_id TEXT,
    ADD COLUMN IF NOT EXISTS gateway_order_id TEXT,
    ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS amount_paise INTEGER,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS payment_purpose TEXT DEFAULT 'introductory_first_month',
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payments_org
    ON public.payments(organization_id);

CREATE INDEX IF NOT EXISTS idx_payments_internal_order
    ON public.payments(internal_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment
    ON public.payments(gateway_payment_id)
    WHERE gateway_payment_id IS NOT NULL;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. Hospital Inquiries Entity
CREATE TABLE IF NOT EXISTS public.hospital_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inquiry_status TEXT NOT NULL DEFAULT 'inquiry_submitted'
        CHECK (inquiry_status IN (
            'inquiry_submitted',
            'contact_initiated',
            'proposal_in_preparation',
            'proposal_sent',
            'contract_approved',
            'awaiting_payment',
            'active',
            'suspended'
        )),
    requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    quoted_amount INTEGER, -- in paise
    contract_status TEXT NOT NULL DEFAULT 'pending' CHECK (contract_status IN ('pending', 'drafted', 'sent', 'signed', 'rejected')),
    assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure all columns exist even if hospital_inquiries was created earlier (e.g., in 07 migration)
ALTER TABLE public.hospital_inquiries
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS contact_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS inquiry_status TEXT DEFAULT 'inquiry_submitted',
    ADD COLUMN IF NOT EXISTS quoted_amount INTEGER,
    ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'hospital_inquiries' AND column_name = 'requirements' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.hospital_inquiries 
        ALTER COLUMN requirements TYPE JSONB 
        USING CASE 
            WHEN requirements IS NULL OR trim(requirements) = '' THEN '{}'::jsonb
            WHEN trim(requirements) LIKE '{%' THEN requirements::jsonb
            ELSE jsonb_build_object('details', requirements)
        END;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hospital_inquiries_org
    ON public.hospital_inquiries(organization_id);

CREATE INDEX IF NOT EXISTS idx_hospital_inquiries_status
    ON public.hospital_inquiries(inquiry_status);

ALTER TABLE public.hospital_inquiries ENABLE ROW LEVEL SECURITY;

-- 7. Renewal Notifications Entity (Idempotent tracking)
CREATE TABLE IF NOT EXISTS public.renewal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    billing_cycle TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('renewal_reminder_7d', 'renewal_reminder_3d', 'renewal_due_0d', 'grace_period_warning')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
    idempotency_key TEXT UNIQUE NOT NULL
);

ALTER TABLE public.renewal_notifications
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
    ADD COLUMN IF NOT EXISTS notification_type TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_renewal_notifications_sub
    ON public.renewal_notifications(subscription_id);

ALTER TABLE public.renewal_notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Helper function: user organizations
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.organization_members
    WHERE user_id = p_user_id AND membership_status = 'active';
$$;

-- Organizations Policies
DROP POLICY IF EXISTS "Members can view their own organizations" ON public.organizations;
CREATE POLICY "Members can view their own organizations"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (
        id IN (SELECT public.get_user_organization_ids(auth.uid()))
        OR owner_user_id = auth.uid()
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Users can insert their own organization during onboarding" ON public.organizations;
CREATE POLICY "Users can insert their own organization during onboarding"
    ON public.organizations FOR INSERT
    TO authenticated
    WITH CHECK (owner_user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Owners and admins can update their organization" ON public.organizations;
CREATE POLICY "Owners and admins can update their organization"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        OR public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
        )
    );

-- Organization Members Policies
DROP POLICY IF EXISTS "Members can view members in their organizations" ON public.organization_members;
CREATE POLICY "Members can view members in their organizations"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
        OR user_id = auth.uid()
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Users can insert their own membership during onboarding" ON public.organization_members;
CREATE POLICY "Users can insert their own membership during onboarding"
    ON public.organization_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- Subscriptions Policies
DROP POLICY IF EXISTS "Members can view their own organization subscriptions" ON public.subscriptions;
CREATE POLICY "Members can view their own organization subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
        OR public.is_super_admin()
    );

-- Payments Policies
DROP POLICY IF EXISTS "Members can view their own organization payments" ON public.payments;
CREATE POLICY "Members can view their own organization payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
        OR public.is_super_admin()
    );

-- Hospital Inquiries Policies
DROP POLICY IF EXISTS "Contact user or members can view hospital inquiry" ON public.hospital_inquiries;
CREATE POLICY "Contact user or members can view hospital inquiry"
    ON public.hospital_inquiries FOR SELECT
    TO authenticated
    USING (
        contact_user_id = auth.uid()
        OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Contact users can insert hospital inquiries" ON public.hospital_inquiries;
CREATE POLICY "Contact users can insert hospital inquiries"
    ON public.hospital_inquiries FOR INSERT
    TO authenticated
    WITH CHECK (contact_user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update hospital inquiries" ON public.hospital_inquiries;
CREATE POLICY "Super admins can update hospital inquiries"
    ON public.hospital_inquiries FOR UPDATE
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Renewal Notifications Policies (Internal/Super admin only)
DROP POLICY IF EXISTS "Only super admins can view renewal notifications" ON public.renewal_notifications;
CREATE POLICY "Only super admins can view renewal notifications"
    ON public.renewal_notifications FOR ALL
    TO authenticated
    USING (public.is_super_admin());

-- ==============================================================================
-- CENTRAL ACCESS CONTROL & AUTHORIZATION FUNCTIONS
-- ==============================================================================

-- 1. Get Account Access Status
-- Evaluates registration completion, category, subscription status, and route destination.
CREATE OR REPLACE FUNCTION public.get_account_access_status(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user UUID := COALESCE(p_user_id, auth.uid());
    v_profile RECORD;
    v_org RECORD;
    v_sub RECORD;
    v_inquiry RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_days_left INTEGER := NULL;
    v_route TEXT;
    v_status TEXT;
    v_can_access BOOLEAN := false;
BEGIN
    IF v_target_user IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'can_access_dashboard', false,
            'route_destination', '/signup'
        );
    END IF;

    -- Check if super admin
    IF public.is_super_admin() THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'role', 'super_admin',
            'can_access_dashboard', true,
            'route_destination', '/mrshahidbabu'
        );
    END IF;

    -- Fetch profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_target_user;
    IF v_profile.id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'profile_completed', false,
            'can_access_dashboard', false,
            'route_destination', '/onboarding/category'
        );
    END IF;

    -- Check Category
    IF v_profile.customer_category IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'customer_category', NULL,
            'profile_completed', false,
            'can_access_dashboard', false,
            'route_destination', '/onboarding/category'
        );
    END IF;

    -- Check Profile Completed
    IF NOT COALESCE(v_profile.profile_completed, false) THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'customer_category', v_profile.customer_category,
            'profile_completed', false,
            'can_access_dashboard', false,
            'route_destination', '/onboarding/profile'
        );
    END IF;

    -- Fetch Organization
    SELECT o.* INTO v_org
    FROM public.organizations o
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE om.user_id = v_target_user AND om.membership_status = 'active'
    ORDER BY o.created_at DESC LIMIT 1;

    -- If Hospital: Check Hospital Commercial Pipeline
    IF v_profile.customer_category = 'hospital' THEN
        SELECT * INTO v_inquiry
        FROM public.hospital_inquiries
        WHERE organization_id = v_org.id OR contact_user_id = v_target_user
        ORDER BY created_at DESC LIMIT 1;

        IF v_inquiry.inquiry_status = 'active' AND v_org.organization_status = 'active' THEN
            RETURN jsonb_build_object(
                'authenticated', true,
                'user_id', v_target_user,
                'customer_category', 'hospital',
                'profile_completed', true,
                'organization_id', v_org.id,
                'organization_name', v_org.organization_name,
                'inquiry_status', v_inquiry.inquiry_status,
                'can_access_dashboard', true,
                'route_destination', '/hospitaldashboard/dashboard'
            );
        ELSE
            RETURN jsonb_build_object(
                'authenticated', true,
                'user_id', v_target_user,
                'customer_category', 'hospital',
                'profile_completed', true,
                'organization_id', v_org.id,
                'organization_name', v_org.organization_name,
                'inquiry_status', COALESCE(v_inquiry.inquiry_status, 'inquiry_submitted'),
                'can_access_dashboard', false,
                'route_destination', '/hospital/inquiry-status'
            );
        END IF;
    END IF;

    -- If Solo Doctor or Clinic: Check Subscription
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE organization_id = v_org.id
    ORDER BY created_at DESC LIMIT 1;

    IF v_sub.id IS NULL OR v_sub.status = 'pending_payment' THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', v_target_user,
            'customer_category', 'solo_doctor_clinic',
            'profile_completed', true,
            'organization_id', v_org.id,
            'subscription_status', 'unpaid',
            'introductory_offer_used', COALESCE(v_sub.introductory_offer_used, false),
            'amount_due_paise', CASE WHEN COALESCE(v_sub.introductory_offer_used, false) THEN 500000 ELSE 50000 END,
            'can_access_dashboard', false,
            'route_destination', CASE WHEN COALESCE(v_sub.introductory_offer_used, false) THEN '/subscription/renew' ELSE '/checkout/intro' END
        );
    END IF;

    -- Active or Grace Period
    IF v_sub.status = 'active' THEN
        IF v_sub.current_period_end > v_now THEN
            v_days_left := EXTRACT(DAY FROM (v_sub.current_period_end - v_now))::INTEGER;
            RETURN jsonb_build_object(
                'authenticated', true,
                'user_id', v_target_user,
                'customer_category', 'solo_doctor_clinic',
                'profile_completed', true,
                'organization_id', v_org.id,
                'subscription_id', v_sub.id,
                'subscription_status', 'active',
                'plan_code', v_sub.plan_code,
                'current_period_start', v_sub.current_period_start,
                'current_period_end', v_sub.current_period_end,
                'days_remaining', v_days_left,
                'next_billing_amount_paise', v_sub.next_billing_amount,
                'can_access_dashboard', true,
                'route_destination', '/doctor'
            );
        ELSE
            -- Past period end: check grace period (e.g. 3 days)
            IF v_sub.grace_period_end IS NOT NULL AND v_sub.grace_period_end > v_now THEN
                RETURN jsonb_build_object(
                    'authenticated', true,
                    'user_id', v_target_user,
                    'customer_category', 'solo_doctor_clinic',
                    'profile_completed', true,
                    'organization_id', v_org.id,
                    'subscription_id', v_sub.id,
                    'subscription_status', 'grace_period',
                    'plan_code', v_sub.plan_code,
                    'current_period_end', v_sub.current_period_end,
                    'grace_period_end', v_sub.grace_period_end,
                    'next_billing_amount_paise', 500000,
                    'can_access_dashboard', true,
                    'warning', 'Your subscription has ended and is in a grace period. Please renew to avoid service restriction.',
                    'route_destination', '/subscription/renew'
                );
            ELSE
                -- Expired
                RETURN jsonb_build_object(
                    'authenticated', true,
                    'user_id', v_target_user,
                    'customer_category', 'solo_doctor_clinic',
                    'profile_completed', true,
                    'organization_id', v_org.id,
                    'subscription_id', v_sub.id,
                    'subscription_status', 'expired',
                    'can_access_dashboard', false,
                    'next_billing_amount_paise', 500000,
                    'route_destination', '/subscription/expired'
                );
            END IF;
        END IF;
    END IF;

    -- Default fallback for expired/suspended/cancelled
    RETURN jsonb_build_object(
        'authenticated', true,
        'user_id', v_target_user,
        'customer_category', 'solo_doctor_clinic',
        'profile_completed', true,
        'subscription_status', v_sub.status,
        'can_access_dashboard', false,
        'route_destination', '/subscription/expired'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_account_access_status(UUID) TO anon, authenticated, service_role;

-- 2. Create Pending Payment Order (Server-enforced amount)
CREATE OR REPLACE FUNCTION public.create_pending_payment(
    p_user_id UUID,
    p_purpose TEXT, -- 'introductory_first_month' or 'monthly_renewal'
    p_gateway_provider TEXT DEFAULT 'mock'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org RECORD;
    v_sub RECORD;
    v_amount_paise INTEGER;
    v_internal_order_id TEXT;
    v_sub_id UUID;
BEGIN
    IF auth.uid() IS NULL OR (p_user_id <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
    END IF;

    -- Fetch user's organization
    SELECT o.* INTO v_org
    FROM public.organizations o
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE om.user_id = p_user_id AND om.membership_status = 'active'
    ORDER BY o.created_at DESC LIMIT 1;

    IF v_org.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No organization found for this user.');
    END IF;

    -- Enforce server-side pricing:
    IF p_purpose = 'introductory_first_month' THEN
        -- Check if introductory offer already used
        IF EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE organization_id = v_org.id AND introductory_offer_used = true
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Introductory 90% discount has already been used for this clinic. Please renew at the standard rate of ₹5,000/mo.'
            );
        END IF;

        v_amount_paise := 50000; -- ₹500.00
    ELSE
        -- Renewal
        v_amount_paise := 500000; -- ₹5,000.00
    END IF;

    -- Get or create subscription record
    SELECT * INTO v_sub FROM public.subscriptions WHERE organization_id = v_org.id ORDER BY created_at DESC LIMIT 1;
    IF v_sub.id IS NULL THEN
        INSERT INTO public.subscriptions (
            organization_id, plan_code, status, next_billing_amount, currency, introductory_offer_used
        ) VALUES (
            v_org.id,
            CASE WHEN p_purpose = 'introductory_first_month' THEN 'solo_first_month_500' ELSE 'solo_monthly_5000' END,
            'pending_payment',
            500000,
            'INR',
            false
        ) RETURNING id INTO v_sub_id;
    ELSE
        v_sub_id := v_sub.id;
    END IF;

    -- Generate unique internal order ID: MTF-ORD-YYYYMMDD-RAND
    v_internal_order_id := 'MTF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::text), 1, 8));

    -- Create pending payment record
    INSERT INTO public.payments (
        organization_id, subscription_id, internal_order_id,
        amount_paise, currency, payment_purpose, payment_status, created_at
    ) VALUES (
        v_org.id, v_sub_id, v_internal_order_id,
        v_amount_paise, 'INR', p_purpose, 'pending', NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'internal_order_id', v_internal_order_id,
        'subscription_id', v_sub_id,
        'organization_id', v_org.id,
        'amount_paise', v_amount_paise,
        'amount_rupees', v_amount_paise / 100,
        'next_billing_amount_rupees', 5000,
        'currency', 'INR',
        'purpose', p_purpose
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pending_payment(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 3. Verify and Activate Payment (Atomic Server-Side Activation)
CREATE OR REPLACE FUNCTION public.verify_and_activate_payment(
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
    v_pay RECORD;
    v_sub RECORD;
    v_org RECORD;
    v_prof RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_grace_end TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_pay FROM public.payments WHERE internal_order_id = p_internal_order_id FOR UPDATE;
    IF v_pay.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment order not found.');
    END IF;

    -- Idempotency check: already completed
    IF v_pay.payment_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'duplicate', true,
            'payment_status', 'completed',
            'internal_order_id', v_pay.internal_order_id,
            'message', 'Payment already verified and active.'
        );
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_pay.subscription_id FOR UPDATE;
    SELECT * INTO v_org FROM public.organizations WHERE id = v_pay.organization_id FOR UPDATE;

    -- Calendar month calculation in Asia/Kolkata timezone:
    -- If currently active, extend from current_period_end; otherwise start from now.
    IF v_sub.status = 'active' AND v_sub.current_period_end > v_now THEN
        v_period_start := v_sub.current_period_start;
        v_period_end := (v_sub.current_period_end AT TIME ZONE 'Asia/Kolkata' + INTERVAL '1 month') AT TIME ZONE 'Asia/Kolkata';
    ELSE
        v_period_start := v_now;
        v_period_end := (v_now AT TIME ZONE 'Asia/Kolkata' + INTERVAL '1 month') AT TIME ZONE 'Asia/Kolkata';
    END IF;

    -- Grace period: 3 days after period end
    v_grace_end := v_period_end + INTERVAL '3 days';

    -- 1. Update Payment Record
    UPDATE public.payments
    SET payment_status = 'completed',
        gateway_order_id = COALESCE(p_gateway_order_id, gateway_order_id),
        gateway_payment_id = COALESCE(p_gateway_payment_id, gateway_payment_id),
        verified_at = v_now
    WHERE id = v_pay.id;

    -- 2. Update Subscription Record
    UPDATE public.subscriptions
    SET status = 'active',
        plan_code = CASE WHEN v_pay.payment_purpose = 'introductory_first_month' THEN 'solo_first_month_500' ELSE 'solo_monthly_5000' END,
        current_period_start = v_period_start,
        current_period_end = v_period_end,
        grace_period_end = v_grace_end,
        next_billing_amount = 500000, -- ₹5,000 for all subsequent renewals
        introductory_offer_used = true,
        updated_at = v_now
    WHERE id = v_sub.id;

    -- 3. Update Organization Status
    UPDATE public.organizations
    SET organization_status = 'active', updated_at = v_now
    WHERE id = v_org.id;

    -- 4. Sync with existing hospital / doctor tables if applicable
    UPDATE public.profiles
    SET onboarding_status = 'ACTIVE', updated_at = v_now
    WHERE id = v_org.owner_user_id;

    UPDATE public.doctor_details
    SET onboarding_status = 'ACTIVE', is_active = true, updated_at = v_now
    WHERE id = v_org.owner_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'internal_order_id', v_pay.internal_order_id,
        'payment_status', 'completed',
        'subscription_id', v_sub.id,
        'current_period_start', v_period_start,
        'current_period_end', v_period_end,
        'next_billing_amount_rupees', 5000,
        'message', 'Subscription successfully activated.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_activate_payment(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 4. Submit Hospital Inquiry
CREATE OR REPLACE FUNCTION public.submit_hospital_inquiry(
    p_user_id UUID,
    p_hospital_name TEXT,
    p_contact_person TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_requirements JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_inquiry_id UUID;
BEGIN
    IF auth.uid() IS NULL OR (p_user_id <> auth.uid() AND NOT public.is_super_admin()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized.');
    END IF;

    -- Check if organization already exists for this owner
    SELECT id INTO v_org_id FROM public.organizations WHERE owner_user_id = p_user_id LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (
            organization_type, organization_name, owner_user_id,
            address, city, state, organization_status
        ) VALUES (
            'hospital', p_hospital_name, p_user_id,
            p_address, p_city, p_state, 'pending_commercial_review'
        ) RETURNING id INTO v_org_id;

        INSERT INTO public.organization_members (organization_id, user_id, role, membership_status)
        VALUES (v_org_id, p_user_id, 'owner', 'active')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    ELSE
        UPDATE public.organizations
        SET organization_name = p_hospital_name,
            address = COALESCE(p_address, address),
            city = COALESCE(p_city, city),
            state = COALESCE(p_state, state),
            organization_status = 'pending_commercial_review',
            updated_at = NOW()
        WHERE id = v_org_id;
    END IF;

    -- Update user profile
    UPDATE public.profiles
    SET customer_category = 'hospital',
        profile_completed = true,
        full_name = p_contact_person,
        phone = p_phone,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Insert or update Hospital Inquiry
    INSERT INTO public.hospital_inquiries (
        organization_id, contact_user_id, inquiry_status, requirements, contract_status
    ) VALUES (
        v_org_id, p_user_id, 'inquiry_submitted', p_requirements, 'pending'
    ) RETURNING id INTO v_inquiry_id;

    RETURN jsonb_build_object(
        'success', true,
        'inquiry_id', v_inquiry_id,
        'organization_id', v_org_id,
        'inquiry_status', 'inquiry_submitted',
        'message', 'Hospital inquiry submitted successfully. Pending commercial review.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_hospital_inquiry(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- 5. Admin Review Hospital Inquiry (Super Admin only)
CREATE OR REPLACE FUNCTION public.admin_update_hospital_inquiry(
    p_inquiry_id UUID,
    p_inquiry_status TEXT,
    p_quoted_amount_paise INTEGER DEFAULT NULL,
    p_contract_status TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inq RECORD;
BEGIN
    IF NOT public.is_super_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Requires administrative privileges.');
    END IF;

    SELECT * INTO v_inq FROM public.hospital_inquiries WHERE id = p_inquiry_id FOR UPDATE;
    IF v_inq.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Inquiry not found.');
    END IF;

    UPDATE public.hospital_inquiries
    SET inquiry_status = COALESCE(p_inquiry_status, inquiry_status),
        quoted_amount = COALESCE(p_quoted_amount_paise, quoted_amount),
        contract_status = COALESCE(p_contract_status, contract_status),
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        assigned_admin_id = auth.uid(),
        updated_at = NOW()
    WHERE id = p_inquiry_id;

    -- If inquiry status set to active, activate the organization
    IF p_inquiry_status = 'active' THEN
        UPDATE public.organizations
        SET organization_status = 'active', updated_at = NOW()
        WHERE id = v_inq.organization_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'inquiry_id', p_inquiry_id,
        'inquiry_status', COALESCE(p_inquiry_status, v_inq.inquiry_status)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_hospital_inquiry(UUID, TEXT, INTEGER, TEXT, TEXT) TO authenticated, service_role;

-- 6. Automated Subscription Lifecycle & Renewal Job
-- Scans subscriptions for 7-day reminder, 3-day reminder, renewal date, and grace period expiry.
CREATE OR REPLACE FUNCTION public.process_subscription_renewals_and_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_sub RECORD;
    v_cycle TEXT;
    v_reminders_7d INTEGER := 0;
    v_reminders_3d INTEGER := 0;
    v_reminders_0d INTEGER := 0;
    v_expired_count INTEGER := 0;
BEGIN
    -- 1. Identify 7-day reminders
    FOR v_sub IN
        SELECT s.*, o.organization_name
        FROM public.subscriptions s
        JOIN public.organizations o ON o.id = s.organization_id
        WHERE s.status = 'active'
          AND s.current_period_end BETWEEN v_now AND (v_now + INTERVAL '7 days')
    LOOP
        v_cycle := TO_CHAR(v_sub.current_period_end, 'YYYY-MM');
        INSERT INTO public.renewal_notifications (
            subscription_id, billing_cycle, notification_type, scheduled_at, delivery_status, idempotency_key
        ) VALUES (
            v_sub.id, v_cycle, 'renewal_reminder_7d', v_now, 'pending',
            'sub_' || v_sub.id || '_cycle_' || v_cycle || '_7d'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        v_reminders_7d := v_reminders_7d + 1;
    END LOOP;

    -- 2. Identify 3-day reminders
    FOR v_sub IN
        SELECT s.*, o.organization_name
        FROM public.subscriptions s
        JOIN public.organizations o ON o.id = s.organization_id
        WHERE s.status = 'active'
          AND s.current_period_end BETWEEN v_now AND (v_now + INTERVAL '3 days')
    LOOP
        v_cycle := TO_CHAR(v_sub.current_period_end, 'YYYY-MM');
        INSERT INTO public.renewal_notifications (
            subscription_id, billing_cycle, notification_type, scheduled_at, delivery_status, idempotency_key
        ) VALUES (
            v_sub.id, v_cycle, 'renewal_reminder_3d', v_now, 'pending',
            'sub_' || v_sub.id || '_cycle_' || v_cycle || '_3d'
        ) ON CONFLICT (idempotency_key) DO NOTHING;
        v_reminders_3d := v_reminders_3d + 1;
    END LOOP;

    -- 3. Identify past grace period -> transition to expired
    FOR v_sub IN
        SELECT * FROM public.subscriptions
        WHERE status IN ('active', 'grace_period')
          AND current_period_end < v_now
          AND (grace_period_end IS NULL OR grace_period_end < v_now)
    LOOP
        UPDATE public.subscriptions
        SET status = 'expired', updated_at = v_now
        WHERE id = v_sub.id;

        UPDATE public.organizations
        SET organization_status = 'suspended', updated_at = v_now
        WHERE id = v_sub.organization_id;

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'reminders_7d_scheduled', v_reminders_7d,
        'reminders_3d_scheduled', v_reminders_3d,
        'subscriptions_expired', v_expired_count,
        'timestamp', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_subscription_renewals_and_reminders() TO service_role;
