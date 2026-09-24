"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  Building2,
  User,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import landingFaqs from "../content/landingFaqs.json";

// Shared with the static SEO build (seo/build-seo.mjs) so FAQ schema matches the page.
const faqs = landingFaqs;

const suggestions = [
  "📅 Book a Live Demo",
  "How does the inbuilt CRM work?",
  "How does the QR appointment system work?",
  "How is hospital data kept separate?",
  "What can doctors manage in their workspace?",
];

interface KnowledgeItem {
  id: string;
  category: string;
  keywords: string[];
  patterns: RegExp[];
  title: string;
  response: string;
}

const websiteKnowledge: KnowledgeItem[] = [
  {
    id: "crm",
    category: "Inbuilt Healthcare CRM",
    keywords: ["crm", "patient relationship", "retention", "recall", "whatsapp", "sms", "followup", "follow up", "feedback", "nps", "campaign", "broadcast", "chronic"],
    patterns: [/crm/i, /patient.*retention/i, /follow.*up/i, /recall/i, /whatsapp.*reminder/i, /nps/i, /chronic.*care/i],
    title: "Inbuilt Hospital & Patient CRM System",
    response: "MedTech Fixaters includes a comprehensive Inbuilt Healthcare CRM System:\n• 360° Unified Patient Profile: View complete clinical visit history, past prescriptions, vitals trends, and lab reports in one searchable record.\n• Automated WhatsApp & SMS Recalls: Automatically trigger follow-up reminders 48h prior to appointments, medication renewals, and chronic disease checkups.\n• Chronic Disease Care Sequences: Automated recall pathways for Hypertension, Diabetes, and post-surgery care.\n• Patient NPS & Feedback: Instant post-consultation WhatsApp feedback collection to measure doctor ratings and OPD satisfaction without paying for external CRM software like Salesforce.",
  },
  {
    id: "qr",
    category: "QR Appointment System",
    keywords: ["qr", "scan", "barcode", "acrylic", "standee", "booking", "check in", "checkin", "kiosk", "intake"],
    patterns: [/qr/i, /scan/i, /standee/i, /appointment/i, /book/i, /kiosk/i],
    title: "Smart Hospital QR Appointment System",
    response: "Every hospital receives a unique QR code and digital appointment link:\n• Instant Scanning: Patients scan the hospital QR standee at entry using any smartphone camera.\n• Hospital-Isolated View: Patients only see departments and doctors available in that specific hospital.\n• Live Mobile Pass: Instantly generates a digital token pass with live position countdown.\n• Dual Booking Modes: Patients can use AI-guided symptom intake or skip directly to manual doctor selection.",
  },
  {
    id: "queue",
    category: "Live Queue Engine",
    keywords: ["queue", "token", "waiting", "wait time", "lounge", "display board", "calling", "line"],
    patterns: [/queue/i, /token/i, /wait.*time/i, /display.*board/i, /lounge/i],
    title: "Real-Time Live Queue Dispatcher",
    response: "The Live Queue Engine eliminates waiting room chaos:\n• Doctor-Isolated Queues: Each doctor manages an independent queue sequence (e.g. Token #CC-012).\n• Live Sync Across Screens: When a doctor completes a visit, the queue updates simultaneously on patient phones and waiting lounge display boards.\n• Smart SMS Alerts: Patients receive automated notifications when 2 tokens remain before their turn, allowing them to wait comfortably anywhere.",
  },
  {
    id: "security",
    category: "Data Isolation & Security",
    keywords: ["security", "data", "isolation", "h1", "h2", "privacy", "hipaa", "leak", "postgres", "rls", "protection", "tenant", "multi-tenant"],
    patterns: [/data.*separat/i, /security/i, /isolat/i, /h1.*h2/i, /hipaa/i, /privacy/i, /tenant/i],
    title: "Cryptographic Multi-Tenant Data Isolation",
    response: "MedTech Fixaters provides strict multi-tenant isolation:\n• Zero Data Overlap: Hospital H1 cannot access Hospital H2's doctors, patients, appointments, revenue, or clinical records.\n• PostgreSQL Row-Level Security (RLS): Enforced cryptographically at the database level.\n• Role-Based Access: Doctors only see their assigned patients; Hospital Admins manage their own facility only; Super Admins manage global health.",
  },
  {
    id: "doctor",
    category: "Doctor Workspace",
    keywords: ["doctor", "consultation", "prescription", "rx", "workspace", "emr", "vitals", "notes", "icd-10", "30 second"],
    patterns: [/doctor/i, /consultation/i, /prescription/i, /rx/i, /workspace/i, /clinical/i],
    title: "Sub-30-Second Doctor Clinical Workspace",
    response: "The Doctor Workspace is engineered for high-speed, frictionless consultations:\n• 1-Click Patient Calling: Instant room chime and patient record display.\n• Complete Clinical EMR: Instant view of previous consultations, vitals history, and allergy alerts.\n• Digital Prescription Studio (Rx): Built-in drug catalog, dosage calculators, thermal/A4 printing, and instant WhatsApp PDF delivery.",
  },
  {
    id: "admin",
    category: "Hospital Administration",
    keywords: ["admin", "hospital admin", "owner", "revenue", "analytics", "roster", "doctor management", "block", "staff", "operations"],
    patterns: [/admin/i, /revenue/i, /roster/i, /manage.*doctor/i, /analytics/i, /operation/i],
    title: "Hospital Operations & Command Center",
    response: "Hospital Administrators have complete operational visibility:\n• Doctor & Department Rostering: Add doctors, assign consultation rooms, configure OPD slot timings, and toggle availability.\n• Real-Time OPD Monitoring: Track patient throughput, live waiting times, and department workloads.\n• Revenue Tracking: Monitor daily OPD collections, appointment fees, and historical consultation trends.\n• Account Controls: Instantly activate or suspend doctor and staff permissions.",
  },
  {
    id: "ai",
    category: "AI Triage & Scribing",
    keywords: ["ai", "triage", "symptom", "assistant", "match", "specialist", "artificial intelligence", "scribe"],
    patterns: [/ai/i, /symptom/i, /triage/i, /specialist/i, /artificial intelligence/i],
    title: "MedTech AI Clinical Triage & Scribing",
    response: "MedTech AI powers multiple intelligent healthcare workflows:\n• Conversational Symptom Intake: Patients explain complaints in natural language (e.g., 'fever with headache since 2 days').\n• Department Matching: Accurately suggests suitable specialists (e.g. General Medicine vs Cardiology) with clinical reasoning.\n• Pre-Consultation Summaries: Generates structured notes for doctors before the patient enters the consultation room.\n• Optional Guidance: Patients can always skip AI guidance to book directly.",
  },
  {
    id: "pricing",
    category: "Pricing & Onboarding",
    keywords: ["price", "pricing", "cost", "plan", "trial", "subscription", "buy", "quote", "onboarding"],
    patterns: [/price/i, /cost/i, /plan/i, /trial/i, /subscription/i, /buy/i],
    title: "Deployment Plans & 15-Minute Live Demo",
    response: "MedTech Fixaters is delivered as a modern cloud platform:\n• 15-Minute Live Walkthrough: See the platform in action with our clinical implementation team.\n• 24-48 Hour Setup: Zero expensive local servers or hardware required—runs in any modern browser, tablet, or smartphone.\n• Predictable Modular Plans: Flexible for standalone clinics, polyclinics, and multi-specialty hospitals.\n👉 You can type 'Book a demo' right here or click the demo button above to schedule!",
  },
  {
    id: "about",
    category: "About MedTech Fixaters",
    keywords: ["about", "company", "who are you", "fixaters", "team", "mission", "vision", "founded"],
    patterns: [/about/i, /who.*are.*you/i, /fixaters/i, /company/i, /mission/i],
    title: "About MedTech Fixaters",
    response: "MedTech Fixaters builds AI-powered healthcare operating systems designed to eliminate manual administrative friction, long waiting lines, and fragmented patient records. Our mission is to connect hospitals, doctors, and patients through seamless, secure digital workflows.",
  },
  {
    id: "contact",
    category: "Contact & Support",
    keywords: ["contact", "support", "help", "email", "phone", "sales", "reach", "talk", "location"],
    patterns: [/contact/i, /support/i, /email/i, /phone/i, /sales/i, /reach/i],
    title: "Contact & Technical Support",
    response: "Get in touch with the MedTech Fixaters team:\n• Schedule Demo: You can ask me to book a demo right here in the chat, or visit /contact\n• Sales & Inquiries: info@medtechfixaters.in\n• Support Availability: 24/7 technical assistance for registered hospital networks.",
  },
];

