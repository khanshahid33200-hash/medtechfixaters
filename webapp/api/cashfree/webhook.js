import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://yweywvnivyftwtglxavr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROJECT_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

function getSupabase() {
  const key = SERVICE_ROLE_KEY || ANON_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

function verifyCashfreeWebhook(rawBody, timestamp, signature, secretKey) {
  if (!signature || !timestamp || !rawBody || !secretKey) return false;
  try {
    const signedPayload = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signedPayload)
      .digest('base64');
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (err) {
    console.error('[Cashfree:Webhook] Signature verification error:', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-webhook-signature'] || req.headers['x-cashfree-signature'] || '';
  const timestamp = req.headers['x-webhook-timestamp'] || req.headers['x-cashfree-timestamp'] || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY || '';

  // Capture raw body for signature verification
  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else if (req.rawBody) {
    rawBody = req.rawBody;
  } else {
    rawBody = JSON.stringify(req.body || {});
  }

  // Signature verification (warn in dev/sandbox if no secret, strictly enforce in production)
  const isProd = (process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod');
  const isValid = verifyCashfreeWebhook(rawBody, timestamp, signature, secretKey);

  if (isProd && !isValid) {
    console.warn('[Cashfree:Webhook] Unauthorized signature mismatch rejected.');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let eventPayload = {};
  try {
    eventPayload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody || '{}');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventType = eventPayload.type || '';
  const orderData = eventPayload.data?.order || {};
  const paymentData = eventPayload.data?.payment || {};

  const orderId = orderData.order_id || '';
  const cfPaymentId = paymentData.cf_payment_id || '';
  const paymentStatus = paymentData.payment_status || '';

  console.log('[Cashfree:Webhook] Received event:', {
    eventType,
    orderId,
    cfPaymentId,
    paymentStatus,
    timestamp,
  });

  if (!orderId) {
    return res.status(200).json({ status: 'ignored', message: 'No order_id present in webhook.' });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const isSuccess = eventType === 'PAYMENT_SUCCESS_WEBHOOK' || paymentStatus === 'SUCCESS';
      const isFailed = eventType === 'PAYMENT_FAILED_WEBHOOK' || paymentStatus === 'FAILED';

      const updatePayload = {
        updated_at: new Date().toISOString(),
        provider_payment_id: cfPaymentId || null,
        reconciliation_evidence: {
          webhook_event: eventType,
          payment: paymentData,
          received_at: new Date().toISOString(),
        },
      };

      if (isSuccess) {
        updatePayload.payment_status = 'completed';
        updatePayload.review_notes = 'Verified via Cashfree Production Webhook';
      } else if (isFailed) {
        updatePayload.payment_status = 'failed';
        updatePayload.review_notes = paymentData.payment_message || 'Failed via Cashfree Webhook';
      }

      await supabase
        .from('payment_transactions')
        .update(updatePayload)
        .or(`provider_order_id.eq.${orderId},internal_transaction_id.eq.${orderId}`);

      console.log(`[Cashfree:Webhook] Order ${orderId} synchronized to database. Status: ${updatePayload.payment_status || 'unchanged'}`);
    } catch (dbErr) {
      console.error('[Cashfree:Webhook] Database synchronization error:', dbErr);
    }
  }

  return res.status(200).json({ status: 'ok', message: 'Webhook processed successfully' });
}
