import { Calendar, Users, Stethoscope, FlaskConical, Receipt, ChevronDown, MoreHorizontal } from "lucide-react";

export default function VisibilityVisual() {
  return (
    <div className="w-full max-w-[360px] flex items-center justify-between gap-3 py-1">
      {/* Left: 5 Module Pills */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 px-2 py-1 shadow-2xs text-[9px] font-semibold text-slate-700">
          <Calendar size={11} className="text-blue-500" />
          <span>Appointments</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 px-2 py-1 shadow-2xs text-[9px] font-semibold text-slate-700">
          <Users size={11} className="text-blue-600" />
          <span>Patients</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 px-2 py-1 shadow-2xs text-[9px] font-semibold text-slate-700">
          <Stethoscope size={11} className="text-purple-600" />
          <span>Consultations</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 px-2 py-1 shadow-2xs text-[9px] font-semibold text-slate-700">
          <FlaskConical size={11} className="text-emerald-600" />
          <span>Lab Results</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 px-2 py-1 shadow-2xs text-[9px] font-semibold text-slate-700">
          <Receipt size={11} className="text-orange-500" />
          <span>Billing</span>
        </div>
      </div>

      {/* Right: All in One Dashboard Card */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-3 shadow-[0_8px_25px_rgba(15,23,42,0.06)] space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-[10px] font-bold text-slate-800">All in One Dashboard</span>
          <MoreHorizontal size={13} className="text-slate-400" />
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="bg-blue-50/80 rounded-lg p-1">
            <span className="text-[11px] font-black font-mono text-blue-600 block leading-tight">248</span>
            <span className="text-[7px] font-bold text-slate-400">Patients</span>
          </div>
          <div className="bg-orange-50/80 rounded-lg p-1">
            <span className="text-[11px] font-black font-mono text-orange-600 block leading-tight">86</span>
            <span className="text-[7px] font-bold text-slate-400">Appointments</span>
          </div>
          <div className="bg-emerald-50/80 rounded-lg p-1">
            <span className="text-[11px] font-black font-mono text-emerald-600 block leading-tight">12</span>
            <span className="text-[7px] font-bold text-slate-400">Doctors</span>
          </div>
          <div className="bg-purple-50/80 rounded-lg p-1">
            <span className="text-[11px] font-black font-mono text-purple-600 block leading-tight">08</span>
            <span className="text-[7px] font-bold text-slate-400">In Queue</span>
          </div>
        </div>

        {/* Activity Overview Spline Wave */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px]">
            <span className="font-bold text-slate-700">Activity Overview</span>
            <span className="text-slate-400 font-semibold flex items-center">Today <ChevronDown size={9} /></span>
          </div>

          <div className="h-10 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
              <path
                d="M0 22 Q 15 10, 30 18 T 60 12 T 85 8 T 100 15"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="30" cy="18" r="2" fill="#3b82f6" />
              <circle cx="60" cy="12" r="2" fill="#3b82f6" />
              <circle cx="85" cy="8" r="2" fill="#3b82f6" />
            </svg>
          </div>

          <div className="flex justify-between text-[6.5px] text-slate-400 font-mono">
            <span>12 AM</span>
            <span>4 AM</span>
            <span>8 AM</span>
            <span>12 PM</span>
            <span>4 PM</span>
            <span>8 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
