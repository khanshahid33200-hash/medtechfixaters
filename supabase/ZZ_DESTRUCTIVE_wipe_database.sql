-- ============================================================================
-- ⚠️  DESTRUCTIVE — WIPES public SCHEMA + ALL STORAGE. DOES NOT TOUCH auth.users.
-- ============================================================================
-- This drops every table, function, trigger, view, and sequence in the
-- `public` schema, and deletes every file/bucket in Supabase Storage.
--
-- It deliberately does NOT touch:
--   - auth.* (auth.users, sessions, identities — every login account survives)
--   - any other schema (extensions, storage's own internal tables, etc.)
--
-- After running this, every hospital/doctor/appointment/chat/log/etc. row is
-- gone, and the site's login accounts still exist but have no profile row
-- (public.profiles is gone too) — so nobody can meaningfully log in again
-- until you re-run 01_master_setup.sql onward. If you want a genuinely
-- clean slate including accounts, delete users from Authentication → Users
-- in the dashboard yourself; this script intentionally will not do that.
--
-- Run in: https://supabase.com/dashboard/project/ohjublpvkzobzkrgkdtj/sql/new
-- THERE IS NO UNDO. Make sure this is really what you want before running it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: STORAGE — delete every object, then every bucket
-- ----------------------------------------------------------------------------
DELETE FROM storage.objects;
DELETE FROM storage.buckets;

-- ----------------------------------------------------------------------------
-- STEP 2: PUBLIC SCHEMA — drop everything (tables, functions, triggers,
-- views, sequences all go with CASCADE), then recreate it empty with the
-- same grants every prior migration in this folder expects to already
-- exist, so 01_master_setup.sql (or whatever you rebuild with) can run
-- cleanly against a fresh schema.
-- ----------------------------------------------------------------------------
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT USAGE, CREATE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role, supabase_admin, supabase_auth_admin;

-- Note: DROP SCHEMA public CASCADE also silently dropped the
-- on_auth_user_created trigger on auth.users (it depended on
-- public.handle_new_user(), which no longer exists) — auth.users rows
-- themselves are untouched, but nothing will auto-create a profiles row for
-- them anymore until you re-run the setup script that recreates that
-- trigger.