export interface BookingFormData {
  fullName: string;
  organization: string;
  phone: string;
  email: string;
  requirements: string;
  preferredTime: string;
  ticketId?: string;
}

export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  type?: "text" | "booking_form" | "booking_confirmed";
  bookingData?: BookingFormData;
};

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "ai",
      content:
        "Hello! I am the MedTech Fixaters AI Assistant. I can answer anything about our platform features, inbuilt CRM, QR appointment bookings, live queues, doctor workspaces, or **book a 15-minute live demo** for your hospital or clinic.",
      type: "text",
    },
  ]);

  const visibleFAQs = showAll ? faqs : faqs.slice(0, 6);

  // Helper function to extract user details from text
  const extractBookingDetails = (text: string): Partial<BookingFormData> => {
    const details: Partial<BookingFormData> = {};

    // Extract email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      details.email = emailMatch[0];
    }

    // Extract Indian/International phone number (10+ digits)
    const phoneMatch = text.match(/(?:\+91[\s-]?)?[6789]\d{9}/) || text.match(/\b\d{10,12}\b/);
    if (phoneMatch) {
      details.phone = phoneMatch[0].replace(/\D/g, "").slice(-10);
    }

    // Extract Doctor/User name if prefixed with Dr. / Doctor or mentioned
    const nameMatch = text.match(/(?:Dr\.?|Doctor|Mr\.?|Ms\.?)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i) ||
                      text.match(/(?:name is|i am|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameMatch) {
      details.fullName = nameMatch[0].trim();
    }

    // Extract Hospital / Clinic name
    const orgMatch = text.match(/(?:hospital|clinic|care|centre|center|health|polyclinic):\s*([A-Za-z0-9\s]+)/i) ||
                     text.match(/([A-Za-z0-9\s]+(?:Hospital|Clinic|Health Center|Polyclinic|Care|Institute))/i);
    if (orgMatch) {
      details.organization = orgMatch[1] || orgMatch[0];
    }

    return details;
  };

  // Submit booking lead directly to Supabase and localStorage
  const executeLeadSubmission = async (booking: BookingFormData): Promise<string> => {
    const ticketId = `MTF-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          full_name: booking.fullName.trim() || "Doctor / Administrator",
          organization: booking.organization.trim() || "Hospital / Clinic",
          email: booking.email.trim() || "demo-lead@medtechfixaters.in",
          phone: booking.phone.trim() || null,
          subject: "Live Demo Request via MedTech AI Assistant",
          message: `Live Demo booked via website chatbot. Requirements: ${booking.requirements || "Full OPD & CRM Workflow"}. Preferred Timing: ${booking.preferredTime || "Next Available Slot"}. Ticket ID: ${ticketId}`,
          status: "new",
        },
      ]);

      if (error) {
        console.warn("Supabase insert fallback:", error.message);
      }
    } catch (err) {
      console.error("Supabase booking submission error:", err);
    }

    // Always record local storage backups
    try {
      const backups = JSON.parse(localStorage.getItem("contact_messages_backup") || "[]");
      backups.unshift({
        ...booking,
        ticketId,
        source: "ai_chatbot",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("contact_messages_backup", JSON.stringify(backups));

      const leads = JSON.parse(localStorage.getItem("clinicos_leads") || "[]");
      leads.unshift({
        id: `lead-${Date.now()}`,
        name: booking.fullName,
        phone: booking.phone,
        email: booking.email,
        clinic_name: booking.organization,
        speciality: "Hospital OPD / Clinic OS",
        plan: "Live Product Demo",
        timestamp: new Date().toLocaleString(),
      });
      localStorage.setItem("clinicos_leads", JSON.stringify(leads));
    } catch {
      // ignore
    }

    return ticketId;
  };

  const processUserMessage = async (rawMessage: string) => {
    const lower = rawMessage.toLowerCase().trim();
    if (!lower) return;

    // Check for demo booking / contact intent
    const isDemoIntent =
      /demo|book|schedule|contact|sales|talk to team|call back|callback|fill form|contact form|register my hospital|try platform|buy/i.test(
        lower
      );

    const extracted = extractBookingDetails(rawMessage);

    // If user provided complete details in a single message
    if (
      isDemoIntent &&
      extracted.fullName &&
      extracted.phone &&
      (extracted.email || extracted.organization)
    ) {
      const fullBooking: BookingFormData = {
        fullName: extracted.fullName || "Dr. Administrator",
        organization: extracted.organization || "Hospital / Medical Center",
        phone: extracted.phone || "",
        email: extracted.email || "doctor@hospital.com",
        requirements: "Comprehensive Hospital OS & Inbuilt CRM Walkthrough",
        preferredTime: "Next Available Slot (Within 24 Hours)",
      };

      const ticketId = await executeLeadSubmission(fullBooking);
      fullBooking.ticketId = ticketId;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: `🎉 **Live Demo Confirmed!** I have registered your request and automatically submitted your details to our clinical team. Your reference ID is **${ticketId}**. Our specialist will reach out to you at **+91-${fullBooking.phone}** within 2 hours.`,
          type: "booking_confirmed",
          bookingData: fullBooking,
        },
      ]);
      return;
    }

    // If user wants to book a demo or autofill contact form but hasn't provided all info yet
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
            "I'd love to set up a personalized **15-minute live interactive demo** for your hospital or clinic! Please verify or fill in your details below, and I will submit it directly to our clinical specialists.",
          type: "booking_form",
          bookingData: initialForm,
        },
      ]);
      return;
    }

    // Otherwise, standard Grounded Knowledge Search
    let bestMatch: KnowledgeItem | null = null;
    let highestScore = 0;

    for (const item of websiteKnowledge) {
      let score = 0;
      for (const pattern of item.patterns) {
        if (pattern.test(lower)) score += 5;
      }
      for (const kw of item.keywords) {
        if (lower.includes(kw)) score += 3;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    let responseText = "";
    if (bestMatch && highestScore > 0) {
      responseText = bestMatch.response;
    } else {
      const faqMatch = faqs.find(
        (f) =>
          f.question.toLowerCase().includes(lower) ||
          lower
            .split(" ")
            .some((w) => w.length > 3 && f.question.toLowerCase().includes(w))
      );
      if (faqMatch) {
        responseText = faqMatch.answer;
      } else {
        responseText =
          "MedTech Fixaters is an all-in-one AI-powered Healthcare Operating System with an Inbuilt Patient CRM, Smart QR Appointments, Independent Doctor Workspaces, and Real-Time Live Queue Management.\n\nWould you like to:\n• 📅 **Book a 15-Minute Live Demo**\n• 💬 **Learn about the Inbuilt CRM & Recalls**\n• ⚡ **See how QR Token Check-in works**\n• 🔒 **Verify Cryptographic Data Separation**?";
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: responseText,
        type: "text",
      },
    ]);
  };

  const sendMessage = (question?: string) => {
    const text = question || input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      type: "text",
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    setTimeout(() => {
      processUserMessage(text);
    }, 350);
  };

  const handleFormSubmission = async (formData: BookingFormData) => {
    const ticketId = await executeLeadSubmission(formData);
    const completedBooking = { ...formData, ticketId };

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: `🎉 **Live Demo Confirmed!** Your details have been submitted. Reference ID: **${ticketId}**. Our clinical specialist will call you at **+91-${formData.phone}** to coordinate your walkthrough.`,
        type: "booking_confirmed",
        bookingData: completedBooking,
      },
    ]);
  };

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#f6f7fb] py-24 sm:py-32"
    >
      <FAQBackground />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading />

        <div className="mt-16 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <FAQList
            openFAQ={openFAQ}
            setOpenFAQ={setOpenFAQ}
            visibleFAQs={visibleFAQs}
            showAll={showAll}
            setShowAll={setShowAll}
          />

          <AIChatbot
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            onSubmitBooking={handleFormSubmission}
          />
        </div>
      </div>
    </section>
  );
}

function FAQBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-200px] top-[10%] h-[500px] w-[500px] rounded-full bg-blue-300/20 blur-[140px]" />
        <div className="absolute right-[-150px] top-[35%] h-[450px] w-[450px] rounded-full bg-violet-300/20 blur-[140px]" />
        <div className="absolute bottom-[-300px] left-[35%] h-[500px] w-[500px] rounded-full bg-orange-200/25 blur-[140px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_65%)]" />
    </>
  );
}

function SectionHeading() {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-2 shadow-2xs backdrop-blur-xl"
      >
        <MessageCircle size={14} className="text-blue-600" />
        <span className="text-[10px] font-bold tracking-[0.18em] text-blue-600 uppercase">
          FREQUENTLY ASKED QUESTIONS & AI ASSISTANT
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mt-7 text-4xl font-semibold tracking-[-0.055em] text-[#172033] sm:text-6xl"
      >
        Questions.
        <span className="block text-blue-600">Answered Instantly.</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg"
      >
        Learn about our Inbuilt Healthcare CRM, QR appointments, isolated hospital databases, doctor workspaces, and live queues — or ask our AI to **book a live demo** for you directly.
      </motion.p>
    </div>
  );
}

function FAQList({
  openFAQ,
  setOpenFAQ,
  visibleFAQs,
  showAll,
  setShowAll,
}: {
  openFAQ: number | null;
  setOpenFAQ: (index: number | null) => void;
  visibleFAQs: typeof faqs;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
}) {
  return (
    <div>
      <div className="space-y-3">
        {visibleFAQs.map((faq, index) => {
          const isOpen = openFAQ === index;

          return (
            <motion.div
              key={faq.question}
              layout
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
              className={`overflow-hidden rounded-[24px] border transition-all duration-300 ${
                isOpen
                  ? "border-blue-100 bg-white/90 shadow-[0_20px_60px_rgba(37,99,235,0.08)]"
                  : "border-white bg-white/60 hover:bg-white/80"
              } backdrop-blur-xl text-left`}
            >
              <button
                onClick={() => setOpenFAQ(isOpen ? null : index)}
                className="flex w-full items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 text-left cursor-pointer"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold transition-colors ${
                    isOpen ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <span className="flex-1 text-sm font-semibold text-[#172033] sm:text-base">
                  {faq.question}
                </span>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isOpen ? "bg-blue-50 text-blue-600" : "text-slate-400"
                  }`}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="border-t border-slate-100 px-6 pb-6 pt-5 pl-5 sm:pl-[4.8rem]">
                      <p className="max-w-2xl text-sm leading-7 text-slate-500 whitespace-pre-line">
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

      <motion.div layout className="mt-8 flex justify-center">
        <button
          onClick={() => setShowAll(!showAll)}
          className="group inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-[#172033] shadow-2xs transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
        >
          {showAll ? "Show Less" : "View All Questions"}
          <motion.span animate={{ rotate: showAll ? 180 : 0 }}>
            <ChevronDown size={17} className="transition-transform" />
          </motion.span>
        </button>
      </motion.div>
    </div>
  );
}

