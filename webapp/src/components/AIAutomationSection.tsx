import { motion } from "framer-motion";
import {
  Bot,
  CalendarCheck,
  Bell,
  BarChart3,
  Stethoscope,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const aiCapabilities = [
  {
    icon: Bot,
    title: "AI Booking Intelligence",
    description: "Guides appointment intake and supports department and doctor selection based on patient-provided concerns.",
    color: "blue",
    iconBg: "bg-blue-500",
    badge: "Smart Intake",
  },
  {
    icon: CalendarCheck,
    title: "Automated Follow-Ups",
    description: "Automatically schedule and organize follow-up communication based on authorized hospital clinical workflows.",
    color: "purple",
    iconBg: "bg-indigo-600",
    badge: "Scheduled Care",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Keep patients, doctors, hospitals, and staff informed in real time about important queue and appointment events.",
    color: "amber",
    iconBg: "bg-amber-500",
    badge: "Real-time",
  },
  {
    icon: BarChart3,
    title: "Hospital Activity Insights",
    description: "Turn daily appointments, queues, doctor activity, and operational data into clear, actionable summaries.",
    color: "emerald",
    iconBg: "bg-emerald-600",
    badge: "Operational Analytics",
  },
  {
    icon: Stethoscope,
    title: "Doctor Workflow Intelligence",
    description: "Organize appointment information, patient activity notes, and daily consultation queues into private workspaces.",
    color: "cyan",
    iconBg: "bg-cyan-600",
    badge: "Doctor Workspace",
  },
  {
    icon: MessageSquare,
    title: "Patient Communication",
    description: "Support automated multi-channel reminders for upcoming visits, queue changes, digital prescriptions, and reports.",
    color: "orange",
    iconBg: "bg-orange-500",
    badge: "Patient Engagement",
  },
];

export default function AIAutomationSection() {
  return (
    <section className="relative overflow-hidden bg-[#F6F7FB] py-24 md:py-32 text-slate-900 border-t border-slate-200/60">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-[150px]" />
      <div className="pointer-events-none absolute -right-20 top-20 h-[450px] w-[450px] rounded-full bg-purple-500/[0.03] blur-[130px]" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-[450px] w-[450px] rounded-full bg-orange-400/[0.03] blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

        {/* ─── SECTION HEADER ─── */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-2 shadow-2xs backdrop-blur-xl"
          >
            <Sparkles size={14} className="text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[11px] font-semibold tracking-[0.16em] text-blue-700 uppercase">
              PLATFORM-WIDE INTELLIGENCE
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#17191F] sm:text-5xl lg:text-6xl leading-[1.12]"
          >
            AI That Works Beyond{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#F97316] bg-clip-text text-transparent">
              Appointment Booking.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#6B6F78] md:text-lg"
          >
            MedTech AI supports the entire healthcare workflow, from patient communication to follow-ups, notifications, hospital operations, and daily activity insights.
          </motion.p>
        </div>

        {/* ─── CENTRAL INTELLIGENCE NODE & CONNECTED CARDS ─── */}
        <div className="mt-16 relative">
          
          {/* Central AI Intelligence Hub */}
          <div className="flex justify-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              className="relative rounded-3xl border border-white/90 bg-gradient-to-b from-white/90 to-white/70 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl text-center max-w-lg w-full overflow-hidden"
            >
              {/* Rotating glowing halo */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-blue-400/50"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 rounded-full border border-dashed border-purple-400/30"
                />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                  <Bot size={26} />
                </div>
              </div>

              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                MEDTECH AI CORE
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                Operating Intelligence Layer
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Autonomous workflow routing, operational insights, and automated communication across all workspaces.
              </p>

              {/* Status Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Workflow Intelligence
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-blue-600">
                  <ShieldCheck size={13} />
                  Privacy-Preserved
                </span>
              </div>
            </motion.div>
          </div>

          {/* 6 Grid Capability Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {aiCapabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  className="group relative overflow-hidden rounded-[26px] border border-white/90 bg-white/75 p-6 shadow-[0_15px_40px_rgba(15,23,42,0.04)] backdrop-blur-xl text-left transition-all hover:bg-white hover:shadow-[0_20px_50px_rgba(37,99,235,0.08)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-2xl ${item.iconBg} text-white flex items-center justify-center shadow-md shadow-blue-500/10`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 px-2.5 py-1 rounded-full transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#17191F] group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-[#6B6F78] mt-2 font-normal">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Philosophy Callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-700">
              <span className="text-blue-600 font-bold">MedTech Core Rule:</span>
              <span>AI-powered workflows. Human healthcare decisions.</span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
