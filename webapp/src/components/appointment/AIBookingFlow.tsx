"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, ArrowLeft, Layers, Sparkles, Loader2,
  ShieldCheck, RefreshCw, MessageSquare
} from "lucide-react";
import { AIChatMessage } from "./AIChatMessage";
import { AIIntakeQuestions } from "./AIIntakeQuestions";
import {
  ChatMessageItem, PatientIntake, DoctorItem, DepartmentItem, HospitalWorkspace
} from "../../types/appointment";

interface Props {
  hospital: HospitalWorkspace;
  doctors: DoctorItem[];
  departments: DepartmentItem[];
  onManualBooking: () => void;
  onCompleteIntake: (intake: PatientIntake) => void;
  isProcessing?: boolean;
}

export function AIBookingFlow({
  hospital,
  doctors,
  departments,
  onManualBooking,
  onCompleteIntake,
  isProcessing = false,
}: Props) {
  const [stepKey, setStepKey] = useState<"name" | "details" | "concern" | "symptoms" | "meds">("name");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [intake, setIntake] = useState<PatientIntake>({
    fullName: "",
    age: 30,
    gender: "Male",
    email: "",
    contactNumber: "",
    primaryConcern: "",
    symptoms: [],
    symptomDuration: "1-2 days",
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: `Welcome to ${hospital.name} AI Appointment Assistant. I will guide you step-by-step toward the right department and doctor. What is your full name?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stepKey: "name",
    },
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, stepKey, isProcessing]);

  // Step Handlers
  const handleAnswerName = (name: string) => {
    const updatedIntake = { ...intake, fullName: name };
    setIntake(updatedIntake);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: name,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Nice to meet you, ${name}! Please share your basic details (Age, Gender, Mobile Number) so we can register your appointment token.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stepKey: "details",
      },
    ]);

    setStepKey("details");
  };

  const handleAnswerDetails = (details: { age: number; gender: string; contact: string; email: string }) => {
    const updatedIntake = {
      ...intake,
      age: details.age,
      gender: details.gender,
      contactNumber: details.contact,
      email: details.email,
    };
    setIntake(updatedIntake);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: `Age: ${details.age}, Gender: ${details.gender}, Phone: ${details.contact}${details.email ? `, Email: ${details.email}` : ""}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Thank you. What health problem or symptom are you experiencing today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stepKey: "concern",
      },
    ]);

    setStepKey("concern");
  };

  const handleAnswerConcern = (concern: string) => {
    const updatedIntake = { ...intake, primaryConcern: concern };
    setIntake(updatedIntake);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: concern,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Understood. Please select any specific symptoms that match what you're feeling and how long they've been present.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stepKey: "symptoms",
      },
    ]);

    setStepKey("symptoms");
  };

  const handleAnswerSymptoms = (symptoms: string[], duration: string) => {
    const updatedIntake = {
      ...intake,
      symptoms,
      symptomDuration: duration,
    };
    setIntake(updatedIntake);

    const symptomsSummary = symptoms.length > 0 ? symptoms.join(", ") : "No specific symptom chips selected";

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: `Symptoms: ${symptomsSummary}. Duration: ${duration}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Got it. Are you currently taking any medications or do you have any known medical history / allergies?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stepKey: "meds",
      },
    ]);

    setStepKey("meds");
  };

  const handleAnswerMeds = (meds: string, history: string) => {
    const finalIntake = {
      ...intake,
      medications: meds,
      medicalHistory: history,
    };
    setIntake(finalIntake);

    const medsSummary = meds ? `Medications: ${meds}` : "No current medications reported";

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: `${medsSummary}${history ? `. History: ${history}` : ""}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Thank you for sharing your details. Analyzing your concern against available ${hospital.name} departments and active practitioners now...`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    // Complete intake and invoke AI routing service
    onCompleteIntake(finalIntake);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <button
          onClick={onManualBooking}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Layers size={14} />
          <span>Switch to Manual Booking</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
          <Sparkles size={14} className="animate-pulse" />
          <span>AI Booking Mode</span>
        </div>
      </div>

      {/* Chat Conversation Scroll Area */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-4 sm:p-6 min-h-[380px] max-h-[500px] overflow-y-auto space-y-3.5 shadow-inner">
        {messages.map((msg) => (
          <AIChatMessage key={msg.id} message={msg} />
        ))}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl text-xs font-bold w-fit"
          >
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <span>AI is matching symptoms with {hospital.name} active doctors...</span>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Component for Current Step */}
      {!isProcessing && (
        <AIIntakeQuestions
          currentStep={stepKey}
          onAnswerName={handleAnswerName}
          onAnswerDetails={handleAnswerDetails}
          onAnswerConcern={handleAnswerConcern}
          onAnswerSymptoms={handleAnswerSymptoms}
          onAnswerMeds={handleAnswerMeds}
        />
      )}
    </div>
  );
}
