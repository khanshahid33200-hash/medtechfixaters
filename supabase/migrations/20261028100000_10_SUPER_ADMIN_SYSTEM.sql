-- ==============================================================================
-- 10_SUPER_ADMIN_SYSTEM.sql
-- MedTechFixaters Super Admin Architecture, Transaction Management,
-- Doctor Management, Fee Exemptions, Activity Audit Logging & Revenue Analytics
--
-- Complies with Supabase Postgres Best Practices:
-- - Uses (select auth.uid()) for optimal RLS query caching
-- - Restricts roles TO authenticated / service_role
-- - Enforces server-side authorization and SECURITY DEFINER search_path = public
-- - Append-only immutable audit logs
-- - Preserves existing data, users, and onboarding flows
-- ==============================================================================

-- 1. TRANSACTION MANAGEMENT TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_transaction_id TEXT UNIQUE NOT NULL,
    provider_name TEXT NOT NULL DEFAULT 'cashfree',
    provider_order_id TEXT NOT NULL,
    provider_session_id TEXT,
    provider_payment_id TEXT,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    account_email TEXT NOT NULL,
    amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method TEXT DEFAULT 'upi',
    payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded', 'under_review')),
    provider_reference TEXT,
    provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    webhook_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    reconciliation_status TEXT DEFAULT 'none'
        CHECK (reconciliation_status IN ('none', 'reconciled', 'discrepancy_flagged', 'manually_approved')),
    reconciliation_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    initiated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Performance & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_doctor
    ON public.payment_transactions(doctor_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_email
    ON public.payment_transactions(account_email);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
    ON public.payment_transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order
    ON public.payment_transactions(provider_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_initiated
    ON public.payment_transactions(initiated_at DESC);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_transactions
DROP POLICY IF EXISTS "Super admins have full access to transactions" ON public.payment_transactions;
CREATE POLICY "Super admins have full access to transactions"
    ON public.payment_transactions FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Doctors can view their own transactions" ON public.payment_transactions;
CREATE POLICY "Doctors can view their own transactions"
    ON public.payment_transactions FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = doctor_id);

DROP POLICY IF EXISTS "Doctors can insert initial pending transaction" ON public.payment_transactions;
CREATE POLICY "Doctors can insert initial pending transaction"
    ON public.payment_transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        ((select auth.uid()) = doctor_id AND payment_status = 'pending')
        OR public.is_super_admin()
    );

-- 2. EXTEND PROFILES FOR DOCTOR FEE EXEMPTIONS & ADMIN CONTROLS
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS platform_fee_exempt BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS exemption_reason TEXT,
    ADD COLUMN IF NOT EXISTS exempted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS exempted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS exemption_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_platform_fee_exempt
    ON public.profiles(platform_fee_exempt)
    WHERE platform_fee_exempt = true;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
    ON public.profiles(account_status);

-- Update Role and Exemption Guardrail Trigger
CREATE OR REPLACE FUNCTION public.enforce_role_change_guardrail()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Super admins and service role have full authorization
    IF current_user NOT IN ('authenticated', 'anon') OR public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    -- Block non-super-admins from changing roles, exemption, status, and sensitive attributes
    IF TG_OP = 'UPDATE' AND (
        NEW.role IS DISTINCT FROM OLD.role
        OR NEW.platform_fee_exempt IS DISTINCT FROM OLD.platform_fee_exempt
        OR NEW.exemption_reason IS DISTINCT FROM OLD.exemption_reason
        OR NEW.exempted_by IS DISTINCT FROM OLD.exempted_by
        OR NEW.exempted_at IS DISTINCT FROM OLD.exempted_at
        OR NEW.hospital_id IS DISTINCT FROM OLD.hospital_id
        OR NEW.account_status IS DISTINCT FROM OLD.account_status
        OR NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status
        OR NEW.client_type IS DISTINCT FROM OLD.client_type
        OR NEW.doctor_code IS DISTINCT FROM OLD.doctor_code
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.department_id IS DISTINCT FROM OLD.department_id
    ) THEN
        RAISE EXCEPTION 'Privileged field modification rejected: administrative authorization required.' USING ERRCODE = '42501';
    END IF;

    -- On INSERT, ordinary users cannot set themselves as super_admin or fee exempt
    IF TG_OP = 'INSERT' AND (
        NEW.role = 'super_admin'
        OR NEW.platform_fee_exempt = true
    ) THEN
        RAISE EXCEPTION 'Privileged role or fee exemption cannot be self-assigned.' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_role_change_guardrail ON public.profiles;
