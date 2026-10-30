import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CreditCard,
  Building,
  Tag,
  ExternalLink,
  X as XIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { subscriptionService } from '../../services/subscriptionService';
import { onboardingService } from '../../services/onboardingService';
import { loadCashfreeSDK } from '../../services/paymentGatewayAdapter';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import PaymentSimulatorPanel from '../../components/payment/PaymentSimulatorPanel';

export default function Step6Payment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState<'idle' | 'creating_order' | 'opening_checkout' | 'verifying_payment'>('idle');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [accountType, setAccountType] = useState('individual_doctor');
  const [clinicName, setClinicName] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [activeInternalOrderId, setActiveInternalOrderId] = useState<string>('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountRupees: number;
    finalRupees: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calculate renewal date (+1 month)
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const renewalDateFormatted = nextMonth.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  useEffect(() => {
    async function init() {
      try {
        // Pre-warm Cashfree SDK in background so checkout opens instantly
        loadCashfreeSDK().catch((e) => console.warn('[Payment] Prewarming Cashfree SDK notice:', e));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        setUserEmail(user.email || '');

        const status = await onboardingService.getStatus();
        const type = status.account_type || 'individual_doctor';
        setAccountType(type);

        const org = status.step_data?.org || {};
        setClinicName(org.name || org.practice_name || org.hospital_name || 'My Practice');
      } catch (err) {
        console.warn('Init payment error:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    init();
  }, [navigate]);

  const handleApplyCoupon = async () => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    setCouponValidating(true);
    setCouponError(null);
    try {
      const basePaise = 50000;
      const { data, error: rpcErr } = await supabase.rpc('validate_and_apply_coupon', {
        p_code: clean,
        p_plan_id: 'doctor_intro_500',
        p_order_amount_paise: basePaise,
      });

      if (rpcErr || !data?.valid) {
        setCouponError(data?.error || rpcErr?.message || 'Invalid or expired coupon code.');
        setAppliedCoupon(null);
      } else {
        const discountRupees = Math.round(data.discount_paise / 100);
        const finalRupees = Math.max(1, Math.round(data.final_amount_paise / 100));
        setAppliedCoupon({
          code: data.code,
          discountRupees,
          finalRupees,
        });
      }
    } catch (err: any) {
      setCouponError(err.message || 'Unable to validate coupon.');
    } finally {
      setCouponValidating(false);
    }
  };

  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [modalStuckWarning, setModalStuckWarning] = useState(false);

  const handlePayActivation = async (targetMode: '_self' | '_modal' = '_self') => {
    if (loading) return; // Prevent duplicate payment submissions
    setLoading(true);
    setCheckoutStage('creating_order');
    setError(null);
    setModalStuckWarning(false);

    try {
      // 1. Direct server-side order creation with plan_id, coupon_code, and customer details
      const internalId = activeInternalOrderId || `MTF-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const res = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: 'doctor_intro_500',
          internal_order_id: internalId,
          coupon_code: appliedCoupon?.code,
          customer_email: userEmail,
          customer_name: clinicName,
        }),
      });

      let order: any = null;
      if (res.ok) {
        order = await res.json();
      }

      // Fallback to subscriptionService if direct API didn't return session
      if (!order?.payment_session_id) {
        const subOrder = await subscriptionService.createPaymentOrder('introductory_first_month');
        if (subOrder.success) {
          order = {
            success: true,
            order_id: subOrder.gatewayOrderId,
            internal_order_id: subOrder.internalOrderId,
            payment_session_id: subOrder.paymentSessionId,
          };
        }
      }

      if (!order?.payment_session_id) {
        throw new Error(order?.error || 'Could not initialize Cashfree payment session. Please check your network and try again.');
      }

      const activeOrder = order.order_id || '';
      const activeIntOrder = order.internal_order_id || internalId;
      setActiveOrderId(activeOrder);
      setActiveInternalOrderId(activeIntOrder);
      setActiveSessionId(order.payment_session_id);

      // Persist active order for immediate recovery if user refreshes or redirects
      try {
        sessionStorage.setItem('medtech_active_payment', JSON.stringify({
          internal_order_id: activeIntOrder,
          order_id: activeOrder,
          payment_session_id: order.payment_session_id,
          timestamp: Date.now(),
        }));
      } catch {}

      // 2. Load SDK & Initialize Cashfree Checkout
      setCheckoutStage('opening_checkout');
      await loadCashfreeSDK();

      if (!window.Cashfree) {
        throw new Error('Cashfree Payment SDK is still loading or blocked. Please refresh or disable content blockers.');
      }

      const cashfreeMode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox') as 'sandbox' | 'production';
      const cashfree = window.Cashfree({ mode: cashfreeMode });

      // If user selected Full-Page Redirect (Default & Recommended)
      if (targetMode === '_self') {
        const checkoutResult = await cashfree.checkout({
          paymentSessionId: order.payment_session_id,
          redirectTarget: '_self',
        });
        if (checkoutResult?.error) {
          throw new Error(checkoutResult.error.message || 'Cashfree gateway reported a launch error.');
        }
        return;
      }

      // If user opted for Popup Modal, setup safety timer
      const stuckTimer = setTimeout(() => {
        setModalStuckWarning(true);
      }, 10000);

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_modal',
      });

      clearTimeout(stuckTimer);
      setModalStuckWarning(false);

      if (checkoutResult?.error) {
        console.warn('Cashfree modal closed or reported notice:', checkoutResult.error);
        // Verify with backend whether payment was captured before failing
        setCheckoutStage('verifying_payment');
        const vRes = await fetch(`/api/cashfree/verify?order_id=${encodeURIComponent(activeOrder)}&internal_order_id=${encodeURIComponent(activeIntOrder)}`);
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.status === 'completed') {
            navigate(`/onboarding/payment/success?internal_order_id=${encodeURIComponent(activeIntOrder)}`, { replace: true });
            return;
          }
        }
        setLoading(false);
        setCheckoutStage('idle');
        return;
      }

      // Modal finished payment capture -> route to server verification
      setCheckoutStage('verifying_payment');
      navigate(
        `/onboarding/payment/pending?internal_order_id=${encodeURIComponent(activeIntOrder)}` +
        `&gateway_order_id=${encodeURIComponent(activeOrder)}` +
        `&payment_id=${encodeURIComponent(checkoutResult?.paymentDetails?.payment_id || '')}`
      );
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Unable to open Cashfree gateway. Please try full-page redirect checkout.');
      setLoading(false);
      setCheckoutStage('idle');
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  // If Hospital, show commercial review / custom proposal screen
  if (accountType === 'hospital') {
    return (
      <OnboardingLayout
        currentStepIndex={5}
        title="Hospital Enterprise Activation"
        subtitle="Your institution registration has been submitted for enterprise onboarding."
        userEmail={userEmail}
      >
        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6A00] flex items-center justify-center mx-auto shadow-xs">
            <Building size={32} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900">
              Commercial Review In Progress
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hospital accounts include custom department deployment, staff credential provisioning, and dedicated server queues. Our commercial team has received your facility details for <strong>{clinicName}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-orange-600">Pending Commercial Review</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Desk</span>
              <span className="font-medium text-slate-800">support@medtechfixaters.in</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Turnaround</span>
              <span className="font-medium text-slate-800">Within 24 business hours</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/hospital/inquiry-status')}
            className="px-8 py-3.5 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-sm tracking-wide inline-flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <span>View Hospital Inquiry Status</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStepIndex={5}
      title="Platform Activation Fee"
      subtitle="Pay the one-time introductory platform fee of ₹500 to activate your MedTechFixaters practice workspace."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pricing Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-50/70 via-white to-orange-50/30 border border-orange-200/90 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-orange-100">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF6A00] text-white text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                <Sparkles size={11} />
                <span>Special 90% Discount</span>
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                Solo Doctor & Clinic — First Month Activation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice: <strong>{clinicName}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 line-through mr-2 font-mono">₹5,000</span>
              <span className="text-3xl font-extrabold text-[#FF6A00] font-mono">₹500</span>
              <span className="text-xs text-slate-500 block font-medium">for first 30 days</span>
            </div>
          </div>

          {/* Features Included */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Full Clinical Doctor Workspace & OPD Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>QR Appointment Booking & Patient Check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>AI Clinical Decision Support & Rx Writer</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Instant GST Tax Invoice & Priority Billing Support</span>
            </div>
          </div>

          {/* Promotional Coupon Input */}
          <div className="p-4 rounded-2xl bg-white/90 border border-orange-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag size={13} className="text-[#FF6A00]" />
                <span>Have a Promotional Coupon?</span>
              </label>
              {appliedCoupon && (
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Coupon Applied
                </span>
              )}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                <div>
                  <span className="font-mono font-bold text-emerald-900">{appliedCoupon.code}</span>
                  <span className="text-emerald-700 ml-2 font-medium">
                    (Saved ₹{appliedCoupon.discountRupees.toLocaleString('en-IN')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. CLINIC50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold uppercase outline-none focus:border-[#FF6A00]"
                />
                <button
                  type="button"
                  disabled={couponValidating || !couponCode.trim()}
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-40 transition-all"
                >
                  {couponValidating ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{couponError}</span>
              </p>
            )}
          </div>

          {/* Billing Terms Notice */}
          <div className="p-4 rounded-2xl bg-white/80 border border-orange-100 text-xs text-slate-600 space-y-2">
            <div className="flex justify-between items-center text-slate-800 font-semibold">
              <span>Platform Activation Fee:</span>
              <div className="flex items-center gap-2">
                {appliedCoupon && (
                  <span className="line-through text-slate-400 font-mono text-[11px]">₹500.00</span>
                )}
                <span className="font-mono text-emerald-600 font-bold">
                  ₹{(appliedCoupon ? appliedCoupon.finalRupees : 500).toFixed(2)} INR
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Next Renewal Date:</span>
              <span>{renewalDateFormatted}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Subsequent Monthly Renewal:</span>
              <span className="font-mono">₹5,000.00 / month</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              *One-time payment for platform activation. No automatic charges; you can renew or cancel anytime before the next billing cycle.
            </p>
          </div>
        </div>

          {/* Sandbox Test Guidelines Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-950 text-xs">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>Cashfree Sandbox Test Environment</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              • <strong>Instant Automated Testing:</strong> Use <strong>Cards</strong> (Test Card Number: <span className="font-mono bg-amber-100/90 px-1.5 py-0.5 rounded font-bold text-amber-950">4012 0000 0000 0002</span>, any future MM/YY & CVV <span className="font-mono bg-amber-100/90 px-1 py-0.5 rounded font-bold">123</span>) or <strong>UPI</strong> (<span className="font-mono bg-amber-100/90 px-1.5 py-0.5 rounded font-bold text-amber-950">success@upi</span>).
              <br />
              • <strong>Third-party Wallets Notice:</strong> In Cashfree Sandbox, external wallet aggregators (MobiKwik, FreeCharge) require real-world mobile OTP and do not provide automated sandbox webhooks. Please test with Cards, UPI, or NetBanking simulation.
            </p>
          </div>

        {modalStuckWarning && (
          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#FF6A00] shrink-0" />
              <span>Checkout modal taking longer than expected?</span>
            </div>
            <button
              type="button"
              onClick={() => handlePayActivation('_self')}
              className="px-3 py-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Switch to Full-Page Checkout →
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <Lock size={14} className="text-emerald-600" />
          <span>Cashfree Payments. 256-bit bank encrypted. Full-page secure gateway.</span>
        </div>

        {/* Primary Checkout: Full-Page Redirect */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handlePayActivation('_self')}
            className="w-full py-4 px-6 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>
                  {checkoutStage === 'creating_order'
                    ? 'Securing Order on Server...'
                    : checkoutStage === 'opening_checkout'
                    ? 'Opening Cashfree Gateway...'
                    : checkoutStage === 'verifying_payment'
                    ? 'Verifying Bank Transaction...'
                    : 'Initializing Secure Checkout...'}
                </span>
              </>
            ) : (
              <>
                <CreditCard size={18} />
                <span>
                  Pay ₹{appliedCoupon ? appliedCoupon.finalRupees : 500} & Activate Workspace
                </span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Alternative: Modal Popup */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePayActivation('_modal')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>Or open checkout in popup modal</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>

      <PaymentSimulatorPanel
        orderId={activeOrderId}
        internalOrderId={activeInternalOrderId}
        onStatusChange={(status, details) => {
          if (status === 'completed') {
            navigate(`/onboarding/payment/success?internal_order_id=${encodeURIComponent(activeInternalOrderId || 'MTF-SIM-ORD')}`);
          } else if (status === 'failed' || status === 'pending' || status === 'cancelled') {
            navigate(
              `/onboarding/payment/pending?internal_order_id=${encodeURIComponent(activeInternalOrderId || 'MTF-SIM-ORD')}` +
              `&gateway_order_id=${encodeURIComponent(activeOrderId || '')}`
            );
          }
        }}
      />
    </OnboardingLayout>
  );
}
