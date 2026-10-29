import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  BarChart2,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface RevenueAnalyticsData {
  currency: string;
  total_revenue_paise: number;
  today_revenue_paise: number;
  current_month_revenue_paise: number;
  prev_month_revenue_paise: number;
  net_revenue_paise: number;
  refund_total_paise: number;
  successful_payment_count: number;
  failed_payment_count: number;
  pending_payment_count: number;
  avg_payment_amount_paise: number;
  daily_breakdown?: Array<{ date: string; revenue_paise: number; transaction_count: number }>;
  status_breakdown?: Array<{ status: string; count: number; total_paise: number }>;
  method_breakdown?: Array<{ method: string; count: number; total_paise: number }>;
  generated_at?: string;
}

export default function RevenueDashboard() {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'mtd' | 'all'>('30d');

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      let startDate = '';
      const now = new Date();

      if (dateRange === '7d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString();
      } else if (dateRange === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString();
      } else if (dateRange === 'mtd') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }

      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      params.set('end_date', now.toISOString());

      const res = await fetch(`/api/admin/revenue?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Revenue fetch failed: ${res.statusText}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Failed to calculate revenue');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching revenue metrics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const formatRupees = (paise?: number) => {
    const rupees = (paise || 0) / 100;
    return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp size={22} className="text-emerald-600" />
            <span>Revenue Analytics & Financial Performance</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Authoritative collected revenue metrics based strictly on verified Cashfree settlement proofs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white border border-slate-200 rounded-xl flex items-center text-xs font-bold shadow-sm">
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'mtd', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id as any)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dateRange === r.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchRevenue()}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verified Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Gross Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupees(data?.total_revenue_paise)}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={11} /> Authoritatively Verified
          </span>
        </div>

        {/* Net Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Net Platform Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 tracking-tight">
            {formatRupees(data?.net_revenue_paise)}
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            After deducting {formatRupees(data?.refund_total_paise)} refunds
          </span>
        </div>

        {/* Today's Verified Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupees(data?.today_revenue_paise)}
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            This Month: {formatRupees(data?.current_month_revenue_paise)}
          </span>
        </div>

        {/* Average Transaction Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Avg Payment Size</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupees(data?.avg_payment_amount_paise)}
          </div>
          <span className="text-[10px] font-bold text-purple-600">
            {data?.successful_payment_count || 0} Successful Transactions
          </span>
        </div>
      </div>

      {/* Middle Row: Transaction Volumes + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Pipeline Volumes (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">Payment Pipeline Health</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Verified Gateway Counters</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Successful</span>
              <span className="text-2xl font-black text-emerald-800">{data?.successful_payment_count || 0}</span>
              <span className="text-[10px] font-bold text-emerald-600 block">Settled & Active</span>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Pending / Review</span>
              <span className="text-2xl font-black text-amber-800">{data?.pending_payment_count || 0}</span>
              <span className="text-[10px] font-bold text-amber-600 block">Awaiting Bank</span>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">Failed / Cancelled</span>
              <span className="text-2xl font-black text-rose-800">{data?.failed_payment_count || 0}</span>
              <span className="text-[10px] font-bold text-rose-600 block">Not Debited</span>
            </div>
          </div>

          {/* Daily Revenue Timeline Bar Preview */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 block">Daily Collected Revenue Breakdown</span>
            {(!data?.daily_breakdown || data.daily_breakdown.length === 0) ? (
              <div className="py-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-600">No Historical Settlement Batches in Selected Window</p>
                <p className="text-[11px] text-slate-400">Real-time daily bars populate as online doctor activations are processed.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.daily_breakdown.slice(-7).map(d => (
                  <div key={d.date} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-xl">
                    <span className="font-mono text-slate-700">{d.date}</span>
                    <span className="font-bold text-slate-500">{d.transaction_count} payments</span>
                    <span className="font-black text-slate-900">{formatRupees(d.revenue_paise)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-purple-600" />
              <h3 className="font-black text-sm text-slate-900">Breakdown by Status</h3>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.status_breakdown || []).map(s => (
              <div key={s.status} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-black uppercase tracking-wider text-slate-700 block text-[10px]">
                    {s.status.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 font-semibold">{s.count} transactions</span>
                </div>
                <span className="font-black text-slate-900 text-sm">
                  {formatRupees(s.total_paise)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
            <span className="font-bold block">Authoritative Reconciliation Rules:</span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Revenue figures strictly exclude unconfirmed pending transactions and declined attempts. Only verified settled payouts trigger doctor account activation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
