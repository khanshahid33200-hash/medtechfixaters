"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  User,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  ChevronDown,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface BookingFormData {
  fullName: string;
  organization: string;
  phone: string;
  email: string;
  requirements: string;
  preferredTime: string;
  ticketId?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  type?: "text" | "booking_form" | "booking_confirmed";
  bookingData?: BookingFormData;
}

const suggestions = [
  "📅 Book a Live Demo",
  "How does the inbuilt CRM work?",
  "How does QR booking work?",
  "Is hospital data strictly separated?",
  "What is the Doctor Workspace?",
];

const websiteKnowledge = [
  {
    id: "crm",
    patterns: [/crm/i, /patient.*retention/i, /follow.*up/i, /recall/i, /whatsapp.*reminder/i, /nps/i, /chronic.*care/i],
    response: "MedTech Fixaters includes a comprehensive Inbuilt Healthcare CRM System:\n• 360° Unified Patient Profile: View complete clinical visit history, past prescriptions, vitals trends, and lab reports.\n• Automated WhatsApp & SMS Recalls: Automatically trigger follow-up reminders 48h prior to appointments and medication renewals.\n• Chronic Disease Care Sequences: Automated recall pathways for Hypertension and Diabetes.\n• Patient NPS & Feedback: Instant post-consultation WhatsApp feedback collection to measure OPD satisfaction without third-party CRM fees.",
  },
  {
    id: "qr",
    patterns: [/qr/i, /scan/i, /standee/i, /appointment/i, /book/i, /kiosk/i],
    response: "Every hospital receives a unique QR code standee and appointment link:\n• Instant Mobile Scanning: Patients scan at hospital entry using any phone camera.\n• Isolated Hospital View: Patients only see departments and doctors available in that facility.\n• Live Mobile Queue Pass: Generates a digital token with real-time countdown position.\n• Dual Booking: AI symptom intake or direct doctor selection.",
  },
  {
    id: "queue",
    patterns: [/queue/i, /token/i, /wait.*time/i, /display.*board/i, /lounge/i],
    response: "The Live Queue Engine eliminates waiting room congestion:\n• Doctor-Isolated Queues: Each doctor manages an independent queue sequence.\n• Live Multi-Screen Sync: Waiting positions update live on patient phones and lounge display boards.\n• Smart SMS Alerts: Patients are notified when 2 tokens remain before their turn.",
  },
  {
    id: "security",
    patterns: [/data.*separat/i, /security/i, /isolat/i, /h1.*h2/i, /hipaa/i, /privacy/i, /tenant/i],
    response: "MedTech Fixaters provides strict multi-tenant data isolation:\n• Zero Data Overlap: Hospital H1 cannot access Hospital H2's doctors, patients, revenue, or clinical records.\n• PostgreSQL Row-Level Security (RLS): Enforced cryptographically at the database level.\n• Role-Based Access: Doctors only see assigned patients; Admins manage their facility only.",
  },
  {
    id: "doctor",
    patterns: [/doctor/i, /consultation/i, /prescription/i, /rx/i, /workspace/i, /clinical/i],
    response: "The Doctor Workspace enables high-speed clinical consultations:\n• 1-Click Patient Calling: Instant room chime and patient profile loading.\n• Longitudinal EMR: Instant view of previous consultations, vitals, and allergies.\n• Digital Prescription Studio (Rx): Drug catalog, dosage calculators, thermal/A4 printing, and instant WhatsApp PDF delivery.",
  },
  {
    id: "pricing",
    patterns: [/price/i, /cost/i, /plan/i, /subscription/i, /buy/i],
    response: "MedTech Fixaters provides flexible cloud deployment plans with 24-48 hour setup and zero expensive hardware required. Would you like me to schedule a 15-minute live demo for your clinic or hospital?",
  },
  {
    id: "contact",
    patterns: [/contact/i, /support/i, /email/i, /phone/i, /sales/i, /reach/i],
    response: "You can reach MedTech Fixaters directly:\n• Phone / WhatsApp: +91 95878 67559\n• Email: contact@medtechfixaters.in\n• Location: Jaipur, Rajasthan, India\n👉 Or type 'Book a demo' right here to schedule a live walkthrough!",
  },
];

