import React from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

interface PatientMessageProps {
  text: string;
  timestamp?: string;
}

export const PatientMessage: React.FC<PatientMessageProps> = ({
  text,
  timestamp,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-end gap-1 my-2 self-end max-w-[85%]"
    >
      <div className="flex items-end gap-2">
        <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#007AFF] to-[#0051A8] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)] text-sm leading-relaxed font-medium">
          {text}
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
      {timestamp && (
        <span className="mr-9 text-[10px] text-[#6E6E73]">{timestamp}</span>
      )}
    </motion.div>
  );
};
