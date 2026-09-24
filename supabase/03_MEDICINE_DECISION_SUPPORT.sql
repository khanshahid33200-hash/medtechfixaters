-- ==============================================================================
-- 03_MEDICINE_DECISION_SUPPORT.sql
-- Doctor-managed medicine library, test library, clinical suggestion rules,
-- spreadsheet import history, normalized prescription items with snapshots,
-- prescription finalization / amendment, and audit logging.
--
-- RUN ORDER: 00 -> 01 -> 02_SECURITY_AUDIT_FIXES.sql -> THIS FILE. Idempotent.
--
-- CLINICAL SAFETY MODEL
--   * Every medicine, test and suggestion rule is created by, and private to, the
--     doctor who owns it. Nothing here is a platform-wide medical database.
--   * get_clinical_suggestions() only returns items from the treating doctor's own
--     rules. It never writes anything: suggestions become prescription lines only
--     when the doctor explicitly adds and confirms them.
--   * finalize_consultation() refuses any prescription line the doctor has not
--     confirmed, and a finalized prescription can never be edited in place —
--     changes create a new version via amend_prescription().
--
-- Reuses existing structures: prescriptions (extended), test_requests (test orders),
-- consultations, appointments, activity_logs.
-- ==============================================================================

-- ==============================================================================
-- 1. SHARED HELPERS
-- ==============================================================================

