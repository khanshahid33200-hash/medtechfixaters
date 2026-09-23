import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Camera,
  Lock,
  Stethoscope,
  Building2,
  Clock3,
  Sparkles,
  RefreshCw,
  QrCode,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSEO } from "../hooks/useSEO";

const steps = [
  {
    id: 1,
    title: "Doctor Information",
    subtitle: "Your professional details",
  },
  {
    id: 2,
    title: "Clinic Details",
    subtitle: "Your clinic information",
  },
  {
    id: 3,
    title: "Practice Setup",
    subtitle: "Availability, fees and preferences",
  },
  {
    id: 4,
    title: "Review & Activate",
    subtitle: "Confirm details and complete setup",
  },
];

const pageVariants = {
  initial: {
    opacity: 0,
    y: 18,
    filter: "blur(8px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function DoctorOnboardingPage() {
  useSEO({
    title: "Doctor Onboarding & Practice Setup — MedTech Fixaters",
    description: "Complete your professional clinic setup and activate your patient booking portal.",
  });

  const navigate = useNavigate();
  const { refreshDoctorProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activatedResult, setActivatedResult] = useState<{
    qrToken?: string;
    bookingUrl?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Doctor Info
    doctorName: "",
    phone: "",
    email: "",
    qualification: "MBBS, MD",
    specialization: "General Medicine",
    registrationNumber: "",

    // Step 2: Clinic Details
    clinicName: "",
    clinicType: "General Practice",
    clinicPhone: "",
    clinicEmail: "",
    address: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",

    // Step 3: Practice Setup
    consultationFee: "500",
    slotDuration: "15",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    startHour: "09:00 AM",
    endHour: "05:00 PM",
  });

  // Pre-fill from Google Sign-In & Supabase Auth metadata
  useEffect(() => {
    async function loadAuthDoctor() {
      try {
        setInitialLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/doctor/login");
          return;
        }

        const email = user.email || "";
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "";
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        setUserEmail(email);
        setAvatarUrl(avatar);

        // Check if profile exists in database
        let { data: prof } = await supabase
          .from("profiles")
          .select("*, doctor_details(*), hospitals(*)")
          .eq("id", user.id)
          .maybeSingle();

        if (!prof) {
          // Initialize doctor profile record
          await supabase.rpc("doctor_self_signup", {
            p_email: email,
            p_full_name: fullName || "Doctor",
            p_auth_user_id: user.id,
          });

          const { data: refetched } = await supabase
            .from("profiles")
            .select("*, doctor_details(*), hospitals(*)")
            .eq("id", user.id)
            .maybeSingle();
          prof = refetched;
        }

        if (prof) {
          const doc = prof.doctor_details || {};
          const hosp = prof.hospitals || {};

          setFormData((prev) => ({
            ...prev,
            doctorName:
              prof.full_name ||
              fullName ||
              prev.doctorName ||
              "Dr. Specialist",
            email: email,
            phone: doc.clinic_phone || user.phone || prev.phone,
            qualification: doc.qualification || prev.qualification,
            specialization:
              prof.specialization || doc.specialization || prev.specialization,
            registrationNumber:
              prof.registration_number ||
              doc.registration_number ||
              prev.registrationNumber,
            clinicName:
              doc.clinic_name ||
              hosp.name ||
              (fullName ? `${fullName} Clinic` : "Care Clinic"),
            clinicPhone: doc.clinic_phone || prev.clinicPhone,
            clinicEmail: hosp.email || email,
            address: doc.clinic_address || hosp.address || prev.address,
            city: doc.city || hosp.city || prev.city,
            state: doc.state || hosp.state || prev.state,
            pincode: doc.pincode || hosp.pincode || prev.pincode,
            consultationFee: doc.consultation_fee
              ? String(doc.consultation_fee)
              : prev.consultationFee,
            slotDuration: doc.slot_duration
              ? String(doc.slot_duration)
              : prev.slotDuration,
            availableDays: Array.isArray(doc.available_days)
              ? doc.available_days
              : prev.availableDays,
          }));

          if (prof.onboarding_status === "ACTIVE") {
            const { data: qr } = await supabase
              .from("qr_codes")
              .select("token, booking_url")
              .eq("hospital_id", prof.hospital_id)
              .maybeSingle();
            if (qr) {
              setActivatedResult({
                qrToken: qr.token,
                bookingUrl: `${window.location.origin}${qr.booking_url || `/book/${qr.token}`}`,
              });
            }
          }
        }
      } catch (err) {
        console.warn("Doctor data load notice:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadAuthDoctor();
  }, [navigate]);

  const nextStep = () => {
    setError(null);

    // Validation per step
    if (step === 1) {
      if (!formData.doctorName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!formData.qualification.trim()) {
        setError("Please enter your medical qualification.");
        return;
      }
    } else if (step === 2) {
      if (!formData.clinicName.trim()) {
        setError("Please enter your clinic name.");
        return;
      }
      if (!formData.address.trim()) {
        setError("Please enter your clinic address.");
        return;
      }
      if (!formData.city.trim()) {
        setError("Please enter your city.");
        return;
      }
    } else if (step === 3) {
      if (!formData.consultationFee.trim()) {
        setError("Please enter your consultation fee.");
        return;
      }
    }

    if (step < 4) {
      setStep((prev) => prev + 1);
    } else if (step === 4) {
      handleCompleteActivation();
    }
  };

  const previousStep = () => {
    setError(null);
    if (step > 1) setStep((prev) => prev - 1);
  };

  // Complete Activation RPC
  const handleCompleteActivation = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication session expired.");

      // 1. Save complete doctor & clinic profile
      const { data: saveRes, error: saveErr } = await supabase.rpc(
        "doctor_complete_profile",
        {
          p_doctor_id: user.id,
          p_doctor_name: formData.doctorName.trim(),
          p_qualification: formData.qualification.trim(),
          p_specialization: formData.specialization.trim(),
          p_doctor_phone: formData.phone.trim() || formData.clinicPhone.trim(),
          p_registration_number: formData.registrationNumber.trim() || null,
          p_clinic_name: formData.clinicName.trim(),
          p_clinic_address: formData.address.trim(),
          p_city: formData.city.trim(),
          p_state: formData.state.trim(),
          p_pincode: formData.pincode.trim(),
          p_clinic_phone: formData.clinicPhone.trim() || formData.phone.trim(),
          p_consultation_fee: Number(formData.consultationFee) || 500,
          p_available_days: formData.availableDays,
          p_available_hours: {
            start: formData.startHour,
            end: formData.endHour,
          },
          p_slot_duration: Number(formData.slotDuration) || 15,
        }
      );

      if (saveErr) throw saveErr;
      if (!saveRes?.success) {
        throw new Error(saveRes?.error || "Failed to save profile.");
      }

      // 2. Activate subscription & generate unique QR portal
      const { data: actRes, error: actErr } = await supabase.rpc(
        "doctor_verify_and_activate_subscription",
        {
          p_doctor_id: user.id,
          p_plan_id: "doctor_monthly",
          p_amount: 999.0,
          p_payment_provider: "verified_onboarding",
          p_order_id: `ORD_${Date.now()}`,
          p_payment_id: `ACT_${Date.now()}`,
        }
      );

      if (actErr) throw actErr;
      if (!actRes?.success) {
        throw new Error(actRes?.error || "Failed to activate practice.");
      }

      const generatedToken = actRes.qr_token || "QR-PORTAL";
      const generatedUrl = `${window.location.origin}/book/${generatedToken}`;

      setActivatedResult({
        qrToken: generatedToken,
        bookingUrl: generatedUrl,
      });

      if (refreshDoctorProfile) {
        await refreshDoctorProfile();
      }
    } catch (err: any) {
      console.error("Doctor onboarding activation error:", err);
      setError(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "DR";
    const parts = name.replace(/^Dr\.\s*/i, "").trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.availableDays.includes(day);
      if (exists) {
        return {
          ...prev,
          availableDays: prev.availableDays.filter((d) => d !== day),
        };
      } else {
        return {
          ...prev,
          availableDays: [...prev.availableDays, day],
        };
      }
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] flex items-center justify-center text-[#1677FF] animate-spin mb-3">
          <RefreshCw size={20} />
        </div>
        <p className="text-xs font-semibold text-gray-500">
          Loading your Google profile...
        </p>
      </div>
    );
  }

  // SUCCESS ACTIVATED VIEW
  if (activatedResult) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] text-[#111827] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl w-full bg-white rounded-[32px] border border-black/[0.06] shadow-[0_20px_70px_rgba(0,0,0,0.08)] p-8 sm:p-10 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Practice Activated
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-2">
              Welcome, {formData.doctorName}!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Your clinic <strong>{formData.clinicName}</strong> is live and ready to accept appointments.
            </p>
          </div>

          {/* QR & Booking Link Box */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={14} className="text-[#1677FF]" />
                Your Patient Booking Link
              </span>
              <span className="text-[11px] font-mono font-bold text-gray-500 bg-white px-2 py-0.5 rounded border">
                Token: {activatedResult.qrToken}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={activatedResult.bookingUrl}
                className="w-full text-xs font-mono bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (activatedResult.bookingUrl) {
                    navigator.clipboard.writeText(activatedResult.bookingUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }
                }}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedLink ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/doctor"
              className="flex-1 py-3.5 bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
            >
              <span>Go to Doctor Dashboard</span>
              <ChevronRight size={15} />
            </Link>

            <a
              href={activatedResult.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink size={14} />
              <span>Preview Patient Booking Page</span>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#111827]">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-[76px] border-b border-black/[0.06] bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF5FF] flex items-center justify-center shadow-xs">
            <Stethoscope
              size={20}
              strokeWidth={2}
              className="text-[#1677FF]"
            />
          </div>

          <div>
            <h1 className="font-semibold text-[18px] tracking-[-0.02em] leading-tight">
              MedTech Fixaters
            </h1>

            <p className="text-[11px] text-gray-500">
              Better Tools. Healthier Practices. Happier People.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/contact"
            className="text-xs font-medium text-gray-500 hover:text-gray-900 transition hidden sm:inline"
          >
            Need Help?
          </Link>

          <div className="h-7 w-px bg-black/10 hidden sm:block" />

          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={formData.doctorName}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#EEF5FF] text-[#1677FF] flex items-center justify-center text-xs font-bold">
                {getInitials(formData.doctorName)}
              </div>
            )}

            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-gray-900">
                {formData.doctorName || "Doctor"}
              </p>
              <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                {userEmail || "Google Account"}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MAIN */}
      <div className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-7">
          {/* LEFT SIDEBAR */}
          <motion.aside
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="hidden lg:flex flex-col"
          >
            <motion.div variants={fadeUp} className="mb-8">
              <p className="text-xs uppercase tracking-[0.16em] text-[#1677FF] font-semibold mb-2">
                Welcome to
              </p>

              <h2 className="text-2xl font-semibold tracking-tight">
                MedTech Fixaters
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-6">
                Let&apos;s set up your clinic and get you
                started in a few simple steps.
              </p>
            </motion.div>

            {/* STEPS */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-5 bottom-5 w-px bg-gray-200" />

              {steps.map((item) => {
                const active = step === item.id;
                const completed = step > item.id;

                return (
                  <motion.div
                    key={item.id}
                    variants={fadeUp}
                    className="relative flex gap-4 mb-7 cursor-pointer"
                    onClick={() => {
                      if (completed) setStep(item.id);
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: active ? 1.08 : 1,
                        backgroundColor:
                          active || completed
                            ? "#1677FF"
                            : "#E8EDF3",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                    >
                      {completed ? (
                        <Check size={16} className="text-white" />
                      ) : (
                        <span
                          className={`text-sm font-semibold ${
                            active
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {item.id}
                        </span>
                      )}
                    </motion.div>

                    <div className="pt-0.5 text-left">
                      <p
                        className={`text-sm font-semibold ${
                          active
                            ? "text-[#1677FF]"
                            : "text-gray-800"
                        }`}
                      >
                        {item.title}
                      </p>

                      <p className="text-xs text-gray-500 mt-1 leading-5">
                        {item.subtitle}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* BENEFITS CARD */}
            <motion.div
              variants={fadeUp}
              className="mt-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-4">
                <Sparkles
                  size={20}
                  className="text-[#1677FF]"
                />
              </div>

              <h3 className="font-semibold text-sm">
                You&apos;re one step away from
                a smarter practice.
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  "Online appointment booking",
                  "Live queue management",
                  "Patient history & follow-ups",
                  "All in one secure platform",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <Check
                      size={14}
                      className="text-emerald-500 shrink-0"
                    />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.aside>

          {/* FORM */}
          <motion.main
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
            className="bg-white rounded-[28px] border border-black/[0.06] shadow-[0_20px_70px_rgba(0,0,0,0.06)] overflow-hidden text-left"
          >
            <div className="p-6 sm:p-8 lg:p-10">
              {/* TOP */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-medium text-[#1677FF] mb-2">
                    Step {step} of 4
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.035em]">
                    {steps[step - 1].title}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {steps[step - 1].subtitle}
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 self-start"
                >
                  <Check
                    size={16}
                    className="text-emerald-600 shrink-0"
                  />

                  <div>
                    <p className="text-xs font-semibold text-emerald-800">
                      Signed in with Google
                    </p>

                    <p className="text-[11px] text-emerald-700">
                      Your basic information is pre-filled.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* PROGRESS */}
              <div className="mb-9">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#1677FF] rounded-full"
                    animate={{
                      width: `${(step / 4) * 100}%`,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* CONTENT */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.35 }}
                  >
                    <DoctorInformation
                      formData={formData}
                      setFormData={setFormData}
                      avatarUrl={avatarUrl}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.35 }}
                  >
                    <ClinicDetails
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.35 }}
                  >
                    <PracticeSetup
                      formData={formData}
                      setFormData={setFormData}
                      toggleDay={toggleDay}
                    />
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.35 }}
                  >
                    <Review formData={formData} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ACTIONS */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={previousStep}
                  disabled={step === 1 || loading}
                  className="h-12 px-5 rounded-xl text-sm font-medium flex items-center gap-2 transition disabled:opacity-30 hover:bg-gray-100"
                >
                  <ChevronLeft size={17} />
                  Back
                </button>

                <motion.button
                  whileHover={{
                    scale: 1.015,
                    boxShadow: "0 10px 30px rgba(22,119,255,.20)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={loading}
                  onClick={nextStep}
                  className="h-12 px-7 rounded-xl bg-[#1677FF] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Activating Practice...</span>
                    </>
                  ) : (
                    <>
                      <span>{step === 4 ? "Complete Setup & Activate" : "Save & Next"}</span>
                      <ChevronRight size={17} />
                    </>
                  )}
                </motion.button>
              </div>

              {/* SECURITY */}
              <div className="flex justify-center items-center gap-2 mt-5 text-[11px] text-gray-400">
                <Lock size={12} />
                Your information is securely encrypted & stored in PostgreSQL.
              </div>
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STEP 1: DOCTOR INFORMATION
===================================================== */

function DoctorInformation({
  formData,
  setFormData,
  avatarUrl,
}: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  avatarUrl: string | null;
}) {
  const getInitials = (name: string) => {
    if (!name) return "DR";
    const parts = name.replace(/^Dr\.\s*/i, "").trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about yourself and your professional medical details.
        </p>
      </motion.div>

      {/* PROFILE PHOTO */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-5 my-6"
      >
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={formData.doctorName}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-50 to-blue-100 flex items-center justify-center text-xl font-bold text-[#1677FF] border border-blue-200">
              {getInitials(formData.doctorName)}
            </div>
          )}

          <button
            type="button"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border shadow-sm flex items-center justify-center hover:scale-105 transition"
          >
            <Camera size={14} className="text-gray-600" />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-gray-500 mt-1">
            Imported from your Google account. This will be visible to your patients.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
        <Field
          label="Full Name"
          required
          value={formData.doctorName}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, doctorName: val }))}
          placeholder="e.g. Dr. Rahul Sharma"
        />

        <Field
          label="Phone Number"
          required
          value={formData.phone}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, phone: val }))}
          placeholder="+91 98765 43210"
        />

        <Field
          label="Email Address"
          required
          value={formData.email}
          locked
        />

        <Field
          label="Qualification"
          required
          value={formData.qualification}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, qualification: val }))}
          placeholder="e.g. MBBS, MD, BDS"
        />

        <SelectField
          label="Specialization"
          required
          value={formData.specialization}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, specialization: val }))}
          placeholder="Select Specialization"
          options={[
            "General Medicine",
            "Dentistry",
            "Dermatology",
            "Cardiology",
            "Ophthalmology",
            "Orthopedics",
            "Pediatrics",
            "Gynecology",
            "Psychiatry",
            "ENT Specialist",
            "Other",
          ]}
        />

        <Field
          label="Registration / License Number"
          value={formData.registrationNumber}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, registrationNumber: val }))}
          placeholder="e.g. MCI/123456"
        />
      </div>
    </motion.div>
  );
}

/* =====================================================
   STEP 2: CLINIC DETAILS
===================================================== */

function ClinicDetails({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      <motion.div variants={fadeUp} className="col-span-1 sm:col-span-2">
        <h3 className="text-lg font-semibold">Clinic Details</h3>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your clinic or private practice.
        </p>
      </motion.div>

      <Field
        label="Clinic Name"
        required
        value={formData.clinicName}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, clinicName: val }))}
        placeholder="e.g. Rahul Dental Clinic"
      />

      <SelectField
        label="Clinic Type"
        required
        value={formData.clinicType}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, clinicType: val }))}
        placeholder="Select clinic type"
        options={[
          "General Practice / OPD",
          "Dental Practice",
          "Skin & Dermatology Clinic",
          "Specialist Consultation Room",
          "Private Nursing Home",
        ]}
      />

      <Field
        label="Clinic Phone"
        value={formData.clinicPhone}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, clinicPhone: val }))}
        placeholder="+91 98765 43210"
      />

      <Field
        label="Clinic Email"
        value={formData.clinicEmail}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, clinicEmail: val }))}
        placeholder="clinic@example.com"
      />

      <Field
        label="Address"
        required
        className="col-span-1 sm:col-span-2"
        value={formData.address}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, address: val }))}
        placeholder="Clinic street address or building"
      />

      <Field
        label="City"
        required
        value={formData.city}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, city: val }))}
        placeholder="e.g. Mumbai"
      />

      <Field
        label="State"
        required
        value={formData.state}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, state: val }))}
        placeholder="e.g. Maharashtra"
      />

      <Field
        label="Pincode"
        required
        value={formData.pincode}
        onChange={(val) => setFormData((prev: any) => ({ ...prev, pincode: val }))}
        placeholder="400001"
      />
    </motion.div>
  );
}

/* =====================================================
   STEP 3: PRACTICE SETUP
===================================================== */

function PracticeSetup({
  formData,
  setFormData,
  toggleDay,
}: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  toggleDay: (day: string) => void;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-semibold">Practice Setup</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure how patients can book appointments with your clinic.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="Consultation Fee (₹)"
          required
          value={formData.consultationFee}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, consultationFee: val }))}
          placeholder="500"
        />

        <Field
          label="Consultation Duration (Minutes)"
          required
          value={formData.slotDuration}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, slotDuration: val }))}
          placeholder="15"
        />
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-black/[0.06] bg-gray-50 p-5 space-y-4"
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <Clock3 size={18} className="text-[#1677FF]" />
          </div>

          <div>
            <h4 className="text-sm font-semibold">Available Working Days</h4>
            <p className="text-xs text-gray-500 mt-1">
              Select the active days when patients can book appointments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-3">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
            const isSelected = formData.availableDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-[#1677FF] border-[#1677FF] text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Opening Time
            </label>
            <input
              type="text"
              value={formData.startHour}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, startHour: e.target.value }))}
              placeholder="09:00 AM"
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 outline-none focus:border-[#1677FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Closing Time
            </label>
            <input
              type="text"
              value={formData.endHour}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, endHour: e.target.value }))}
              placeholder="05:00 PM"
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 outline-none focus:border-[#1677FF]"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =====================================================
   STEP 4: REVIEW & ACTIVATE
===================================================== */

function Review({ formData }: { formData: any }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-semibold">Review & Activate</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review your information before activating your digital clinic.
        </p>
      </motion.div>

      {[
        {
          icon: Stethoscope,
          title: "Doctor Information",
          value: `${formData.doctorName} · ${formData.qualification} · ${formData.specialization}`,
        },
        {
          icon: Building2,
          title: "Clinic Practice",
          value: `${formData.clinicName} · ${formData.city}, ${formData.state}`,
        },
        {
          icon: Clock3,
          title: "Consultation & Fees",
          value: `₹${formData.consultationFee} consultation fee · ${formData.slotDuration} min duration · ${formData.availableDays.join(", ")}`,
        },
      ].map((item) => (
        <motion.div
          key={item.title}
          variants={fadeUp}
          className="flex items-center gap-4 p-5 rounded-2xl border border-black/[0.06] hover:border-[#1677FF]/30 hover:bg-blue-50/20 transition text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EEF5FF] flex items-center justify-center shrink-0">
            <item.icon size={19} className="text-[#1677FF]" />
          </div>

          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-gray-500 mt-1">{item.value}</p>
          </div>
        </motion.div>
      ))}

      <motion.div
        variants={fadeUp}
        className="rounded-2xl bg-[#EFF6FF] border border-blue-100 p-5 text-left"
      >
        <p className="text-sm font-semibold text-blue-900">
          Almost ready!
        </p>
        <p className="text-xs text-blue-700 mt-1 leading-5">
          After activation, your Doctor Dashboard, live queue manager, and unique single-doctor booking QR/link will be immediately generated and ready for patients.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* =====================================================
   FIELD COMPONENTS
===================================================== */

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  locked,
  className = "",
}: {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  locked?: boolean;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={locked}
          className={`
            w-full h-12 rounded-xl border
            border-gray-200 bg-white px-4
            text-sm outline-none
            transition-all duration-200
            placeholder:text-gray-300
            focus:border-[#1677FF]
            focus:ring-4 focus:ring-blue-500/10
            ${locked ? "bg-gray-50 text-gray-500 pr-10 cursor-not-allowed" : ""}
          `}
        />

        {locked && (
          <Lock
            size={15}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
      </div>
    </motion.div>
  );
}

function SelectField({
  label,
  required,
  value,
  onChange,
  placeholder,
  options = [],
}: {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (val: string) => void;
  placeholder: string;
  options?: string[];
}) {
  return (
    <motion.div variants={fadeUp}>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="
          w-full h-12 rounded-xl
          border border-gray-200
          bg-white px-4
          text-sm text-gray-700
          outline-none
          transition-all
          focus:border-[#1677FF]
          focus:ring-4
          focus:ring-blue-500/10
        "
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </motion.div>
  );
}
