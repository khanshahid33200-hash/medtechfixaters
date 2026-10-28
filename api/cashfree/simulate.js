// Vercel Serverless Function: POST /api/cashfree/simulate
// Development-only payment status simulator. Disabled in production.

const simulatedOrders = globalThis.__simulatedOrders || new Map();
globalThis.__simulatedOrders = simulatedOrders;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isProd = (process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('prod');
  const isProdEnv = process.env.NODE_ENV === 'production' && isProd;

  if (isProdEnv) {
    return res.status(403).json({
      success: false,
      error: 'Payment simulation is strictly forbidden in production environments.',
    });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const orderId = String(data.order_id || `mtf_sim_${Date.now()}`);
    const internalOrderId = String(data.internal_order_id || orderId);
    const action = data.action || 'simulate_success';
    const amountPaise = data.amount || 50000;

    if (action === 'simulate_success') {
      const record = {
        status: 'completed',
        order_id: orderId,
        internal_order_id: internalOrderId,
        amount: amountPaise,
        payment_id: `cf_sim_pay_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      simulatedOrders.set(orderId, record);
      simulatedOrders.set(internalOrderId, record);

      return res.status(200).json({
        success: true,
        verified: true,
        status: 'completed',
        payment_id: record.payment_id,
        order_id: orderId,
        internal_order_id: internalOrderId,
        amount_paise: amountPaise,
        amount_rupees: amountPaise / 100,
        simulated: true,
        message: 'Simulated payment SUCCESS confirmed.',
      });
    }

    if (action === 'simulate_failure') {
      const errorReason = data.error_reason || 'Simulated payment decline: Card test declined by bank.';
      const record = {
        status: 'failed',
        order_id: orderId,
        internal_order_id: internalOrderId,
        amount: amountPaise,
        error: errorReason,
        timestamp: new Date().toISOString(),
      };
      simulatedOrders.set(orderId, record);
      simulatedOrders.set(internalOrderId, record);

      return res.status(200).json({
        success: false,
        verified: false,
        status: 'failed',
        error: errorReason,
        order_id: orderId,
        internal_order_id: internalOrderId,
        simulated: true,
      });
    }

    if (action === 'simulate_pending') {
      const record = {
        status: 'pending',
        order_id: orderId,
        internal_order_id: internalOrderId,
        amount: amountPaise,
        error: 'Payment transaction is pending bank confirmation.',
        timestamp: new Date().toISOString(),
      };
      simulatedOrders.set(orderId, record);
      simulatedOrders.set(internalOrderId, record);

      return res.status(200).json({
        success: false,
        verified: false,
        status: 'pending',
        error: record.error,
        order_id: orderId,
        internal_order_id: internalOrderId,
        simulated: true,
      });
    }

    if (action === 'simulate_cancelled') {
      const record = {
        status: 'cancelled',
        order_id: orderId,
        internal_order_id: internalOrderId,
        amount: amountPaise,
        error: 'Payment was cancelled by user.',
        timestamp: new Date().toISOString(),
      };
      simulatedOrders.set(orderId, record);
      simulatedOrders.set(internalOrderId, record);

      return res.status(200).json({
        success: false,
        verified: false,
        status: 'cancelled',
        error: record.error,
        order_id: orderId,
        internal_order_id: internalOrderId,
        simulated: true,
      });
    }

    if (action === 'reset_order') {
      simulatedOrders.delete(orderId);
      simulatedOrders.delete(internalOrderId);

      return res.status(200).json({
        success: true,
        status: 'created',
        order_id: orderId,
        internal_order_id: internalOrderId,
        message: 'Simulated order state reset.',
      });
    }

    return res.status(400).json({ success: false, error: `Unknown action: ${action}` });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
