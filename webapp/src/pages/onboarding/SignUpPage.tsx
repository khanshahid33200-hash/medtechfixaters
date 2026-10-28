import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  Building2,
  ArrowRight,
  Lock,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';

export default function SignUpPage() {
  useSEO({
    title: 'Register & Access Healthcare Solutions | MedTechFixaters',
    description: 'Sign up for MedTechFixaters with Google Authentication. Digital receptionist, OPD queue, and hospital solutions.',
  });

  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Google OAuth Authentication
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Redirect back to category onboarding gate
      const redirectUrl = `${window.location.origin}/onboarding/category`;
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthErr) throw oauthErr;
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Failed to initialize Google authentication. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-md w-full space-y-8">
          {/* Header Card */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold shadow-2xs">
              <Sparkles size={13} className="text-[#FF6A00]" />
              <span>Digital Healthcare Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              Get Started with <span className="bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] bg-clip-text text-transparent">MedTechFixaters</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium">
              Transparent digital solutions for independent doctors, outpatient clinics, and hospitals.
            </p>
          </div>

          {/* Authentication Container */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 border border-orange-100/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6"
          >
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="w-full py-4 px-4 bg-white hover:bg-orange-50/50 border-2 border-stone-200 hover:border-orange-300 rounded-2xl text-stone-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group focus:outline-hidden focus:ring-4 focus:ring-orange-500/10"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 text-[#FF6A00] animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <p className="text-[11px] text-[#6B6B6B] text-center leading-relaxed">
                By continuing, you authenticate with your verified Google account. Existing subscribers are automatically routed to their workspace without duplicate charges.
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-orange-100" />
              <span className="flex-shrink mx-3 text-stone-400 text-[11px] font-bold uppercase tracking-wider">
                Healthcare Customer Categories
              </span>
              <div className="flex-grow border-t border-orange-100" />
            </div>

            {/* Preview of Category Options */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100 text-left space-y-1">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                  <Stethoscope size={16} />
                </div>
                <p className="text-xs font-bold text-[#171717]">Solo Doctor / Clinic</p>
                <p className="text-[10px] text-[#6B6B6B] leading-tight">
                  Introductory ₹500 first month offer
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-left space-y-1">
                <div className="w-7 h-7 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <p className="text-xs font-bold text-[#171717]">Hospital Solutions</p>
                <p className="text-[10px] text-[#6B6B6B] leading-tight">
                  Custom institutional deployment
                </p>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="pt-3 border-t border-orange-100 flex items-center justify-center gap-2 text-[11px] text-[#6B6B6B]">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Row-Level Security • HIPAA Compliant Data Isolation</span>
            </div>
          </motion.div>

          <p className="text-center text-xs text-[#6B6B6B]">
            Already have an active account?{' '}
            <Link to="/login" className="text-[#FF6A00] font-bold hover:underline">
              Sign In directly
            </Link>
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
