import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  LogOut,
  User,
  Building2,
  Calendar,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface OnboardingLayoutProps {
  currentStepIndex: number; // 1 to 5
  title: string;
  subtitle: string;
  userEmail?: string;
  children: React.ReactNode;
}

const STEPS = [
  { index: 1, label: 'Basic Details', path: '/onboarding/basic-details', icon: User },
  { index: 2, label: 'Hospital / Clinic', path: '/onboarding/organization', icon: Building2 },
  { index: 3, label: 'Availability', path: '/onboarding/availability', icon: Calendar },
  { index: 4, label: 'Consultation Fees', path: '/onboarding/consultation-fees', icon: CreditCard },
  { index: 5, label: 'Review & Activate', path: '/onboarding/review', icon: FileCheck },
];

export default function OnboardingLayout({
  currentStepIndex,
  title,
  subtitle,
  userEmail,
  children,
}: OnboardingLayoutProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col justify-between selection:bg-orange-200 selection:text-orange-950">
      {/* ================= DEDICATED ONBOARDING TOP BAR ================= */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 p-1 flex items-center justify-center shadow-xs">
              <img
                src="/assets/brand-icon.png"
                alt="MedTechFixaters"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                MedTechFixaters
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200/60">
                  Onboarding
                </span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">Healthcare Practitioner Workspace Setup</p>
            </div>
          </div>

          {/* User Badge & Sign Out */}
          <div className="flex items-center gap-3 sm:gap-4">
            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/70 text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[180px]">{userEmail}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Sign out and resume later"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= STEP PROGRESS WIZARD INDICATOR ================= */}
      <div className="bg-white border-b border-slate-200/70 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-center">
            {STEPS.map((step) => {
              const isPast = step.index < currentStepIndex;
              const isCurrent = step.index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.index} className="flex flex-col items-center text-center">
                  <div className="flex items-center w-full">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mx-auto transition-all ${
                        isPast
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-[#FF6A00] text-white ring-4 ring-orange-100 shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPast ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                    </div>
                  </div>
                  <span
                    className={`mt-2 text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-none ${
                      isCurrent
                        ? 'text-[#FF6A00] font-bold'
                        : isPast
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= MAIN ONBOARDING CONTENT CONTAINER ================= */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Step Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-bold text-orange-700 uppercase tracking-wider">
            Step {currentStepIndex} of 5
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm shadow-slate-200/40">
          {children}
        </div>
      </main>

      {/* ================= DEDICATED CLEAN FOOTER (NO MARKETING) ================= */}
      <footer className="py-6 px-4 text-center border-t border-slate-200 bg-white/60">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>Encrypted with 256-bit bank grade security. MedTechFixaters Healthcare Technologies.</span>
        </div>
      </footer>
    </div>
  );
}
