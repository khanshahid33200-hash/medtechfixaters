import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  FileText,
  Lock,
} from 'lucide-react';
import { subscriptionService, AccountAccessStatus } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';

export default function SubscriptionDetailsPage() {
  useSEO({
    title: 'Subscription Management & Renewal | MedTechFixaters',
    description: 'Manage your MedTechFixaters practice subscription, review billing periods, and process monthly renewals.',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [accessStatus, setAccessStatus] = useState<AccountAccessStatus | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [status, sub] = await Promise.all([
          subscriptionService.getAccountAccessStatus(),
          subscriptionService.getCurrentSubscription(),
        ]);
        setAccessStatus(status);
        setSubscription(sub);
      } catch (err: any) {
        setError(err.message || 'Could not load subscription details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRenew = async () => {
    setRenewing(true);
    setError(null);

    try {
      // 1. Create renewal order strictly enforced at ₹5,000 (500000 paise)
      const order = await subscriptionService.createPaymentOrder('monthly_renewal');

      if (!order.success) {
        throw new Error(order.error || 'Failed to initialize renewal payment.');
      }

      // 2. Route customer to payment verification screen
      if (order.checkoutUrl) {
        navigate(order.checkoutUrl);
      } else {
        navigate(`/checkout/pending?internal_order_id=${encodeURIComponent(order.internalOrderId)}&gateway_order_id=${encodeURIComponent(order.gatewayOrderId || '')}`);
      }
    } catch (err: any) {
      console.error('Renewal error:', err);
      setError(err.message || 'Could not process renewal. Please try again.');
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  const isRenewalDue =
    accessStatus?.subscription_status === 'grace_period' ||
    accessStatus?.subscription_status === 'expired' ||
    (accessStatus?.days_remaining !== undefined && accessStatus.days_remaining <= 7);

  const formattedPeriodEnd = accessStatus?.current_period_end
    ? new Date(accessStatus.current_period_end).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not yet activated';

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full pt-36 pb-20 px-4 sm:px-6 space-y-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-orange-100 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Subscription Management & Renewal
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium mt-1">
              Organization: <strong>{accessStatus?.organization_name || 'My Clinical Practice'}</strong>
            </p>
          </div>
          <div>
            <Link
              to="/doctor"
              className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-orange-50/50 text-[#171717] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>Go to Doctor Workspace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Subscription Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-[24px] bg-white/95 border border-orange-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Plan</p>
            <p className="text-xl font-extrabold text-[#171717]">
              {subscription?.plan_code === 'solo_first_month_500' ? 'First Month Offer' : 'Doctor & Clinic Monthly'}
            </p>
            <p className="text-xs text-[#C2410C] font-semibold">
              Standard renewal: ₹5,000 / month
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-white/95 border border-orange-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Status</p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                accessStatus?.subscription_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : accessStatus?.subscription_status === 'grace_period'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {accessStatus?.subscription_status === 'active'
                  ? 'Active'
                  : accessStatus?.subscription_status === 'grace_period'
                  ? 'Grace Period'
                  : 'Renewal Due / Expired'}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] font-medium">
              {accessStatus?.days_remaining !== undefined && accessStatus.days_remaining > 0
                ? `${accessStatus.days_remaining} days remaining`
                : 'Current cycle completed'}
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-white/95 border border-orange-100 shadow-sm space-y-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Period End</p>
            <p className="text-xl font-extrabold text-[#171717] font-mono">
              {formattedPeriodEnd}
            </p>
            <p className="text-xs text-[#6B6B6B] font-medium">
              Asia/Kolkata Calendar Month Cycle
            </p>
          </div>
        </div>

        {/* Subscription Renewal Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-[28px] border-2 transition-all bg-white/95 shadow-sm ${
            isRenewalDue
              ? 'border-[#FF6A00] ring-4 ring-orange-500/10'
              : 'border-orange-100'
          }`}
        >
          <div className="max-w-2xl space-y-6">
            <div className="border-b border-orange-100 pb-4">
              <span className="px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold uppercase tracking-wider inline-block">
                Subscription Renewal
              </span>
              <h2 className="text-2xl font-extrabold text-[#171717] mt-2">
                Extend Your Practice Access
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Renew your monthly subscription to maintain continuous live patient queue tokens, digital prescriptions, and online booking.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-1">
                <span className="text-stone-400 block font-bold uppercase tracking-wider text-[10px]">Amount Due</span>
                <span className="text-2xl font-black text-[#171717] font-mono">₹5,000.00</span>
                <span className="text-[#6B6B6B] block text-[11px]">Subsequent monthly rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-1">
                <span className="text-stone-400 block font-bold uppercase tracking-wider text-[10px]">Billing Period</span>
                <span className="text-2xl font-black text-[#171717]">One Month</span>
                <span className="text-[#6B6B6B] block text-[11px]">Extended from current period end</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleRenew}
                disabled={renewing}
                className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
              >
                {renewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initiating Renewal Order (₹5,000)...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Pay ₹5,000 and Renew Subscription</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-[#6B6B6B] text-center leading-relaxed">
                Existing customers are billed at the standard rate of ₹5,000. Introductory discounts cannot be reapplied. Your subscription period is extended upon verified payment receipt.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <PublicFooter />
    </div>
  );
}
