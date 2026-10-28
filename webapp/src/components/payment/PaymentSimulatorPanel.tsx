import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface PaymentSimulatorPanelProps {
  orderId?: string;
  internalOrderId?: string;
  onStatusChange?: (status: 'completed' | 'failed' | 'pending' | 'cancelled' | 'reset', details?: any) => void;
  className?: string;
}

export default function PaymentSimulatorPanel({
  orderId,
  internalOrderId,
  onStatusChange,
  className = '',
}: PaymentSimulatorPanelProps) {
  // Only render in development mode or sandbox mode
  const isDev = import.meta.env.DEV;
  const isSandbox =
    (import.meta.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('sandbox') ||
    (import.meta.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase().includes('test');

  if (!isDev && !isSandbox) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Failure reasons available in sandbox
  const [failureReason, setFailureReason] = useState<string>('Card test declined by bank (E05)');

  const activeOrderId = orderId || internalOrderId || `mtf_sim_${Date.now()}`;
  const activeInternalId = internalOrderId || orderId || activeOrderId;

  const handleSimulate = async (
    action: 'simulate_success' | 'simulate_failure' | 'simulate_pending' | 'simulate_cancelled' | 'reset_order'
  ) => {
    setLoadingAction(action);
    setLastResult(null);

    try {
      const res = await fetch('/api/cashfree/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          order_id: activeOrderId,
          internal_order_id: activeInternalId,
          amount: 50000,
          error_reason: action === 'simulate_failure' ? failureReason : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Simulation request rejected.');
      }

      setLastResult(data.message || `Simulated ${action.replace('simulate_', '').toUpperCase()}`);

      const mappedStatus =
        action === 'simulate_success'
          ? 'completed'
          : action === 'simulate_failure'
          ? 'failed'
          : action === 'simulate_pending'
          ? 'pending'
          : action === 'simulate_cancelled'
          ? 'cancelled'
          : 'reset';

      if (onStatusChange) {
        onStatusChange(mappedStatus, data);
      }
    } catch (err: any) {
      setLastResult(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const copyDetails = () => {
    const text = JSON.stringify(
      {
        gateway: 'cashfree_sandbox',
        orderId: activeOrderId,
        internalOrderId: activeInternalId,
        appId: 'TEST11319064dec159bf49f76e05977946091311',
        amount: '₹500.00',
      },
      null,
      2
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm w-full font-sans text-xs ${className}`}>
      {/* Floating Toggle Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all border border-slate-700 font-semibold cursor-pointer ml-auto"
        >
          <FlaskConical size={15} className="text-amber-400 animate-pulse" />
          <span>🧪 Cashfree Sandbox Simulator</span>
          <ChevronUp size={14} className="text-slate-400" />
        </button>
      )}

      {/* Expanded Simulator Modal / Drawer */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400/90 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-amber-400" />
              <div>
                <h4 className="font-extrabold text-xs text-white">Cashfree Sandbox Simulator</h4>
                <p className="text-[10px] text-amber-300 font-medium">Test Mode: Zero Financial Impact</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Environment & Order metadata */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] font-mono">
              <div className="flex justify-between items-center text-slate-500">
                <span>Gateway:</span>
                <span className="font-bold text-slate-800">Cashfree Sandbox (TEST)</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 truncate">
                <span>Order ID:</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]" title={activeOrderId}>
                  {activeOrderId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 truncate">
                <span>Internal Ref:</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]" title={activeInternalId}>
                  {activeInternalId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Amount:</span>
                <span className="font-bold text-emerald-600">₹500.00 INR</span>
              </div>
            </div>

            {/* Simulation Status feedback */}
            {lastResult && (
              <div
                className={`p-2 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 ${
                  lastResult.includes('Error')
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <AlertTriangle size={13} className="shrink-0" />
                <span className="truncate">{lastResult}</span>
              </div>
            )}

            {/* Scenario Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Simulate Payment Lifecycle
              </span>

              {/* Scenario A: Success */}
              <button
                type="button"
                disabled={Boolean(loadingAction)}
                onClick={() => handleSimulate('simulate_success')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {loadingAction === 'simulate_success' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>A. Simulate Success (₹500)</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">SUCCESS</span>
              </button>

              {/* Scenario B: Failure */}
              <div className="p-2 rounded-xl bg-red-50/60 border border-red-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-900">B. Simulate Payment Failure</span>
                  <span className="text-[10px] font-mono text-red-600 font-bold">FAILED</span>
                </div>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-red-200 bg-white text-[11px] text-slate-800 focus:outline-none"
                >
                  <option value="Card test declined by bank (E05)">Card declined by bank (E05)</option>
                  <option value="Insufficient funds in customer account (E51)">Insufficient funds (E51)</option>
                  <option value="Bank payment gateway network timeout (E91)">Bank gateway timeout (E91)</option>
                  <option value="Customer 3DS OTP authentication failed (E82)">3DS OTP failed (E82)</option>
                  <option value="Invalid card expiry date or CVV (E14)">Invalid card CVV/expiry (E14)</option>
                </select>
                <button
                  type="button"
                  disabled={Boolean(loadingAction)}
                  onClick={() => handleSimulate('simulate_failure')}
                  className="w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingAction === 'simulate_failure' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <XCircle size={13} />
                  )}
                  <span>Trigger Decline Failure</span>
                </button>
              </div>

              {/* Scenario C: Pending */}
              <button
                type="button"
                disabled={Boolean(loadingAction)}
                onClick={() => handleSimulate('simulate_pending')}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {loadingAction === 'simulate_pending' ? (
                    <Loader2 size={14} className="animate-spin text-amber-600" />
                  ) : (
                    <Clock size={14} className="text-amber-600" />
                  )}
                  <span>C. Simulate Pending (Awaiting Bank)</span>
                </div>
                <span className="text-[10px] font-mono text-amber-700">PENDING</span>
              </button>

              {/* Scenario D: Cancellation */}
              <button
                type="button"
                disabled={Boolean(loadingAction)}
                onClick={() => handleSimulate('simulate_cancelled')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {loadingAction === 'simulate_cancelled' ? (
                    <Loader2 size={14} className="animate-spin text-slate-600" />
                  ) : (
                    <Ban size={14} className="text-slate-600" />
                  )}
                  <span>D. Simulate User Cancellation</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">CANCELLED</span>
              </button>

              {/* Reset Order State */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  disabled={Boolean(loadingAction)}
                  onClick={() => handleSimulate('reset_order')}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset Test Order</span>
                </button>
                <button
                  type="button"
                  onClick={copyDetails}
                  className="py-1.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Copy test metadata"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
