import { useState } from "react"
import { motion } from "framer-motion"
import {
  Bot,
  CalendarCheck,
  FileText,
  QrCode,
  Stethoscope,
  Users,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Instant QR Check-In",
    text: "Patients scan the hospital standee QR using any standard smartphone camera. No app download or account creation required.",
    icon: QrCode,
    badge: "Zero App Download",
    color: "orange",
  },
  {
    number: "02",
    title: "AI or Direct Doctor Booking",
    text: "Patients can describe symptoms to MedTech AI for guided department triage or immediately select their preferred doctor.",
    icon: Bot,
    badge: "Smart Triage",
    color: "blue",
  },
  {
    number: "03",
    title: "Symptom & History Capture",
    text: "Relevant symptoms, vitals, and previous medical history are structured digitally before the patient ever steps into the clinic room.",
    icon: Stethoscope,
    badge: "Pre-Consultation",
    color: "orange",
  },
  {
    number: "04",
    title: "Live Token & Queue Countdown",
    text: "Patients receive a live digital token with real-time ETA countdown, allowing them to relax rather than wait in crowded hallways.",
    icon: Users,
    badge: "Live ETA Tracker",
    color: "blue",
  },
  {
    number: "05",
    title: "Seamless Doctor Consultation",
    text: "The patient is called directly into the doctor's consultation room when their turn arrives. Clinical notes and prescriptions are generated instantly.",
    icon: CalendarCheck,
    badge: "Sub-30s Desk",
    color: "orange",
  },
  {
    number: "06",
    title: "Instant Digital Prescription",
    text: "Digital prescriptions, medication timing reminders, and diagnostic follow-up orders are instantly accessible on the patient's phone.",
    icon: FileText,
    badge: "Encrypted Cloud Rx",
    color: "blue",
  },
]

export default function PatientJourney() {
  const [activeStep, setActiveStep] = useState(3)

  return (
    <section
      id="patient"
      className="relative overflow-hidden bg-white/70 py-28 md:py-36 px-6 border-y border-slate-200/60"
    >
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-[#FF6B2C] inline-block shadow-2xs">
            01. FOR PATIENTS
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            From QR Scan To Consultation.<br />
            <span className="bg-gradient-to-r from-[#FF6B2C] to-[#2563EB] bg-clip-text text-transparent">
              Frictionless & Fully Transparent.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            Patients experience zero waiting room anxiety with real-time queue tracking, transparent wait times, and direct digital prescription delivery.
          </p>
        </div>

        {/* 2-Column Grid: Timeline on Left, Live Mobile Simulator on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: 6-Step Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isOrange = step.color === "orange"
              const isSelected = activeStep === index

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  onClick={() => setActiveStep(index)}
                  className={`group relative rounded-[28px] border p-6 backdrop-blur-2xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-white border-blue-400 shadow-[0_20px_50px_rgba(37,99,235,0.08),inset_0_1px_1px_rgba(255,255,255,1)] scale-[1.01]"
                      : "bg-white/70 border-white/90 hover:bg-white hover:border-slate-300/80 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Step Icon */}
                    <div
                      className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl shadow-2xs transition-transform group-hover:scale-105 ${
                        isOrange
                          ? "bg-orange-50 text-[#FF6B2C] border border-orange-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}
                    >
                      <Icon size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-black text-slate-400">
                            {step.number}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {step.title}
                          </h3>
                        </div>

                        <span
                          className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            isOrange
                              ? "bg-orange-50 text-[#FF6B2C] border-orange-200"
                              : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}
                        >
                          {step.badge}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Right: Live Interactive Mobile Patient Simulator (5 cols) */}
          <div className="lg:col-span-5 sticky top-28">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto max-w-[360px] rounded-[40px] bg-[#0F172A] p-4 shadow-[0_30px_90px_rgba(15,23,42,0.25)] border-[5px] border-slate-800 text-white text-left"
            >
              {/* Phone Speaker & Camera Notch */}
              <div className="flex justify-center mb-4">
                <div className="h-4 w-28 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <div className="w-8 h-1 rounded-full bg-slate-800" />
                </div>
              </div>

              {/* Patient App Header */}
              <div className="px-3 pb-3 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-extrabold text-[#FF6B2C] uppercase tracking-wider block">
                    City Care Hospital
                  </span>
                  <h4 className="text-sm font-bold text-white">Live OPD Status</h4>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TOKEN ACTIVE</span>
                </div>
              </div>

              {/* Big Token Number Card */}
              <div className="p-5 my-4 rounded-3xl bg-gradient-to-br from-blue-600/30 to-violet-600/20 border border-blue-400/30 text-center space-y-2">
                <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest">
                  YOUR TOKEN NUMBER
                </span>
                <div className="text-5xl font-black text-white tracking-tight font-mono">
                  #CC-012
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Assigned to: <strong className="text-white">Dr. Amit Sharma</strong> (Cardiology)
                </div>
              </div>

              {/* Real-time Status Card */}
              <div className="space-y-2 px-1">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-[#FF6B2C]" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">Estimated Wait Time</div>
                      <div className="text-xs font-bold text-white">~8 mins (1 patient ahead)</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 font-mono">ON TIME</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-blue-400" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">Digital Health Record</div>
                      <div className="text-xs font-bold text-white">Vitals & Symptoms Synced</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-300">SECURE</span>
                </div>
              </div>

              {/* Instant Notification Banner */}
              <div className="mt-4 p-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-center">
                <div className="text-xs font-bold text-orange-300 flex items-center justify-center gap-1.5">
                  <Zap size={13} className="text-[#FF6B2C]" />
                  <span>SMS & WhatsApp Alert Active</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  You will be notified when your turn is next.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
