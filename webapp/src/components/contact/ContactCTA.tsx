"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContactCTA() {
  const scrollToForm = () => {
    const el = document.getElementById("contact-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20 w-full">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-[36px] border border-white/90 bg-gradient-to-br from-white/95 via-blue-50/40 to-orange-50/30 p-6 sm:p-10 lg:p-14 shadow-[0_20px_70px_rgba(37,99,235,0.08)] backdrop-blur-2xl text-center"
        >
          {/* Subtle animated background light spots */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-blue-400/20 blur-[70px] sm:blur-[90px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-orange-400/20 blur-[70px] sm:blur-[90px]" />

          <div className="relative z-10 mx-auto max-w-3xl">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1 shadow-2xs backdrop-blur-xl">
              <Sparkles size={11} className="text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                TAKE THE NEXT STEP
              </span>
            </div>

            {/* Heading */}
            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-[#17191F] leading-[1.18]">
              Ready to Connect Your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
                Healthcare Workflow?
              </span>
            </h2>

            {/* Supporting text */}
            <p className="mt-3 sm:mt-5 text-xs sm:text-base lg:text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
              Talk with the MedTech Fixaters team about your hospital, workflow, or digital healthcare project.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full">
              <button
                onClick={scrollToForm}
                className="group flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md sm:shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Contact Our Team</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>

              <Link
                to="/features"
                className="flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-[#17191F] shadow-2xs transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-600 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore MedTech Fixaters</span>
              </Link>
            </div>

            {/* Direct Quick Dial */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-500">
              <PhoneCall size={13} className="text-orange-500 shrink-0" />
              <span>Direct Support & Inquiries: </span>
              <a
                href="tel:9587867559"
                className="font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                +91 95878 67559
              </a>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
