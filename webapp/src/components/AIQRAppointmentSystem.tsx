"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Building2,
  MessageCircle,
  QrCode,
  Scan,
  Sparkles,
  User,
  Users,
} from "lucide-react";

type DoctorType = {
  id: string;
  name: string;
  department: string;
  queue: number;
  available: boolean;
};

type Screen =
  | "welcome"
  | "ai-chat"
  | "ai-result"
  | "manual"
  | "doctor"
  | "confirmed";

const doctors = [
  {
    id: "H1D1",
    name: "Dr. Arjun Patel",
    department: "General Medicine",
    queue: 12,
    available: true,
  },
  {
    id: "H1D2",
    name: "Dr. Sarah Khan",
    department: "Cardiology",
    queue: 8,
    available: true,
  },
  {
    id: "H1D3",
    name: "Dr. Rohan Singh",
    department: "Orthopedics",
    queue: 5,
    available: true,
  },
];

const departments = [
  "OPD",
  "General Medicine",
  "Cardiology",
  "Orthopedics",
];

export default function AIQRAppointmentSystem() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedDepartment, setSelectedDepartment] =
    useState("General Medicine");

  const [selectedDoctor, setSelectedDoctor] =
    useState(doctors[0]);

  const [queueNumber, setQueueNumber] = useState(13);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.department === selectedDepartment ||
      selectedDepartment === "OPD"
  );

  return (
    <section className="relative overflow-hidden bg-[#f5f7fb] py-24 lg:py-32 text-slate-900">
      <SectionBackground />

      <div className="relative z-10 mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <SectionHeader />

        <div className="relative mt-16 grid gap-10 xl:grid-cols-[300px_minmax(350px,1fr)_330px] xl:items-center">
          <HospitalQR />

          <div className="relative flex min-h-[780px] items-center justify-center">
            <AnimatedConnectionLines />

            <PhoneMockup>
              <AnimatePresence mode="wait">
                {screen === "welcome" && (
                  <WelcomeScreen
                    key="welcome"
                    onAI={() => setScreen("ai-chat")}
                    onManual={() => setScreen("manual")}
                  />
                )}

                {screen === "ai-chat" && (
                  <AIChatScreen
                    key="ai-chat"
                    onBack={() => setScreen("welcome")}
                    onContinue={() => {
                      setSelectedDoctor(doctors[0]);
                      setScreen("ai-result");
                    }}
                  />
                )}

                {screen === "ai-result" && (
                  <AIResultScreen
                    key="ai-result"
                    doctor={selectedDoctor}
                    onConfirm={() => setScreen("confirmed")}
                    onChange={() => setScreen("manual")}
                  />
                )}

                {screen === "manual" && (
                  <ManualBookingScreen
                    key="manual"
                    department={selectedDepartment}
                    setDepartment={setSelectedDepartment}
                    doctors={filteredDoctors}
                    onSelectDoctor={(doctor) => {
                      setSelectedDoctor(doctor);
                      setScreen("doctor");
                    }}
                    onBack={() => setScreen("welcome")}
                  />
                )}

                {screen === "doctor" && (
                  <DoctorSelectionScreen
                    key="doctor"
                    doctor={selectedDoctor}
                    onBack={() => setScreen("manual")}
                    onConfirm={() => setScreen("confirmed")}
                  />
                )}

                {screen === "confirmed" && (
                  <ConfirmationScreen
                    key="confirmed"
                    doctor={selectedDoctor}
                    queueNumber={queueNumber}
                    onReset={() => {
                      setQueueNumber(13);
                      setScreen("welcome");
                    }}
                  />
                )}
              </AnimatePresence>
            </PhoneMockup>
          </div>

          <DoctorAppointmentPanel
            doctor={selectedDoctor}
            queueNumber={queueNumber}
            appointmentConfirmed={screen === "confirmed"}
          />
        </div>

        <BottomFlow />
      </div>
    </section>
  );
}

function SectionBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.13),transparent_28%),radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.09),transparent_30%),radial-gradient(circle_at_90%_50%,rgba(249,115,22,0.09),transparent_28%)]" />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[130px]"
      />

      <div className="absolute bottom-[-200px] left-1/2 h-[400px] w-[900px] -translate-x-1/2 rounded-[100%] bg-blue-500/10 blur-[100px]" />
    </>
  );
}

