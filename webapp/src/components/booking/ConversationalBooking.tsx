import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, ShieldCheck, RotateCcw, Stethoscope, Clock, IndianRupee, CalendarDays, Loader2, CheckCircle2 } from "lucide-react";
import { AIMessage } from "./AIMessage";
import { PatientMessage } from "./PatientMessage";
import { TypingIndicator } from "./TypingIndicator";
import type { BookingResult, DoctorItem, HospitalWorkspace } from "../../types/booking";
import { supabase } from "../../lib/supabase";
import { createAppointment } from "../../services/appointmentService";
import {
  type AvailableDoctor,
  EMERGENCY_RE,
  UNAVAILABLE_REASON,
  formatDate,
  matchesSpecialty,
  parseAge,
  parseDate,
  parseDoctor,
  parseGender,
  parseName,
  parsePhone,
  parseSpecialty,
  parseTimePreference,
} from "../../lib/bookingAssistant";

// MedTechFixaters AI booking assistant — built in, no external AI model.
// It understands dates, specialties and doctor names in plain language, but every doctor,
// time, fee and capacity it shows comes from get_booking_availability, and the booking itself
// is made by the existing book_qr_appointment RPC, which assigns the patient ID, token and queue.

type Slots = {
  date?: string;
  specialty?: { keys: string[]; label: string };
  doctor?: AvailableDoctor;
  timePref?: "morning" | "afternoon" | "evening" | null;
  name?: string;
  phone?: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  reason?: string;
};

type Ask = "date" | "specialty" | "doctor" | "name" | "phone" | "age" | "gender" | "reason" | "confirm" | "emergency" | "done";

type Msg =
  | { id: string; from: "ai"; text: string; chips?: string[] }
  | { id: string; from: "patient"; text: string }
  | { id: string; from: "doctors"; date: string; doctors: AvailableDoctor[] }
  | { id: string; from: "confirm"; slots: Slots };

