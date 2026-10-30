import https from 'node:https';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://yweywvnivyftwtglxavr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROJECT_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

function getSupabase() {
  const key = SERVICE_ROLE_KEY || ANON_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

function logDiagnostic(event, data) {
  try {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'cashfree_create_order',
      event,
      internal_order_id: data.internal_order_id || null,
      order_id: data.order_id || null,
      cf_order_id: data.cf_order_id || null,
      plan_id: data.plan_id || null,
      amount_rupees: data.amount_rupees || null,
      environment: data.environment || null,
      stage: data.stage || null,
      duration_ms: data.duration_ms || null,
      error_code: data.error_code || null,
      error_message: data.error_message || null,
    }));
  } catch {}
}

export default async function handler(req, res) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY || '';
  const isProd = (process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod');
  const host = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com';

  const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Dynamic Plan Pricing Resolution
  let baseAmount = 500;
  if (data.plan_id === 'doctor_yearly_50000') {
    baseAmount = 50000;
  } else if (data.plan_id === 'doctor_monthly_5000') {
    baseAmount = 5000;
  } else if (data.amount_rupees && Number(data.amount_rupees) > 0) {
    baseAmount = Number(data.amount_rupees);
  } else if (data.order_amount && Number(data.order_amount) > 0) {
    baseAmount = Number(data.order_amount);
  }

  // Coupon handling
  let discountRupees = 0;
  let appliedCoupon = null;
  const supabase = getSupabase();

  if (data.coupon_code && supabase) {
    try {
      const { data: cRes } = await supabase.rpc('validate_and_apply_coupon', {
        p_code: String(data.coupon_code).trim().toUpperCase(),
        p_plan_id: data.plan_id || 'doctor_intro_500',
        p_order_amount_paise: baseAmount * 100,
        p_user_id: data.user_id || null,
      });
      if (cRes?.valid && cRes?.discount_paise) {
        discountRupees = Math.round(cRes.discount_paise / 100);
        appliedCoupon = cRes.code;
      }
    } catch (cErr) {
      logDiagnostic('coupon_validation_notice', { error_message: cErr.message });
    }
  }

  const orderAmount = Math.max(1, baseAmount - discountRupees);
  const cfOrderId = `mtf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const internalOrderId = data.internal_order_id || `MTF-${Date.now().toString().slice(-8)}`;

  // Dynamic origin resolution for return URL
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const origin = req.headers.origin || (req.headers.host ? `${forwardedProto}://${req.headers.host}` : 'https://www.medtechfixaters.in');
  const returnUrl = data.return_url || `${origin}/onboarding/payment/pending?order_id={order_id}&internal_order_id=${encodeURIComponent(internalOrderId)}`;

  logDiagnostic('order_creation_initiated', {
    internal_order_id: internalOrderId,
    order_id: cfOrderId,
    plan_id: data.plan_id || 'doctor_intro_500',
    amount_rupees: orderAmount,
    environment: isProd ? 'PROD' : 'SANDBOX',
    stage: 'initiating_cashfree_pg_order'
  });

  const payload = JSON.stringify({
    order_id: cfOrderId,
    order_amount: orderAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id: data.customer_id || `cust_${Date.now()}`,
      customer_name: data.customer_name || 'Healthcare Practitioner',
      customer_email: data.customer_email || 'doctor@medtechfixaters.in',
      customer_phone: String(data.customer_phone || data.phone || '9999999999').replace(/[^0-9]/g, '').slice(-10) || '9999999999',
    },
    order_meta: {
      return_url: returnUrl,
    },
    order_note: data.order_note || (
      data.plan_id === 'doctor_yearly_50000'
        ? 'Doctor & Clinic — Annual Pro Subscription'
        : orderAmount === 500
        ? 'Solo Doctor & Clinic — Platform Activation'
        : 'Doctor & Clinic — Monthly Subscription'
    ),
  });

  const cfReq = https.request(
    {
      hostname: host,
      path: '/pg/orders',
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (cfRes) => {
      let cfBody = '';
      cfRes.on('data', (c) => (cfBody += c));
      cfRes.on('end', async () => {
        const duration = Date.now() - startTime;
        res.setHeader('Content-Type', 'application/json');
        res.status(cfRes.statusCode || 200);

        try {
          const parsed = JSON.parse(cfBody);
          const isSuccess = cfRes.statusCode === 200;

          logDiagnostic(isSuccess ? 'order_created_success' : 'order_created_failed', {
            internal_order_id: internalOrderId,
            order_id: parsed.order_id || cfOrderId,
            cf_order_id: parsed.cf_order_id,
            duration_ms: duration,
            environment: isProd ? 'PROD' : 'SANDBOX',
            error_code: isSuccess ? null : cfRes.statusCode,
            error_message: isSuccess ? null : (parsed.message || parsed.error),
          });

          // Record transaction in Supabase payment_transactions
          if (supabase && isSuccess && parsed.order_id) {
            try {
              await supabase.from('payment_transactions').insert([{
                internal_transaction_id: internalOrderId,
                provider_name: 'cashfree',
                provider_order_id: parsed.order_id,
                provider_session_id: parsed.payment_session_id || null,
                account_email: data.customer_email || 'doctor@medtechfixaters.in',
                doctor_id: data.doctor_id || null,
                amount_paise: orderAmount * 100,
                original_amount_paise: baseAmount * 100,
                discount_paise: discountRupees * 100,
                coupon_code: appliedCoupon,
                plan_id: data.plan_id || (baseAmount === 500 ? 'doctor_intro_500' : baseAmount === 50000 ? 'doctor_yearly_50000' : 'doctor_monthly_5000'),
                currency: 'INR',
                payment_status: 'pending',
                provider_response: parsed,
                initiated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            } catch (dbErr) {
              logDiagnostic('payment_transaction_insert_warning', { error_message: dbErr.message });
            }
          }

          res.json({
            success: isSuccess,
            gateway: 'cashfree',
            environment: isProd ? 'PROD' : 'TEST',
            payment_session_id: parsed.payment_session_id,
            order_id: parsed.order_id,
            cf_order_id: parsed.cf_order_id,
            internal_order_id: internalOrderId,
            amount: orderAmount * 100,
            amount_rupees: orderAmount,
            currency: 'INR',
            return_url: returnUrl,
            error: parsed.message || parsed.error,
          });
        } catch (parseErr) {
          logDiagnostic('order_response_parse_error', {
            internal_order_id: internalOrderId,
            duration_ms: duration,
            error_message: parseErr.message
          });
          res.send(cfBody);
        }
      });
    }
  );

  cfReq.on('error', (err) => {
    const duration = Date.now() - startTime;
    logDiagnostic('order_network_failure', {
      internal_order_id: internalOrderId,
      order_id: cfOrderId,
      duration_ms: duration,
      error_message: err.message
    });
    res.status(500).json({ success: false, error: err.message });
  });

  cfReq.write(payload);
  cfReq.end();
}
