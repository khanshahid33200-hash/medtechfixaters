import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Lock,
  QrCode,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  RotateCw,
  Server,
} from "lucide-react";

const hospitalOneDoctors = [
  { id: "H1D1", name: "Dr. Sharma" },
  { id: "H1D2", name: "Dr. Khan" },
  { id: "H1D3", name: "Dr. Verma" },
];

const hospitalTwoDoctors = [
  { id: "H2D1", name: "Dr. Mehta" },
  { id: "H2D2", name: "Dr. Reddy" },
];

const securityFeatures = [
  {
    title: "Individual Hospital Workspace",
    description:
      "Each hospital gets its own QR system, doctors, patients, appointments, and dashboard data.",
    icon: Building2,
    color: "blue",
    iconBg: "bg-blue-500",
  },
  {
    title: "Doctor-Level Privacy",
    description:
      "Doctors see only their assigned patients, appointments, and medical workflow.",
    icon: Stethoscope,
    color: "orange",
    iconBg: "bg-orange-500",
  },
  {
    title: "Hospital-Level Control",
    description:
      "Hospital admins manage everything within their hospital including doctors, patients, staff and records.",
    icon: Users,
    color: "green",
    iconBg: "bg-emerald-500",
  },
  {
    title: "Secure Data Separation",
    description:
      "Role-based access, encryption and database-level isolation keeps every workspace secure.",
    icon: ShieldCheck,
    color: "purple",
    iconBg: "bg-indigo-600",
  },
];

const patientJourney = [
  { label: "Scan Hospital QR Code", icon: QrCode },
  { label: "Register as Patient", icon: User },
  { label: "Choose Doctor", icon: Stethoscope },
  { label: "Get Live Queue", icon: ClipboardList },
  { label: "Consult Doctor", icon: User },
  { label: "Reports & History", icon: FileText },
];

