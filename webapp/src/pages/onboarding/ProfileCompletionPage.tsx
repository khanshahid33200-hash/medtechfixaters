import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { subscriptionService, CustomerCategory } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';

export default function ProfileCompletionPage() {
  useSEO({
    title: 'Complete Profile Details | MedTechFixaters',
    description: 'Provide your practice or hospital details to configure your MedTechFixaters workspace.',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [loadingUser, setLoadingUser] = useState(true);
  const [category, setCategory] = useState<CustomerCategory>('solo_doctor_clinic');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo Doctor Form State
  const [soloData, setSoloData] = useState({
    fullName: '',
    professionalRole: 'Solo Doctor',
    clinicName: '',
    registrationNumber: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    consent: false,
  });

  // Hospital Form State
  const [hospitalData, setHospitalData] = useState({
    contactPerson: '',
    hospitalName: '',
    officialEmail: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    doctorCount: '10-25',
    facilityCount: '1-3',
    requiredServices: 'Digital Receptionist, Live OPD Queues, QR Kiosk, WhatsApp Prescriptions',
    consent: false,
  });

  useEffect(() => {
    async function loadInitial() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        setUserEmail(user.email || '');

        // Safely query profile without requesting unmigrated phone column from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_category, full_name')
          .eq('id', user.id)
          .maybeSingle();

        const cat = (location.state as any)?.category || profile?.customer_category || 'solo_doctor_clinic';
        setCategory(cat);

        const googleName = user.user_metadata?.full_name || profile?.full_name || '';
        const phone = (user.user_metadata?.phone as string) || user.phone || '';

        setSoloData((prev) => ({
          ...prev,
          fullName: googleName,
          phone,
        }));

        setHospitalData((prev) => ({
          ...prev,
          contactPerson: googleName,
          officialEmail: user.email || '',
          phone,
        }));
      } catch (err) {
        console.warn('Error loading user data:', err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadInitial();
  }, [navigate, location.state]);

  // Validation
  const validateSolo = () => {
    if (!soloData.fullName.trim()) return 'Please enter your full name.';
    if (!soloData.clinicName.trim()) return 'Please enter your clinic or practice name.';
    if (!soloData.phone.trim() || soloData.phone.trim().length < 10) return 'Please enter a valid 10-digit mobile number.';
    if (!soloData.address.trim()) return 'Please enter your clinic address.';
    if (!soloData.city.trim()) return 'Please enter your city.';
    if (!soloData.state.trim()) return 'Please enter your state.';
    if (!soloData.consent) return 'You must consent to the Terms of Service and Privacy Policy.';
    return null;
  };

  const validateHospital = () => {
    if (!hospitalData.contactPerson.trim()) return 'Please enter the contact person’s full name.';
    if (!hospitalData.hospitalName.trim()) return 'Please enter the official hospital name.';
    if (!hospitalData.officialEmail.trim() || !/^\S+@\S+\.\S+$/.test(hospitalData.officialEmail)) return 'Please enter a valid official email address.';
    if (!hospitalData.phone.trim() || hospitalData.phone.trim().length < 10) return 'Please enter a valid official contact phone number.';
    if (!hospitalData.address.trim()) return 'Please enter the hospital address.';
    if (!hospitalData.city.trim()) return 'Please enter the city.';
    if (!hospitalData.state.trim()) return 'Please enter the state.';
    if (!hospitalData.consent) return 'You must consent to the Terms of Service and Privacy Policy.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (category === 'solo_doctor_clinic') {
      const valErr = validateSolo();
      if (valErr) {
        setError(valErr);
        return;
      }

      setIsSubmitting(true);
      try {
        await subscriptionService.completeSoloDoctorProfile({
          ...soloData,
          email: userEmail,
        });

        // Step 4: Route Solo Doctor directly to ₹500 introductory payment
        navigate('/checkout/intro');
      } catch (err: any) {
        setError(err.message || 'Failed to complete profile. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      const valErr = validateHospital();
      if (valErr) {
        setError(valErr);
        return;
      }

      setIsSubmitting(true);
      try {
        await subscriptionService.completeHospitalProfile(hospitalData);

        // Step 4: Route Hospital to Inquiry Confirmation / Status Page
        navigate('/hospital/inquiry-status');
      } catch (err: any) {
        setError(err.message || 'Failed to submit hospital inquiry. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full pt-36 pb-20 px-4 sm:px-6">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold shadow-2xs">
            <span>Step 3: Complete Profile Details</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
            {category === 'solo_doctor_clinic' ? 'Doctor & Practice Information' : 'Hospital Institutional Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium max-w-xl mx-auto">
            {category === 'solo_doctor_clinic'
              ? 'Complete your profile to proceed to the ₹500 first-month introductory subscription.'
              : 'Submit your requirements for institutional review and tailored enterprise pricing.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-orange-100/90 rounded-[28px] p-6 sm:p-10 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Solo Doctor Form */}
            {category === 'solo_doctor_clinic' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Doctor / Full Name *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Dr. Rajesh Sharma"
                        value={soloData.fullName}
                        onChange={(e) => setSoloData({ ...soloData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Professional Role *
                    </label>
                    <select
                      value={soloData.professionalRole}
                      onChange={(e) => setSoloData({ ...soloData, professionalRole: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    >
                      <option value="Solo Doctor">Solo Doctor (Consultant)</option>
                      <option value="Clinic Owner">Clinic Owner / Polyclinic Lead</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Clinic / Practice Name *
                    </label>
                    <div className="relative">
                      <Stethoscope size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Apex Heart & Chest Clinic"
                        value={soloData.clinicName}
                        onChange={(e) => setSoloData({ ...soloData, clinicName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Medical Registration Number (Optional)
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. MCI-2018-99410"
                        value={soloData.registrationNumber}
                        onChange={(e) => setSoloData({ ...soloData, registrationNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={soloData.phone}
                        onChange={(e) => setSoloData({ ...soloData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Google Account Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        disabled
                        value={userEmail}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinic Address *
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Shop 4, Ground Floor, Sunrise Plaza, MG Road"
                      value={soloData.address}
                      onChange={(e) => setSoloData({ ...soloData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune, Jaipur, Indore"
                      value={soloData.city}
                      onChange={(e) => setSoloData({ ...soloData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra, Rajasthan"
                      value={soloData.state}
                      onChange={(e) => setSoloData({ ...soloData, state: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                {/* Terms Consent */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soloData.consent}
                      onChange={(e) => setSoloData({ ...soloData, consent: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed font-medium">
                      I agree to the MedTechFixaters{' '}
                      <Link to="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">
                        Terms of Service
                      </Link>
                      ,{' '}
                      <Link to="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">
                        Privacy Policy
                      </Link>
                      , and understand the first-month ₹500 promotional terms (recurring ₹5,000/mo from month two).
                    </span>
                  </label>
                </div>
              </>
            ) : (
              /* Hospital Form */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Contact Person's Full Name *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Dr. Anand Deshmukh, Medical Director"
                        value={hospitalData.contactPerson}
                        onChange={(e) => setHospitalData({ ...hospitalData, contactPerson: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Hospital Name *
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="City Multi-Specialty Hospital"
                        value={hospitalData.hospitalName}
                        onChange={(e) => setHospitalData({ ...hospitalData, hospitalName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="admin@cityhospital.org"
                        value={hospitalData.officialEmail}
                        onChange={(e) => setHospitalData({ ...hospitalData, officialEmail: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Direct Phone Number *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={hospitalData.phone}
                        onChange={(e) => setHospitalData({ ...hospitalData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hospital Address *
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Hospital Campus, Sector 12, Medical Enclave"
                      value={hospitalData.address}
                      onChange={(e) => setHospitalData({ ...hospitalData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bengaluru, Hyderabad"
                      value={hospitalData.city}
                      onChange={(e) => setHospitalData({ ...hospitalData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karnataka, Telangana"
                      value={hospitalData.state}
                      onChange={(e) => setHospitalData({ ...hospitalData, state: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Number of Doctors (Optional)
                    </label>
                    <select
                      value={hospitalData.doctorCount}
                      onChange={(e) => setHospitalData({ ...hospitalData, doctorCount: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    >
                      <option value="5-10">5 - 10 Doctors</option>
                      <option value="10-25">10 - 25 Doctors</option>
                      <option value="25-50">25 - 50 Doctors</option>
                      <option value="50+">50+ Doctors (Multi-Hospital Chain)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Number of Facilities / Branches (Optional)
                    </label>
                    <select
                      value={hospitalData.facilityCount}
                      onChange={(e) => setHospitalData({ ...hospitalData, facilityCount: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                    >
                      <option value="1">1 Facility (Main Hospital)</option>
                      <option value="2-4">2 - 4 Facilities / OPD Centers</option>
                      <option value="5+">5+ Facilities (Regional Chain)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Required Services / Deployment Needs (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Multi-counter reception, Voice callouts, TV queue board, Custom HIS sync"
                    value={hospitalData.requiredServices}
                    onChange={(e) => setHospitalData({ ...hospitalData, requiredServices: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
                  />
                </div>

                {/* Terms Consent */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hospitalData.consent}
                      onChange={(e) => setHospitalData({ ...hospitalData, consent: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed font-medium">
                      I agree to the MedTechFixaters{' '}
                      <Link to="/terms" target="_blank" className="text-teal-600 font-bold hover:underline">
                        Terms of Service
                      </Link>
                      ,{' '}
                      <Link to="/privacy" target="_blank" className="text-teal-600 font-bold hover:underline">
                        Privacy Policy
                      </Link>
                      , and request commercial review for tailored hospital pricing.
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                  category === 'solo_doctor_clinic'
                    ? PRIMARY_BUTTON
                    : 'bg-stone-900 hover:bg-black shadow-lg shadow-stone-900/20'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {category === 'solo_doctor_clinic'
                        ? 'Proceed to Checkout (₹500 for First Month)'
                        : 'Submit Hospital Requirements'}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      <PublicFooter />
    </div>
  );
}
