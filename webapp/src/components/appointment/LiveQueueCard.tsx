"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, Building2, Stethoscope, Clock, Users,
  Sparkles, ArrowRight, Share2, Printer, ShieldCheck, HeartPulse
} from "lucide-react";
import { AppointmentResult, HospitalWorkspace } from "../../types/appointment";

interface Props {
  result: AppointmentResult;
  hospital: HospitalWorkspace;
  onTrackQueue?: () => void;
  onReset?: () => void;
}

export function LiveQueueCard({
  result,
  hospital,
  onTrackQueue,
  onReset,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, type: "spring", stiffness: 120, damping: 18 }}
      className="max-w-xl mx-auto text-left space-y-5"
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-600/20 text-center relative overflow-hidden space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white shadow-md">
          <CheckCircle2 size={36} />
        </div>

        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-extrabold uppercase tracking-widest text-emerald-100">
            OPD QUEUE TOKEN GENERATED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Appointment Confirmed!
          </h2>
          <p className="text-xs text-emerald-100/90 font-medium">
            Your appointment has been registered at {hospital.name}.
          </p>
        </div>
      </div>

      {/* Main Token & Queue Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-6">
        {/* Token Badge */}
        <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl text-center shadow-lg relative overflow-hidden space-y-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Your Live Token Number
          </span>

          <div className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400 font-mono">
            {result.token_number}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-4 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-amber-400" />
              <strong>{result.patients_ahead}</strong> Patients Ahead
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-400" />
              Est. Wait: <strong>~{result.estimated_wait_mins} mins</strong>
            </span>
          </div>
        </div>

        {/* Doctor & Facility Details */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 text-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              Assigned Practitioner
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md uppercase">
              {result.booking_method} Booking
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              <Stethoscope size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                {result.doctor_name}
              </h4>
              <p className="text-xs font-bold text-blue-600 mt-0.5">
                {result.department_name}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Patient: <strong>{result.patient_name}</strong> ({result.patient_phone})
              </p>
            </div>
          </div>
        </div>

        {/* AI Intake Summary (If booked via AI) */}
        {result.ai_intake_summary && (
          <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-2xl space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[11px] uppercase tracking-wider">
              <Sparkles size={14} />
              <span>AI Symptom Intake Summary (Sent to Doctor)</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>• <strong>Primary Concern:</strong> {result.ai_intake_summary.primary_concern}</p>
              {result.ai_intake_summary.symptoms?.length > 0 && (
                <p>• <strong>Reported Symptoms:</strong> {result.ai_intake_summary.symptoms.join(", ")}</p>
              )}
              <p>• <strong>Duration:</strong> {result.ai_intake_summary.symptom_duration}</p>
              <p>• <strong>Current Medications:</strong> {result.ai_intake_summary.medications}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {onTrackQueue && (
            <button
              onClick={onTrackQueue}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <HeartPulse size={16} />
              <span>Track Live Queue Display</span>
              <ArrowRight size={15} />
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <span>Book Another Appointment</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
