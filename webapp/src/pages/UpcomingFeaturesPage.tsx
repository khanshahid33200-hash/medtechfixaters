import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Mic,
  MessageSquare,
  Activity,
  ShieldCheck,
  Building,
  Pill,
  Radio,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Cpu,
  Zap,
  Globe,
  Star,
  Flame,
  ThumbsUp,
  Share2,
  ChevronRight,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import ContactModal from '../components/ContactModal'
import { useSEO } from '../hooks/useSEO'

interface UpcomingFeature {
  id: string
  title: string
  category: 'AI & Diagnostics' | 'Patient Experience' | 'Enterprise & IoT' | 'Compliance'
  quarter: string
  status: 'In Development' | 'Private Beta' | 'Research & Design' | 'Coming Soon'
  badgeColor: string
  icon: React.ReactNode
  description: string
  keyHighlights: string[]
  votes: number
}

const UPCOMING_FEATURES: UpcomingFeature[] = [
  {
    id: 'ambient-scribe',
    title: 'Ambient AI Voice-to-Prescription Scribe',
    category: 'AI & Diagnostics',
    quarter: 'Q3 2026',
    status: 'Private Beta',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: <Mic className="w-6 h-6 text-blue-600" />,
    description:
      'Listen naturally to doctor-patient conversations and automatically synthesize structured clinical notes, drug dosages, and ICD-10 diagnostic codes in under 3 seconds.',
    keyHighlights: [
      'Multi-lingual Indian language support (Hindi, Marathi, Tamil, Bengali & Hinglish)',
      'Sub-second drug allergy & drug-drug contraindication detection',
      'One-click physician review and cryptographic digital sign-off',
    ],
    votes: 428,
  },
  {
    id: 'whatsapp-bot',
    title: 'WhatsApp 2-Way Live Queue & Prescription Sync',
    category: 'Patient Experience',
    quarter: 'Q3 2026',
    status: 'In Development',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: <MessageSquare className="w-6 h-6 text-emerald-600" />,
    description:
      'Zero-app patient engagement. Patients receive real-time queue countdowns, live token advances, instant PDF prescriptions, and automated follow-up reminders directly on WhatsApp.',
    keyHighlights: [
      'Interactive button-based token booking & emergency rescheduling',
      'Automated lab test result notification with doctor voice note',
      'Instant post-consultation feedback & Google Review integration',
    ],
    votes: 389,
  },
  {
    id: 'iot-telemetry',
    title: 'Smart IoT Vitals & Medical Device Gateway',
    category: 'Enterprise & IoT',
    quarter: 'Q4 2026',
    status: 'In Development',
    badgeColor: 'bg-orange-50 text-orange-600 border-orange-200',
    icon: <Activity className="w-6 h-6 text-orange-600" />,
    description:
      'Wireless synchronization with Bluetooth & WiFi medical monitors. Instantly captures Blood Pressure, SpO2, Blood Glucose, ECG, and Body Temperature straight into the patient triage record.',
    keyHighlights: [
      'Automated triage color-coding (Red/Yellow/Green) based on vital thresholds',
      'Zero manual nurse typing errors in high-volume triage rooms',
      'Instant doctor warning banner when severe vitals are detected',
    ],
    votes: 312,
  },
  {
    id: 'abdm-compliance',
    title: 'Ayushman Bharat (ABDM) Native M1, M2, M3 Gateway',
    category: 'Compliance',
    quarter: 'Q4 2026',
    status: 'In Development',
    badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
    icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
    description:
      'Seamless compliance with National Health Authority standards. Instant ABHA ID generation, Aadhaar OTP authentication, and longitudinal Personal Health Record (PHR) exchange.',
    keyHighlights: [
      '10-second ABHA card creation at QR check-in kiosk',
      'Encrypted Health Data Exchange with Consent Manager API',
      'Automatic government reporting & subsidized scheme claim logs',
    ],
    votes: 275,
  },
  {
    id: 'multi-center-hq',
    title: 'Multi-Branch Hospital Enterprise Command Center',
    category: 'Enterprise & IoT',
    quarter: 'Q1 2027',
    status: 'Research & Design',
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    icon: <Building className="w-6 h-6 text-indigo-600" />,
    description:
      'Centralized bird-eye management for hospital chains. Monitor patient footfall, OPD queue lengths, doctor utilization, and branch-level billing across multiple geographic locations.',
    keyHighlights: [
      'Consolidated multi-branch clinical audit & real-time revenue analytics',
      'Floating doctor roster scheduling across sister hospital branches',
      'Unified single patient master record across all hospital network units',
    ],
    votes: 219,
  },
  {
    id: 'pharmacy-robot',
    title: 'Smart Pharmacy Dispensing & Auto-Inventory Decrement',
    category: 'AI & Diagnostics',
    quarter: 'Q1 2027',
    status: 'Research & Design',
    badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
    icon: <Pill className="w-6 h-6 text-rose-600" />,
    description:
      'Automated pharmacy fulfillment. When a doctor issues a prescription, pharmacy screens light up with bin locations, verifying barcodes and updating batch expiry tracking automatically.',
    keyHighlights: [
      'Zero-wait prescription pickup for OPD patients at hospital pharmacy',
      'Predictive stock re-ordering based on seasonal OPD illness spikes',
      'Direct GST billing synchronization and medicine batch tracking',
    ],
    votes: 194,
  },
]