export default function StickyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sticky-welcome",
      role: "ai",
      content:
        "Hello! I am the MedTech AI Assistant. Ask me anything about our Inbuilt CRM, QR appointments, live queues, doctor workspaces, or **ask me to book a 15-minute live demo** for your hospital.",
      type: "text",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Hide sticky widget on clinical/admin authenticated pages
  const isDashboardRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/hospitaldashboard") ||
    location.pathname.startsWith("/hospitaladmin") ||
    location.pathname.startsWith("/mrshahidbabu") ||
    location.pathname.startsWith("/display") ||
    location.pathname.startsWith("/a/") ||
    location.pathname.startsWith("/book/");

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (isDashboardRoute) return null;

  const extractDetails = (text: string): Partial<BookingFormData> => {
    const details: Partial<BookingFormData> = {};
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) details.email = emailMatch[0];

    const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6789]\d{9}/) || text.match(/\b\d{10,12}\b/);
    if (phoneMatch) details.phone = phoneMatch[0].replace(/\D/g, "").slice(-10);

    const nameMatch =
      text.match(/(?:Dr\.?|Doctor|Mr\.?|Ms\.?)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i) ||
      text.match(/(?:name is|i am|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameMatch) details.fullName = nameMatch[0].trim();

    const orgMatch =
      text.match(/(?:hospital|clinic|care|centre|center|health|polyclinic):\s*([A-Za-z0-9\s]+)/i) ||
      text.match(/([A-Za-z0-9\s]+(?:Hospital|Clinic|Health Center|Polyclinic|Care|Institute))/i);
    if (orgMatch) details.organization = orgMatch[1] || orgMatch[0];

    return details;
  };

  const executeLeadSubmission = async (booking: BookingFormData): Promise<string> => {
    const ticketId = `MTF-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await supabase.from("contact_messages").insert([
        {
          full_name: booking.fullName.trim() || "Doctor / Administrator",
          organization: booking.organization.trim() || "Hospital / Clinic",
          email: booking.email.trim() || "demo-lead@medtechfixaters.in",
          phone: booking.phone.trim() || null,
          subject: "Live Demo Request via Floating AI Assistant",
          message: `Live Demo booked via Sticky Chatbot. Requirements: ${booking.requirements || "Full OPD & CRM Workflow"}. Preferred Timing: ${booking.preferredTime || "Next Available Slot"}. Ticket ID: ${ticketId}`,
          status: "new",
        },
      ]);
    } catch {
      // ignore
    }

    try {
      const backups = JSON.parse(localStorage.getItem("contact_messages_backup") || "[]");
      backups.unshift({
        ...booking,
        ticketId,
        source: "sticky_chatbot",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("contact_messages_backup", JSON.stringify(backups));
    } catch {
      // ignore
    }

    return ticketId;
  };

  const processMessage = async (rawText: string) => {
    const lower = rawText.toLowerCase().trim();
    if (!lower) return;

    const isDemoIntent = /demo|book|schedule|contact|sales|talk to team|call back|callback|fill form|contact form|trial|buy/i.test(
      lower
    );

    const extracted = extractDetails(rawText);

    if (isDemoIntent && extracted.fullName && extracted.phone) {
      const fullBooking: BookingFormData = {
        fullName: extracted.fullName || "Dr. Administrator",
        organization: extracted.organization || "Hospital / Clinic",
        phone: extracted.phone || "",
        email: extracted.email || "doctor@hospital.com",
        requirements: "Comprehensive Hospital OS & Inbuilt CRM Walkthrough",
        preferredTime: "Next Available Slot",
      };

      const ticketId = await executeLeadSubmission(fullBooking);
      fullBooking.ticketId = ticketId;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: `🎉 **Live Demo Scheduled!** Reference ID: **${ticketId}**. Our clinical specialist will call you at **+91-${fullBooking.phone}** within 2 hours.`,
          type: "booking_confirmed",
          bookingData: fullBooking,
        },
      ]);
      return;
    }

    if (isDemoIntent) {
      const initialForm: BookingFormData = {
        fullName: extracted.fullName || "",
        organization: extracted.organization || "",
        phone: extracted.phone || "",
        email: extracted.email || "",
        requirements: "Inbuilt CRM, QR Booking, Doctor Workspace & Queues",
        preferredTime: "Tomorrow, 11:00 AM IST",
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content:
            "I'd love to schedule a **15-minute live interactive demo** for your facility! Please confirm or fill your details in the card below:",
          type: "booking_form",
          bookingData: initialForm,
        },
      ]);
      return;
    }

    // Match grounded knowledge
    const match = websiteKnowledge.find((k) =>
      k.patterns.some((p) => p.test(lower))
    );

    let reply = "";
    if (match) {
      reply = match.response;
    } else {
      reply =
        "MedTech Fixaters is an all-in-one AI-powered Healthcare Operating System with an Inbuilt Patient CRM, Smart QR Appointments, Independent Doctor Workspaces, and Real-Time Live Queue Management.\n\nWould you like to:\n• 📅 **Book a 15-Minute Live Demo**\n• 💬 **Learn about Inbuilt CRM & Recalls**\n• ⚡ **See how QR Token Check-in works**?";
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: reply,
        type: "text",
      },
    ]);
  };

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: msg,
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      processMessage(msg);
    }, 300);
  };

  const handleBookingSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    const ticketId = await executeLeadSubmission(data);
    const completed = { ...data, ticketId };

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: `🎉 **Live Demo Confirmed!** Your details have been submitted. Reference ID: **${ticketId}**. Our specialist will reach out to you at **+91-${data.phone}**.`,
        type: "booking_confirmed",
        bookingData: completed,
      },
    ]);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 w-[360px] sm:w-[410px] max-w-[94vw] h-[540px] max-h-[82vh] flex flex-col overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 p-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white">
                      MedTech AI Assistant
                    </h3>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-blue-100 font-medium">
                    Platform Support & Instant Demo Booking
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 cursor-pointer"
                aria-label="Close chat"
              >
                <X size={15} />
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs scroll-smooth">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    } w-full`}
                  >
                    {m.role === "ai" && (
                      <div className="mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Bot size={12} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-xs bg-blue-600 text-white shadow-sm"
                          : "rounded-bl-xs border border-slate-100 bg-white text-slate-700 shadow-2xs whitespace-pre-line"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>

                  {/* Inline Demo Booking Form */}
                  {m.type === "booking_form" && m.bookingData && (
                    <div className="w-full pl-7 pr-1 mt-2">
                      <StickyInlineBooking
                        initialData={m.bookingData}
                        onSubmit={handleBookingSubmit}
                        loading={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Confirmed Ticket Card */}
                  {m.type === "booking_confirmed" && m.bookingData && (
                    <div className="w-full pl-7 pr-1 mt-2">
                      <StickyConfirmedCard booking={m.bookingData} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions Chips */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2">
              <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1 no-scrollbar">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition cursor-pointer ${
                      s.includes("Demo")
                        ? "border-orange-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-100 p-3 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 focus-within:border-blue-500 focus-within:bg-white"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question or 'Book a demo'..."
                  className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 p-2 sm:px-4 sm:py-2.5 text-white shadow-xl shadow-blue-500/30 border border-white/40 backdrop-blur-md cursor-pointer"
        aria-label="Open AI Assistant"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Bot size={18} />
        </div>
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold leading-none">MedTech AI</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px] text-blue-100 leading-none">Book Live Demo</span>
        </div>
      </motion.button>
    </div>
  );
}

function StickyInlineBooking({
  initialData,
  onSubmit,
  loading,
}: {
  initialData: BookingFormData;
  onSubmit: (data: BookingFormData) => void;
  loading: boolean;
}) {
  const [data, setData] = useState(initialData);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2 text-[11px]"
    >
      <div className="flex items-center justify-between pb-1 border-b border-blue-100 font-bold text-slate-800">
        <span className="flex items-center gap-1 text-blue-600">
          <Calendar size={12} />
          <span>Book 15-Min Live Demo</span>
        </span>
        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          Free
        </span>
      </div>

      <input
        type="text"
        required
        placeholder="Doctor / Admin Name *"
        value={data.fullName}
        onChange={(e) => setData({ ...data, fullName: e.target.value })}
        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:border-blue-500"
      />

      <div className="grid grid-cols-2 gap-1.5">
        <input
          type="text"
          placeholder="Hospital / Clinic"
          value={data.organization}
          onChange={(e) => setData({ ...data, organization: e.target.value })}
          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:border-blue-500"
        />
        <input
          type="tel"
          required
          placeholder="Phone Number *"
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <>
            <span>Submit Demo Booking</span>
            <ArrowRight size={12} />
          </>
        )}
      </button>
    </form>
  );
}

function StickyConfirmedCard({ booking }: { booking: BookingFormData }) {
  const whatsappUrl = `https://wa.me/919587867559?text=${encodeURIComponent(
    `Hello MedTech Fixaters, I just booked a Live Demo (Ref: ${booking.ticketId || "DEMO"}). Doctor: ${booking.fullName}, Clinic: ${booking.organization}, Phone: ${booking.phone}.`
  )}`;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-[11px] text-slate-700 space-y-1.5">
      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
        <CheckCircle2 size={14} className="text-emerald-600" />
        <span>Live Demo Confirmed!</span>
      </div>

      <div className="bg-white rounded-lg p-2 border border-emerald-100 text-[10px] space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Ref ID:</span>
          <span className="font-bold text-blue-600 font-mono">
            {booking.ticketId || "MTF-DEMO"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Contact:</span>
          <span className="font-semibold text-slate-800">{booking.fullName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Phone:</span>
          <span className="font-semibold text-slate-800">+91-{booking.phone}</span>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center font-bold text-[10px] flex items-center justify-center gap-1 transition"
      >
        <span>Connect on WhatsApp</span>
        <ExternalLink size={10} />
      </a>
    </div>
  );
}
