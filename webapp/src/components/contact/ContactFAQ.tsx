"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const contactFaqs: FAQItem[] = [
  {
    question: "What is MedTech Fixaters?",
    answer:
      "MedTech Fixaters is an all-in-one AI-powered digital healthcare platform. It brings hospital administration, doctor workspaces, live token queues, QR appointment booking, and an inbuilt patient CRM into a single connected system.",
  },
  {
    question: "Who is MedTech Fixaters designed for?",
    answer:
      "MedTech Fixaters is designed for solo clinical practices, polyclinics, nursing homes, and multi-specialty hospital networks looking to streamline OPD operations, eliminate waiting room congestion, and securely manage patient records.",
  },
  {
    question: "How does the hospital QR appointment system work?",
    answer:
      "Every hospital receives a unique QR code standee and appointment link. When patients scan it using any mobile camera, they only see doctors and departments from that specific facility, select AI-guided or direct booking, and receive an instant digital queue pass with live status updates.",
  },
  {
    question: "Does AI replace doctors?",
    answer:
      "No. MedTech AI functions strictly as an assistive intelligence and workflow orchestration layer. It assists with pre-consultation symptom intake, smart department routing, and note formatting so doctors can focus entirely on high-quality clinical care.",
  },
  {
    question: "How does hospital data separation work?",
    answer:
      "Each hospital operates within a strictly isolated workspace backed by PostgreSQL Row-Level Security (RLS). Hospital H1 cannot access doctors, patients, revenue, or appointments of Hospital H2 under any circumstances.",
  },
  {
    question: "How can a hospital discuss implementation?",
    answer:
      "You can submit an inquiry through the contact form above, call our team directly at +91 95878 67559, or send an email to contact@shahidkhan.site. Our implementation specialists will schedule a 15-minute live platform walkthrough.",
  },
];

export default function ContactFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20 bg-[#F6F7FB]/60 w-full">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1 shadow-2xs backdrop-blur-xl"
          >
            <HelpCircle size={11} className="text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
              COMMONLY ASKED
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17191F]"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-slate-500 max-w-xl mx-auto"
          >
            Find quick answers about MedTech Fixaters, data isolation, QR check-ins, and onboarding.
          </motion.p>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-8 sm:mt-12 space-y-2.5 sm:space-y-3.5">
          {contactFaqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                layout
                initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className={`overflow-hidden rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-blue-200 bg-white/95 shadow-[0_10px_35px_rgba(37,99,235,0.06)]"
                    : "border-white bg-white/70 hover:bg-white/90"
                } backdrop-blur-xl text-left`}
              >
                <button
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 p-4 sm:px-6 sm:py-5 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition-colors ${
                        isOpen
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <span className="text-xs sm:text-sm lg:text-base font-bold text-[#17191F] leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full ${
                      isOpen ? "bg-blue-50 text-blue-600" : "text-slate-400"
                    }`}
                  >
                    <ChevronDown size={15} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 pl-3.5 sm:pl-[4rem]">
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
