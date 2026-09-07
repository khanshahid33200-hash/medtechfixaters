import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Building2,
  Stethoscope,
  Users,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  QrCode,
  Layers,
  ArrowDown,
  Brain,
  Workflow,
  HeartHandshake,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  Radio
} from 'lucide-react'
import { motion } from 'framer-motion'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import ContactModal from '../components/ContactModal'
import About3DHeroScene from '../components/about3d/About3DHeroScene'
import About3DStoryScene from '../components/about3d/About3DStoryScene'
import About3DMissionSphere from '../components/about3d/About3DMissionSphere'
import About3DAICore from '../components/about3d/About3DAICore'
import { useSEO } from '../hooks/useSEO'

export default function AboutUsPage() {
  useSEO({
    title: 'About MedTech Fixaters — Connected Healthcare Technology',
    description:
      'MedTech Fixaters builds AI-powered digital systems that connect hospitals, doctors, patients, and healthcare workflows.',
  })

  const [contactModalOpen, setContactModalOpen] = useState(false)

  // Motion variants
  const reveal = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 110,
        damping: 22,
      },
    },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 font-sans antialiased selection:bg-[#0080E6] selection:text-white">
      <PublicHeader />

      {/* ─── 1. HERO SECTION WITH 3D INTERACTIVE THREE.JS LAYER ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-36 sm:pt-44 pb-24 px-6 overflow-hidden">
        {/* Three.js 3D Healthcare Canvas Layer */}
        <About3DHeroScene />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -left-20 w-[550px] h-[550px] bg-orange-400/15 rounded-full blur-[130px]" />
          <div className="absolute top-20 -right-20 w-[550px] h-[550px] bg-blue-500/15 rounded-full blur-[130px]" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-violet-400/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-7">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 border border-slate-200/80 shadow-2xs backdrop-blur-xl text-xs font-bold text-[#FF6B2C]"
          >
            <Sparkles size={14} className="animate-spin text-[#FF6B2C]" style={{ animationDuration: '6s' }} />
            <span>ABOUT MEDTECH FIXATERS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
            <span className="text-slate-600 font-semibold">3D Connected Healthcare</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.035em] text-[#101828] leading-[1.08]"
          >
            Building Connected<br />
            <span className="bg-gradient-to-r from-[#0080E6] via-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
              Healthcare Technology.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            MedTech Fixaters builds AI-powered digital systems that connect hospitals, doctors, patients, and healthcare workflows.
          </motion.p>

          {/* Floating Brand Glass Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.3 }}
            className="pt-2 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative p-5 sm:p-7 rounded-[30px] bg-white/80 border border-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl inline-flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-white to-blue-50/80 border border-slate-100 flex items-center justify-center shadow-md p-2 shrink-0">
                <img
                  src="/assets/brand-icon.png"
                  alt="MedTech Fixaters"
                  className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,128,230,0.3)]"
                />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block">
                  MedTech Fixaters
                </span>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 block">
                  Practical Healthcare Automation
                </span>
                <a
                  href="https://www.linkedin.com/posts/medtech-fixaters_healthcare-medtech-healthcareautomation-activity-7493168288701501440-DbnF?utm_source=chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B2C] hover:underline mt-0.5"
                >
                  <span>Public Announcement on LinkedIn</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link
              to="/features"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B2C] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-98"
            >
              <span>Explore MedTech Fixaters</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/contact"
              className="px-7 py-3.5 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs sm:text-sm font-bold shadow-2xs transition-all hover:bg-slate-50"
            >
              <span>Contact Us</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── 2. OUR STORY (WITH 3D TRANSFORMATION SCENE) ─── */}
      <section className="relative py-24 px-6 max-w-6xl mx-auto overflow-hidden">
        <About3DStoryScene />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Brand Story */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={reveal}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-[#FF6B2C] inline-block">
              OUR ORIGIN STORY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Healthcare Operations Should Feel Connected.
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              <p>
                MedTech Fixaters was built around a simple problem. Healthcare teams often spend valuable time moving between disconnected workflows, manual records, patient communication, appointments, and administrative tasks.
              </p>
              <p>
                Doctors shouldn't have to battle clunky software, receptionists shouldn't manage chaotic paper queues, and patients shouldn't wait blindly in crowded hallways.
              </p>
              <p className="font-semibold text-slate-800">
                Our focus is to build practical digital systems that bring these workflows together into one unified experience.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Animated Progression Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={containerVariants}
            className="lg:col-span-6 space-y-3"
          >
            {[
              {
                step: '01',
                title: 'Disconnected Systems',
                desc: 'Paper registers, manual phone call scheduling, and isolated reception desks.',
                badge: 'Legacy Friction',
                accent: 'border-rose-200 bg-rose-50/70 text-rose-700',
              },
              {
                step: '02',
                title: 'Connected Workflows',
                desc: 'QR-based patient check-ins and instant live token tracking across desks.',
                badge: 'Digitization',
                accent: 'border-orange-200 bg-orange-50/70 text-orange-700',
              },
              {
                step: '03',
                title: 'AI-Powered Operations',
                desc: 'Smart triage routing, sub-30-second prescriptions, and proactive OPD insights.',
                badge: 'MedTech Future',
                accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-700 font-bold',
              },
            ].map((st, idx) => (
              <motion.div
                key={st.step}
                variants={reveal}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative p-5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs backdrop-blur-xl flex items-center gap-4 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                  {st.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{st.title}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${st.accent}`}>
                      {st.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{st.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="absolute -bottom-3 left-9 z-10 w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ArrowDown size={8} className="text-blue-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 3. WHAT WE BUILD (4 FLOATING 3D GLASS CARDS) ─── */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="space-y-3 max-w-2xl mx-auto"
        >
          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600 inline-block">
            CORE PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Technology Built Around Real Healthcare Workflows.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
        >
          {/* Card 1: AI Healthcare Workflows */}
          <motion.div
            variants={reveal}
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 rounded-[30px] bg-white/85 border border-orange-200/80 shadow-[0_12px_40px_rgba(255,107,44,0.06)] backdrop-blur-xl relative overflow-hidden group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B2C] group-hover:scale-110 transition-transform">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">AI Healthcare Workflows</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AI-assisted systems for patient intake, intelligent routing, automation, and workflow support that eliminates receptionist bottlenecks.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-[#FF6B2C]">
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">Smart Triage</span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">Auto Summaries</span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">Speech AI</span>
            </div>
          </motion.div>

          {/* Card 2: Hospital Operations */}
          <motion.div
            variants={reveal}
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 rounded-[30px] bg-white/85 border border-blue-200/80 shadow-[0_12px_40px_rgba(0,128,230,0.06)] backdrop-blur-xl relative overflow-hidden group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Hospital Operations</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Connected tools for appointments, doctors, patients, queues, staff handoffs, and multi-department administration.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-blue-600">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">Live Queues</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">Roster System</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">Admin Control</span>
            </div>
          </motion.div>

          {/* Card 3: Patient Experience */}
          <motion.div
            variants={reveal}
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 rounded-[30px] bg-white/85 border border-orange-200/80 shadow-[0_12px_40px_rgba(255,107,44,0.06)] backdrop-blur-xl relative overflow-hidden group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B2C] group-hover:scale-110 transition-transform">
              <QrCode size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Patient Experience</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              QR access, digital appointments, live queues on personal devices, automated notifications, and online health records with zero app downloads.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-[#FF6B2C]">
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">Instant QR</span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">Live ETA</span>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">Digital Rx</span>
            </div>
          </motion.div>

          {/* Card 4: Doctor Workspaces */}
          <motion.div
            variants={reveal}
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 rounded-[30px] bg-white/85 border border-blue-200/80 shadow-[0_12px_40px_rgba(0,128,230,0.06)] backdrop-blur-xl relative overflow-hidden group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Stethoscope size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Doctor Workspaces</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Digital doctor workspaces for appointments, patient medical history, consultation workflows, and cryptographic digital prescriptions.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-blue-600">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">Sub-30s Rx</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">Templates</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">History Log</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── 4. OUR PRODUCT: INTRODUCING MEDTECH FIXATERS (3D ECOSYSTEM) ─── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="p-8 sm:p-14 rounded-[36px] bg-gradient-to-br from-white via-white/90 to-blue-50/50 border border-slate-200/90 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-2xl text-center space-y-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="space-y-3 max-w-2xl mx-auto"
          >
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-blue-100 text-[#FF6B2C] text-xs font-extrabold inline-block">
              FLAGSHIP PRODUCT
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Introducing MedTech Fixaters.
            </h2>
            <p className="text-base sm:text-lg font-bold text-blue-600">
              The Smart OPD and Reception Operating System by MedTech Fixaters.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-normal">
              MedTech Fixaters brings hospital administration, doctors, patients, appointments, live queues, and AI-assisted booking into one connected platform.
            </p>
          </motion.div>

          {/* Product Ecosystem 3D Tree Diagram */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="pt-6 max-w-4xl mx-auto space-y-6"
          >
            {/* Top Node: MEDTECH FIXATERS AI */}
            <div className="flex justify-center">
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0080E6] to-[#2563EB] text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2">
                <Brain size={18} />
                <span>MEDTECH FIXATERS AI</span>
              </div>
            </div>

            {/* Connecting Vertical Beam */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-slate-300 mx-auto" />

            {/* 3 Child Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-white border border-blue-100 shadow-2xs space-y-2 text-left"
              >
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <Building2 size={16} />
                  <span>Hospitals</span>
                </div>
                <div className="text-sm font-black text-slate-900">Operations</div>
                <p className="text-[11px] text-slate-500">Live queue dispatch, staff allocation & department metrics.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-2xs space-y-2 text-left"
              >
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <Stethoscope size={16} />
                  <span>Doctors</span>
                </div>
                <div className="text-sm font-black text-slate-900">Consultation</div>
                <p className="text-[11px] text-slate-500">One-click token advance, history lookup & digital prescriptions.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-white border border-orange-100 shadow-2xs space-y-2 text-left"
              >
                <div className="flex items-center gap-2 text-[#FF6B2C] font-bold text-xs">
                  <Users size={16} />
                  <span>Patients</span>
                </div>
                <div className="text-sm font-black text-slate-900">Booking</div>
                <p className="text-[11px] text-slate-500">Instant QR booking, real-time wait times & mobile Rx access.</p>
              </motion.div>
            </div>

            {/* Bottom Node: Connected System */}
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>Connected System</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 5. OUR MISSION (WITH 3D PARTICLE SPHERE) ─── */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto overflow-hidden">
        <About3DMissionSphere />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="relative z-10 p-10 sm:p-16 rounded-[36px] bg-gradient-to-br from-white/90 via-orange-50/40 to-blue-50/40 border border-white/90 shadow-[0_20px_60px_rgba(255,107,44,0.08)] backdrop-blur-2xl text-center space-y-6"
        >
          <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-blue-600 inline-block shadow-2xs">
            OUR MISSION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Technology That Connects Healthcare Workflows.
          </h2>
          <p className="text-base sm:text-xl font-semibold text-slate-700 max-w-2xl mx-auto leading-relaxed">
            To reduce unnecessary complexity in healthcare workflows through practical digital systems and AI-assisted technology.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <span className="w-12 h-1.5 rounded-full bg-[#FF6B2C]" />
            <span className="w-4 h-1.5 rounded-full bg-[#0080E6]" />
          </div>
        </motion.div>
      </section>

      {/* ─── 6. OUR VISION (3 CONNECTED GLASS PANELS) ─── */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="space-y-3 max-w-2xl mx-auto"
        >
          <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-purple-600 inline-block">
            OUR VISION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            A More Connected Healthcare Experience.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
            We aim to support a healthcare system where patients move through appointments with greater clarity, doctors work from organized digital tools, and hospitals manage operations from connected systems.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Patient Experience',
              desc: 'Transparent wait times, automated queue updates, and zero bench anxiety.',
              icon: Users,
              accent: 'border-orange-200/80 hover:border-orange-300 text-[#FF6B2C]',
            },
            {
              title: 'Doctor Workflow',
              desc: 'Organized clinical queues, quick templates, and sub-30-second digital prescribing.',
              icon: Stethoscope,
              accent: 'border-blue-200/80 hover:border-blue-300 text-blue-600',
            },
            {
              title: 'Hospital Operations',
              desc: 'Live footfall tracking, department telemetry, and instant administrative control.',
              icon: Building2,
              accent: 'border-indigo-200/80 hover:border-indigo-300 text-indigo-600',
            },
          ].map(panel => {
            const Icon = panel.icon
            return (
              <motion.div
                key={panel.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={reveal}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`p-8 rounded-[28px] bg-white/85 border ${panel.accent} shadow-xs backdrop-blur-xl space-y-4 text-left transition-all`}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900">{panel.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{panel.desc}</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <Cpu size={12} className="text-blue-500" />
                  <span>Central AI Synchronization</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ─── 7. WHAT WE BELIEVE (4 COMPACT CARDS) ─── */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="space-y-3 max-w-2xl mx-auto"
        >
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 inline-block">
            GUIDING PRINCIPLES
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Technology Should Work For Healthcare Teams.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {[
            {
              title: 'Simple Workflows',
              desc: 'Technology should reduce unnecessary steps.',
              icon: Zap,
              color: 'text-orange-600 bg-orange-50',
            },
            {
              title: 'Connected Information',
              desc: 'The right information should reach the right workspace.',
              icon: Workflow,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              title: 'Responsible AI',
              desc: 'AI should support healthcare workflows and human decision-making.',
              icon: Brain,
              color: 'text-violet-600 bg-violet-50',
            },
            {
              title: 'Better Experiences',
              desc: 'Digital systems should make processes easier for patients and healthcare teams.',
              icon: HeartHandshake,
              color: 'text-emerald-600 bg-emerald-50',
            },
          ].map(card => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={reveal}
                whileHover={{ y: -6 }}
                className="p-6 rounded-3xl bg-white/85 border border-slate-200/90 shadow-xs backdrop-blur-xl space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-black text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{card.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ─── 8. HOW WE THINK ABOUT AI (WITH 3D AI CORE LAYER) ─── */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto space-y-10 text-center overflow-hidden">
        <About3DAICore />

        <div className="relative z-10 space-y-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="space-y-3 max-w-2xl mx-auto"
          >
            <span className="px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-bold text-violet-600 inline-block">
              AI PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              AI That Supports. Not Replaces.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal">
              At MedTech Fixaters, AI is designed to assist workflows.
            </p>
          </motion.div>

          {/* Animated AI Workflow Step Progression */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="p-8 sm:p-10 rounded-3xl bg-white/90 border border-slate-200/90 shadow-lg backdrop-blur-2xl space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-center">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-1">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase">Input</span>
                <div className="text-xs font-bold text-slate-900">Patient Input</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 mx-auto hidden sm:block" />
              <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-100 space-y-1">
                <span className="text-[10px] font-extrabold text-violet-600 uppercase">Processing</span>
                <div className="text-xs font-bold text-slate-900">AI-Assisted Processing</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 mx-auto hidden sm:block" />
              <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-100 space-y-1">
                <span className="text-[10px] font-extrabold text-[#FF6B2C] uppercase">Organization</span>
                <div className="text-xs font-bold text-slate-900">Organized Information</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 mx-auto hidden sm:block" />
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase">Routing</span>
                <div className="text-xs font-bold text-slate-900">Relevant Workflow</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 mx-auto hidden sm:block" />
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Action</span>
                <div className="text-xs font-bold text-slate-900">Human Decision</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium italic pt-2 border-t border-slate-100">
              * AI-generated guidance should support healthcare workflows and should not replace professional medical judgment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── 9. OUR APPROACH (HORIZONTAL SCROLL ON DESKTOP) ─── */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-12 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="space-y-3 max-w-2xl mx-auto"
        >
          <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-[#FF6B2C] inline-block">
            FROM PROBLEM TO PRACTICAL SOLUTION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Our Approach.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            {
              num: '01',
              title: 'Understand the workflow',
              desc: 'Analyze patient touchpoints, reception queues, and doctor ergonomics on ground.',
            },
            {
              num: '02',
              title: 'Identify unnecessary manual steps',
              desc: 'Pinpoint redundant phone calls, paper slips, and duplicate record entries.',
            },
            {
              num: '03',
              title: 'Design a connected digital process',
              desc: 'Synchronize receptionists, doctors, and patients in real-time cloud states.',
            },
            {
              num: '04',
              title: 'Add AI where meaningful',
              desc: 'Deploy intelligent automation to elevate clinical speed and patient clarity.',
            },
          ].map(step => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={reveal}
              whileHover={{ y: -6 }}
              className="p-7 rounded-3xl bg-white/85 border border-slate-200/90 shadow-xs backdrop-blur-xl space-y-3"
            >
              <span className="text-3xl font-black text-[#FF6B2C] font-mono block">
                {step.num}
              </span>
              <h3 className="text-base font-black text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── 10. FINAL BRAND SECTION ─── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="relative p-10 sm:p-16 rounded-[36px] bg-white/90 border border-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl text-center space-y-7 overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400/20 rounded-full blur-[90px]" />
          <div className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[90px]" />

          {/* Floating Brand Logo */}
          <div className="flex justify-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center p-3"
            >
              <img
                src="/assets/brand-icon.png"
                alt="MedTech Fixaters"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Building The Future Of<br />Connected Healthcare.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-md mx-auto">
              MedTech Fixaters focuses on practical technology, connected workflows, and AI-assisted healthcare systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/features"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B2C] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-98"
            >
              <span>Explore MedTech Fixaters</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/contact"
              className="px-7 py-3.5 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs sm:text-sm font-bold shadow-2xs transition-all hover:bg-slate-50"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  )
}
