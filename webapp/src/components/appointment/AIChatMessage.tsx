"use client";

import { motion } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { ChatMessageItem } from "../../types/appointment";

export function AIChatMessage({ message }: { message: ChatMessageItem }) {
  const isAI = message.sender === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex items-start gap-3 text-left ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
          <Bot size={17} />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
          isAI
            ? "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-slate-200/50"
            : "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white rounded-tr-xs shadow-orange-500/20 font-bold"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <span
          className={`block text-[10px] mt-1.5 font-normal ${
            isAI ? "text-slate-400" : "text-orange-100"
          }`}
        >
          {message.timestamp}
        </span>
      </div>

      {!isAI && (
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
          <User size={16} />
        </div>
      )}
    </motion.div>
  );
}
