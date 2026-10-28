import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  Building,
  MapPin,
  FileText,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService, AccountType } from '../../services/onboardingService';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

export default function Step2OrganizationDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('individual_doctor');
  const [userEmail, setUserEmail] = useState('');

  // Doctor Fields
  const [doctorForm, setDoctorForm] = useState({
    title: 'Dr.',
    doctorName: '',
    registrationNumber: '',
    specialization: 'General Medicine',
    practiceName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    contactPhone: '',
  });

  // Clinic Fields
  const [clinicForm, setClinicForm] = useState({
    clinicName: '',
    registrationNumber: '',
    authorizedAdmin: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    contactPhone: '',
    contactEmail: '',
  });

  // Hospital Fields
  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: '',
    registrationNumber: '',
    authorizedAdmin: '',
    adminRole: 'Medical Superintendent',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    contactPhone: '',
    officialEmail: '',
    doctorCount: '10-25',
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

        const status = await onboardingService.getStatus();
        const type = status.account_type || 'individual_doctor';
        setAccountType(type);

        const basic = status.step_data?.basic || {};
        const org = status.step_data?.org || {};

        setDoctorForm({
          title: org.doctor_title || 'Dr.',
          doctorName: org.doctor_name || basic.full_name || user.user_metadata?.full_name || '',
          registrationNumber: org.registration_number || '',
          specialization: org.specialization || 'General Medicine',
          practiceName: org.practice_name || (basic.full_name ? `${basic.full_name}'s Clinic` : ''),
          address: org.address || '',
          city: org.city || '',
          state: org.state || '',
          postalCode: org.postal_code || '',
          country: org.country || 'India',
          contactPhone: org.contact_phone || basic.phone || '',
        });

        setClinicForm({
          clinicName: org.clinic_name || org.name || '',
          registrationNumber: org.registration_number || '',
          authorizedAdmin: org.authorized_admin || basic.full_name || '',
          address: org.address || '',
          city: org.city || '',
          state: org.state || '',
          postalCode: org.postal_code || '',
          contactPhone: org.contact_phone || basic.phone || '',
          contactEmail: org.contact_email || user.email || '',
        });

        setHospitalForm({
          hospitalName: org.hospital_name || org.name || '',
          registrationNumber: org.registration_number || '',
          authorizedAdmin: org.authorized_admin || basic.full_name || '',
          adminRole: org.admin_role || 'Medical Superintendent',
          address: org.address || '',
          city: org.city || '',
          state: org.state || '',
          postalCode: org.postal_code || '',
          contactPhone: org.contact_phone || basic.phone || '',
          officialEmail: org.official_email || user.email || '',
          doctorCount: org.doctor_count || '10-25',
        });
      } catch (err: any) {
        console.warn('Error loading organization step:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let orgData: any = {};

    if (accountType === 'individual_doctor') {
      if (!doctorForm.practiceName.trim()) {
        setError('Please enter your practice or clinic name.');
        return;
      }
      if (!doctorForm.address.trim() || !doctorForm.city.trim() || !doctorForm.state.trim()) {
        setError('Please fill in your practice location address, city, and state.');
        return;
      }
      orgData = {
        name: doctorForm.practiceName.trim(),
        practice_name: doctorForm.practiceName.trim(),
        doctor_title: doctorForm.title,
        doctor_name: doctorForm.doctorName.trim(),
        registration_number: doctorForm.registrationNumber.trim() || 'REG-PENDING',
        specialization: doctorForm.specialization.trim(),
        address: doctorForm.address.trim(),
        city: doctorForm.city.trim(),
        state: doctorForm.state.trim(),
        postal_code: doctorForm.postalCode.trim(),
        country: doctorForm.country.trim(),
        contact_phone: doctorForm.contactPhone.trim(),
      };
    } else if (accountType === 'clinic') {
      if (!clinicForm.clinicName.trim()) {
        setError('Please enter your clinic name.');
        return;
      }
      if (!clinicForm.address.trim() || !clinicForm.city.trim() || !clinicForm.state.trim()) {
        setError('Please fill in your clinic address, city, and state.');
        return;
      }
      orgData = {
        name: clinicForm.clinicName.trim(),
        clinic_name: clinicForm.clinicName.trim(),
        registration_number: clinicForm.registrationNumber.trim() || 'CLINIC-REG-PENDING',
        authorized_admin: clinicForm.authorizedAdmin.trim(),
        address: clinicForm.address.trim(),
        city: clinicForm.city.trim(),
        state: clinicForm.state.trim(),
        postal_code: clinicForm.postalCode.trim(),
        contact_phone: clinicForm.contactPhone.trim(),
        contact_email: clinicForm.contactEmail.trim(),
      };
    } else {
      if (!hospitalForm.hospitalName.trim()) {
        setError('Please enter the official hospital name.');
        return;
      }
      if (!hospitalForm.address.trim() || !hospitalForm.city.trim() || !hospitalForm.state.trim()) {
        setError('Please fill in the hospital address, city, and state.');
        return;
      }
      orgData = {
        name: hospitalForm.hospitalName.trim(),
        hospital_name: hospitalForm.hospitalName.trim(),
        registration_number: hospitalForm.registrationNumber.trim() || 'HOSP-REG-PENDING',
        authorized_admin: hospitalForm.authorizedAdmin.trim(),
        admin_role: hospitalForm.adminRole.trim(),
        address: hospitalForm.address.trim(),
        city: hospitalForm.city.trim(),
        state: hospitalForm.state.trim(),
        postal_code: hospitalForm.postalCode.trim(),
        contact_phone: hospitalForm.contactPhone.trim(),
        official_email: hospitalForm.officialEmail.trim(),
        doctor_count: hospitalForm.doctorCount,
      };
    }

    setSubmitting(true);
    try {
      await onboardingService.saveStep('organization', accountType, { org: orgData });
      navigate('/onboarding/availability');
    } catch (err: any) {
      setError(err.message || 'Failed to save practice details. Please try again.');
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

  const stepTitle =
    accountType === 'hospital'
      ? 'Hospital Facility Details'
      : accountType === 'clinic'
      ? 'Clinic & Practice Information'
      : 'Doctor Practice Details';

  const stepSubtitle =
    accountType === 'hospital'
      ? 'Provide official institution records, facility location, and administration contacts.'
      : accountType === 'clinic'
      ? 'Provide clinical establishment information and operational location.'
      : 'Configure your private practice name, medical council registration, and clinic address.';

  return (
    <OnboardingLayout
      currentStepIndex={2}
      title={stepTitle}
      subtitle={stepSubtitle}
      userEmail={userEmail}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. INDIVIDUAL DOCTOR FORM */}
        {accountType === 'individual_doctor' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Practice Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Clinic / Practice Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={doctorForm.practiceName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, practiceName: e.target.value })}
                    placeholder="e.g. LifeCare Clinic & Consultation Center"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Specialization */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Medical Specialization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Stethoscope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    placeholder="e.g. General Medicine, Pediatrics, Orthopedics"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Medical Registration Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  State / National Medical Council Reg. No.
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={doctorForm.registrationNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, registrationNumber: e.target.value })}
                    placeholder="e.g. MCI-2018-98432"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Practice Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Practice Address / Consultation Room <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <textarea
                    rows={2}
                    required
                    value={doctorForm.address}
                    onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })}
                    placeholder="Suite 204, MedTech Tower, Main Market Road"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900 resize-none"
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={doctorForm.city}
                  onChange={(e) => setDoctorForm({ ...doctorForm, city: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={doctorForm.state}
                  onChange={(e) => setDoctorForm({ ...doctorForm, state: e.target.value })}
                  placeholder="e.g. Karnataka"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Postal / PIN Code
                </label>
                <input
                  type="text"
                  value={doctorForm.postalCode}
                  onChange={(e) => setDoctorForm({ ...doctorForm, postalCode: e.target.value })}
                  placeholder="e.g. 560001"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={doctorForm.country}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. CLINIC FORM */}
        {accountType === 'clinic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Clinic / Center Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={clinicForm.clinicName}
                    onChange={(e) => setClinicForm({ ...clinicForm, clinicName: e.target.value })}
                    placeholder="e.g. Apex Multispecialty Polyclinic"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Authorized Owner / Administrator <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clinicForm.authorizedAdmin}
                  onChange={(e) => setClinicForm({ ...clinicForm, authorizedAdmin: e.target.value })}
                  placeholder="e.g. Dr. A. K. Verma"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Clinical Establishment Reg. No.
                </label>
                <input
                  type="text"
                  value={clinicForm.registrationNumber}
                  onChange={(e) => setClinicForm({ ...clinicForm, registrationNumber: e.target.value })}
                  placeholder="e.g. CEA-2023-4412"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Clinic Full Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={clinicForm.address}
                  onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                  placeholder="Building 14, Commercial Complex, Sector 4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clinicForm.city}
                  onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                  placeholder="e.g. Pune"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clinicForm.state}
                  onChange={(e) => setClinicForm({ ...clinicForm, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. HOSPITAL FORM */}
        {accountType === 'hospital' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hospital Institution Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={hospitalForm.hospitalName}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, hospitalName: e.target.value })}
                    placeholder="e.g. City General Superspecialty Hospital"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Authorized Administrator Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hospitalForm.authorizedAdmin}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, authorizedAdmin: e.target.value })}
                  placeholder="Dr. S. K. Nair"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hospital Registration / NABH Accreditation
                </label>
                <input
                  type="text"
                  value={hospitalForm.registrationNumber}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, registrationNumber: e.target.value })}
                  placeholder="e.g. NABH-2024-889"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hospital Campus Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={hospitalForm.address}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  placeholder="Plot 10, Medical District Road, Opp. Central Park"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hospitalForm.city}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                  placeholder="e.g. Hyderabad"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hospitalForm.state}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                  placeholder="e.g. Telangana"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6A00] font-medium text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding/basic-details')}
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
