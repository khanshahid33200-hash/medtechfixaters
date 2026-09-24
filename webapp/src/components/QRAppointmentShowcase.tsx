import { motion } from "framer-motion";
import {
  Bot,
  CalendarCheck,
  Check,
  ChevronRight,
  Building2,
  QrCode,
  Scan,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

const flowSteps = [
  "Hospital QR",
  "Patient Scans",
  "AI Symptom Intake",
  "AI Specialist Match",
  "Live Queue Token",
  "Doctor Dashboard",
];

export default function QRAppointmentShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#F6F7FB] py-24 sm:py-32 text-slate-900">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading />

        <div className="relative mt-16 grid items-center gap-8 lg:grid-cols-[280px_minmax(340px,1fr)_310px]">
          <HospitalQRCard />

          <PhoneShowcase />

          <DoctorDashboardCard />
        </div>

        <AnimatedFlow />

        <FeatureCards />
      </div>
    </section>
  );
}

function Background() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[5%] top-[15%] h-[400px] w-[400px] rounded-full bg-blue-300/20 blur-[130px]" />
        <div className="absolute right-[5%] top-[35%] h-[400px] w-[400px] rounded-full bg-orange-200/20 blur-[130px]" />
        <div className="absolute bottom-[-200px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-200/20 blur-[140px]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),transparent_70%)]" />
    </>
  );
}