function AIChatbot({
  messages,
  input,
  setInput,
  sendMessage,
  onSubmitBooking,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: (message?: string) => void;
  onSubmitBooking: (data: BookingFormData) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, filter: "blur(15px)" }}
      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, type: "spring", stiffness: 70 }}
      className="sticky top-24 text-left"
    >
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/80 shadow-[0_30px_100px_rgba(15,23,42,0.1)] backdrop-blur-2xl">
        <div className="absolute left-1/2 top-[-100px] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-blue-400/20 blur-[80px]" />

        <ChatHeader />

        <ChatMessages messages={messages} onSubmitBooking={onSubmitBooking} />

        <SuggestionButtons sendMessage={sendMessage} />

        <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} />
      </div>
    </motion.div>
  );
}

function ChatHeader() {
  return (
    <div className="relative border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-blue-50/50 via-white/50 to-orange-50/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
          >
            <Bot size={22} />
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#172033]">
                MedTech Assistant
              </h3>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[8px] font-bold text-emerald-600">
                  LIVE
                </span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Grounded AI • Demo Booking & CRM Support
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-[10px] font-semibold text-blue-700">
          <Sparkles size={12} className="text-blue-600" />
          <span>Instant Booking</span>
        </div>
      </div>
    </div>
  );
}

function ChatMessages({
  messages,
  onSubmitBooking,
}: {
  messages: ChatMessage[];
  onSubmitBooking: (data: BookingFormData) => void;
}) {
  return (
    <div className="relative max-h-[380px] min-h-[320px] space-y-4 overflow-y-auto px-5 py-6 scroll-smooth">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`flex flex-col ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } w-full`}
            >
              {message.role === "ai" && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Bot size={13} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-[20px] px-4 py-3 text-xs leading-relaxed ${
                  message.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                    : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-2xs whitespace-pre-line"
                }`}
              >
                {message.content}
              </div>
            </div>

            {/* Interactive Inline Demo Booking Form */}
            {message.type === "booking_form" && message.bookingData && (
              <div className="w-full pl-9 pr-2 mt-3">
                <InlineBookingForm
                  initialData={message.bookingData}
                  onSubmit={onSubmitBooking}
                />
              </div>
            )}

            {/* Confirmed Ticket Card */}
            {message.type === "booking_confirmed" && message.bookingData && (
              <div className="w-full pl-9 pr-2 mt-3">
                <ConfirmedBookingCard booking={message.bookingData} />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function InlineBookingForm({
  initialData,
  onSubmit,
}: {
  initialData: BookingFormData;
  onSubmit: (data: BookingFormData) => void;
}) {
  const [formData, setFormData] = useState<BookingFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError("Please provide your Name.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setError("Please provide a valid Phone/WhatsApp number.");
      return;
    }

    setError("");
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-blue-200 bg-gradient-to-b from-white to-blue-50/40 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            Book 15-Min Live Platform Demo
          </span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          ✓ Free Walkthrough
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
            Your Name (Doctor / Admin) *
          </label>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500">
            <User size={13} className="text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. Dr. Aryan Sharma"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full text-xs text-slate-800 outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              Hospital / Clinic Name
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500">
              <Building2 size={13} className="text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Apollo / City Care"
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
                className="w-full text-xs text-slate-800 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              Phone / WhatsApp Number *
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500">
              <Phone size={13} className="text-slate-400" />
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full text-xs text-slate-800 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500">
              <Mail size={13} className="text-slate-400" />
              <input
                type="email"
                placeholder="doctor@clinic.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full text-xs text-slate-800 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              Preferred Time
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500">
              <Clock size={13} className="text-slate-400" />
              <input
                type="text"
                placeholder="Tomorrow, 11:00 AM"
                value={formData.preferredTime}
                onChange={(e) =>
                  setFormData({ ...formData, preferredTime: e.target.value })
                }
                className="w-full text-xs text-slate-800 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-semibold text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Submitting Live Demo Request...
            </>
          ) : (
            <>
              <span>Confirm & Schedule Live Demo</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

function ConfirmedBookingCard({ booking }: { booking: BookingFormData }) {
  const whatsappUrl = `https://wa.me/919999999999?text=${encodeURIComponent(
    `Hello MedTech Fixaters, I just requested a Live Demo (Ref: ${booking.ticketId || "DEMO"}). Name: ${booking.fullName}, Clinic: ${booking.organization}, Phone: ${booking.phone}.`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white p-4 text-xs shadow-xs"
    >
      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
        <CheckCircle2 size={16} className="text-emerald-600" />
        <span>Demo Registered Successfully!</span>
      </div>

      <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-1.5 mb-3 text-slate-700 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-400">Reference ID:</span>
          <span className="font-bold text-blue-600 font-mono">
            {booking.ticketId || "MTF-DEMO-2026"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Doctor / Contact:</span>
          <span className="font-semibold text-slate-800">{booking.fullName}</span>
        </div>
        {booking.organization && (
          <div className="flex justify-between">
            <span className="text-slate-400">Hospital/Clinic:</span>
            <span className="font-semibold text-slate-800">
              {booking.organization}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-400">Phone:</span>
          <span className="font-semibold text-slate-800">+91-{booking.phone}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
        >
          <span>Connect via WhatsApp</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </motion.div>
  );
}

function SuggestionButtons({
  sendMessage,
}: {
  sendMessage: (message: string) => void;
}) {
  return (
    <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/50">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
        Quick Action Suggestions
      </p>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => sendMessage(suggestion)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
              suggestion.includes("Demo")
                ? "border-orange-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 hover:border-orange-300"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatInput({
  input,
  setInput,
  sendMessage,
}: {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
}) {
  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.08)]">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Ask a question or type 'Book a demo'..."
          className="min-w-0 flex-1 bg-transparent px-3 text-xs text-[#172033] outline-none placeholder:text-slate-400 font-medium"
        />

        <button
          onClick={() => sendMessage()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-2 text-[9px] text-slate-400 font-medium">
        <Sparkles size={11} className="text-blue-500" />
        <span>Ask anything or type your contact info to auto-book a live demo.</span>
      </div>
    </div>
  );
}
