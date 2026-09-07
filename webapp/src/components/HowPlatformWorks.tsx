import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  QrCode,
  Building2,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JOURNEYS = [
  {
    id: "patients",
    number: "01",
    badge: "Instant OPD",
    role: "For Patients",
    tagline: "QR Check-In & AI Triage",
    desc: "Scan hospital QR, describe symptoms to AI Assistant, get instant live queue token (e.g. A-013), and track wait times in real time.",
    icon: QrCode,
    gradient: "from-[#FF6B2C] via-[#FF8A4C] to-[#FF4500]",
    glow: "bg-orange-500/10",
    badgeBg: "bg-orange-50 text-[#FF6B2C] border-orange-200/80",
    linkTo: "/features",
    highlights: ["Hospital QR scan", "AI symptom matching", "Live token countdown"],
  },
  {
    id: "hospitals",
    number: "02",
    badge: "Command Desk",
    role: "For Hospitals",
    tagline: "Central Operations & Multi-Tenancy",
    desc: "Manage doctor seats, OPD lobby TV displays, multi-counter queue balancing, and strict data isolation across departments.",
    icon: Building2,
    gradient: "from-blue-600 via-indigo-600 to-violet-600",
    glow: "bg-blue-500/10",
    badgeBg: "bg-blue-50 text-blue-600 border-blue-200/80",
    linkTo: "/how-it-works",
    highlights: ["OPD lobby TV board", "Multi-counter load balance", "Row-level data security"],
  },
  {
    id: "doctors",
    number: "03",
    badge: "30-Sec EMR",
    role: "For Doctors",
    tagline: "Clinical OPD Workspace",
    desc: "30-second digital Rx engine, instant queue callout, patient history timeline, and automatic WhatsApp prescription dispatches.",
    icon: Stethoscope,
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    glow: "bg-emerald-500/10",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    linkTo: "/features",
    highlights: ["30-sec Rx pad", "Live patient callout", "WhatsApp PDF dispatch"],
  },
];

export default function HowPlatformWorks() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] py-16 sm:py-20">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Compact Eyecatching Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1 text-xs font-bold text-slate-600 shadow-2xs backdrop-blur-md"
          >
            <Sparkles size={13} className="text-orange-500" />
            <span className="tracking-wider uppercase">HOW IT WORKS</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.04em] text-[#17191F]"
          >
            One Platform.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
              Different Journeys.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium leading-relaxed"
          >
            MedTech Fixaters connects patients, hospital command desks, and doctor workspaces into one synchronized digital network.
          </motion.p>
        </div>

        {/* 3 Compact Eyecatching Cards */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {JOURNEYS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 backdrop-blur-xl overflow-hidden"
              >
                {/* Top Corner Glow */}
                <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full ${item.glow} blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`} />

                <div>
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform`}>
                      <Icon size={22} />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${item.badgeBg}`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {item.role}
                    </span>
                    <h3 className="text-lg font-black text-[#17191F] group-hover:text-blue-600 transition-colors">
                      {item.tagline}
                    </h3>
                  </div>

                  {/* Short Paragraph */}
                  <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Micro Bullet Highlights */}
                  <ul className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-700 font-medium">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action Link */}
                <div className="mt-6 pt-2">
                  <Link
                    to={item.linkTo}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-orange-600 transition-colors"
                  >
                    <span>Explore Journey</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
