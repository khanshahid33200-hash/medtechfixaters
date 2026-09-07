import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Stethoscope,
  Clock,
  IndianRupee,
  CheckCircle,
  RefreshCw,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import { DoctorRecommendation, DoctorItem } from "../../types/booking";

interface AIRecommendationProps {
  recommendation: DoctorRecommendation;
  matchedDoctor?: DoctorItem;
  onConfirm: () => void;
  onChangeDoctor: () => void;
  onSwitchManual: () => void;
  loading?: boolean;
}

export const AIRecommendation: React.FC<AIRecommendationProps> = ({
  recommendation,
  matchedDoctor,
  onConfirm,
  onChangeDoctor,
  onSwitchManual,
  loading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-5"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#58A6FF] text-white flex items-center justify-center shadow-md shadow-[#007AFF]/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F]">
              AI Clinical Recommendation
            </h3>
            <p className="text-xs text-[#6E6E73]">
              Based on your reported symptoms
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#34C759]/10 text-[#34C759] flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> High Match
        </span>
      </div>

      {/* Recommendation Card */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,122,255,0.12)] p-6 space-y-5">
        {/* Doctor Info Section */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/20 border border-[#007AFF]/20 p-1 shrink-0">
            {matchedDoctor?.avatar_url ? (
              <img
                src={matchedDoctor.avatar_url}
                alt={recommendation.doctorName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-[#007AFF]">
                <Stethoscope className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#007AFF]/10 text-[#007AFF] mb-1">
              {recommendation.departmentName}
            </span>
            <h4 className="text-lg font-bold text-[#1D1D1F] truncate">
              {recommendation.doctorName}
            </h4>
            <p className="text-xs text-[#6E6E73] font-medium">
              {recommendation.specialty}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-700">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#007AFF]" />
                {recommendation.availability || "Today OPD"}
              </span>
              {(matchedDoctor?.fee || recommendation.fee) && (
                <span className="flex items-center gap-0.5 font-semibold text-[#1D1D1F]">
                  <IndianRupee className="w-3.5 h-3.5 text-[#34C759]" />
                  {matchedDoctor?.fee || recommendation.fee} Consultation Fee
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Rationale / Explanation Box */}
        <div className="p-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/15 text-xs text-[#1D1D1F] leading-relaxed space-y-1">
          <p className="font-semibold text-[#007AFF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Why this doctor was chosen
          </p>
          <p className="text-[#6E6E73]">
            {recommendation.explanation ||
              "Matched based on primary complaint and hospital OPD roster availability for immediate evaluation."}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 text-[11px] text-[#6E6E73] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            AI recommendations are for OPD triage assistance only, not a formal diagnosis.
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Confirm Button */}
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
                <span>Confirm & Book OPD Token</span>
              </>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onChangeDoctor}
              className="py-2.5 px-3 rounded-xl bg-white/60 hover:bg-white border border-slate-200 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Change Doctor</span>
            </button>

            <button
              type="button"
              onClick={onSwitchManual}
              className="py-2.5 px-3 rounded-xl bg-white/60 hover:bg-white border border-slate-200 text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Book Manually</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