function SectionHeader() {
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
        className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-2 shadow-xs backdrop-blur-xl"
      >
        <Sparkles size={14} className="text-blue-600" />

        <span className="text-xs font-bold tracking-[0.15em] text-blue-700">
          SMART APPOINTMENT SYSTEM
        </span>
      </motion.div>

      <motion.h2
        initial={{
          opacity: 0,
          y: 35,
          filter: "blur(15px)",
        }}
        whileInView={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="mt-7 text-4xl font-semibold tracking-[-0.06em] text-[#172033] sm:text-5xl lg:text-7xl"
      >
        One QR Code.
        <br />
        <span className="text-blue-600">
          Smarter Appointment Routing.
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-500 md:text-lg"
      >
        Scan the hospital QR code and choose AI-guided booking or direct
        appointment booking. Every appointment follows the selected
        hospital and doctor.
      </motion.p>
    </div>
  );
}

function HospitalQR() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -40,
        filter: "blur(10px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative text-left"
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="overflow-hidden rounded-[32px] border border-white bg-white/75 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 size={23} />
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600">
            ACTIVE
          </span>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Hospital Appointment QR
        </p>

        <h3 className="mt-1 text-xl font-semibold text-[#172033]">
          City Care Hospital
        </h3>

        <div className="relative mx-auto mt-7 flex aspect-square w-full max-w-[220px] items-center justify-center rounded-[28px] bg-white p-5 shadow-inner">
          <QrCode
            size={165}
            strokeWidth={1.4}
            className="text-[#172033]"
          />

          <motion.div
            animate={{
              top: ["8%", "88%", "8%"],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-[8%] right-[8%] h-[2px] rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.9)]"
          />
        </div>

        <div className="mt-6 rounded-2xl bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <Scan size={18} className="text-blue-600" />

            <p className="text-xs font-medium text-blue-700">
              Scan to book your appointment
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
          Only registered doctors from this hospital appear after scanning.
        </p>
      </motion.div>
    </motion.div>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 50,
        scale: 0.94,
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
        stiffness: 80,
      }}
      animate={{
        y: [0, -8, 0],
      }}
      className="relative z-20"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="pointer-events-none absolute -inset-12 rounded-full border border-dashed border-blue-300/40"
      />

      <div className="relative w-[330px] rounded-[52px] bg-[#10141c] p-[7px] shadow-[0_40px_100px_rgba(15,23,42,0.3)] sm:w-[365px]">
        <div className="absolute left-1/2 top-[11px] z-30 h-[28px] w-[115px] -translate-x-1/2 rounded-full bg-black" />

        <div className="min-h-[720px] overflow-hidden rounded-[46px] bg-[#f7f8fb]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function WelcomeScreen({
  onAI,
  onManual,
}: {
  onAI: () => void;
  onManual: () => void;
}) {
  return (
    <ScreenMotion>
      <div className="min-h-[720px] px-6 pb-6 pt-14 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#172033]">
              City Care Hospital
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Smart Appointment Portal
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 size={18} />
          </div>
        </div>

        <div className="mt-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
            <Calendar size={25} />
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#172033]">
            How would you like to book?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Choose AI-guided appointment assistance or book directly.
          </p>
        </div>

        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAI}
          className="relative mt-8 w-full overflow-hidden rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-600 to-[#1676d2] p-6 text-left text-white shadow-[0_20px_40px_rgba(37,99,235,0.25)] cursor-pointer"
        >
          <motion.div
            animate={{
              x: ["-100%", "250%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-y-0 w-20 -skew-x-12 bg-white/15 blur-xl"
          />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Bot size={24} />
            </div>

            <div>
              <p className="text-lg font-semibold">
                AI Guided Booking
              </p>

              <p className="mt-2 text-xs leading-5 text-blue-100">
                Share your health concern and receive appointment guidance.
              </p>
            </div>

            <ChevronRight className="ml-auto mt-2" size={20} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onManual}
          className="mt-4 w-full rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-2xs cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <User size={23} />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#172033]">
                Book Manually
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Select your department and preferred available doctor.
              </p>
            </div>

            <ChevronRight className="ml-auto mt-2 text-slate-400" size={20} />
          </div>
        </motion.button>

        <p className="mt-8 text-center text-[10px] leading-5 text-slate-400">
          AI assistance is optional. You may skip directly to appointment
          booking.
        </p>
      </div>
    </ScreenMotion>
  );
}

function AIChatScreen({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
}) {
  const [step, setStep] = useState(0);

  const questions = [
    "Please tell me your full name.",
    "What is your age?",
    "What symptoms are you experiencing?",
    "How long have you had these symptoms?",
  ];

  const answers = [
    "Rahul Sharma",
    "28 Years",
    "Fever and body pain",
    "For two days",
  ];

  const finished = step >= questions.length;

  return (
    <ScreenMotion>
      <div className="min-h-[720px] px-5 pb-5 pt-14 text-left">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="font-semibold text-[#172033]">
              MedTech Assistant
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-[10px] text-slate-400">
                Appointment guidance
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <ChatBubble
            role="ai"
            text="Hello. I will help guide your appointment booking."
          />

          {questions.slice(0, step + 1).map((question, index) => (
            <div key={question} className="space-y-3">
              <ChatBubble role="ai" text={question} />

              {index < step && (
                <ChatBubble role="patient" text={answers[index]} />
              )}
            </div>
          ))}

          {finished && (
            <>
              <ChatBubble
                role="ai"
                text="Thank you. I have enough information to suggest an appointment."
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-2xl bg-blue-50 p-4 text-xs text-blue-700"
              >
                <Sparkles size={16} />
                Reviewing your appointment details...
              </motion.div>
            </>
          )}
        </div>

        <div className="mt-6">
          {!finished ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(step + 1)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#172033] py-4 text-sm font-semibold text-white cursor-pointer"
            >
              Continue
              <ArrowRight size={17} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-semibold text-white cursor-pointer"
            >
              See Appointment Suggestion
              <ArrowRight size={17} />
            </motion.button>
          )}
        </div>

        <p className="mt-5 text-center text-[9px] leading-5 text-slate-400">
          This guidance supports appointment selection and does not replace
          professional medical advice.
        </p>
      </div>
    </ScreenMotion>
  );
}

