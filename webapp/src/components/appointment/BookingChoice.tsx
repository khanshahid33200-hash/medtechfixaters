"use client";

import { motion } from "framer-motion";
import { Bot, CalendarDays, Building2, Sparkles, Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";
import { HospitalWorkspace } from "../../types/appointment";

interface Props {
  hospital: HospitalWorkspace;
  onAI: () => void;
  onManual: () => void;
}

export function BookingChoice({ hospital, onAI, onManual }: Props) {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-16 text-left space-y-10">
      {/* Hospital Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white/90 border border-white/90 rounded-3xl shadow-[0_15px_50px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/25 shrink-0">
            <Building2 size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles size={12} />
              <span>Verified Hospital Facility</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {hospital.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {hospital.address || "Main OPD Block"}, {hospital.city || "Central Facility"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200/80 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live OPD Booking Active</span>
        </div>
      </div>

      {/* Main Title & Supporting Text */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Book Your Appointment
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
          Choose how you want to book your appointment.
        </p>
      </div>

      {/* Two Large Selection Cards (EQUAL Visual Importance) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* OPTION A: BOOK WITH AI */}
        <motion.div
          whileHover={{ y: -6, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          onClick={onAI}
          className="group rounded-[32px] border border-blue-200/80 bg-gradient-to-br from-white via-white to-blue-50/50 p-7 sm:p-9 text-left shadow-xl shadow-blue-500/5 backdrop-blur-2xl cursor-pointer flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/15"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 rounded-full bg-blue-400/10 blur-2xl group-hover:bg-blue-400/20 transition-all" />

          <div>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Bot size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs mb-2">
              <Sparkles size={14} />
              <span>AI-Assisted Guidance</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Book With AI
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Answer a few questions and receive AI-assisted guidance toward the appropriate hospital department or available doctor.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/25 transition group-hover:shadow-lg">
              <span>Start AI Booking</span>
              <ArrowRight size={14} />
            </span>
          </div>
        </motion.div>

        {/* OPTION B: BOOK MANUALLY */}
        <motion.div
          whileHover={{ y: -6, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          onClick={onManual}
          className="group rounded-[32px] border border-orange-200/80 bg-gradient-to-br from-white via-white to-orange-50/50 p-7 sm:p-9 text-left shadow-xl shadow-orange-500/5 backdrop-blur-2xl cursor-pointer flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/15"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 rounded-full bg-orange-400/10 blur-2xl group-hover:bg-orange-400/20 transition-all" />

          <div>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
              <CalendarDays size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-xs mb-2">
              <Stethoscope size={14} />
              <span>Direct Practitioner Selection</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Book Manually
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Select your department and choose an available doctor yourself.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-orange-500/25 transition group-hover:shadow-lg">
              <span>Book Manually</span>
              <ArrowRight size={14} />
            </span>
          </div>
        </motion.div>
      </div>

      {/* Trust & Isolation Disclaimer */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium pt-4">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span>Strict Multi-Tenant Isolation: Only active practitioners at {hospital.name} are accessible.</span>
      </div>
    </section>
  );
}
