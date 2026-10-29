import https from 'node:https';
import { verifySuperAdmin } from './auth-check.js';

function queryCashfreeOrderPayments(orderId, host, appId, secretKey) {
  return new Promise((resolve, reject) => {
    const req = https.request(
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
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (err) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', (err) => reject(err));
    req.end();
  });
}

export default async function handler(req, res) {
  const auth = await verifySuperAdmin(req, res);
  if (!auth) return;

  const { client, user } = auth;
  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY || '';
  const isProd = (process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod');
  const host = isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com';

  // 1. GET: List transactions with search, filter, date range, pagination
  if (req.method === 'GET') {
    const query = req.query || {};
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    let dbQuery = client
      .from('payment_transactions')
      .select('*', { count: 'exact' });

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('payment_status', query.status);
    }

    if (query.search) {
      const term = `%${query.search.trim()}%`;
      dbQuery = dbQuery.or(`internal_transaction_id.ilike.${term},provider_order_id.ilike.${term},account_email.ilike.${term},provider_payment_id.ilike.${term}`);
    }

    if (query.start_date) {
      dbQuery = dbQuery.gte('initiated_at', query.start_date);
    }
    if (query.end_date) {
      dbQuery = dbQuery.lte('initiated_at', query.end_date);
    }

    if (query.min_amount) {
      dbQuery = dbQuery.gte('amount_paise', parseInt(query.min_amount, 10));
    }
    if (query.max_amount) {
      dbQuery = dbQuery.lte('amount_paise', parseInt(query.max_amount, 10));
    }

    const { data: transactions, count, error } = await dbQuery
      .order('initiated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      transactions: transactions || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  }

  // 2. POST: Action Dispatcher (Verify Payment, Manual Review, Approve Payment, Resolve Failed)
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = body.action || 'verify';
    const { transaction_id, internal_order_id, provider_order_id, review_notes, reason } = body;

    // A & D: Fresh Check from Payment Provider API
    if (action === 'verify' || action === 'recheck_failed') {
      const orderToCheck = provider_order_id || internal_order_id;
      if (!orderToCheck) {
        return res.status(400).json({ success: false, error: 'Order reference required for verification.' });
      }

      try {
        const cfResult = await queryCashfreeOrderPayments(orderToCheck, host, appId, secretKey);
        const paymentsList = Array.isArray(cfResult.data) ? cfResult.data : [];
        const successPay = paymentsList.find(p => p.payment_status === 'SUCCESS');
        const failedPay = paymentsList.find(p => p.payment_status === 'FAILED');

        let providerStatus = 'PENDING';
        let paymentId = null;
        let amountPaise = 0;
        let paymentMethod = 'unknown';

        if (successPay) {
          providerStatus = 'SUCCESS';
          paymentId = String(successPay.cf_payment_id || successPay.payment_id || '');
          amountPaise = Math.round(Number(successPay.payment_amount || 0) * 100);
          paymentMethod = successPay.payment_group || successPay.payment_method || 'online';
        } else if (failedPay) {
          providerStatus = 'FAILED';
          paymentId = String(failedPay.cf_payment_id || failedPay.payment_id || '');
          amountPaise = Math.round(Number(failedPay.payment_amount || 0) * 100);
          paymentMethod = failedPay.payment_group || 'online';
        }

        // Call authoritative database reconciliation function
        const { data: rpcRes, error: rpcErr } = await client.rpc('admin_verify_and_reconcile_transaction', {
          p_internal_order_id: internal_order_id || orderToCheck,
          p_provider_order_id: orderToCheck,
          p_provider_payment_id: paymentId || `CHECK-${Date.now()}`,
          p_provider_status: providerStatus,
          p_amount_paise: amountPaise,
          p_currency: 'INR',
          p_payment_method: paymentMethod,
          p_action: action,
          p_review_notes: review_notes || `Live provider verification performed by admin. Provider status: ${providerStatus}.`,
          p_provider_evidence: {
            cashfree_response: cfResult.data,
            checked_at: new Date().toISOString(),
            status_code: cfResult.statusCode,
          },
        });

        if (rpcErr) {
          return res.status(500).json({ success: false, error: rpcErr.message });
        }

        return res.json({
          success: true,
          reconciled: rpcRes,
          provider_status: providerStatus,
          payments: paymentsList,
          message: `Provider status check complete: ${providerStatus}`,
        });
      } catch (cfErr) {
        return res.status(500).json({ success: false, error: 'Payment provider API request failed: ' + cfErr.message });
      }
    }

    // B. Manual Review
    if (action === 'manual_review') {
      if (!transaction_id) {
        return res.status(400).json({ success: false, error: 'Transaction ID required for manual review.' });
      }

      const { data: updatedTx, error: upErr } = await client
        .from('payment_transactions')
        .update({
          payment_status: 'under_review',
          review_notes: review_notes || 'Transaction placed under manual review.',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reconciliation_status: 'discrepancy_flagged',
          reconciliation_evidence: body.evidence || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction_id)
        .select()
        .single();

      if (upErr) {
        return res.status(500).json({ success: false, error: upErr.message });
      }

      await client.rpc('log_admin_audit_event', {
        p_action: 'manual_review_flagged',
        p_target_type: 'transaction',
        p_target_id: transaction_id,
        p_previous_state: {},
        p_new_state: { status: 'under_review', review_notes },
        p_reason: reason || review_notes || 'User reported debit discrepancy',
        p_evidence: body.evidence || {},
        p_result: 'success',
      });

      return res.json({ success: true, transaction: updatedTx, message: 'Transaction flagged for manual review.' });
    }

    // C. Approve Payment (Strict Authoritative Provider Evidence Enforced)
    if (action === 'approve_payment') {
      const orderToCheck = provider_order_id || internal_order_id;
      if (!orderToCheck) {
        return res.status(400).json({ success: false, error: 'Order reference required for approval.' });
      }

      // Query provider authoritative record
      const cfResult = await queryCashfreeOrderPayments(orderToCheck, host, appId, secretKey);
      const paymentsList = Array.isArray(cfResult.data) ? cfResult.data : [];
      const confirmedSuccess = paymentsList.find(p => p.payment_status === 'SUCCESS');

      if (!confirmedSuccess) {
        return res.status(400).json({
          success: false,
          error: 'Authoritative payment verification failed: Payment provider shows no confirmed SUCCESS payment for this order. Status cannot be marked completed without verified settlement proof.',
          provider_records: cfResult.data,
        });
      }

      const verifiedAmount = Math.round(Number(confirmedSuccess.payment_amount || 0) * 100);
      const verifiedPaymentId = String(confirmedSuccess.cf_payment_id || confirmedSuccess.payment_id);

      const { data: rpcRes, error: rpcErr } = await client.rpc('admin_verify_and_reconcile_transaction', {
        p_internal_order_id: internal_order_id || orderToCheck,
        p_provider_order_id: orderToCheck,
        p_provider_payment_id: verifiedPaymentId,
        p_provider_status: 'SUCCESS',
        p_amount_paise: verifiedAmount,
        p_currency: 'INR',
        p_payment_method: confirmedSuccess.payment_group || 'online',
        p_action: 'manual_approve',
        p_review_notes: review_notes || `Approved by Super Admin based on authoritative provider payment ${verifiedPaymentId}.`,
        p_provider_evidence: {
          authoritative_payment: confirmedSuccess,
          approved_by_admin: user.id,
          timestamp: new Date().toISOString(),
        },
      });

      if (rpcErr) {
        return res.status(500).json({ success: false, error: rpcErr.message });
      }

      return res.json({
        success: true,
        reconciled: rpcRes,
        message: 'Payment authoritatively approved and account activated successfully.',
      });
    }

    return res.status(400).json({ success: false, error: `Unsupported transaction action: ${action}` });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
