-- ════════════════════════════════════════════════════════════════════════════
-- 04_AI_FEATURES.sql — storage for the AI features served by the `ai-assist`
-- edge function (supabase/functions/ai-assist).
--
--   ai_insights    Cached AI clinic insights, so dashboards don't call the model
--                  on every page load. Scoped to a hospital (and optionally one
--                  doctor); readable only inside that hospital.
--   ai_rate_limits Per-caller hourly counters that cap AI usage (the public
--                  booking assistant is unauthenticated). Service role only.
--
-- Safe to re-run. Run after 00–03.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('doctor', 'hospital')),
    content JSONB NOT NULL,
    model TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- doctor scope always names the doctor; hospital scope never does
    CONSTRAINT ai_insights_scope_doctor CHECK ((scope = 'doctor') = (doctor_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_lookup
    ON public.ai_insights (hospital_id, scope, doctor_id, created_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Doctors read their own insights; hospital admins and super admins read every
-- insight in their hospital. Nobody reads another hospital's rows.
DROP POLICY IF EXISTS "Read own hospital AI insights" ON public.ai_insights;
CREATE POLICY "Read own hospital AI insights" ON public.ai_insights
    FOR SELECT TO authenticated
    USING (
        hospital_id = public.current_hospital_id()
        AND (
            doctor_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('hospital_admin', 'super_admin')
            )
        )
    );

-- Writes happen only in the edge function with the service role, after it has
-- checked the caller's role and hospital. No client insert/update/delete.
REVOKE INSERT, UPDATE, DELETE ON public.ai_insights FROM anon, authenticated;
GRANT SELECT ON public.ai_insights TO authenticated;

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
    bucket_key TEXT NOT NULL,          -- e.g. 'triage:ip:<sha256>' or 'insights:user:<uuid>'
    window_start TIMESTAMPTZ NOT NULL, -- start of the hour
    request_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_key, window_start)
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (which bypasses RLS) touches this table.
REVOKE ALL ON public.ai_rate_limits FROM anon, authenticated;

-- Atomically count one request and report whether it is within the limit.
CREATE OR REPLACE FUNCTION public.ai_rate_limit_hit(p_bucket TEXT, p_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window TIMESTAMPTZ := date_trunc('hour', NOW());
    v_count INTEGER;
BEGIN
    INSERT INTO public.ai_rate_limits AS r (bucket_key, window_start, request_count)
    VALUES (p_bucket, v_window, 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET request_count = r.request_count + 1
    RETURNING request_count INTO v_count;

    -- Housekeeping: drop windows older than a day.
    DELETE FROM public.ai_rate_limits WHERE window_start < NOW() - INTERVAL '1 day';

    RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_rate_limit_hit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_rate_limit_hit(TEXT, INTEGER) TO service_role;
