import React from "react";
import { motion } from "framer-motion";
import { Stethoscope, Clock, IndianRupee, ArrowRight } from "lucide-react";
import { DoctorItem, DepartmentItem } from "../../types/booking";

interface DoctorSelectionProps {
  doctors: DoctorItem[];
  selectedDepartment?: DepartmentItem | null;
  onSelectDoctor: (doctor: DoctorItem) => void;
}

export const DoctorSelection: React.FC<DoctorSelectionProps> = ({
  doctors,
  selectedDepartment,
  onSelectDoctor,
}) => {
  // Filter doctors by selected department if provided
  const filteredDoctors = selectedDepartment
    ? doctors.filter(
        (d) =>
          d.active &&
          d.accepting_appointments &&
          (d.department_id === selectedDepartment.id ||
            d.department === selectedDepartment.name)
      )
    : doctors.filter((d) => d.active && d.accepting_appointments);

  const displayDoctors = filteredDoctors;

  return (
    <div className="space-y-4 w-full">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-[#1D1D1F]">
          Select Doctor {selectedDepartment ? `(${selectedDepartment.name})` : ""}
        </h3>
        <p className="text-xs text-[#6E6E73]">
          Choose an available specialist for today's OPD consultation
        </p>
      </div>

      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {displayDoctors.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white/60 rounded-2xl border border-white">
            No doctors available for this department right now.
          </div>
        ) : (
          displayDoctors.map((doc) => (
            <motion.div
              key={doc.id}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectDoctor(doc)}
              className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm hover:shadow-md hover:border-[#007AFF]/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Doctor Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/20 border border-[#007AFF]/20 p-1 shrink-0">
                  {doc.avatar_url ? (
                    <img
                      src={doc.avatar_url}
                      alt={doc.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-[#007AFF]">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition-colors">
                      {doc.name}
                    </h4>
                  </div>
                  <p className="text-xs text-[#6E6E73] font-medium">
                    {doc.specialty || doc.department || "OPD Specialist"}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-[#34C759] font-medium">
                      <Clock className="w-3 h-3" /> Available Today
                    </span>
                    <span className="flex items-center gap-0.5 font-semibold text-[#1D1D1F]">
                      <IndianRupee className="w-3 h-3 text-[#34C759]" />
                      {doc.fee}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-[#007AFF]/10 group-hover:bg-[#007AFF] text-[#007AFF] group-hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0">
                <span>Select</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
