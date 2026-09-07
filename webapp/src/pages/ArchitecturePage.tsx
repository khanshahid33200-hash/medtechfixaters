import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Database, Cpu, Network, Lock,
  Server, Smartphone, CheckCircle2, ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import ContactModal from '../components/ContactModal'
import { useSEO } from '../hooks/useSEO'

export default function ArchitecturePage() {
  useSEO({
    title: 'Platform Architecture — Enterprise Multi-Tenant Security | MedTech Fixaters',
    description: 'Technical deep-dive into MedTech Fixaters architecture: PostgreSQL Row-Level Security, WebSockets real-time mesh, and ABDM compliance.',
  })

  const [modalOpen, setModalOpen] = useState(false)

  const archNodes = [
    {
      title: 'Database Kernel Isolation',
      desc: 'Row-Level Security (RLS) policies enforced directly inside PostgreSQL prevent any cross-hospital data leakage by design.',
      icon: <Database size={24} className="text-[#5B4DF5]" />,
    },
    {
      title: 'Sub-Millisecond Queue Mesh',
      desc: 'Real-time WebSocket event bus ensures patient token callouts synchronize instantaneously between doctors, screens, and phones.',
      icon: <Network size={24} className="text-emerald-600" />,
    },
    {
      title: 'Zero-App Edge Web Engine',
      desc: 'Ultra-lightweight React/Vite progressive web app loads in under 1.2s on 3G/4G connections with zero app store barrier.',
      icon: <Smartphone size={24} className="text-blue-600" />,
    },
    {
      title: 'ABDM & HIPAA Compliance Mesh',
      desc: 'Complete audit trailing, encrypted TLS 1.3 in transit, and AES-256 rest encryption safeguarding all sensitive health data.',
      icon: <Lock size={24} className="text-purple-600" />,
    }
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#5B4DF5] selection:text-white">
      <PublicHeader />

      {/* Hero Header with Lavender Cloud Backdrop */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 bg-gradient-to-b from-[#E9EDFF] via-[#F4F5FF] to-white text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-white/90 border border-indigo-100 text-xs font-extrabold text-[#5B4DF5] inline-block shadow-2xs">
            Infrastructure & Security
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            Enterprise Architecture.<br />Engineered for Zero Downtime.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
            A hardened healthcare mesh built on top of PostgreSQL, advisory transaction locks, and distributed real-time WebSockets.
          </p>
        </div>
      </section>

      {/* Architecture Cards Grid */}
      <section className="py-16 sm:py-24 px-6 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {archNodes.map((node, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2">
                {node.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{node.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">{node.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Card */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="bg-[#5B4DF5] text-white p-8 sm:p-14 rounded-[36px] text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            Schedule an Architecture Review
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto font-medium">
            Connect directly with our engineering and clinical security team.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-8 py-3.5 rounded-full bg-white text-[#5B4DF5] font-bold text-xs sm:text-sm shadow-md hover:bg-slate-50 transition"
            >
              Request Whitepaper & Audit
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
