import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  Video,
  UserCheck,
  Globe,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService, ConsultationFeeData } from '../../services/onboardingService';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

export default function Step4ConsultationFees() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const [feeData, setFeeData] = useState<ConsultationFeeData>({
    consultation_type: 'both',
    amount_inr: 500,
    duration_minutes: 15,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        setUserEmail(user.email || '');

        // Fetch existing fee from consultation_fees table
        const { data: dbFee } = await supabase
          .from('consultation_fees')
          .select('*')
          .eq('doctor_id', user.id)
          .maybeSingle();

        if (dbFee) {
          setFeeData({
            consultation_type: dbFee.consultation_type || 'both',
            amount_inr: dbFee.amount_paise ? dbFee.amount_paise / 100 : 500,
            duration_minutes: dbFee.duration_minutes || 15,
          });
        }
      } catch (err) {
        console.warn('Error loading fees:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (feeData.amount_inr < 0 || isNaN(feeData.amount_inr)) {
      setError('Please specify a valid consultation fee amount (minimum ₹0 for free clinics).');
      return;
    }

    if (feeData.duration_minutes <= 0) {
      setError('Please select a valid consultation slot duration.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save fee to Supabase consultation_fees table
      await onboardingService.saveConsultationFees(feeData);

      // 2. Save step progress
      const status = await onboardingService.getStatus();
      await onboardingService.saveStep('consultation_fees', status.account_type || 'individual_doctor', {
        fee: feeData,
      });

      navigate('/onboarding/review');
    } catch (err: any) {
      setError(err.message || 'Failed to save consultation fees.');
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

  return (
    <OnboardingLayout
      currentStepIndex={4}
      title="Consultation Fee"
      subtitle="Define patient appointment fees and standard consultation duration."
      userEmail={userEmail}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Clear Notice differentiating Patient Fee vs Platform Fee */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900 leading-relaxed shadow-2xs">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Patient Consultation Fee Notice</p>
            <p className="text-blue-700 mt-0.5">
              This is the consultation fee charged to your patients when they book appointments with you.
              It is <strong>separate and independent</strong> from the MedTechFixaters platform activation fee.
            </p>
          </div>
        </div>

        {/* Consultation Type Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Offered Consultation Mode <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setFeeData({ ...feeData, consultation_type: 'in_person' })}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                feeData.consultation_type === 'in_person'
                  ? 'border-[#FF6A00] bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${feeData.consultation_type === 'in_person' ? 'bg-[#FF6A00] text-white' : 'bg-slate-100'}`}>
                <UserCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">In-Person Only</p>
                <p className="text-[11px] text-slate-500">Walk-in and clinic desk</p>
              </div>
            </div>

            <div
              onClick={() => setFeeData({ ...feeData, consultation_type: 'online' })}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                feeData.consultation_type === 'online'
                  ? 'border-[#FF6A00] bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${feeData.consultation_type === 'online' ? 'bg-[#FF6A00] text-white' : 'bg-slate-100'}`}>
                <Video size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Online Only</p>
                <p className="text-[11px] text-slate-500">Video & tele-consult</p>
              </div>
            </div>

            <div
              onClick={() => setFeeData({ ...feeData, consultation_type: 'both' })}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                feeData.consultation_type === 'both'
                  ? 'border-[#FF6A00] bg-orange-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${feeData.consultation_type === 'both' ? 'bg-[#FF6A00] text-white' : 'bg-slate-100'}`}>
                <Globe size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Both (Hybrid)</p>
                <p className="text-[11px] text-slate-500">Physical & virtual</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Amount & Slot Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Fee Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Standard Consultation Fee (INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-base">
                ₹
              </span>
              <input
                type="number"
                min={0}
                max={50000}
                required
                value={feeData.amount_inr}
                onChange={(e) => setFeeData({ ...feeData, amount_inr: Number(e.target.value) })}
                placeholder="500"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 font-bold text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500">Enter 0 if consultations are complimentary.</p>
          </div>

          {/* Consultation Duration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Consultation Slot Duration <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={feeData.duration_minutes}
                onChange={(e) => setFeeData({ ...feeData, duration_minutes: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900 bg-white"
              >
                <option value={10}>10 Minutes per patient</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={20}>20 Minutes per patient</option>
                <option value={30}>30 Minutes per patient</option>
                <option value={45}>45 Minutes per patient</option>
                <option value={60}>60 Minutes per patient</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">Determines live OPD token slot distribution.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding/availability')}
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
                <span>Saving Fees...</span>
              </>
            ) : (
              <>
                <span>Save and Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