function ChatBubble({
  role,
  text,
}: {
  role: "ai" | "patient";
  text: string;
}) {
  const patient = role === "patient";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
        filter: "blur(6px)",
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      className={`flex ${patient ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-[22px] px-4 py-3 text-xs leading-5 ${
          patient
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md bg-white text-slate-600 shadow-2xs"
        }`}
      >
        {!patient && (
          <div className="mb-2 flex items-center gap-2 text-blue-600">
            <Bot size={13} />
            <span className="text-[9px] font-semibold">
              MedTech AI
            </span>
          </div>
        )}

        {text}
      </div>
    </motion.div>
  );
}

function AIResultScreen({
  doctor,
  onConfirm,
  onChange,
}: {
  doctor: DoctorType;
  onConfirm: () => void;
  onChange: () => void;
}) {
  return (
    <ScreenMotion>
      <div className="min-h-[720px] px-6 pb-6 pt-14 text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Sparkles size={22} />
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-[#172033]">
          Suggested Appointment
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Based on the details provided, General Medicine appears suitable
          for your appointment request.
        </p>

        <div className="mt-8 rounded-[28px] border border-blue-100 bg-white p-5 shadow-lg shadow-blue-500/5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              👨‍⚕️
            </div>

            <div>
              <p className="font-semibold text-[#172033]">
                {doctor.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {doctor.department}
              </p>

              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Available Today
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Current Queue
              </span>

              <span className="font-semibold text-[#172033]">
                {doctor.queue} patients ahead
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <Check size={17} />
          Confirm Appointment
        </motion.button>

        <button
          onClick={onChange}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-600 cursor-pointer"
        >
          Choose Another Doctor
        </button>

        <p className="mt-6 text-center text-[9px] leading-5 text-slate-400">
          For emergencies or serious symptoms, seek appropriate emergency
          medical care immediately.
        </p>
      </div>
    </ScreenMotion>
  );
}

function ManualBookingScreen({
  department,
  setDepartment,
  doctors,
  onSelectDoctor,
  onBack,
}: {
  department: string;
  setDepartment: (department: string) => void;
  doctors: DoctorType[];
  onSelectDoctor: (doctor: DoctorType) => void;
  onBack: () => void;
}) {
  return (
    <ScreenMotion>
      <div className="min-h-[720px] px-5 pb-6 pt-14 text-left">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="font-semibold text-[#172033]">
              Book Appointment
            </p>

            <p className="text-[10px] text-slate-400">
              Select department and doctor
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold text-[#172033]">
            Select Department
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {departments.map((item) => (
              <button
                key={item}
                onClick={() => setDepartment(item)}
                className={`rounded-full px-4 py-2 text-[10px] font-semibold transition-all cursor-pointer ${
                  department === item
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white text-slate-500 shadow-2xs"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#172033]">
              Available Doctors
            </p>

            <span className="text-[10px] text-slate-400">
              Hospital doctors only
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {doctors.map((doctor) => (
              <motion.button
                key={doctor.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectDoctor(doctor)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-2xs cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">
                  👨‍⚕️
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#172033]">
                    {doctor.name}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    {doctor.department}
                  </p>

                  <p className="mt-1 text-[9px] text-blue-600">
                    {doctor.queue} patients in queue
                  </p>
                </div>

                <ChevronRight size={18} className="text-slate-400" />
              </motion.button>
            ))}

            {doctors.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No doctors available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenMotion>
  );
}

function DoctorSelectionScreen({
  doctor,
  onBack,
  onConfirm,
}: {
  doctor: DoctorType;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <ScreenMotion>
      <div className="min-h-[720px] px-6 pb-6 pt-14 text-left">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <h2 className="mt-8 text-2xl font-semibold text-[#172033]">
          Confirm Appointment
        </h2>

        <div className="mt-6 rounded-[30px] bg-white p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              👨‍⚕️
            </div>

            <div>
              <h3 className="font-semibold text-[#172033]">
                {doctor.name}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {doctor.department}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <AppointmentDetail
              icon={Calendar}
              label="Appointment Date"
              value="Today"
            />

            <AppointmentDetail
              icon={Clock}
              label="Available Time"
              value="10:30 AM"
            />

            <AppointmentDetail
              icon={Users}
              label="Live Queue"
              value={`${doctor.queue} patients`}
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-semibold text-white cursor-pointer"
        >
          Book Appointment
          <ArrowRight size={17} />
        </motion.button>
      </div>
    </ScreenMotion>
  );
}

function ConfirmationScreen({
  doctor,
  queueNumber,
  onReset,
}: {
  doctor: DoctorType;
  queueNumber: number;
  onReset: () => void;
}) {
  return (
    <ScreenMotion>
      <div className="flex min-h-[720px] flex-col px-6 pb-6 pt-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 12,
          }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <Check size={38} />
        </motion.div>

        <h2 className="mt-7 text-2xl font-semibold text-[#172033]">
          Appointment Confirmed
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Your appointment has been sent to the selected doctor.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 rounded-[30px] bg-gradient-to-br from-blue-600 to-[#1457bb] p-7 text-white shadow-xl shadow-blue-500/20"
        >
          <p className="text-xs text-blue-100">
            Your Token Number
          </p>

          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.4,
              type: "spring",
            }}
            className="mt-2 text-5xl font-bold"
          >
            A-{String(queueNumber).padStart(3, "0")}
          </motion.div>

          <div className="mt-7 rounded-2xl bg-white/10 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-100">
                Live Queue
              </span>

              <span className="font-semibold">
                {doctor.queue} Patients Ahead
              </span>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 rounded-[24px] bg-white p-5 text-left shadow-2xs">
          <p className="text-xs font-semibold text-slate-400">
            APPOINTMENT DETAILS
          </p>

          <p className="mt-4 font-semibold text-[#172033]">
            {doctor.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {doctor.department}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              Estimated Waiting Time
            </span>

            <span className="text-xs font-semibold text-[#172033]">
              20 Minutes
            </span>
          </div>
        </div>

        <button
          onClick={onReset}
          className="mt-auto rounded-2xl bg-slate-100 py-4 text-sm font-semibold text-slate-600 cursor-pointer"
        >
          Back to Hospital
        </button>
      </div>
    </ScreenMotion>
  );
}

function DoctorAppointmentPanel({
  doctor,
  queueNumber,
  appointmentConfirmed,
}: {
  doctor: DoctorType;
  queueNumber: number;
  appointmentConfirmed: boolean;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 40,
        filter: "blur(10px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true }}
      className="relative text-left"
    >
      <div className="overflow-hidden rounded-[32px] border border-white bg-white/75 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-[#f59e0b] p-6 text-white">
          <motion.div
            animate={
              appointmentConfirmed
                ? {
                    scale: [1, 1.08, 1],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold">
                Doctor Dashboard
              </p>

              <p className="mt-1 text-[10px] text-orange-100">
                Live appointment updates
              </p>
            </div>

            <div className="relative">
              <BellIcon active={appointmentConfirmed} />
            </div>
          </motion.div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              👨‍⚕️
            </div>

            <div>
              <p className="font-semibold text-[#172033]">
                {doctor.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {doctor.department}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {appointmentConfirmed && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 30,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">
                      New Appointment
                    </p>

                    <p className="mt-2 text-sm font-semibold text-[#172033]">
                      Rahul Sharma
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Token A-
                      {String(queueNumber).padStart(3, "0")}
                    </p>
                  </div>

                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white"
                  >
                    <Check size={18} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!appointmentConfirmed && (
            <div className="mt-6 rounded-[24px] bg-slate-50 p-5 text-center">
              <ClipboardList
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Waiting for appointment
              </p>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-semibold text-[#172033]">
              Today&apos;s Queue
            </p>

            <div className="mt-3 space-y-2">
              {[
                ["A-010", "Rahul", "Completed"],
                ["A-011", "Sneha", "Consulting"],
                [
                  `A-${String(queueNumber).padStart(3, "0")}`,
                  "New Patient",
                  appointmentConfirmed ? "Waiting" : "Available",
                ],
              ].map(([token, name, status]) => (
                <div
                  key={token}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
                >
                  <span className="text-[10px] font-bold text-blue-600">
                    {token}
                  </span>

                  <span className="flex-1 text-[10px] text-slate-600">
                    {name}
                  </span>

                  <span className="text-[9px] text-slate-400">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <>
      {active && (
        <motion.span
          animate={{
            scale: [1, 1.8],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
          }}
          className="absolute inset-0 rounded-full bg-white"
        />
      )}

      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
        <MessageCircle size={21} />
      </div>
    </>
  );
}

function AnimatedConnectionLines() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block">
      <div className="absolute left-[-100px] top-1/2 h-px w-[250px] border-t-2 border-dashed border-blue-300" />

      <div className="absolute right-[-100px] top-1/2 h-px w-[250px] border-t-2 border-dashed border-orange-300" />

      <motion.div
        animate={{
          x: [-50, 170],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-[-50px] top-[calc(50%-4px)] h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)]"
      />

      <motion.div
        animate={{
          x: [0, 220],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2.5,
          delay: 0.7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-[-50px] top-[calc(50%-4px)] h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.9)]"
      />
    </div>
  );
}

function BottomFlow() {
  const flow = [
    "Scan QR",
    "Choose Booking",
    "Select Doctor",
    "Get Token",
    "Live Queue",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto mt-16 max-w-6xl"
    >
      <div className="rounded-[30px] border border-white bg-white/70 p-6 shadow-2xs backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {flow.map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.03,
                }}
                className="rounded-full bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-600"
              >
                <span className="mr-2 text-blue-600">
                  0{index + 1}
                </span>
                {item}
              </motion.div>

              {index !== flow.length - 1 && (
                <ArrowRight
                  size={15}
                  className="hidden text-slate-300 sm:block"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-7 text-slate-500">
        From the first scan to the doctor dashboard, every appointment
        follows the correct hospital, doctor, token, and live queue.
      </p>
    </motion.div>
  );
}

function AppointmentDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={15} />
      </div>

      <div className="flex-1">
        <p className="text-[9px] text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-xs font-semibold text-[#172033]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ScreenMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 25,
        scale: 0.98,
        filter: "blur(10px)",
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      exit={{
        opacity: 0,
        y: -20,
        scale: 0.98,
        filter: "blur(10px)",
      }}
      transition={{
        duration: 0.45,
        ease: ease,
      }}
    >
      {children}
    </motion.div>
  );
}
