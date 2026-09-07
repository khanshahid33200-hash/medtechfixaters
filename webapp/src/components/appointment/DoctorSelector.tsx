"use client";

import { motion } from "framer-motion";
import { Stethoscope, CheckCircle2, UserCheck, CalendarCheck, ArrowRight, ShieldCheck } from "lucide-react";
import { DoctorItem } from "../../types/appointment";

interface Props {
  doctors: DoctorItem[];
  selectedDoctorId?: string;
  onSelectDoctor: (doctor: DoctorItem) => void;
}

export function DoctorSelector({
  doctors,
  selectedDoctorId,
  onSelectDoctor,
}: Props) {
  if (doctors.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
        <Stethoscope size={32} className="mx-auto text-slate-400" />
        <h4 className="font-bold text-sm text-slate-800">No Practitioners Available</h4>
        <p className="text-xs text-slate-500">
          There are currently no active doctors listed for this department. Please choose another department.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Select Available Doctor
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Showing active practitioners registered inside this hospital.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {doctors.map((doc) => {
          const isSelected = selectedDoctorId === doc.id;
          return (
            <motion.div
              key={doc.id}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectDoctor(doc)}
              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border-blue-600 text-white shadow-xl shadow-blue-500/20"
                  : "bg-white border-slate-200/90 text-slate-900 hover:border-blue-300 hover:bg-blue-50/30 shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Stethoscope size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-sm truncate">{doc.name}</h4>
                    {isSelected && <CheckCircle2 size={18} className="text-white shrink-0" />}
                  </div>

                  <p
                    className={`text-xs font-bold truncate mt-0.5 ${
                      isSelected ? "text-blue-200" : "text-blue-600"
                    }`}
                  >
                    {doc.specialty}
                  </p>

                  <div
                    className={`flex items-center gap-2.5 text-[11px] mt-1.5 font-medium ${
                      isSelected ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    <span>{doc.department || "OPD"}</span>
                    <span>•</span>
                    <span>Fee: ₹{doc.fee || 500}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-current/10 flex items-center justify-between text-[10.5px]">
                <span
                  className={`font-semibold ${
                    isSelected ? "text-emerald-300" : "text-emerald-600"
                  }`}
                >
                  ✓ Available Today
                </span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    isSelected
                      ? "bg-white text-blue-700"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {isSelected ? "Selected" : "Select Doctor →"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
