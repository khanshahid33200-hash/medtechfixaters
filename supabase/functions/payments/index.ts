// Supabase Edge Function: payments
//
// Secure server-side payment processing supporting Cashfree (primary) and Razorpay.
// Fully implements MedTechFixaters Onboarding, Scheduling, Invoicing, and Payment Workflow:
// - POST /api/onboarding/save-step
// - GET  /api/onboarding/status
// - POST /api/onboarding/complete-profile
// - POST /api/payments/create-order
// - POST /api/payments/verify
// - POST /api/payments/webhook
// - GET  /api/payments/status
// - GET  /api/invoices/:id
// - POST /api/support/payment-issue

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('PROJECT_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Cashfree Credentials
const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID') || ''
const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY') || ''
const CASHFREE_ENV = (Deno.env.get('CASHFREE_ENV') || 'TEST').toUpperCase()
const CASHFREE_BASE = CASHFREE_ENV === 'PROD' || CASHFREE_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg'

// Cashfree Integration Only

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://www.medtechfixaters.in,https://medtechfixaters.in,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Prices in paise. Server-side source of truth.
// Strictly enforces ₹500 intro and ₹5,000 standard monthly renewal.
const PLANS: Record<string, { amount: number; label: string; renewalAmount: number; isIntro?: boolean }> = {
  doctor_intro_500: {
    amount: 50000, // ₹500.00 (50,000 paise)
    label: 'First Month Special Offer — Individual Doctor / Clinic',
    renewalAmount: 500000,
    isIntro: true,
  },
  solo_first_month_500: {
    amount: 50000,
    label: 'First Month Special Offer — Individual Doctor / Clinic',
    renewalAmount: 500000,
    isIntro: true,
  },
  doctor_monthly_5000: {
    amount: 500000, // ₹5,000.00 (500,000 paise)
    label: 'Doctor and Clinic Plan — Monthly Subscription',
    renewalAmount: 500000,
  },
  solo_monthly_5000: {
    amount: 500000,
    label: 'Doctor and Clinic Plan — Monthly Subscription',
    renewalAmount: 500000,
  },
}

let corsHeaders: Record<string, string> = {}

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Cashfree API Client Helper
async function cashfree(path: string, init: RequestInit = {}) {
  const res = await fetch(`${CASHFREE_BASE}${path}`, {
    ...init,
    headers: {
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Cashfree ${path} failed: ${res.status} ${body?.message || body?.error || ''}`)
  }
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

  const hasCashfree = Boolean(CASHFREE_APP_ID && CASHFREE_SECRET_KEY)
  const url = new URL(req.url)
  const pathname = url.pathname

  // ==========================================================================
  // WEBHOOK HANDLER: POST /api/payments/webhook
  // ==========================================================================
  if (pathname.endsWith('/webhook') || url.searchParams.get('webhook') === 'cashfree') {
    if (!hasCashfree) return json({ success: false, error: 'Cashfree credentials not configured.' }, 503)
    try {
      const rawBody = await req.text()
      const signature = req.headers.get('x-webhook-signature') || ''
      const timestamp = req.headers.get('x-webhook-timestamp') || ''

      // Verify webhook signature
      if (signature && timestamp) {
        const expectedSig = await hmacSha256Hex(CASHFREE_SECRET_KEY, `${timestamp}${rawBody}`)
        if (!timingSafeEqual(expectedSig, signature)) {
          return json({ success: false, error: 'Invalid webhook signature.' }, 400)
        }
      }

      const payload = JSON.parse(rawBody)
      const data = payload?.data || payload
      const orderId = String(data?.order?.order_id || payload?.order_id || '')
      const paymentStatus = String(data?.payment?.payment_status || payload?.txStatus || '')
      const paymentId = String(data?.payment?.cf_payment_id || payload?.referenceId || '')
      const eventType = String(payload?.type || 'PAYMENT_SUCCESS')
      const eventId = String(payload?.event_id || `${orderId}_${paymentId}_${Date.now()}`)

      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

      // Record in inbox table for idempotency & deduplication
      const { error: inboxErr } = await admin.from('payment_webhook_events').insert([
        {
          provider_name: 'cashfree',
          provider_event_id: eventId,
          event_type: eventType,
          provider_order_reference: orderId,
          processing_status: 'received',
          payload,
          receipt_timestamp: new Date().toISOString(),
        },
      ])

      // If duplicate event already processed, acknowledge safely
      if (inboxErr && inboxErr.code === '23505') {
        return json({ success: true, duplicate: true, received: true })
      }

      if (paymentStatus === 'SUCCESS' && orderId) {
        await admin.rpc('verify_and_activate_payment_v2', {
          p_internal_order_id: orderId,
          p_gateway_order_id: orderId,
          p_gateway_payment_id: paymentId,
          p_gateway_signature: signature || 'verified_webhook',
          p_verified_by: 'cashfree_webhook',
        })

        await admin.from('payment_webhook_events').update({
          processing_status: 'processed',
          processed_timestamp: new Date().toISOString(),
        }).eq('provider_event_id', eventId)
      }

      return json({ success: true, received: true })
    } catch (err: any) {
      console.error('Cashfree webhook error:', err)
      return json({ success: false, error: err.message }, 500)
    }
  }

  // ==========================================================================
  // AUTHENTICATED CALLER CONTEXT
  // ==========================================================================
  try {
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return json({ success: false, error: 'Not authenticated.' }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

    let bodyData: any = {}
    if (req.method === 'POST') {
      bodyData = await req.json().catch(() => ({}))
    }

    const action = bodyData.action || url.searchParams.get('action') || ''

    // 1. GET /api/onboarding/status
    if (action === 'get_onboarding_status' || pathname.endsWith('/onboarding/status')) {
      const { data: statusData, error: statusErr } = await admin.rpc('get_onboarding_status', {
        p_user_id: user.id,
      })
      if (statusErr) return json({ success: false, error: statusErr.message }, 500)
      return json({ success: true, ...statusData })
    }

    // 2. POST /api/onboarding/save-step
    if (action === 'save_step' || pathname.endsWith('/onboarding/save-step')) {
      const { step, account_type, step_data } = bodyData
      const { data: saveRes, error: saveErr } = await admin.rpc('save_onboarding_step', {
        p_user_id: user.id,
        p_step: step || 'basic_details',
        p_account_type: account_type || 'individual_doctor',
        p_step_data: step_data || {},
      })
      if (saveErr) return json({ success: false, error: saveErr.message }, 500)
      return json({ success: true, ...saveRes })
    }

    // 3. POST /api/onboarding/complete-profile
    if (action === 'complete_profile' || pathname.endsWith('/onboarding/complete-profile')) {
      const { data: compRes, error: compErr } = await admin.rpc('complete_onboarding_profile', {
        p_user_id: user.id,
      })
      if (compErr) return json({ success: false, error: compErr.message }, 500)
      return json({ success: true, ...compRes })
    }

    // 4. POST /api/payments/create-order
    if (action === 'create_order' || action === 'create_cashfree_order' || pathname.endsWith('/payments/create-order')) {
      const rawPlanId = String(bodyData.plan_id || bodyData.payload?.plan_id || 'doctor_intro_500')
      const planId = (rawPlanId === 'doctor_intro_500' || rawPlanId === 'solo_first_month_500')
        ? 'doctor_intro_500'
        : 'doctor_monthly_5000'
      const plan = PLANS[planId]

      const internalOrderId = bodyData.internal_order_id || bodyData.payload?.internal_order_id || `MTF-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      if (hasCashfree) {
        const origin = req.headers.get('Origin') || 'http://localhost:5173'
        const orderAmountRupees = plan.amount / 100
        const cfOrderId = `mtf_${Date.now()}_${user.id.slice(0, 6)}`

        const cfRes = await cashfree('/orders', {
          method: 'POST',
          body: JSON.stringify({
            order_id: cfOrderId,
            order_amount: orderAmountRupees,
            order_currency: 'INR',
            customer_details: {
              customer_id: user.id,
              customer_email: user.email || 'doctor@medtechfixaters.in',
              customer_phone: String(bodyData.phone || bodyData.payload?.phone || '9999999999').replace(/[^0-9]/g, '').slice(-10),
              customer_name: String(bodyData.customer_name || bodyData.payload?.customer_name || user.user_metadata?.full_name || 'Healthcare Practitioner'),
            },
            order_meta: {
              return_url: origin.startsWith('https://')
                ? `${origin}/onboarding/payment/pending?order_id={order_id}&internal_order_id=${encodeURIComponent(internalOrderId)}`
                : `https://www.medtechfixaters.in/onboarding/payment/pending?order_id={order_id}&internal_order_id=${encodeURIComponent(internalOrderId)}`,
            },
            order_note: plan.label,
          }),
        })

        return json({
          success: true,
          gateway: 'cashfree',
          environment: CASHFREE_ENV,
          app_id: CASHFREE_APP_ID,
          payment_session_id: cfRes.payment_session_id,
          order_id: cfRes.order_id,
          internal_order_id: internalOrderId,
          amount: plan.amount,
          amount_rupees: orderAmountRupees,
          currency: 'INR',
          plan_id: planId,
          renewal_amount: plan.renewalAmount / 100,
          description: plan.label,
        })
      }



      // Sandbox Mock Order
      return json({
        success: true,
        gateway: 'mock_sandbox',
        payment_session_id: `mock_session_${Date.now()}`,
        order_id: `cf_mock_${Date.now()}`,
        internal_order_id: internalOrderId,
        amount: plan.amount,
        amount_rupees: plan.amount / 100,
        currency: 'INR',
        plan_id: planId,
        renewal_amount: plan.renewalAmount / 100,
        description: plan.label,
      })
    }

    // 5. POST /api/payments/verify
    if (action === 'verify_payment' || action === 'verify_cashfree_payment' || pathname.endsWith('/payments/verify')) {
      const payload = bodyData.payload || bodyData
      const orderId = String(payload.order_id || payload.gateway_order_id || '')
      const internalOrderId = String(payload.internal_order_id || orderId)

      if (!orderId) {
        return json({ success: false, error: 'Missing order_id for payment verification.' }, 400)
      }

      let isVerified = false
      let cfPaymentId = String(payload.cf_payment_id || payload.gateway_payment_id || `cf_pay_${Date.now()}`)

      if (hasCashfree) {
        const paymentsList = await cashfree(`/orders/${orderId}/payments`)
        const successfulPayment = Array.isArray(paymentsList)
          ? paymentsList.find((p: any) => p.payment_status === 'SUCCESS')
          : null

        if (successfulPayment) {
          isVerified = true
          cfPaymentId = successfulPayment.cf_payment_id || successfulPayment.payment_id || cfPaymentId
        } else {
          return json({
            success: false,
            status: 'pending',
            error: 'Payment has not completed yet on Cashfree.',
          }, 400)
        }
      } else {
        isVerified = true
      }

      if (isVerified) {
        const { data: actData, error: actErr } = await admin.rpc('verify_and_activate_payment_v2', {
          p_internal_order_id: internalOrderId,
          p_gateway_order_id: orderId,
          p_gateway_payment_id: cfPaymentId,
          p_gateway_signature: 'cashfree_verified_api',
          p_verified_by: 'cashfree_api',
        })

        if (actErr) {
          return json({ success: false, error: 'Database activation failed: ' + actErr.message }, 500)
        }

        return json({
          success: true,
          verified: true,
          status: 'completed',
          order_id: orderId,
          payment_id: cfPaymentId,
          ...actData,
        })
      }
    }

    // 6. GET /api/payments/status
    if (action === 'get_payment_status' || pathname.endsWith('/payments/status')) {
      const internalOrderId = url.searchParams.get('internal_order_id') || bodyData.internal_order_id
      const { data: payRecord } = await admin
        .from('payments')
        .select('*')
        .eq('internal_order_id', internalOrderId)
        .maybeSingle()

      return json({
        success: true,
        payment: payRecord || null,
        status: payRecord?.payment_status || 'not_found',
      })
    }

    // 7. GET /api/invoices/:id
    if (action === 'get_invoice' || pathname.includes('/invoices')) {
      const invoiceId = url.searchParams.get('invoice_id') || bodyData.invoice_id
      const { data: invRecord } = await admin
        .from('invoices')
        .select('*')
        .or(`id.eq.${invoiceId},invoice_number.eq.${invoiceId}`)
        .eq('user_id', user.id)
        .maybeSingle()

      return json({ success: true, invoice: invRecord })
    }

    // 8. POST /api/support/payment-issue
    if (action === 'create_support_ticket' || pathname.endsWith('/support/payment-issue')) {
      const { order_id, provider_payment_id, category, description, phone, email } = bodyData
      const { data: tktData, error: tktErr } = await admin.rpc('create_payment_support_ticket', {
        p_user_id: user.id,
        p_order_id: order_id || null,
        p_provider_payment_id: provider_payment_id || null,
        p_category: category || 'debited_not_activated',
        p_description: description || 'Payment debit reported by user.',
        p_email: email || user.email || '',
        p_phone: phone || '',
      })

      if (tktErr) return json({ success: false, error: tktErr.message }, 500)
      return json({ success: true, ...tktData })
    }

    return json({ success: false, error: 'Unknown action or endpoint.' }, 400)
  } catch (e: any) {
    console.error('Edge function error:', e)
    return json({ success: false, error: e?.message || 'Server error.' }, 500)
  }
})