-- Plain-text cleanup for doctor-entered / imported clinical text: trims, removes
-- control characters and HTML tags, and caps length.
CREATE OR REPLACE FUNCTION public.clean_clinical_text(p_text TEXT, p_max INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT NULLIF(LEFT(TRIM(regexp_replace(
               regexp_replace(COALESCE(p_text, ''), '<[^>]*>', '', 'g'),
               '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g')), p_max), '');
$$;

-- Spreadsheet formula prefixes (CSV / formula injection) are rejected, not stored.
CREATE OR REPLACE FUNCTION public.looks_like_formula(p_text TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT COALESCE(p_text, '') ~ '^\s*[=+@]' OR COALESCE(p_text, '') ~ '^\s*-\s*[A-Za-z(]';
$$;

-- Internal audit writer (no API role may call it directly).
CREATE OR REPLACE FUNCTION public.write_clinical_audit(
    p_action TEXT, p_target_type TEXT, p_target_id UUID, p_label TEXT, p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor RECORD;
BEGIN
    SELECT hospital_id, role, email, full_name INTO v_actor FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.activity_logs (
        hospital_id, actor_id, actor_name, actor_email, actor_role, category, action,
        target_type, target_id, target_label, status, metadata
    ) VALUES (
        v_actor.hospital_id, auth.uid(), v_actor.full_name, v_actor.email, v_actor.role,
        'Clinical', p_action, p_target_type, p_target_id::TEXT, LEFT(p_label, 200), 'success',
        COALESCE(p_metadata, '{}'::jsonb)
    );
END;
$$;

-- Owner columns are always taken from the session, never from the client.
CREATE OR REPLACE FUNCTION public.set_clinical_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF TG_OP = 'INSERT' THEN
            NEW.doctor_id := auth.uid();
            NEW.hospital_id := public.current_hospital_id();
        ELSE
            NEW.doctor_id := OLD.doctor_id;
            NEW.hospital_id := OLD.hospital_id;
            NEW.created_at := OLD.created_at;
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. MEDICINE LIBRARY (per doctor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    brand_name TEXT,
    generic_name TEXT,
    drug_type TEXT,
    category TEXT,
    strength TEXT,
    dosage_form TEXT,
    indications TEXT,
    contraindications TEXT,
    usage_notes TEXT,
    warnings TEXT,
    default_dosage TEXT,
    default_frequency TEXT,
    default_duration TEXT,
    route TEXT,
    special_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    -- TRUE only when the doctor deliberately chose "create as separate entry" for a duplicate.
    is_intentional_duplicate BOOLEAN NOT NULL DEFAULT false,
    name_normalized TEXT GENERATED ALWAYS AS (LOWER(medicine_name)) STORED,
    generic_normalized TEXT GENERATED ALWAYS AS (LOWER(COALESCE(generic_name, ''))) STORED,
    brand_normalized TEXT GENERATED ALWAYS AS (LOWER(COALESCE(brand_name, ''))) STORED,
    dedupe_key TEXT GENERATED ALWAYS AS (
        LOWER(medicine_name) || '|' || LOWER(COALESCE(strength, '')) || '|' || LOWER(COALESCE(dosage_form, ''))
    ) STORED,
    import_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT medicines_name_len CHECK (char_length(medicine_name) BETWEEN 1 AND 200)
);

-- Accidental duplicates (same name + strength + form for one doctor) are blocked by the database.
CREATE UNIQUE INDEX IF NOT EXISTS uq_medicines_doctor_dedupe
    ON public.medicines (doctor_id, dedupe_key) WHERE NOT is_intentional_duplicate;
CREATE INDEX IF NOT EXISTS idx_medicines_doctor_name ON public.medicines (doctor_id, status, name_normalized text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_doctor_generic ON public.medicines (doctor_id, status, generic_normalized text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_doctor_brand ON public.medicines (doctor_id, status, brand_normalized text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_hospital ON public.medicines (hospital_id);

CREATE OR REPLACE FUNCTION public.clean_medicine_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.medicine_name := public.clean_clinical_text(NEW.medicine_name, 200);
    NEW.brand_name := public.clean_clinical_text(NEW.brand_name, 200);
    NEW.generic_name := public.clean_clinical_text(NEW.generic_name, 200);
    NEW.drug_type := public.clean_clinical_text(NEW.drug_type, 120);
    NEW.category := public.clean_clinical_text(NEW.category, 120);
    NEW.strength := public.clean_clinical_text(NEW.strength, 60);
    NEW.dosage_form := public.clean_clinical_text(NEW.dosage_form, 60);
    NEW.indications := public.clean_clinical_text(NEW.indications, 2000);
    NEW.contraindications := public.clean_clinical_text(NEW.contraindications, 2000);
    NEW.usage_notes := public.clean_clinical_text(NEW.usage_notes, 2000);
    NEW.warnings := public.clean_clinical_text(NEW.warnings, 2000);
    NEW.default_dosage := public.clean_clinical_text(NEW.default_dosage, 120);
    NEW.default_frequency := public.clean_clinical_text(NEW.default_frequency, 120);
    NEW.default_duration := public.clean_clinical_text(NEW.default_duration, 120);
    NEW.route := public.clean_clinical_text(NEW.route, 60);
    NEW.special_instructions := public.clean_clinical_text(NEW.special_instructions, 1000);

    IF NEW.medicine_name IS NULL THEN
        RAISE EXCEPTION 'Medicine name is required.' USING ERRCODE = '23514';
    END IF;
    IF public.looks_like_formula(NEW.medicine_name) OR public.looks_like_formula(NEW.brand_name)
       OR public.looks_like_formula(NEW.generic_name) OR public.looks_like_formula(NEW.indications)
       OR public.looks_like_formula(NEW.usage_notes) OR public.looks_like_formula(NEW.warnings)
       OR public.looks_like_formula(NEW.special_instructions) THEN
        RAISE EXCEPTION 'Text that starts like a spreadsheet formula (=, +, @) is not allowed.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medicines_owner ON public.medicines;
CREATE TRIGGER trg_medicines_owner BEFORE INSERT OR UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.set_clinical_owner();
DROP TRIGGER IF EXISTS trg_medicines_clean ON public.medicines;
CREATE TRIGGER trg_medicines_clean BEFORE INSERT OR UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.clean_medicine_row();

-- ==============================================================================
-- 3. TEST LIBRARY (per doctor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clinical_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    category TEXT,
    purpose_notes TEXT,
    indication TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    name_normalized TEXT GENERATED ALWAYS AS (LOWER(test_name)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT clinical_tests_name_len CHECK (char_length(test_name) BETWEEN 1 AND 200)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_clinical_tests_doctor_name ON public.clinical_tests (doctor_id, name_normalized);

CREATE OR REPLACE FUNCTION public.clean_clinical_test_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.test_name := public.clean_clinical_text(NEW.test_name, 200);
    NEW.category := public.clean_clinical_text(NEW.category, 120);
    NEW.purpose_notes := public.clean_clinical_text(NEW.purpose_notes, 2000);
    NEW.indication := public.clean_clinical_text(NEW.indication, 2000);
    IF NEW.test_name IS NULL THEN
        RAISE EXCEPTION 'Test name is required.' USING ERRCODE = '23514';
    END IF;
    IF public.looks_like_formula(NEW.test_name) THEN
        RAISE EXCEPTION 'Text that starts like a spreadsheet formula (=, +, @) is not allowed.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_tests_owner ON public.clinical_tests;
CREATE TRIGGER trg_clinical_tests_owner BEFORE INSERT OR UPDATE ON public.clinical_tests
    FOR EACH ROW EXECUTE FUNCTION public.set_clinical_owner();
DROP TRIGGER IF EXISTS trg_clinical_tests_clean ON public.clinical_tests;
CREATE TRIGGER trg_clinical_tests_clean BEFORE INSERT OR UPDATE ON public.clinical_tests
    FOR EACH ROW EXECUTE FUNCTION public.clean_clinical_test_row();

-- ==============================================================================
-- 4. SUGGESTION RULES (per doctor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suggestion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('SYMPTOM', 'COMPLAINT', 'KEYWORD', 'CONDITION', 'DOCTOR_DEFINED_CATEGORY')),
    trigger_value TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('MEDICINE', 'TEST', 'OTHER')),
    suggestion_id UUID,
    suggestion_text TEXT,
    priority INTEGER NOT NULL DEFAULT 100 CHECK (priority BETWEEN 1 AND 1000),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT suggestion_rules_target CHECK (
        (suggestion_type IN ('MEDICINE', 'TEST') AND suggestion_id IS NOT NULL)
        OR (suggestion_type = 'OTHER' AND suggestion_text IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_suggestion_rules_doctor ON public.suggestion_rules (doctor_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_suggestion_rules_doctor
    ON public.suggestion_rules (doctor_id, trigger_type, LOWER(trigger_value), suggestion_type,
                                COALESCE(suggestion_id::text, LOWER(suggestion_text)));

CREATE OR REPLACE FUNCTION public.validate_suggestion_rule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.trigger_value := LOWER(public.clean_clinical_text(NEW.trigger_value, 120));
    NEW.suggestion_text := public.clean_clinical_text(NEW.suggestion_text, 200);
    NEW.notes := public.clean_clinical_text(NEW.notes, 1000);
    IF NEW.trigger_value IS NULL OR char_length(NEW.trigger_value) < 2 THEN
        RAISE EXCEPTION 'Trigger text must be at least 2 characters.' USING ERRCODE = '23514';
    END IF;
    IF public.looks_like_formula(NEW.trigger_value) OR public.looks_like_formula(NEW.suggestion_text) THEN
        RAISE EXCEPTION 'Text that starts like a spreadsheet formula (=, +, @) is not allowed.' USING ERRCODE = '23514';
    END IF;
    -- A rule may only point at the SAME doctor's own medicine/test.
    IF NEW.suggestion_type = 'MEDICINE' AND NOT EXISTS (
        SELECT 1 FROM public.medicines WHERE id = NEW.suggestion_id AND doctor_id = NEW.doctor_id
    ) THEN
        RAISE EXCEPTION 'Suggested medicine must be in your own medicine library.' USING ERRCODE = '42501';
    END IF;
    IF NEW.suggestion_type = 'TEST' AND NOT EXISTS (
        SELECT 1 FROM public.clinical_tests WHERE id = NEW.suggestion_id AND doctor_id = NEW.doctor_id
    ) THEN
        RAISE EXCEPTION 'Suggested test must be in your own test library.' USING ERRCODE = '42501';
    END IF;
    IF NEW.suggestion_type = 'OTHER' THEN
        NEW.suggestion_id := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suggestion_rules_owner ON public.suggestion_rules;
CREATE TRIGGER trg_suggestion_rules_owner BEFORE INSERT OR UPDATE ON public.suggestion_rules
    FOR EACH ROW EXECUTE FUNCTION public.set_clinical_owner();
-- Named to fire after the owner trigger (triggers fire in name order).
DROP TRIGGER IF EXISTS trg_suggestion_rules_validate ON public.suggestion_rules;
CREATE TRIGGER trg_suggestion_rules_validate BEFORE INSERT OR UPDATE ON public.suggestion_rules
    FOR EACH ROW EXECUTE FUNCTION public.validate_suggestion_rule();

-- Deleting a medicine/test removes the rules that pointed at it.
CREATE OR REPLACE FUNCTION public.drop_rules_for_deleted_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.suggestion_rules
    WHERE suggestion_id = OLD.id AND doctor_id = OLD.doctor_id
      AND suggestion_type = CASE WHEN TG_TABLE_NAME = 'medicines' THEN 'MEDICINE' ELSE 'TEST' END;
    RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_medicines_drop_rules ON public.medicines;
CREATE TRIGGER trg_medicines_drop_rules AFTER DELETE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.drop_rules_for_deleted_item();
DROP TRIGGER IF EXISTS trg_clinical_tests_drop_rules ON public.clinical_tests;
CREATE TRIGGER trg_clinical_tests_drop_rules AFTER DELETE ON public.clinical_tests
    FOR EACH ROW EXECUTE FUNCTION public.drop_rules_for_deleted_item();

-- ==============================================================================
-- 5. IMPORT HISTORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medicine_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'xls')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    updated_rows INTEGER NOT NULL DEFAULT 0,
    skipped_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'completed_with_errors', 'failed')),
    error_summary TEXT,
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medicine_imports_doctor ON public.medicine_imports (doctor_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_medicine_imports_owner ON public.medicine_imports;
CREATE TRIGGER trg_medicine_imports_owner BEFORE INSERT OR UPDATE ON public.medicine_imports
    FOR EACH ROW EXECUTE FUNCTION public.set_clinical_owner();

-- ==============================================================================
-- 6. PRESCRIPTIONS: versioning + normalized items with snapshots
-- ==============================================================================
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'final';
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS amends_prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS amendment_reason TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_status_check') THEN
        ALTER TABLE public.prescriptions ADD CONSTRAINT prescriptions_status_check
            CHECK (status IN ('draft', 'final', 'superseded'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
    -- Snapshot at prescribing time: editing or deleting the library entry never changes history.
    medicine_name_snapshot TEXT NOT NULL,
    generic_name_snapshot TEXT,
    strength_snapshot TEXT,
    dosage_form_snapshot TEXT,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    route TEXT,
    instructions TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('library', 'suggestion', 'manual')),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON public.prescription_items (prescription_id, position);

-- Finalized prescriptions (and their items) are immutable for API users. The only
-- permitted change is the SECURITY DEFINER amend_prescription() marking a version superseded.
CREATE OR REPLACE FUNCTION public.protect_finalized_prescription()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') AND OLD.status IN ('final', 'superseded') THEN
        RAISE EXCEPTION 'A finalized prescription cannot be changed. Create an amendment instead.' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_finalized_prescription ON public.prescriptions;
CREATE TRIGGER trg_protect_finalized_prescription BEFORE UPDATE OR DELETE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.protect_finalized_prescription();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY
-- ==============================================================================
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.medicines, public.clinical_tests, public.suggestion_rules,
              public.medicine_imports, public.prescription_items FROM anon;

-- Libraries & rules: private to the owning doctor, inside their current (active) hospital.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['medicines', 'clinical_tests', 'suggestion_rules'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Doctor manages own ' || t, t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                USING (doctor_id = auth.uid() AND hospital_id IS NOT DISTINCT FROM public.current_hospital_id()
                       AND public.current_hospital_id() IS NOT NULL)
                WITH CHECK (doctor_id = auth.uid() AND hospital_id IS NOT DISTINCT FROM public.current_hospital_id()
                            AND public.current_hospital_id() IS NOT NULL)',
            'Doctor manages own ' || t, t);
    END LOOP;
END $$;

-- Import history: the doctor reads their own; rows are written only by import_medicines().
DROP POLICY IF EXISTS "Doctor views own imports" ON public.medicine_imports;
CREATE POLICY "Doctor views own imports" ON public.medicine_imports FOR SELECT TO authenticated
    USING (doctor_id = auth.uid() AND public.current_hospital_id() IS NOT NULL);
REVOKE INSERT, UPDATE, DELETE ON public.medicine_imports FROM authenticated;

-- Prescription items: readable by whoever may read the parent prescription (treating
-- doctor, hospital admin — see 02); written only by finalize_consultation()/amend_prescription().
DROP POLICY IF EXISTS "Read items of readable prescriptions" ON public.prescription_items;
CREATE POLICY "Read items of readable prescriptions" ON public.prescription_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id));
REVOKE INSERT, UPDATE, DELETE ON public.prescription_items FROM authenticated;

-- ==============================================================================
-- 8. AUDIT TRIGGERS (library and rules)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.audit_library_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action TEXT;
    v_label TEXT;
BEGIN
    -- Bulk imports log one MEDICINE_IMPORTED entry instead of one per row.
    IF current_setting('medtech.importing', true) = 'on' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_TABLE_NAME = 'medicines' THEN
        v_label := COALESCE(NEW.medicine_name, OLD.medicine_name);
        v_action := CASE
            WHEN TG_OP = 'INSERT' THEN 'MEDICINE_CREATED'
            WHEN TG_OP = 'DELETE' THEN 'MEDICINE_DELETED'
            WHEN NEW.status = 'inactive' AND OLD.status = 'active' THEN 'MEDICINE_DEACTIVATED'
            ELSE 'MEDICINE_UPDATED' END;
    ELSIF TG_TABLE_NAME = 'clinical_tests' THEN
        v_label := COALESCE(NEW.test_name, OLD.test_name);
        v_action := CASE WHEN TG_OP = 'INSERT' THEN 'TEST_CREATED' WHEN TG_OP = 'DELETE' THEN 'TEST_DELETED' ELSE 'TEST_UPDATED' END;
    ELSE
        v_label := COALESCE(NEW.trigger_type, OLD.trigger_type) || ': ' || COALESCE(NEW.trigger_value, OLD.trigger_value);
        v_action := CASE
            WHEN TG_OP = 'INSERT' THEN 'SUGGESTION_CREATED'
            WHEN TG_OP = 'DELETE' THEN 'SUGGESTION_DELETED'
            WHEN NEW.status = 'disabled' AND OLD.status = 'active' THEN 'SUGGESTION_DISABLED'
            ELSE 'SUGGESTION_UPDATED' END;
    END IF;

    PERFORM public.write_clinical_audit(v_action, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), v_label);
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_medicines ON public.medicines;
CREATE TRIGGER trg_audit_medicines AFTER INSERT OR UPDATE OR DELETE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.audit_library_change();
DROP TRIGGER IF EXISTS trg_audit_clinical_tests ON public.clinical_tests;
CREATE TRIGGER trg_audit_clinical_tests AFTER INSERT OR UPDATE OR DELETE ON public.clinical_tests
    FOR EACH ROW EXECUTE FUNCTION public.audit_library_change();
DROP TRIGGER IF EXISTS trg_audit_suggestion_rules ON public.suggestion_rules;
CREATE TRIGGER trg_audit_suggestion_rules AFTER INSERT OR UPDATE OR DELETE ON public.suggestion_rules
    FOR EACH ROW EXECUTE FUNCTION public.audit_library_change();

-- ==============================================================================
-- 9. RPC FUNCTIONS
-- ==============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS sig FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
          AND proname IN ('search_medicines', 'get_clinical_suggestions', 'import_medicines',
                          'finalize_consultation', 'amend_prescription')
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;
END $$;

-- 9.1 Autocomplete: prefix match on name / generic / brand among the caller's ACTIVE medicines.
-- SECURITY INVOKER: RLS on public.medicines applies as well.
CREATE FUNCTION public.search_medicines(p_query TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID, medicine_name TEXT, brand_name TEXT, generic_name TEXT, category TEXT, drug_type TEXT,
    strength TEXT, dosage_form TEXT, default_dosage TEXT, default_frequency TEXT, default_duration TEXT,
    route TEXT, special_instructions TEXT, warnings TEXT, contraindications TEXT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    WITH q AS (
        SELECT replace(replace(replace(LOWER(TRIM(COALESCE(p_query, ''))), '\', '\\'), '%', '\%'), '_', '\_') AS v
    )
    SELECT m.id, m.medicine_name, m.brand_name, m.generic_name, m.category, m.drug_type,
           m.strength, m.dosage_form, m.default_dosage, m.default_frequency, m.default_duration,
           m.route, m.special_instructions, m.warnings, m.contraindications
    FROM public.medicines m, q
    WHERE m.doctor_id = auth.uid()
      AND m.status = 'active'
      AND q.v <> ''
      AND (m.name_normalized LIKE q.v || '%' OR m.generic_normalized LIKE q.v || '%' OR m.brand_normalized LIKE q.v || '%')
    ORDER BY (m.name_normalized LIKE q.v || '%') DESC, m.medicine_name ASC, m.strength ASC NULLS FIRST
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 25);
$$;

-- 9.2 Decision support. Returns ONLY items from the treating doctor's own active rules
-- whose trigger matches this appointment's booking information. Read-only.
CREATE FUNCTION public.get_clinical_suggestions(p_appointment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_appt RECORD;
    v_complaint TEXT;
    v_conditions TEXT;
    v_category TEXT;
    v_meds JSONB;
    v_tests JSONB;
    v_other JSONB;
BEGIN
    -- RLS: a doctor can read only their own appointments.
    SELECT a.id, a.doctor_id, a.symptoms, a.notes, a.department_id, pt.known_diseases, d.name AS department_name
    INTO v_appt
    FROM public.appointments a
    LEFT JOIN public.patients pt ON pt.id = a.patient_id
    LEFT JOIN public.departments d ON d.id = a.department_id
    WHERE a.id = p_appointment_id;

    IF v_appt.id IS NULL OR v_appt.doctor_id IS DISTINCT FROM auth.uid() THEN
        RETURN jsonb_build_object('medicines', '[]'::jsonb, 'tests', '[]'::jsonb, 'other', '[]'::jsonb);
    END IF;

    v_complaint := LOWER(COALESCE(v_appt.symptoms, '') || ' ' || COALESCE(v_appt.notes, ''));
    v_conditions := LOWER(COALESCE(v_appt.known_diseases, ''));
    v_category := LOWER(COALESCE(v_appt.department_name, ''));

    WITH matched AS (
        SELECT r.*,
               ('\m' || regexp_replace(r.trigger_value, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M') AS pattern
        FROM public.suggestion_rules r
        WHERE r.doctor_id = auth.uid() AND r.status = 'active'
    ), hits AS (
        SELECT * FROM matched
        WHERE CASE trigger_type
            WHEN 'CONDITION' THEN v_conditions ~ pattern OR v_complaint ~ pattern
            WHEN 'DOCTOR_DEFINED_CATEGORY' THEN v_category ~ pattern OR v_complaint ~ pattern
            ELSE v_complaint ~ pattern
        END
    )
    SELECT
        COALESCE((SELECT jsonb_agg(x ORDER BY (x->>'priority')::int, x->>'name') FROM (
            SELECT DISTINCT ON (m.id) jsonb_build_object(
                'rule_id', h.id, 'medicine_id', m.id, 'name', m.medicine_name, 'generic_name', m.generic_name,
                'brand_name', m.brand_name, 'category', COALESCE(m.category, m.drug_type), 'strength', m.strength,
                'dosage_form', m.dosage_form, 'indications', m.indications, 'warnings', m.warnings,
                'contraindications', m.contraindications, 'default_dosage', m.default_dosage,
                'default_frequency', m.default_frequency, 'default_duration', m.default_duration,
                'route', m.route, 'special_instructions', m.special_instructions,
                'trigger_type', h.trigger_type, 'trigger_value', h.trigger_value, 'rule_notes', h.notes,
                'priority', h.priority) AS x
            FROM hits h JOIN public.medicines m ON m.id = h.suggestion_id AND m.doctor_id = auth.uid() AND m.status = 'active'
            WHERE h.suggestion_type = 'MEDICINE'
            ORDER BY m.id, h.priority
        ) s), '[]'::jsonb),
        COALESCE((SELECT jsonb_agg(x ORDER BY (x->>'priority')::int, x->>'name') FROM (
            SELECT DISTINCT ON (t.id) jsonb_build_object(
                'rule_id', h.id, 'test_id', t.id, 'name', t.test_name, 'category', t.category,
                'purpose_notes', t.purpose_notes, 'indication', t.indication,
                'trigger_type', h.trigger_type, 'trigger_value', h.trigger_value, 'rule_notes', h.notes,
                'priority', h.priority) AS x
            FROM hits h JOIN public.clinical_tests t ON t.id = h.suggestion_id AND t.doctor_id = auth.uid() AND t.status = 'active'
            WHERE h.suggestion_type = 'TEST'
            ORDER BY t.id, h.priority
        ) s), '[]'::jsonb),
        COALESCE((SELECT jsonb_agg(jsonb_build_object(
                'rule_id', h.id, 'name', h.suggestion_text, 'trigger_type', h.trigger_type,
                'trigger_value', h.trigger_value, 'rule_notes', h.notes, 'priority', h.priority)
            ORDER BY h.priority) FROM hits h WHERE h.suggestion_type = 'OTHER'), '[]'::jsonb)
    INTO v_meds, v_tests, v_other;

    RETURN jsonb_build_object('medicines', v_meds, 'tests', v_tests, 'other', v_other);
END;
$$;

-- 9.3 Spreadsheet import (server side). The browser parses and previews the file;
-- every row is validated again here. p_rows: [{row, action, medicine_name, ...}],
-- action = 'skip' | 'update' | 'separate' (what to do if the row duplicates an existing entry).
-- p_client_errors: rows the browser already rejected ([{row, error}]) so the history is complete.
CREATE FUNCTION public.import_medicines(p_filename TEXT, p_file_type TEXT, p_rows JSONB, p_client_errors JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- ownership is set explicitly below from auth.uid(), never from the payload
SET search_path = public
AS $$
DECLARE
    c_max_rows CONSTANT INTEGER := 2000;
    v_doctor UUID := auth.uid();
    v_hospital UUID := public.current_hospital_id();
    v_import_id UUID := gen_random_uuid();
    v_row JSONB;
    v_rownum INTEGER;
    v_action TEXT;
    v_name TEXT;
    v_key TEXT;
    v_existing UUID;
    v_inserted INTEGER := 0;
    v_updated INTEGER := 0;
    v_skipped INTEGER := 0;
    v_failed INTEGER := 0;
    v_errors JSONB := '[]'::jsonb;
    v_total INTEGER;
    v_err TEXT;
BEGIN
    IF v_doctor IS NULL OR v_hospital IS NULL THEN
        RAISE EXCEPTION 'Not authorized.' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_doctor AND role = 'doctor') THEN
        RAISE EXCEPTION 'Only doctors can import medicines.' USING ERRCODE = '42501';
    END IF;
    IF jsonb_typeof(p_rows) <> 'array' THEN
        RAISE EXCEPTION 'Invalid import payload.' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(COALESCE(p_client_errors, '[]'::jsonb)) <> 'array' THEN
        p_client_errors := '[]'::jsonb;
    END IF;
    v_total := jsonb_array_length(p_rows);
    IF v_total + jsonb_array_length(p_client_errors) > c_max_rows OR v_total = 0 THEN
        RAISE EXCEPTION 'An import must contain between 1 and % rows.', c_max_rows USING ERRCODE = '22023';
    END IF;
    IF LOWER(p_file_type) NOT IN ('csv', 'xlsx', 'xls') THEN
        RAISE EXCEPTION 'Unsupported file type.' USING ERRCODE = '22023';
    END IF;

    PERFORM set_config('medtech.importing', 'on', true);

    FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
        v_rownum := COALESCE((v_row->>'row')::INTEGER, 0);
        v_action := COALESCE(v_row->>'action', 'skip');
        v_name := public.clean_clinical_text(v_row->>'medicine_name', 200);

        IF v_name IS NULL THEN
            v_failed := v_failed + 1;
            v_errors := v_errors || jsonb_build_object('row', v_rownum, 'error', 'Medicine name is missing.');
            CONTINUE;
        END IF;

        v_key := LOWER(v_name) || '|' || LOWER(COALESCE(public.clean_clinical_text(v_row->>'strength', 60), ''))
                 || '|' || LOWER(COALESCE(public.clean_clinical_text(v_row->>'dosage_form', 60), ''));
        SELECT id INTO v_existing FROM public.medicines
        WHERE doctor_id = v_doctor AND dedupe_key = v_key AND NOT is_intentional_duplicate LIMIT 1;

        IF v_existing IS NOT NULL AND v_action NOT IN ('update', 'separate') THEN
            v_skipped := v_skipped + 1;
            CONTINUE;
        END IF;

        BEGIN
            IF v_existing IS NOT NULL AND v_action = 'update' THEN
                UPDATE public.medicines SET
                    brand_name = COALESCE(v_row->>'brand_name', brand_name),
                    generic_name = COALESCE(v_row->>'generic_name', generic_name),
                    drug_type = COALESCE(v_row->>'drug_type', drug_type),
                    category = COALESCE(v_row->>'category', category),
                    indications = COALESCE(v_row->>'indications', indications),
                    contraindications = COALESCE(v_row->>'contraindications', contraindications),
                    usage_notes = COALESCE(v_row->>'usage_notes', usage_notes),
                    warnings = COALESCE(v_row->>'warnings', warnings),
                    default_dosage = COALESCE(v_row->>'default_dosage', default_dosage),
                    default_frequency = COALESCE(v_row->>'default_frequency', default_frequency),
                    default_duration = COALESCE(v_row->>'default_duration', default_duration),
                    route = COALESCE(v_row->>'route', route),
                    special_instructions = COALESCE(v_row->>'special_instructions', special_instructions)
                WHERE id = v_existing AND doctor_id = v_doctor;
                v_updated := v_updated + 1;
            ELSE
                INSERT INTO public.medicines (
                    doctor_id, hospital_id, medicine_name, brand_name, generic_name, drug_type, category, strength, dosage_form,
                    indications, contraindications, usage_notes, warnings, default_dosage, default_frequency,
                    default_duration, route, special_instructions, status, is_intentional_duplicate, import_id
                ) VALUES (
                    v_doctor, v_hospital, v_name, v_row->>'brand_name', v_row->>'generic_name', v_row->>'drug_type', v_row->>'category',
                    v_row->>'strength', v_row->>'dosage_form', v_row->>'indications', v_row->>'contraindications',
                    v_row->>'usage_notes', v_row->>'warnings', v_row->>'default_dosage', v_row->>'default_frequency',
                    v_row->>'default_duration', v_row->>'route', v_row->>'special_instructions',
                    CASE WHEN LOWER(COALESCE(v_row->>'status', 'active')) = 'inactive' THEN 'inactive' ELSE 'active' END,
                    v_existing IS NOT NULL, v_import_id
                );
                v_inserted := v_inserted + 1;
            END IF;
        EXCEPTION
            WHEN unique_violation THEN
                v_skipped := v_skipped + 1;
                v_errors := v_errors || jsonb_build_object('row', v_rownum, 'error', 'Duplicate of a row earlier in this file — skipped.');
            WHEN check_violation OR string_data_right_truncation OR invalid_text_representation THEN
                GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
                v_failed := v_failed + 1;
                v_errors := v_errors || jsonb_build_object('row', v_rownum, 'error', LEFT(v_err, 200));
        END;
    END LOOP;

    PERFORM set_config('medtech.importing', 'off', true);

    -- Include rows rejected by browser validation (text only, capped) in the stored history.
    SELECT v_errors || COALESCE(jsonb_agg(jsonb_build_object(
               'row', COALESCE((e->>'row')::INTEGER, 0),
               'error', COALESCE(public.clean_clinical_text(e->>'error', 200), 'Invalid row'))), '[]'::jsonb),
           v_failed + COUNT(e)::INTEGER
    INTO v_errors, v_failed
    FROM jsonb_array_elements(p_client_errors) e;
    v_total := v_total + jsonb_array_length(p_client_errors);

    INSERT INTO public.medicine_imports (
        id, doctor_id, hospital_id, filename, file_type, total_rows, successful_rows, updated_rows, skipped_rows, failed_rows,
        status, error_summary, errors
    ) VALUES (
        v_import_id, v_doctor, v_hospital, COALESCE(LEFT(public.clean_clinical_text(p_filename, 200), 200), 'upload'), LOWER(p_file_type), v_total,
        v_inserted, v_updated, v_skipped, v_failed,
        CASE WHEN v_inserted + v_updated = 0 AND v_failed > 0 THEN 'failed'
             WHEN v_failed > 0 THEN 'completed_with_errors' ELSE 'completed' END,
        CASE WHEN v_failed > 0 THEN v_failed || ' row(s) failed validation.' ELSE NULL END,
        (SELECT COALESCE(jsonb_agg(e), '[]'::jsonb) FROM (SELECT e FROM jsonb_array_elements(v_errors) e LIMIT 500) s)
    );

    PERFORM public.write_clinical_audit('MEDICINE_IMPORTED', 'medicine_imports', v_import_id,
        public.clean_clinical_text(p_filename, 200),
        jsonb_build_object('total', v_total, 'imported', v_inserted, 'updated', v_updated,
                           'skipped', v_skipped, 'failed', v_failed));

    RETURN jsonb_build_object('import_id', v_import_id, 'total_rows', v_total, 'imported', v_inserted,
                              'updated', v_updated, 'skipped', v_skipped, 'failed', v_failed, 'errors', v_errors);
END;
$$;

-- 9.4 Finish a consultation atomically: consultation note, FINAL prescription with
-- snapshot items, test order, appointment completed, audit trail.
-- p_items: [{medicine_id?, name, dosage, frequency, duration, route, instructions, source, confirmed}]
CREATE FUNCTION public.finalize_consultation(
    p_appointment_id UUID,
    p_diagnosis TEXT DEFAULT NULL,
    p_clinical_notes TEXT DEFAULT NULL,
    p_vitals JSONB DEFAULT '{}'::jsonb,
    p_items JSONB DEFAULT '[]'::jsonb,
    p_tests JSONB DEFAULT '[]'::jsonb,
    p_tests_urgent BOOLEAN DEFAULT false,
    p_test_instructions TEXT DEFAULT NULL,
    p_advice TEXT DEFAULT NULL,
    p_follow_up TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appt RECORD;
    v_consultation_id UUID;
    v_rx_id UUID;
    v_item JSONB;
    v_med RECORD;
    v_pos INTEGER := 0;
    v_legacy JSONB := '[]'::jsonb;
    v_tests JSONB := '[]'::jsonb;
    v_test_request_id UUID;
    v_name TEXT;
    v_source TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_appt FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
    IF v_appt.id IS NULL OR v_appt.doctor_id IS DISTINCT FROM auth.uid()
       OR v_appt.hospital_id IS DISTINCT FROM public.current_hospital_id() THEN
        RAISE EXCEPTION 'Appointment not found.' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM public.prescriptions WHERE appointment_id = p_appointment_id AND status = 'final') THEN
        RAISE EXCEPTION 'This consultation already has a finalized prescription. Use an amendment to change it.' USING ERRCODE = '23505';
    END IF;
    IF jsonb_typeof(COALESCE(p_items, '[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) > 50 THEN
        RAISE EXCEPTION 'Invalid prescription items.' USING ERRCODE = '22023';
    END IF;

    -- Doctor confirmation is required for every line; nothing is prescribed implicitly.
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) e
               WHERE COALESCE((e->>'confirmed')::BOOLEAN, false) IS NOT TRUE) THEN
        RAISE EXCEPTION 'Every medicine must be reviewed and confirmed by the doctor before finalizing.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.consultations (
        hospital_id, appointment_id, doctor_id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        diagnosis, clinical_notes, symptoms, vitals, bp, pulse, temp, spo2, weight, status
    ) VALUES (
        v_appt.hospital_id, v_appt.id, v_appt.doctor_id, v_appt.patient_id, v_appt.patient_name, v_appt.patient_phone,
        v_appt.patient_age, v_appt.patient_gender,
        LEFT(p_diagnosis, 1000), LEFT(p_clinical_notes, 5000), v_appt.symptoms, COALESCE(p_vitals, '{}'::jsonb),
        LEFT(p_vitals->>'bp', 20), LEFT(p_vitals->>'pulse', 20), LEFT(p_vitals->>'temp', 20),
        LEFT(p_vitals->>'spo2', 20), LEFT(p_vitals->>'weight', 20), 'completed'
    ) RETURNING id INTO v_consultation_id;

    SELECT COALESCE(jsonb_agg(LEFT(public.clean_clinical_text(t #>> '{}', 200), 200)), '[]'::jsonb) INTO v_tests
    FROM jsonb_array_elements(COALESCE(p_tests, '[]'::jsonb)) t
    WHERE public.clean_clinical_text(t #>> '{}', 200) IS NOT NULL;

    INSERT INTO public.prescriptions (
        hospital_id, consultation_id, appointment_id, doctor_id, patient_id, patient_name,
        medicines, medications, lab_tests, advice, follow_up, notes, status, version, finalized_at, finalized_by
    ) VALUES (
        v_appt.hospital_id, v_consultation_id, v_appt.id, v_appt.doctor_id, v_appt.patient_id, v_appt.patient_name,
        '[]'::jsonb, '[]'::jsonb, v_tests, LEFT(p_advice, 5000), LEFT(p_follow_up, 200), LEFT(p_clinical_notes, 5000),
        'draft', 1, NULL, NULL
    ) RETURNING id INTO v_rx_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
        -- Always assigns one row: NULL fields when the line is not from this doctor's library.
        SELECT m.medicine_name, m.generic_name, m.strength, m.dosage_form INTO v_med
        FROM (SELECT 1) one
        LEFT JOIN public.medicines m
          ON m.id = public.try_uuid(v_item->>'medicine_id') AND m.doctor_id = auth.uid();
        v_name := COALESCE(v_med.medicine_name, public.clean_clinical_text(v_item->>'name', 200));
        IF v_name IS NULL THEN
            RAISE EXCEPTION 'Prescription line % has no medicine name.', v_pos + 1 USING ERRCODE = '22023';
        END IF;
        v_source := CASE WHEN v_item->>'source' IN ('library', 'suggestion', 'manual') THEN v_item->>'source' ELSE 'manual' END;

        INSERT INTO public.prescription_items (
            prescription_id, medicine_id, medicine_name_snapshot, generic_name_snapshot, strength_snapshot,
            dosage_form_snapshot, dosage, frequency, duration, route, instructions, source, position
        ) VALUES (
            v_rx_id, CASE WHEN v_med.medicine_name IS NOT NULL THEN public.try_uuid(v_item->>'medicine_id') END,
            v_name, v_med.generic_name, COALESCE(v_med.strength, public.clean_clinical_text(v_item->>'strength', 60)),
            v_med.dosage_form,
            public.clean_clinical_text(v_item->>'dosage', 120), public.clean_clinical_text(v_item->>'frequency', 120),
            public.clean_clinical_text(v_item->>'duration', 120), public.clean_clinical_text(v_item->>'route', 60),
            public.clean_clinical_text(v_item->>'instructions', 500),
            CASE WHEN v_med.medicine_name IS NULL THEN 'manual' ELSE v_source END, v_pos
        );

        -- Legacy JSON shape still read by History, Rx and patient-detail screens.
        v_legacy := v_legacy || jsonb_build_object(
            'name', v_name || COALESCE(' ' || COALESCE(v_med.strength, public.clean_clinical_text(v_item->>'strength', 60)), ''),
            'dosage', public.clean_clinical_text(v_item->>'dosage', 120),
            'duration', public.clean_clinical_text(v_item->>'duration', 120),
            'instruction', concat_ws(' — ', public.clean_clinical_text(v_item->>'frequency', 120),
                                     public.clean_clinical_text(v_item->>'route', 60),
                                     public.clean_clinical_text(v_item->>'instructions', 500)));
        v_pos := v_pos + 1;
    END LOOP;

    UPDATE public.prescriptions SET
        medicines = v_legacy, medications = v_legacy,
        status = 'final', finalized_at = NOW(), finalized_by = auth.uid(), updated_at = NOW()
    WHERE id = v_rx_id;

    IF jsonb_array_length(v_tests) > 0 THEN
        INSERT INTO public.test_requests (
            hospital_id, doctor_id, patient_id, appointment_id, consultation_id, tests, instructions, status
        ) VALUES (
            v_appt.hospital_id, v_appt.doctor_id, v_appt.patient_id, v_appt.id, v_consultation_id, v_tests,
            LEFT(concat_ws(' | ', CASE WHEN p_tests_urgent THEN 'URGENT' END, p_test_instructions), 1000), 'requested'
        ) RETURNING id INTO v_test_request_id;
        PERFORM public.write_clinical_audit('TEST_ADDED', 'test_requests', v_test_request_id, NULL,
            jsonb_build_object('appointment_id', v_appt.id, 'test_count', jsonb_array_length(v_tests)));
    END IF;

    UPDATE public.appointments SET status = 'Completed', updated_at = NOW() WHERE id = v_appt.id;

    -- Audit metadata carries ids and counts only — no diagnosis or patient details.
    PERFORM public.write_clinical_audit('PRESCRIPTION_CREATED', 'prescriptions', v_rx_id, NULL,
        jsonb_build_object('appointment_id', v_appt.id, 'item_count', v_pos));
    PERFORM public.write_clinical_audit('PRESCRIPTION_FINALIZED', 'prescriptions', v_rx_id, NULL,
        jsonb_build_object('appointment_id', v_appt.id, 'version', 1,
            'medicine_ids', (SELECT COALESCE(jsonb_agg(medicine_id), '[]'::jsonb) FROM public.prescription_items
                             WHERE prescription_id = v_rx_id AND medicine_id IS NOT NULL)));

    RETURN jsonb_build_object('success', true, 'consultation_id', v_consultation_id,
                              'prescription_id', v_rx_id, 'test_request_id', v_test_request_id);
END;
$$;

-- 9.5 Amend a finalized prescription: the original is kept (marked superseded) and a
-- new FINAL version is created with the reason, author and time recorded.
CREATE FUNCTION public.amend_prescription(p_prescription_id UUID, p_items JSONB, p_reason TEXT, p_advice TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old RECORD;
    v_new_id UUID;
    v_item JSONB;
    v_med RECORD;
    v_pos INTEGER := 0;
    v_legacy JSONB := '[]'::jsonb;
    v_name TEXT;
BEGIN
    SELECT * INTO v_old FROM public.prescriptions WHERE id = p_prescription_id FOR UPDATE;
    IF v_old.id IS NULL OR v_old.doctor_id IS DISTINCT FROM auth.uid()
       OR v_old.hospital_id IS DISTINCT FROM public.current_hospital_id() THEN
        RAISE EXCEPTION 'Prescription not found.' USING ERRCODE = '42501';
    END IF;
    IF v_old.status <> 'final' THEN
        RAISE EXCEPTION 'Only the current finalized version can be amended.' USING ERRCODE = '22023';
    END IF;
    IF public.clean_clinical_text(p_reason, 500) IS NULL THEN
        RAISE EXCEPTION 'An amendment reason is required.' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(COALESCE(p_items, '[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) > 50
       OR EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) e
                  WHERE COALESCE((e->>'confirmed')::BOOLEAN, false) IS NOT TRUE) THEN
        RAISE EXCEPTION 'Every medicine must be reviewed and confirmed by the doctor.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.prescriptions (
        hospital_id, consultation_id, appointment_id, doctor_id, patient_id, patient_name,
        medicines, medications, lab_tests, advice, follow_up, follow_up_date, notes,
        status, version, amends_prescription_id, amendment_reason
    ) VALUES (
        v_old.hospital_id, v_old.consultation_id, v_old.appointment_id, v_old.doctor_id, v_old.patient_id,
        v_old.patient_name, '[]'::jsonb, '[]'::jsonb, v_old.lab_tests, COALESCE(LEFT(p_advice, 5000), v_old.advice),
        v_old.follow_up, v_old.follow_up_date, v_old.notes, 'draft', v_old.version + 1, v_old.id,
        public.clean_clinical_text(p_reason, 500)
    ) RETURNING id INTO v_new_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
        -- Always assigns one row: NULL fields when the line is not from this doctor's library.
        SELECT m.medicine_name, m.generic_name, m.strength, m.dosage_form INTO v_med
        FROM (SELECT 1) one
        LEFT JOIN public.medicines m
          ON m.id = public.try_uuid(v_item->>'medicine_id') AND m.doctor_id = auth.uid();
        v_name := COALESCE(v_med.medicine_name, public.clean_clinical_text(v_item->>'name', 200));
        IF v_name IS NULL THEN
            RAISE EXCEPTION 'Prescription line % has no medicine name.', v_pos + 1 USING ERRCODE = '22023';
        END IF;
        INSERT INTO public.prescription_items (
            prescription_id, medicine_id, medicine_name_snapshot, generic_name_snapshot, strength_snapshot,
            dosage_form_snapshot, dosage, frequency, duration, route, instructions, source, position
        ) VALUES (
            v_new_id, CASE WHEN v_med.medicine_name IS NOT NULL THEN public.try_uuid(v_item->>'medicine_id') END,
            v_name, v_med.generic_name, COALESCE(v_med.strength, public.clean_clinical_text(v_item->>'strength', 60)),
            v_med.dosage_form,
            public.clean_clinical_text(v_item->>'dosage', 120), public.clean_clinical_text(v_item->>'frequency', 120),
            public.clean_clinical_text(v_item->>'duration', 120), public.clean_clinical_text(v_item->>'route', 60),
            public.clean_clinical_text(v_item->>'instructions', 500),
            CASE WHEN v_med.medicine_name IS NULL THEN 'manual' ELSE 'library' END, v_pos
        );
        v_legacy := v_legacy || jsonb_build_object(
            'name', v_name || COALESCE(' ' || COALESCE(v_med.strength, public.clean_clinical_text(v_item->>'strength', 60)), ''),
            'dosage', public.clean_clinical_text(v_item->>'dosage', 120),
            'duration', public.clean_clinical_text(v_item->>'duration', 120),
            'instruction', concat_ws(' — ', public.clean_clinical_text(v_item->>'frequency', 120),
                                     public.clean_clinical_text(v_item->>'route', 60),
                                     public.clean_clinical_text(v_item->>'instructions', 500)));
        v_pos := v_pos + 1;
    END LOOP;

    UPDATE public.prescriptions SET
        medicines = v_legacy, medications = v_legacy, status = 'final',
        finalized_at = NOW(), finalized_by = auth.uid(), updated_at = NOW()
    WHERE id = v_new_id;
    UPDATE public.prescriptions SET status = 'superseded', superseded_by = v_new_id, updated_at = NOW()
    WHERE id = v_old.id;

    PERFORM public.write_clinical_audit('PRESCRIPTION_UPDATED', 'prescriptions', v_new_id, NULL,
        jsonb_build_object('amends', v_old.id, 'version', v_old.version + 1, 'item_count', v_pos));

    RETURN jsonb_build_object('success', true, 'prescription_id', v_new_id, 'version', v_old.version + 1);
END;
$$;

-- ==============================================================================
-- 10. FUNCTION PRIVILEGES
-- ==============================================================================
REVOKE EXECUTE ON FUNCTION public.write_clinical_audit(TEXT, TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_medicines(TEXT, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_clinical_suggestions(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.import_medicines(TEXT, TEXT, JSONB, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finalize_consultation(UUID, TEXT, TEXT, JSONB, JSONB, JSONB, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.amend_prescription(UUID, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_medicines(TEXT, INTEGER), public.get_clinical_suggestions(UUID),
    public.import_medicines(TEXT, TEXT, JSONB, JSONB),
    public.finalize_consultation(UUID, TEXT, TEXT, JSONB, JSONB, JSONB, BOOLEAN, TEXT, TEXT, TEXT),
    public.amend_prescription(UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicines, public.clinical_tests, public.suggestion_rules TO authenticated;
GRANT SELECT ON public.medicine_imports, public.prescription_items TO authenticated;

-- ==============================================================================
-- END OF 03_MEDICINE_DECISION_SUPPORT.sql
-- ==============================================================================
