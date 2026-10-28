import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Calendar,
  CreditCard,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService, OnboardingState } from '../../services/onboardingService';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

export default function Step5Review() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const [reviewData, setReviewData] = useState<{
    basic: any;
    org: any;
    schedules: any[];
    fee: any;
    accountType: string;
  }>({
    basic: {},
    org: {},
    schedules: [],
    fee: {},
    accountType: 'individual_doctor',
  });

  useEffect(() => {
    async function loadAll() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const status = await onboardingService.getStatus();
        const stepData = status.step_data || {};

        // Also fetch active schedules and fee from DB
        const [{ data: dbSchedules }, { data: dbFee }] = await Promise.all([
          supabase.from('doctor_schedules').select('*').eq('doctor_id', user.id),
          supabase.from('consultation_fees').select('*').eq('doctor_id', user.id).maybeSingle(),
        ]);

        const basic = stepData.basic || {
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          role: 'Consultant Doctor',
        };

        const org = stepData.org || {};

        setReviewData({
          basic,
          org,
          schedules: dbSchedules || stepData.schedules || [],
          fee: dbFee || stepData.fee || { amount_paise: 50000, consultation_type: 'both', duration_minutes: 15 },
          accountType: status.account_type || 'individual_doctor',
        });
      } catch (err: any) {
        console.warn('Error loading review:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError('You must accept the Terms of Service and Privacy Policy to activate your account.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await onboardingService.completeProfile();
      if (!res.success) {
        throw new Error(res.error || 'Failed to complete profile.');
      }

      // Route to Step 6 Platform Activation Checkout
      navigate('/onboarding/payment');
    } catch (err: any) {
      setError(err.message || 'Error completing profile.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  const enabledDays = reviewData.schedules.filter((s) => s.is_enabled !== false);
  const feeAmount = reviewData.fee.amount_paise
    ? reviewData.fee.amount_paise / 100
    : reviewData.fee.amount_inr || 500;

  return (
    <OnboardingLayout
      currentStepIndex={5}
      title="Complete Profile & Review"
      subtitle="Review all entered details before proceeding to your platform activation."
      userEmail={reviewData.basic?.email}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Basic Details Review Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#FF6A00]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Basic Practitioner Profile
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding/basic-details')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Full Name</span>
              <span className="font-bold text-slate-800 text-sm">{reviewData.basic.full_name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Registered Email</span>
              <span className="font-bold text-slate-800 text-sm truncate block">{reviewData.basic.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Contact Phone</span>
              <span className="font-bold text-slate-800 text-sm">{reviewData.basic.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Account Category</span>
              <span className="font-bold text-slate-800 text-sm capitalize">
                {reviewData.accountType.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Designation / Role</span>
              <span className="font-bold text-slate-800 text-sm">{reviewData.basic.role || '—'}</span>
            </div>
          </div>
        </div>

        {/* 2. Organization / Practice Review Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#FF6A00]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Hospital / Clinic Location
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding/organization')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-medium">Practice / Facility Name</span>
              <span className="font-bold text-slate-800 text-sm">{reviewData.org.name || reviewData.org.practice_name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Registration Number</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{reviewData.org.registration_number || 'REG-PENDING'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-medium">Address</span>
              <span className="font-medium text-slate-800 text-xs">{reviewData.org.address || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">City & State</span>
              <span className="font-bold text-slate-800 text-sm">
                {reviewData.org.city ? `${reviewData.org.city}, ${reviewData.org.state}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Availability Schedule & Consultation Fees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Schedule */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#FF6A00]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  3. Weekly Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/onboarding/availability')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            </div>
            <div className="text-xs space-y-1.5">
              <span className="text-slate-500 font-medium block">
                Active Days: <strong>{enabledDays.length} days/week</strong>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {enabledDays.map((d: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold"
                  >
                    {d.day_of_week} ({d.start_time?.slice(0, 5) || '09:00'}–{d.end_time?.slice(0, 5) || '17:00'})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#FF6A00]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  4. Patient Fees
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/onboarding/consultation-fees')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Consultation Fee</span>
                <span className="font-bold text-emerald-600 text-base">₹{feeAmount}.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Consultation Mode</span>
                <span className="font-semibold text-slate-800 uppercase text-[11px]">
                  {reviewData.fee.consultation_type || 'both'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Slot Duration</span>
                <span className="font-semibold text-slate-800">
                  {reviewData.fee.duration_minutes || 15} minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Consent Checkbox */}
        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 flex items-start gap-3 text-xs text-slate-700">
          <input
            type="checkbox"
            id="termsConsent"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00] cursor-pointer"
          />
          <label htmlFor="termsConsent" className="leading-relaxed cursor-pointer">
            I confirm that the above clinical information is accurate. I agree to the{' '}
            <a href="/terms" target="_blank" className="font-bold text-[#FF6A00] underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="font-bold text-[#FF6A00] underline">
              Privacy Policy
            </a>
            . I understand that full clinical workspace features will unlock upon payment verification.
          </label>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding/consultation-fees')}
            className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Previous Step</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Confirming Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Profile & Proceed to Activation</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
