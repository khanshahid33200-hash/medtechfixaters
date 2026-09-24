import { motion } from "framer-motion"
import {
  Bell,
  CalendarCheck,
  BrainCircuit,
  ClipboardList,
  MessageSquare,
  Route,
  User,
  Sparkles,
} from "lucide-react"

const nodes = [
  {
    title: "AI Symptom & Triage Intake",
    text: "Automatically structures unstructured patient descriptions into clear clinical complaints and severity flags.",
    icon: MessageSquare,
    badge: "Smart Triage",
    color: "orange",
  },
  {
    title: "Intelligent Doctor Matching",
    text: "Guides patients to the exact specialized department, preventing mismatched consultation queues.",
    icon: User,
    badge: "Specialist Match",
    color: "blue",
  },
  {
    title: "Dynamic Smart Appointment Routing",
    text: "Distributes walk-in and online appointments to balance queue depths across available consulting physicians.",
    icon: Route,
    badge: "Load Balancing",
    color: "orange",
  },
  {
    title: "Automated Clinical Follow-Ups",
    text: "Automatically triggers medication refill check-ins and lab test review reminders via SMS/WhatsApp.",
    icon: CalendarCheck,
    badge: "Automated Reminders",
    color: "blue",
  },
  {
    title: "Predictive Queue Notifications",
    text: "Calculates real-time patient transit time and sends 'Your Turn in 10 mins' notifications to liberate waiting halls.",
    icon: Bell,
    badge: "Dynamic ETA",
    color: "orange",
  },
  {
    title: "Physician Workflow Copilot",
    text: "Suggests common ICD-10 diagnostic codes, dosage frequencies, and warns of critical drug-drug interactions.",
    icon: ClipboardList,
    badge: "Clinical Copilot",
    color: "blue",
  },
]

export default function AISystem() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] px-6 py-28 md:py-36 border-b border-slate-200/60">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.08] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl space-y-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-bold text-violet-600 inline-block shadow-2xs">
            AI-POWERED CLINICAL WORKFLOWS
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            Intelligent Automation.<br />
            <span className="bg-gradient-to-r from-[#2563EB] via-violet-600 to-[#FF6B2C] bg-clip-text text-transparent">
              Supporting Every Clinical Step.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            MedTech AI eliminates clerical fatigue—assisting in patient triage, live queue load balancing, prescription assistance, and automated follow-ups.
          </p>
        </div>

        {/* 6 AI Cards in 3x2 Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-left">
          {nodes.map((node, index) => {
            const Icon = node.icon
            const isOrange = node.color === "orange"

            return (
              <motion.div
                key={node.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`rounded-[30px] border border-white/90 bg-white/80 p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl flex flex-col justify-between transition-all ${
                  isOrange ? "hover:border-orange-300" : "hover:border-blue-300"
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-13 w-13 items-center justify-center rounded-2xl shadow-2xs ${
                        isOrange
                          ? "bg-orange-50 text-[#FF6B2C] border border-orange-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}
                    >
                      <Icon size={24} />
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        isOrange
                          ? "bg-orange-50 text-[#FF6B2C] border-orange-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                      }`}
                    >
                      {node.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {node.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                      {node.text}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Sparkles size={13} className={isOrange ? "text-[#FF6B2C]" : "text-blue-500"} />
                  <span>Real-time AI Inference</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Central Pulsing AI Engine Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl p-5 rounded-[28px] border border-blue-200 bg-white/85 shadow-lg backdrop-blur-2xl flex items-center gap-4 text-left"
        >
          <motion.div
            animate={{
              rotate: [0, 8, -8, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25"
          >
            <BrainCircuit size={28} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>MedTech AI Clinical Engine</span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                ACTIVE
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Guiding workflows without replacing human medical authority.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
