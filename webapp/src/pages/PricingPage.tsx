import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X as XIcon,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  HelpCircle,
  PhoneCall,
  Mail,
  Lock,
  ChevronDown,
  Calendar,
  AlertCircle,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import AmbientBackground from '../components/motion/AmbientBackground';
import { useSEO } from '../hooks/useSEO';
import {
  PRICING_PLANS,
  FEATURE_COMPARISON_MATRIX,
  PRICING_FAQS,
  PricingPlan,
} from '../config/pricing';
import { trackPricingEvent } from '../utils/analytics';
import { subscriptionService } from '../services/subscriptionService';
import { PRIMARY_BUTTON } from '../lib/motion';

export default function PricingPage() {
  useSEO({
    title: 'Transparent Healthcare Pricing — Solo Doctor, Clinic & Hospital Plans | MedTechFixaters',
    description:
      'Transparent pricing for MedTechFixaters OPD queue and digital practice software. Individual doctors start for ₹500 for the first month (90% off), standard monthly at ₹5,000, and tailored hospital solutions.',
  });

  const navigate = useNavigate();

  // Track page view on initial render
  useEffect(() => {
    trackPricingEvent('pricing_page_view', {
      source: 'pricing_page_landing',
    });
  }, []);

  // Hospital Consultation Modal State
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [hospForm, setHospForm] = useState({
    contactPerson: '',
    hospitalName: '',
    email: '',
    phone: '',
    city: '',
    doctorCount: '10-25',
    requiredServices: 'Digital Receptionist, Voice TTS, Live Queue, TV Board',
    notes: '',
  });
  const [hospSubmitting, setHospSubmitting] = useState(false);
  const [hospSuccess, setHospSuccess] = useState(false);
  const [hospError, setHospError] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handlePlanClick = (plan: PricingPlan) => {
    trackPricingEvent('pricing_plan_select', {
      plan_id: plan.id,
      plan_name: plan.name,
      amount: plan.price || 0,
    });

    if (plan.id === 'hospital_custom') {
      setHospitalModalOpen(true);
    } else if (plan.id === 'doctor_intro_500') {
      // First Month Introductory Offer -> Sign up
      navigate('/login?tab=signup');
    } else {
      // Regular Doctor and Clinic monthly subscription
      navigate('/login?tab=signup');
    }
  };

  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHospSubmitting(true);
    setHospError(null);

    try {
      await subscriptionService.completeHospitalProfile({
        contactPerson: hospForm.contactPerson.trim(),
        hospitalName: hospForm.hospitalName.trim(),
        officialEmail: hospForm.email.trim(),
        phone: hospForm.phone.trim(),
        address: hospForm.city.trim(),
        city: hospForm.city.trim(),
        state: 'India',
        doctorCount: hospForm.doctorCount,
        requiredServices: hospForm.requiredServices,
        consent: true,
      });

      setHospSuccess(true);
    } catch (err: any) {
      setHospError(err.message || 'Failed to submit hospital inquiry. Please call or email directly.');
    } finally {
      setHospSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-36 sm:pt-44 pb-14 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-100/90 border border-orange-200 text-[#C2410C] text-xs font-bold tracking-wide shadow-2xs">
            <Sparkles size={13} className="text-[#FF6A00]" />
            <span>Transparent Healthcare SaaS Pricing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#171717] leading-[1.15]">
            Simple, Transparent Plans.<br />
            <span className="bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] bg-clip-text text-transparent">No Hidden Costs.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#6B6B6B] font-medium max-w-2xl mx-auto leading-relaxed">
            From single-counter outpatient practices to multi-department hospitals. Choose the subscription built for your workflow with complete data isolation and server-verified security.
          </p>

          {/* Trust Guarantees Row */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#6B6B6B]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>PostgreSQL Row-Level Data Isolation</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={16} className="text-[#FF6A00] shrink-0" />
              <span>256-bit Encrypted Payments</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={16} className="text-emerald-600 shrink-0" />
              <span>Cancel or Renew Monthly</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3 Pricing Cards Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isIntro = plan.id === 'doctor_intro_500';
            const isEnterprise = plan.id === 'hospital_custom';

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className={`relative rounded-[28px] p-8 flex flex-col justify-between transition-all ${
                  isIntro
                    ? 'bg-white border-2 border-[#FF6A00] shadow-[0_20px_50px_-12px_rgba(255,106,0,0.18)] ring-4 ring-orange-500/10'
                    : isEnterprise
                    ? 'bg-gradient-to-b from-[#171717] via-[#1F1F1F] to-[#171717] text-white border border-stone-800 shadow-xl'
                    : 'bg-white/95 border border-orange-100/90 shadow-sm'
                }`}
              >
                {/* Prominent Badge */}
                {isIntro && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-orange-500/30 flex items-center gap-1.5">
                    <Sparkles size={12} />
                    <span>90% OFF FIRST MONTH</span>
                  </span>
                )}

                {isEnterprise && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-stone-800 border border-stone-700 text-orange-400 text-[11px] font-black uppercase tracking-wider shadow-md">
                    <span>ENTERPRISE ARCHITECTURE</span>
                  </span>
                )}

                <div className="space-y-6">
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${isEnterprise ? 'text-orange-400' : 'text-[#C2410C]'}`}>
                        {plan.badge || 'Subscription'}
                      </span>
                      {isIntro && (
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-[10px] font-bold uppercase tracking-wide">
                          Special Offer
                        </span>
                      )}
                    </div>

                    <h3 className={`text-2xl font-extrabold tracking-tight mt-1.5 ${isEnterprise ? 'text-white' : 'text-[#171717]'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-2 leading-relaxed font-medium ${isEnterprise ? 'text-stone-400' : 'text-[#6B6B6B]'}`}>
                      {plan.targetAudience}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="pt-2 border-t border-orange-100/60 dark:border-stone-800">
                    {plan.price !== null ? (
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          {plan.originalPrice && (
                            <span className="text-base font-bold text-stone-400 line-through">
                              ₹{plan.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className={`text-5xl font-black tracking-tight ${isEnterprise ? 'text-white' : 'text-[#171717]'}`}>
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#6B6B6B] mt-1">
                          {plan.billingFrequency}
                        </p>
                        {/* Recurring Note for Intro Plan */}
                        {plan.secondaryBillingNote && (
                          <div className={`mt-2.5 p-3 rounded-xl text-xs font-medium leading-relaxed ${
                            isIntro
                              ? 'bg-orange-50/90 text-orange-950 border border-orange-200/80'
                              : 'bg-stone-50 text-stone-700'
                          }`}>
                            <span>{plan.secondaryBillingNote}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-white">
                            Custom Pricing
                          </span>
                        </div>
                        <p className="text-xs font-bold text-orange-400 mt-1">
                          Tailored based on hospital requirements
                        </p>
                        <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                          Pricing depends on hospital requirements, number of doctors, facilities, deployment needs, and required integrations. No automated charges.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Included Platform Features */}
                  <div className="pt-4 border-t border-orange-100/60 dark:border-stone-800 space-y-3">
                    <p className={`text-xs font-extrabold uppercase tracking-wider ${isEnterprise ? 'text-stone-400' : 'text-[#6B6B6B]'}`}>
                      Included Platform Features
                    </p>
                    <div className="space-y-2.5">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs font-medium">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isEnterprise ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-[#C2410C]'
                          }`}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span className={isEnterprise ? 'text-stone-300' : 'text-stone-700'}>
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card CTA & Disclosure */}
                <div className="pt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isIntro
                        ? PRIMARY_BUTTON
                        : isEnterprise
                        ? 'bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] hover:brightness-105 text-white font-extrabold shadow-lg shadow-orange-500/30'
                        : 'bg-[#171717] hover:bg-black text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight size={15} />
                  </button>

                  <p className={`text-[11px] text-center leading-relaxed ${isEnterprise ? 'text-stone-400' : 'text-[#6B6B6B]'}`}>
                    {plan.termsDisclosure}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Matrix Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] text-xs font-bold uppercase tracking-wider border border-orange-200">
              Feature Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              Compare MedTechFixaters Platform Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium">
              Every feature enabled for each subscription tier, backed by verified data isolation and transparent limits.
            </p>
          </div>

          <div className="bg-white/95 border border-orange-100/90 rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-orange-50/70 border-b border-orange-100 text-[#6B6B6B] font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-6 w-2/5 text-[#171717]">Platform Feature</th>
                    <th className="py-4 px-6 text-center w-1/5 text-[#C2410C] bg-orange-100/50">
                      Solo Doctor Offer (₹500 / 1st mo)
                    </th>
                    <th className="py-4 px-6 text-center w-1/5 text-[#171717]">
                      Doctor & Clinic (₹5,000 / mo)
                    </th>
                    <th className="py-4 px-6 text-center w-1/5 text-stone-900 bg-stone-100/70">
                      Hospital Solutions (Custom)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/50 font-medium">
                  {FEATURE_COMPARISON_MATRIX.map((cat, catIdx) => (
                    <React.Fragment key={catIdx}>
                      <tr className="bg-orange-50/40">
                        <td colSpan={4} className="py-3 px-6 font-bold uppercase tracking-wider text-[11px] text-[#171717]">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3.5 px-6">
                            <p className="font-bold text-[#171717]">{item.name}</p>
                            <p className="text-[11px] text-[#6B6B6B]">{item.description}</p>
                          </td>
                          <td className="py-3.5 px-6 text-center bg-orange-50/20 font-semibold text-stone-800">
                            {typeof item.introDoctor === 'boolean' ? (
                              item.introDoctor ? (
                                <Check size={18} className="text-[#FF6A00] mx-auto" strokeWidth={3} />
                              ) : (
                                <XIcon size={16} className="text-stone-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-[11px] text-[#C2410C] font-bold">{item.introDoctor}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-center font-semibold text-stone-800">
                            {typeof item.monthlyDoctor === 'boolean' ? (
                              item.monthlyDoctor ? (
                                <Check size={18} className="text-[#FF6A00] mx-auto" strokeWidth={3} />
                              ) : (
                                <XIcon size={16} className="text-stone-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-[11px] text-stone-700 font-bold">{item.monthlyDoctor}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-center bg-stone-50/40 font-semibold text-stone-900">
                            {typeof item.hospital === 'boolean' ? (
                              item.hospital ? (
                                <Check size={18} className="text-emerald-600 mx-auto" strokeWidth={3} />
                              ) : (
                                <XIcon size={16} className="text-stone-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-[11px] text-stone-800 font-bold">{item.hospital}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] text-xs font-bold uppercase tracking-wider border border-orange-200">
            Questions & Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium max-w-xl mx-auto">
            Everything you need to know about our introductory pricing, billing terms, renewals, and institutional setups.
          </p>
        </div>

        <div className="space-y-3.5">
          {PRICING_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-orange-100/90 bg-white/95 shadow-2xs overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-[#171717] text-sm sm:text-base cursor-pointer hover:bg-orange-50/40 transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#6B6B6B] transition-transform ${isOpen ? 'rotate-180 text-[#FF6A00]' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4 pt-1 text-xs text-[#6B6B6B] leading-relaxed font-medium"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hospital Consultation Modal */}
      {hospitalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-orange-100 rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 space-y-5 text-stone-800 relative">
            <button
              type="button"
              onClick={() => {
                setHospitalModalOpen(false);
                setHospSuccess(false);
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 p-1"
            >
              ✕
            </button>

            {hospSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-[#171717] tracking-tight">
                  Hospital Consultation Request Received
                </h3>
                <p className="text-xs text-[#6B6B6B] leading-relaxed font-medium">
                  Thank you for reaching out regarding <strong>{hospForm.hospitalName}</strong>. Our enterprise healthcare engineering team will review your requirements and reach you at <strong>{hospForm.phone}</strong> within 4 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHospitalModalOpen(false);
                    setHospSuccess(false);
                  }}
                  className={`w-full py-3.5 ${PRIMARY_BUTTON} rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer`}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleHospitalSubmit} className="space-y-4">
                <div className="border-b border-orange-100 pb-3">
                  <span className="px-2.5 py-0.5 bg-orange-100 text-[#C2410C] font-bold text-[10px] uppercase tracking-wider rounded-full border border-orange-200">
                    Hospital Solutions
                  </span>
                  <h3 className="text-2xl font-bold text-[#171717] tracking-tight mt-1">
                    Request Custom Hospital Quotation
                  </h3>
                  <p className="text-xs text-[#6B6B6B] font-medium">
                    Pricing depends on hospital size, doctor count, counter routing, and integration requirements.
                  </p>
                </div>

                {hospError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {hospError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. / Director Name"
                      value={hospForm.contactPerson}
                      onChange={(e) => setHospForm({ ...hospForm, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metro Care Hospital"
                      value={hospForm.hospitalName}
                      onChange={(e) => setHospForm({ ...hospForm, hospitalName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="director@metrocare.in"
                      value={hospForm.email}
                      onChange={(e) => setHospForm({ ...hospForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Mobile / Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={hospForm.phone}
                      onChange={(e) => setHospForm({ ...hospForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      City & State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmedabad, Gujarat"
                      value={hospForm.city}
                      onChange={(e) => setHospForm({ ...hospForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Doctor Count
                    </label>
                    <select
                      value={hospForm.doctorCount}
                      onChange={(e) => setHospForm({ ...hospForm, doctorCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                    >
                      <option value="5-10">5 - 10 Doctors</option>
                      <option value="10-25">10 - 25 Doctors</option>
                      <option value="25-50">25 - 50 Doctors</option>
                      <option value="50+">50+ Doctors (Multi-bed Chain)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-xs">
                    Deployment Scope & Requirements
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Multi-counter reception, voice callouts, TV queue board, custom HIS integration"
                    value={hospForm.notes}
                    onChange={(e) => setHospForm({ ...hospForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={hospSubmitting}
                    className={`w-full py-4 ${PRIMARY_BUTTON} rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
                  >
                    {hospSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Hospital Inquiry</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-[#6B6B6B] text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>No automated charges. Custom quote provided after technical review.</span>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
