-- ============================================================================
-- MEDTECH FIXATERS — AUDIT LOGS + USERS & ROLES (Phase 3)
-- Domain: https://www.medtechfixaters.in
-- Supabase Project: ohjublpvkzobzkrgkdtj
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
--
-- ADDITIVE ONLY — does not drop the schema. Extends the existing
-- public.activity_logs table (created in 01_master_setup.sql) rather than
-- introducing a parallel audit_logs table, and tightens its RLS policy,
-- which as originally written let any authenticated user insert a log row
-- claiming ANY hospital_id/actor_id ("WITH CHECK (true)") — logs from other
-- hospitals could be forged into your own audit trail.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: EXTEND activity_logs
-- ----------------------------------------------------------------------------
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS actor_role TEXT,
  ADD COLUMN IF NOT EXISTS target_type TEXT,
  ADD COLUMN IF NOT EXISTS target_id UUID,
  ADD COLUMN IF NOT EXISTS target_label TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_activity_logs_hospital_created ON public.activity_logs(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(category);

-- ----------------------------------------------------------------------------
-- STEP 2: LOGGING RPC — the only sanctioned way to write a log row. Derives
-- hospital_id/actor_id/actor_role itself from auth.uid() rather than trusting
-- client-supplied values, so a log entry can never be forged as someone else
-- or filed under another hospital.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_activity(
    p_category TEXT,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_target_label TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_actor_hospital UUID;
    v_actor_role TEXT;
    v_actor_email TEXT;
    v_log_id UUID;
BEGIN
    SELECT hospital_id, role, email INTO v_actor_hospital, v_actor_role, v_actor_email
    FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.activity_logs (
        hospital_id, actor_id, actor_email, actor_role, category, action,
        target_type, target_id, target_label, status, metadata
    ) VALUES (
        v_actor_hospital, auth.uid(), v_actor_email, v_actor_role, p_category, p_action,
        p_target_type, p_target_id, p_target_label, COALESCE(p_status, 'success'), COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 3: TIGHTEN RLS — logs are append-only for normal admins (no UPDATE/
-- DELETE policy exists for hospital_admin at all) and every row must belong
-- to the inserting user's own hospital.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert activity logs" ON public.activity_logs;
-- Direct inserts are no longer permitted at all — every write must go
-- through log_activity(), which is SECURITY DEFINER and bypasses RLS itself,
-- so no INSERT policy for 'authenticated' is needed or created here.

DROP POLICY IF EXISTS "Hospital Admin view own hospital logs" ON public.activity_logs;
CREATE POLICY "Hospital Admin view own hospital logs" ON public.activity_logs
    FOR SELECT TO authenticated USING (public.is_hospital_admin() AND hospital_id = public.current_hospital_id());

DROP POLICY IF EXISTS "Super Admin full access to activity_logs" ON public.activity_logs;
CREATE POLICY "Super Admin full access to activity_logs" ON public.activity_logs
    FOR ALL TO authenticated USING (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- STEP 4: USERS & ROLES — role-change guardrail. A hospital_admin may change
-- a profile's role only between 'doctor' and 'staff' within their own
-- hospital; only a super_admin may create/modify a 'hospital_admin' or
-- 'super_admin' row. Enforced as a trigger (not just RLS USING) since the
-- existing "Hospital Admin manage hospital profiles" policy's WITH CHECK
-- only verifies hospital_id, not which role value is being written.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_role_change_guardrail()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NEW.role NOT IN ('doctor', 'staff') OR OLD.role NOT IN ('doctor', 'staff') THEN
            RAISE EXCEPTION 'Only a Super Admin may assign or change hospital_admin / super_admin roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_role_change_guardrail ON public.profiles;
CREATE TRIGGER trg_enforce_role_change_guardrail
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_role_change_guardrail();
