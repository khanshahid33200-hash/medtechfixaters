-- ============================================================================
-- Med Rapidly - Authentication & User Management Setup
-- This file creates authentication-related functions and procedures
-- ============================================================================

-- ============================================================================
-- FUNCTION: Hash Password (for integration with bcryptjs)
-- Note: For production, use bcryptjs in application code, not in SQL
-- ============================================================================
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder. Use bcryptjs in your Node.js application
    -- This function is here for reference only
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Super Admin User
-- ============================================================================
CREATE OR REPLACE FUNCTION create_super_admin(
    p_email VARCHAR,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_phone VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone,
        role,
        status,
        hospital_id
    ) VALUES (
        p_email,
        p_password_hash,
        p_full_name,
        p_phone,
        'super_admin',
        'active',
        NULL
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Hospital Admin
-- ============================================================================
CREATE OR REPLACE FUNCTION create_hospital_admin(
    p_hospital_id UUID,
    p_email VARCHAR,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_phone VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Verify hospital exists
    IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
        RAISE EXCEPTION 'Hospital not found';
    END IF;

    INSERT INTO users (
        hospital_id,
        email,
        password_hash,
        full_name,
        phone,
        role,
        status
    ) VALUES (
        p_hospital_id,
        p_email,
        p_password_hash,
        p_full_name,
        p_phone,
        'hospital_admin',
        'active'
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Doctor
-- ============================================================================
CREATE OR REPLACE FUNCTION create_doctor(
    p_hospital_id UUID,
    p_email VARCHAR,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_phone VARCHAR,
    p_department_id UUID,
    p_qualification TEXT,
    p_registration_number VARCHAR,
    p_specialisation TEXT,
    p_consultation_fee NUMERIC
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Verify hospital and department exist
    IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
        RAISE EXCEPTION 'Hospital not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM departments WHERE id = p_department_id AND hospital_id = p_hospital_id) THEN
        RAISE EXCEPTION 'Department not found in this hospital';
    END IF;

    INSERT INTO users (
        hospital_id,
        email,
        password_hash,
        full_name,
        phone,
        department_id,
        role,
        qualification,
        registration_number,
        specialisation,
        consultation_fee,
        status
    ) VALUES (
        p_hospital_id,
        p_email,
        p_password_hash,
        p_full_name,
        p_phone,
        p_department_id,
        'doctor',
        p_qualification,
        p_registration_number,
        p_specialisation,
        p_consultation_fee,
        'active'
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Reception Staff
-- ============================================================================
CREATE OR REPLACE FUNCTION create_reception_staff(
    p_hospital_id UUID,
    p_email VARCHAR,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_phone VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Verify hospital exists
    IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
        RAISE EXCEPTION 'Hospital not found';
    END IF;

    INSERT INTO users (
        hospital_id,
        email,
        password_hash,
        full_name,
        phone,
        role,
        status
    ) VALUES (
        p_hospital_id,
        p_email,
        p_password_hash,
        p_full_name,
        p_phone,
        'reception',
        'active'
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Update Last Login
-- ============================================================================
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Verify User Email and Password
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_user_credentials(
    p_email VARCHAR,
    p_password_hash TEXT
)
RETURNS TABLE (
    id UUID,
    hospital_id UUID,
    email VARCHAR,
    full_name TEXT,
    role VARCHAR,
    status VARCHAR,
    department_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        users.id,
        users.hospital_id,
        users.email,
        users.full_name,
        users.role,
        users.status,
        users.department_id
    FROM users
    WHERE users.email = p_email
        AND users.password_hash = p_password_hash
        AND users.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get User by Email
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR)
RETURNS TABLE (
    id UUID,
    hospital_id UUID,
    email VARCHAR,
    phone VARCHAR,
    full_name TEXT,
    role VARCHAR,
    department_id UUID,
    status VARCHAR,
    last_login_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        users.id,
        users.hospital_id,
        users.email,
        users.phone,
        users.full_name,
        users.role,
        users.department_id,
        users.status,
        users.last_login_at
    FROM users
    WHERE users.email = p_email;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get User by ID
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    hospital_id UUID,
    email VARCHAR,
    phone VARCHAR,
    full_name TEXT,
    role VARCHAR,
    qualification TEXT,
    specialisation TEXT,
    department_id UUID,
    consultation_fee NUMERIC,
    status VARCHAR,
    created_at TIMESTAMP,
    last_login_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        users.id,
        users.hospital_id,
        users.email,
        users.phone,
        users.full_name,
        users.role,
        users.qualification,
        users.specialisation,
        users.department_id,
        users.consultation_fee,
        users.status,
        users.created_at,
        users.last_login_at
    FROM users
    WHERE users.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Hospital Users by Role
-- ============================================================================
CREATE OR REPLACE FUNCTION get_hospital_users_by_role(
    p_hospital_id UUID,
    p_role VARCHAR
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name TEXT,
    phone VARCHAR,
    specialisation TEXT,
    status VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        users.id,
        users.email,
        users.full_name,
        users.phone,
        users.specialisation,
        users.status,
        users.created_at
    FROM users
    WHERE users.hospital_id = p_hospital_id
        AND users.role = p_role
    ORDER BY users.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Deactivate User
-- ============================================================================
CREATE OR REPLACE FUNCTION deactivate_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET status = 'inactive' WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Activate User
-- ============================================================================
CREATE OR REPLACE FUNCTION activate_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET status = 'active' WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Update User Password
-- ============================================================================
CREATE OR REPLACE FUNCTION update_user_password(
    p_user_id UUID,
    p_new_password_hash TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET password_hash = p_new_password_hash
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Log Audit Entry
-- ============================================================================
CREATE OR REPLACE FUNCTION log_audit_entry(
    p_hospital_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_changes JSONB,
    p_ip_address VARCHAR,
    p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        hospital_id,
        user_id,
        action,
        resource_type,
        resource_id,
        changes,
        ip_address,
        user_agent
    ) VALUES (
        p_hospital_id,
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_changes,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISSIONS SETUP (RLS - Row Level Security)
-- Note: Enable these if using Supabase or similar PostgreSQL service
-- ============================================================================

-- Enable RLS on sensitive tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prescription_pdfs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prescription_access ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy for Users (allows users to see only their own user record)
-- CREATE POLICY users_own_user ON users
--     FOR SELECT USING (auth.uid()::uuid = id);

-- Example RLS Policy for Consultations (allows doctors to see consultations for their hospital)
-- CREATE POLICY consultations_visible_to_hospital_staff ON consultations
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM appointments a
--             JOIN users u ON u.id = auth.uid()::uuid
--             WHERE a.id = consultations.appointment_id
--             AND a.hospital_id = u.hospital_id
--         )
--     );

-- ============================================================================
-- HELPFUL QUERIES
-- ============================================================================
-- Get total active users: SELECT COUNT(*) FROM users WHERE status = 'active';
-- Get doctors by hospital: SELECT id, full_name, specialisation FROM users WHERE role = 'doctor' AND hospital_id = 'YOUR_HOSPITAL_ID';
-- Get recent logins: SELECT email, full_name, last_login_at FROM users WHERE last_login_at IS NOT NULL ORDER BY last_login_at DESC LIMIT 10;
-- Get audit trail: SELECT action, resource_type, created_at FROM audit_log WHERE hospital_id = 'YOUR_HOSPITAL_ID' ORDER BY created_at DESC LIMIT 50;
