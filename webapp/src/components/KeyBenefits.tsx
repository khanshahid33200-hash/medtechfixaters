import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  HeartPulse,
  Building2,
  Layers,
  Sparkles,
  Users,
  Bot,
  CalendarCheck,
  Bell,
  BarChart3,
  Stethoscope,
  MessageSquare,
} from "lucide-react";

// OPD Core Benefits
const benefits = [
  {
    icon: Clock3,
    title: "Faster Patient Flow",
    description:
      "Reduce waiting time and streamline every step of the patient journey.",
  },
  {
    icon: Layers,
    title: "Smarter Reception",
    description:
      "Manage appointments, registrations, and patient queues from one place.",
  },
  {
    icon: Users,
    title: "Connected Healthcare",
    description:
      "Keep doctors, patients, and hospital operations connected in one system.",
  },
  {
    icon: Sparkles,
    title: "Save Valuable Time",
    description:
      "Automate repetitive OPD tasks and reduce unnecessary manual work.",
  },
  {
    icon: HeartPulse,
    title: "Better Patient Experience",
    description:
      "Create a faster, simpler, and more organized experience for every patient.",
  },
  {
    icon: Building2,
    title: "Built to Scale",
    description:
      "A flexible platform designed for clinics, hospitals, and growing teams.",
  },
];

// AI Capabilities
const aiCapabilities = [
  {
    icon: Bot,
    title: "AI Booking Intelligence",
    description:
      "Guides appointment intake and supports department and doctor selection based on patient-provided concerns.",
    color: "blue",
    iconBg: "bg-blue-500",
    badge: "Smart Intake",
  },
  {
    icon: CalendarCheck,
    title: "Automated Follow-Ups",
    description:
      "Automatically schedule and organize follow-up communication based on authorized hospital clinical workflows.",
    color: "purple",
    iconBg: "bg-indigo-600",
    badge: "Scheduled Care",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Keep patients, doctors, hospitals, and staff informed in real time about important queue and appointment events.",
    color: "amber",
    iconBg: "bg-amber-500",
    badge: "Real-time",
  },
  {
    icon: BarChart3,
    title: "Hospital Activity Insights",
    description:
      "Turn daily appointments, queues, doctor activity, and operational data into clear, actionable summaries.",
    color: "emerald",
    iconBg: "bg-emerald-600",
    badge: "Operational Analytics",
  },
  {
    icon: Stethoscope,
    title: "Doctor Workflow Intelligence",
    description:
      "Organize appointment information, patient activity notes, and daily consultation queues into private workspaces.",
    color: "cyan",
    iconBg: "bg-cyan-600",
    badge: "Doctor Workspace",
  },
  {
    icon: MessageSquare,
    title: "Patient Communication",
    description:
      "Support automated multi-channel reminders for upcoming visits, queue changes, digital prescriptions, and reports.",
    color: "orange",
    iconBg: "bg-orange-500",
    badge: "Patient Engagement",
  },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 25,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease,
    },
  },
};

export default function KeyBenefits() {
  return (
    <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-28 border-t border-slate-100">
      {/* Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-[120px]" />
      <div className="pointer-events-none absolute right-[5%] bottom-10 h-80 w-80 rounded-full bg-orange-100/40 blur-[100px]" />
      <div className="pointer-events-none absolute left-[5%] bottom-1/3 h-80 w-80 rounded-full bg-purple-100/30 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* ─── PART 1: EVERYTHING YOUR OPD NEEDS. ONE SMART PLATFORM. ─── */}
        <motion.div
          initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-blue-600 shadow-2xs">
            <Sparkles size={13} className="text-orange-500 animate-pulse" />
            <span>WHY MEDTECH FIXATERS • OPD PLATFORM</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-[46px] leading-[1.12]">
            Everything Your OPD Needs.
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent mt-1">
              One Smart Platform.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
            MedTech Fixaters brings patients, doctors, reception staff, appointments, AI automation, and daily OPD operations into one connected digital system.
          </p>
        </motion.div>

        {/* OPD Benefits Grid (6 Cards) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                whileHover={{
                  y: -5,
                  scale: 1.015,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 20,
                }}
                className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl text-left"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/0 blur-2xl transition-all duration-500 group-hover:bg-blue-100/70" />

                <span className="absolute right-5 top-5 text-xs font-bold text-slate-300">
                  0{index + 1}
                </span>

                <motion.div
                  whileHover={{ rotate: 5, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 shadow-2xs"
                >
                  <Icon size={20} strokeWidth={2.2} />
                </motion.div>

                <h3 className="relative text-base font-bold text-slate-900">
                  {benefit.title}
                </h3>

                <p className="relative mt-2 text-xs leading-relaxed text-slate-500">
                  {benefit.description}
                </p>

                <div className="relative mt-4 h-px w-full bg-slate-100">
                  <motion.div
                    className="h-px bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-400"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06, duration: 0.7 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── SEAMLESS MERGED DIVIDER TO AI AUTOMATION ─── */}
        <div className="my-20 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-2xs">
            <Bot size={15} className="text-blue-600 animate-pulse" />
            <span>INTELLIGENCE ENGINE</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* ─── PART 2: AI THAT WORKS BEYOND APPOINTMENT BOOKING. ─── */}
        <motion.div
          initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50/80 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-purple-700 shadow-2xs">
            <Sparkles size={13} className="text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>PLATFORM-WIDE INTELLIGENCE</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-[46px] leading-[1.12]">
            AI That Works Beyond{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#F97316] bg-clip-text text-transparent">
              Appointment Booking.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
            MedTech AI supports the entire healthcare workflow, from patient symptom intake to follow-ups, real-time notifications, hospital operations, and daily activity insights.
          </p>
        </motion.div>

        {/* Central AI Intelligence Hub */}
        <div className="mb-12 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 p-6 text-center shadow-[0_20px_50px_rgba(37,99,235,0.08)] backdrop-blur-xl"
          >
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-blue-400/60"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-dashed border-purple-400/40"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/30">
                <Bot size={24} />
              </div>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              MedTech AI Operating Engine
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Continuously processing patient intake, queue status, doctor schedules, and clinical tasks.
            </p>
          </motion.div>
        </div>

        {/* AI Capabilities Grid (6 Cards) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {aiCapabilities.map((ai, index) => {
            const Icon = ai.icon;

            return (
              <motion.div
                key={ai.title}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${ai.iconBg}`}>
                    <Icon size={20} />
                  </div>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-700">
                    {ai.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {ai.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {ai.description}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
                  <span>AI Automated</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Unified Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-lg font-bold text-slate-900">
            Experience a Smarter, AI-Powered OPD
          </p>

          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
            Bring your entire OPD operation, reception staff, doctors, and patient communications together with one connected platform.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/book-demo">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] via-[#FF8533] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B00] px-7 py-3 font-bold text-xs sm:text-sm text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
              >
                <span>Book a Live Demo</span>
                <ArrowRight size={15} />
              </motion.button>
            </Link>

            <Link to="/features">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-6 py-3 font-bold text-xs sm:text-sm text-slate-800 transition-all cursor-pointer"
              >
                <span>Explore All Features</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

