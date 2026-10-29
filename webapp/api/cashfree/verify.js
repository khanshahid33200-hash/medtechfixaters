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
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY || '';
  const isProd = (process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod');
  const host = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com';

  const bodyData = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const orderId = String(bodyData.order_id || req.query.order_id || '');
  const internalOrderId = String(bodyData.internal_order_id || req.query.internal_order_id || orderId);

  if (!orderId && !internalOrderId) {
    return res.status(400).json({ success: false, error: 'Missing order_id' });
  }

  const supabase = getSupabase();

  // Check if simulated
  const simulatedOrders = globalThis.__simulatedOrders;
  if (simulatedOrders) {
    const sim = simulatedOrders.get(orderId) || simulatedOrders.get(internalOrderId);
    if (sim) {
      if (supabase) {
        try {
          await supabase
            .from('payment_transactions')
            .update({
              payment_status: sim.status,
              provider_payment_id: sim.payment_id || null,
              review_notes: sim.error || `Simulated ${sim.status}`,
              reconciliation_evidence: { simulated: true },
              updated_at: new Date().toISOString(),
            })
            .or(`provider_order_id.eq.${orderId},internal_transaction_id.eq.${internalOrderId}`);
        } catch (dbErr) {
          console.warn('[verify:simulate] db update notice:', dbErr);
        }
      }

      if (sim.status === 'completed') {
        return res.status(200).json({
          success: true,
          verified: true,
          status: 'completed',
          payment_id: sim.payment_id,
          order_id: sim.order_id,
          internal_order_id: sim.internal_order_id,
          amount_paise: sim.amount,
          simulated: true,
        });
      }
      if (sim.status === 'failed') {
        return res.status(200).json({
          success: false,
          verified: false,
          status: 'failed',
          error: sim.error || 'Simulated failure.',
          order_id: sim.order_id,
          simulated: true,
        });
      }
      if (sim.status === 'cancelled') {
        return res.status(200).json({
          success: false,
          verified: false,
          status: 'cancelled',
          error: sim.error || 'Payment cancelled.',
          order_id: sim.order_id,
          simulated: true,
        });
      }
      return res.status(200).json({
        success: false,
        verified: false,
        status: 'pending',
        error: 'Payment pending.',
        order_id: sim.order_id,
        simulated: true,
      });
    }
  }

  const cfReq = https.request(
    {
      hostname: host,
      path: `/pg/orders/${encodeURIComponent(orderId)}/payments`,
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
    },
    (cfRes) => {
      let cfBody = '';
      cfRes.on('data', (c) => (cfBody += c));
      cfRes.on('end', async () => {
        res.setHeader('Content-Type', 'application/json');
        res.status(cfRes.statusCode || 200);
        try {
          const payments = JSON.parse(cfBody);
          const successfulPayment = Array.isArray(payments)
            ? payments.find((p) => p.payment_status === 'SUCCESS')
            : null;
          const failedPayment = Array.isArray(payments)
            ? payments.find((p) => p.payment_status === 'FAILED')
            : null;
          const cancelledPayment = Array.isArray(payments)
            ? payments.find((p) => p.payment_status === 'USER_DROPPED' || p.payment_status === 'CANCELLED')
            : null;

          // Synchronize status with Supabase payment_transactions
          if (supabase && orderId) {
            try {
              const updatePayload = {
                updated_at: new Date().toISOString(),
                provider_response: Array.isArray(payments) ? { payments } : payments,
              };

              if (successfulPayment) {
                updatePayload.payment_status = 'completed';
                updatePayload.provider_payment_id = successfulPayment.cf_payment_id || successfulPayment.payment_id;
                updatePayload.payment_method = successfulPayment.payment_group || successfulPayment.payment_method || 'online';
                updatePayload.provider_reference = successfulPayment.bank_reference || String(updatePayload.provider_payment_id);
                updatePayload.reconciliation_status = 'verified_success';
                updatePayload.reconciliation_evidence = successfulPayment;
              } else if (failedPayment) {
                updatePayload.payment_status = 'failed';
                updatePayload.provider_payment_id = failedPayment.cf_payment_id || failedPayment.payment_id;
                updatePayload.review_notes = failedPayment.payment_message || 'Payment declined by bank or issuer';
              } else if (cancelledPayment) {
                updatePayload.payment_status = 'cancelled';
                updatePayload.review_notes = 'Payment cancelled or abandoned by user';
              }

              await supabase
                .from('payment_transactions')
                .update(updatePayload)
                .or(`provider_order_id.eq.${orderId},internal_transaction_id.eq.${internalOrderId}`);
            } catch (dbErr) {
              console.warn('[cashfree:verify] payment_transactions update warning:', dbErr);
            }
          }

          if (successfulPayment) {
            return res.json({
              success: true,
              verified: true,
              status: 'completed',
              payment_id: successfulPayment.cf_payment_id || successfulPayment.payment_id,
              order_id: orderId,
              internal_order_id: internalOrderId,
              payments: Array.isArray(payments) ? payments : [],
            });
          }

          if (failedPayment) {
            return res.json({
              success: false,
              verified: false,
              status: 'failed',
              error: failedPayment.payment_message || 'Payment was declined by bank or card issuer.',
              order_id: orderId,
              payments: Array.isArray(payments) ? payments : [],
            });
          }

          if (cancelledPayment) {
            return res.json({
              success: false,
              verified: false,
              status: 'cancelled',
              error: 'Payment was cancelled during checkout.',
              order_id: orderId,
              payments: Array.isArray(payments) ? payments : [],
            });
          }

          return res.json({
            success: false,
            verified: false,
            status: 'pending',
            payment_id: null,
            payments: Array.isArray(payments) ? payments : [],
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

  cfReq.end();
}
