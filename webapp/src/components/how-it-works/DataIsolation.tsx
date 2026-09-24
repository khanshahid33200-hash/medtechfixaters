import { motion } from "framer-motion"
import {
  Building2,
  Check,
  Database,
  ShieldCheck,
  Stethoscope,
  Users,
  Lock,
} from "lucide-react"

export default function DataIsolation() {
  return (
    <section className="relative overflow-hidden bg-white/70 px-6 py-28 md:py-36 border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700 inline-block shadow-2xs">
            SECURITY & MULTI-TENANT ISOLATION
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            Every Journey Connects.<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-emerald-600 bg-clip-text text-transparent">
              Zero Data Overlap.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            Hospitals operate inside cryptographically isolated database partitions. Doctors access only assigned patient consultations. Cross-facility data leakage is physically impossible.
          </p>
        </div>

        {/* Multi-Tenant Security Sandbox */}
        <div className="relative overflow-hidden rounded-[36px] border border-white/90 bg-[#F1F5F9]/80 p-6 sm:p-10 shadow-[0_25px_80px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] backdrop-blur-2xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_260px_1fr] lg:items-center">
            {/* Hospital H1 Workspace */}
            <Workspace
              hospital="Apex City Hospital (H1)"
              doctors={["Dr. Amit Sharma (Cardiology)", "Dr. Priya Patel (Pediatrics)"]}
              color="blue"
            />

            {/* Central Database Core */}
            <Core />

            {/* Hospital H2 Workspace */}
            <Workspace
              hospital="Metro Care Clinic (H2)"
              doctors={["Dr. Rajesh Verma (Orthopedics)", "Dr. Sneha Joshi (General)"]}
              color="orange"
            />
          </div>

          {/* Bottom Security Guarantee Banner */}
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-xs">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-2xs border border-emerald-100">
                <ShieldCheck size={24} />
              </div>

              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900">
                  Database-Native Row-Level Security (RLS) & Encryption at Rest
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hospital H1 has zero visibility into Hospital H2 records. All tokens and prescriptions are signed with hospital-specific keys.
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 shrink-0">
                <Check size={14} />
                <span>100% Isolated Workspaces</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Workspace({
  hospital,
  doctors,
  color,
}: {
  hospital: string
  doctors: string[]
  color: "blue" | "orange"
}) {
  const isBlue = color === "blue"

  return (
    <motion.div
      initial={{ opacity: 0, x: isBlue ? -25 : 25 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`rounded-[30px] border p-6 backdrop-blur-xl text-left space-y-5 bg-white/90 shadow-[0_15px_40px_rgba(15,23,42,0.05)] ${
        isBlue ? "border-blue-200" : "border-orange-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-2xs ${
              isBlue
                ? "bg-blue-50 text-blue-600 border border-blue-100"
                : "bg-orange-50 text-[#FF6B2C] border border-orange-100"
            }`}
          >
            <Building2 size={22} />
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              {hospital}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Private Workspace Partition
            </span>
          </div>
        </div>

        <span className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
          <Lock size={14} />
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
          REGISTERED DOCTOR ROOMS
        </span>
        {doctors.map((doc, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Stethoscope size={14} className={isBlue ? "text-blue-500" : "text-[#FF6B2C]"} />
              <span className="font-semibold text-slate-700">{doc}</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold">LOCKED</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
          <Users size={12} className="text-blue-500" />
          <span>Patient Records</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
          <Database size={12} className="text-[#FF6B2C]" />
          <span>Isolated RLS</span>
        </div>
      </div>
    </motion.div>
  )
}

function Core() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="relative mx-auto w-full max-w-[260px] text-center space-y-3"
    >
      <div className="p-6 rounded-[30px] bg-[#0F172A] text-white shadow-2xl border border-slate-800 space-y-3">
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/30"
        >
          <Database size={26} />
        </motion.div>

        <div>
          <h5 className="text-sm font-black text-white">MedTech Fixaters Core</h5>
          <span className="text-[9px] text-blue-300 font-bold uppercase tracking-widest block">
            Zero Cross-Access
          </span>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/10 text-[10px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Data Isolation:</span>
            <span className="text-emerald-400 font-bold">100% Strict</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">HIPAA / ABDM:</span>
            <span className="text-blue-300 font-bold">Compliant</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
