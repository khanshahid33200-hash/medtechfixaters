import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  UserCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import { HospitalWorkspace, DoctorItem } from "../../types/booking";

interface BookingHomeProps {
  hospital: HospitalWorkspace | null;
  doctors: DoctorItem[];
  onSelectAI: () => void;
  onSelectManual: () => void;
}

export const BookingHome: React.FC<BookingHomeProps> = ({
  hospital,
  doctors,
  onSelectAI,
  onSelectManual,
}) => {
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
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight">
          Book Your Appointment
        </h2>
        <p className="text-sm sm:text-base text-[#6E6E73]">
          Choose how you want to book your OPD consultation today.
        </p>
      </div>

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
              Describe your symptoms naturally & get matched with the right specialist automatically.
            </p>

            {/* Bullet features */}
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
                <span>Smart symptom intake & check</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
                <span>Automatic department matching</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
                <span>Ideal doctor recommendation</span>
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
                Direct Roster
              </span>
            </div>

            {/* Card Content */}
            <h3 className="text-lg font-bold text-[#1D1D1F] group-hover:text-slate-900 transition-colors">
              Book Manually
            </h3>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1 leading-relaxed">
              Select department & doctor directly from {hospital?.name || "the hospital"}'s active roster.
            </p>

            {/* Bullet features */}
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Browse active hospital departments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Select preferred doctor directly</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Instant OPD token generation</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <div className="w-full py-3 px-4 rounded-2xl bg-white/80 border border-slate-200 text-[#1D1D1F] font-semibold text-sm flex items-center justify-center gap-2 shadow-sm group-hover:bg-slate-100 transition-colors">
              <span>Select Doctor Manually</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hospital Active Doctors Stats Banner */}
      <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#6E6E73]">
        <Stethoscope className="w-4 h-4 text-[#007AFF]" />
        <span>
          <strong className="text-[#1D1D1F]">{activeDoctorsCount || doctors.length}</strong> active OPD doctors available today at {hospital?.name || "this hospital"}
        </span>
      </div>
    </motion.div>
  );
};