CREATE TRIGGER trg_enforce_role_change_guardrail
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_role_change_guardrail();

-- 3. IMMUTABLE ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT NOT NULL DEFAULT 'super_admin',
    target_id TEXT,
    target_type TEXT NOT NULL
        CHECK (target_type IN ('doctor', 'transaction', 'system', 'fee_exemption', 'auth', 'payment', 'hospital')),
    action TEXT NOT NULL,
    previous_state JSONB DEFAULT '{}'::jsonb,
    new_state JSONB DEFAULT '{}'::jsonb,
    reason TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    result TEXT NOT NULL DEFAULT 'success' CHECK (result IN ('success', 'failure', 'pending')),
    request_correlation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing for Audit Trail
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor
    ON public.admin_audit_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target
    ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_action
    ON public.admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
    ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Super admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Super admins can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_super_admin());

-- Strictly IMMUTABLE: Revoke UPDATE and DELETE from all standard database roles
REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_audit_logs FROM authenticated, anon, public;

-- Helper function to record audit event
CREATE OR REPLACE FUNCTION public.log_admin_audit_event(
    p_action TEXT,
    p_target_type TEXT,
    p_target_id TEXT,
    p_previous_state JSONB DEFAULT '{}'::jsonb,
    p_new_state JSONB DEFAULT '{}'::jsonb,
    p_reason TEXT DEFAULT NULL,
    p_evidence JSONB DEFAULT '{}'::jsonb,
    p_result TEXT DEFAULT 'success',
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_correlation_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT;
    v_actor_role TEXT := 'super_admin';
    v_log_id UUID;
BEGIN
    IF v_actor_id IS NOT NULL THEN
        SELECT email, role INTO v_actor_email, v_actor_role
        FROM public.profiles
        WHERE id = v_actor_id;
    END IF;

    INSERT INTO public.admin_audit_logs (
        actor_id, actor_email, actor_role, target_id, target_type,
        action, previous_state, new_state, reason, evidence,
        ip_address, user_agent, result, request_correlation_id, created_at
    ) VALUES (
        v_actor_id, v_actor_email, COALESCE(v_actor_role, 'super_admin'),
        p_target_id, p_target_type, p_action, p_previous_state, p_new_state,
        p_reason, p_evidence, p_ip_address, p_user_agent, p_result,
        COALESCE(p_correlation_id, gen_random_uuid()::text), NOW()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_audit_event TO authenticated, service_role;

-- 4. VERIFY & RECONCILE PAYMENT (Authoritative Provider Evidence Enforcement)
CREATE OR REPLACE FUNCTION public.admin_verify_and_reconcile_transaction(
    p_internal_order_id TEXT,
    p_provider_order_id TEXT,
    p_provider_payment_id TEXT,
    p_provider_status TEXT, -- 'SUCCESS', 'FAILED', 'PENDING', 'USER_DROPPED'
    p_amount_paise INTEGER,
    p_currency TEXT DEFAULT 'INR',
    p_payment_method TEXT DEFAULT 'unknown',
    p_action TEXT DEFAULT 'verify', -- 'verify', 'manual_approve', 'resolve_failed'
    p_review_notes TEXT DEFAULT NULL,
    p_provider_evidence JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_admin BOOLEAN := public.is_super_admin();
    v_tx RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_new_status TEXT;
    v_act_res JSONB := '{}'::jsonb;
    v_audit_id UUID;
BEGIN
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Super Admin access required.');
    END IF;

    -- Fetch or create payment transaction entry
    SELECT * INTO v_tx
    FROM public.payment_transactions
    WHERE internal_transaction_id = p_internal_order_id
       OR provider_order_id = p_provider_order_id
    LIMIT 1;

    -- Determine new status based strictly on authoritative provider evidence
    IF UPPER(p_provider_status) IN ('SUCCESS', 'PAID', 'COMPLETED') THEN
        -- Strictly verify expected amount matches
        IF v_tx.id IS NOT NULL AND v_tx.amount_paise > 0 AND v_tx.amount_paise <> p_amount_paise THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Reconciliation discrepancy: Provider paid amount (' || p_amount_paise || ') does not match expected transaction amount (' || v_tx.amount_paise || ').'
            );
        END IF;
        v_new_status := 'completed';
    ELSIF UPPER(p_provider_status) IN ('FAILED', 'CANCELLED', 'USER_DROPPED') THEN
        v_new_status := 'failed';
    ELSIF UPPER(p_provider_status) IN ('REFUNDED') THEN
        v_new_status := 'refunded';
    ELSE
        v_new_status := 'under_review';
    END IF;

    -- Upsert transaction record
    IF v_tx.id IS NULL THEN
        INSERT INTO public.payment_transactions (
            internal_transaction_id, provider_order_id, provider_payment_id,
            amount_paise, currency, payment_method, payment_status,
            provider_reference, provider_response, review_notes,
            reviewed_by, reviewed_at, reconciliation_status,
            reconciliation_evidence, initiated_at, updated_at
        ) VALUES (
            p_internal_order_id, p_provider_order_id, p_provider_payment_id,
            p_amount_paise, p_currency, p_payment_method, v_new_status,
            p_provider_payment_id, p_provider_evidence, p_review_notes,
            v_caller, v_now,
            CASE WHEN p_action = 'manual_approve' THEN 'manually_approved' ELSE 'reconciled' END,
            p_provider_evidence, v_now, v_now
        ) RETURNING * INTO v_tx;
    ELSE
        UPDATE public.payment_transactions
        SET provider_payment_id = COALESCE(p_provider_payment_id, provider_payment_id),
            payment_status = v_new_status,
            provider_response = provider_response || p_provider_evidence,
            review_notes = COALESCE(p_review_notes, review_notes),
            reviewed_by = v_caller,
            reviewed_at = v_now,
            reconciliation_status = CASE WHEN p_action = 'manual_approve' THEN 'manually_approved' ELSE 'reconciled' END,
            reconciliation_evidence = p_provider_evidence,
            updated_at = v_now
        WHERE id = v_tx.id
        RETURNING * INTO v_tx;
    END IF;

    -- If verified completed, trigger atomic activation workflow
    IF v_new_status = 'completed' THEN
        v_act_res := public.verify_and_activate_payment_v2(
            p_internal_order_id,
            p_provider_order_id,
            COALESCE(p_provider_payment_id, 'VERIFIED-ADMIN-' || v_tx.id),
            'ADMIN_AUTHORITATIVE_VERIFICATION',
            'admin_reconcile_' || v_caller
        );
    END IF;

    -- Record in Immutable Audit Log
    v_audit_id := public.log_admin_audit_event(
        'reconcile_transaction',
        'transaction',
        v_tx.id::text,
        jsonb_build_object('previous_status', v_tx.payment_status),
        jsonb_build_object('new_status', v_new_status, 'provider_status', p_provider_status, 'action', p_action),
        p_review_notes,
        p_provider_evidence,
        'success'
    );

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx.id,
        'status', v_new_status,
        'activation_result', v_act_res,
        'audit_log_id', v_audit_id,
        'message', 'Transaction status reconciled to ' || v_new_status || '.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_and_reconcile_transaction TO authenticated, service_role;

-- 5. ADMIN ACTIVATE FEE-EXEMPT DOCTOR ACCOUNT
CREATE OR REPLACE FUNCTION public.admin_activate_exempt_doctor(
    p_doctor_id UUID,
    p_exemption_reason TEXT,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_admin BOOLEAN := public.is_super_admin();
    v_prof RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_audit_id UUID;
BEGIN
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Super Admin access required.');
    END IF;

    SELECT * INTO v_prof FROM public.profiles WHERE id = p_doctor_id;
    IF v_prof.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor profile not found.');
    END IF;

    -- Update Profile with Exemption
    UPDATE public.profiles
    SET platform_fee_exempt = true,
        exemption_reason = p_exemption_reason,
        exempted_by = v_caller,
        exempted_at = v_now,
        exemption_expires_at = p_expires_at,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        onboarding_status = 'ACTIVE',
        account_status = 'active',
        is_active = true,
        updated_at = v_now
    WHERE id = p_doctor_id;

    -- Complete onboarding profile step state
    UPDATE public.onboarding_profiles
    SET onboarding_status = 'completed',
        current_step = 'completed',
        onboarding_completed_at = v_now,
        updated_at = v_now
    WHERE user_id = p_doctor_id;

    -- Audit Log
    v_audit_id := public.log_admin_audit_event(
        'grant_fee_exemption',
        'doctor',
        p_doctor_id::text,
        jsonb_build_object('fee_exempt', v_prof.platform_fee_exempt, 'onboarding_status', v_prof.onboarding_status),
        jsonb_build_object('fee_exempt', true, 'exemption_reason', p_exemption_reason, 'expires_at', p_expires_at),
        p_exemption_reason,
        jsonb_build_object('admin_notes', p_admin_notes),
        'success'
    );

    RETURN jsonb_build_object(
        'success', true,
        'doctor_id', p_doctor_id,
        'platform_fee_exempt', true,
        'onboarding_status', 'ACTIVE',
        'message', 'Doctor account successfully granted platform fee exemption and activated.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_activate_exempt_doctor TO authenticated, service_role;

-- 6. ADMIN UPDATE DOCTOR ACCOUNT STATUS (Suspend, Ban, Unban, Soft Delete)
CREATE OR REPLACE FUNCTION public.admin_set_doctor_status(
    p_doctor_id UUID,
    p_new_status TEXT, -- 'active', 'suspended', 'banned', 'deleted'
    p_reason TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_admin BOOLEAN := public.is_super_admin();
    v_prof RECORD;
    v_is_active BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Super Admin access required.');
    END IF;

    IF p_new_status NOT IN ('active', 'suspended', 'banned', 'deleted') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status. Must be active, suspended, banned, or deleted.');
    END IF;

    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A valid reason (minimum 5 characters) is required for audit compliance.');
    END IF;

    SELECT * INTO v_prof FROM public.profiles WHERE id = p_doctor_id;
    IF v_prof.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor profile not found.');
    END IF;

    v_is_active := (p_new_status = 'active');

    -- Update Profile
    UPDATE public.profiles
    SET account_status = p_new_status,
        is_active = v_is_active,
        admin_notes = CASE
            WHEN p_admin_notes IS NOT NULL THEN p_admin_notes
            ELSE admin_notes
        END,
        updated_at = v_now
    WHERE id = p_doctor_id;

    -- Also update doctor_details availability
    UPDATE public.doctor_details
    SET is_active = v_is_active,
        availability_status = CASE WHEN v_is_active THEN 'active' ELSE 'offline' END,
        updated_at = v_now
    WHERE id = p_doctor_id;

    -- Record Audit Trail
    PERFORM public.log_admin_audit_event(
        'update_doctor_account_status',
        'doctor',
        p_doctor_id::text,
        jsonb_build_object('account_status', v_prof.account_status, 'is_active', v_prof.is_active),
        jsonb_build_object('account_status', p_new_status, 'is_active', v_is_active),
        p_reason,
        jsonb_build_object('admin_notes', p_admin_notes),
        'success'
    );

    RETURN jsonb_build_object(
        'success', true,
        'doctor_id', p_doctor_id,
        'account_status', p_new_status,
        'is_active', v_is_active,
        'message', 'Doctor account status successfully changed to ' || p_new_status || '.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_doctor_status TO authenticated, service_role;

-- 7. REVENUE ANALYTICS REPORTING RPC (Authoritative Verified Calculations)
CREATE OR REPLACE FUNCTION public.get_revenue_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN := public.is_super_admin();
    v_start TIMESTAMPTZ := COALESCE(p_start_date, (NOW() - INTERVAL '30 days'));
    v_end TIMESTAMPTZ := COALESCE(p_end_date, NOW());
    v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
    v_this_month_start TIMESTAMPTZ := date_trunc('month', NOW());
    v_prev_month_start TIMESTAMPTZ := date_trunc('month', NOW() - INTERVAL '1 month');
    v_prev_month_end TIMESTAMPTZ := v_this_month_start - INTERVAL '1 microsecond';

    v_total_revenue BIGINT := 0;
    v_today_revenue BIGINT := 0;
    v_this_month_revenue BIGINT := 0;
    v_prev_month_revenue BIGINT := 0;
    v_success_count INT := 0;
    v_failed_count INT := 0;
    v_pending_count INT := 0;
    v_refund_total BIGINT := 0;
    v_avg_amount INT := 0;
    v_daily_breakdown JSONB;
    v_status_breakdown JSONB;
    v_method_breakdown JSONB;
BEGIN
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Super Admin access required.');
    END IF;

    -- 1. Total Verified Revenue (Completed transactions in paise)
    SELECT COALESCE(SUM(amount_paise), 0), COUNT(id)
    INTO v_total_revenue, v_success_count
    FROM public.payment_transactions
    WHERE payment_status = 'completed';

    -- 2. Today's Verified Revenue
    SELECT COALESCE(SUM(amount_paise), 0)
    INTO v_today_revenue
    FROM public.payment_transactions
    WHERE payment_status = 'completed'
      AND initiated_at >= v_today_start;

    -- 3. Current Month Revenue
    SELECT COALESCE(SUM(amount_paise), 0)
    INTO v_this_month_revenue
    FROM public.payment_transactions
    WHERE payment_status = 'completed'
      AND initiated_at >= v_this_month_start;

    -- 4. Previous Month Revenue
    SELECT COALESCE(SUM(amount_paise), 0)
    INTO v_prev_month_revenue
    FROM public.payment_transactions
    WHERE payment_status = 'completed'
      AND initiated_at >= v_prev_month_start
      AND initiated_at <= v_prev_month_end;

    -- 5. Failed & Pending Counts
    SELECT COUNT(id) INTO v_failed_count
    FROM public.payment_transactions
    WHERE payment_status IN ('failed', 'cancelled');

    SELECT COUNT(id) INTO v_pending_count
    FROM public.payment_transactions
    WHERE payment_status IN ('pending', 'under_review');

    -- 6. Refunds Total
    SELECT COALESCE(SUM(amount_paise), 0) INTO v_refund_total
    FROM public.payment_transactions
    WHERE payment_status = 'refunded';

    -- 7. Average Successful Payment Amount
    IF v_success_count > 0 THEN
        v_avg_amount := (v_total_revenue / v_success_count)::INT;
    END IF;

    -- 8. Daily Verified Revenue Breakdown (within requested date range)
    SELECT jsonb_agg(d_row)
    INTO v_daily_breakdown
    FROM (
        SELECT
            TO_CHAR(date_trunc('day', initiated_at), 'YYYY-MM-DD') AS date,
            COALESCE(SUM(amount_paise), 0) AS revenue_paise,
            COUNT(id) AS transaction_count
        FROM public.payment_transactions
        WHERE payment_status = 'completed'
          AND initiated_at >= v_start
          AND initiated_at <= v_end
        GROUP BY date_trunc('day', initiated_at)
        ORDER BY date_trunc('day', initiated_at) ASC
    ) d_row;

    -- 9. Status Breakdown
    SELECT jsonb_agg(s_row)
    INTO v_status_breakdown
    FROM (
        SELECT
            payment_status AS status,
            COUNT(id) AS count,
            COALESCE(SUM(amount_paise), 0) AS total_paise
        FROM public.payment_transactions
        GROUP BY payment_status
    ) s_row;

    -- 10. Payment Method Breakdown
    SELECT jsonb_agg(m_row)
    INTO v_method_breakdown
    FROM (
        SELECT
            COALESCE(payment_method, 'other') AS method,
            COUNT(id) AS count,
            COALESCE(SUM(amount_paise), 0) AS total_paise
        FROM public.payment_transactions
        WHERE payment_status = 'completed'
        GROUP BY COALESCE(payment_method, 'other')
    ) m_row;

    RETURN jsonb_build_object(
        'success', true,
        'currency', 'INR',
        'total_revenue_paise', v_total_revenue,
        'today_revenue_paise', v_today_revenue,
        'current_month_revenue_paise', v_this_month_revenue,
        'prev_month_revenue_paise', v_prev_month_revenue,
        'net_revenue_paise', (v_total_revenue - v_refund_total),
        'refund_total_paise', v_refund_total,
        'successful_payment_count', v_success_count,
        'failed_payment_count', v_failed_count,
        'pending_payment_count', v_pending_count,
        'avg_payment_amount_paise', v_avg_amount,
        'daily_breakdown', COALESCE(v_daily_breakdown, '[]'::jsonb),
        'status_breakdown', COALESCE(v_status_breakdown, '[]'::jsonb),
        'method_breakdown', COALESCE(v_method_breakdown, '[]'::jsonb),
        'generated_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_revenue_analytics TO authenticated, service_role;

-- 8. IDEMPOTENT SUPER ADMIN ACCOUNT PROVISIONING PROCEDURE
-- Connects or assigns permanent super_admin role to mrshahidbabu / shahidbcsm@gmail.com
CREATE OR REPLACE FUNCTION public.admin_provision_super_admin(
    p_email TEXT DEFAULT 'shahidbcsm@gmail.com',
    p_username TEXT DEFAULT 'mrshahidbabu',
    p_full_name TEXT DEFAULT 'Shahid Babu (Super Admin)'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_existing_profile RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE LOWER(email) = LOWER(p_email)
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'requires_auth_creation', true,
            'email', p_email,
            'username', p_username,
            'message', 'User account not found in auth.users. Please create user via Supabase Auth Admin API or sign-up flow, then re-run to confirm super_admin assignment.'
        );
    END IF;

    -- Upsert profile with permanent super_admin role
    INSERT INTO public.profiles (
        id, email, username, full_name, role,
        is_active, account_status, onboarding_status,
        created_at, updated_at
    ) VALUES (
        v_user_id, LOWER(p_email), p_username, p_full_name, 'super_admin',
        true, 'active', 'ACTIVE',
        v_now, v_now
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin',
        username = COALESCE(public.profiles.username, EXCLUDED.username),
        full_name = EXCLUDED.full_name,
        is_active = true,
        account_status = 'active',
        onboarding_status = 'ACTIVE',
        updated_at = v_now;

    -- Update auth.users user_metadata for sync
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'role', 'super_admin',
        'username', p_username,
        'full_name', p_full_name
    ),
    raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
        'role', 'super_admin'
    )
    WHERE id = v_user_id;

    -- Record audit log
    PERFORM public.log_admin_audit_event(
        'provision_super_admin',
        'auth',
        v_user_id::text,
        '{}'::jsonb,
        jsonb_build_object('email', p_email, 'role', 'super_admin', 'username', p_username),
        'System initialization / Super Admin provisioning',
        '{}'::jsonb,
        'success'
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', p_email,
        'username', p_username,
        'role', 'super_admin',
        'message', 'Super Admin account successfully provisioned and verified.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_provision_super_admin TO authenticated, service_role;

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
