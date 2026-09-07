import React from "react";
import { motion } from "framer-motion";
import { Stethoscope, Heart, Eye, Brain, Activity, ArrowRight } from "lucide-react";
import { DepartmentItem, DoctorItem } from "../../types/booking";

interface DepartmentSelectionProps {
  departments: DepartmentItem[];
  doctors: DoctorItem[];
  onSelectDepartment: (dept: DepartmentItem) => void;
}

// Icon mapping helper
const getDeptIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("cardio") || n.includes("heart")) return Heart;
  if (n.includes("neuro") || n.includes("brain")) return Brain;
  if (n.includes("ophthalm") || n.includes("eye")) return Eye;
  if (n.includes("ortho") || n.includes("bone")) return Activity;
  return Stethoscope;
};

export const DepartmentSelection: React.FC<DepartmentSelectionProps> = ({
  departments,
  doctors,
  onSelectDepartment,
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-[#1D1D1F]">Select Department</h3>
        <p className="text-xs text-[#6E6E73]">
          Choose the medical department for your consultation
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
        {departments.map((dept) => {
          const IconComp = getDeptIcon(dept.name);
          const deptDocsCount = doctors.filter(
            (d) =>
              d.active &&
              d.accepting_appointments &&
              (d.department_id === dept.id || d.department === dept.name)
          ).length;

          return (
            <motion.div
              key={dept.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectDepartment(dept)}
              className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-md hover:border-[#007AFF]/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/20 text-[#007AFF] flex items-center justify-center shrink-0 group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                  <IconComp className="w-5.5 h-5.5 stroke-[1.75]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                    {dept.name}
                  </h4>
                  <p className="text-[11px] text-[#6E6E73]">
                    {deptDocsCount > 0
                      ? `${deptDocsCount} Active Doctor${deptDocsCount > 1 ? "s" : ""}`
                      : "General OPD"}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#007AFF]/10 text-slate-400 group-hover:text-[#007AFF] flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
