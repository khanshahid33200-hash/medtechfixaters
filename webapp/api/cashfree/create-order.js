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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY || '';
  const isProd = (process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod');
  const host = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com';

  const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const orderAmount = data.plan_id === 'doctor_monthly_5000' ? 5000 : 500;
  const cfOrderId = `mtf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const internalOrderId = data.internal_order_id || `MTF-${Date.now().toString().slice(-8)}`;

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
      return_url: `https://www.medtechfixaters.in/onboarding/payment/pending?order_id={order_id}&internal_order_id=${encodeURIComponent(internalOrderId)}`,
    },
    order_note: data.order_note || (orderAmount === 500 ? 'Solo Doctor & Clinic — Platform Activation' : 'Doctor & Clinic — Monthly Subscription'),
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
        res.setHeader('Content-Type', 'application/json');
        res.status(cfRes.statusCode || 200);
        try {
          const parsed = JSON.parse(cfBody);
          const isSuccess = cfRes.statusCode === 200;

          // Record transaction in Supabase payment_transactions
          const supabase = getSupabase();
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
                currency: 'INR',
                payment_status: 'pending',
                provider_response: parsed,
                initiated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            } catch (dbErr) {
              console.warn('[cashfree:create-order] payment_transactions insert warning:', dbErr);
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
            error: parsed.message || parsed.error,
          });
        } catch {
          res.send(cfBody);
        }
      });
    }
  );

  cfReq.on('error', (err) => {
    res.status(500).json({ success: false, error: err.message });
  });

  cfReq.write(payload);
  cfReq.end();
}