interface Props {
  hospital: HospitalWorkspace | null;
  bookingRef: string; // QR token or hospital id used to resolve the hospital server-side
  doctors: DoctorItem[];
  onBooked: (result: BookingResult) => void;
  onBack: () => void;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const shortDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
const addDaysIso = (isoDate: string, n: number) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const x = new Date(y, m - 1, d + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const ConversationalBooking: React.FC<Props> = ({ hospital, bookingRef, doctors, onBooked, onBack }) => {
  const isSingleDoctor = Boolean(hospital?.is_individual_doctor) || doctors.length === 1;
  const place = hospital?.clinic?.name || hospital?.name || "the clinic";

  const [slots, setSlots] = useState<Slots>({});
  const [ask, setAsk] = useState<Ask>("date");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "hello",
      from: "ai",
      text: `Hello! I can book your appointment at ${place}. Tell me what you need, for example “I want to see a skin doctor tomorrow” or “Book Dr. ${doctors[0]?.name?.replace(/^dr\.?\s*/i, "").split(" ")[0] || "Sharma"} on Monday”.`,
      chips: ["Today", "Tomorrow", "Day after tomorrow"],
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [booking, setBooking] = useState(false);
  const availabilityCache = useRef<Record<string, AvailableDoctor[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const say = (text: string, chips?: string[]) => setMessages((m) => [...m, { id: uid(), from: "ai", text, chips }]);

  const loadAvailability = async (date: string): Promise<AvailableDoctor[] | null> => {
    if (availabilityCache.current[date]) return availabilityCache.current[date];
    const { data, error } = await supabase.rpc("get_booking_availability", { p_token: bookingRef, p_date: date });
    if (error || !data?.success) {
      say(data?.error || "I couldn’t load the doctors’ availability right now. Please try again, or use “Choose doctor myself”.");
      return null;
    }
    availabilityCache.current[date] = data.doctors as AvailableDoctor[];
    return availabilityCache.current[date];
  };

  // Decides what to ask next from what we know. Only real availability is ever shown.
  const proceed = async (s: Slots) => {
    if (!s.date) {
      setAsk("date");
      return say("Which day would you like to come in? You can say today, tomorrow, a weekday or a date like 28 Sep.", ["Today", "Tomorrow", "Day after tomorrow"]);
    }

    if (!s.doctor) {
      const list = await loadAvailability(s.date);
      if (!list) return;
      if (!list.length) return say(`${place} has no doctors taking online bookings right now. Please call the clinic.`);

      let pool = list;
      if (s.specialty && !isSingleDoctor) {
        const matched = list.filter((d) => matchesSpecialty(d, s.specialty!.keys));
        if (matched.length) pool = matched;
        else say(`${place} doesn’t list a ${s.specialty.label} doctor. Here’s who is available instead.`);
      }

      const available = pool.filter((d) => d.available);
      if (isSingleDoctor && available.length === 1) {
        const next = { ...s, doctor: available[0] };
        setSlots(next);
        say(`${available[0].name} is available on ${formatDate(s.date)} (${available[0].hours}).`);
        return proceed(next);
      }

      if (!available.length) {
        // Look ahead up to a week for the first date with a matching doctor.
        const options: string[] = [];
        for (let i = 1; i <= 7 && options.length < 3; i++) {
          const d = addDaysIso(s.date, i);
          const l = await loadAvailability(d);
          if (!l) break;
          const p = s.specialty && !isSingleDoctor ? l.filter((x) => matchesSpecialty(x, s.specialty!.keys)) : l;
          if (p.some((x) => x.available)) options.push(shortDate(d));
        }
        const why = pool.map((d) => `${d.name} is ${UNAVAILABLE_REASON[d.reason || ""] || "unavailable"}`).slice(0, 3).join("; ");
        setAsk("date");
        return say(
          `No ${s.specialty && !isSingleDoctor ? s.specialty.label + " " : ""}doctor is available on ${formatDate(s.date)}${why ? ` (${why})` : ""}.` +
            (options.length ? " These days have availability:" : " Please try another date."),
          options,
        );
      }

      if (!s.specialty && !isSingleDoctor && available.length > 4) {
        setAsk("specialty");
        const depts = Array.from(new Set(available.map((d) => d.department))).slice(0, 6);
        return say(`Sure. What type of doctor would you like to see on ${formatDate(s.date)}?`, depts);
      }

      setAsk("doctor");
      say(`Here’s who is available on ${formatDate(s.date)}. Tap a doctor to continue.`);
      return setMessages((m) => [...m, { id: uid(), from: "doctors", date: s.date!, doctors: pool }]);
    }

    if (!s.name) { setAsk("name"); return say("What is the patient’s full name?"); }
    if (!s.phone) { setAsk("phone"); return say("What mobile number should we use for this booking?"); }
    if (s.age === undefined) { setAsk("age"); return say("What is the patient’s age?"); }
    if (!s.gender) { setAsk("gender"); return say("And the patient’s gender?", ["Male", "Female", "Other"]); }
    if (!s.reason) { setAsk("reason"); return say("Briefly, what is the reason for the visit? This helps the doctor prepare."); }

    setAsk("confirm");
    say("Please check the details and confirm your booking.");
    setMessages((m) => [...m, { id: uid(), from: "confirm", slots: s }]);
  };

  const handleText = async (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text || thinking || booking) return;
    setMessages((m) => [...m, { id: uid(), from: "patient", text }]);
    setInput("");
    setThinking(true);
    await new Promise((r) => setTimeout(r, 350));

    try {
      if (ask === "emergency") {
        if (/continue|book|yes/i.test(text)) await proceed(slots);
        else say("Please get urgent care now. You can come back to book an OPD visit later.", ["I understand, continue booking"]);
        return;
      }
      if (ask === "confirm" || ask === "done") {
        say(ask === "done" ? "Your appointment is booked. Use Track My Status to follow your turn." : "Please use the Confirm or Start over buttons above.");
        return;
      }

      const s: Slots = { ...slots };
      // Understand anything the patient said, whatever we asked.
      const date = parseDate(text);
      if (date) {
        if (date !== s.date) s.doctor = undefined;
        s.date = date;
      }
      const spec = parseSpecialty(text);
      if (spec && ask !== "reason") { s.specialty = spec; s.doctor = undefined; }
      const tp = parseTimePreference(text);
      if (tp) s.timePref = tp;

      const known = s.date ? availabilityCache.current[s.date] || [] : [];
      const named = parseDoctor(text, known.length ? known : doctors.map((d) => ({ doctor_id: d.id, name: d.name })));
      if (named && ask !== "name" && ask !== "reason") {
        if (!s.date) {
          setSlots({ ...s, specialty: undefined });
          setAsk("date");
          return say(`Sure, ${named.name}. Which day would you like?`, ["Today", "Tomorrow", "Day after tomorrow"]);
        }
        const list = await loadAvailability(s.date);
        const doc = list?.find((d) => d.doctor_id === named.doctor_id);
        if (doc?.available) s.doctor = doc;
        else if (doc) say(`${doc.name} is ${UNAVAILABLE_REASON[doc.reason || ""] || "not available"} on ${formatDate(s.date)}.`);
      }

      if (ask === "specialty" && !spec) {
        const list = s.date ? availabilityCache.current[s.date] || [] : [];
        const byDept = list.filter((d) => d.department.toLowerCase() === text.toLowerCase());
        if (byDept.length) s.specialty = { keys: [text.toLowerCase()], label: text };
      }

      const phone = parsePhone(text);
      if (phone) s.phone = phone;
      if (ask === "name") {
        const n = parseName(text);
        if (!n) return say("Please type the patient’s name using letters only.");
        s.name = n;
      }
      if (ask === "phone" && !phone) return say("Please enter a valid 10-digit Indian mobile number.");
      if (ask === "age") {
        const a = parseAge(text);
        if (a === null) return say("Please enter the age as a number, for example 32.");
        s.age = a;
      }
      if (ask === "gender") {
        const g = parseGender(text);
        if (!g) return say("Please choose Male, Female or Other.", ["Male", "Female", "Other"]);
        s.gender = g;
      }
      if (ask === "reason") {
        s.reason = text;
        if (EMERGENCY_RE.test(text)) {
          setSlots(s);
          setAsk("emergency");
          return say(
            "⚠️ This may need urgent care. Please call 112 or go to the nearest emergency department now instead of waiting for an OPD appointment. I can’t assess symptoms.",
            ["I understand, continue booking"],
          );
        }
      }
      if (ask === "date" && !date && !named && !spec) {
        return say("Sorry, I didn’t catch the day. Try “tomorrow”, “Monday” or a date like 28 Sep.", ["Today", "Tomorrow", "Day after tomorrow"]);
      }

      setSlots(s);
      await proceed(s);
    } finally {
      setThinking(false);
    }
  };

  const pickDoctor = async (doc: AvailableDoctor) => {
    if (!doc.available || thinking || booking || ask === "confirm" || ask === "done") return;
    setMessages((m) => [...m, { id: uid(), from: "patient", text: doc.name }]);
    const s = { ...slots, doctor: doc };
    setSlots(s);
    setThinking(true);
    try { await proceed(s); } finally { setThinking(false); }
  };

  const confirm = async () => {
    const s = slots;
    if (!s.doctor || !s.date || !s.name || !s.phone || !hospital) return;
    setBooking(true);
    try {
      const appt = await createAppointment({
        hospitalId: hospital.id,
        doctorId: s.doctor.doctor_id, // checked server-side: must belong to this hospital and be bookable
        bookingMethod: "AI",
        patientName: s.name,
        patientPhone: s.phone,
        patientAge: s.age,
        patientGender: s.gender,
        appointmentDate: s.date,
        appointmentTime: s.doctor.first_time,
        intake: { fullName: s.name, age: s.age ?? 0, contactNumber: s.phone, email: "", primaryConcern: s.reason || "", symptoms: [] },
      });
      setAsk("done");
      onBooked({
        id: appt.id,
        hospital_id: appt.hospital_id,
        doctor_id: appt.doctor_id,
        doctor_name: appt.doctor_name,
        department_name: appt.department_name,
        hospital_name: appt.hospital_name || hospital.name,
        patient_id: appt.patient_id,
        patient_number: appt.patient_number,
        patient_name: appt.patient_name,
        patient_phone: appt.patient_phone,
        booking_method: "AI",
        token_number: appt.token_number,
        queue_number: appt.queue_number,
        tracking_token: appt.tracking_token,
        queue_position: appt.queue_position,
        patients_ahead: appt.patients_ahead,
        estimated_wait_mins: appt.estimated_wait_mins,
        appointment_date: appt.appointment_date,
        created_at: appt.created_at,
      });
    } catch (e) {
      say(`I couldn’t complete the booking: ${e instanceof Error ? e.message : "please try again."}`, ["Start over"]);
      setAsk("confirm");
    } finally {
      setBooking(false);
    }
  };

  const reset = () => {
    setSlots({});
    setAsk("date");
    availabilityCache.current = {};
    setMessages([{ id: uid(), from: "ai", text: "Let’s start again. Which day, and what kind of doctor would you like?", chips: ["Today", "Tomorrow", "Day after tomorrow"] }]);
  };

  const inputDisabled = thinking || booking || ask === "confirm" || ask === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full rounded-[32px] border border-white/80 bg-white/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-800">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-center">
          <p className="text-xs font-black text-[#1D1D1F]">MedTechFixaters AI</p>
          <p className="text-[10px] font-semibold text-slate-400">Built-in booking assistant · live availability</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-800" aria-label="Start over">
          <RotateCcw size={13} /> Restart
        </button>
      </div>

      <div className="flex h-[440px] flex-col overflow-y-auto pr-1 sm:h-[480px]" aria-live="polite">
        {messages.map((m) => {
          if (m.from === "ai") return <AIMessage key={m.id} text={m.text} quickChips={m.chips} onSelectChip={(c) => (c === "Start over" ? reset() : handleText(c))} />;
          if (m.from === "patient") return <PatientMessage key={m.id} text={m.text} />;
          if (m.from === "doctors") {
            return (
              <div key={m.id} className="my-2 grid gap-2 pl-10">
                {m.doctors.map((d) => (
                  <button
                    key={d.doctor_id}
                    onClick={() => pickDoctor(d)}
                    disabled={!d.available || ask !== "doctor"}
                    className={`rounded-2xl border p-3 text-left transition ${
                      d.available ? "border-[#007AFF]/20 bg-white hover:border-[#007AFF]/50 hover:shadow-md" : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-extrabold text-[#1D1D1F]"><Stethoscope size={15} className="text-[#007AFF]" /> {d.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {d.available ? `${d.remaining} tokens left` : UNAVAILABLE_REASON[d.reason || ""] || "Unavailable"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{d.department} · {d.specialization}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1"><Clock size={12} /> {d.hours}</span>
                      <span className="flex items-center gap-1"><IndianRupee size={12} /> {d.fee}</span>
                    </p>
                  </button>
                ))}
              </div>
            );
          }
          const s = m.slots;
          return (
            <div key={m.id} className="my-2 ml-10 rounded-2xl border border-[#007AFF]/20 bg-white p-4 text-xs shadow-sm">
              <p className="mb-2 text-sm font-black text-[#1D1D1F]">Confirm appointment</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-bold text-slate-400">Patient</dt><dd className="font-bold text-slate-800">{s.name} · {s.age} · {s.gender}</dd>
                <dt className="font-bold text-slate-400">Mobile</dt><dd className="font-bold text-slate-800">{s.phone}</dd>
                <dt className="font-bold text-slate-400">Doctor</dt><dd className="font-bold text-slate-800">{s.doctor?.name}</dd>
                <dt className="font-bold text-slate-400">Department</dt><dd className="font-bold text-slate-800">{s.doctor?.department}</dd>
                <dt className="font-bold text-slate-400">Date</dt><dd className="flex items-center gap-1 font-bold text-slate-800"><CalendarDays size={12} /> {s.date && formatDate(s.date)}</dd>
                <dt className="font-bold text-slate-400">OPD hours</dt><dd className="font-bold text-slate-800">{s.doctor?.hours}</dd>
                <dt className="font-bold text-slate-400">Fee</dt><dd className="font-bold text-slate-800">₹{s.doctor?.fee}</dd>
                <dt className="font-bold text-slate-400">Reason</dt><dd className="font-semibold text-slate-700">{s.reason}</dd>
              </dl>
              <p className="mt-2 text-[10px] text-slate-400">Your token and queue number are given when you confirm.</p>
              {ask === "confirm" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={reset} disabled={booking} className="rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 hover:bg-slate-200">Start over</button>
                  <button onClick={confirm} disabled={booking} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] py-2.5 font-bold text-white shadow-md shadow-blue-500/25 hover:bg-[#0062D6]">
                    {booking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {booking ? "Booking…" : "Confirm booking"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {thinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleText(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1.5 focus-within:border-[#007AFF]/50"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={inputDisabled}
          maxLength={500}
          placeholder={ask === "confirm" ? "Use the buttons above to confirm" : "Type your message…"}
          aria-label="Your message"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
        />
        <button type="submit" disabled={inputDisabled || !input.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007AFF] text-white disabled:opacity-40">
          <Send size={16} />
        </button>
      </form>
      <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400">
        <ShieldCheck size={11} /> Books only real, available slots. It does not give medical advice. In an emergency call 112.
      </p>
    </motion.div>
  );
};
