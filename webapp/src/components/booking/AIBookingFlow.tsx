import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { AIMessage } from "./AIMessage";
import { PatientMessage } from "./PatientMessage";
import { TypingIndicator } from "./TypingIndicator";
import {
  AIChatMessage,
  PatientIntake,
  DoctorRecommendation,
  DoctorItem,
  DepartmentItem,
  HospitalWorkspace,
} from "../../types/booking";

import {
  validateName,
  validatePhone,
  validateAge,
} from "../../utils/validation";

interface AIBookingFlowProps {
  hospital: HospitalWorkspace | null;
  doctors: DoctorItem[];
  departments: DepartmentItem[];
  onCompleteAIIntake: (
    intake: PatientIntake,
    recommendation: DoctorRecommendation
  ) => void;
  onBack: () => void;
}

export const AIBookingFlow: React.FC<AIBookingFlowProps> = ({
  hospital,
  doctors,
  departments,
  onCompleteAIIntake,
  onBack,
}) => {
  const isInd = Boolean(hospital?.is_individual_doctor);
  const singleDoc = hospital?.doctor || doctors[0];
  const doctorName = singleDoc?.name || hospital?.name || "Doctor Specialist";
  const clinicName = hospital?.clinic?.name || hospital?.name || "the clinic";
  const specialty = singleDoc?.specialization || singleDoc?.specialty || singleDoc?.department || "Consultation";

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: isInd
        ? `Hello! I am the AI clinical assistant for ${doctorName} at ${clinicName}. What is your full name?`
        : `Hello! I am your AI receptionist at ${hospital?.name || "the hospital"}. What is your full name?`,
      timestamp: "Just now",
      stepKey: "name",
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const totalSteps = 6; // 1: Name, 2: Phone, 3: Age, 4: Gender, 5: Concern, 6: Duration/Meds

  const [intake, setIntake] = useState<PatientIntake>({
    fullName: "",
    age: 30,
    contactNumber: "",
    gender: "Male",
    primaryConcern: "",
    symptoms: [],
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // AI Intake Logic Processor with Step-by-Step Validation
  const processNextStep = async (
    userText: string,
    currentMsg: AIChatMessage
  ) => {
    setIsTyping(true);

    // Natural conversation pause
    await new Promise((res) => setTimeout(res, 600));

    const step = currentMsg.stepKey || "name";

    if (step === "name") {
      const nameCheck = validateName(userText);
      if (!nameCheck.isValid) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            text: `${nameCheck.error || "Please enter your valid full name (at least 2 letters)."}\n\nWhat is your full name?`,
            timestamp: "Just now",
            stepKey: "name",
          },
        ]);
        setIsTyping(false);
        return;
      }

      setIntake((prev) => ({ ...prev, fullName: userText.trim() }));
      setCurrentStepIndex(2);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `Nice to meet you, ${userText.trim()}! Could you please provide your 10-digit mobile number for appointment updates?`,
          timestamp: "Just now",
          stepKey: "phone",
        },
      ]);
    } else if (step === "phone") {
      const phoneCheck = validatePhone(userText);
      if (!phoneCheck.isValid) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            text: `${phoneCheck.error || "Please provide a valid 10-digit mobile number (e.g., 9876543210)."}\n\nWhat is your mobile number?`,
            timestamp: "Just now",
            stepKey: "phone",
          },
        ]);
        setIsTyping(false);
        return;
      }

      setIntake((prev) => ({
        ...prev,
        contactNumber: phoneCheck.cleaned,
      }));

      setCurrentStepIndex(3);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `Thank you! What is your age in years?`,
          timestamp: "Just now",
          stepKey: "age",
          quickChips: ["22", "28", "35", "45", "60"],
        },
      ]);
    } else if (step === "age") {
      const ageCheck = validateAge(userText);
      if (!ageCheck.isValid) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            text: `${ageCheck.error || "Please enter a valid age in numbers between 1 and 120."}\n\nWhat is your age?`,
            timestamp: "Just now",
            stepKey: "age",
            quickChips: ["20", "28", "35", "48", "62"],
          },
        ]);
        setIsTyping(false);
        return;
      }

      setIntake((prev) => ({
        ...prev,
        age: ageCheck.ageNum,
      }));

      setCurrentStepIndex(4);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `Thank you! Please select your gender:`,
          timestamp: "Just now",
          stepKey: "gender",
          quickChips: ["Male", "Female", "Other"],
        },
      ]);
    } else if (step === "gender") {
      const validGender = /female/i.test(userText) ? "Female" : /other/i.test(userText) ? "Other" : "Male";
      setIntake((prev) => ({ ...prev, gender: validGender }));

      setCurrentStepIndex(5);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: isInd
            ? `Got it! What main symptoms or health concern brings you to see ${doctorName} today?`
            : `Got it! What main symptoms or health concern are you experiencing today?`,
          timestamp: "Just now",
          stepKey: "concern",
          quickChips: isInd
            ? [
                `Routine ${specialty} Checkup`,
                "New Symptom / Consultation",
                "Follow-up Visit",
                "Prescription Renewal",
                "Emergency Consultation",
              ]
            : [
                "Fever & Cold",
                "Severe Headache",
                "Abdominal Pain",
                "Skin Rash",
                "Joint/Back Pain",
                "Eye Consultation",
              ],
        },
      ]);
    } else if (step === "concern") {
      const updatedConcern = userText;
      const symptomsList = [userText];
      setIntake((prev) => ({
        ...prev,
        primaryConcern: updatedConcern,
        symptoms: symptomsList,
      }));

      setCurrentStepIndex(6);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `Thank you. How long have you had this concern, and are you currently taking any medications?`,
          timestamp: "Just now",
          stepKey: "meds",
          quickChips: ["1-2 Days", "Since last week", "No medications", "Taking routine meds"],
        },
      ]);
    } else if (step === "meds") {
      const updatedIntake: PatientIntake = {
        ...intake,
        symptomDuration: userText,
      };
      setIntake(updatedIntake);

      // Final evaluation and matching logic
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: isInd
            ? `Confirming consultation appointment with ${doctorName}...`
            : `Analyzing your responses against ${hospital?.name || "hospital"}'s active OPD doctor availability...`,
          timestamp: "Just now",
          stepKey: "processing",
        },
      ]);

      await new Promise((res) => setTimeout(res, 800));

      if (isInd) {
        // Individual Doctor Single-Practice Lock
        const rec: DoctorRecommendation = {
          departmentId: singleDoc?.department_id || "dept-practice",
          departmentName: specialty,
          doctorId: singleDoc ? singleDoc.id : "doc-1",
          doctorName: doctorName,
          specialty: specialty,
          explanation: `Direct appointment scheduled with ${doctorName} for reported concern: ${updatedIntake.primaryConcern || "clinical consultation"}.`,
          availability: singleDoc?.available_hours?.start
            ? `${singleDoc.available_hours.start} - ${singleDoc.available_hours.end || "05:00 PM"}`
            : "Available Today",
          fee: singleDoc ? singleDoc.fee : 500,
        };

        onCompleteAIIntake(updatedIntake, rec);
      } else {
        // Multi-Specialty Hospital Department & Doctor Matching
        const concernLower = (updatedIntake.primaryConcern + " " + userText).toLowerCase();
        let selectedDept = departments[0] || {
          id: "dept-gen",
          name: "General Medicine",
          hospital_id: hospital?.id || "",
        };

        if (concernLower.includes("headache") || concernLower.includes("neuro") || concernLower.includes("brain")) {
          selectedDept = departments.find((d) => d.name.toLowerCase().includes("neuro")) || selectedDept;
        } else if (concernLower.includes("heart") || concernLower.includes("chest") || concernLower.includes("cardio")) {
          selectedDept = departments.find((d) => d.name.toLowerCase().includes("cardio")) || selectedDept;
        } else if (concernLower.includes("skin") || concernLower.includes("rash") || concernLower.includes("derma")) {
          selectedDept = departments.find((d) => d.name.toLowerCase().includes("derma")) || selectedDept;
        } else if (concernLower.includes("eye") || concernLower.includes("vision")) {
          selectedDept = departments.find((d) => d.name.toLowerCase().includes("ophthalm")) || selectedDept;
        } else if (concernLower.includes("bone") || concernLower.includes("joint") || concernLower.includes("ortho")) {
          selectedDept = departments.find((d) => d.name.toLowerCase().includes("ortho")) || selectedDept;
        }

        // Find doctor in selected department or general roster
        let selectedDoc = doctors.find(
          (doc) =>
            doc.active &&
            doc.accepting_appointments &&
            (doc.department_id === selectedDept.id || doc.department === selectedDept.name)
        );

        if (!selectedDoc) {
          selectedDoc = doctors.find((doc) => doc.active && doc.accepting_appointments) || doctors[0];
        }

        const rec: DoctorRecommendation = {
          departmentId: selectedDept.id,
          departmentName: selectedDept.name,
          doctorId: selectedDoc ? selectedDoc.id : "doc-1",
          doctorName: selectedDoc ? selectedDoc.name : "Dr. Available Specialist",
          specialty: selectedDoc ? selectedDoc.specialty : selectedDept.name,
          explanation: `Recommended based on reported complaint (${updatedIntake.primaryConcern || "OPD consultation"}) for optimal evaluation.`,
          availability: "Available Today OPD",
          fee: selectedDoc ? selectedDoc.fee : 500,
        };

        onCompleteAIIntake(updatedIntake, rec);
      }
    }

    setIsTyping(false);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isTyping) return;

    const lastMsg = messages[messages.length - 1];
    const newMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: "patient",
      text: text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputVal("");
    processNextStep(text, lastMsg);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-[600px] max-h-[80vh] w-full rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,122,255,0.1)] overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-white/60 bg-white/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Progress Bar & Counter */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
            <motion.div
              className="h-full bg-[#007AFF] rounded-full"
              animate={{ width: `${(currentStepIndex / totalSteps) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs font-semibold text-[#007AFF]">
            Step {currentStepIndex} of {totalSteps}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessages([
              {
                id: "1",
                sender: "ai",
                text: `Hello! I am your AI receptionist at ${hospital?.name || "the hospital"}. What is your full name?`,
                timestamp: "Just now",
                stepKey: "name",
              },
            ]);
            setCurrentStepIndex(1);
          }}
          title="Restart Conversation"
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {messages.map((msg) =>
          msg.sender === "ai" ? (
            <AIMessage
              key={msg.id}
              text={msg.text}
              timestamp={msg.timestamp}
              quickChips={msg.quickChips}
              onSelectChip={(chip) => handleSend(chip)}
            />
          ) : (
            <PatientMessage
              key={msg.id}
              text={msg.text}
              timestamp={msg.timestamp}
            />
          )
        )}
        {isTyping && <TypingIndicator />}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Glass Floating Bar */}
      <div className="p-3 bg-white/60 backdrop-blur-xl border-t border-white/80 shrink-0">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-1.5 pl-4 border border-slate-200/80 shadow-sm focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
            placeholder="Type your response..."
            className="flex-1 bg-transparent text-sm text-[#1D1D1F] placeholder-slate-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-[#007AFF] hover:bg-[#0062D6] disabled:opacity-40 text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-[#007AFF]/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* AI Triage Disclaimer */}
        <div className="mt-2 text-center text-[10px] text-[#6E6E73] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#007AFF]" />
          <span>Triage assistance only • Official OPD token booking</span>
        </div>
      </div>
    </motion.div>
  );
};
