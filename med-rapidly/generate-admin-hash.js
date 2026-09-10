#!/usr/bin/env node

/**
 * Generate bcrypt hash for super admin password
 * Run: node generate-admin-hash.js
 */

const bcrypt = require('bcryptjs');

const password = 'Shahideeba@19019';
const saltRounds = 10;

try {
    const hash = bcrypt.hashSync(password, saltRounds);

    console.log('\n' + '='.repeat(70));
    console.log('BCRYPT PASSWORD HASH GENERATED');
    console.log('='.repeat(70));
    console.log('\n📧 Email: shahidbcsm@gmail.com');
    console.log('🔐 Password: Shahideeba@19019');
    console.log('\n🔑 PASSWORD HASH:');
    console.log(hash);
    console.log('\n' + '='.repeat(70));
    console.log('NEXT STEPS:');
    console.log('='.repeat(70));
    console.log('1. Copy the hash above (the long string starting with $2a$10$)');
    console.log('2. Open: supabase/05_create_super_admin.sql');
    console.log('3. Replace "PASTE_BCRYPT_HASH_HERE" with the hash');
    console.log('4. Run the SQL in your Supabase dashboard');
    console.log('5. Login with email: shahidbcsm@gmail.com');
    console.log('\n' + '='.repeat(70) + '\n');

} catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
}
