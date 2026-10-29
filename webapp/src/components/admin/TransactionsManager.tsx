import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface PaymentTransaction {
  id: string;
  internal_transaction_id: string;
  provider_name: string;
  provider_order_id: string;
  provider_session_id?: string;
  provider_payment_id?: string;
  doctor_id?: string;
  account_email: string;
  amount_paise: number;
  currency: string;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'under_review';
  provider_reference?: string;
  provider_response?: any;
  webhook_history?: any[];
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reconciliation_status?: string;
  reconciliation_evidence?: any;
  initiated_at: string;
  updated_at: string;
}

export default function TransactionsManager() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Transaction for Drawer / Modals
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        search,
      });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let errMsg = res.statusText;
        try {
          const errBody = await res.json();
          if (errBody?.error) errMsg = errBody.error;
        } catch {}
        throw new Error(`Failed to load transactions: ${errMsg}`);
      }

      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to retrieve transactions');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading transaction list');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Action A: Request fresh check from Cashfree Gateway
  const handleVerifyPayment = async (tx: PaymentTransaction) => {
    setActionLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'verify',
          transaction_id: tx.id,
          internal_order_id: tx.internal_transaction_id,
          provider_order_id: tx.provider_order_id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVerifyResult(data);
        setNotice(`Gateway verification complete: ${data.provider_status}`);
        fetchTransactions();
      } else {
        throw new Error(data.error || 'Verification check failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Action B: Save Manual Review
  const handleSubmitManualReview = async () => {
    if (!selectedTx || !reviewNotes.trim()) return;
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'manual_review',
          transaction_id: selectedTx.id,
          review_notes: reviewNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice('Transaction flagged for manual review.');
        setShowReviewModal(false);
        setReviewNotes('');
        fetchTransactions();
      } else {
        throw new Error(data.error || 'Failed to submit manual review');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action C: Authoritatively Approve Payment
  const handleApprovePayment = async (tx: PaymentTransaction) => {
    if (!window.confirm(`Are you sure you want to approve transaction ${tx.internal_transaction_id}? Authoritative settlement evidence will be verified with Cashfree before activation.`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'approve_payment',
          transaction_id: tx.id,
          internal_order_id: tx.internal_transaction_id,
          provider_order_id: tx.provider_order_id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`✅ Payment approved and account activated successfully!`);
        fetchTransactions();
      } else {
        throw new Error(data.error || 'Approval rejected by authoritative verification rule.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="text-amber-600 animate-spin" />
            <span>Pending</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <AlertTriangle size={12} className="text-purple-600" />
            <span>Under Review</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            <RefreshCw size={12} className="text-slate-600" />
            <span>Refunded</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
            <XCircle size={12} className="text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
            <HelpCircle size={12} />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-200 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard size={22} className="text-indigo-600" />
            <span>Transaction Management & Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor real-time gateway payments, audit settlement proofs, and reconcile doctor onboarding fees.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTransactions()}
            disabled={loading || actionLoading}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Transaction ID, Order ID, Email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Payment Statuses</option>
              <option value="completed">Completed (Success)</option>
              <option value="pending">Pending Confirmation</option>
              <option value="failed">Failed / Declined</option>
              <option value="under_review">Under Manual Review</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              title="Filter from initiation date"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              title="Filter to initiation date"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Retrieving authoritative gateway records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText size={36} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-slate-700">No Transactions Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No payment attempts match your filter criteria. When doctors initiate checkout, records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Transaction / Order ID</th>
                  <th className="py-3 px-4">Doctor / Email</th>
                  <th className="py-3 px-4">Amount & Method</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Gateway Reference</th>
                  <th className="py-3 px-4">Initiated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 truncate max-w-[170px]" title={tx.internal_transaction_id}>
                        {tx.internal_transaction_id}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[170px]" title={tx.provider_order_id}>
                        CF: {tx.provider_order_id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{tx.account_email || 'doctor@medtechfixaters.in'}</div>
                      {tx.doctor_id && (
                        <span className="text-[10px] font-mono text-slate-400 block">UID: {tx.doctor_id.slice(0, 8)}…</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-900 block">
                        ₹{(tx.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {tx.payment_method || 'Online'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(tx.payment_status)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {tx.provider_payment_id || tx.provider_reference || (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(tx.initiated_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Verify Gateway Button */}
                        <button
                          onClick={() => handleVerifyPayment(tx)}
                          disabled={actionLoading}
                          title="Verify Status with Payment Provider"
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                        >
                          Verify
                        </button>

                        {/* Manual Review Button */}
                        <button
                          onClick={() => { setSelectedTx(tx); setShowReviewModal(true); setReviewNotes(tx.review_notes || ''); }}
                          title="Flag / Manual Review"
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                        >
                          Review
                        </button>

                        {/* Approve Button (Only visible if not already completed) */}
                        {tx.payment_status !== 'completed' && (
                          <button
                            onClick={() => handleApprovePayment(tx)}
                            disabled={actionLoading}
                            title="Authoritative Approval (Requires Verified Provider Evidence)"
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {/* Details Drawer */}
                        <button
                          onClick={() => setSelectedTx(tx)}
                          title="View Complete Payment Timeline"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{transactions.length}</span> of <span className="font-bold text-slate-800">{total}</span> total transactions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── TRANSACTION DETAILS DRAWER ─────────────────────── */}
      {selectedTx && !showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Transaction Details & Audit Timeline</h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Internal Order ID</span>
                <span className="font-mono font-bold text-slate-800 select-all">{selectedTx.internal_transaction_id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Gateway Order ID</span>
                <span className="font-mono font-bold text-slate-800 select-all">{selectedTx.provider_order_id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Amount</span>
                <span className="text-base font-black text-slate-900">
                  ₹{(selectedTx.amount_paise / 100).toFixed(2)} {selectedTx.currency}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Current Status</span>
                <div>{getStatusBadge(selectedTx.payment_status)}</div>
              </div>
            </div>

            {selectedTx.review_notes && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-purple-900 block">Admin Review Notes:</span>
                <p className="text-purple-800">{selectedTx.review_notes}</p>
                {selectedTx.reviewed_at && (
                  <span className="text-[10px] text-purple-500 block pt-1">
                    Recorded {new Date(selectedTx.reviewed_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Provider JSON Evidence Viewer */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Authoritative Provider Evidence & Webhook History:</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(selectedTx.provider_response || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleVerifyPayment(selectedTx)}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Re-Verify with Gateway
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANUAL REVIEW MODAL ─────────────────────────────── */}
      {showReviewModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Manual Transaction Review</h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Flag this transaction for reconciliation. Record doctor reports of debited bank accounts or discrepancy evidence.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Review Notes & Reference Evidence *</label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Enter doctor complaint reference, bank UTR number, or discrepancy explanation..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitManualReview}
                disabled={actionLoading || !reviewNotes.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
              >
                Save Review Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