export default function UpcomingFeaturesPage() {
  useSEO({
    title: 'Upcoming Features & Product Roadmap — MedTech Fixaters AI Healthcare',
    description:
      'Explore upcoming MedTech Fixaters innovations: Ambient AI voice scribing, WhatsApp queue sync, IoT vitals telemetry, ABDM compliance, and multi-branch enterprise control.',
  })

  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({})
  const [voteCountMap, setVoteCountMap] = useState<Record<string, number>>(
    UPCOMING_FEATURES.reduce((acc, feat) => ({ ...acc, [feat.id]: feat.votes }), {})
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [notificationSuccess, setNotificationSuccess] = useState(false)

  const handleVote = (id: string) => {
    if (votedMap[id]) return
    setVotedMap(prev => ({ ...prev, [id]: true }))
    setVoteCountMap(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notificationEmail) return
    setNotificationSuccess(true)
    setTimeout(() => {
      setNotificationEmail('')
    }, 3000)
  }

  const categories = ['All', 'AI & Diagnostics', 'Patient Experience', 'Enterprise & IoT', 'Compliance']

  const filteredFeatures =
    activeCategory === 'All'
      ? UPCOMING_FEATURES
      : UPCOMING_FEATURES.filter(f => f.category === activeCategory)

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 font-sans antialiased selection:bg-[#0080E6] selection:text-white">
      <PublicHeader />

      {/* ─── HERO SECTION WITH AMBIENT GLOWS ─── */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-400/20 via-orange-300/15 to-purple-400/20 rounded-full blur-[110px]" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-orange-400/10 rounded-full blur-[90px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-xl text-xs font-bold text-[#FF6B2C]"
          >
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span>MEDTECH FIXATERS PRODUCT ROADMAP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
            <span className="text-slate-600 font-semibold">2026 - 2027 Vision</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.035em] text-[#101828] leading-[1.08]"
          >
            The Future of Hospital AI.{' '}
            <span className="bg-gradient-to-r from-[#0080E6] via-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
              Arriving Soon.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            We are actively engineering next-generation healthcare capabilities—from ambient voice-to-Rx AI and IoT device telemetry to full ABDM national health compliance.
          </motion.p>

          {/* Top Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF6B2C] via-[#FF8A4C] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B2C] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-98"
            >
              <span>Request Early Beta Access</span>
              <ArrowRight size={14} />
            </button>
            <Link
              to="/features"
              className="px-6 py-3 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center gap-2 hover:bg-slate-50"
            >
              <span>Explore Current Live Features</span>
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS & RELEASE CADENCE ─── */}
      <section className="py-8 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
            <div className="text-3xl font-black text-blue-600">6+</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Major Modules in Pipeline</div>
            <div className="text-[11px] text-slate-500">Shipping throughout 2026-27</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
            <div className="text-3xl font-black text-emerald-600">Weekly</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Continuous Cloud Updates</div>
            <div className="text-[11px] text-slate-500">Zero downtime deployment</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
            <div className="text-3xl font-black text-orange-600">100%</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Doctor-Tested Ergonomics</div>
            <div className="text-[11px] text-slate-500">Built with practicing physicians</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
            <div className="text-3xl font-black text-purple-600">ABDM M3</div>
            <div className="text-xs font-bold text-slate-800 mt-1">National Standard Ready</div>
            <div className="text-[11px] text-slate-500">NDHM & NHA Architecture</div>
          </div>
        </div>
      </section>

      {/* ─── ROADMAP CARDS & FILTER TABS ─── */}
      <section className="py-14 px-6 max-w-6xl mx-auto space-y-10">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feat, idx) => (
              <motion.div
                key={feat.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-7 shadow-[0_10px_35px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)] hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                {/* Top Badge & Quarter Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-500" />
                      {feat.quarter}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${feat.badgeColor}`}
                    >
                      {feat.status}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                      {feat.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-blue-600 block mb-0.5">
                        {feat.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                        {feat.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {feat.description}
                  </p>

                  {/* Key Highlights Checklist */}
                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Engineering Scope
                    </span>
                    {feat.keyHighlights.map((hl, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer: Upvote / Request & Beta Tag */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleVote(feat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      votedMap[feat.id]
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <ThumbsUp size={13} className={votedMap[feat.id] ? 'fill-emerald-600' : ''} />
                    <span>
                      {votedMap[feat.id] ? 'Upvoted' : 'Upvote'} ({voteCountMap[feat.id] || 0})
                    </span>
                  </button>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group/btn cursor-pointer"
                  >
                    <span>Join Beta Waitlist</span>
                    <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── NOTIFICATION EMAIL CAPTURE ─── */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-900 via-[#101828] to-slate-900 text-white rounded-[32px] p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/15 rounded-full blur-[80px]" />

          <div className="relative max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-blue-400">
              <Bell size={24} />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Stay Ahead of Healthcare Innovation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal">
              Get notified immediately when new clinical features, AI voice modules, and ABDM integrations are deployed.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="relative max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="Enter your hospital work email..."
              value={notificationEmail}
              onChange={e => setNotificationEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-400 backdrop-blur-md"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8A4C] hover:from-[#E65100] hover:to-[#FF6B2C] text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all cursor-pointer shrink-0"
            >
              {notificationSuccess ? 'Subscribed!' : 'Notify Me'}
            </button>
          </form>

          {notificationSuccess && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-emerald-400 font-bold"
            >
              ✓ Thank you! You will receive roadmap updates as each milestone ships.
            </motion.p>
          )}
        </div>
      </section>

      {/* ─── BOTTOM ROADMAP CTA ─── */}
      <section className="py-12 px-6 max-w-5xl mx-auto text-center space-y-4">
        <h3 className="text-2xl font-black text-slate-900">Have a Specific Custom Feature Request?</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          We collaborate directly with hospital directors, chief medical officers, and OPD managers to co-design bespoke workflows.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setModalOpen(true)}
            className="px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Schedule a Consultation
          </button>
        </div>
      </section>

      <PublicFooter />
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
