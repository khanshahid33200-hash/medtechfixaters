import { motion, useReducedMotion } from "framer-motion";
import { Bot, Building2, Check, ChevronRight, Sparkles, Stethoscope } from "lucide-react";

// Phone in the hero that scrolls through the patient booking flow on its own:
// booking choice -> AI intake chat -> suggested doctor -> confirmed token.
// Sample names and numbers only; nothing here is real patient data.
export default function HeroPhone() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.92, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.35 }}
      className="relative flex items-center justify-center"
      role="img"
      aria-label="Phone showing a patient booking an appointment: choosing AI guided booking, describing symptoms, getting a suggested doctor and a live queue token"
    >
      {/* Orange glow behind the phone */}
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-[380px] w-[380px] sm:h-[460px] sm:w-[460px] rounded-full bg-[#FF6A00]/30 blur-[100px]"
      />

      <motion.div
        animate={reduce ? undefined : { y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <div aria-hidden className="relative w-[270px] rounded-[46px] bg-[#10141c] p-[7px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] ring-1 ring-white/10 sm:w-[300px]">
          <div className="absolute left-1/2 top-[12px] z-30 h-[26px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
          <div className="relative h-[500px] overflow-hidden rounded-[40px] bg-[#fbf8f6] sm:h-[560px]">
            <PhoneScreenContent />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PhoneScreenContent() {
  const ease: [number, number, number, number] = [0.65, 0, 0.35, 1];
  const reduce = useReducedMotion();
  return (
    <div className="relative h-full overflow-hidden px-4 pb-6 pt-12 text-left">
      <motion.div
        animate={reduce ? undefined : {
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

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#E85D00]">
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
        orange
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A3D] text-white shadow-md shadow-orange-500/20">
          <Bot size={19} />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[#172033]">
              MedTech Assistant
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <p className="text-[9px] text-[#E85D00] font-medium">
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

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-3.5">
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
          <Sparkles size={18} className="text-[#E85D00]" />
        </motion.div>

        <div>
          <p className="text-xs font-bold text-orange-900">
            AI Triage in Progress...
          </p>

          <p className="mt-0.5 text-[9px] text-[#E85D00]">
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
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#E85D00]">
          <Bot size={22} />
        </div>
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          AI MATCH: 98%
        </span>
      </div>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#E85D00]">
        AI Suggested Department
      </p>

      <h3 className="mt-1 text-2xl font-semibold text-[#172033]">
        General Medicine
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        Based on acute fever and systemic symptoms.
      </p>

      <div className="mt-5 rounded-[24px] border border-orange-100 bg-white p-4 shadow-lg shadow-orange-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[#E85D00] font-bold text-sm">
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

      <div className="mt-4 rounded-[24px] bg-gradient-to-br from-[#FF6A00] to-[#E85D00] p-5 text-center text-white shadow-xl shadow-orange-500/20">
        <p className="text-[9px] text-orange-50 tracking-wider uppercase font-medium">
          LIVE TOKEN NUMBER
        </p>

        <p className="mt-1 text-3xl font-bold">
          A-013
        </p>

        <div className="mt-3.5 rounded-xl bg-white/10 px-3 py-2 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[8px] text-orange-50">LIVE QUEUE</p>
            <p className="text-xs font-bold">12 Ahead</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-orange-50">EST. WAIT</p>
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
          <span className="text-[8.5px] font-bold text-[#E85D00] bg-orange-50 px-2 py-0.5 rounded-full">
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
  orange = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  badge?: string;
  orange?: boolean;
}) {
  return (
    <div
      className={`mt-4 rounded-[22px] border p-4 ${
        orange
          ? "border-orange-200 bg-gradient-to-br from-[#FF6A00] to-[#FF8A3D] text-white shadow-lg shadow-orange-500/20"
          : "border-slate-100 bg-white text-[#172033]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            orange
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
              orange ? "text-orange-50" : "text-slate-500"
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
            ? "rounded-br-xs bg-[#FF6A00] text-white shadow-xs"
            : "rounded-bl-xs bg-white text-slate-600 shadow-2xs border border-slate-100"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
