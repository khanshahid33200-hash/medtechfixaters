import AIAutomationSection from '../components/AIAutomationSection'
import FAQSection from '../components/FAQSection'
import QRAppointmentShowcase from '../components/QRAppointmentShowcase'
import KeyBenefits from '../components/KeyBenefits'
import ConnectedSystemSection from '../components/ConnectedSystemSection'
import HowPlatformWorks from '../components/HowPlatformWorks'
import WhatWeSolveSection from '../components/what-we-solve/WhatWeSolveSection'
import DoctorDashboardSimulator from '../components/DoctorDashboardSimulator'
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  QrCode, RefreshCw, UserCheck, Users, BarChart3,
  Building2, Calendar, ShieldCheck, FileText,
  Clock, Stethoscope, ArrowRight, Play, CheckCircle2,
  HeartPulse, ChevronRight, X, Phone, Mail,
  Volume2, Check, Sparkles, Send, Activity, Settings,
  Search, Plus, Printer, Download, TrendingUp,
  AlertCircle, Eye, Lock, ChevronDown, Star, Shield,
  Database, Cpu, Smartphone, Layers, ArrowUpRight,
  Award, Zap, MessageSquare, Sliders, CheckCheck,
  MousePointer2, Palette, Wand2, Compass, MoreVertical,
  Paperclip, Filter, CheckCircle, Globe2, ChevronLeft,
  Bell, HelpCircle, Briefcase, User, Laptop
} from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import { useSEO } from '../hooks/useSEO'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import ContactModal from '../components/ContactModal'

// ─── MOTION INFUSER SUITE ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 18,
      delay: custom * 0.08,
    },
  }),
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (custom = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 110,
      damping: 20,
      delay: custom * 0.08,
    },
  }),
}

/** Animated number counter on scroll into view */
function AnimatedCounter({ value, suffix = '', duration = 1400 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView) return
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * value))
      if (progress < 1) window.requestAnimationFrame(step)
    }
    window.requestAnimationFrame(step)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function LandingPage() {
  useSEO({
    title: 'MedTech Fixaters — Your Hospital. Connected Digitally',
    description: 'A connected digital healthcare platform where hospitals manage operations, doctors manage appointments and patients, and patients book via unique hospital QR codes.',
  })

  const { scrollYProgress } = useScroll()
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  // ─── SCROLL PARALLAX & HERO FADE TRANSITIONS ─────────────────────
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.05])
  const heroScale = useTransform(scrollYProgress, [0, 0.22], [1, 0.94])
  const heroTranslateY = useTransform(scrollYProgress, [0, 0.22], [0, -80])

  return (
    <div className="min-h-screen bg-[#0E0B0A] text-slate-100 font-sans antialiased selection:bg-[#5B4DF5] selection:text-white relative overflow-x-hidden">
      {/* Top Scroll Indicator */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#5B4DF5] to-indigo-400 origin-left z-[100] pointer-events-none"
      />

      {/* Floating Glassmorphism Navbar */}
      <PublicHeader />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO SECTION (EXACT AS NEW REFERENCE IMAGE)
          Dark charcoal backdrop, warm orange/bronze backlight, left typography,
          four live stat cards, 3D laptop with dashboard + overlapping phone
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundImage: "url('/assets/hero-hospital-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
        className="relative pt-32 sm:pt-40 pb-40 sm:pb-52 lg:pb-64 px-6 overflow-hidden"
      >
        {/* Soft Vignette Overlay for Crisp Typography Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none z-0" />

        {/* Hero Content Container with Scroll Fade */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroTranslateY }}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10"
        >
          {/* ─── LEFT COLUMN: CLEAN HEADLINE, DESCRIPTION & DUAL CTAS (NO PILLS) ─── */}
          <div className="lg:col-span-6 text-left space-y-6">
            {/* AI Platform Badge with Inbuilt CRM Highlight */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 backdrop-blur-md shadow-xs"
            >
              <Sparkles size={13} className="text-amber-400 animate-pulse" />
              <span className="text-[10.5px] font-bold tracking-[0.14em] text-amber-300 uppercase">
                AI-POWERED HEALTHCARE OS
              </span>
              <span className="text-amber-400/60">•</span>
              <span className="text-[10.5px] font-bold tracking-[0.12em] text-orange-200 uppercase">
                INBUILT PATIENT CRM
              </span>
            </motion.div>
            {/* Main Headline */}
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-6xl lg:text-[70px] font-black tracking-[-0.035em] text-white leading-[1.08]"
            >
              Your Hospital.<br />
              <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                Connected Digitally.
              </span>
            </motion.h1>

            {/* Product description featuring Inbuilt CRM */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="space-y-2 max-w-lg"
            >
              <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed">
                One AI-powered connected platform for hospital administration, <strong>inbuilt patient CRM</strong>, doctor workspaces, intelligent booking, automated workflows, and live queues.
              </p>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium leading-relaxed">
                360° patient journey tracking, automated WhatsApp recall campaigns, and chronic care management built directly in.
              </p>
            </motion.div>

            {/* Dual CTA Buttons with Simulation Trigger */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="pt-2 flex flex-col sm:flex-row items-center gap-3.5"
            >
              <Link to="/book-demo" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF8533] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B00] text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/35 transition-all flex items-center justify-center gap-2"
                >
                  <span>Book a Demo</span>
                  <ArrowRight size={15} />
                </motion.button>
              </Link>

              <Link to="/features#simulator" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/15 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Play size={14} fill="currentColor" className="text-amber-400 ml-0.5" />
                  <span>Live Simulation</span>
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN: CLEAN TRANSPARENT LAPTOP & QR STANDEE (NO PILLS) ─── */}
          <div className="lg:col-span-6 relative flex items-center justify-center pt-8 lg:pt-0">
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full relative z-20 flex items-center justify-center"
            >
              <img
                src="/assets/hero-laptop-qr-showcase.png"
                alt="MedTech Fixaters Hospital Administration Dashboard and QR Standee"
                className="w-full max-w-[620px] object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.85)] filter select-none pointer-events-none"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            SMOOTH BOTTOM CURVE SECTION SEPARATOR
            Wide soft curve melting the dark hero into the light section
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg
            className="relative block w-full h-20 sm:h-28 lg:h-36 text-white fill-current"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C480,240 960,240 1440,0 L1440,320 L0,320 Z" />
          </svg>
          {/* Luminous Glowing Fog / Mist across the curve */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>
      </section>

      {/* ─── SECTION 2A: WHAT WE SOLVE ─── */}
      <WhatWeSolveSection />

      {/* ─── SECTION 2B: KEY BENEFITS (WHY MEDTECH FIXATERS) ─── */}
      <KeyBenefits />

      {/* ─── SECTION 2C: HOW PLATFORM WORKS ("One Platform. Different Journeys.") ─── */}
      <HowPlatformWorks />

      {/* ─── SECTION 3: QR APPOINTMENT SYSTEM ("One QR Code. AI-Guided Booking. A Live Queue") ─── */}
      <QRAppointmentShowcase />

      {/* ─── SECTION 4: CONNECTED SYSTEM & MULTI-TENANT ARCHITECTURE ─── */}
      <ConnectedSystemSection />

      {/* ─── SECTION 5: FAQ ─── */}
      <FAQSection />

      {/* Footer */}
      <PublicFooter />
      <ContactModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  )
}
