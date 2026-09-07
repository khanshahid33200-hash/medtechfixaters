import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  Users,
  CheckCircle2,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react"

const features = [
  {
    title: "Create Hospital Workspace",
    text: "Provision an independent multi-tenant digital workspace for your hospital with full cryptographic database security.",
    icon: Building2,
    badge: "1-Click Setup",
  },
  {
    title: "Configure Departments & Rosters",
    text: "Set up OPD departments (Cardiology, Ortho, Peds, General) and assign consulting doctors with customized schedule slots.",
    icon: Users,
    badge: "Roster Engine",
  },
  {
    title: "Generate Branded QR Standees",
    text: "Receive high-resolution, branded QR assets and dedicated hospital web links for reception stands and waiting halls.",
    icon: ClipboardList,
    badge: "Unique Hospital QR",
  },
  {
    title: "Centralized Live Appointment Desk",
    text: "Monitor walk-in QR registrations, online bookings, and emergency triage priority cases in real time.",
    icon: CalendarDays,
    badge: "Live Reception Desk",
  },
  {
    title: "Real-Time OPD Queue Telemetry",
    text: "View live patient queues across every consulting room. Detect bottlenecks and reassign patient queues instantly.",
    icon: BarChart3,
    badge: "Real-Time Telemetry",
  },
  {
    title: "Revenue & Daily Clinical Analytics",
    text: "Comprehensive operational analytics on patient footfall, average doctor consultation times, and revenue breakdown.",
    icon: IndianRupee,
    badge: "Automated Reports",
  },
]

export default function HospitalJourney() {
  const [selectedDept, setSelectedDept] = useState("Cardiology")

  return (
    <section
      id="hospital"
      className="relative overflow-hidden bg-[#F8FAFC] px-6 py-28 md:py-36 border-b border-slate-200/60"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[550px] w-[750px] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl space-y-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600 inline-block shadow-2xs">
            02. FOR HOSPITALS
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            Your Entire Hospital Operations.<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#FF6B2C] bg-clip-text text-transparent">
              Unified In One Real-Time Dashboard.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            Build your private hospital workspace, organize doctor rosters, monitor live queue traffic across departments, and oversee daily clinical workflows.
          </p>
        </div>

        {/* 2-Column Layout: Live Glass Dashboard Simulator + 6 Feature Cards */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          {/* Left: Luxury Frosted Hospital Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-[36px] border border-slate-800 bg-[#0B132B] p-6 sm:p-8 shadow-[0_30px_90px_rgba(11,19,43,0.35)] text-left text-white space-y-6"
          >
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[9px] font-extrabold tracking-[0.2em] text-blue-400 uppercase block">
                  MEDTECH FIXATERS HOSPITAL COMMAND CENTER
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Apex City Hospital & Research Center
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ALL OPDs LIVE</span>
                </span>
              </div>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {["Cardiology", "Orthopedics", "Pediatrics", "General Medicine"].map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDept === dept
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Doctors</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">14 / 16</span>
                <span className="text-[10px] text-emerald-400 font-semibold">92% Utilization</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Today's Patients</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">184</span>
                <span className="text-[10px] text-blue-400 font-semibold">+28% vs yesterday</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">In Live Queue</span>
                <span className="text-2xl sm:text-3xl font-black text-orange-400 mt-1 block">32</span>
                <span className="text-[10px] text-slate-400 font-semibold">Avg wait ~9 mins</span>
              </div>
            </div>

            {/* Active Doctor Queues List */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Active Consultation Rooms</span>
                <span className="text-blue-400 text-[10px] font-mono">Real-time sync</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Dr. Amit Sharma", spec: "Cardiology", token: "#CC-012", status: "In Consultation", color: "bg-emerald-400" },
                  { name: "Dr. Priya Patel", spec: "Cardiology", token: "#CC-013", status: "4 Waiting", color: "bg-blue-400" },
                  { name: "Dr. Rajesh Verma", spec: "Cardiology", token: "#CC-014", status: "Calling Next", color: "bg-orange-400" },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {doc.name.split(" ")[1][0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400">{doc.spec}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-blue-300 block">{doc.token}</span>
                      <span className="text-[10px] text-slate-300 flex items-center gap-1.5 justify-end">
                        <span className={`w-1.5 h-1.5 rounded-full ${doc.color}`} />
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: 6 Feature Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="rounded-[28px] border border-white/90 bg-white/80 p-6 shadow-[0_15px_40px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl text-left space-y-4 transition-all hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                      <Icon size={22} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {feature.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                      {feature.text}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
