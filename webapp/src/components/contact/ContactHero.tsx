"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles, Stethoscope, Building2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Contact3DScene from "./Contact3DScene";

export default function ContactHero() {
  const scrollToForm = () => {
    const el = document.getElementById("contact-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 w-full">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-5 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-blue-400/15 blur-[100px] sm:blur-[140px]" />
        <div className="absolute right-0 top-20 h-[280px] w-[280px] sm:h-[450px] sm:w-[450px] rounded-full bg-orange-400/12 blur-[100px] sm:blur-[140px]" />
        <div className="absolute bottom-[-50px] left-1/3 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] rounded-full bg-violet-300/15 blur-[90px] sm:blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          
          {/* Left Column: Typography & CTAs */}
          <div className="text-left w-full">
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1 shadow-2xs backdrop-blur-xl"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                <Sparkles size={10} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                CONTACT MEDTECH FIXATERS
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="mt-4 sm:mt-6 text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-[-0.04em] text-[#17191F] leading-[1.14]"
            >
              Let’s Build Better{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#FF6B2C] bg-clip-text text-transparent">
                Healthcare Workflows
              </span>{" "}
              Together.
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-slate-600"
            >
              Have a question about MedTech Fixaters, hospital workflows, AI-powered operations, or partnerships? Talk to our team.
            </motion.p>

            {/* Two Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full"
            >
              <button
                onClick={scrollToForm}
                className="group flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md sm:shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Talk to Our Team</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>

              <Link
                to="/features"
                className="flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white/80 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-[#17191F] shadow-2xs backdrop-blur-xl transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-600 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore MedTech Fixaters</span>
              </Link>
            </motion.div>

            {/* Micro Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 sm:mt-10 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 border-t border-slate-200/60 pt-5 sm:pt-6 text-[11px] sm:text-xs text-slate-500 font-medium"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                <span>Enterprise Data Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-orange-500 shrink-0" />
                <span>OPD & Hospital OS</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope size={15} className="text-emerald-600 shrink-0" />
                <span>Doctor Workspace</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D Communication Scene with responsive floating badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.2 }}
            className="relative flex items-center justify-center w-full max-w-full overflow-hidden"
          >
            {/* Floating Glass Badge - MedTech AI */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.4 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
              className="absolute left-2 sm:left-4 top-2 sm:top-4 z-20 flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/80 bg-white/80 p-2 sm:p-3 shadow-md backdrop-blur-xl text-left"
            >
              <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                <Sparkles size={14} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900">MedTech AI</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Connected Intelligence</p>
              </div>
            </motion.div>

            {/* Floating Live Nodes Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: [0, 6, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.5 },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              }}
              className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 z-20 flex items-center gap-2 rounded-xl sm:rounded-2xl border border-white/80 bg-white/80 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-md backdrop-blur-xl text-left"
            >
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-800">Unified Architecture</p>
                <p className="text-[8px] sm:text-[9px] text-slate-400">Hospitals • Doctors • Patients</p>
              </div>
            </motion.div>

            {/* 3D Canvas Container */}
            <div className="w-full max-w-full overflow-hidden">
              <Contact3DScene />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
