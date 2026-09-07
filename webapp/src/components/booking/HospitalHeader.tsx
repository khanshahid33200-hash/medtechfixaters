import React from "react";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { HospitalWorkspace } from "../../types/booking";

interface HospitalHeaderProps {
  hospital: HospitalWorkspace | null;
  loading?: boolean;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  hospital,
  loading = false,
}) => {
  return (
    <header className="w-full mb-6 text-center">
      <div className="inline-flex flex-col items-center">
        {/* Hospital Logo Glass Container */}
        <div className="relative group mb-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,122,255,0.12)] p-2.5 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_12px_40px_rgba(0,122,255,0.2)]">
            {loading ? (
              <div className="w-full h-full rounded-2xl bg-slate-200/60 animate-pulse" />
            ) : hospital?.logoUrl ? (
              <img
                src={hospital.logoUrl}
                alt={hospital.name}
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/20 flex items-center justify-center text-[#007AFF]">
                <Building2 className="w-10 h-10 stroke-[1.75]" />
              </div>
            )}
          </div>

          {/* Verified Badge Icon */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
            <ShieldCheck className="w-5 h-5 text-[#007AFF] fill-[#007AFF]/10" />
          </div>
        </div>

        {/* Hospital Info */}
        {loading ? (
          <div className="space-y-2 flex flex-col items-center">
            <div className="h-6 w-48 bg-slate-200/60 rounded-md animate-pulse" />
            <div className="h-4 w-32 bg-slate-200/50 rounded-md animate-pulse" />
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
