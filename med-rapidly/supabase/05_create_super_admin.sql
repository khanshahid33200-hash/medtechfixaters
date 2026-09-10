-- ============================================================================
-- Med Rapidly - Create Super Admin User
-- Email: shahidbcsm@gmail.com
-- Username: mrshahidbabu
-- Role: super_admin
-- ============================================================================

-- IMPORTANT: Before running this, you need to generate the password hash
--
-- Option 1: Use PostgreSQL's crypt function (requires pgcrypto extension)
-- SELECT crypt('Shahideeba@19019', gen_salt('bf', 10));
--
-- Option 2: Generate in Node.js (run this in your app):
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('Shahideeba@19019', 10);
-- console.log(hash);

-- Replace 'PASTE_BCRYPT_HASH_HERE' with the actual hash generated above
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    role,
    status,
    hospital_id,
    created_at
) VALUES (
    gen_random_uuid(),
    'shahidbcsm@gmail.com',
    '$2a$10$PASTE_BCRYPT_HASH_HERE',  -- REPLACE WITH ACTUAL HASH
    'Shahid Babu',
    '+91-9000-0000',
    'super_admin',
    'active',
    NULL,
    CURRENT_TIMESTAMP
)
RETURNING id, email, role, status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After inserting, verify with:
-- SELECT id, email, full_name, role, status FROM users
-- WHERE email = 'shahidbcsm@gmail.com';
