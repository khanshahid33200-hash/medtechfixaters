import React from "react";
import { Building2, CheckCircle2, ShieldCheck, Stethoscope, MapPin } from "lucide-react";
import { HospitalWorkspace } from "../../types/booking";

interface HospitalHeaderProps {
  hospital: HospitalWorkspace | null;
  loading?: boolean;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  hospital,
  loading = false,
}) => {
  const isInd = Boolean(hospital?.is_individual_doctor);
  const doc = hospital?.doctor;
  const clinicName = hospital?.clinic?.name || hospital?.name;
  const doctorName = doc?.name || (isInd ? hospital?.name : undefined);
  const specialty = doc?.specialization || doc?.specialty || doc?.department;

  return (
    <header className="w-full mb-6 text-center">
      <div className="inline-flex flex-col items-center">
        {/* Logo / Avatar Glass Container */}
        <div className="relative group mb-3">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 p-2.5 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
            isInd
              ? 'shadow-[0_8px_32px_rgba(16,185,129,0.15)] group-hover:shadow-[0_12px_40px_rgba(16,185,129,0.25)]'
              : 'shadow-[0_8px_32px_rgba(0,122,255,0.12)] group-hover:shadow-[0_12px_40px_rgba(0,122,255,0.2)]'
          }`}>
            {loading ? (
              <div className="w-full h-full rounded-2xl bg-slate-200/60 animate-pulse" />
            ) : hospital?.logoUrl || doc?.avatar_url ? (
              <img
                src={hospital?.logoUrl || doc?.avatar_url}
                alt={clinicName || doctorName}
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : isInd ? (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/20 to-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Stethoscope className="w-10 h-10 stroke-[1.75]" />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/20 flex items-center justify-center text-[#007AFF]">
                <Building2 className="w-10 h-10 stroke-[1.75]" />
              </div>
            )}
          </div>

          {/* Verified Badge Icon */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
            <ShieldCheck className={`w-5 h-5 ${isInd ? 'text-emerald-600 fill-emerald-500/10' : 'text-[#007AFF] fill-[#007AFF]/10'}`} />
          </div>
        </div>

        {/* Doctor & Clinic Info */}
        {loading ? (
          <div className="space-y-2 flex flex-col items-center">
            <div className="h-6 w-48 bg-slate-200/60 rounded-md animate-pulse" />
            <div className="h-4 w-32 bg-slate-200/50 rounded-md animate-pulse" />
          </div>
        ) : isInd ? (
          <div className="flex flex-col items-center max-w-md px-4">
            {/* Primary Practice Identity */}
            <div className="flex items-center gap-1.5 justify-center">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F]">
                {clinicName || doctorName || "Doctor's Clinic"}
              </h1>
              <CheckCircle2 className="w-5 h-5 text-[#34C759] shrink-0" />
            </div>

            {/* Doctor Name & Qualifications if distinct */}
            {doctorName && (clinicName?.toLowerCase() !== doctorName?.toLowerCase()) && (
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                {doctorName} {doc?.qualification ? `• ${doc.qualification}` : ''}
              </p>
            )}

            {/* Specialty, Fee, City Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {specialty && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                  {specialty}
                </span>
              )}
              {doc?.fee && (
                <span className="text-xs font-bold text-slate-800">
                  • Consultation ₹{doc.fee}
                </span>
              )}
              {hospital?.city && (
                <span className="text-xs text-[#6E6E73] flex items-center gap-0.5">
                  • <MapPin className="w-3 h-3 text-slate-400" /> {hospital.city}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-md px-4">
            <div className="flex items-center gap-1.5 justify-center">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
                {hospital?.name || "Hospital Appointment Desk"}
              </h1>
              <CheckCircle2 className="w-5 h-5 text-[#34C759] shrink-0" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#007AFF]/10 text-[#007AFF]">
                Official Digital Reception
              </span>
              {hospital?.city && (
                <span className="text-xs text-[#6E6E73]">
                  • {hospital.city}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
