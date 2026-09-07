"use client";

import { motion } from "framer-motion";
import { Layers, Stethoscope, ArrowRight, CheckCircle2 } from "lucide-react";
import { DepartmentItem } from "../../types/appointment";

interface Props {
  departments: DepartmentItem[];
  selectedDepartmentId?: string;
  onSelectDepartment: (dept: DepartmentItem) => void;
}

export function DepartmentSelector({
  departments,
  selectedDepartmentId,
  onSelectDepartment,
}: Props) {
  return (
    <div className="space-y-4 text-left">
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Select Clinical Department
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Showing active OPD departments available inside this hospital facility.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {departments.map((dept) => {
          const isSelected = selectedDepartmentId === dept.id || selectedDepartmentId === dept.name;
          return (
            <motion.button
              key={dept.id}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectDepartment(dept)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[96px] ${
                isSelected
                  ? "bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white border-slate-200/90 text-slate-900 hover:border-orange-300 hover:bg-orange-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isSelected ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    <Layers size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm leading-tight">
                      {dept.name}
                    </h4>
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelected ? "text-orange-100" : "text-slate-400"
                      }`}
                    >
                      {dept.description || "OPD Department"}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 size={18} className="text-white shrink-0" />
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px] font-medium">
                <span>Avg Wait: ~{dept.avg_wait_mins || 15} mins</span>
                <span className="font-bold flex items-center gap-1">
                  <span>View Doctors</span>
                  <ArrowRight size={11} />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
