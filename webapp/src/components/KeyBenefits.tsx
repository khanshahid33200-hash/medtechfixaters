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
} from "lucide-react";

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
    <section className="relative overflow-hidden bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[600px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-[110px]" />
      <div className="pointer-events-none absolute right-[10%] bottom-5 h-60 w-60 rounded-full bg-orange-100/35 blur-[90px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.6,
            ease,
          }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-blue-600 shadow-2xs">
            <Sparkles size={13} className="text-orange-500" />
            WHY MEDTECH FIXATERS
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[44px] leading-tight">
            Everything Your OPD Needs.
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
              One Smart Platform.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-500">
            MedTech Fixaters brings patients, doctors, reception staff,
            appointments, and daily OPD operations into one connected
            digital system.
          </p>
        </motion.div>

        {/* Smaller, Sleeker Benefits Grid */}
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
                className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/80 p-5 sm:p-5.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl text-left"
              >
                {/* Hover Glow */}
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/0 blur-2xl transition-all duration-500 group-hover:bg-blue-100/70" />

                {/* Number */}
                <span className="absolute right-5 top-5 text-xs font-semibold text-slate-300">
                  0{index + 1}
                </span>

                {/* Compact Icon */}
                <motion.div
                  whileHover={{
                    rotate: 5,
                    scale: 1.08,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
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

                {/* Bottom Accent */}
                <div className="relative mt-4 h-px w-full bg-slate-100">
                  <motion.div
                    className="h-px bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-400"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.06,
                      duration: 0.7,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Compact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-base font-semibold text-slate-800">
            Experience a Smarter OPD
          </p>

          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
            Bring your entire OPD operation together with one connected
            healthcare platform.
          </p>

          <Link to="/features">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] via-[#FF8533] to-[#FF4500] hover:from-[#E65100] hover:to-[#FF6B00] px-6 py-2.5 font-bold text-xs sm:text-sm text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              <span>Explore MedTech Fixaters</span>
              <ArrowRight size={15} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
