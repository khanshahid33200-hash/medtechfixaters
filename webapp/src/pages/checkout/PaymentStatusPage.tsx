import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  RotateCcw,
  Sparkles,
  XCircle,
  Ban,
  Clock,
  Headphones,
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';
import PaymentSimulatorPanel from '../../components/payment/PaymentSimulatorPanel';

type PaymentScreenState = 'verifying' | 'success' | 'failed' | 'cancelled' | 'pending';

export default function PaymentStatusPage() {
  useSEO({
    title: 'Payment Verification | MedTechFixaters',
    description: 'Server-side payment verification and subscription activation status for MedTechFixaters.',
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const internalOrderId = searchParams.get('internal_order_id') || searchParams.get('order_id') || '';
  const gatewayOrderId = searchParams.get('gateway_order_id') || searchParams.get('order_id') || '';
  const gatewayPaymentId =
    searchParams.get('gateway_payment_id') ||
    searchParams.get('payment_id') ||
    searchParams.get('cf_payment_id') ||
    '';

  const [screenState, setScreenState] = useState<PaymentScreenState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [verificationStep, setVerificationStep] = useState(1);
  const [pollAttempt, setPollAttempt] = useState(1);
  const [rechecking, setRechecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 10;

  // Countdown timer for pending state
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

  const verifyOnce = async (): Promise<{
    status: 'completed' | 'failed' | 'pending' | 'cancelled';
    currentPeriodEnd?: string;
    error?: string;
  }> => {
    if (!internalOrderId) {
      return { status: 'failed', error: 'Missing internal order reference. Please restart checkout.' };
    }

    try {
      const res = await subscriptionService.verifyPayment(internalOrderId, {
        gatewayOrderId,
        gatewayPaymentId,
      });

      if (res.success) {
        return {
          status: 'completed',
          currentPeriodEnd: res.currentPeriodEnd,
        };
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

  useEffect(() => {
    let isCancelled = false;

    async function runPolling() {
      pollCountRef.current += 1;
      setPollAttempt(pollCountRef.current);

      if (pollCountRef.current === 1) setVerificationStep(1);
      if (pollCountRef.current === 2) setVerificationStep(2);
      if (pollCountRef.current >= 3) setVerificationStep(3);

      const res = await verifyOnce();
      if (isCancelled) return;

      if (res.status === 'completed') {
        setScreenState('success');
        if (res.currentPeriodEnd) {
          const date = new Date(res.currentPeriodEnd).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          setRenewalDate(date);
        }
        return;
      }

      if (res.status === 'failed') {
        setScreenState('failed');
        setErrorMessage(res.error || 'Payment was declined by bank or card issuer.');
        return;
      }

      if (res.status === 'cancelled') {
        setScreenState('cancelled');
        return;
      }

      if (pollCountRef.current >= MAX_POLLS) {
        setScreenState('pending');
        setErrorMessage('Transaction is awaiting bank confirmation. Details preserved safely.');
        return;
      }

      pollingRef.current = setTimeout(runPolling, 2500);
    }

    runPolling();

    return () => {
      isCancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [internalOrderId, gatewayOrderId, gatewayPaymentId]);

  const handleSimulatorStatusChange = (status: 'completed' | 'failed' | 'pending' | 'cancelled' | 'reset', details?: any) => {
    if (pollingRef.current) clearTimeout(pollingRef.current);

    if (status === 'completed') {
      setScreenState('success');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setRenewalDate(
        nextMonth.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    } else if (status === 'failed') {
      setScreenState('failed');
      setErrorMessage(details?.error || 'Simulated payment failure (Bank declined).');
    } else if (status === 'cancelled') {
      setScreenState('cancelled');
    } else if (status === 'pending') {
      setScreenState('pending');
      setErrorMessage('Payment transaction is pending bank confirmation.');
    } else if (status === 'reset') {
      setScreenState('verifying');
      pollCountRef.current = 0;
      setPollAttempt(1);
      setVerificationStep(1);
    }
  };

  const handleManualRecheck = async () => {
    setRechecking(true);
    const res = await verifyOnce();
    setRechecking(false);

    if (res.status === 'completed') {
      setScreenState('success');
      if (res.currentPeriodEnd) {
        setRenewalDate(
          new Date(res.currentPeriodEnd).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        );
      }
    } else if (res.status === 'failed') {
      setScreenState('failed');
      setErrorMessage(res.error || 'Payment was declined.');
    } else if (res.status === 'cancelled') {
      setScreenState('cancelled');
    } else {
      setScreenState('pending');
      setErrorMessage('Bank has not yet confirmed capture. Please wait a few moments.');
    }
  };

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-lg mx-auto w-full pt-36 pb-20 px-4 sm:px-6">
        {/* State 1: Verifying */}
        {screenState === 'verifying' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/95 border border-orange-100 rounded-[28px] p-8 shadow-sm text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-orange-50 text-[#C2410C] border border-orange-200 text-[10px] font-bold uppercase tracking-wider inline-block">
                Verifying Capture (Attempt {pollAttempt} of {MAX_POLLS})
              </span>
              <h2 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                Verifying Transaction...
              </h2>
              <p className="text-xs text-[#6B6B6B] font-medium max-w-sm mx-auto leading-relaxed">
                Contacting Cashfree Sandbox adapter and confirming transaction capture with your bank.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-left space-y-2 text-xs text-[#6B6B6B]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${verificationStep >= 1 ? 'bg-[#FF6A00] animate-pulse' : 'bg-stone-300'}`} />
                <span>1. Validating internal order reference ({internalOrderId || 'Pending'})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${verificationStep >= 2 ? 'bg-[#FF6A00] animate-pulse' : 'bg-stone-300'}`} />
                <span>2. Confirming server-side payment capture with Cashfree</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${verificationStep >= 3 ? 'bg-[#FF6A00] animate-pulse' : 'bg-stone-300'}`} />
                <span>3. Activating subscription period and clinic permissions</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400">
              Please do not refresh or close this window while verification completes.
            </p>
          </motion.div>
        )}

        {/* State 2: Success */}
        {screenState === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border-2 border-emerald-500 rounded-[28px] p-8 shadow-xl shadow-emerald-500/10 text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                <Sparkles size={12} className="text-emerald-600" />
                <span>Subscription Activated</span>
              </span>
              <h2 className="text-3xl font-extrabold text-[#171717] tracking-tight">
                Welcome to MedTechFixaters
              </h2>
              <p className="text-xs text-[#6B6B6B] font-medium max-w-sm mx-auto leading-relaxed">
                Your first-month subscription has been verified successfully. Your practice workspace is now fully enabled.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 text-left space-y-2.5 text-xs text-[#6B6B6B]">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Order Reference</span>
                <span className="font-mono font-bold text-[#171717]">{internalOrderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Amount Paid</span>
                <span className="font-mono font-bold text-emerald-600">₹500.00 (First Month)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Next Renewal Date</span>
                <span className="font-medium text-stone-800">{renewalDate || '30 days from today'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Next Billing Amount</span>
                <span className="font-mono font-bold text-[#171717]">₹5,000.00 / month</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/doctor')}
                className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer`}
              >
                <span>Open Doctor Workspace</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="pt-2 border-t border-orange-100 flex items-center justify-center gap-2 text-[11px] text-[#6B6B6B]">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Payment confirmation & tax invoice sent to your registered email.</span>
            </div>
          </motion.div>
        )}

        {/* State 3: Failed */}
        {screenState === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border border-red-200 rounded-[28px] p-8 shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-md">
              <AlertCircle size={36} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider inline-block">
                Payment Declined
              </span>
              <h2 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                Payment Verification Incomplete
              </h2>
              <p className="text-xs text-red-700 font-medium max-w-sm mx-auto leading-relaxed">
                {errorMessage || 'The payment gateway could not confirm successful transaction capture.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
              <p className="font-bold">Your account remains safely registered.</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                No duplicate subscription was created. You can retry checkout anytime without losing your profile information.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/checkout/intro')}
                className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer`}
              >
                <RotateCcw size={15} />
                <span>Retry ₹500 Checkout</span>
              </button>

              <Link
                to="/pricing"
                className="block text-center text-xs text-[#6B6B6B] font-bold hover:text-[#FF6A00]"
              >
                Return to Pricing Overview
              </Link>
            </div>
          </motion.div>
        )}

        {/* State 4: Cancelled */}
        {screenState === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border border-slate-200 rounded-[28px] p-8 shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-md">
              <Ban size={32} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider inline-block">
                Payment Cancelled
              </span>
              <h2 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                Checkout Was Cancelled
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                Payment was cancelled in checkout. You have not been charged.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-slate-800">{internalOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Activation:</span>
                <span className="font-mono font-bold text-slate-800">₹500.00</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                You can resume checkout anytime. Your registered data is preserved.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/checkout/intro')}
                className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer`}
              >
                <RotateCcw size={15} />
                <span>Restart Checkout</span>
              </button>

              <Link
                to="/pricing"
                className="block text-center text-xs text-[#6B6B6B] font-bold hover:text-[#FF6A00]"
              >
                Return to Pricing Overview
              </Link>
            </div>
          </motion.div>
        )}

        {/* State 5: Pending */}
        {screenState === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border border-amber-200 rounded-[28px] p-8 shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-md">
              <Clock size={32} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider inline-block">
                Awaiting Bank Confirmation
              </span>
              <h2 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                Payment Pending
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                Bank reconciliation can take a few minutes. Timer:
              </p>
              <div className="font-mono text-center font-bold text-base text-amber-700 bg-amber-50 py-1.5 rounded-xl border border-amber-200 max-w-[120px] mx-auto">
                {formatTimer(timeLeft)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
              <p className="font-bold">Transaction Reference: {internalOrderId}</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                If your account was debited, your subscription will activate automatically once bank confirmation arrives.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={rechecking}
                onClick={handleManualRecheck}
                className={`w-full py-3.5 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
              >
                <RotateCcw size={15} />
                <span>{rechecking ? 'Checking Status...' : 'Check Status Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/checkout/intro')}
                className="w-full py-3 px-4 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Retry With Different Payment Method</span>
              </button>
            </div>
          </motion.div>
        )}
      </main>

      <PublicFooter />

      {/* Developer Sandbox Simulator Panel */}
      <PaymentSimulatorPanel
        orderId={gatewayOrderId || internalOrderId}
        internalOrderId={internalOrderId}
        onStatusChange={handleSimulatorStatusChange}
      />
    </div>
  );
}
