import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AIMessageProps {
  text: string;
  timestamp?: string;
  quickChips?: string[];
  onSelectChip?: (chipText: string) => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({
  text,
  timestamp,
  quickChips,
  onSelectChip,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-start gap-1.5 my-2 max-w-[88%]"
    >
      <div className="flex items-end gap-2.5">
        {/* AI Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#58A6FF] text-white flex items-center justify-center shadow-md shadow-[#007AFF]/20 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Bubble */}
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-[#1D1D1F] text-sm leading-relaxed">
          {text}
        </div>
      </div>

      {/* Quick response chips if present */}
      {quickChips && quickChips.length > 0 && (
        <div className="ml-10 flex flex-wrap gap-2 mt-1.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectChip?.(chip)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/70 backdrop-blur-md border border-[#007AFF]/30 text-[#007AFF] shadow-sm hover:bg-[#007AFF] hover:text-white transition-all duration-200 active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {timestamp && (
        <span className="ml-10 text-[10px] text-[#6E6E73]">{timestamp}</span>
      )}
    </motion.div>
  );
};
