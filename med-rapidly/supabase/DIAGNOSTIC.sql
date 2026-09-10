-- ============================================================================
-- Med Rapidly - DATABASE DIAGNOSTIC
-- Run this to check if database is properly set up
-- ============================================================================

-- ============================================================================
-- CHECK 1: Do all required tables exist?
-- ============================================================================
SELECT 'TABLE CHECK' as diagnostic, table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: Should show 15 tables (hospitals, departments, users, patients, etc.)
-- If empty: Schema wasn't created - run 01_init_database.sql

-- ============================================================================
-- CHECK 2: Does the super admin user exist?
-- ============================================================================
SELECT 'SUPER ADMIN CHECK' as diagnostic, id, email, full_name, role, status
FROM users
WHERE email = 'shahidbcsm@gmail.com';

-- Expected: One row with super_admin role and active status
-- If empty: User wasn't created - run 06_fix_admin_login.sql

-- ============================================================================
-- CHECK 3: Count of all data
-- ============================================================================
SELECT
    'DATA COUNT' as diagnostic,
    (SELECT COUNT(*) FROM hospitals) as hospitals,
    (SELECT COUNT(*) FROM departments) as departments,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM patients) as patients,
    (SELECT COUNT(*) FROM appointments) as appointments;

-- Expected after reset: 0, 0, 1 (just super admin), 0, 0

-- ============================================================================
-- CHECK 4: User details
-- ============================================================================
SELECT
    'USER DETAILS' as diagnostic,
    id,
    email,
    full_name,
    role,
    status,
    password_hash,
    CASE
        WHEN password_hash LIKE '$2a$10$%' THEN 'Valid Bcrypt'
        WHEN password_hash = '$2a$10$PASTE_BCRYPT_HASH_HERE' THEN 'Invalid Placeholder'
        ELSE 'Unknown Format'
    END as password_status
FROM users
WHERE email = 'shahidbcsm@gmail.com';

-- ============================================================================
-- CHECK 5: Are foreign keys properly set?
-- ============================================================================
SELECT
    'FOREIGN KEYS' as diagnostic,
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
  AND constraint_name LIKE '%fk%'
LIMIT 10;

-- Expected: Should show multiple foreign key constraints

-- ============================================================================
-- CHECK 6: Do indexes exist?
-- ============================================================================
SELECT
    'INDEXES' as diagnostic,
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
LIMIT 15;

-- Expected: Should show indexes like idx_users_email, idx_hospitals_created_by, etc.

-- ============================================================================
-- CHECK 7: Supabase Auth - Do profiles exist?
-- ============================================================================
SELECT 'PROFILES TABLE' as diagnostic, id, email, role, is_active
FROM profiles
WHERE email = 'shahidbcsm@gmail.com';

-- Expected: One row with super_admin

-- ============================================================================
-- CHECK 8: Check Supabase Auth Users
-- ============================================================================
SELECT 'SUPABASE AUTH' as diagnostic, id, email, email_confirmed_at
FROM auth.users
WHERE email = 'shahidbcsm@gmail.com';

-- Expected: One row with email_confirmed_at set to a timestamp

-- ============================================================================
-- RESULTS INTERPRETATION
-- ============================================================================
-- If all checks pass: Database is healthy, issue is in application code
-- If CHECK 1 fails: Run 01_init_database.sql
-- If CHECK 2 fails: Run 06_fix_admin_login.sql
-- If CHECK 4 shows invalid password: Run 06_fix_admin_login.sql again
-- If CHECK 7 or 8 fails: Need to create profiles/auth tables
