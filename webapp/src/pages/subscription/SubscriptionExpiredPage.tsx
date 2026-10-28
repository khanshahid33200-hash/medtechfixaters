import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Lock,
  RefreshCw,
  PhoneCall,
  Mail,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import { subscriptionService, AccountAccessStatus } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';

export default function SubscriptionExpiredPage() {
  useSEO({
    title: 'Subscription Expired | MedTechFixaters',
    description: 'Your MedTechFixaters subscription requires renewal to restore active clinical queue and prescription access.',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccountAccessStatus | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await subscriptionService.getAccountAccessStatus();
        setAccessStatus(data);
      } catch (err) {
        console.warn('Failed to load access status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  const isHospital = accessStatus?.customer_category === 'hospital';

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-lg mx-auto w-full pt-36 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border-2 border-orange-200 rounded-[28px] p-8 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-orange-100 text-[#FF6A00] flex items-center justify-center mx-auto shadow-sm">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-orange-100 border border-orange-200 text-[#C2410C] text-xs font-bold uppercase tracking-wider inline-block">
              {accessStatus?.subscription_status === 'suspended' ? 'Account Suspended' : 'Subscription Cycle Ended'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Clinical Access Temporarily Restricted
            </h2>
            <p className="text-xs text-[#6B6B6B] font-medium max-w-sm mx-auto leading-relaxed">
              Your practice subscription period has elapsed. To restore uninterrupted patient queueing and prescription access, please complete your monthly renewal.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-left text-xs text-[#6B6B6B] space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span><strong>Patient Data Safe:</strong> All previous consultation records, prescription history, and patient contacts remain securely preserved.</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#FF6A00] shrink-0" />
              <span><strong>Instant Reactivation:</strong> Paid features unlock immediately upon verified transaction receipt.</span>
            </div>
          </div>

          {/* Action according to category */}
          {!isHospital ? (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/subscription/renew')}
                className={`w-full py-4 px-6 rounded-2xl ${PRIMARY_BUTTON} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer`}
              >
                <RefreshCw size={15} />
                <span>Renew Subscription (₹5,000 / month)</span>
              </button>

              <p className="text-[11px] text-stone-400">
                Subsequent renewals billed at the standard rate of ₹5,000.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-[#6B6B6B]">
                Hospital accounts are provisioned under custom institutional contracts. Contact your account manager to renew or update terms.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="tel:+919587867559"
                  className="py-3 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <PhoneCall size={14} />
                  <span>Call Hospital Operations: +91-95878-67559</span>
                </a>
                <a
                  href="mailto:contact@medtechfixaters.in"
                  className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/70 border border-orange-200 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Mail size={14} className="text-[#FF6A00]" />
                  <span>contact@medtechfixaters.in</span>
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <PublicFooter />
    </div>
  );
}
