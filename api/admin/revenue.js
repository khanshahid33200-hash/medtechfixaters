import { verifySuperAdmin } from './auth-check.js';

export default async function handler(req, res) {
  const auth = await verifySuperAdmin(req, res);
  if (!auth) return;

  const { client } = auth;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = req.query || {};
  const startDate = query.start_date ? new Date(query.start_date).toISOString() : null;
  const endDate = query.end_date ? new Date(query.end_date).toISOString() : null;

  try {
    // Call server-side authoritative revenue analytics RPC
    const { data: analytics, error: rpcErr } = await client.rpc('get_revenue_analytics', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (rpcErr) {
      // Fallback query if RPC had an issue
      const { data: transactions, error: txErr } = await client
        .from('payment_transactions')
        .select('*');

      if (txErr) {
        return res.status(500).json({ success: false, error: txErr.message });
      }

      const all = transactions || [];
      const completed = all.filter(t => t.payment_status === 'completed');
      const refunded = all.filter(t => t.payment_status === 'refunded');
      const failed = all.filter(t => t.payment_status === 'failed' || t.payment_status === 'cancelled');
      const pending = all.filter(t => t.payment_status === 'pending' || t.payment_status === 'under_review');

      const totalRevenuePaise = completed.reduce((sum, t) => sum + (t.amount_paise || 0), 0);
      const refundTotalPaise = refunded.reduce((sum, t) => sum + (t.amount_paise || 0), 0);

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const todayRevenuePaise = completed
        .filter(t => (t.initiated_at || '').startsWith(todayStr))
        .reduce((sum, t) => sum + (t.amount_paise || 0), 0);

      const thisMonthPrefix = now.toISOString().slice(0, 7);
      const currentMonthPaise = completed
        .filter(t => (t.initiated_at || '').startsWith(thisMonthPrefix))
        .reduce((sum, t) => sum + (t.amount_paise || 0), 0);

      return res.json({
        success: true,
        currency: 'INR',
        total_revenue_paise: totalRevenuePaise,
        today_revenue_paise: todayRevenuePaise,
        current_month_revenue_paise: currentMonthPaise,
        prev_month_revenue_paise: 0,
        net_revenue_paise: totalRevenuePaise - refundTotalPaise,
        refund_total_paise: refundTotalPaise,
        successful_payment_count: completed.length,
        failed_payment_count: failed.length,
        pending_payment_count: pending.length,
        avg_payment_amount_paise: completed.length ? Math.round(totalRevenuePaise / completed.length) : 0,
        daily_breakdown: [],
        status_breakdown: [
          { status: 'completed', count: completed.length, total_paise: totalRevenuePaise },
          { status: 'failed', count: failed.length, total_paise: failed.reduce((s, t) => s + (t.amount_paise || 0), 0) },
          { status: 'pending', count: pending.length, total_paise: pending.reduce((s, t) => s + (t.amount_paise || 0), 0) },
          { status: 'refunded', count: refunded.length, total_paise: refundTotalPaise },
        ],
        method_breakdown: [],
      });
    }

    return res.json({
      success: true,
      ...analytics,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Revenue calculation error: ' + err.message });
  }
}
