import React from "react";
import { motion } from "framer-motion";

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F7F8FA]">
      {/* Primary Blue Soft Glow Blob */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[15%] left-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#007AFF]/20 to-[#58A6FF]/15 blur-[120px]"
      />

      {/* Accent Orange Warm Light Blob */}
      <motion.div
        animate={{
          x: [0, -40, 50, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.85, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[35%] right-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#FF9500]/15 to-[#FFCC00]/10 blur-[130px]"
      />

      {/* Deep Soft Glow Bottom Blob */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-[10%] left-[25%] w-[500px] h-[500px] rounded-full bg-gradient-to-t from-[#007AFF]/12 to-[#34C759]/10 blur-[140px]"
      />
    </div>
  );
};
