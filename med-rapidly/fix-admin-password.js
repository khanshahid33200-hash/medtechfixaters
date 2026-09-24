#!/usr/bin/env node

/**
 * Fix Super Admin Password
 * This generates a proper bcrypt hash and provides SQL to update it
 */

const bcrypt = require('bcryptjs');

const email = 'shahidbcsm@gmail.com';
const password = '<REDACTED-ROTATE-THIS-PASSWORD>';
const saltRounds = 10;

try {
    // Generate hash
    const hash = bcrypt.hashSync(password, saltRounds);

    // Test verification
    const isValid = bcrypt.compareSync(password, hash);

    console.log('\n' + '='.repeat(80));
    console.log('SUPER ADMIN PASSWORD FIX');
    console.log('='.repeat(80));
    console.log('\n📧 Email: ' + email);
    console.log('🔐 Password: ' + password);
    console.log('\n✅ Generated Hash:');
    console.log(hash);
    console.log('\n✅ Hash Verification Test: ' + (isValid ? 'PASSED ✓' : 'FAILED ✗'));

    console.log('\n' + '='.repeat(80));
    console.log('SQL TO FIX PASSWORD:');
    console.log('='.repeat(80));
    console.log('\nCopy and paste this in Supabase SQL Editor:\n');

    const sql = `-- Fix Super Admin Password
UPDATE users
SET password_hash = '${hash}'
WHERE email = '${email}';

-- Verify
SELECT id, email, full_name, role, password_hash
FROM users
WHERE email = '${email}';`;

    console.log(sql);
    console.log('\n' + '='.repeat(80));
    console.log('\nAfter running the SQL above:');
    console.log('1. Try login again with:');
    console.log('   Email: ' + email);
    console.log('   Password: ' + password);
    console.log('2. If still fails, check browser console for errors');
    console.log('3. Check if JWT_SECRET is set in environment variables\n');
    console.log('='.repeat(80) + '\n');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
