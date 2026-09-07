import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end gap-2.5 my-2">
      {/* Mini AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#58A6FF] text-white flex items-center justify-center shadow-md shadow-[#007AFF]/20 shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Glass Bubble with 3-dot bouncing animation */}
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/70 backdrop-blur-md border border-white/80 shadow-sm flex items-center gap-1.5">
        <motion.span
          className="w-2 h-2 rounded-full bg-[#007AFF]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-[#007AFF]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-[#007AFF]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
        <span className="text-xs font-medium text-[#6E6E73] ml-1.5">
          AI is evaluating...
        </span>
      </div>
    </div>
  );
};
