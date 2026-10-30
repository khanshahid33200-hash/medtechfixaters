import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { loadCashfreeSDK } from '../../services/paymentGatewayAdapter';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';
import PaymentSimulatorPanel from '../../components/payment/PaymentSimulatorPanel';

export default function IntroductoryCheckoutPage() {
  useSEO({
    title: 'Complete Your Registration — Platform Fee Payment | MedTechFixaters',
    description: 'Pay the one-time introductory platform fee of ₹500 to activate your MedTechFixaters subscription for the first month.',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [activeInternalOrderId, setActiveInternalOrderId] = useState<string>('');

  // Calculate Next Billing Date in Asia/Kolkata timezone (+1 calendar month)
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const formattedRenewalDate = nextMonth.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const handlePayIntroductory = async (targetMode: '_self' | '_modal' = '_self') => {
    if (loading) return; // Prevent duplicate payment attempts
    setLoading(true);
    setError(null);

    try {
      // 1. Create server-validated order record
      const order = await subscriptionService.createPaymentOrder('introductory_first_month');

      if (!order.success) {
        throw new Error(order.error || 'Failed to create payment order.');
      }

      setActiveOrderId(order.gatewayOrderId || '');
      setActiveInternalOrderId(order.internalOrderId || '');

      // Persist order in sessionStorage for fast recovery
      try {
        sessionStorage.setItem('medtech_active_payment', JSON.stringify({
          internal_order_id: order.internalOrderId,
          order_id: order.gatewayOrderId,
          payment_session_id: order.paymentSessionId,
          timestamp: Date.now(),
        }));
      } catch {}

      // 2. Open Cashfree Checkout (Full-Page Redirect is default)
      if (order.paymentSessionId) {
        await loadCashfreeSDK();

        if (window.Cashfree) {
          const cashfreeMode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox') as 'sandbox' | 'production';
          const cashfree = window.Cashfree({ mode: cashfreeMode });

          if (targetMode === '_self') {
            const checkoutResult = await cashfree.checkout({
              paymentSessionId: order.paymentSessionId,
              redirectTarget: '_self',
            });
            if (checkoutResult?.error) {
              throw new Error(checkoutResult.error.message || 'Cashfree gateway reported a launch error.');
            }
            return;
          }

          const checkoutResult = await cashfree.checkout({
            paymentSessionId: order.paymentSessionId,
            redirectTarget: '_modal',
          });

          if (checkoutResult?.error) {
            console.log('Cashfree checkout modal closed/error:', checkoutResult.error);
            setLoading(false);
            return;
          }

          // Payment completed inside modal, route to server verification
          navigate(
            `/onboarding/payment/pending?internal_order_id=${encodeURIComponent(order.internalOrderId)}` +
            `&gateway_order_id=${encodeURIComponent(order.gatewayOrderId || '')}` +
            `&payment_id=${encodeURIComponent(checkoutResult?.paymentDetails?.payment_id || '')}`
          );
          return;
        }
      }

      // If no paymentSessionId returned from Cashfree
      throw new Error(order.error || 'Could not initialize Cashfree payment session. Please verify test credentials.');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full pt-36 pb-20 px-4 sm:px-6">
        <div className="text-center space-y-3 mb-8">
          <span className="px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles size={12} className="text-[#FF6A00]" />
            <span>Platform Fee Activation</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
            Complete Your Registration
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium max-w-lg mx-auto leading-relaxed">
            Pay the one-time introductory platform fee of ₹500 to activate your MedTechFixaters subscription for the first month.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border-2 border-[#FF6A00] rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(255,106,0,0.18)] ring-4 ring-orange-500/10 space-y-6"
        >
          {/* Plan Header */}
          <div className="flex items-start justify-between border-b border-orange-100 pb-5">
            <div>
              <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider block">
                Solo Doctor & Clinic Plan
              </span>
              <h2 className="text-2xl font-extrabold text-[#171717] mt-1">Platform Fee Activation</h2>
              <p className="text-xs text-[#6B6B6B] mt-1">Full clinical suite, digital receptionist, & live OPD queue</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 line-through block font-mono">₹5,000</span>
              <span className="text-3xl font-black text-[#171717] font-mono">₹500</span>
              <span className="text-[10px] text-[#C2410C] font-bold block uppercase tracking-wide">
                Save 90%
              </span>
            </div>
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-[#6B6B6B]">
              <span>Standard Monthly Subscription</span>
              <span className="font-mono font-medium">₹5,000.00</span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 font-medium">
              <span>First Month Introductory Discount (90%)</span>
              <span className="font-mono">- ₹4,500.00</span>
            </div>
            <div className="pt-3 border-t border-orange-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#171717] uppercase tracking-wider">Platform Fee Due Now</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#FF6A00] font-mono">₹500.00</span>
                <span className="text-[10px] text-stone-400 block font-medium">Activates first month full platform access</span>
              </div>
            </div>
          </div>

          {/* Renewal Terms Callout */}
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <Calendar size={15} className="text-[#FF6A00] shrink-0" />
              <span>Recurring Monthly Billing Terms</span>
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Your first month is activated at the introductory fee of <strong>₹500</strong>. From month two, your regular subscription continues at <strong>₹5,000 per month</strong>.
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B6B6B] font-medium">
              <span>Next Renewal Date: <strong className="text-[#171717]">{formattedRenewalDate}</strong></span>
              <span>Subsequent Rate: <strong className="text-[#171717]">₹5,000 / month</strong></span>
            </div>
          </div>

          {/* Sandbox Test Guidelines */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-950 text-xs">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>Cashfree Sandbox Test Environment</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              • <strong>Recommended for instant testing:</strong> Use <strong>Cards</strong> (Test Card: <span className="font-mono bg-amber-100/90 px-1.5 py-0.5 rounded font-bold text-amber-950">4012 0000 0000 0002</span>, any future MM/YY & CVV <span className="font-mono bg-amber-100/90 px-1 py-0.5 rounded font-bold">123</span>) or <strong>UPI</strong> (<span className="font-mono bg-amber-100/90 px-1.5 py-0.5 rounded font-bold text-amber-950">success@upi</span>).
              <br />
              • <strong>Notice regarding Wallets:</strong> In Cashfree Sandbox, external wallet aggregators require live mobile OTP. Please use test Cards, UPI, or NetBanking simulation.
            </p>
          </div>

          {/* Pay Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handlePayIntroductory('_self')}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Secure Gateway Session...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Pay ₹500 (Full-Page Secure Checkout)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePayIntroductory('_modal')}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span>Or open in popup modal</span>
              </button>
            </div>

            <p className="text-[11px] text-[#6B6B6B] text-center leading-relaxed">
              Payments are verified server-side. Your practice workspace will activate immediately upon verified transaction receipt.
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 border-t border-orange-100 grid grid-cols-2 gap-3 text-[11px] text-[#6B6B6B]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>256-bit Secure Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-[#FF6A00] shrink-0" />
              <span>No Automatic Lock-in</span>
            </div>
          </div>
        </motion.div>
      </main>

      <PublicFooter />

      <PaymentSimulatorPanel
        orderId={activeOrderId}
        internalOrderId={activeInternalOrderId}
        onStatusChange={(status) => {
          if (status === 'completed') {
            navigate(`/checkout/pending?internal_order_id=${encodeURIComponent(activeInternalOrderId || 'MTF-SIM-ORD')}&gateway_order_id=${encodeURIComponent(activeOrderId || '')}`);
          } else if (status === 'failed' || status === 'pending' || status === 'cancelled') {
            navigate(`/checkout/pending?internal_order_id=${encodeURIComponent(activeInternalOrderId || 'MTF-SIM-ORD')}&gateway_order_id=${encodeURIComponent(activeOrderId || '')}`);
          }
        }}
      />
    </div>
  );
}
