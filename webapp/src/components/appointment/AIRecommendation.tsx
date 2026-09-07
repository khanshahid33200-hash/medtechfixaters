"use client";

import { motion } from "framer-motion";
import {
  Sparkles, Stethoscope, Building2, CalendarCheck, CheckCircle2,
  ArrowRight, RefreshCw, Layers, ShieldCheck, AlertCircle, UserCheck
} from "lucide-react";
import { DoctorRecommendation, DoctorItem, HospitalWorkspace } from "../../types/appointment";

interface Props {
  recommendation: DoctorRecommendation;
  hospital: HospitalWorkspace;
  selectedDoctor?: DoctorItem | null;
  onConfirm: () => void;
  onChangeDoctor: () => void;
  onSwitchManual: () => void;
  isSubmitting?: boolean;
}

export function AIRecommendation({
  recommendation,
  hospital,
  selectedDoctor,
  onConfirm,
  onChangeDoctor,
  onSwitchManual,
  isSubmitting = false,
}: Props) {
  const activeDocName = selectedDoctor?.name || recommendation.doctorName;
  const activeSpecialty = selectedDoctor?.specialty || recommendation.specialty;
  const activeFee = selectedDoctor?.fee || recommendation.fee || 500;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="max-w-xl mx-auto space-y-5 text-left"
    >
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-extrabold shadow-2xs">
        <Sparkles size={14} className="text-blue-600 animate-pulse" />
        <span>AI APPOINTMENT RECOMMENDATION</span>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="bg-gradient-to-br from-white via-white to-blue-50/30 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Hospital Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Building2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                {hospital.name}
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">
                Verified Hospital Workspace
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Queue Active
          </span>
        </div>

        {/* Suggested Department & Doctor Details */}
        <div className="space-y-4">
          <div className="p-4 bg-white/90 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                Suggested Department
              </span>
              <span className="px-2.5 py-0.5 bg-blue-100/90 text-blue-800 text-xs font-bold rounded-md">
                {recommendation.departmentName}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-md shadow-orange-500/20">
                <Stethoscope size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-slate-900 tracking-tight truncate">
                  {activeDocName}
                </h3>
                <p className="text-xs font-bold text-blue-600 truncate mt-0.5">
                  {activeSpecialty}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-medium">
                  <span className="text-emerald-600 font-bold">✓ {recommendation.availability}</span>
                  <span>•</span>
                  <span>Consult Fee: ₹{activeFee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 leading-relaxed space-y-1.5">
            <strong className="text-slate-800 block text-[11px] uppercase tracking-wider">
              Why this recommendation:
            </strong>
            <p>{recommendation.explanation}</p>
          </div>
        </div>

        {/* Non-Diagnostic Clinical Disclaimer */}
        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-medium p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl">
          <AlertCircle size={15} className="text-amber-600 shrink-0" />
          <span>
            AI guidance supports appointment routing and does not replace professional medical advice or diagnosis.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 transition transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Creating Queue Token...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Confirm Appointment with {activeDocName}</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onChangeDoctor}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <RefreshCw size={13} />
              <span>Choose Another Doctor</span>
            </button>

            <button
              onClick={onSwitchManual}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Layers size={13} />
              <span>Book Manually Instead</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
