import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  UserCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Clock,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";
import { HospitalWorkspace, DoctorItem } from "../../types/booking";

interface BookingHomeProps {
  hospital: HospitalWorkspace | null;
  doctors: DoctorItem[];
  onSelectAI: () => void;
  onSelectManual: () => void;
  onTrackStatus: () => void;
}

export const BookingHome: React.FC<BookingHomeProps> = ({
  hospital,
  doctors,
  onSelectAI,
  onSelectManual,
  onTrackStatus,
}) => {
  const isInd = Boolean(hospital?.is_individual_doctor);
  const singleDoc = hospital?.doctor || doctors[0];
  const doctorName = singleDoc?.name || hospital?.name || "Doctor Specialist";
  const clinicName = hospital?.clinic?.name || hospital?.name || "Doctor's Clinic";
  const specialty = singleDoc?.specialization || singleDoc?.specialty || singleDoc?.department || "Consultation";

  const activeDoctorsCount = doctors.filter(
    (d) => d.active && d.accepting_appointments
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 w-full"
    >
      {/* Title & Subtitle */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
          {isInd ? "Book Your Consultation" : "Book Your Appointment"}
        </h2>
        <p className="text-sm sm:text-base text-[#6E6E73]">
          {isInd
            ? `Direct consultation with ${doctorName} (${specialty})`
            : "Choose how you want to book your OPD consultation today."}
        </p>
      </div>

      {/* INDIVIDUAL DOCTOR SUMMARY HIGHLIGHT CARD */}
      {isInd && (
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_8px_30px_rgba(16,185,129,0.08)] p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-emerald-500/20 p-2">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                    {doctorName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {specialty} {singleDoc?.qualification ? `• ${singleDoc.qualification}` : ''}
                </p>
                {singleDoc?.registration_number && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Reg. #{singleDoc.registration_number}
                  </p>
                )}
              </div>
            </div>

            {/* Fee Box */}
            <div className="text-right shrink-0 bg-emerald-50/80 px-3.5 py-2 rounded-xl border border-emerald-200/60">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                Consultation Fee
              </span>
              <span className="text-lg font-black text-emerald-700 flex items-center justify-end gap-0.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                {singleDoc?.fee || 500}
              </span>
            </div>
          </div>

          {/* Quick Timings Row */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {singleDoc?.available_hours?.start ? `${singleDoc.available_hours.start} - ${singleDoc.available_hours.end || '05:00 PM'}` : '09:00 AM - 05:00 PM'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Available for Online Booking
            </span>
          </div>
        </div>
      )}

      {/* Choice Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* OPTION A: BOOK WITH AI */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAI}
          className="relative group cursor-pointer rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_10px_30px_rgba(0,122,255,0.08)] hover:shadow-[0_16px_40px_rgba(0,122,255,0.18)] transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle Ambient Light gradient in card corner */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#007AFF]/15 blur-2xl group-hover:bg-[#007AFF]/25 transition-all duration-500 pointer-events-none" />

          <div>
            {/* Top Row: Icon + Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#58A6FF] text-white p-3 shadow-md shadow-[#007AFF]/25 flex items-center justify-center">
                <Sparkles className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#007AFF]/10 text-[#007AFF]">
                <Zap className="w-3 h-3 fill-[#007AFF]" /> Fast & Smart
              </span>
            </div>

            {/* Card Content */}
            <h3 className="text-lg font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
              Book With AI
            </h3>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1 leading-relaxed">
              {isInd
                ? `Describe your symptoms to our smart clinical intake assistant for ${doctorName}.`
                : "Describe your symptoms naturally & get matched with the right specialist automatically."}
            </p>

            {/* Bullet features */}
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
                <span>Smart 24/7 symptom intake</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
                <span>{isInd ? `Tailored for ${doctorName}'s practice` : "Automatic department matching"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
                <span>Instant confirmed consultation token</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <div className="w-full py-3 px-4 rounded-2xl bg-[#007AFF] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#007AFF]/25 group-hover:bg-[#0062D6] transition-colors">
              <span>Start AI Assistant</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* OPTION B: BOOK MANUALLY */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectManual}
          className="relative group cursor-pointer rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle Orange Light gradient in card corner */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#FF9500]/15 blur-2xl group-hover:bg-[#FF9500]/25 transition-all duration-500 pointer-events-none" />

          <div>
            {/* Top Row: Icon + Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#1D1D1F] to-[#434346] text-white p-3 shadow-md shadow-black/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-[#1D1D1F]">
                {isInd ? "Direct Booking" : "Direct Roster"}
              </span>
            </div>

            {/* Card Content */}
            <h3 className="text-lg font-bold text-[#1D1D1F] group-hover:text-slate-900 transition-colors">
              Book Manually
            </h3>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1 leading-relaxed">
              {isInd
                ? `Enter patient details & book your consultation directly with ${doctorName}.`
                : `Select department & doctor directly from ${hospital?.name || "the hospital"}'s active roster.`}
            </p>

            {/* Bullet features */}
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>{isInd ? "Direct single-doctor scheduling" : "Browse active hospital departments"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>{isInd ? "No doctor selection step needed" : "Select preferred doctor directly"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Instant OPD token & queue position</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <div className="w-full py-3 px-4 rounded-2xl bg-white/80 border border-slate-200 text-[#1D1D1F] font-semibold text-sm flex items-center justify-center gap-2 shadow-sm group-hover:bg-slate-100 transition-colors">
              <span>{isInd ? "Book Manually" : "Select Doctor Manually"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ──────────── OR ──────────── */}
      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative px-3 bg-white/70 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-widest text-slate-400">
          OR
        </div>
      </div>

      {/* PROMINENT HOSPITAL-SCOPED TRACK STATUS BUTTON */}
      <motion.button
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onTrackStatus}
        className="w-full py-4 px-5 rounded-3xl bg-white/90 hover:bg-white border border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,122,255,0.12)] text-[#1D1D1F] font-bold text-sm flex items-center justify-between transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-slate-900 group-hover:text-[#007AFF] transition-colors">
              Track Status / Live Queue
            </span>
            <span className="block text-xs text-slate-500 font-normal mt-0.5">
              Check real-time queue position for {hospital?.name || "this hospital"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#007AFF] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
          <span>Track Status</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </motion.button>

      {/* Footer Stats Banner */}
      <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#6E6E73]">
        <Stethoscope className="w-4 h-4 text-emerald-600" />
        <span>
          {isInd ? (
            <>
              Direct consultation with <strong className="text-[#1D1D1F]">{doctorName}</strong> at {clinicName}
            </>
          ) : (
            <>
              <strong className="text-[#1D1D1F]">{activeDoctorsCount || doctors.length}</strong> active OPD doctors available today at {hospital?.name || "this hospital"}
            </>
          )}
        </span>
      </div>
    </motion.div>
  );
};
