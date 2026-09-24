// Supabase Edge Function: payments
//
// Server-side Razorpay flow for individual-doctor subscriptions. The browser never
// sees the key secret and never decides the price or whether a payment succeeded.
//
//   create_order   -> creates a Razorpay order for the caller at the server-side price
//   verify_payment -> verifies the checkout signature, re-fetches the payment from
//                     Razorpay, checks it is captured for that order and amount, then
//                     activates the subscription via activate_paid_subscription()
//
// Deploy:
//   supabase functions deploy payments
// Secrets:
//   supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=xxx
//   supabase secrets set PROJECT_SERVICE_ROLE_KEY=your_service_role_key
//   supabase secrets set ALLOWED_ORIGINS=https://www.medtechfixaters.in,https://medtechfixaters.in
// Then set platform_settings.payments_required = true to disable free activation.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('PROJECT_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || ''
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || ''

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://www.medtechfixaters.in,https://medtechfixaters.in,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Prices in paise. The only source of truth for what a plan costs.
const PLANS: Record<string, { amount: number; label: string }> = {
  doctor_monthly: { amount: 99900, label: 'Individual Doctor — Monthly' },
  doctor_annual: { amount: 999900, label: 'Individual Doctor — Annual' },
}

let corsHeaders: Record<string, string> = {}

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function razorpay(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status} ${body?.error?.description || ''}`)
  return body
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed.' }, 405)

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SERVICE_ROLE_KEY) {
    return json({ success: false, error: 'Payments are not configured.' }, 503)
  }

  try {
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return json({ success: false, error: 'Not authenticated.' }, 401)

    const { data: profile } = await callerClient
      .from('profiles')
      .select('role, client_type, account_status, is_active')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || profile.role !== 'doctor' || profile.client_type !== 'individual_doctor' || !profile.is_active
        || (profile.account_status && profile.account_status !== 'active')) {
      return json({ success: false, error: 'Only active individual-doctor accounts can subscribe.' }, 403)
    }

    const { action, payload } = await req.json()

    if (action === 'create_order') {
      const planId = payload?.plan_id === 'doctor_annual' ? 'doctor_annual' : 'doctor_monthly'
      const plan = PLANS[planId]
      const order = await razorpay('/orders', {
        method: 'POST',
        body: JSON.stringify({
          amount: plan.amount,
          currency: 'INR',
          receipt: `sub_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: { doctor_id: user.id, plan_id: planId },
        }),
      })
      return json({
        success: true,
        key_id: RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        description: plan.label,
      })
    }

    if (action === 'verify_payment') {
      const orderId = String(payload?.razorpay_order_id || '')
      const paymentId = String(payload?.razorpay_payment_id || '')
      const signature = String(payload?.razorpay_signature || '')
      if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/.test(signature)) {
        return json({ success: false, error: 'Invalid payment reference.' }, 400)
      }

      const expected = await hmacSha256Hex(RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`)
      if (!timingSafeEqual(expected, signature)) {
        return json({ success: false, error: 'Payment signature verification failed.' }, 400)
      }

      // The signature proves Razorpay issued it; the API confirms the money actually moved,
      // for this caller's order, at the server-side price.
      const [order, payment] = await Promise.all([razorpay(`/orders/${orderId}`), razorpay(`/payments/${paymentId}`)])
      const planId = order?.notes?.plan_id === 'doctor_annual' ? 'doctor_annual' : 'doctor_monthly'
      if (order?.notes?.doctor_id !== user.id) {
        return json({ success: false, error: 'This payment belongs to a different account.' }, 403)
      }
      if (payment.order_id !== orderId || payment.status !== 'captured' || payment.amount !== PLANS[planId].amount
          || order.amount !== PLANS[planId].amount || payment.currency !== 'INR') {
        return json({ success: false, error: 'Payment has not been captured for the expected amount.' }, 400)
      }

      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
      const { data, error } = await admin.rpc('activate_paid_subscription', {
        p_doctor_id: user.id,
        p_plan_id: planId,
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_signature: signature,
      })
      if (error) {
        console.error('activate_paid_subscription failed:', error.message)
        return json({ success: false, error: 'Payment verified but activation failed. Please contact support.' }, 500)
      }
      return json(data)
    }

    return json({ success: false, error: 'Unknown action.' }, 400)
  } catch (e) {
    console.error('payments error:', e)
    return json({ success: false, error: 'Internal error.' }, 500)
  }
})
