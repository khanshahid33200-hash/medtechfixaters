import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Bot,
  Send,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

const allFAQs: FAQItem[] = [
  {
    question: "How does the QR appointment system work?",
    answer:
      "Every hospital receives its own unique QR code and appointment link. Patients scan the QR using their phone, view only the departments and doctors available in that specific hospital, and book their appointment in seconds.",
  },
  {
    question: "Is each hospital's data kept separate?",
    answer:
      "Yes. Each hospital operates inside its own protected workspace. Doctors, patients, appointments, queues, revenue, and records stay strictly separated through database-level isolation and role-based access rules.",
  },
  {
    question: "Can each doctor see every hospital patient?",
    answer:
      "No. A doctor sees only the patients and appointments assigned to their private workspace. The hospital administrator manages authorized data for doctors and patients only within their own hospital.",
  },
  {
    question: "How does AI-guided booking work?",
    answer:
      "Patients share their health concern and symptom duration with the MedTech AI assistant. The AI intelligently guides them toward an appropriate available department or doctor. Patients can also skip AI assistance and book directly.",
  },
  {
    question: "How does the live queue system work?",
    answer:
      "Every doctor has an independent real-time queue. When a doctor marks a consultation as completed, the remaining queue positions and estimated wait times update live for all waiting patients.",
  },
  {
    question: "Does every hospital receive its own QR code?",
    answer:
      "Yes. Every registered hospital is assigned a permanent, unique QR code and digital booking link that connects patients strictly to that hospital's services and doctors.",
  },
  {
    question: "Will Hospital H1 see doctors from Hospital H2?",
    answer:
      "No. Hospital workspaces, QR booking pages, and management dashboards show authorized data from that hospital only. Cross-hospital data leaks are strictly prevented.",
  },
  {
    question: "Can a patient skip AI assistance?",
    answer:
      "Yes. The AI experience is fully optional. Patients can click 'Book Manually' to select their desirable department and preferred available doctor directly.",
  },
  {
    question: "What details can patients provide while booking?",
    answer:
      "Patients can provide full name, age, gender, contact number, optional email, symptom descriptions, duration, known conditions, previous medicines, and past doctor consultations.",
  },
  {
    question: "Can a hospital administrator manage doctors?",
    answer:
      "Yes. Hospital administrators have full control to add doctor profiles, assign specialties, configure consultation slots, activate, or temporarily block doctor accounts.",
  },
  {
    question: "Does each doctor have a separate dashboard?",
    answer:
      "Yes. Each doctor logs into a private doctor console featuring their daily appointments, live waiting queue, patient profiles, medical history records, and digital prescription tools.",
  },
  {
    question: "Can a hospital administrator view doctor activity?",
    answer:
      "Yes. Hospital administrators can monitor doctor consultation activity, daily patient volume, queue speed, department workloads, and overall hospital performance.",
  },
  {
    question: "What happens when a doctor is blocked?",
    answer:
      "The doctor's account access is immediately suspended. They cannot log in, receive new appointments, or view records until an authorized administrator restores their account.",
  },
  {
    question: "What happens when a hospital is blocked?",
    answer:
      "The hospital loses platform access according to the account status configured by the platform administrator, locking all linked doctor consoles and QR booking access.",
  },
  {
    question: "Can the system store patient history?",
    answer:
      "Yes. The platform maintains comprehensive digital medical records, past consultation summaries, digital prescriptions, lab reports, and longitudinal patient visit histories securely.",
  },
  {
    question: "Does the platform support automated follow-ups?",
    answer:
      "Yes. MedTech Fixaters supports automated follow-up reminders, scheduled return visits, appointment notifications, and communication workflows.",
  },
  {
    question: "Will patients receive notifications?",
    answer:
      "Yes. Patients receive real-time appointment confirmations, token numbers, queue progress updates, estimated wait time alerts, and follow-up reminders.",
  },
  {
    question: "Can doctors receive new appointment notifications?",
    answer:
      "Yes. Doctors receive instant visual and audible alerts on their dashboard when a new appointment is booked or when live queue adjustments occur.",
  },
  {
    question: "Can hospitals track revenue and appointments?",
    answer:
      "Yes. Hospital dashboards include analytics for tracking daily appointment volume, department breakdown, doctor consultations, and revenue summaries.",
  },
  {
    question: "Is there an AI assistant for platform questions?",
    answer:
      "Yes. Visitors and administrators can interact with the MedTech AI Assistant to explore platform capabilities, architecture, and features anytime.",
  },
];

