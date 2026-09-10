-- ============================================================================
-- MEDTECH FIXATERS — STANDALONE SUPER ADMIN CREATION SCRIPT (/mrshahidbabu)
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
-- ============================================================================

-- Ensure pgcrypto extension exists for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure profiles table exists in case tables were dropped
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_code TEXT UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'doctor' NOT NULL,
    hospital_id UUID,
    department_id UUID,
    department TEXT,
    specialization TEXT,
    registration_number TEXT,
    account_status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'shahidbcsm@gmail.com';
  user_password TEXT := 'Shahideeba@19019';
BEGIN
  -- 1. Create account in Supabase Auth (encrypted with pgcrypto bcrypt)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(user_email)) THEN
    UPDATE auth.users SET
      encrypted_password = crypt(user_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE LOWER(email) = LOWER(user_email)
    RETURNING id INTO new_user_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_anonymous, created_at, updated_at
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      user_email, crypt(user_password, gen_salt('bf')), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"role": "super_admin", "full_name": "Platform Super Admin"}'::jsonb,
      false, false, NOW(), NOW()
    );
  END IF;

  -- 1.5. Insert into auth.identities (Required for Supabase Auth GoTrue)
  IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = new_user_id AND provider = 'email') THEN
    UPDATE auth.identities SET
      identity_data = jsonb_build_object('sub', new_user_id::text, 'email', LOWER(user_email)),
      updated_at = NOW()
    WHERE user_id = new_user_id AND provider = 'email';
  ELSE
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', LOWER(user_email)),
      'email', LOWER(user_email), NOW(), NOW(), NOW()
    );
  END IF;

  -- 2. Upsert profile record with super_admin role and active status
  INSERT INTO public.profiles (
    id, full_name, email, role, is_active, account_status
  ) VALUES (
    new_user_id, 'Platform Super Admin', user_email, 'super_admin', true, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    account_status = 'active';

  RAISE NOTICE 'Super Admin user created successfully! Email: %, Password: %', user_email, user_password;
END $$;
