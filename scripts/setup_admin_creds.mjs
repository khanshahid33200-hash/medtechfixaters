#!/usr/bin/env node

/**
 * ==============================================================================
 * setup_admin_creds.mjs
 * MedTechFixaters Super Admin Account Provisioning Helper
 *
 * NOTE: Credentials are NEVER stored in this codebase.
 * Pass the password via environment variable ADMIN_PASSWORD or CLI argument:
 *   ADMIN_PASSWORD="your_password" node scripts/setup_admin_creds.mjs
 *   or: node scripts/setup_admin_creds.mjs "your_password"
 * ==============================================================================
 */

import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { createClient } = require(path.resolve(process.cwd(), 'webapp/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yweywvnivyftwtglxavr.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXl3dm5pdnlmdHd0Z2x4YXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTEyOTgsImV4cCI6MjEwNTI4NzI5OH0.niHlKWf4zWGQ1sb59ZZ2n2SnZxbLeKfqkSkJnWGIxts';

const email = (process.env.SUPER_ADMIN_EMAIL || 'shahidbcsm@gmail.com').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || process.argv[2] || '';
const username = (process.env.SUPER_ADMIN_USERNAME || 'mrshahidbabu').trim();
const fullName = 'Shahid Babu';

if (!password) {
  console.error('ERROR: No password provided. Please supply password via ADMIN_PASSWORD environment variable or argument.');
  console.error('Usage: node scripts/setup_admin_creds.mjs <password>');
  process.exit(1);
}

async function setup() {
  console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false }
  });

  console.log(`Verifying admin credentials for ${email}...`);
  let { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password
  });

  let user = signInData?.user;
  let session = signInData?.session;

  if (signInError) {
    console.log(`Sign-in failed (${signInError.message}). Attempting sign-up...`);
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        }
      }
    });

    if (signUpError) {
      console.error('Sign-up failed:', signUpError.message);
      process.exit(1);
    }

    user = signUpData?.user;
    session = signUpData?.session;

    if (!session) {
      const retry = await client.auth.signInWithPassword({ email, password });
      user = retry.data?.user || user;
      session = retry.data?.session;
    }
  }

  if (session?.access_token) {
    console.log('Ensuring super_admin role via authenticated RPC...');
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      },
      auth: { persistSession: false }
    });

    const { data: rpcRes, error: rpcErr } = await authClient.rpc('admin_provision_super_admin', {
      p_email: email,
      p_username: username,
      p_full_name: fullName
    });

    if (rpcErr) {
      console.warn('RPC Notice:', rpcErr.message);
    }

    const { data: prof } = await authClient
      .from('profiles')
      .select('id, email, username, role, is_active, account_status')
      .eq('id', user.id)
      .maybeSingle();

    if (prof?.role === 'super_admin' && prof?.is_active) {
      console.log('✅ Super Admin account verified in Supabase Auth & public.profiles.');
      console.log(`Email : ${email}`);
      console.log(`Role  : ${prof.role}`);
      console.log(`Status: ${prof.account_status}`);
    }
  }
}

setup().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