export default function ConnectedSystemSection() {
  return (
    <section className="relative overflow-hidden bg-[#F6F6F4] py-24 md:py-32 text-slate-900">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-orange-500/[0.03] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

        {/* ─── SECTION HEADER ─── */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-black/[0.06] bg-white/70 px-4 py-2 shadow-2xs backdrop-blur-xl"
          >
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
              03
            </span>
            <span className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
              AI-POWERED. PRIVACY-FIRST. FULLY ISOLATED.
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#17191F] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.12]"
          >
            Everything Connected.
            <br />
            <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#F97316] bg-clip-text text-transparent">
              Nothing Overlapping.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#6B6F78] md:text-lg"
          >
            Every hospital works inside its own protected workspace. Every doctor works within
            assigned hospital access. Every patient reaches the correct doctor and hospital.
          </motion.p>
        </div>

        {/* ─── MAIN CONNECTED MULTI-TENANT ARCHITECTURE STAGE ─── */}
        <div className="relative mt-16 overflow-hidden rounded-[36px] border border-white/90 bg-white/55 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8 lg:p-10">
          
          {/* Subtle Background Grid Pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative z-10 space-y-8">

            {/* Top: Platform Admin Console */}
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md rounded-2xl border border-white bg-[#17191F] px-5 py-4 shadow-[0_15px_40px_rgba(15,23,42,0.18)] flex items-center gap-3.5 text-left text-white"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Server size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-white/40 uppercase">
                    PLATFORM ADMIN
                  </p>
                  <h4 className="mt-0.5 text-sm font-semibold text-white truncate">
                    MedTech Fixaters Control
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-medium text-emerald-400">Active</span>
                </div>
              </motion.div>
            </div>

            {/* Vertical Glowing Connector Line */}
            <div className="relative mx-auto h-12 w-px overflow-hidden bg-slate-200">
              <motion.div
                initial={{ height: "0%" }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.0 }}
                className="absolute left-0 top-0 w-full bg-gradient-to-b from-blue-500 to-orange-400"
              />
              <motion.div
                animate={{ y: [0, 48, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
              />
            </div>

            {/* Middle 3-Column Core: Hospital H1 (Left) + System Core (Center) + Hospital H2 (Right) */}
            <div className="relative grid gap-6 lg:grid-cols-[1fr_300px_1fr] lg:items-center">

              {/* Horizontal Connecting Line between Left and Right */}
              <div className="pointer-events-none absolute left-[20%] right-[20%] top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-between -z-1">
                <div className="w-full h-px border-t-2 border-dashed border-blue-400 relative">
                  <motion.div
                    animate={{ x: [0, 60, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1 left-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  />
                </div>
                <div className="w-full h-px border-t-2 border-dashed border-orange-400 relative">
                  <motion.div
                    animate={{ x: [0, -60, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1 right-4 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                  />
                </div>
              </div>

              {/* HOSPITAL H1 (LEFT) */}
              <motion.div
                initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
                className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl text-left space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-blue-600">HOSPITAL H1</h4>
                      <ShieldCheck size={14} className="text-blue-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Private Workspace</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9.5px] font-bold text-slate-500">Active</span>
                  </div>
                </div>

                {/* QR Box */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-2xs">
                    <QrCode size={24} className="text-slate-800" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">H1 Unique QR Code</p>
                    <p className="text-[9.5px] text-slate-400">Connected only to Hospital H1</p>
                  </div>
                </div>

                {/* Registered Doctors */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Registered Doctors</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {hospitalOneDoctors.map((doc) => (
                      <div key={doc.id} className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center text-center shadow-2xs">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold mb-0.5">
                          <User size={10} />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-800 leading-none">{doc.id}</span>
                        <span className="text-[8px] text-slate-400 mt-0.5 truncate max-w-full">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Isolation */}
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">H1 Data Isolation</p>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center">
                      <Users size={12} className="text-blue-500 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700">Patients</span>
                      <span className="text-[7px] text-slate-400">Only H1</span>
                    </div>
                    <div className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center">
                      <CalendarDays size={12} className="text-blue-500 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700">Appointments</span>
                      <span className="text-[7px] text-slate-400">Only H1</span>
                    </div>
                    <div className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center">
                      <FileText size={12} className="text-blue-500 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700">Records</span>
                      <span className="text-[7px] text-slate-400">Only H1</span>
                    </div>
                  </div>
                </div>

                {/* Status Banner */}
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9.5px] font-bold">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>All data stays inside Hospital H1 workspace</span>
                </div>
              </motion.div>

              {/* MEDTECH FIXATERS CONNECTED MEDTECH AI CORE (CENTER) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative rounded-3xl bg-[#111827] border border-blue-500/20 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.3)] text-center text-white overflow-hidden space-y-3.5"
              >
                {/* Rotating Orbit Rings & Lock Icon */}
                <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-dashed border-blue-400/40"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 rounded-full border border-dashed border-cyan-400/20"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                    <Lock size={22} className="text-white" />
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-medium tracking-[0.16em] text-white/40 uppercase">
                    MEDTECH AI CORE
                  </p>
                  <h4 className="mt-1 font-bold text-sm tracking-tight text-white">
                    AI Connected Platform
                  </h4>
                </div>

                {/* 3 Status Modules */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                    <RotateCw size={12} className="text-blue-400 mb-0.5" />
                    <span className="text-[7.5px] text-white/60">Live AI-Supported Sync</span>
                    <span className="text-[8px] font-bold text-emerald-400 mt-0.5">Live</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                    <User size={12} className="text-blue-400 mb-0.5" />
                    <span className="text-[7.5px] text-white/60">Protected Role Intelligence</span>
                    <span className="text-[8px] font-bold text-emerald-400 mt-0.5">Protected</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                    <Building2 size={12} className="text-blue-400 mb-0.5" />
                    <span className="text-[7.5px] text-white/60">Isolation</span>
                    <span className="text-[8px] font-bold text-emerald-400 mt-0.5">Active</span>
                  </div>
                </div>

                {/* Glow */}
                <div className="pointer-events-none absolute -bottom-16 left-1/2 h-24 w-32 -translate-x-1/2 rounded-full bg-blue-500/20 blur-2xl" />
              </motion.div>

              {/* HOSPITAL H2 (RIGHT) */}
              <motion.div
                initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
                className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl text-left space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-orange-600">HOSPITAL H2</h4>
                      <ShieldCheck size={14} className="text-orange-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Private Workspace</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9.5px] font-bold text-slate-500">Active</span>
                  </div>
                </div>

                {/* QR Box */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-2xs">
                    <QrCode size={24} className="text-slate-800" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">H2 Unique QR Code</p>
                    <p className="text-[9.5px] text-slate-400">Connected only to Hospital H2</p>
                  </div>
                </div>

                {/* Registered Doctors */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600">Registered Doctors</p>
                  <div className="grid grid-cols-2 gap-2">
                    {hospitalTwoDoctors.map((doc) => (
                      <div key={doc.id} className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center text-center shadow-2xs">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[9px] font-bold mb-0.5">
                          <User size={10} />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-800 leading-none">{doc.id}</span>
                        <span className="text-[8px] text-slate-400 mt-0.5 truncate max-w-full">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Isolation */}
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600">H2 Data Isolation</p>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center">
                      <Users size={12} className="text-orange-500 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700">Patients</span>
                      <span className="text-[7px] text-slate-400">Only H2</span>
                    </div>
                    <div className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center">
                      <CalendarDays size={12} className="text-orange-500 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700">Appointments</span>
                      <span className="text-[7px] text-slate-400">Only H2</span>
                    </div>
                    <div className="p-1.5 rounded-xl border border-slate-100 bg-white flex flex-col items-center">
                      <FileText size={12} className="text-orange-500 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700">Records</span>
                      <span className="text-[7px] text-slate-400">Only H2</span>
                    </div>
                  </div>
                </div>

                {/* Status Banner */}
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9.5px] font-bold">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>All data stays inside Hospital H2 workspace</span>
                </div>
              </motion.div>

            </div>

            {/* Bottom: Patient Journey within Assigned Hospital Flow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-xs text-center space-y-2.5"
            >
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                PATIENT JOURNEY <span className="text-slate-400 font-normal">(Within Assigned Hospital)</span>
              </span>
              
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                {patientJourney.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-center gap-2 sm:gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                          <Icon size={15} />
                        </div>
                        <span className="text-[8.5px] font-semibold text-slate-600 max-w-[80px] leading-tight">
                          {step.label}
                        </span>
                      </div>
                      {idx < patientJourney.length - 1 && (
                        <ArrowRight size={12} className="text-blue-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>
        </div>

        {/* ─── 4-COLUMN SECURITY & DATA SEPARATION CARDS (BALANCED ACROSS 12 COLS) ─── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {securityFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-white bg-white/75 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${item.iconBg} text-white flex items-center justify-center shadow-xs mb-4`}>
                  <Icon size={18} />
                </div>
                <h5 className="font-bold text-xs text-slate-900 leading-tight">{item.title}</h5>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ─── BOTTOM FULL-WIDTH DATA SEPARATION CALLOUT BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-orange-50/60 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                Data stays inside its assigned workspace.
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hospital H1 cannot access H2 data. Hospital H2 cannot access H1 data. Doctors cannot access other doctors' private workspaces.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
            <Check size={13} className="text-emerald-600" />
            <span>Secure Separation</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
