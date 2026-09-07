"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, Stethoscope, Building2, User, Phone, Mail,
  Sparkles, ArrowLeft, ShieldCheck, Clock
} from "lucide-react";
import {
  DoctorItem, DepartmentItem, HospitalWorkspace, PatientIntake, BookingMethod
} from "../../types/appointment";

interface Props {
  hospital: HospitalWorkspace;
  doctor: DoctorItem;
  department?: DepartmentItem | null;
  patientInfo: PatientIntake;
  bookingMethod: BookingMethod;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function AppointmentConfirmation({
  hospital,
  doctor,
  department,
  patientInfo,
  bookingMethod,
  onConfirm,
  onBack,
  isSubmitting = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-xl mx-auto text-left space-y-4"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Selection</span>
        </button>

        <span
          className={`px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider ${
            bookingMethod === "AI"
              ? "bg-blue-100 text-blue-800 border border-blue-200"
              : "bg-orange-100 text-orange-800 border border-orange-200"
          }`}
        >
          {bookingMethod === "AI" ? "AI Booking Mode" : "Manual Selection Mode"}
        </span>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Confirm Your Appointment
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review your details before generating your live OPD queue token.
          </p>
        </div>

        {/* Hospital & Doctor Block */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold border-b border-slate-200/60 pb-2.5">
            <Building2 size={16} className="text-blue-600 shrink-0" />
            <span>{hospital.name}</span>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              <Stethoscope size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                {doctor.name}
              </h4>
              <p className="text-xs font-bold text-blue-600 truncate mt-0.5">
                {doctor.specialty} ({doctor.department || department?.name || "General"})
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                <span>Room: {doctor.room_number || "OPD Room 1"}</span>
                <span>•</span>
                <span>Consultation Fee: ₹{doctor.fee || 500}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs text-slate-700">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Patient Summary
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block text-[11px]">Name:</span>
              <strong className="text-slate-900">{patientInfo.fullName || "Patient"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Contact:</span>
              <strong className="text-slate-900">{patientInfo.contactNumber || "N/A"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Age & Gender:</span>
              <strong className="text-slate-900">{patientInfo.age} Yrs / {patientInfo.gender}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Booking Date:</span>
              <strong className="text-slate-900">Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-medium p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>Real-time sync to assigned doctor's private console & hospital lobby display.</span>
        </div>

        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 transition transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Generating Live Queue Token...</span>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Confirm & Generate Token</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
