import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  ''

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
  ''

export const SUPABASE_JWKS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_JWKS_URL) ||
  (SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '')

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder-key')

// SECURITY: the Supabase service_role (secret) key must NEVER be referenced
// here. Any env var read in this file is inlined into the public browser
// bundle by Vite — a `VITE_`-prefixed secret key ships to every visitor and
// bypasses all Row Level Security. Genuinely privileged operations (creating
// a doctor's auth user, etc.) must go through a Supabase Edge Function that
// holds SUPABASE_SERVICE_ROLE_KEY as a server-side project secret and is
// invoked via `supabase.functions.invoke(...)`. See supabase/functions/admin-ops.
