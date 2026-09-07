"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Brain,
  ArrowDown,
  Bot,
  User,
  Cpu,
  Activity,
  Stethoscope,
  Building2,
} from "lucide-react";

export default function AICommunication() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent w-full">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1 shadow-2xs backdrop-blur-xl"
          >
            <Brain size={12} className="text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
              WORKFLOW INTELLIGENCE
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17191F]"
          >
            Healthcare Technology.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Human Conversation.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-500 max-w-xl mx-auto"
          >
            MedTech Fixaters combines intelligent digital workflows with practical human support.
          </motion.p>
        </div>

        {/* Central Visual Communication Workflow Showcase */}
        <div className="mt-8 sm:mt-12 mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[36px] border border-white/90 bg-white/75 p-4 sm:p-8 lg:p-10 shadow-[0_15px_50px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
            
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-32 sm:h-48 w-64 sm:w-96 -translate-x-1/2 rounded-full bg-blue-400/10 blur-[60px] sm:blur-[80px]" />

            {/* Step Indicators Header */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-100 text-[11px] sm:text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-slate-700 font-bold truncate">Visual Workflow Showcase</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5">
                {[0, 1, 2].map((step) => (
                  <button
                    key={step}
                    onClick={() => setActiveStep(step)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeStep === step ? "w-6 sm:w-8 bg-blue-600" : "w-1.5 sm:w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* The 3 Sequence Cards */}
            <div className="mt-5 sm:mt-7 space-y-4 sm:space-y-5">
              
              {/* Step 1: User Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: activeStep >= 0 ? 1 : 0.45,
                  scale: activeStep === 0 ? 1.01 : 1,
                  borderColor: activeStep === 0 ? "#93C5FD" : "#F1F5F9",
                }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border bg-white/90 p-3.5 sm:p-5 shadow-2xs transition-all text-left"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      STEP 01 • WORKFLOW CONCERN
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400">Hospital Administrator</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                    &ldquo;How can MedTech Fixaters improve our hospital OPD workflow and eliminate queue bottlenecks?&rdquo;
                  </p>
                </div>
              </motion.div>

              {/* Arrow Connector */}
              <div className="flex justify-center -my-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                  <ArrowDown size={12} />
                </div>
              </div>

              {/* Step 2: AI Processing */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: activeStep >= 1 ? 1 : 0.45,
                  scale: activeStep === 1 ? 1.01 : 1,
                  borderColor: activeStep === 1 ? "#FDBA74" : "#F1F5F9",
                }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border bg-gradient-to-r from-orange-50/40 via-white to-blue-50/40 p-3.5 sm:p-5 shadow-2xs transition-all text-left"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/20 font-bold">
                  <Cpu size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-orange-600">
                      STEP 02 • WORKFLOW ORCHESTRATION
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      Processing
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                    Analyzing OPD department rosters, QR standee entry points, doctor consultation velocity, and real-time live queues...
                  </p>
                </div>
              </motion.div>

              {/* Arrow Connector */}
              <div className="flex justify-center -my-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                  <ArrowDown size={12} />
                </div>
              </div>

              {/* Step 3: Response */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: activeStep >= 2 ? 1 : 0.45,
                  scale: activeStep === 2 ? 1.01 : 1,
                  borderColor: activeStep === 2 ? "#86EFAC" : "#F1F5F9",
                }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border bg-white/90 p-3.5 sm:p-5 shadow-2xs transition-all text-left"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20 font-bold">
                  <Bot size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      STEP 03 • UNIFIED RESOLUTION
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400">Connected System</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                    Connecting patient QR self-booking, doctor workspaces, live token queues, and automated follow-ups into a unified sub-30-second digital workflow.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 rounded-md sm:rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-blue-700">
                      <Building2 size={11} />
                      Isolated Hospital QR
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md sm:rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-orange-700">
                      <Activity size={11} />
                      Live Queue Token
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md sm:rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700">
                      <Stethoscope size={11} />
                      Doctor EMR & Rx
                    </span>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
