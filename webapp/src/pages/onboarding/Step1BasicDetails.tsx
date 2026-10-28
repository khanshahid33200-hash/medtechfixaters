import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Building2,
  Building,
  ArrowRight,
  Loader2,
  AlertCircle,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService, AccountType } from '../../services/onboardingService';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

export default function Step1BasicDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    accountType: 'individual_doctor' as AccountType,
    role: 'Consultant Doctor',
    profilePhotoUrl: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const email = user.email || '';
        const googleName = user.user_metadata?.full_name || '';
        const googlePhone = (user.user_metadata?.phone as string) || user.phone || '';
        const avatarUrl = user.user_metadata?.avatar_url || '';

        // Check if existing onboarding record exists
        const status = await onboardingService.getStatus();
        const savedData = status.step_data?.basic || {};

        setFormData({
          fullName: savedData.full_name || googleName,
          email: email,
          phone: savedData.phone || googlePhone,
          countryCode: savedData.country_code || '+91',
          accountType: (status.account_type || savedData.account_type || 'individual_doctor') as AccountType,
          role: savedData.role || 'Consultant Doctor',
          profilePhotoUrl: savedData.profile_photo_url || avatarUrl,
        });
      } catch (err: any) {
        console.warn('Load user info error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const stepData = {
        basic: {
          full_name: formData.fullName.trim(),
          email: formData.email,
          phone: `${formData.countryCode} ${cleanPhone.slice(-10)}`,
          country_code: formData.countryCode,
          account_type: formData.accountType,
          role: formData.role.trim(),
          profile_photo_url: formData.profilePhotoUrl,
        },
      };

      await onboardingService.saveStep('basic_details', formData.accountType, stepData);
      navigate('/onboarding/organization');
    } catch (err: any) {
      setError(err.message || 'Unable to save basic details. Please try again.');
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
      currentStepIndex={1}
      title="Basic Details"
      subtitle="Verify your identity and select your healthcare practice category."
      userEmail={formData.email}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Type Selector Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Your Account Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Individual Doctor */}
            <div
              onClick={() => setFormData({ ...formData, accountType: 'individual_doctor', role: 'Consultant Doctor' })}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.accountType === 'individual_doctor'
                  ? 'border-[#FF6A00] bg-orange-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.accountType === 'individual_doctor' ? 'bg-[#FF6A00] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Stethoscope size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Solo Doctor</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Independent practitioner or private consulting room.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-orange-700">
                <span>₹500 Intro Offer</span>
                {formData.accountType === 'individual_doctor' && <CheckCircle2 size={16} className="text-[#FF6A00]" />}
              </div>
            </div>

            {/* 2. Clinic */}
            <div
              onClick={() => setFormData({ ...formData, accountType: 'clinic', role: 'Clinic Owner / Medical Director' })}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.accountType === 'clinic'
                  ? 'border-[#FF6A00] bg-orange-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.accountType === 'clinic' ? 'bg-[#FF6A00] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Building2 size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Clinic / Polyclinic</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Multi-specialty center or polyclinic with team access.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-orange-700">
                <span>₹500 Intro Offer</span>
                {formData.accountType === 'clinic' && <CheckCircle2 size={16} className="text-[#FF6A00]" />}
              </div>
            </div>

            {/* 3. Hospital */}
            <div
              onClick={() => setFormData({ ...formData, accountType: 'hospital', role: 'Hospital Administrator' })}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.accountType === 'hospital'
                  ? 'border-[#FF6A00] bg-orange-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.accountType === 'hospital' ? 'bg-[#FF6A00] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Building size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Facility</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enterprise hospital with multiple departments & OPD queues.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>Enterprise Suite</span>
                {formData.accountType === 'hospital' && <CheckCircle2 size={16} className="text-[#FF6A00]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Dr. Rajesh Sharma"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Email (Read Only from Google) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Verified Email Address</span>
              <span className="text-[10px] text-emerald-600 font-semibold lowercase">Google Verified</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                readOnly
                disabled
                value={formData.email}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Mobile Number with Country Code */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mobile Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="w-24 px-2 py-3 rounded-xl border border-slate-200 text-sm font-medium bg-white text-slate-900 focus:outline-none focus:border-[#FF6A00]"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+971">+971 (UAE)</option>
              </select>
              <div className="relative flex-1">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="98765 43210"
                  maxLength={15}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Professional Role / Designation */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Professional Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder={formData.accountType === 'hospital' ? 'Chief Medical Officer / Administrator' : 'Consultant Physician'}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Profile Photo (Optional) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              {formData.profilePhotoUrl ? (
                <img src={formData.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Profile Photograph (Optional)</p>
              <p className="text-[11px] text-slate-500">Imported from your Google account or provide an image link.</p>
            </div>
          </div>
          <input
            type="url"
            value={formData.profilePhotoUrl}
            onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
            placeholder="Image URL https://..."
            className="hidden sm:block w-56 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Details...</span>
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
