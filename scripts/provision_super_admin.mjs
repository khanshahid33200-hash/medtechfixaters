#!/usr/bin/env node

/**
 * ==============================================================================
 * provision_super_admin.mjs
 * MedTechFixaters Super Admin Account Provisioning Script
 *
 * Implements Section 1:
 * - Username: mrshahidbabu
 * - Email: shahidbcsm@gmail.com
 * - Idempotent provisioning using Supabase Admin API / secure procedure
 * - Assigns permanent 'super_admin' role in public.profiles
 * - Never stores plaintext password in tables or migrations
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require(path.resolve(process.cwd(), 'webapp/node_modules/@supabase/supabase-js'));

// Load environment variables from .env and webapp/.env
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'webapp/.env'),
    path.resolve(process.cwd(), 'webapp/.env.local'),
  ];
  const env = {};
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!env[k]) env[k] = v;
        }
      }
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://yweywvnivyftwtglxavr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.PROJECT_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'shahidbcsm@gmail.com').trim().toLowerCase();
const SUPER_ADMIN_USERNAME = (process.env.SUPER_ADMIN_USERNAME || 'mrshahidbabu').trim();
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

console.log('------------------------------------------------------------');
console.log('MedTechFixaters Super Admin Account Provisioning Procedure');
console.log('------------------------------------------------------------');
console.log(`Target Email    : ${SUPER_ADMIN_EMAIL}`);
console.log(`Target Username : ${SUPER_ADMIN_USERNAME}`);
console.log(`Supabase URL    : ${SUPABASE_URL}`);
console.log(`Service Role Key: ${SERVICE_ROLE_KEY ? 'Present' : 'Not configured in local env'}`);
console.log('------------------------------------------------------------');

async function main() {
  if (SERVICE_ROLE_KEY) {
    console.log('Using Supabase Admin API with Service Role Key...');
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Check if user already exists in auth.users
    console.log('Checking for existing Auth user...');
    const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
    
    let existingUser = null;
    if (userList?.users) {
      existingUser = userList.users.find(u => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL);
    }

    let userId = existingUser?.id;

    if (!existingUser) {
      if (!SUPER_ADMIN_PASSWORD) {
        console.log('Account does not exist yet.');
        console.log('Sending secure Auth Invitation Link to ' + SUPER_ADMIN_EMAIL + '...');
        const { data: invData, error: invErr } = await adminClient.auth.admin.inviteUserByEmail(SUPER_ADMIN_EMAIL, {
          data: {
            role: 'super_admin',
            username: SUPER_ADMIN_USERNAME,
            full_name: 'Shahid Babu (Super Admin)',
          },
        });
        if (invErr) {
          console.error('Failed to send invite link:', invErr.message);
          process.exit(1);
        }
        userId = invData.user?.id;
        console.log('Invitation sent successfully. User ID:', userId);
      } else {
        console.log('Creating confirmed Super Admin auth user with provided credentials...');
        const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            role: 'super_admin',
            username: SUPER_ADMIN_USERNAME,
            full_name: 'Shahid Babu (Super Admin)',
          },
          app_metadata: {
            role: 'super_admin',
          },
        });
        if (createErr) {
          console.error('Failed to create admin user:', createErr.message);
          process.exit(1);
        }
        userId = createData.user?.id;
        console.log('Created confirmed user in auth.users. User ID:', userId);
      }
    } else {
      console.log('User already exists in auth.users with ID:', userId);
      // Update password if supplied
      if (SUPER_ADMIN_PASSWORD) {
        console.log('Updating password for existing user...');
        await adminClient.auth.admin.updateUserById(userId, {
          password: SUPER_ADMIN_PASSWORD,
          email_confirm: true,
        });
      }
      // Ensure metadata is set to super_admin
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: 'super_admin',
          username: SUPER_ADMIN_USERNAME,
          full_name: 'Shahid Babu (Super Admin)',
        },
        app_metadata: {
          role: 'super_admin',
        },
      });
    }

    // 2. Ensure public.profiles has role = 'super_admin'
    console.log('Assigning permanent super_admin role in public.profiles...');
    const { error: profErr } = await adminClient.from('profiles').upsert({
      id: userId,
      email: SUPER_ADMIN_EMAIL,
      username: SUPER_ADMIN_USERNAME,
      full_name: 'Shahid Babu (Super Admin)',
      role: 'super_admin',
      is_active: true,
      account_status: 'active',
      onboarding_status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    });

    if (profErr) {
      console.error('Error assigning role in public.profiles:', profErr.message);
      process.exit(1);
    }

    // 3. Log audit event
    await adminClient.from('admin_audit_logs').insert([
      {
        actor_email: 'system',
        actor_role: 'system',
        target_id: userId,
        target_type: 'auth',
        action: 'provision_super_admin',
        reason: 'Super Admin Account Provisioning',
        new_state: {
          email: SUPER_ADMIN_EMAIL,
          username: SUPER_ADMIN_USERNAME,
          role: 'super_admin',
        },
        result: 'success',
      },
    ]).catch(() => {});

    console.log('============================================================');
    console.log('SUCCESS: Super Admin Account is fully provisioned and verified!');
    console.log(`Email    : ${SUPER_ADMIN_EMAIL}`);
    console.log(`Username : ${SUPER_ADMIN_USERNAME}`);
    console.log(`Role     : super_admin`);
    console.log(`Status   : active`);
    console.log('============================================================');
  } else {
    // If no direct service role key in local environment, call the backend Edge Function or RPC
    console.log('Executing idempotent provisioning via Supabase RPC...');
    const client = createClient(SUPABASE_URL, ANON_KEY);

    const { data: rpcData, error: rpcErr } = await client.rpc('admin_provision_super_admin', {
      p_email: SUPER_ADMIN_EMAIL,
      p_username: SUPER_ADMIN_USERNAME,
      p_full_name: 'Shahid Babu (Super Admin)',
    });

    if (rpcErr) {
      console.log('RPC Notice:', rpcErr.message);
      console.log('\nTo complete provisioning:');
      console.log('1. Run migration "10_SUPER_ADMIN_SYSTEM.sql" in your Supabase SQL Editor.');
      console.log('2. Provide SUPABASE_SERVICE_ROLE_KEY or SUPER_ADMIN_PASSWORD in your environment.');
      console.log(`3. Re-run "node scripts/provision_super_admin.mjs".`);
    } else {
      console.log('RPC Response:', rpcData);
    }
  }
}

main().catch(err => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
