import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  RotateCcw,
  Headphones,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Send,
  HelpCircle,
  XCircle,
  Ban,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { subscriptionService } from '../../services/subscriptionService';
import { onboardingService } from '../../services/onboardingService';
import PaymentSimulatorPanel from '../../components/payment/PaymentSimulatorPanel';

type ViewMode = 'polling' | 'pending' | 'failed' | 'cancelled';

export default function PaymentPendingOrFailedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const internalOrderId = searchParams.get('internal_order_id') || searchParams.get('order_id') || '';
  const gatewayOrderId = searchParams.get('gateway_order_id') || searchParams.get('order_id') || '';
  const gatewayPaymentId = searchParams.get('payment_id') || searchParams.get('gateway_payment_id') || '';

  const [viewMode, setViewMode] = useState<ViewMode>('polling');
  const [pollAttempt, setPollAttempt] = useState(1);
  const [statusMessage, setStatusMessage] = useState('Verifying payment with Cashfree and your bank...');
  const [failureReason, setFailureReason] = useState<string>('Payment could not be completed.');
  const [rechecking, setRechecking] = useState(false);

  // 15-Minute Countdown Timer (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);

  // Support Ticket Form State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('debited_not_activated');
  const [ticketDescription, setTicketDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 10; // 10 attempts * 2.5s = 25s bounded polling

  // Load user contact info for support
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setContactEmail(user.email || '');
        setContactPhone((user.user_metadata?.phone as string) || '');
      }
    });
  }, []);

  // 15-minute countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Perform single check against verification backend
  const checkPaymentStatus = async (): Promise<{
    status: 'completed' | 'failed' | 'pending' | 'cancelled';
    error?: string;
  }> => {
    if (!internalOrderId) {
      return { status: 'failed', error: 'Missing order reference.' };
    }

    try {
      const res = await subscriptionService.verifyPayment(internalOrderId, {
        gatewayOrderId,
        gatewayPaymentId,
      });

      if (res.success) {
        return { status: 'completed' };
      }

      return {
        status: res.status || 'pending',
        error: res.error,
      };
    } catch (err: any) {
      return {
        status: 'pending',
        error: err.message,
      };
    }
  };

  // Bounded Polling on Mount
  useEffect(() => {
    let isCancelled = false;

    async function runPolling() {
      pollCountRef.current += 1;
      setPollAttempt(pollCountRef.current);

      const result = await checkPaymentStatus();
      if (isCancelled) return;

      if (result.status === 'completed') {
        navigate(`/onboarding/payment/success?internal_order_id=${encodeURIComponent(internalOrderId)}`, {
          replace: true,
        });
        return;
      }

      if (result.status === 'failed') {
        setFailureReason(result.error || 'Payment was declined by bank or card issuer.');
        setViewMode('failed');
        return;
      }

      if (result.status === 'cancelled') {
        setViewMode('cancelled');
        return;
      }

      // If still pending and reached MAX_POLLS, transition to pending resolution screen
      if (pollCountRef.current >= MAX_POLLS) {
        setViewMode('pending');
        setStatusMessage('Transaction is awaiting bank confirmation. Details preserved safely.');
        return;
      }

      // Schedule next poll attempt
      pollingRef.current = setTimeout(runPolling, 2500);
    }

    runPolling();

    return () => {
      isCancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [internalOrderId, gatewayOrderId, gatewayPaymentId, navigate]);

  // Handle Simulator State Changes
  const handleSimulatorStatusChange = (status: 'completed' | 'failed' | 'pending' | 'cancelled' | 'reset', details?: any) => {
    if (pollingRef.current) clearTimeout(pollingRef.current);

    if (status === 'completed') {
      navigate(`/onboarding/payment/success?internal_order_id=${encodeURIComponent(internalOrderId)}`, {
        replace: true,
      });
    } else if (status === 'failed') {
      setFailureReason(details?.error || 'Simulated payment failure (Bank declined).');
      setViewMode('failed');
    } else if (status === 'cancelled') {
      setViewMode('cancelled');
    } else if (status === 'pending') {
      setViewMode('pending');
      setStatusMessage('Simulated payment transaction is awaiting bank confirmation.');
    } else if (status === 'reset') {
      setViewMode('polling');
      pollCountRef.current = 0;
      setPollAttempt(1);
      // Re-trigger polling
      checkPaymentStatus().then((res) => {
        if (res.status === 'completed') {
          navigate(`/onboarding/payment/success?internal_order_id=${encodeURIComponent(internalOrderId)}`, { replace: true });
        } else if (res.status === 'failed') {
          setViewMode('failed');
        } else if (res.status === 'cancelled') {
          setViewMode('cancelled');
        } else {
          setViewMode('pending');
        }
      });
    }
  };

  // Manual Recheck Status
  const handleManualRecheck = async () => {
    setRechecking(true);
    const result = await checkPaymentStatus();
    setRechecking(false);

    if (result.status === 'completed') {
      navigate(`/onboarding/payment/success?internal_order_id=${encodeURIComponent(internalOrderId)}`, { replace: true });
    } else if (result.status === 'failed') {
      setFailureReason(result.error || 'Payment was declined.');
      setViewMode('failed');
    } else if (result.status === 'cancelled') {
      setViewMode('cancelled');
    } else {
      setViewMode('pending');
      setStatusMessage('Bank has not yet confirmed transaction capture. Please wait or contact customer care.');
    }
  };

  // Support Ticket Submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError(null);

    if (!ticketDescription.trim()) {
      setTicketError('Please provide a brief description of the issue.');
      return;
    }
    if (!contactPhone.trim()) {
      setTicketError('Please enter your contact phone number.');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await onboardingService.submitSupportTicket({
        orderId: internalOrderId,
        providerPaymentId: gatewayPaymentId,
        category: ticketCategory,
        description: ticketDescription,
        contactEmail,
        contactPhone,
      });

      if (res.success) {
        setTicketSuccess(res.ticketNumber || 'TKT-ACK');
      } else {
        setTicketError(res.error || 'Unable to register support ticket.');
      }
    } catch (err: any) {
      setTicketError(err.message || 'Error submitting ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased py-10 px-4 sm:px-6 flex flex-col justify-between">
      <main className="max-w-2xl mx-auto w-full space-y-6">
        {/* ================= STATE 1: POLLING / VERIFYING ================= */}
        {viewMode === 'polling' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6A00] border border-orange-100 flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-orange-50 text-[#C2410C] border border-orange-200 text-[10px] font-bold uppercase tracking-wider inline-block">
                Checking Status (Attempt {pollAttempt} of {MAX_POLLS})
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Your Payment Is Being Processed
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Contacting Cashfree and your bank to confirm capture and activate your workspace.
              </p>
            </div>

            {/* Stepper Status Indicators */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${pollAttempt >= 1 ? 'bg-[#FF6A00] animate-pulse' : 'bg-slate-300'}`} />
                <span>1. Validating internal order ({internalOrderId || 'Pending'})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${pollAttempt >= 2 ? 'bg-[#FF6A00] animate-pulse' : 'bg-slate-300'}`} />
                <span>2. Querying Cashfree Sandbox payment capture status</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${pollAttempt >= 3 ? 'bg-[#FF6A00] animate-pulse' : 'bg-slate-300'}`} />
                <span>3. Activating subscription period and clinic permissions</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Please keep this window open while verification completes automatically.
            </p>
          </div>
        )}

        {/* ================= STATE 2: FAILED (Scenario B) ================= */}
        {viewMode === 'failed' && (
          <div className="bg-white border-2 border-red-200 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-xs">
              <XCircle size={32} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider inline-block">
                Payment Declined
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Payment Could Not Be Completed
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Your card or bank did not authorize the ₹500 transaction.
              </p>
            </div>

            {/* Error Detail Box */}
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-left space-y-2 text-xs text-red-900">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Decline Reason:</span>
                  <span className="font-mono text-xs">{failureReason}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-red-200/60 flex justify-between text-[11px] text-red-800 font-mono">
                <span>Order ID: {internalOrderId}</span>
                <span>Amount: ₹500.00</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Your registration information is 100% saved</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Paid features will activate immediately once payment is confirmed. No duplicate charges will occur.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/onboarding/payment')}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20"
              >
                <RotateCcw size={16} />
                <span>Retry Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Headphones size={15} />
                <span>Contact Customer Support</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STATE 3: USER CANCELLED (Scenario D) ================= */}
        {viewMode === 'cancelled' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
              <Ban size={30} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider inline-block">
                Checkout Cancelled
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Payment Was Cancelled
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                The checkout window was closed or cancelled. You have not been charged.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-slate-800">{internalOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Activation:</span>
                <span className="font-mono font-bold text-slate-800">₹500.00 (First Month)</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                All your profile details and clinic information remain safely saved. You can complete checkout whenever you are ready.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/onboarding/payment')}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20"
              >
                <RotateCcw size={16} />
                <span>Restart Checkout</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle size={15} />
                <span>Need Assistance? Contact Support</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STATE 4: PENDING / TIMEOUT (Scenario C) ================= */}
        {viewMode === 'pending' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Status Card Header */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Clock size={28} />
              </div>

              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider inline-block">
                Payment Status Pending / Awaiting Confirmation
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Transaction Verification In Progress
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Your bank or UPI provider has not yet communicated final confirmation. Your onboarding details remain 100% saved and secure.
              </p>

              {statusMessage && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-[11px] text-slate-500 font-mono space-y-1">
                <div>Order ID: <span className="font-bold text-slate-800">{internalOrderId || 'Pending'}</span></div>
                {gatewayPaymentId && <div>Gateway Ref: <span className="font-bold text-slate-800">{gatewayPaymentId}</span></div>}
              </div>
            </div>

            {/* 3 Clear Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* OPTION 1: RETRY PAYMENT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-2xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Option 1: Retry Payment</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    If the window closed or the session was cancelled, start a fresh payment attempt safely.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/payment')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors"
                >
                  Retry Payment
                </button>
              </div>

              {/* OPTION 2: CONTACT CUSTOMER CARE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-2xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Headphones size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Option 2: Customer Care</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Money debited from your bank account without immediate activation? Open a priority ticket.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors"
                >
                  Contact Support
                </button>
              </div>

              {/* OPTION 3: WAIT 15 MINUTES */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-2xs">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Option 3: Wait 15 Mins</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Bank reconciliation can take a few minutes. Status countdown:
                  </p>
                  <div className="font-mono text-center font-bold text-base text-emerald-700 bg-emerald-50/60 py-1 rounded-lg border border-emerald-100">
                    {formatTimer(timeLeft)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={rechecking}
                  onClick={handleManualRecheck}
                  className="w-full py-2.5 px-3 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors disabled:opacity-50"
                >
                  {rechecking ? 'Checking Status...' : 'Check Status Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Care Information Banner */}
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-slate-400 shrink-0" />
            <span>Official Support Desk: <strong>support@medtechfixaters.in</strong> | +91 98765 43210</span>
          </div>
          <span className="text-[11px] text-slate-500">Support Hours: 9:00 AM – 7:00 PM IST (Mon–Sat)</span>
        </div>

        {/* Support Ticket Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Priority Payment Support Ticket</h3>
                  <p className="text-xs text-slate-500">Our billing desk investigates and resolves delayed debits within 2 hours.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {ticketSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">Ticket #{ticketSuccess} Registered</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Our billing desk has linked your internal order reference and provider payment ID. We will notify your email and phone once confirmed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="px-6 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  {ticketError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      {ticketError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Issue Category
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                    >
                      <option value="debited_not_activated">Amount Debited from Bank but Account Not Activated</option>
                      <option value="gateway_timeout">Payment Gateway Timed Out / Error Screen</option>
                      <option value="bank_declined">Bank Transaction Declined or Failed</option>
                      <option value="double_charge">Multiple Debits Reported</option>
                      <option value="other">Other Payment Inquiry</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Internal Order ID</span>
                      <input
                        type="text"
                        readOnly
                        value={internalOrderId}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Provider Ref (Optional)</span>
                      <input
                        type="text"
                        readOnly
                        value={gatewayPaymentId || 'Pending'}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Issue Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Please explain what happened (e.g. UPI PIN entered, money debited from HDFC account, reference UTR 12345...)"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#FF6A00] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Notification Email
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-tight">
                    <strong>Security Reminder:</strong> MedTechFixaters will NEVER ask for your UPI PIN, ATM PIN, Password, or OTP. Never share sensitive banking credentials.
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="px-6 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Security Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium">
        MedTechFixaters Healthcare Cloud Platform. 100% Data Preservation Guarantee.
      </footer>

      {/* Developer Sandbox Simulator Panel */}
      <PaymentSimulatorPanel
        orderId={gatewayOrderId || internalOrderId}
        internalOrderId={internalOrderId}
        onStatusChange={handleSimulatorStatusChange}
      />
    </div>
  );
}