function SectionHeading() {
  return (
    <div className="mx-auto max-w-5xl text-center">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          filter: "blur(10px)",
        }}
        whileInView={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 shadow-2xs backdrop-blur-xl"
      >
        <Bot size={15} className="text-blue-600 animate-pulse" />

        <span className="text-[10px] font-bold tracking-[0.18em] text-blue-700 sm:text-xs">
          AI-ASSISTED QR BOOKING SYSTEM
        </span>
      </motion.div>

      <motion.h2
        initial={{
          opacity: 0,
          y: 30,
          filter: "blur(15px)",
        }}
        whileInView={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mt-7 text-4xl font-semibold tracking-[-0.055em] text-[#172033] sm:text-6xl lg:text-7xl leading-[1.1]"
      >
        One QR Code.
        <br />
        <span className="text-blue-600">
          AI-Guided Booking.
        </span>{" "}
        <span className="text-[#F97316]">A Live Queue.</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg"
      >
        Patients scan a hospital-specific QR code to get instantly guided by MedTech AI — analyzing symptoms in real time, routing to the right specialist within seconds, and issuing live queue tokens.
      </motion.p>
    </div>
  );
}

function HospitalQRCard() {
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -50,
        filter: "blur(12px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.8,
        ease: ease,
      }}
      animate={{
        y: [0, -10, 0],
      }}
      className="relative z-10 text-left"
    >
      <div className="overflow-hidden rounded-[32px] border border-white/90 bg-white/65 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 size={22} />
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
            <Sparkles size={12} className="text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[9px] font-bold tracking-wide">
              AI-ENABLED
            </span>
          </div>
        </div>

        <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">
          Hospital Appointment QR
        </p>

        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#172033]">
          City Care Hospital
        </h3>

        <div className="relative mt-7 aspect-square overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-inner">
          <QrCode className="h-full w-full text-[#172033]" strokeWidth={1.3} />

          <motion.div
            animate={{
              top: ["8%", "90%", "8%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-[8%] right-[8%] h-[2px] rounded-full bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.9)]"
          />
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-blue-50 p-4">
          <Scan size={18} className="text-blue-600" />

          <div>
            <p className="text-xs font-semibold text-blue-700">
              Scan for AI Booking
            </p>

            <p className="mt-1 text-[9px] text-blue-500">
              Instant AI symptom intake & routing
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <ShieldCheck size={14} className="text-slate-400" />

          <p className="text-[10px] leading-5 text-slate-400">
            Routes to verified hospital doctors only
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PhoneShowcase() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 60,
        scale: 0.9,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true }}
      transition={{
        duration: 1,
        type: "spring",
        stiffness: 70,
      }}
      className="relative z-20 flex min-h-[680px] items-center justify-center"
    >
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]"
      />

      <motion.div
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <div className="relative w-[320px] rounded-[52px] bg-[#10141c] p-[7px] shadow-[0_40px_100px_rgba(15,23,42,0.3)] sm:w-[350px]">
          <div className="absolute left-1/2 top-[12px] z-30 h-[28px] w-[115px] -translate-x-1/2 rounded-full bg-black" />

          <div className="relative h-[680px] overflow-hidden rounded-[46px] bg-[#f6f8fc]">
            <PhoneScreenContent />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PhoneScreenContent() {
  const ease: [number, number, number, number] = [0.65, 0, 0.35, 1];
  return (
    <div className="relative h-full overflow-hidden px-4 pb-6 pt-12 text-left">
      <motion.div
        animate={{
          y: [0, -470, -940, -1410, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: ease,
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
        className="absolute inset-x-0 top-0"
      >
        <BookingPreview />
        <AIChatPreview />
        <DoctorSuggestionPreview />
        <ConfirmationPreview />
      </motion.div>
    </div>
  );
}

function BookingPreview() {
  return (
    <div className="h-[470px] px-5 pb-8 pt-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#172033]">
            City Care Hospital
          </p>

          <p className="mt-1 text-[9px] text-slate-400">
            Smart AI Appointment Portal
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 size={18} />
        </div>
      </div>

      <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[#172033]">
        Book Your Appointment
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Start with AI triage or choose your doctor directly.
      </p>

      <PreviewOption
        icon={<Bot size={22} />}
        title="AI Guided Booking"
        text="Share your health concern & receive intelligent doctor guidance."
        badge="RECOMMENDED"
        blue
      />

      <PreviewOption
        icon={<Stethoscope size={21} />}
        title="Direct Booking"
        text="Manually select your department and available doctor."
      />
    </div>
  );
}

function AIChatPreview() {
  return (
    <div className="h-[470px] px-5 pb-8 pt-12">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
          <Bot size={19} />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[#172033]">
              MedTech Assistant
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <p className="text-[9px] text-blue-600 font-medium">
            AI Clinical Intake & Triage
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <ChatPreview text="Hello Rahul. Tell us about the symptoms you are experiencing." />
        <ChatPreview
          text="High fever, severe headache, and body pain for 2 days."
          patient
        />
        <ChatPreview text="Any pre-existing conditions or current medications?" />
        <ChatPreview
          text="No known conditions. Just mild fatigue."
          patient
        />
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3.5">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Sparkles size={18} className="text-blue-600" />
        </motion.div>

        <div>
          <p className="text-xs font-bold text-blue-800">
            AI Triage in Progress...
          </p>

          <p className="mt-0.5 text-[9px] text-blue-600">
            Matching symptoms with General Medicine specialists
          </p>
        </div>
      </div>
    </div>
  );
}

function DoctorSuggestionPreview() {
  return (
    <div className="h-[470px] px-5 pb-8 pt-12">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Bot size={22} />
        </div>
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          AI MATCH: 98%
        </span>
      </div>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
        AI Suggested Department
      </p>

      <h3 className="mt-1 text-2xl font-semibold text-[#172033]">
        General Medicine
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        Based on acute fever and systemic symptoms.
      </p>

      <div className="mt-5 rounded-[24px] border border-blue-100 bg-white p-4 shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
            <Stethoscope size={22} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-[#172033]">
              Dr. Arjun Patel
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              Senior General Physician • Room 104
            </p>

            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-emerald-600">
                ● Available Today
              </span>
              <span className="text-[9px] font-bold text-slate-600">
                12 in Queue
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
        <p className="text-[9px] text-slate-500">
          AI guidance assists triage. Patients can freely choose another doctor.
        </p>
      </div>
    </div>
  );
}

function ConfirmationPreview() {
  return (
    <div className="h-[470px] px-5 pb-8 pt-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check size={26} />
      </div>

      <h3 className="mt-4 text-center text-xl font-semibold text-[#172033]">
        Appointment Confirmed
      </h3>

      <div className="mt-4 rounded-[24px] bg-gradient-to-br from-blue-600 to-[#1457bb] p-5 text-center text-white shadow-xl shadow-blue-500/20">
        <p className="text-[9px] text-blue-100 tracking-wider uppercase font-medium">
          LIVE TOKEN NUMBER
        </p>

        <p className="mt-1 text-3xl font-bold">
          A-013
        </p>

        <div className="mt-3.5 rounded-xl bg-white/10 px-3 py-2 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[8px] text-blue-100">LIVE QUEUE</p>
            <p className="text-xs font-bold">12 Ahead</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-blue-100">EST. WAIT</p>
            <p className="text-xs font-bold">~20 min</p>
          </div>
        </div>
      </div>

      <div className="mt-3.5 rounded-xl bg-white p-3 text-left shadow-2xs border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#172033]">Dr. Arjun Patel</p>
            <p className="text-[9px] text-slate-400">General Medicine</p>
          </div>
          <span className="text-[8.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            AI Triage Attached
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewOption({
  icon,
  title,
  text,
  badge,
  blue = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  badge?: string;
  blue?: boolean;
}) {
  return (
    <div
      className={`mt-4 rounded-[22px] border p-4 ${
        blue
          ? "border-blue-200 bg-gradient-to-br from-blue-600 to-[#2377d5] text-white shadow-lg shadow-blue-500/20"
          : "border-slate-100 bg-white text-[#172033]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            blue
              ? "bg-white/15 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold">
              {title}
            </p>
            {badge && (
              <span className="text-[7.5px] font-extrabold bg-white/20 text-white px-1.5 py-0.5 rounded-md tracking-wider">
                {badge}
              </span>
            )}
          </div>

          <p
            className={`mt-1 text-[9.5px] leading-snug ${
              blue ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {text}
          </p>
        </div>

        <ChevronRight size={15} className="ml-auto mt-0.5 opacity-70 shrink-0" />
      </div>
    </div>
  );
}

function ChatPreview({
  text,
  patient = false,
}: {
  text: string;
  patient?: boolean;
}) {
  return (
    <div className={`flex ${patient ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-[10px] leading-relaxed ${
          patient
            ? "rounded-br-xs bg-blue-600 text-white shadow-xs"
            : "rounded-bl-xs bg-white text-slate-600 shadow-2xs border border-slate-100"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function DoctorDashboardCard() {
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 50,
        filter: "blur(12px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.8,
        delay: 0.15,
        ease: ease,
      }}
      className="relative z-10 text-left"
    >
      <div className="overflow-hidden rounded-[32px] border border-white bg-white/70 shadow-[0_25px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
        <div className="bg-gradient-to-r from-orange-500 to-[#f59e0b] p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Doctor Workspace
              </p>

              <p className="mt-0.5 text-[9px] text-orange-100">
                Live AI appointment dispatch
              </p>
            </div>

            <motion.div
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
            >
              <CalendarCheck size={18} />
            </motion.div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Stethoscope size={20} className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#172033]">
                Dr. Arjun Patel
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                General Medicine • Room 104
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <DashboardStat
              value="24"
              label="Today's Appts"
            />

            <DashboardStat
              value="A-012"
              label="Current Patient"
            />
          </div>

          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 rgba(37,99,235,0)",
                "0 0 35px rgba(37,99,235,0.16)",
                "0 0 0 rgba(37,99,235,0)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="mt-4 rounded-[20px] border border-blue-100 bg-blue-50/90 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 shadow-xs">
                <Bot size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-700">
                    New AI Booking
                  </p>
                  <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-[7.5px] font-bold">
                    TOKEN A-013
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-[#172033]">
                  Rahul Sharma
                </p>

                <p className="mt-1 text-[9px] text-slate-600 bg-white/80 p-1.5 rounded-lg border border-blue-100">
                  <span className="font-semibold text-blue-700">Triage Summary:</span> Acute fever & headache (2d)
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-[#172033]">
              Live Queue
            </p>

            <div className="mt-2 space-y-1.5">
              <QueueRow token="A-011" status="Completed" />
              <QueueRow token="A-012" status="Consulting" active />
              <QueueRow token="A-013" status="Next (AI Booking)" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-base font-bold text-[#172033]">
        {value}
      </p>

      <p className="mt-0.5 text-[8.5px] leading-tight text-slate-400">
        {label}
      </p>
    </div>
  );
}

function QueueRow({
  token,
  status,
  active = false,
}: {
  token: string;
  status: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[10px] ${
        active ? "bg-blue-50" : "bg-slate-50"
      }`}
    >
      <span className="font-bold text-blue-600">
        {token}
      </span>

      <span className="text-[9px] text-slate-500">
        {status}
      </span>
    </div>
  );
}

function AnimatedFlow() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="relative mx-auto mt-14 max-w-6xl"
    >
      <div className="absolute left-[5%] right-[5%] top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-300 to-transparent lg:block" />

      <div className="relative flex flex-wrap justify-center gap-2.5">
        {flowSteps.map((step, index) => (
          <motion.div
            key={step}
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            transition={{
              delay: index * 0.08,
              type: "spring",
              stiffness: 120,
            }}
            className="relative rounded-full border border-white bg-white/80 px-4 py-2.5 shadow-2xs backdrop-blur-xl"
          >
            <span className="mr-2 text-[10px] font-bold text-blue-600">
              0{index + 1}
            </span>

            <span className="text-[10px] font-semibold text-slate-600">
              {step}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FeatureCards() {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Symptom Intake",
      text: "Patients chat with MedTech Assistant to evaluate concerns and match appropriate hospital specialties.",
    },
    {
      icon: Stethoscope,
      title: "Intelligent Doctor Routing",
      text: "AI matches patients exclusively with active, verified doctors registered inside the scanned hospital.",
    },
    {
      icon: Users,
      title: "Live Queue & Triage Handoff",
      text: "Patients receive instant tokens and estimated waiting times while doctors receive automated triage summaries.",
    },
  ];

  return (
    <div className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-3">
      {features.map((feature, index) => {
        const Icon = feature.icon;

        return (
          <motion.div
            key={feature.title}
            initial={{
              opacity: 0,
              y: 30,
              filter: "blur(8px)",
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
            }}
            whileHover={{
              y: -5,
              scale: 1.01,
            }}
            className="rounded-[24px] border border-white bg-white/65 p-6 shadow-[0_15px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon size={20} />
            </div>

            <h3 className="mt-5 text-base font-semibold tracking-tight text-[#172033]">
              {feature.title}
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {feature.text}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
