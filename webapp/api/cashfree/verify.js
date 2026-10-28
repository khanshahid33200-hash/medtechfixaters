import https from 'node:https';

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

  // Check if simulated
  const simulatedOrders = globalThis.__simulatedOrders;
  if (simulatedOrders) {
    const sim = simulatedOrders.get(orderId) || simulatedOrders.get(internalOrderId);
    if (sim) {
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
      path: `/pg/orders/${orderId}/payments`,
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
      cfRes.on('end', () => {
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
