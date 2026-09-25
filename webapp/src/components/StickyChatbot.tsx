import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Sparkles, X, Send, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { askPublicAssistant, type AssistantReply } from "../lib/publicAssistant";

// Website visitor assistant ("MedTechFixaters AI"). Answers come only from approved, published
// knowledge via the public-assistant edge function; nothing is generated or invented, and no
// visitor details are stored in the browser.

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "ai"; content: string; links?: AssistantReply["links"]; error?: boolean };

const STARTERS = ["How does QR booking work?", "Is patient data kept separate?", "Can individual doctors use it?", "How do I book a demo?"];

// Pages where the widget would get in the way (dashboards, booking, TV display).
const HIDDEN_PREFIXES = ["/dashboard", "/doctordashboard", "/hospitaldashboard", "/hospitaladmin", "/mrshahidbabu", "/display",
  "/a/", "/book/", "/appointment/", "/intake/", "/track", "/queue", "/appointments", "/follow-ups", "/history", "/medicines",
  "/qr-kiosk", "/availability", "/notifications", "/settings", "/profile", "/login", "/signup", "/doctor/"];

export default function StickyChatbot() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hello! I’m the MedTechFixaters assistant. Ask me about QR booking, the live queue, the doctor workspace, data security, pricing or a demo.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }, [messages, isOpen, reduce]);

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const send = async (text?: string) => {
    const message = (text ?? input).trim().slice(0, 500);
    if (!message || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: message }]);
    setBusy(true);
    try {
      const reply = await askPublicAssistant(message);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "ai", content: reply.answer, links: reply.links }]);
      setSuggestions(reply.suggestions);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "ai",
          error: true,
          content: e instanceof Error ? e.message : "The assistant is unavailable right now. You can email contact@medtechfixaters.in.",
          links: [{ label: "Contact us", href: "/contact" }],
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="MedTechFixaters assistant"
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.94, y: 16, filter: "blur(6px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 w-[360px] sm:w-[400px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[78vh] flex flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/85 text-[#171717] shadow-[0_24px_70px_-20px_rgba(255,106,0,0.35),0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"><Sparkles size={18} /></span>
                <div>
                  <h2 className="text-sm font-extrabold leading-tight">MedTechFixaters AI</h2>
                  <p className="text-[11px] font-medium text-orange-50">Answers from our approved public information</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close assistant" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-[13px]" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-[18px] px-3.5 py-2.5 leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white"
                        : m.error
                          ? "rounded-bl-md border border-rose-100 bg-rose-50 text-rose-800"
                          : "rounded-bl-md border border-orange-100/70 bg-white text-[#171717] shadow-sm"
                    }`}
                  >
                    {m.content}
                    {m.role === "ai" && m.links && m.links.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.links.map((l) => (
                          <Link
                            key={l.href}
                            to={l.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#C2410C] hover:bg-orange-100"
                          >
                            {l.label} <ArrowRight size={11} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6B6B]">
                  <Loader2 size={14} className="animate-spin text-[#FF6A00]" /> Looking that up…
                </div>
              )}
              <div ref={endRef} />
            </div>

            {suggestions.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto border-t border-orange-100/70 bg-[#FFF9F5]/80 px-3 py-2 [scrollbar-width:none]">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="shrink-0 rounded-full border border-orange-100 bg-white px-3 py-1 text-[11px] font-semibold text-[#171717] transition hover:border-orange-300 hover:text-[#C2410C] disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-orange-100/70 bg-white p-3"
            >
              <div className="flex items-center gap-1.5 rounded-2xl border border-orange-100 bg-[#FFF9F5] p-1 focus-within:border-orange-300 focus-within:bg-white">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Ask about MedTechFixaters…"
                  aria-label="Your question"
                  className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-[13px] outline-none placeholder:text-[#6B6B6B]"
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white transition disabled:opacity-50">
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-1 px-1 text-[10px] text-[#6B6B6B]">
                <ShieldCheck size={11} /> Don’t share personal or medical details here. For medical help, contact your doctor.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={reduce ? undefined : { scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close MedTechFixaters assistant" : "Open MedTechFixaters assistant"}
        className="ml-auto flex items-center gap-2.5 rounded-full border border-white/40 bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] p-2 text-white shadow-xl shadow-orange-500/30 sm:px-4 sm:py-2.5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><Sparkles size={17} /></span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-extrabold leading-none">MedTechFixaters AI</span>
          <span className="text-[10px] leading-none text-orange-50">Ask a question</span>
        </span>
      </motion.button>
    </div>
  );
}
