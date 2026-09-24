import { motion } from "framer-motion"
import {
  ClipboardCheck,
  FileText,
  History,
  ListOrdered,
  Pill,
  User,
} from "lucide-react"

const steps = [
  {
    title: "Secure Single-Doctor Login",
    text: "Each physician logs into an isolated personal workspace with role-level cryptographic access controls.",
    icon: User,
    badge: "Encrypted Session",
  },
  {
    title: "Live Automated Patient Calling",
    text: "With a single tap, advance the queue, notify reception screens, and send automated SMS alerts to the waiting patient.",
    icon: ClipboardCheck,
    badge: "1-Tap Calling",
  },
  {
    title: "Instant Digital Queue Management",
    text: "View real-time token sequences, mark patient attendance, or flag high-priority emergency cases effortlessly.",
    icon: ListOrdered,
    badge: "Dynamic Sorting",
  },
  {
    title: "Pre-Consultation Medical History",
    text: "Access patient-submitted symptoms, previous prescription logs, and allergy contraindication alerts instantly.",
    icon: History,
    badge: "Pre-Intake Records",
  },
  {
    title: "Sub-30s Digital Rx Generator",
    text: "Type or use auto-completing medicine templates to issue tamper-proof digital prescriptions in under 30 seconds.",
    icon: Pill,
    badge: "Fast Ergonomics",
  },
  {
    title: "Connected Hospital Synchronization",
    text: "Consultation notes, pharmacy orders, and lab requests are synchronized back to the hospital database instantly.",
    icon: FileText,
    badge: "Zero Paperwork",
  },
]

export default function DoctorJourney() {
  return (
    <section
      id="doctor"
      className="relative overflow-hidden bg-white/80 px-6 py-28 md:py-36 border-b border-slate-200/60"
    >
      <div className="pointer-events-none absolute right-[-150px] top-[20%] h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl space-y-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-[#FF6B2C] inline-block shadow-2xs">
            03. FOR DOCTORS
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            A Distraction-Free Clinical Desk.<br />
            <span className="bg-gradient-to-r from-[#FF6B2C] to-[#2563EB] bg-clip-text text-transparent">
              Engineered for Physician Speed.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            Doctors spend 90% of consultation time focusing on the patient, not battling administrative software. Complete consultations in seconds with automated digital queues.
          </p>
        </div>

        {/* 2-Column Grid: Doctor Dashboard Simulator + 6 Clinical Steps */}
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1.15fr] lg:items-start">
          {/* Left: Doctor Workspace Simulator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-[36px] border border-slate-800 bg-[#0B132B] p-6 sm:p-8 shadow-[0_30px_90px_rgba(11,19,43,0.3)] text-white text-left space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[9px] font-extrabold tracking-[0.2em] text-orange-400 uppercase block">
                  PHYSICIAN WORKSPACE
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Dr. Amit Sharma, MD
                </h3>
                <span className="text-xs text-slate-400">Consultant Cardiologist • OPD Room #104</span>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE SESSION</span>
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Completed</span>
                <span className="text-2xl font-black text-white mt-1 block">18</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Waiting</span>
                <span className="text-2xl font-black text-orange-400 mt-1 block">04</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Avg Time</span>
                <span className="text-2xl font-black text-blue-400 mt-1 block">4.2m</span>
              </div>
            </div>

            {/* Current In-Room Patient Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
                  CURRENT PATIENT IN ROOM
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/30 text-blue-200 text-[10px] font-mono font-bold">
                  TOKEN #CC-012
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-base font-black text-white">
                  RK
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Ravi Kumar (42y / Male)</h4>
                  <p className="text-xs text-slate-300">Symptoms: Mild chest tightness, palpitations (2 days)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-[#FF6B2C] hover:bg-[#E65100] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md">
                  <Pill size={14} />
                  <span>Issue Digital Rx</span>
                </button>
                <button className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition">
                  Complete
                </button>
              </div>
            </div>

            {/* Next in Queue List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                NEXT IN QUEUE
              </span>
              {[
                { token: "#CC-013", name: "Neha Singh (28y / F)", status: "Next Ready" },
                { token: "#CC-014", name: "Mohd. Ali (55y / M)", status: "Waiting" },
              ].map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-orange-400">{q.token}</span>
                    <span className="text-slate-200 font-medium">{q.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{q.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: 6 Feature Cards */}
          <div className="space-y-3.5">
            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.5 }}
                  whileHover={{ x: -4 }}
                  className="flex items-start gap-4 rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl text-left transition-all hover:border-orange-300"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B2C] border border-orange-100 shadow-2xs">
                    <Icon size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        {step.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {step.badge}
                      </span>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                      {step.text}
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
