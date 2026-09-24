import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Stethoscope,
  User,
} from "lucide-react"
import HealthcareScene from "./HealthcareScene"
import PatientJourney from "./PatientJourney"
import HospitalJourney from "./HospitalJourney"
import DoctorJourney from "./DoctorJourney"
import AISystem from "./AISystem"
import DataIsolation from "./DataIsolation"
import FinalCTA from "./FinalCTA"
import PublicHeader from "../PublicHeader"
import PublicFooter from "../PublicFooter"
import ContactModal from "../ContactModal"
import { useSEO } from "../../hooks/useSEO"

export default function HowItWorksComponent() {
  useSEO({
    title: "How MedTech Fixaters Works — One Connected Healthcare Platform",
    description:
      "MedTech Fixaters connects patients, hospitals, and doctors through one AI-powered healthcare platform. Explore patient QR booking, hospital operations, and doctor workspaces.",
  })

  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95])
  const heroBlur = useTransform(scrollYProgress, [0, 0.8], ["blur(0px)", "blur(10px)"])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      <PublicHeader />

      <main className="relative overflow-hidden">
        {/* ─── AURORA MESH BACKGROUND GLOWS ─── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-orange-400/15 via-rose-300/10 to-transparent blur-[140px]" />
          <div className="absolute top-20 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-blue-500/15 via-indigo-400/10 to-transparent blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-cyan-400/5 via-violet-300/5 to-transparent blur-[160px]" />
        </div>

        {/* ─── 1. ULTRA-LUXURY 3D HERO SECTION ─── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center pt-32 sm:pt-40 pb-20 px-6 z-10"
        >
          <motion.div
            style={{
              opacity: heroOpacity,
              scale: heroScale,
              filter: heroBlur,
            }}
            className="relative mx-auto max-w-7xl w-full"
          >
            <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
              {/* Left Text Block */}
              <div className="text-left space-y-7">
                {/* Eyebrow Pill */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl text-xs font-bold text-[#FF6B2C]"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B2C]" />
                  </span>
                  <span>HOW MEDTECH FIXATERS WORKS</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-semibold">End-to-End Clinical Flow</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-slate-900 leading-[1.06]"
                >
                  One Connected
                  <br />
                  Platform.
                  <br />
                  <span className="bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#2563EB] bg-clip-text text-transparent">
                    Three Distinct Journeys.
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="max-w-xl text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
                >
                  MedTech Fixaters bridges patients, hospitals, and physicians through a unified AI-powered ecosystem. Every user gets dedicated workflows, real-time sync, and cryptographic isolation.
                </motion.p>

                {/* Live Telemetry Pill */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  className="p-3.5 rounded-2xl bg-white/70 border border-white/90 shadow-sm backdrop-blur-xl flex items-center gap-4 max-w-md"
                >
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[#FF6B2C] text-xs font-bold">
                      P
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 text-xs font-bold">
                      H
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600 text-xs font-bold">
                      D
                    </div>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Synchronized Live Queues</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Sub-second latency between Reception, Doctor Pad & Mobile
                    </p>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4 pt-2"
                >
                  <a
                    href="#patient"
                    className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B2C] text-white text-xs sm:text-sm font-bold shadow-[0_10px_30px_rgba(255,107,44,0.3)] transition-all flex items-center gap-2 hover:scale-105 active:scale-98"
                  >
                    <span>Explore The Journey</span>
                    <ArrowRight size={14} />
                  </a>

                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="px-7 py-3.5 rounded-2xl bg-white/80 border border-slate-200/90 text-slate-800 hover:text-blue-600 hover:border-blue-200 text-xs sm:text-sm font-bold shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl hover:bg-white transition-all cursor-pointer"
                  >
                    Book a Live Demo
                  </button>
                </motion.div>
              </div>

              {/* Right 3D Visual Scene */}
              <div className="relative h-[480px] sm:h-[600px] w-full flex items-center justify-center">
                <HealthcareScene />
              </div>
            </div>
          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-xs font-semibold text-slate-400"
          >
            <span>Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown size={15} />
            </motion.div>
          </motion.div>
        </section>

        {/* ─── 2. JOURNEY SELECTOR ─── */}
        <section className="relative px-6 py-24 z-10">
          <div className="mx-auto max-w-7xl">
            <JourneySelector />
          </div>
        </section>

        {/* ─── 3. PATIENT JOURNEY ─── */}
        <PatientJourney />

        {/* ─── 4. HOSPITAL JOURNEY ─── */}
        <HospitalJourney />

        {/* ─── 5. DOCTOR JOURNEY ─── */}
        <DoctorJourney />

        {/* ─── 6. AI POWERED WORKFLOWS ─── */}
        <AISystem />

        {/* ─── 7. DATA ISOLATION & SECURITY ─── */}
        <DataIsolation />

        {/* ─── 8. FINAL CALL TO ACTION ─── */}
        <FinalCTA onOpenDemo={() => setDemoModalOpen(true)} />
      </main>

      <PublicFooter />
      <ContactModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  )
}

function JourneySelector() {
  const items = [
    {
      icon: User,
      role: "01. PATIENT JOURNEY",
      title: "For Patients",
      text: "Instant QR check-in without mobile app download, real-time wait countdown, live queue tracking, and digital prescription access.",
      href: "#patient",
      badge: "Zero App Download",
      accent: "orange",
    },
    {
      icon: Building2,
      role: "02. HOSPITAL OPS",
      title: "For Hospitals",
      text: "Comprehensive hospital control room to manage doctor rosters, department queue traffic, reception staff handoffs, and revenue logs.",
      href: "#hospital",
      badge: "Multi-Department",
      accent: "blue",
    },
    {
      icon: Stethoscope,
      role: "03. CLINICAL DESK",
      title: "For Doctors",
      text: "Ultra-fast clinical workspace built for sub-30-second consultations, patient medical histories, clinical templates, and digital Rx signing.",
      href: "#doctor",
      badge: "Sub-30s Consultations",
      accent: "orange",
    },
  ]

  return (
    <div className="space-y-12">
      <div className="mx-auto max-w-3xl text-center space-y-3">
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600 inline-block shadow-2xs"
        >
          CHOOSE YOUR JOURNEY
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight"
        >
          One Platform.<br />
          <span className="bg-gradient-to-r from-[#FF6B2C] to-[#2563EB] bg-clip-text text-transparent">
            Built Around Every User.
          </span>
        </motion.h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = item.icon
          const isOrange = item.accent === "orange"

          return (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.015 }}
              className={`group relative rounded-[32px] border border-white/90 bg-white/75 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl text-left flex flex-col justify-between transition-all ${
                isOrange ? "hover:border-orange-300" : "hover:border-blue-300"
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${
                      isOrange
                        ? "bg-orange-50 text-[#FF6B2C] border border-orange-100"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}
                  >
                    <Icon size={26} />
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      isOrange
                        ? "bg-orange-50/80 text-[#FF6B2C] border-orange-200"
                        : "bg-blue-50/80 text-blue-600 border-blue-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-slate-400 block uppercase mb-1">
                    {item.role}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                    {item.text}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Explore journey workflow</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.a>
          )
        })}
      </div>
    </div>
  )
}
