import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  QrCode, Users, 
  ShieldCheck, FileText, Stethoscope, 
  CheckCircle2, ArrowRight, MessageSquare, Clock, 
  Check, 
  Sparkles, Building2, Lock, Printer,
  Activity, 
  CheckCircle, CalendarDays, Globe,
  Bot, Bell, Send, UserCog, IndianRupee, ArrowDown, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import ContactModal from '../components/ContactModal'
import DoctorDashboardSimulator from '../components/DoctorDashboardSimulator'
import { useSEO } from '../hooks/useSEO'

// ─── FRAMER MOTION PHYSICS & EASING ──────────────────────────────────
const springTransition = {
  type: "spring" as const,
  stiffness: 120,
  damping: 22,
};

const cardHoverMotion = {
  y: -8,
  scale: 1.015,
  transition: { duration: 0.25 },
};

const floatingMotion = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 1, 0],
  },
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function FeaturesPage() {
  useSEO({
    title: 'Platform Features — MedTech Fixaters | Connected Healthcare Operating System',
    description: 'Explore MedTech Fixaters in depth: Connected hospital administration, separate doctor workspaces, smart QR appointments, live queue management, and isolated multi-tenant security.',
  })

  const [modalOpen, setModalOpen] = useState(false)

  // Interactive Security Sandbox Toggle (Hospital H1 vs Hospital H2)
  const [activeTenant, setActiveTenant] = useState<'H1' | 'H2'>('H1')

  // Interactive AI Assistant Simulation Step
  const [aiStep, setAiStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setAiStep(prev => (prev < 4 ? prev + 1 : 0))
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  // Interactive Live Queue in Doctor Section
  const [doctorQueueToken, setDoctorQueueToken] = useState('A-012')
  const [doctorQueueCount, setDoctorQueueCount] = useState(3)

  const advanceDoctorQueue = () => {
    const nextNum = parseInt(doctorQueueToken.replace('A-0', '')) + 1
    setDoctorQueueToken(`A-0${nextNum}`)
    setDoctorQueueCount(prev => (prev > 0 ? prev - 1 : 4))
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#101828] font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      <PublicHeader />

      {/* ═════════════════════════════════════════════════════════════════════
          1. HERO SECTION: ALL THE TOOLS YOUR HOSPITAL NEEDS
      ═════════════════════════════════════════════ */}
      <section className="relative pt-36 sm:pt-44 pb-24 sm:pb-36 px-5 sm:px-8 lg:px-12 overflow-hidden text-center">
        {/* Ambient Left Orange & Right Blue Glows */}
        <div className="pointer-events-none absolute -left-20 top-20 h-[500px] w-[500px] rounded-full bg-[#FF6B2C]/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-20 top-20 h-[550px] w-[550px] rounded-full bg-[#2563EB]/20 blur-[140px]" />

        {/* Subtle Grid Texture */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03]" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={springTransition}
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.14em] text-[#2563EB] shadow-2xs backdrop-blur-xl"
          >
            <Sparkles size={14} className="text-[#FF6B2C] animate-pulse" />
            <span>AI-POWERED HEALTHCARE OPERATING SYSTEM</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="text-4xl sm:text-6xl lg:text-[66px] font-extrabold tracking-tight text-[#101828] leading-[1.08]"
          >
            All The Tools Your Hospital Needs.
            <span className="block bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#FF6B2C] bg-clip-text text-transparent">
              Connected In One AI-Powered Platform.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-sm sm:text-base text-[#667085] max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Manage doctors, patients, appointments, queues, hospital operations, and AI-assisted workflows through one connected digital system.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4"
          >
            <a
              href="#core-features"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Features</span>
              <ArrowDown size={14} />
            </a>

            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8A4C] hover:from-[#E65100] hover:to-[#FF6B2C] text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book a Demo</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>

        {/* ── Interactive Live Doctor & Hospital OS Simulator ── */}
        <div id="simulator" className="mt-16 max-w-7xl mx-auto relative z-10 scroll-mt-28">
          <DoctorDashboardSimulator />
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          2. CORE PLATFORM FEATURES (6 GLASS CARDS)
      ═════════════════════════════════════════════ */}
      <section id="core-features" className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={springTransition}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#2563EB]">
            <span>CORE PLATFORM ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
            Everything Connected.<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
              Built For Every Workflow.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
            One system connects hospitals, doctors, patients, and daily operations without data overlap.
          </p>
        </motion.div>

        {/* 6 Glass Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Bot,
              title: "AI-Powered Hospital Management",
              desc: "Use AI to organize workflows, appointments, notifications, and operational activity across all departments.",
              accent: "orange",
              iconBg: "from-[#FF6B2C] to-[#FF8A4C]",
              badge: "MedTech AI Core"
            },
            {
              icon: QrCode,
              title: "Smart QR Appointment System",
              desc: "Every hospital receives a unique QR code and appointment link. Patients scanning the QR only see doctors from that specific hospital.",
              accent: "blue",
              iconBg: "from-[#2563EB] to-[#60A5FA]",
              badge: "Hospital-Isolated"
            },
            {
              icon: MessageSquare,
              title: "AI-Guided Patient Booking",
              desc: "Patients share symptoms with MedTech AI. The system guides them toward the appropriate department or doctor before booking.",
              accent: "orange",
              iconBg: "from-[#FF6B2C] to-[#FF8A4C]",
              badge: "Intelligent Triage"
            },
            {
              icon: Clock,
              title: "Live Queue Management",
              desc: "Every doctor receives an independent live patient queue. Queue positions update automatically after consultations.",
              accent: "blue",
              iconBg: "from-[#2563EB] to-[#60A5FA]",
              badge: "Real-Time Tracking"
            },
            {
              icon: Lock,
              title: "Doctor Private Workspace",
              desc: "Every doctor receives an independent dashboard. Doctors only access their assigned appointments and patients.",
              accent: "orange",
              iconBg: "from-[#FF6B2C] to-[#FF8A4C]",
              badge: "Private Access"
            },
            {
              icon: ShieldCheck,
              title: "Hospital Data Separation",
              desc: "Each hospital operates inside an isolated workspace. Hospital H1 cannot access H2 data. Strict cryptographic separation.",
              accent: "blue",
              iconBg: "from-[#2563EB] to-[#60A5FA]",
              badge: "Row-Level Security"
            },
            {
              icon: Users,
              title: "Inbuilt Hospital & Patient CRM",
              desc: "360° patient relationship tracking, automated WhatsApp recall reminders, chronic care follow-ups, and retention analytics built right into your OPD.",
              accent: "orange",
              iconBg: "from-[#FF6B2C] to-[#FF8A4C]",
              badge: "Inbuilt CRM Suite"
            },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 20,
                  delay: idx * 0.08,
                }}
                whileHover={cardHoverMotion}
                className="group relative rounded-[28px] border border-white/80 bg-white/70 p-7 shadow-[0_10px_35px_rgba(15,23,42,0.04)] backdrop-blur-xl flex flex-col justify-between text-left"
              >
                {/* Subtle Hover Spotlight */}
                <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
                  item.accent === 'orange' ? 'bg-[#FF6B2C]/20' : 'bg-[#2563EB]/20'
                }`} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.08 }}
                      transition={springTransition}
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.iconBg} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon size={22} />
                    </motion.div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-[#667085]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#101828]">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs font-bold">
                  <span className={item.accent === 'orange' ? 'text-[#FF6B2C]' : 'text-[#2563EB]'}>
                    Learn workflow →
                  </span>
                  <span className="text-slate-300 font-mono text-[11px]">0{idx + 1}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          3. AI FEATURES SECTION (SPLIT SCREEN SHOWCASE)
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 bg-white border-y border-slate-200/70 relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#FF6B2C]/15 blur-[140px]" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#2563EB]/15 blur-[140px]" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: AI Capabilities */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={springTransition}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-xs font-bold text-[#FF6B2C]">
              <Sparkles size={14} />
              <span>MEDTECH FIXATERS AI CORE</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
              MedTech AI.<br />
              <span className="bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#2563EB] bg-clip-text text-transparent">
                Working Across Your Hospital.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              AI supports patient booking, symptom intake, doctor routing, automated notifications, workflow management, and patient communication.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "AI symptom intake",
                "Intelligent doctor suggestions",
                "Automated appointment routing",
                "AI-generated patient summaries",
                "Smart follow-ups",
                "Automated notifications"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F8FC] border border-slate-200/70">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B2C]/10 text-[#FF6B2C] flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-bold text-[#101828]">{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Interactive AI Assistant Simulator */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={springTransition}
            className="lg:col-span-6"
          >
            <div className="rounded-[32px] bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-5 text-left relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF8A4C] text-white flex items-center justify-center shadow-md">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#101828]">MedTech AI Assistant</h4>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Active Clinical Routing
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6B2C] border border-orange-100">
                  Live Intake Flow
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-3 min-h-[220px]">
                {/* Bot Message 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-[#F7F8FC] border border-slate-200/70 text-xs text-[#101828] max-w-[85%]"
                >
                  <span className="font-bold text-[11px] text-[#FF6B2C] block mb-1">MedTech AI</span>
                  How can I help you today? Please share your primary symptoms.
                </motion.div>

                {/* Patient Response */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3.5 rounded-2xl bg-[#2563EB] text-white text-xs ml-auto max-w-[85%] shadow-sm"
                >
                  Patient needs an appointment for fever and continuous headache since yesterday.
                </motion.div>

                {/* AI Analysis Progress Line */}
                <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100/80 flex items-center gap-3">
                  <Sparkles size={16} className="text-[#FF6B2C] animate-spin" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] font-bold text-[#FF6B2C] mb-1">
                      <span>AI Analysis Running</span>
                      <span>Matching Specialist...</span>
                    </div>
                    <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-full w-1/2 bg-gradient-to-r from-[#FF6B2C] to-[#FF8A4C] rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Recommendation Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 rounded-2xl bg-white border border-blue-100 shadow-md space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-[#667085] uppercase block">Recommended Department</span>
                      <span className="font-bold text-sm text-[#101828]">General Medicine</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      High Confidence Match
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                        AP
                      </div>
                      <div>
                        <span className="font-bold text-[#101828] block">Dr. Arjun Patel</span>
                        <span className="text-[10px] text-[#667085]">Room 102 • OPD Wing A</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#667085] block">Queue Position</span>
                      <span className="font-mono font-bold text-[#FF6B2C] text-sm">Token A-013</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          4. HOSPITAL MANAGEMENT FEATURES
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={springTransition}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#2563EB]">
            <span>ADMINISTRATIVE COMMAND</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
            Complete Control.<br />
            <span className="bg-gradient-to-r from-[#2563EB] via-indigo-600 to-[#FF6B2C] bg-clip-text text-transparent">
              One Hospital Dashboard.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
            Monitor real-time patient throughput, manage doctors, review revenue performance, and control hospital access from a single pane of glass.
          </p>
        </motion.div>

        {/* 6 Surrounding Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: Users,
              title: "Doctor Management",
              desc: "Manage doctor profiles, room assignments, active duty schedules, and operational access across departments."
            },
            {
              icon: FileText,
              title: "Patient Records",
              desc: "Access historical OPD encounters, vitals logs, chronic conditions, and previous prescriptions in seconds."
            },
            {
              icon: CalendarDays,
              title: "Appointment Tracking",
              desc: "Track every appointment across walk-ins, smart QR check-ins, and online patient bookings."
            },
            {
              icon: IndianRupee,
              title: "Revenue Insights",
              desc: "Review daily consultation receipts, department-wise billing totals, and financial performance summaries."
            },
            {
              icon: UserCog,
              title: "Staff Management",
              desc: "Control administrative and reception staff roles, permissions, and shift rosters with role-based access."
            },
            {
              icon: Activity,
              title: "Live Activity Stream",
              desc: "Monitor live hospital-wide actions including patient check-ins, doctor calls, and token completions."
            },
          ].map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...springTransition, delay: idx * 0.07 }}
                whileHover={cardHoverMotion}
                className="bg-white/80 p-7 rounded-[28px] border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl space-y-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shadow-2xs">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-bold text-[#101828]">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          5. DOCTOR FEATURES (CENTERED WORKSPACE)
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 bg-white border-y border-slate-200/70 relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/10 blur-[140px]" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={springTransition}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#2563EB]">
              <span>CLINICAL WORKSPACE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
              A Private Workspace<br />
              <span className="bg-gradient-to-r from-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
                For Every Doctor.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              Designed specifically for fast consultations, clear patient queues, and instant paperless digital prescriptions.
            </p>
          </motion.div>

          {/* Centered Doctor Showcase Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 2 Feature Cards */}
            <div className="lg:col-span-4 space-y-5 text-left">
              <motion.div
                whileHover={cardHoverMotion}
                className="p-6 rounded-[26px] bg-[#F7F8FC] border border-slate-200/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2 text-[#2563EB] font-bold text-xs">
                  <CalendarDays size={16} />
                  <span>TODAY'S APPOINTMENTS</span>
                </div>
                <h4 className="font-bold text-base text-[#101828]">Assigned Patients Only</h4>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Doctors see only appointments scheduled specifically for their account and department. Zero clutter.
                </p>
              </motion.div>

              <motion.div
                whileHover={cardHoverMotion}
                className="p-6 rounded-[26px] bg-[#F7F8FC] border border-slate-200/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2 text-[#FF6B2C] font-bold text-xs">
                  <Clock size={16} />
                  <span>LIVE PATIENT QUEUE</span>
                </div>
                <h4 className="font-bold text-base text-[#101828]">Real-Time Token Flow</h4>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Queue positions and waiting counts update automatically as patients are called and consultations finish.
                </p>
              </motion.div>
            </div>

            {/* Center: Interactive Doctor Pad Console */}
            <div className="lg:col-span-4">
              <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] space-y-5 text-left relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      AS
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#101828] block">Dr. Amit Sharma</span>
                      <span className="text-[10px] text-[#667085]">Cardiology • Room 101</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    In Consultation
                  </span>
                </div>

                {/* Live Serving Token */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-100 text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider block">Now Serving Token</span>
                  <motion.div
                    key={doctorQueueToken}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-extrabold font-mono text-[#2563EB]"
                  >
                    {doctorQueueToken}
                  </motion.div>
                  <p className="text-[11px] text-[#667085] font-medium">{doctorQueueCount} Patients Waiting in Lounge</p>

                  <button
                    onClick={advanceDoctorQueue}
                    className="w-full py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Call Next Patient ({doctorQueueToken})</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right 2 Feature Cards */}
            <div className="lg:col-span-4 space-y-5 text-left">
              <motion.div
                whileHover={cardHoverMotion}
                className="p-6 rounded-[26px] bg-[#F7F8FC] border border-slate-200/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2 text-[#2563EB] font-bold text-xs">
                  <FileText size={16} />
                  <span>MEDICAL HISTORY</span>
                </div>
                <h4 className="font-bold text-base text-[#101828]">Complete Clinical Timeline</h4>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Instant access to previous diagnosis, laboratory investigations, allergy alerts, and prescription archives.
                </p>
              </motion.div>

              <motion.div
                whileHover={cardHoverMotion}
                className="p-6 rounded-[26px] bg-[#F7F8FC] border border-slate-200/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2 text-[#FF6B2C] font-bold text-xs">
                  <Printer size={16} />
                  <span>DIGITAL PRESCRIPTIONS</span>
                </div>
                <h4 className="font-bold text-base text-[#101828]">30-Second Rx Generation</h4>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Generate structured e-prescriptions with dosage instructions and automatic WhatsApp PDF delivery to patient mobile.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          6. PATIENT FEATURES (HORIZONTAL CONNECTED JOURNEY)
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={springTransition}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-xs font-bold text-[#FF6B2C]">
            <span>OUTPATIENT EXPERIENCE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
            A Better Patient Journey.<br />
            <span className="bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#2563EB] bg-clip-text text-transparent">
              From Booking To Reports.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
            Eliminate waiting lines and paper slips with a seamless 6-step digital patient flow.
          </p>
        </motion.div>

        {/* 6 Step Horizontal Journey Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-left">
          {[
            { step: '01', title: 'Scan QR', desc: 'Scan hospital acrylic standee with phone camera.', color: 'orange' },
            { step: '02', title: 'AI Booking', desc: 'Share symptoms or pick preferred OPD department.', color: 'blue' },
            { step: '03', title: 'Select Doctor', desc: 'Browse available consultants and real wait time.', color: 'orange' },
            { step: '04', title: 'Live Queue', desc: 'Receive live token number with wait countdown.', color: 'blue' },
            { step: '05', title: 'Consultation', desc: 'Doctor reviews records on private clinical pad.', color: 'orange' },
            { step: '06', title: 'Digital Reports', desc: 'Prescription & reports delivered on WhatsApp.', color: 'blue' },
          ].map((st, i) => (
            <motion.div
              key={st.step}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              whileHover={cardHoverMotion}
              className="p-5 rounded-[24px] bg-white/80 border border-slate-200/80 shadow-[0_8px_25px_rgba(15,23,42,0.03)] backdrop-blur-xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                    st.color === 'orange' ? 'bg-orange-50 text-[#FF6B2C]' : 'bg-blue-50 text-[#2563EB]'
                  }`}>
                    {st.step}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    st.color === 'orange' ? 'bg-[#FF6B2C]' : 'bg-[#2563EB]'
                  }`} />
                </div>
                <h4 className="font-bold text-sm text-[#101828] mt-3">{st.title}</h4>
                <p className="text-xs text-[#667085] leading-relaxed mt-1">{st.desc}</p>
              </div>
              <span className={`text-[10px] font-bold ${
                st.color === 'orange' ? 'text-[#FF6B2C]' : 'text-[#2563EB]'
              }`}>
                {st.color === 'orange' ? '● Patient Action' : '● System Telemetry'}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          7. INBUILT HOSPITAL & PATIENT CRM SYSTEM
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={springTransition}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-xs font-bold text-[#FF6B2C]">
            <Users size={13} />
            <span>INBUILT HEALTHCARE CRM</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
            Retain Patients. Automate Recalls.<br />
            <span className="bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#2563EB] bg-clip-text text-transparent">
              Built In Without Third-Party Software.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
            A complete patient relationship management suite designed for clinics and hospitals. Run automated follow-up sequences, WhatsApp reminders, chronic care recalls, and patient lifetime engagement.
          </p>
        </motion.div>

        {/* 4 Rich CRM Feature Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            {
              title: "360° Patient Profiles",
              desc: "Unified clinical timeline, past consultation notes, lab results, prescriptions, and communication logs in one searchable record.",
              tag: "Complete History",
              color: "blue",
            },
            {
              title: "Automated WhatsApp Recalls",
              desc: "Trigger automated follow-up reminders 48h before appointments, medication refills, and preventative health checkup alerts.",
              tag: "Zero Manual Effort",
              color: "orange",
            },
            {
              title: "Chronic Care Sequences",
              desc: "Automated care pathways for Hypertension, Diabetes, and Post-Op patients to ensure periodic vitals logging and reviews.",
              tag: "Clinical Retention",
              color: "blue",
            },
            {
              title: "Patient NPS & Feedback",
              desc: "Instant post-consultation WhatsApp feedback collection to track doctor ratings, OPD satisfaction, and service quality.",
              tag: "Quality Assurance",
              color: "orange",
            },
          ].map((crm, i) => (
            <motion.div
              key={i}
              whileHover={cardHoverMotion}
              className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  crm.color === 'orange' ? 'bg-orange-50 text-[#FF6B2C]' : 'bg-blue-50 text-[#2563EB]'
                }`}>
                  {crm.tag}
                </span>
                <h4 className="font-bold text-base text-[#101828] pt-2">{crm.title}</h4>
                <p className="text-xs text-[#667085] leading-relaxed">{crm.desc}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2563EB]">
                <span>Automated Workflow</span>
                <CheckCircle2 size={15} className="text-emerald-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          8. SECURITY AND DATA SEPARATION (MULTI-TENANT SANDBOX)
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 bg-white border-y border-slate-200/70 relative overflow-hidden">
        <div className="pointer-events-none absolute right-10 top-10 h-80 w-80 rounded-full bg-blue-100/40 blur-[130px]" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={springTransition}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#2563EB]">
              <Lock size={13} />
              <span>CRYPTOGRAPHIC DATA SEPARATION</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
              Your Data.<br />
              <span className="bg-gradient-to-r from-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
                Inside The Right Workspace.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              Strict multi-tenant architecture ensures hospital data never overlaps or leaks between medical facilities.
            </p>
          </motion.div>

          {/* Interactive Multi-Tenant Hierarchy Visual */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Master Platform Admin Node */}
            <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-slate-200/80 max-w-sm mx-auto text-center shadow-xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Central Infrastructure</span>
              <span className="font-bold text-xs text-[#101828]">Platform Administration Console</span>
            </div>

            {/* Split Pods: Hospital H1 vs Hospital H2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Hospital H1 Sandbox */}
              <motion.div
                whileHover={cardHoverMotion}
                className="p-7 rounded-[28px] bg-white border-2 border-blue-200 shadow-[0_10px_35px_rgba(37,99,235,0.06)] space-y-5 relative"
              >
                <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="text-[#2563EB]" />
                    <span className="font-bold text-sm text-[#101828]">Hospital H1 (Metro Care)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
                    RLS Tenant #H1
                  </span>
                </div>

                {/* Sub-node Doctors */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-slate-200/70 text-center font-bold text-[#101828]">
                    Doctor H1D1
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-slate-200/70 text-center font-bold text-[#101828]">
                    Doctor H1D2
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
                  <span className="font-bold text-[11px] text-[#2563EB] block">H1 Isolated Data Sandbox:</span>
                  <p className="text-[11.5px] text-[#667085]">✓ 1,240 Hospital Patients</p>
                  <p className="text-[11.5px] text-[#667085]">✓ Dedicated Token Queues</p>
                  <p className="text-[11.5px] text-[#667085]">✓ Private Prescriptions & Records</p>
                </div>

                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                  <Lock size={13} />
                  <span>Nothing overlaps with Hospital H2</span>
                </div>
              </motion.div>

              {/* Hospital H2 Sandbox */}
              <motion.div
                whileHover={cardHoverMotion}
                className="p-7 rounded-[28px] bg-white border-2 border-orange-200 shadow-[0_10px_35px_rgba(255,107,44,0.06)] space-y-5 relative"
              >
                <div className="flex items-center justify-between border-b border-orange-50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="text-[#FF6B2C]" />
                    <span className="font-bold text-sm text-[#101828]">Hospital H2 (Apex Clinic)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B2C] border border-orange-100">
                    RLS Tenant #H2
                  </span>
                </div>

                {/* Sub-node Doctors */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-slate-200/70 text-center font-bold text-[#101828]">
                    Doctor H2D1
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-slate-200/70 text-center font-bold text-[#101828]">
                    Doctor H2D2
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 text-xs space-y-1.5">
                  <span className="font-bold text-[11px] text-[#FF6B2C] block">H2 Isolated Data Sandbox:</span>
                  <p className="text-[11.5px] text-[#667085]">✓ 890 Hospital Patients</p>
                  <p className="text-[11.5px] text-[#667085]">✓ Dedicated Token Queues</p>
                  <p className="text-[11.5px] text-[#667085]">✓ Private Prescriptions & Records</p>
                </div>

                <div className="text-[11px] font-bold text-[#FF6B2C] flex items-center gap-1.5">
                  <Lock size={13} />
                  <span>Nothing overlaps with Hospital H1</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          8. AUTOMATION AND NOTIFICATIONS
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={springTransition}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-xs font-bold text-[#FF6B2C]">
            <Bell size={13} />
            <span>INTELLIGENT AUTOMATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
            Your Hospital Keeps Moving.<br />
            <span className="bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#2563EB] bg-clip-text text-transparent">
              Even When You Are Busy.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
            Automated alerts, WhatsApp reminders, and real-time operational notifications keep everyone informed.
          </p>
        </motion.div>

        {/* 5 Automation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {[
            {
              title: "Auto Follow-Up",
              desc: "Send follow-up reminders based on appointments or patient workflows automatically without manual staff intervention.",
              badge: "Automated"
            },
            {
              title: "Patient Notifications",
              desc: "Notify patients about appointment confirmations, live queue shifts, token calling, and digital reports via WhatsApp.",
              badge: "WhatsApp PDF"
            },
            {
              title: "Doctor Notifications",
              desc: "Alert doctors about new bookings, patient arrivals in the lounge, and schedule adjustments in real time.",
              badge: "Console & SMS"
            },
            {
              title: "Hospital Alerts",
              desc: "Keep hospital administration teams informed about critical operational spikes, waiting bottlenecks, and revenue metrics.",
              badge: "System Alert"
            },
            {
              title: "Staff Communication",
              desc: "Broadcast OPD updates and shift announcements to assigned reception, nursing, and billing staff.",
              badge: "Internal Mesh"
            },
            {
              title: "Live Notification Dispatcher",
              desc: "Real-time automated dispatcher sending instantaneous triggers to patient smartphones.",
              badge: "Active Telemetry"
            },
          ].map((notif, idx) => (
            <motion.div
              key={notif.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ ...springTransition, delay: idx * 0.07 }}
              whileHover={cardHoverMotion}
              className="p-7 rounded-[26px] bg-white/80 border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#FF8A4C] text-white flex items-center justify-center shadow-xs">
                  <Bell size={18} />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B2C] border border-orange-100">
                  {notif.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#101828]">{notif.title}</h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">{notif.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          9. FULL FEATURE COMPARISON MATRIX (4 COLUMNS)
      ═════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 bg-white border-y border-slate-200/70 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16 text-left">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={springTransition}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold text-[#2563EB]">
              <span>FEATURE COMPARISON</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#101828] leading-tight">
              One Platform.<br />
              <span className="bg-gradient-to-r from-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
                Every Essential Workflow.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              Explore the comprehensive suite of capabilities built into every role and layer.
            </p>
          </motion.div>

          {/* 4 Column Glass Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Hospital Column */}
            <motion.div
              whileHover={cardHoverMotion}
              className="p-7 rounded-[28px] bg-[#F7F8FC] border border-slate-200/80 space-y-5"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-3">
                <Building2 size={20} className="text-[#2563EB]" />
                <h4 className="font-bold text-base text-[#101828]">Hospital Admin</h4>
              </div>
              <ul className="space-y-3 text-xs text-[#667085]">
                {['Doctor management', 'Patient records vault', 'Revenue tracking', 'Staff management', 'Hospital analytics', 'QR standee management'].map((it, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <CheckCircle size={14} className="text-[#2563EB] shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Doctor Column */}
            <motion.div
              whileHover={cardHoverMotion}
              className="p-7 rounded-[28px] bg-[#F7F8FC] border border-slate-200/80 space-y-5"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-3">
                <Stethoscope size={20} className="text-[#FF6B2C]" />
                <h4 className="font-bold text-base text-[#101828]">Doctor Workspace</h4>
              </div>
              <ul className="space-y-3 text-xs text-[#667085]">
                {['Private workspace', 'Patient clinical history', 'Live queue calling', 'Digital prescriptions', 'Consultation management', 'WhatsApp Rx dispatch'].map((it, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <CheckCircle size={14} className="text-[#FF6B2C] shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Patient Column */}
            <motion.div
              whileHover={cardHoverMotion}
              className="p-7 rounded-[28px] bg-[#F7F8FC] border border-slate-200/80 space-y-5"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-3">
                <Users size={20} className="text-[#2563EB]" />
                <h4 className="font-bold text-base text-[#101828]">Patient Self-Service</h4>
              </div>
              <ul className="space-y-3 text-xs text-[#667085]">
                {['QR appointments', 'AI guidance', 'Live queue tracking', 'Digital reports', 'Appointment history', 'Zero-app requirement'].map((it, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <CheckCircle size={14} className="text-[#2563EB] shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* AI System Column */}
            <motion.div
              whileHover={cardHoverMotion}
              className="p-7 rounded-[28px] bg-[#F7F8FC] border border-slate-200/80 space-y-5"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-3">
                <Bot size={20} className="text-[#FF6B2C]" />
                <h4 className="font-bold text-base text-[#101828]">MedTech AI System</h4>
              </div>
              <ul className="space-y-3 text-xs text-[#667085]">
                {['Symptom intake', 'Doctor routing', 'Smart booking', 'Automated follow-ups', 'WhatsApp notifications', 'Operational analytics'].map((it, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <CheckCircle size={14} className="text-[#FF6B2C] shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          10. FINAL CTA: READY TO CONNECT YOUR HOSPITAL DIGITALLY?
      ═════════════════════════════════════════════ */}
      <section className="py-24 px-5 sm:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="bg-gradient-to-br from-[#2563EB] via-indigo-600 to-[#1D4ED8] text-white p-8 sm:p-14 rounded-[36px] text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Ambient Left Orange & Right Blue Glows */}
          <div className="pointer-events-none absolute -left-12 -top-12 w-60 h-60 bg-[#FF6B2C]/30 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -right-12 -bottom-12 w-60 h-60 bg-[#60A5FA]/30 rounded-full blur-3xl" />

          <span className="px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-bold tracking-wider inline-block">
            START YOUR DIGITAL TRANSFORMATION
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Ready To Connect Your Hospital Digitally?
          </h2>

          <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto font-normal leading-relaxed">
            Bring hospital operations, doctors, patients, AI booking, and live queues into one connected platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#FF6B2C] text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/30 hover:from-[#E65100] hover:to-[#FF6B2C] transition cursor-pointer"
            >
              Book a Demo
            </motion.button>

            <Link
              to="/how-it-works"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
            >
              <span>Explore Platform</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
