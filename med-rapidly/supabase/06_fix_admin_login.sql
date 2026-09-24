-- ============================================================================
-- Med Rapidly - Fix Super Admin Login (MR SHAHID BABU)
-- Email: shahidbcsm@gmail.com
-- Password: <REDACTED-ROTATE-THIS-PASSWORD>
-- ============================================================================

-- STEP 1: Generate proper bcrypt hash (run this first to see the hash)
SELECT crypt('<REDACTED-ROTATE-THIS-PASSWORD>', gen_salt('bf', 10)) as new_password_hash;

-- Copy the result above, then use it in STEP 2 below

-- ============================================================================
-- STEP 2: Update the user with the proper hash
-- ============================================================================

-- Option A: If crypt() function worked above, run this:
UPDATE users
SET password_hash = crypt('<REDACTED-ROTATE-THIS-PASSWORD>', gen_salt('bf', 10))
WHERE email = 'shahidbcsm@gmail.com';

-- Option B: If you got a hash from STEP 1, replace PASTE_HASH_HERE and run:
-- UPDATE users
-- SET password_hash = 'PASTE_HASH_HERE'
-- WHERE email = 'shahidbcsm@gmail.com';

-- ============================================================================
-- STEP 3: Verify the fix
-- ============================================================================
SELECT
    id,
    email,
    full_name,
    role,
    status,
    password_hash,
    CASE
        WHEN password_hash LIKE '$2a$10$%' THEN '✅ Valid bcrypt hash'
        WHEN password_hash = '$2a$10$PASTE_BCRYPT_HASH_HERE' THEN '❌ Still placeholder'
        ELSE '❌ Invalid hash format'
    END as hash_status
FROM users
WHERE email = 'shahidbcsm@gmail.com';

-- ============================================================================
-- Expected result after running above:
-- Should show:
-- hash_status: ✅ Valid bcrypt hash
-- password_hash: $2a$10$... (actual hash, not placeholder)
-- ============================================================================
