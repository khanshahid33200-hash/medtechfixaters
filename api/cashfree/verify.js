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
      service: 'cashfree_verify_order',
      event,
      internal_order_id: data.internal_order_id || null,
      order_id: data.order_id || null,
      payment_id: data.payment_id || null,
      provider_status: data.provider_status || null,
      payment_method: data.payment_method || null,
      duration_ms: data.duration_ms || null,
      stage: data.stage || null,
      error_code: data.error_code || null,
      error_message: data.error_message || null,
    }));
  } catch {}
}

function fetchCashfree(hostname, path, appId, secretKey) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ statusCode: res.statusCode || 200, data: parsed });
          } catch {
            resolve({ statusCode: res.statusCode || 200, data: body });
          }
        });
      }
    );
    req.on('error', (err) => reject(err));
    req.end();
  });
}

export default async function handler(req, res) {
  const startTime = Date.now();

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

  logDiagnostic('verification_started', {
    internal_order_id: internalOrderId,
    order_id: orderId,
    stage: 'calling_cashfree_apis',
  });

  // Check if simulated order
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
          logDiagnostic('db_update_sim_notice', { error_message: dbErr.message });
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

  try {
    // 1. Check order level first
    const orderResult = await fetchCashfree(host, `/pg/orders/${encodeURIComponent(orderId)}`, appId, secretKey);
    const orderObj = typeof orderResult.data === 'object' ? orderResult.data : {};

    // 2. Check payments level
    const paymentsResult = await fetchCashfree(host, `/pg/orders/${encodeURIComponent(orderId)}/payments`, appId, secretKey);
    const payments = Array.isArray(paymentsResult.data) ? paymentsResult.data : [];

    const duration = Date.now() - startTime;

    const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS');
    const failedPayment = payments.find((p) => p.payment_status === 'FAILED');
    const cancelledPayment = payments.find((p) => p.payment_status === 'USER_DROPPED' || p.payment_status === 'CANCELLED');

    const isPaid = orderObj.order_status === 'PAID' || Boolean(successfulPayment);

    logDiagnostic('verification_completed', {
      internal_order_id: internalOrderId,
      order_id: orderId,
      provider_status: isPaid ? 'SUCCESS' : failedPayment ? 'FAILED' : cancelledPayment ? 'CANCELLED' : orderObj.order_status || 'PENDING',
      payment_method: successfulPayment?.payment_group || successfulPayment?.payment_method || null,
      payment_id: successfulPayment?.cf_payment_id || successfulPayment?.payment_id || null,
      duration_ms: duration,
      stage: 'cashfree_verification_resolved',
    });

    // Synchronize status with Supabase payment_transactions
    if (supabase && orderId) {
      try {
        const updatePayload = {
          updated_at: new Date().toISOString(),
          provider_response: { order: orderObj, payments },
        };

        if (isPaid) {
          updatePayload.payment_status = 'completed';
          updatePayload.provider_payment_id = successfulPayment?.cf_payment_id || successfulPayment?.payment_id || `cf_pay_${Date.now()}`;
          updatePayload.payment_method = successfulPayment?.payment_group || successfulPayment?.payment_method || 'online';
          updatePayload.provider_reference = successfulPayment?.bank_reference || String(updatePayload.provider_payment_id);
          updatePayload.reconciliation_status = 'verified_success';
          updatePayload.reconciliation_evidence = successfulPayment || orderObj;
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
        logDiagnostic('db_update_warning', { error_message: dbErr.message });
      }
    }

    if (isPaid) {
      return res.status(200).json({
        success: true,
        verified: true,
        status: 'completed',
        payment_id: successfulPayment?.cf_payment_id || successfulPayment?.payment_id || `cf_pay_${Date.now()}`,
        order_id: orderId,
        internal_order_id: internalOrderId,
        payment_method: successfulPayment?.payment_group || successfulPayment?.payment_method || 'online',
        payments,
      });
    }

    if (failedPayment) {
      return res.status(200).json({
        success: false,
        verified: false,
        status: 'failed',
        error: failedPayment.payment_message || 'Payment was declined by bank or card issuer.',
        order_id: orderId,
        internal_order_id: internalOrderId,
        payments,
      });
    }

    if (cancelledPayment) {
      return res.status(200).json({
        success: false,
        verified: false,
        status: 'cancelled',
        error: 'Payment was cancelled or closed during checkout.',
        order_id: orderId,
        internal_order_id: internalOrderId,
        payments,
      });
    }

    // Still active / pending
    return res.status(200).json({
      success: false,
      verified: false,
      status: 'pending',
      error: 'Payment transaction is pending bank authorization.',
      order_id: orderId,
      internal_order_id: internalOrderId,
      payment_id: null,
      payments,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logDiagnostic('verification_network_error', {
      internal_order_id: internalOrderId,
      order_id: orderId,
      duration_ms: duration,
      error_message: err.message,
    });
    return res.status(500).json({ success: false, error: err.message });
  }
}