const suggestedQueries = [
  "How does the QR system work?",
  "How is hospital data protected?",
  "What can doctors manage?",
  "How does AI booking work?",
];

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
}

export default function FAQAndAIAssistant() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello. I am the MedTech Fixaters AI Assistant. Ask me about hospitals, doctors, QR appointments, live queues, patient management, or platform security.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const displayedFAQs = isExpanded ? allFAQs : allFAQs.slice(0, 5);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSendMessage = (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue("");
    setIsTyping(true);

    // Contextual AI Response Logic for MedTech Platform
    setTimeout(() => {
      const q = textToSend.toLowerCase().trim();
      let reply = "MedTech Fixaters is an all-in-one AI-powered Healthcare Operating System with an Inbuilt Patient CRM, Smart QR Appointments, Independent Doctor Workspaces, and Real-Time Live Queue Management.";

      if (q.includes("crm") || q.includes("retention") || q.includes("recall") || q.includes("whatsapp") || q.includes("nps") || q.includes("chronic")) {
        reply = "MedTech Fixaters features an Inbuilt Patient & Hospital CRM Suite: 360° unified patient history, automated WhatsApp/SMS recall reminders 48 hours prior to visits, chronic care management pathways (Hypertension, Diabetes), and patient NPS feedback collection without needing third-party software.";
      } else if (q.includes("qr") || q.includes("scan") || q.includes("standee") || q.includes("kiosk")) {
        reply = "Every hospital receives a dedicated unique QR code and booking link. Patients scan the QR using any smartphone camera, access only that hospital's doctors, choose AI or direct booking, and receive an instant live mobile queue token.";
      } else if (q.includes("data") || q.includes("protect") || q.includes("separat") || q.includes("isolat") || q.includes("security") || q.includes("hipaa") || q.includes("h1") || q.includes("h2")) {
        reply = "Each hospital operates in a fully isolated workspace with database-level PostgreSQL Row-Level Security (RLS). Hospital H1 cannot view Hospital H2 records, and doctors strictly see only their assigned patients.";
      } else if (q.includes("doctor") || q.includes("dashboard") || q.includes("prescription") || q.includes("rx") || q.includes("consult")) {
        reply = "Doctors receive a private clinical workspace featuring sub-30-second consultations, live queue management, 1-click patient calling, complete longitudinal EMR history, and a digital prescription builder with WhatsApp PDF delivery and thermal printing.";
      } else if (q.includes("queue") || q.includes("token") || q.includes("wait") || q.includes("display") || q.includes("lounge")) {
        reply = "Every doctor has an independent live queue. When consultations are completed, waiting positions and countdowns update live simultaneously on patient phones and hospital waiting lounge display boards.";
      } else if (q.includes("ai") || q.includes("assist") || q.includes("triage") || q.includes("symptom")) {
        reply = "MedTech AI collects symptoms, duration, and patient details in natural language to intelligently guide patients toward the right department and doctor. It is completely optional and skippable.";
      } else if (q.includes("price") || q.includes("pricing") || q.includes("cost") || q.includes("plan") || q.includes("demo")) {
        reply = "MedTech Fixaters offers flexible deployment plans for standalone clinics, polyclinics, and multi-specialty hospitals with zero expensive hardware required. Click 'Book a Demo' in the navigation bar to schedule a 15-minute live walkthrough.";
      } else if (q.includes("admin") || q.includes("revenue") || q.includes("roster") || q.includes("block") || q.includes("manage")) {
        reply = "Hospital administrators have complete control: doctor and department rostering, OPD slot management, real-time workload monitoring, daily revenue tracking, and instant doctor account access controls.";
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: reply,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <section id="faq" className="relative overflow-hidden bg-[#F6F7FB] py-24 sm:py-32 text-slate-900">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute left-1/4 top-10 h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-[450px] w-[450px] rounded-full bg-orange-400/[0.03] blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

        {/* ─── SECTION HEADER ─── */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-4 py-2 shadow-2xs backdrop-blur-xl"
          >
            <HelpCircle size={14} className="text-blue-600" />
            <span className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
              FREQUENTLY ASKED QUESTIONS
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#17191F] sm:text-5xl lg:text-6xl leading-[1.12]"
          >
            Questions,{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#F97316] bg-clip-text text-transparent">
              Answered.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#6B6F78]"
          >
            Everything you need to know about MedTech Fixaters, hospital management, doctor access, QR appointments, AI booking, and patient data security.
          </motion.p>
        </div>

        {/* ─── 2-COLUMN MAIN LAYOUT: FAQ ACCORDION (LEFT) + AI CHATBOT (RIGHT) ─── */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12 items-start">

          {/* LEFT 7 COLUMNS: FAQ Accordion Cards */}
          <div className="lg:col-span-7 space-y-3.5">
            <AnimatePresence>
              {displayedFAQs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, delay: index < 5 ? 0 : (index - 5) * 0.03 }}
                    className={`group rounded-[22px] border transition-all duration-300 backdrop-blur-xl text-left ${
                      isOpen
                        ? "border-blue-300/80 bg-white shadow-[0_15px_40px_rgba(37,99,235,0.08)] ring-1 ring-blue-500/20"
                        : "border-white/80 bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:bg-white hover:border-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                    >
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg shrink-0">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </span>
                      <h3
                        className={`flex-1 text-sm sm:text-base font-semibold leading-snug transition-colors ${
                          isOpen ? "text-blue-700" : "text-[#172033] group-hover:text-blue-600"
                        }`}
                      >
                        {faq.question}
                      </h3>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen
                            ? "bg-blue-600 text-white rotate-180 shadow-xs"
                            : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                        }`}
                      >
                        {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-xs sm:text-sm leading-relaxed text-[#6B6F78] border-t border-slate-100/80 mt-1">
                            <p className="pt-3">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Expand / Show More Button */}
            <div className="pt-4 text-center">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white border border-slate-200/90 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all cursor-pointer"
              >
                <span>{isExpanded ? "Show Less Questions ↑" : "View All 20 Questions ↓"}</span>
              </motion.button>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: AI Assistant Interactive Chat Card */}
          <div className="lg:col-span-5 sticky top-28">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="rounded-[30px] border border-white/90 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl text-left flex flex-col h-[620px]"
            >
              {/* Chatbot Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                    <Bot size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-sm font-bold text-[#172033]">MedTech AI</h4>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Assistant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ask anything about MedTech Fixaters.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested Questions Pills */}
              <div className="py-3 border-b border-slate-100/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Suggested Questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQueries.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleSendMessage(pill)}
                      className="text-[10.5px] font-medium text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 rounded-full px-3 py-1 transition-all cursor-pointer text-left"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs custom-scrollbar">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[18px] p-3.5 leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-2xs shadow-xs"
                          : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-2xs shadow-2xs"
                      }`}
                    >
                      {msg.sender === "ai" && (
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] mb-1">
                          <Sparkles size={11} />
                          <span>MedTech AI</span>
                        </div>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3 rounded-bl-2xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Box */}
              <div className="pt-3 border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 pr-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question about the platform..."
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="w-8 h-8 rounded-xl bg-blue-600 disabled:opacity-40 text-white flex items-center justify-center transition-all hover:bg-blue-700 cursor-pointer shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
                <p className="text-[9.5px] text-center text-slate-400 mt-2">
                  AI answers questions about platform features. Not for medical diagnosis.
                </p>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
