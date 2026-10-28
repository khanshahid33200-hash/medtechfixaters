import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Clock,
  CheckCircle2,
  PhoneCall,
  Mail,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';

const INQUIRY_STAGES = [
  { id: 'inquiry_submitted', label: 'Inquiry Submitted', desc: 'Requirements received and logged in system' },
  { id: 'contact_initiated', label: 'Contact Initiated', desc: 'Account representative assigned and reviewing specs' },
  { id: 'proposal_in_preparation', label: 'Proposal in Preparation', desc: 'Technical scoping, doctor quota & hardware integration' },
  { id: 'proposal_sent', label: 'Proposal Sent', desc: 'Commercial terms and tailored quote delivered' },
  { id: 'contract_approved', label: 'Contract Approved', desc: 'Institutional agreement finalized' },
  { id: 'awaiting_payment', label: 'Awaiting Activation', desc: 'Commercial invoice processing & cloud provisioning' },
  { id: 'active', label: 'Active', desc: 'Hospital system provisioned with multi-department access' },
];

export default function HospitalInquiryStatusPage() {
  useSEO({
    title: 'Hospital Inquiry Status | MedTechFixaters Commercial Onboarding',
    description: 'Track the status of your MedTechFixaters hospital deployment, commercial review, and contract proposal.',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inquiry, setInquiry] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInquiry() {
      try {
        const data = await subscriptionService.getHospitalInquiryStatus();
        setInquiry(data);
      } catch (err: any) {
        setError(err.message || 'Could not load inquiry status.');
      } finally {
        setLoading(false);
      }
    }
    loadInquiry();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  const currentStatus = inquiry?.inquiry_status || 'inquiry_submitted';
  const currentStageIndex = INQUIRY_STAGES.findIndex((s) => s.id === currentStatus);
  const effectiveIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  const formattedQuote = inquiry?.quoted_amount
    ? `₹${(inquiry.quoted_amount / 100).toLocaleString('en-IN')}`
    : 'Under Custom Scoping';

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full pt-36 pb-20 px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold shadow-2xs">
            <Building2 size={13} className="text-[#FF6A00]" />
            <span>Hospital Commercial Onboarding</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
            Institutional Deployment Status
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium">
            Hospital: <strong>{inquiry?.organizations?.organization_name || 'Hospital Practice'}</strong>
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Callout Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-orange-100 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-orange-100 pb-5">
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                Current Review Stage
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#171717] mt-1 capitalize">
                {currentStatus.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Submitted on {new Date(inquiry?.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                Custom Commercial Quote
              </span>
              <span className="text-2xl font-black text-[#FF6A00] font-mono block mt-1">
                {formattedQuote}
              </span>
              <span className="text-[10px] text-[#6B6B6B] block">
                {inquiry?.quoted_amount ? 'Tailored institutional pricing' : 'Pending engineering evaluation'}
              </span>
            </div>
          </div>

          {/* Stepper (8 Stages) */}
          <div className="space-y-4 pt-2">
            <p className="text-xs font-extrabold text-[#171717] uppercase tracking-wider">Commercial Review Timeline</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {INQUIRY_STAGES.slice(0, 4).map((stage, idx) => {
                const isDone = effectiveIndex > idx;
                const isCurrent = effectiveIndex === idx;
                return (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-2xl border transition ${
                      isDone
                        ? 'bg-orange-50/50 border-orange-200 text-orange-950'
                        : isCurrent
                        ? 'bg-white border-[#FF6A00] ring-2 ring-orange-500/10 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                      ) : isCurrent ? (
                        <Clock size={16} className="text-[#FF6A00] shrink-0 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-stone-300 shrink-0" />
                      )}
                      <span className="text-xs font-bold leading-tight text-[#171717]">{stage.label}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] leading-tight">{stage.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {INQUIRY_STAGES.slice(4).map((stage, idx) => {
                const stageIdx = idx + 4;
                const isDone = effectiveIndex > stageIdx;
                const isCurrent = effectiveIndex === stageIdx;
                return (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-2xl border transition ${
                      isDone
                        ? 'bg-orange-50/50 border-orange-200 text-orange-950'
                        : isCurrent
                        ? 'bg-white border-[#FF6A00] ring-2 ring-orange-500/10 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-[#FF6A00] shrink-0" />
                      ) : isCurrent ? (
                        <Clock size={16} className="text-[#FF6A00] shrink-0 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-stone-300 shrink-0" />
                      )}
                      <span className="text-xs font-bold leading-tight text-[#171717]">{stage.label}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] leading-tight">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Callout if Active */}
          {currentStatus === 'active' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Hospital System Live</p>
                <p className="text-xs text-emerald-700">Your hospital instance has been approved and provisioned.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/hospitaldashboard/dashboard')}
                className={`py-3 px-5 rounded-xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md`}
              >
                <span>Launch Hospital Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Contact Representative Box */}
          <div className="pt-4 border-t border-orange-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-[#6B6B6B]">
              <p className="font-bold text-[#171717]">Need Immediate Commercial Assistance?</p>
              <p className="text-[11px] text-[#6B6B6B]">Contact our enterprise digitalization specialists directly.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:+919587867559"
                className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/70 border border-orange-200 text-stone-800 text-xs font-bold transition flex items-center gap-2"
              >
                <PhoneCall size={14} className="text-[#FF6A00]" />
                <span>+91-95878-67559</span>
              </a>
              <a
                href="mailto:contact@medtechfixaters.in"
                className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/70 border border-orange-200 text-stone-800 text-xs font-bold transition flex items-center gap-2"
              >
                <Mail size={14} className="text-[#FF6A00]" />
                <span>contact@medtechfixaters.in</span>
              </a>
            </div>
          </div>
        </motion.div>
      </main>

      <PublicFooter />
    </div>
  );
}
