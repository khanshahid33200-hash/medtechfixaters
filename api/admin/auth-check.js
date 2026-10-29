import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yweywvnivyftwtglxavr.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXl3dm5pdnlmdHd0Z2x4YXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTEyOTgsImV4cCI6MjEwNTI4NzI5OH0.niHlKWf4zWGQ1sb59ZZ2n2SnZxbLeKfqkSkJnWGIxts';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROJECT_SERVICE_ROLE_KEY || '';

export function polyfillReqRes(req, res) {
  if (!res.status) {
    res.status = function(code) { res.statusCode = code; return res; };
  }
  if (!res.json) {
    res.json = function(data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }
  if (!res.send) {
    res.send = function(data) {
      res.end(data);
      return res;
    };
  }
  if (!req.query && req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      req.query = Object.fromEntries(u.searchParams.entries());
    } catch {}
  }
}

/**
 * Server-side authorization check for Super Admin routes.
 * Enforces:
 * 1. Valid Supabase Auth session token in Authorization header
 * 2. Profile role must strictly be 'super_admin'
 * 3. Profile must be active and not suspended/banned/deleted
 */
export async function verifySuperAdmin(req, res) {
  polyfillReqRes(req, res);
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Missing Bearer token.' });
    return null;
  }

  try {
    // Authenticate user with their token
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userErr } = await client.auth.getUser();

    if (userErr || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
      return null;
    }

    // Check role in database
    const { data: profile, error: profErr } = await client
      .from('profiles')
      .select('id, email, username, full_name, role, is_active, account_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profErr || !profile) {
      res.status(403).json({ success: false, error: 'User profile not found in authorization directory.' });
      return null;
    }

    if (profile.role !== 'super_admin' || !profile.is_active || (profile.account_status && profile.account_status !== 'active')) {
      res.status(403).json({ success: false, error: 'Access forbidden: Super Admin privileges required.' });
      return null;
    }

    return { user, profile, client };
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal authorization error: ' + err.message });
    return null;
  }
}
