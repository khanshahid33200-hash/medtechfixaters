import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building,
  Clock,
  Users,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Calendar,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { BookingResult } from "../../types/booking";

interface BookingSuccessProps {
  result: BookingResult;
  onBookAnother: () => void;
  onTrackAppointment?: (token: string) => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  result,
  onBookAnother,
  onTrackAppointment,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (result.patient_number) {
      navigator.clipboard.writeText(result.patient_number);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg mx-auto space-y-5"
    >
      {/* Top Success Badge */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto border border-[#34C759]/20 shadow-md shadow-[#34C759]/15"
        >
          <CheckCircle2 className="w-10 h-10 stroke-[2]" />
        </motion.div>

        <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
          Appointment Confirmed!
        </h2>
        <p className="text-xs sm:text-sm text-[#6E6E73]">
          Your appointment has been registered at {result.hospital_name}
        </p>
      </div>

      {/* Main Token & Permanent Patient ID Glass Card */}
      <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_16px_48px_rgba(0,122,255,0.12)] p-6 space-y-5 text-center relative overflow-hidden">
        {/* Ambient Top Light */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#007AFF]/15 blur-3xl pointer-events-none" />

        {/* PROMINENT PERMANENT PATIENT ID HERO BOX */}
        {result.patient_number && (
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-50 via-teal-50/60 to-emerald-50/30 border-2 border-emerald-500/30 shadow-sm text-left relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                  Your Permanent Patient ID
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 text-[11px] font-bold shadow-xs transition active:scale-95"
              >
                {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedId ? "Copied!" : "Copy ID"}</span>
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-950">
                {result.patient_number}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Saved to Records
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium leading-tight">
              Please save this Patient ID. Use it for instant lookup on future visits and follow-ups.
            </p>
          </div>
        )}

        {/* Token Badge */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#007AFF] uppercase tracking-wider block">
            Your OPD Token Number
          </span>
          <div className="inline-block px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0051A8] text-white shadow-xl shadow-[#007AFF]/30 border border-white/20">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-wider font-mono">
              {result.token_number}
            </span>
          </div>
        </div>

        {/* Queue Live Metrics */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
            <span className="text-[11px] text-[#6E6E73] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#007AFF]" /> Patients Ahead
            </span>
            <span className="text-lg font-bold text-[#1D1D1F] mt-0.5">
              {result.patients_ahead ?? 2}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
            <span className="text-[11px] text-[#6E6E73] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FF9500]" /> Est. Wait Time
            </span>
            <span className="text-lg font-bold text-[#1D1D1F] mt-0.5">
              ~{result.estimated_wait_mins ?? 15} mins
            </span>
          </div>
        </div>

        {/* Appointment Details Summary */}
        <div className="text-left space-y-2 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          {result.patient_number && (
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
              <span className="text-[#6E6E73]">Patient ID</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{result.patient_number}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[#6E6E73]">Doctor</span>
            <span className="font-bold text-[#1D1D1F]">{result.doctor_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6E6E73]">Department</span>
            <span className="font-semibold">{result.department_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6E6E73]">Patient</span>
            <span className="font-semibold">{result.patient_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6E6E73]">Mobile</span>
            <span className="font-semibold">{result.patient_phone}</span>
          </div>
        </div>

        {/* Live Queue Status Pill */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#34C759] bg-[#34C759]/10 p-2.5 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-ping" />
          <span>Live Queue Active • Track your turn in real time</span>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          {onTrackAppointment ? (
            <button
              type="button"
              onClick={() => onTrackAppointment(result.tracking_token || result.patient_number || result.queue_number || result.id)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0062D6] active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Track Live Queue Status →</span>
            </button>
          ) : (
            <a
              href={`/track?t=${result.tracking_token || result.queue_number || result.id}&hospital=${result.hospital_id}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0062D6] active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              <Clock className="w-4 h-4" />
              <span>Track Live Queue Status →</span>
            </a>
          )}

          <button
            type="button"
            onClick={onBookAnother}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-[#1D1D1F] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Done / Book Another</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
