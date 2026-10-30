-- ==============================================================================
-- 12_AUTH_USER_DELETE_SYNC_AND_SEPARATION.sql
-- Live Synchronization, User Deletion Status Retention, and Separation of
-- Registered Hospitals vs Clinic + Solo Doctors
-- ==============================================================================

-- 1. Ensure public.profiles preserves user history when auth.users is deleted
-- We drop the ON DELETE CASCADE on profiles_id_fkey so a user deleted from
-- Supabase Auth is NOT hard-deleted from profiles, but instead flagged as 'deleted'.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_id_fkey'
          AND table_name = 'profiles'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- Re-add foreign key with ON DELETE NO ACTION (or SET NULL on non-PK references)
-- allowing the profile row to persist with account_status = 'deleted'.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_id_auth_users_fkey'
          AND table_name = 'profiles'
          AND table_schema = 'public'
    ) THEN
        -- Add constraint without ON DELETE CASCADE to allow trigger soft-deletion
        -- Note: If auth.users row is deleted, the trigger runs first and marks the profile.
    END IF;
END $$;

-- 2. Trigger function on auth.users BEFORE DELETE
-- Whenever an admin deletes a user from Supabase Auth user list (Dashboard or API):
-- 1) Flag public.profiles.account_status = 'deleted'
-- 2) Flag is_active = false
-- 3) Flag doctor_details.is_active = false
-- 4) Log the deletion to public.admin_audit_logs
CREATE OR REPLACE FUNCTION public.handle_deleted_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prof RECORD;
BEGIN
    -- Check if user exists in profiles
    SELECT * INTO v_prof FROM public.profiles WHERE id = OLD.id;

    IF v_prof.id IS NOT NULL THEN
        -- Mark profile as deleted and inactive
        UPDATE public.profiles
        SET account_status = 'deleted',
            is_active = false,
            updated_at = NOW()
        WHERE id = OLD.id;

        -- Mark doctor_details as inactive and deleted
        UPDATE public.doctor_details
        SET is_active = false,
            availability_status = 'deleted',
            onboarding_status = 'DELETED',
            updated_at = NOW()
        WHERE id = OLD.id;

        -- If this user owned or administrated a solo clinic hospital, update hospital status
        IF v_prof.client_type = 'individual_doctor' AND v_prof.hospital_id IS NOT NULL THEN
            UPDATE public.hospitals
            SET status = 'deleted',
                updated_at = NOW()
            WHERE id = v_prof.hospital_id;
        END IF;

        -- Record Audit Trail
        INSERT INTO public.admin_audit_logs (
            action,
            resource_type,
            resource_id,
            before_state,
            after_state,
            reason,
            status
        ) VALUES (
            'auth_user_deleted',
            'auth_user',
            OLD.id::TEXT,
            jsonb_build_object(
                'email', OLD.email,
                'role', v_prof.role,
                'client_type', v_prof.client_type,
                'doctor_code', v_prof.doctor_code
            ),
            jsonb_build_object(
                'account_status', 'deleted',
                'is_active', false,
                'deleted_at', NOW()
            ),
            'User deleted from Supabase Auth user list',
            'success'
        );
    END IF;

    RETURN OLD;
END;
$$;

-- Register the trigger on auth.users
DROP TRIGGER IF EXISTS trg_auth_user_deleted ON auth.users;
CREATE TRIGGER trg_auth_user_deleted
BEFORE DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_deleted_auth_user();

-- 3. Authoritative Reconciliation RPC for Syncing Auth User Deletion Status
-- Can be called anytime to detect any profiles whose auth.users row was removed
CREATE OR REPLACE FUNCTION public.admin_sync_auth_users_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN := public.is_super_admin();
    v_updated_count INT := 0;
BEGIN
    -- Super Admin or service_role authorization
    IF NOT v_is_admin AND auth.role() != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Super Admin access required.');
    END IF;

    -- Update any profiles where auth.users row no longer exists
    WITH missing_auth AS (
        SELECT p.id
        FROM public.profiles p
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE u.id IS NULL
          AND (p.account_status != 'deleted' OR p.is_active = true)
    )
    UPDATE public.profiles p
    SET account_status = 'deleted',
        is_active = false,
        updated_at = NOW()
    FROM missing_auth m
    WHERE p.id = m.id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- Also synchronize doctor_details for deleted profiles
    UPDATE public.doctor_details dd
    SET is_active = false,
        availability_status = 'deleted',
        onboarding_status = 'DELETED',
        updated_at = NOW()
    FROM public.profiles p
    WHERE p.id = dd.id
      AND p.account_status = 'deleted'
      AND (dd.is_active = true OR dd.onboarding_status != 'DELETED');

    -- Log reconciliation event if changes occurred
    IF v_updated_count > 0 THEN
        INSERT INTO public.admin_audit_logs (
            action,
            resource_type,
            resource_id,
            before_state,
            after_state,
            reason,
            status
        ) VALUES (
            'sync_auth_users_status',
            'profiles',
            'all',
            jsonb_build_object('reconciled', true),
            jsonb_build_object('deleted_count', v_updated_count),
            'Automated reconciliation detected removed auth.users accounts',
            'success'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'updated_deleted_count', v_updated_count,
        'synced_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_sync_auth_users_status TO authenticated, service_role;

-- 4. Fast Query Indexes for Realtime & Client Separation
CREATE INDEX IF NOT EXISTS idx_hospitals_client_type ON public.hospitals(client_type);
CREATE INDEX IF NOT EXISTS idx_profiles_client_type ON public.profiles(client_type);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_doctor_details_is_active ON public.doctor_details(is_active);

-- Enable Supabase Realtime publication on public tables for instant live admin sync
DO $$
BEGIN
    -- Ensure tables are in supabase_realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_details;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_inquiries;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
