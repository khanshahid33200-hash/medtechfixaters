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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [accountType, setAccountType] = useState('individual_doctor');
  const [clinicName, setClinicName] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [activeInternalOrderId, setActiveInternalOrderId] = useState<string>('');

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

  const handlePayActivation = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Server-side order creation strictly enforces ₹500
      const order = await subscriptionService.createPaymentOrder('introductory_first_month');

      if (!order.success) {
        throw new Error(order.error || 'Failed to initialize server payment order.');
      }

      setActiveOrderId(order.gatewayOrderId || '');
      setActiveInternalOrderId(order.internalOrderId || '');

      // 2. Open Cashfree Checkout Modal
      if (order.paymentSessionId) {
        await loadCashfreeSDK();

        if (window.Cashfree) {
          const cashfreeMode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox') as 'sandbox' | 'production';
          const cashfree = window.Cashfree({ mode: cashfreeMode });

          const checkoutResult = await cashfree.checkout({
            paymentSessionId: order.paymentSessionId,
            redirectTarget: '_modal',
          });

          if (checkoutResult?.error) {
            console.log('Cashfree modal closed or error:', checkoutResult.error);
            setLoading(false);
            return;
          }

          // Modal finished payment capture -> route to server verification
          navigate(
            `/onboarding/payment/pending?internal_order_id=${encodeURIComponent(order.internalOrderId)}` +
            `&gateway_order_id=${encodeURIComponent(order.gatewayOrderId || '')}` +
            `&payment_id=${encodeURIComponent(checkoutResult?.paymentDetails?.payment_id || '')}`
          );
          return;
        }
      }

      // If no paymentSessionId was returned from Cashfree
      throw new Error(order.error || 'Could not initialize Cashfree payment session. Please verify test credentials.');
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Unable to start Cashfree checkout session. Please try again.');
      setLoading(false);
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

          {/* Billing Terms Notice */}
          <div className="p-4 rounded-2xl bg-white/80 border border-orange-100 text-xs text-slate-600 space-y-2">
            <div className="flex justify-between items-center text-slate-800 font-semibold">
              <span>Platform Activation Fee:</span>
              <span className="font-mono text-emerald-600">₹500.00 INR</span>
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

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <Lock size={14} className="text-emerald-600" />
          <span>Cashfree Payments. 256-bit bank encrypted. UPI, Cards & NetBanking accepted.</span>
        </div>

        {/* Pay Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handlePayActivation}
            className="w-full py-4 px-6 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Initializing Secure Checkout...</span>
              </>
            ) : (
              <>
                <CreditCard size={18} />
                <span>Pay ₹500 & Activate Workspace</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
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
