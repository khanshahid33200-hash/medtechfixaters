import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Stethoscope } from "lucide-react";

interface DoctorData {
  name: string;
  initials: string;
  dept: string;
  status: string;
  statusColor: string;
  textColor: string;
  bgColor: string;
  imgUrl: string;
  gradient: string;
  patients: string;
}

function DoctorAvatar({ name, initials, imgUrl, gradient }: DoctorData) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`w-7 h-7 rounded-full ${gradient} p-0.5 shrink-0 flex items-center justify-center shadow-xs overflow-hidden`}>
      {!imgError ? (
        <img
          src={imgUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black tracking-tighter">
          {initials}
        </div>
      )}
    </div>
  );
}

export default function DoctorActivityVisual() {
  const doctors: DoctorData[] = [
    {
      name: "Dr. Sharma",
      initials: "DS",
      dept: "Cardiology",
      status: "Busy",
      statusColor: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      imgUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80",
      gradient: "bg-gradient-to-tr from-amber-500 to-orange-400",
      patients: "12 Today",
    },
    {
      name: "Dr. Khan",
      initials: "DK",
      dept: "Neurology",
      status: "Available",
      statusColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      imgUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&auto=format&fit=crop&q=80",
      gradient: "bg-gradient-to-tr from-emerald-500 to-teal-400",
      patients: "8 Today",
    },
    {
      name: "Dr. Verma",
      initials: "DV",
      dept: "Pediatrics",
      status: "Consulting",
      statusColor: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      imgUrl: "https://images.unsplash.com/photo-1594824813593-9c8ef7d6e6ea?w=120&auto=format&fit=crop&q=80",
      gradient: "bg-gradient-to-tr from-blue-500 to-indigo-500",
      patients: "15 Today",
    },
  ];

  return (
    <div className="w-full max-w-[350px] flex items-center justify-between gap-1.5 py-2 select-none">
      {/* Left: Scattered Uncoordinated Activity */}
      <div className="relative w-[138px] h-[195px] flex flex-col justify-between p-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        {/* Scattered Badge 1 (Right) */}
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="self-end flex items-center gap-1.5 bg-white rounded-xl border border-slate-200/90 px-2 py-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] w-[118px]"
        >
          <DoctorAvatar {...doctors[0]} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-800 truncate leading-none">{doctors[0].name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${doctors[0].statusColor}`} />
              <span className="text-[8px] font-medium text-slate-400">{doctors[0].status}</span>
            </div>
          </div>
        </motion.div>

        {/* Scattered Badge 2 (Left) */}
        <motion.div
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="self-start flex items-center gap-1.5 bg-white rounded-xl border border-slate-200/90 px-2 py-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] w-[118px]"
        >
          <DoctorAvatar {...doctors[1]} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-800 truncate leading-none">{doctors[1].name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${doctors[1].statusColor}`} />
              <span className="text-[8px] font-medium text-slate-400">{doctors[1].status}</span>
            </div>
          </div>
        </motion.div>

        {/* Scattered Badge 3 (Center) */}
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="self-center flex items-center gap-1.5 bg-white rounded-xl border border-slate-200/90 px-2 py-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] w-[122px]"
        >
          <DoctorAvatar {...doctors[2]} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-800 truncate leading-none">{doctors[2].name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${doctors[2].statusColor}`} />
              <span className="text-[8px] font-medium text-slate-400">{doctors[2].status}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Center: MedTech AI Sync Arrow */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
        <ArrowRight size={14} />
      </div>

      {/* Right: Unified Operational Console */}
      <div className="w-[142px] space-y-2 p-1.5 bg-white rounded-2xl border border-blue-100 shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
        {doctors.map((doc, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-50/80 hover:bg-blue-50/50 rounded-xl border border-slate-100 p-1.5 transition-colors">
            <DoctorAvatar {...doc} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-slate-900 truncate leading-none">{doc.name}</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className={`px-1.5 py-0.2 rounded-full text-[7.5px] font-bold ${doc.bgColor} ${doc.textColor}`}>
                  {doc.status}
                </span>
                <span className="text-[7.5px] font-semibold text-slate-400">{doc.patients}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
