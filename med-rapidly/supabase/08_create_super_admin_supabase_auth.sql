-- ============================================================================
-- Med Rapidly - Create Super Admin in Supabase Auth
-- Email: shahidbcsm@gmail.com
-- Password: Shahideeba@19019
-- This creates the user in BOTH auth.users AND profiles tables
-- ============================================================================

-- IMPORTANT: This requires service_role key permissions
-- If you get permission errors, you need to run this via Supabase Dashboard
-- or use an admin API call

-- ============================================================================
-- STEP 1: Create user in Supabase Auth (auth.users table)
-- ============================================================================

-- First, generate the password hash using pgcrypto
-- Copy the result and use it below
SELECT crypt('Shahideeba@19019', gen_salt('bf', 10)) as password_hash;

-- Then insert into auth.users
-- Note: You may need to run this via Supabase Dashboard as it requires service_role
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    confirmed_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'shahidbcsm@gmail.com',
    crypt('Shahideeba@19019', gen_salt('bf', 10)),
    NOW(), -- Email confirmed immediately
    json_build_object(
        'full_name', 'Shahid Babu',
        'role', 'super_admin'
    ),
    json_build_object(
        'role', 'super_admin'
    ),
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    NOW(),
    '',
    NOW()
);

-- ============================================================================
-- STEP 2: Create entry in profiles table (required by the app)
-- ============================================================================

INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    account_status,
    created_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'shahidbcsm@gmail.com' LIMIT 1),
    'shahidbcsm@gmail.com',
    'Shahid Babu',
    'super_admin',
    true,
    'active',
    NOW()
);

-- ============================================================================
-- STEP 3: Create entry in users table (for backward compatibility)
-- ============================================================================

INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    role,
    status
) SELECT
    id,
    'shahidbcsm@gmail.com',
    crypt('Shahideeba@19019', gen_salt('bf', 10)),
    'Shahid Babu',
    '+91-9000-0000',
    'super_admin',
    'active'
FROM auth.users
WHERE email = 'shahidbcsm@gmail.com'
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    status = 'active';

-- ============================================================================
-- STEP 4: Verify everything
-- ============================================================================

-- Check auth.users
SELECT '✅ SUPABASE AUTH' as location, id, email, email_confirmed_at
FROM auth.users WHERE email = 'shahidbcsm@gmail.com';

-- Check profiles
SELECT '✅ PROFILES TABLE' as location, id, email, role, is_active
FROM profiles WHERE email = 'shahidbcsm@gmail.com';

-- Check users table
SELECT '✅ USERS TABLE' as location, id, email, full_name, role, status
FROM users WHERE email = 'shahidbcsm@gmail.com';
