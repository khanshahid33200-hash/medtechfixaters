import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  User,
  Phone,
  Stethoscope,
  Building,
  IndianRupee,
  Clock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  PatientIntake,
  DoctorItem,
  DepartmentItem,
  HospitalWorkspace,
} from "../../types/booking";

interface BookingReviewProps {
  hospital: HospitalWorkspace | null;
  patient: PatientIntake;
  doctor: DoctorItem;
  department?: DepartmentItem | null;
  onConfirm: () => void;
  onEdit: () => void;
  loading?: boolean;
}

export const BookingReview: React.FC<BookingReviewProps> = ({
  hospital,
  patient,
  doctor,
  department,
  onConfirm,
  onEdit,
  loading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 w-full"
    >
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-[#1D1D1F]">Review Appointment Details</h3>
        <p className="text-xs text-[#6E6E73]">
          Please verify your details before confirming your OPD token
        </p>
      </div>

      <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,122,255,0.08)] p-5 space-y-4">
        {/* Hospital Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#007AFF]" />
            <span className="text-xs font-bold text-[#1D1D1F]">
              {hospital?.name || "Hospital OPD Desk"}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#34C759]/10 text-[#34C759]">
            Live OPD Queue
          </span>
        </div>

        {/* Doctor Summary */}
        <div className="flex items-center gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
            {doctor.avatar_url ? (
              <img
                src={doctor.avatar_url}
                alt={doctor.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Stethoscope className="w-6 h-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-[#007AFF] uppercase tracking-wider">
              {department?.name || doctor.department || "OPD Department"}
            </span>
            <h4 className="text-sm font-bold text-[#1D1D1F] truncate">
              {doctor.name}
            </h4>
            <p className="text-xs text-[#6E6E73] truncate">{doctor.specialty}</p>
          </div>
          {doctor.fee && (
            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#6E6E73] block">OPD Fee</span>
              <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-0.5 justify-end">
                <IndianRupee className="w-3 h-3 text-[#34C759]" />
                {doctor.fee}
              </span>
            </div>
          )}
        </div>

        {/* Patient Info Summary */}
        <div className="space-y-2 text-xs text-[#1D1D1F]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60">
            <span className="text-[#6E6E73] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#007AFF]" /> Patient Name
            </span>
            <span className="font-semibold">{patient.fullName}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60">
            <span className="text-[#6E6E73] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#007AFF]" /> Contact
            </span>
            <span className="font-semibold">{patient.contactNumber}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60">
            <span className="text-[#6E6E73] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#007AFF]" /> Age & Gender
            </span>
            <span className="font-semibold">
              {patient.age} yrs • {patient.gender || "Male"}
            </span>
          </div>

          {patient.primaryConcern && (
            <div className="p-2.5 rounded-xl bg-slate-50/60 space-y-0.5">
              <span className="text-[#6E6E73] block text-[11px]">Primary Concern</span>
              <p className="font-medium text-[#1D1D1F]">{patient.primaryConcern}</p>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6E73] justify-center pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
          <span>Verified OPD Token with Live Position Tracking</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0062D6] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/30 transition-all duration-200"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <CheckCircle className="w-4.5 h-4.5" />
                <span>Confirm & Generate OPD Token</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onEdit}
            disabled={loading}
            className="w-full py-2.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-semibold text-center transition-colors"
          >
            Edit Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};
