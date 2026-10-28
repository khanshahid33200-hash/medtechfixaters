import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { subscriptionService, CustomerCategory } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';

export default function CategorySelectionPage() {
  useSEO({
    title: 'Select Healthcare Category | MedTechFixaters',
    description: 'Choose your provider category: Solo Doctor / Clinic or Hospital Solutions on MedTechFixaters.',
  });

  const navigate = useNavigate();
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CustomerCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check whether returning authenticated user already has an active account
  useEffect(() => {
    let active = true;

    async function checkExistingUser() {
      try {
        const status = await subscriptionService.getAccountAccessStatus();
        if (!active) return;

        if (status.authenticated) {
          // Returning user with active subscription -> Route directly to their dashboard
          if (status.can_access_dashboard) {
            const dest =
              status.route_destination ||
              (status.customer_category === 'hospital' ? '/hospitaldashboard/dashboard' : '/doctor');
            navigate(dest, { replace: true });
            return;
          }

          // Returning user who completed profile but has unpaid introductory platform fee
          if (status.profile_completed && status.subscription_status === 'unpaid' && status.customer_category !== 'hospital') {
            navigate('/checkout/intro', { replace: true });
            return;
          }

          // User who already chose a category but left before completing general details form
          if (status.customer_category && !status.profile_completed) {
            navigate('/onboarding/profile', { state: { category: status.customer_category }, replace: true });
            return;
          }
        }
      } catch (err) {
        console.warn('Account status evaluation check:', err);
      } finally {
        if (active) setCheckingExisting(false);
      }
    }

    checkExistingUser();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSelect = async (category: CustomerCategory) => {
    setSelectedCategory(category);
    setIsSubmitting(true);
    setError(null);

    try {
      await subscriptionService.saveCustomerCategory(category);
      // Route immediately to Step 3: Profile Details
      navigate('/onboarding/profile', { state: { category } });
    } catch (err: any) {
      console.error('Category selection error:', err);
      setError(err.message || 'Failed to save customer category. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="relative min-h-[100dvh] text-[#171717] font-sans antialiased flex flex-col justify-between overflow-x-hidden">
        <AmbientBackground />
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center pt-36 pb-20 px-4">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin mx-auto" />
            <p className="text-xs text-[#6B6B6B] font-medium">Verifying account access...</p>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full pt-36 pb-20 px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold shadow-2xs">
            <Sparkles size={13} className="text-[#FF6A00]" />
            <span>Step 2 of Registration</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#171717] tracking-tight">
            Select Your <span className="bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] bg-clip-text text-transparent">Customer Category</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6B6B6B] font-medium leading-relaxed">
            Choose the structure that matches your healthcare practice. We tailor features, pricing, and onboarding directly to your operational scale.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2 Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Card A: Solo Doctor or Clinic */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={`rounded-[28px] border-2 p-8 flex flex-col justify-between transition-all bg-white shadow-xl ${
              selectedCategory === 'solo_doctor_clinic'
                ? 'border-[#FF6A00] ring-4 ring-orange-500/10'
                : 'border-orange-200/80 hover:border-[#FF6A00]'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-[#FF6A00] flex items-center justify-center shadow-xs">
                  <Stethoscope size={28} />
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-[11px] font-bold uppercase tracking-wider">
                  90% OFF First Month
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                  Solo Doctor or Clinic
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium mt-2 leading-relaxed">
                  Digital reception and patient management solutions for independent doctors and clinics.
                </p>
              </div>

              <div className="pt-2 border-t border-orange-100 space-y-2.5">
                <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Included Capabilities</p>
                <div className="space-y-2 text-xs text-[#171717] font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                    <span>₹500 for your first month (Save 90%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                    <span>From month two, regular ₹5,000 per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                    <span>Personal doctor QR code & online booking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                    <span>Live patient queue tokens & AI symptom triage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                    <span>Separate doctor workspace dashboard with data isolation</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleSelect('solo_doctor_clinic')}
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
              >
                {isSubmitting && selectedCategory === 'solo_doctor_clinic' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Select Solo Doctor or Clinic</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Card B: Hospital */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={`rounded-[28px] border-2 p-8 flex flex-col justify-between transition-all bg-white shadow-xl ${
              selectedCategory === 'hospital'
                ? 'border-stone-800 ring-4 ring-stone-500/10'
                : 'border-stone-200/90 hover:border-stone-400'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shadow-xs">
                  <Building2 size={28} />
                </div>
                <span className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-bold uppercase tracking-wider">
                  Custom Pricing
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-[#171717] tracking-tight">
                  Hospital
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium mt-2 leading-relaxed">
                  Digital reception and patient management solutions for hospitals and larger healthcare facilities.
                </p>
              </div>

              <div className="pt-2 border-t border-orange-100 space-y-2.5">
                <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Institutional Capabilities</p>
                <div className="space-y-2 text-xs text-[#171717] font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-stone-700 shrink-0" />
                    <span>Tailored pricing based on operational scope</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-stone-700 shrink-0" />
                    <span>No automatic charges (quote-based commercial agreement)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-stone-700 shrink-0" />
                    <span>Multi-doctor & multi-department digital receptionist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-stone-700 shrink-0" />
                    <span>Voice receptionist functionality & TV display streaming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-stone-700 shrink-0" />
                    <span>Dedicated administrative dashboard & staff role isolation</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => handleSelect('hospital')}
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-stone-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting && selectedCategory === 'hospital' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Select Hospital</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Security Disclaimers */}
        <div className="max-w-2xl mx-auto mt-12 p-4 rounded-2xl bg-white border border-orange-100 shadow-xs flex items-center justify-center gap-3 text-xs text-[#6B6B6B] text-center">
          <ShieldCheck size={18} className="text-[#FF6A00] shrink-0" />
          <span>
            Hospitals are not charged automatically. Solo Doctor and Clinic plans begin with the verified ₹500 introductory offer.
          </span>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
