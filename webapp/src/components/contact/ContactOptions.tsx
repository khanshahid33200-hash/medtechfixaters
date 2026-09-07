"use client";

import { motion } from "motion/react";
import {
  Layers,
  Building2,
  Headphones,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface OptionCardProps {
  icon: typeof Layers;
  title: string;
  description: string;
  ctaText: string;
  badge: string;
  accentColor: string;
  index: number;
  onSelect: (subject: string) => void;
}

const contactOptions = [
  {
    icon: Layers,
    title: "Product & Platform",
    description:
      "Questions about MedTech Fixaters, platform features, hospital workflows, or AI capabilities.",
    ctaText: "Talk About the Platform",
    badge: "Platform Demo",
    accentColor: "from-blue-600 to-indigo-600",
    subjectKey: "Product & Platform Demonstration",
  },
  {
    icon: Building2,
    title: "Hospital Partnership",
    description:
      "Discuss digital hospital operations, patient flow, appointments, queues, and workflow automation.",
    ctaText: "Discuss Partnership",
    badge: "Enterprise",
    accentColor: "from-orange-500 to-amber-600",
    subjectKey: "Hospital Partnership & Deployment",
  },
  {
    icon: Headphones,
    title: "Technical Support",
    description:
      "Need help with an existing setup, account, workflow, or technical issue?",
    ctaText: "Get Support",
    badge: "24/7 Support",
    accentColor: "from-emerald-500 to-teal-600",
    subjectKey: "Technical Support & Troubleshooting",
  },
  {
    icon: HelpCircle,
    title: "General Enquiries",
    description:
      "Have another question? Send us a message and our team will get back to you.",
    ctaText: "Send Enquiry",
    badge: "Inquiries",
    accentColor: "from-violet-500 to-purple-600",
    subjectKey: "General Inquiries",
  },
];

function ContactCard({
  icon: Icon,
  title,
  description,
  ctaText,
  badge,
  accentColor,
  index,
  onSelect,
}: OptionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
        scale: 1.01,
      }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-[28px] border border-white/80 bg-white/75 p-4 sm:p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 hover:border-blue-200/90 hover:shadow-[0_20px_45px_rgba(37,99,235,0.1)] text-left"
    >
      {/* Top subtle hover gradient line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100 from-blue-500 via-indigo-500 to-orange-500" />

      <div>
        {/* Header row: Icon & Badge */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${accentColor} text-white shadow-md shadow-blue-500/20`}
          >
            <Icon size={19} />
          </div>
          <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200/60">
            {badge}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#17191F] group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500 font-normal">
          {description}
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100">
        <button
          onClick={() => onSelect(title)}
          className="inline-flex w-full items-center justify-between rounded-xl bg-slate-50/90 px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold text-slate-700 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white cursor-pointer"
        >
          <span>{ctaText}</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

export default function ContactOptions({
  onSelectOption,
}: {
  onSelectOption?: (subject: string) => void;
}) {
  const handleSelect = (subject: string) => {
    if (onSelectOption) {
      onSelectOption(subject);
    }
    const formElement = document.getElementById("contact-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-10 sm:py-16 lg:py-20 w-full">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1 shadow-2xs backdrop-blur-xl"
          >
            <Sparkles size={11} className="text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
              DIRECT CHANNELS
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17191F]"
          >
            How Can We Help?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-500 max-w-xl mx-auto"
          >
            Choose the right way to reach our team and discuss your healthcare digitalization goals.
          </motion.p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-8 sm:mt-12 grid gap-3.5 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {contactOptions.map((opt, i) => (
            <ContactCard
              key={opt.title}
              index={i}
              icon={opt.icon}
              title={opt.title}
              description={opt.description}
              ctaText={opt.ctaText}
              badge={opt.badge}
              accentColor={opt.accentColor}
              onSelect={() => handleSelect(opt.subjectKey)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
