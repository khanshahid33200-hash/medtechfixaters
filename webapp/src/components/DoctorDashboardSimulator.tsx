import { useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Layers, Calendar, CheckCircle, Activity, Pill, QrCode, CalendarClock, Bell, Settings,
  Building2, ChevronLeft, ChevronRight, ChevronDown, LogOut, Users, Clock, DollarSign, Stethoscope,
  Copy, Plus, Search, Eye, CalendarDays, ShieldCheck, Printer, ExternalLink, Download, Phone,
  Library, UploadCloud, Sparkles, FlaskConical, History, Pencil, Power, CheckCircle2,
} from "lucide-react";

// Marketing demo of the doctor workspace. It mirrors the real screens (DoctorDashboardLayout +
// pages/Dashboard.tsx + pages/MedicinesPage.tsx): same menu, same cards, same styling.
// Everything here is sample data held in local state. Nothing is saved or sent anywhere.
// If the real doctor dashboard changes, update this file to match.

type NavKey =
  | "dashboard" | "queue" | "appointments" | "follow-ups" | "history"
  | "medicines" | "qr" | "availability" | "notifications" | "settings";

const NAV: { key: NavKey; name: string; title: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", name: "Dashboard", title: "Dashboard", icon: LayoutDashboard },
  { key: "queue", name: "Live Queue", title: "Live Queue", icon: Layers },
  { key: "appointments", name: "All Appointments", title: "All Appointments", icon: Calendar },
  { key: "follow-ups", name: "Follow-Up", title: "Follow-Up CRM", icon: CheckCircle },
  { key: "history", name: "History", title: "Patient History", icon: Activity },
  { key: "medicines", name: "Medicines", title: "Medicines", icon: Pill },
  { key: "qr", name: "QR", title: "Hospital QR", icon: QrCode },
  { key: "availability", name: "Availability", title: "Availability", icon: CalendarClock },
  { key: "notifications", name: "Notifications", title: "Notifications", icon: Bell },
  { key: "settings", name: "Settings", title: "Settings", icon: Settings },
];

type QueueStatus = "Now Consulting" | "Next" | "Waiting" | "Completed";
interface QueuePatient {
  id: number; token: number; name: string; patientNo: string; age: number; gender: string; phone: string;
  complaint: string; bp: string; pulse: string; temp: string; spo2: string; allergies: string; lastVisit: string;
  status: QueueStatus; wait: string; fee: number;
}

const HOSPITAL = "City Care Hospital";
const DOCTOR = { name: "Dr. Amit Sharma", dept: "Cardiology", code: "DOC-204", timings: "10:00 AM – 2:00 PM", room: "204" };
const BOOKING_URL = "https://medtechfixaters.com/book/citycare-7K2Q";
const QR_TOKEN = "CITYCARE-7K2Q";

const INITIAL_QUEUE: QueuePatient[] = [
  { id: 1, token: 12, name: "Ravi Kumar", patientNo: "P-1042", age: 32, gender: "Male", phone: "+91 98765 43210", complaint: "Chest pain and mild fatigue", bp: "120/80", pulse: "78", temp: "98.4", spo2: "98%", allergies: "Penicillin", lastVisit: "10 May", status: "Now Consulting", wait: "—", fee: 800 },
  { id: 2, token: 13, name: "Neha Singh", patientNo: "P-1043", age: 28, gender: "Female", phone: "+91 98123 45678", complaint: "Palpitations after meals", bp: "116/74", pulse: "84", temp: "98.6", spo2: "99%", allergies: "None", lastVisit: "First visit", status: "Next", wait: "5 min", fee: 1000 },
  { id: 3, token: 14, name: "Mohd. Ali", patientNo: "P-0977", age: 45, gender: "Male", phone: "+91 97654 32109", complaint: "BP check & medicine refill", bp: "135/88", pulse: "72", temp: "98.2", spo2: "97%", allergies: "Sulfa drugs", lastVisit: "28 Apr", status: "Waiting", wait: "18 min", fee: 600 },
  { id: 4, token: 15, name: "Sunita Devi", patientNo: "P-0851", age: 54, gender: "Female", phone: "+91 99887 76655", complaint: "Breathlessness on stairs", bp: "142/90", pulse: "88", temp: "98.8", spo2: "95%", allergies: "Dust", lastVisit: "15 Mar", status: "Waiting", wait: "28 min", fee: 1000 },
  { id: 5, token: 16, name: "Vikas Patel", patientNo: "P-0733", age: 50, gender: "Male", phone: "+91 94567 89012", complaint: "6-month post-angioplasty review", bp: "124/80", pulse: "68", temp: "98.4", spo2: "99%", allergies: "None", lastVisit: "10 Feb", status: "Waiting", wait: "35 min", fee: 800 },
  { id: 6, token: 9, name: "Kavita Sharma", patientNo: "P-1011", age: 38, gender: "Female", phone: "+91 90123 44556", complaint: "Follow-up, ECG review", bp: "118/76", pulse: "74", temp: "98.3", spo2: "99%", allergies: "None", lastVisit: "Today", status: "Completed", wait: "—", fee: 800 },
  { id: 7, token: 10, name: "Deepak Verma", patientNo: "P-0990", age: 61, gender: "Male", phone: "+91 93456 78123", complaint: "Echo report review", bp: "130/84", pulse: "70", temp: "98.5", spo2: "97%", allergies: "Aspirin", lastVisit: "Today", status: "Completed", wait: "—", fee: 1200 },
];

const APPOINTMENTS = [
  { id: 1, queue: "A-017", name: "Ananya Roy", phone: "+91 98321 65498", dept: "Cardiology", method: "AI Booking", status: "Waiting" },
  { id: 2, queue: "A-018", name: "Harish Chandra", phone: "+91 91234 56780", dept: "Cardiology", method: "Manual Booking", status: "Waiting" },
  { id: 3, queue: "A-019", name: "Pooja Nair", phone: "+91 99001 22334", dept: "Cardiology", method: "AI Booking", status: "Waiting" },
  { id: 4, queue: "A-012", name: "Ravi Kumar", phone: "+91 98765 43210", dept: "Cardiology", method: "Manual Booking", status: "In Consultation" },
  { id: 5, queue: "A-010", name: "Deepak Verma", phone: "+91 93456 78123", dept: "Cardiology", method: "AI Booking", status: "Completed" },
  { id: 6, queue: "A-008", name: "Rohit Mehra", phone: "+91 98111 22233", dept: "Cardiology", method: "Manual Booking", status: "Cancelled" },
];

type FollowBucket = "dueToday" | "upcoming" | "overdue" | "completed";
const INITIAL_FOLLOW_UPS: { id: number; token: string; name: string; phone: string; reason: string; date: string; bucket: FollowBucket }[] = [
  { id: 1, token: "F-021", name: "Mohd. Ali", phone: "+91 97654 32109", reason: "BP review after dose change", date: "Today", bucket: "dueToday" },
  { id: 2, token: "F-022", name: "Sunita Devi", phone: "+91 99887 76655", reason: "Check ankle swelling", date: "Today", bucket: "dueToday" },
  { id: 3, token: "F-023", name: "Vikas Patel", phone: "+91 94567 89012", reason: "Lipid profile results", date: "In 4 days", bucket: "upcoming" },
  { id: 4, token: "F-024", name: "Neha Singh", phone: "+91 98123 45678", reason: "Holter monitor review", date: "In 9 days", bucket: "upcoming" },
  { id: 5, token: "F-018", name: "Rohit Mehra", phone: "+91 98111 22233", reason: "ECG repeat", date: "3 days ago", bucket: "overdue" },
  { id: 6, token: "F-015", name: "Kavita Sharma", phone: "+91 90123 44556", reason: "Medicine tolerance check", date: "Last week", bucket: "completed" },
  { id: 7, token: "F-014", name: "Deepak Verma", phone: "+91 93456 78123", reason: "Post-echo review", date: "Last week", bucket: "completed" },
];

const MEDICINES = [
  { name: "Telmisartan 40 mg", generic: "Telmisartan", category: "Antihypertensive", indications: "Hypertension", active: true },
  { name: "Atorvastatin 20 mg", generic: "Atorvastatin", category: "Statin", indications: "Dyslipidemia", active: true },
  { name: "Ecosprin 75 mg", generic: "Aspirin", category: "Antiplatelet", indications: "Secondary prevention", active: true },
  { name: "Metoprolol 25 mg", generic: "Metoprolol", category: "Beta blocker", indications: "Palpitations, hypertension", active: true },
  { name: "Pantoprazole 40 mg", generic: "Pantoprazole", category: "PPI", indications: "Acidity", active: false },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: "OPD timing change on Saturday", message: "OPD closes at 1 PM this Saturday for building maintenance.", priority: "high", source: "hospital admin", when: "Today, 9:10 AM", read: false },
  { id: 2, title: "New medicine import format", message: "You can now import your medicine list from Excel as well as CSV.", priority: "normal", source: "platform", when: "Yesterday, 6:40 PM", read: false },
  { id: 3, title: "Monthly OPD report ready", message: "Your OPD summary for last month is available in reports.", priority: "normal", source: "hospital admin", when: "2 days ago", read: true },
];

const card = "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm";
const pageCard = "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm";

export default function DoctorDashboardSimulator() {
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_QUEUE);
  const [followUps, setFollowUps] = useState(INITIAL_FOLLOW_UPS);
  const [notice, setNotice] = useState<string | null>(null);

  const show = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((m) => (m === msg ? null : m)), 3200);
  };

  const go = (key: NavKey) => setNav(key);
  const current = queue.find((q) => q.status === "Now Consulting");
  const next = queue.find((q) => q.status === "Next");

  // Mirrors the real flow: finishing a consultation calls the next patient in line.
  const callNext = () => {
    setQueue((list) => {
      const updated = list.map((q) => ({ ...q }));
      const cur = updated.find((q) => q.status === "Now Consulting");
      if (cur) cur.status = "Completed";
      const nxt = updated.find((q) => q.status === "Next");
      if (nxt) { nxt.status = "Now Consulting"; nxt.wait = "—"; }
      const waiting = updated.find((q) => q.status === "Waiting");
      if (waiting) waiting.status = "Next";
      return updated;
    });
    show(next ? `Token #${next.token} ${next.name} called in` : "Queue is clear");
  };

  const addWalkIn = () => {
    setQueue((list) => {
      const token = Math.max(...list.map((q) => q.token)) + 1;
      return [...list, { id: Date.now(), token, name: "Walk-in Patient", patientNo: `P-${1100 + token}`, age: 40, gender: "Male", phone: "+91 90000 00000", complaint: "Walk-in consultation", bp: "—", pulse: "—", temp: "—", spo2: "—", allergies: "None", lastVisit: "First visit", status: "Waiting", wait: "40 min", fee: 800 }];
    });
    show("Walk-in added to the live queue");
  };

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const dayLabel = now.toLocaleDateString("en-IN", { weekday: "long" });
  const title = NAV.find((n) => n.key === nav)?.title ?? "Dashboard";

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] border border-slate-200 bg-[#F7F8FC] text-left font-sans text-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[460px] w-[460px] rounded-full bg-blue-300/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-orange-200/25 blur-[120px]" />
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-4 top-20 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"
            role="status"
          >
            <CheckCircle2 size={15} className="text-emerald-400" /> {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex h-[860px]">
        {/* ─── SIDEBAR (same as DoctorDashboardLayout) ─── */}
        <aside
          className={`hidden lg:flex shrink-0 flex-col border-r border-white/70 transition-all duration-300 ${collapsed ? "w-[76px]" : "w-[264px]"}`}
          style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(30px) saturate(150%)" }}
        >
          <div className={`border-b border-white/60 pb-4 pt-5 ${collapsed ? "px-2" : "px-5"}`}>
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/70 shadow-sm">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold leading-tight text-slate-900">{HOSPITAL}</p>
                    <p className="truncate text-[10.5px] font-medium text-slate-500">Doctor Workspace</p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button onClick={() => setCollapsed(true)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-700" aria-label="Collapse sidebar">
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
            {!collapsed && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <span>Powered by</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <img src="/assets/brand-icon.png" alt="" className="h-3.5 w-3.5 object-contain" /> MedTech Fixaters
                </span>
              </div>
            )}
          </div>

          <nav className={`flex-1 space-y-1 overflow-y-auto py-3 [scrollbar-width:none] ${collapsed ? "px-2" : "px-3"}`}>
            {NAV.map((item) => {
              const active = nav === item.key;
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => go(item.key)} title={collapsed ? item.name : undefined} className="group relative block w-full text-left">
                  <div className={`relative flex items-center rounded-2xl text-[12.5px] font-semibold transition-colors ${collapsed ? "justify-center py-2.5" : "px-3.5 py-2.5"} ${active ? "text-blue-700" : "text-slate-500 hover:text-slate-800"}`}>
                    {active && (
                      <motion.span
                        layoutId="sim-doctor-nav-active"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-2xl border border-blue-400/30 bg-blue-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_16px_rgba(59,130,246,0.12)]"
                      />
                    )}
                    {!active && <span className="absolute inset-0 rounded-2xl bg-white/0 transition-colors group-hover:bg-white/60" />}
                    <span className={`relative flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                      <Icon size={17} className={active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
                      {!collapsed && <span>{item.name}</span>}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-white/60 p-2.5">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`flex w-full items-center rounded-xl text-[11px] font-bold text-slate-500 hover:bg-white/70 hover:text-slate-800 ${collapsed ? "justify-center py-2" : "justify-between px-3 py-2"}`}
            >
              <span className="flex items-center gap-2">
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {!collapsed && <span>Collapse Sidebar</span>}
              </span>
              {!collapsed && <span className="font-mono text-[10px] text-slate-400">⌘B</span>}
            </button>
            <button
              onClick={() => show("Sign out is disabled in the demo")}
              className={`flex w-full items-center rounded-2xl text-[12px] font-semibold text-rose-600 hover:bg-rose-50/70 ${collapsed ? "justify-center py-2.5" : "gap-2.5 px-3.5 py-2.5"}`}
            >
              <LogOut size={16} /> {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* ─── MAIN ─── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/60 px-4 sm:px-8"
            style={{ background: "rgba(247,248,252,0.72)", backdropFilter: "blur(22px) saturate(160%)" }}
          >
            <div className="flex items-center gap-3">
              <button onClick={() => setCollapsed((c) => !c)} className="hidden rounded-xl p-2 text-slate-500 hover:bg-white/80 hover:text-slate-800 lg:flex" aria-label="Toggle sidebar">
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{title}</h3>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <span className="hidden items-center gap-2 rounded-2xl border border-white/80 px-3.5 py-2 text-[11.5px] font-semibold text-slate-700 shadow-[0_6px_20px_rgba(30,60,120,0.06)] md:inline-flex" style={{ background: "rgba(255,255,255,0.55)" }}>
                {dateLabel} · {dayLabel}
              </span>
              <button
                onClick={() => show("Profile menu: status, my profile, settings, change password")}
                className="flex items-center gap-2.5 rounded-full border border-white/80 py-1.5 pl-1.5 pr-2.5 shadow-[0_6px_20px_rgba(30,60,120,0.06)]"
                style={{ background: "rgba(255,255,255,0.55)" }}
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-orange-400 text-[11px] font-bold text-white">
                  D
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="hidden text-left sm:block">
                  <span className="block text-[11.5px] font-bold leading-tight text-slate-800">{DOCTOR.name}</span>
                  <span className="mt-0.5 block text-[10px] font-semibold leading-none text-blue-600">{DOCTOR.dept} · {DOCTOR.code}</span>
                </div>
                <ChevronDown size={13} className="text-slate-400" />
              </button>
            </div>
          </header>

          {/* Phones and tablets: the real app uses a drawer; here the menu scrolls sideways. */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/60 px-3 py-2 lg:hidden [scrollbar-width:none]">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = nav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-[11.5px] font-semibold ${active ? "border border-blue-400/30 bg-blue-500/10 text-blue-700" : "text-slate-500"}`}
                >
                  <Icon size={14} /> {item.name}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            <motion.main
              key={nav}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6"
            >
              {nav === "dashboard" && (
                <DashboardView queue={queue} current={current} next={next} followUps={followUps} go={go} show={show} callNext={callNext} addWalkIn={addWalkIn} setFollowUps={setFollowUps} />
              )}
              {nav === "queue" && <QueueView queue={queue} addWalkIn={addWalkIn} show={show} />}
              {nav === "appointments" && <AppointmentsView show={show} />}
              {nav === "follow-ups" && <FollowUpsView followUps={followUps} setFollowUps={setFollowUps} show={show} />}
              {nav === "history" && <HistoryView queue={queue} show={show} />}
              {nav === "medicines" && <MedicinesView show={show} />}
              {nav === "qr" && <QrView show={show} />}
              {nav === "availability" && <AvailabilityView show={show} />}
              {nav === "notifications" && <NotificationsView />}
              {nav === "settings" && <SettingsView show={show} />}
            </motion.main>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: QueueStatus }) {
  const tone =
    status === "Now Consulting" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "Next" ? "bg-indigo-50 text-indigo-700 border-indigo-200"
    : status === "Completed" ? "bg-slate-100 text-slate-600 border-slate-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${tone}`}>{status}</span>;
}

function PageHeader({ icon, title, sub, action }: { icon: ReactNode; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className={`${pageCard} flex flex-col justify-between gap-4 md:flex-row md:items-center`}>
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">{icon} {title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
      </div>
      {action}
    </div>
  );
}

// A QR-looking pattern drawn locally, so the demo makes no external requests.
function FakeQr({ size = 80 }: { size?: number }) {
  const cells = useMemo(() => {
    const n = 21;
    const out: boolean[] = [];
    let seed = 7;
    for (let i = 0; i < n * n; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      out.push(seed / 233280 > 0.52);
    }
    return out;
  }, []);
  const n = 21;
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} className="shrink-0 rounded-lg border border-slate-100 bg-white p-1" aria-hidden shapeRendering="crispEdges">
      {cells.map((on, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        if (finder(x, y)) return null;
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#0f172a" /> : null;
      })}
      {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="#0f172a" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}

type Show = (m: string) => void;

// ─── DASHBOARD ───────────────────────────────────────────────────────────

function DashboardView({
  queue, current, next, followUps, go, show, callNext, addWalkIn, setFollowUps,
}: {
  queue: QueuePatient[]; current?: QueuePatient; next?: QueuePatient; followUps: typeof INITIAL_FOLLOW_UPS;
  go: (k: NavKey) => void; show: Show; callNext: () => void; addWalkIn: () => void;
  setFollowUps: (f: typeof INITIAL_FOLLOW_UPS) => void;
}) {
  const [cardTab, setCardTab] = useState<"Details" | "History" | "Prescriptions" | "Reports">("Details");
  const active = queue.filter((q) => q.status !== "Completed");
  const completed = queue.filter((q) => q.status === "Completed");
  const waiting = queue.filter((q) => q.status === "Waiting" || q.status === "Next");
  const revenue = completed.reduce((s, q) => s + q.fee, 0);
  const bucket = (b: FollowBucket) => followUps.filter((f) => f.bucket === b);

  const kpis = [
    { title: "Total Patients", value: queue.length, sub: "Today", change: "↑ 12.5% vs yesterday", tone: "text-emerald-600", icon: <Users size={20} className="text-indigo-600" />, bg: "bg-indigo-50" },
    { title: "Completed", value: completed.length, sub: "Today", change: "↑ 8.0% vs yesterday", tone: "text-emerald-600", icon: <Clock size={20} className="text-blue-600" />, bg: "bg-blue-50" },
    { title: "Waiting Now", value: waiting.length, sub: "In your live queue", change: "↓ 4.2% vs yesterday", tone: "text-rose-600", icon: <Activity size={20} className="text-amber-600" />, bg: "bg-amber-50" },
    { title: "Follow-Ups Due", value: bucket("dueToday").length, sub: `${bucket("upcoming").length} upcoming · ${bucket("overdue").length} overdue`, change: bucket("overdue").length ? `${bucket("overdue").length} Overdue Attention Needed` : "On Schedule", tone: bucket("overdue").length ? "text-amber-600" : "text-emerald-600", icon: <CheckCircle size={20} className="text-purple-600" />, bg: "bg-purple-50", onClick: () => go("follow-ups") },
    { title: "Revenue", value: `₹${revenue.toLocaleString("en-IN")}`, sub: "From completed visits", change: "↑ 6.3% vs yesterday", tone: "text-emerald-600", icon: <DollarSign size={20} className="text-emerald-600" />, bg: "bg-emerald-50" },
  ];

  const quick = [
    { label: "New Consultation", icon: "+", bg: "bg-indigo-50 text-indigo-600" },
    { label: "Prescription", icon: "Rx", bg: "bg-emerald-50 text-emerald-600" },
    { label: "Medical Certificate", icon: "🛡️", bg: "bg-blue-50 text-blue-600" },
    { label: "Lab Test Advice", icon: "🧪", bg: "bg-amber-50 text-amber-600" },
    { label: "Follow Up", icon: "📅", bg: "bg-rose-50 text-rose-600" },
    { label: "Patient Notes", icon: "📝", bg: "bg-orange-50 text-orange-600" },
    { label: "Upload Report", icon: "⬆️", bg: "bg-violet-50 text-violet-600" },
    { label: "Templates", icon: "📄", bg: "bg-sky-50 text-sky-600" },
  ];

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.title} onClick={k.onClick} className={`${card} flex items-center justify-between ${k.onClick ? "cursor-pointer transition hover:border-purple-300 hover:shadow-md" : ""}`}>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k.title}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">{k.value}</span>
                <span className="text-xs font-semibold text-slate-400">{k.sub}</span>
              </div>
              <span className={`block text-[10px] font-bold ${k.tone}`}>{k.change}</span>
            </div>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${k.bg}`}>{k.icon}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Today's Queue */}
            <div className={`${card} flex flex-col justify-between space-y-3 md:col-span-7`}>
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">Today's Queue</h3>
                    <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" /> Live
                    </span>
                  </div>
                  <button onClick={() => go("queue")} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Full Queue →</button>
                </div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-2 font-bold">#</th><th className="pb-2 font-bold">Token</th><th className="pb-2 font-bold">Patient Name</th>
                        <th className="pb-2 font-bold">Age / Gender</th><th className="pb-2 font-bold">Status</th><th className="pb-2 text-right font-bold">Wait Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {active.map((q, i) => (
                        <tr key={q.id} className="transition-colors hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-400">{i + 1}</td>
                          <td className="py-2.5 font-black text-indigo-600">A-{String(q.token).padStart(3, "0")}</td>
                          <td className="py-2.5">
                            <span className="block font-extrabold text-slate-800">{q.name}</span>
                            <span className="block text-[10px] font-medium text-slate-400">ID: {q.patientNo}</span>
                          </td>
                          <td className="py-2.5 text-slate-500">{q.age} / {q.gender}</td>
                          <td className="py-2.5"><StatusPill status={q.status} /></td>
                          <td className="py-2.5 text-right font-semibold text-slate-400">{q.wait}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><Users size={14} className="text-indigo-600" /> Total Waiting: {waiting.length} Patients</span>
                <button onClick={addWalkIn} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700">+ Add Walk-In</button>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className={`${card} space-y-3 md:col-span-5`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900">Upcoming Appointments</h3>
                <button onClick={() => go("appointments")} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All →</button>
              </div>
              <div className="mt-3 space-y-2">
                {APPOINTMENTS.filter((a) => a.status === "Waiting").map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl p-2 text-xs transition hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-black text-indigo-600">{a.queue}</span>
                      <div>
                        <span className="block font-extrabold leading-tight text-slate-800">{a.name}</span>
                        <span className="text-[10px] font-medium text-slate-400">{a.dept}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      <span>{a.status}</span><ChevronRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Quick Actions */}
            <div className={`${card} space-y-3 md:col-span-7`}>
              <h3 className="text-sm font-black text-slate-900">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-3 pt-1">
                {quick.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => show(`${a.label} opens here in the real app`)}
                    className="group flex flex-col items-center justify-center space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:bg-slate-100"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black transition-transform group-hover:scale-110 ${a.bg}`}>{a.icon}</div>
                    <span className="text-[10px] font-bold leading-tight text-slate-700">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Today's Summary */}
            <div className={`${card} space-y-3 md:col-span-5`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900">Today's Summary</h3>
                <button onClick={() => show("Reports open here in the real app")} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Reports →</button>
              </div>
              <div className="grid grid-cols-2 items-center gap-4 pt-2">
                <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#10B981" strokeWidth="4" strokeDasharray="57 43" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#F59E0B" strokeWidth="4" strokeDasharray="32 68" strokeDashoffset="-57" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#EF4444" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-89" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-slate-900">{queue.length}</span>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Total</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs font-bold">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span><span>{completed.length}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-700"><span className="h-2 w-2 rounded-full bg-amber-500" /> Waiting</span><span>{waiting.length}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-700"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Revenue</span><span className="font-extrabold text-indigo-600">₹{revenue.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-Up CRM summary */}
          <div className={`${card} space-y-4`}>
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><CheckCircle size={18} /></div>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <span>Follow-Up CRM & Patient Recall</span>
                    {bucket("dueToday").length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">{bucket("dueToday").length} Due Today</span>}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">Automated patient retention, recall tokens, and follow-up compliance.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => show("Schedule a follow-up opens here in the real app")} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">+ Schedule Follow-Up</button>
                <button onClick={() => go("follow-ups")} className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700">Open CRM Console <ChevronRight size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Full class names spelled out so Tailwind keeps them. */}
              {([
                { key: "dueToday", label: "Due Today", sub: "Awaiting consult", box: "bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70", t1: "text-amber-700", t2: "text-amber-900", t3: "text-amber-600" },
                { key: "upcoming", label: "Upcoming", sub: "Scheduled future", box: "bg-indigo-50/70 border-indigo-200/80 hover:bg-indigo-100/70", t1: "text-indigo-700", t2: "text-indigo-900", t3: "text-indigo-600" },
                { key: "overdue", label: "Overdue", sub: "Missed recall", box: "bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70", t1: "text-rose-700", t2: "text-rose-900", t3: "text-rose-600" },
                { key: "completed", label: "Completed", sub: `${Math.round((bucket("completed").length / Math.max(followUps.length, 1)) * 100)}% recall rate`, box: "bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70", t1: "text-emerald-700", t2: "text-emerald-900", t3: "text-emerald-600" },
              ] as const).map((b) => (
                <button key={b.key} onClick={() => go("follow-ups")} className={`rounded-xl border p-3 text-left transition ${b.box}`}>
                  <span className={`block text-[10px] font-bold uppercase tracking-wider ${b.t1}`}>{b.label}</span>
                  <span className={`text-xl font-black ${b.t2}`}>{bucket(b.key).length}</span>
                  <span className={`block text-[10px] font-medium ${b.t3}`}>{b.sub}</span>
                </button>
              ))}
            </div>
            {bucket("dueToday").length > 0 ? (
              <div className="space-y-2 pt-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Patients Due For Follow-Up Today</span>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                  {bucket("dueToday").map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 bg-slate-50/50 p-3 text-xs transition hover:bg-slate-50">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 font-mono text-[11px] font-black text-purple-700">{f.token}</span>
                        <div className="min-w-0">
                          <span className="block truncate font-extrabold text-slate-900">{f.name}</span>
                          <span className="block truncate text-[10px] text-slate-400">{f.phone} · {f.reason}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button onClick={() => show("Opens WhatsApp chat in the real app")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"><Phone size={11} /> WhatsApp</button>
                        <button
                          onClick={() => { setFollowUps(followUps.map((x) => (x.id === f.id ? { ...x, bucket: "completed" as const } : x))); show(`${f.token} marked done`); }}
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                        >
                          ✓ Mark Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="pt-1 text-[11px] font-medium italic text-slate-400">No follow-ups due today. All scheduled patient recalls are up to date!</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 xl:col-span-4">
          <div className="space-y-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-100">Current Queue</span>
            </div>
            <div className="space-y-4 p-5 pt-0">
              {current ? (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">Now Consulting</span>
                  <span className="block text-3xl font-black tracking-tight text-slate-900">A-{String(current.token).padStart(3, "0")}</span>
                  <span className="mt-0.5 block text-[11px] font-bold text-indigo-600">Patient ID: {current.patientNo}</span>
                  <h4 className="mt-1 text-base font-extrabold text-slate-800">{current.name}</h4>
                  <p className="text-xs font-semibold text-slate-500">{current.age} Yrs, {current.gender} • {current.complaint}</p>
                </div>
              ) : (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Now Consulting</span>
                  <p className="mt-1 text-xs font-semibold text-slate-400">No patient currently in consultation.</p>
                </div>
              )}
              <button onClick={() => show("Full patient record opens here in the real app")} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100">View Patient Details</button>
              <div className="border-t border-slate-100 pt-3">
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${next ? "text-indigo-600" : "text-slate-400"}`}>Next Patient</span>
                {next ? (
                  <>
                    <span className="block text-lg font-black text-slate-800">A-{String(next.token).padStart(3, "0")}</span>
                    <p className="text-xs font-extrabold text-slate-700">{next.name}</p>
                    <p className="text-[11px] font-medium text-slate-400">{next.age} Yrs, {next.gender} • {next.complaint}</p>
                  </>
                ) : (
                  <p className="text-xs font-medium text-slate-400">No one waiting.</p>
                )}
              </div>
            </div>
          </div>

          {current ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Current Patient</h4>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">Consultation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-200 text-sm font-black text-indigo-700 ring-2 ring-indigo-500/20">
                  {current.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-black leading-tight text-slate-900">{current.name}</h4>
                  <p className="text-xs text-slate-500">{current.age} Yrs, {current.gender}</p>
                  <span className="text-[10px] font-black text-indigo-600">A-{String(current.token).padStart(3, "0")}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 text-xs font-bold">
                {(["Details", "History", "Prescriptions", "Reports"] as const).map((t) => (
                  <button key={t} onClick={() => setCardTab(t)} className={`pb-2 transition ${cardTab === t ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400 hover:text-slate-700"}`}>{t}</button>
                ))}
              </div>
              {cardTab === "Details" ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Chief Complaint</span>
                    <p className="text-xs font-bold text-slate-800">{current.complaint}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[["BP", current.bp, "mmHg"], ["Pulse", current.pulse, "bpm"], ["Temp", current.temp, "°F"], ["SpO2", current.spo2, ""]].map(([l, v, u]) => (
                      <div key={l} className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <span className="block text-[9px] font-bold text-slate-400">{l}</span>
                        <span className="block text-xs font-black text-slate-900">{v}</span>
                        {u && <span className="block text-[8px] text-slate-400">{u}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-1 text-xs">
                    <div><span className="block text-[10px] font-bold text-slate-400">Allergies</span><span className="font-extrabold text-slate-800">{current.allergies}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400">Last Visit</span><span className="font-extrabold text-slate-800">{current.lastVisit}</span></div>
                  </div>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[11px] font-medium text-slate-400">
                  {cardTab === "History" ? "2 earlier visits · last: " + current.lastVisit : cardTab === "Prescriptions" ? "2 earlier prescriptions on file" : "No reports uploaded yet"}
                </p>
              )}
              <button onClick={callNext} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700">
                <Stethoscope size={16} /> Start Consultation
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-400">Current Patient</h4>
              <p className="text-xs text-slate-400">No patient currently in consultation.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${card} flex items-start gap-3.5`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Bell size={18} /></div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Follow-up Reminder</h4>
            <p className="mt-0.5 text-xs text-slate-600">You have {bucket("upcoming").length + bucket("dueToday").length} patient follow-ups scheduled for this week.</p>
            <button onClick={() => go("follow-ups")} className="mt-1.5 block text-[11px] font-bold text-indigo-600 hover:text-indigo-700">View Follow Ups →</button>
          </div>
        </div>
        <div className={`${card} flex items-start gap-3.5`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-black text-blue-600">“</div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Clinical OPD Best Practice</h4>
            <p className="mt-0.5 text-xs text-slate-600">Utilize 1-click clinical templates to accelerate routine consultations.</p>
            <button onClick={() => show("Templates open here in the real app")} className="mt-1.5 block text-[11px] font-bold text-indigo-600 hover:text-indigo-700">Browse Templates →</button>
          </div>
        </div>
        <div className={`${card} flex items-start gap-3.5`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Clock size={18} /></div>
          <div>
            <h4 className="text-xs font-black text-slate-900">OPD Session Timing</h4>
            <span className="mt-0.5 block text-base font-black text-slate-900">{DOCTOR.timings}</span>
            <span className="block text-[10px] font-semibold text-slate-400">Room: {DOCTOR.room}</span>
          </div>
        </div>
        <div className="space-y-3.5 rounded-3xl border border-indigo-700/40 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20 text-indigo-300"><QrCode size={18} /></div>
              <div>
                <h4 className="text-xs font-extrabold leading-tight text-white">Hospital Patient QR</h4>
                <span className="block max-w-[140px] truncate text-[10px] font-semibold text-indigo-300">{HOSPITAL}</span>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300">Live Kiosk</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
            <FakeQr size={72} />
            <div className="min-w-0 flex-1 space-y-1 text-slate-800">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Token Code</span>
              <span className="block truncate font-mono text-xs font-black text-indigo-600">{QR_TOKEN}</span>
              <p className="text-[10px] font-medium leading-tight text-slate-500">Patients scan this QR to book OPD slots & view queue.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold">
            <button onClick={() => show("Booking link copied")} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-2 hover:bg-white/20"><Copy size={13} /> Copy Link</button>
            <button onClick={() => go("qr")} className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 shadow-md shadow-indigo-600/30 hover:bg-indigo-500"><QrCode size={13} /> Full Poster →</button>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── LIVE QUEUE ──────────────────────────────────────────────────────────

function QueueView({ queue, addWalkIn, show }: { queue: QueuePatient[]; addWalkIn: () => void; show: Show }) {
  const [filter, setFilter] = useState<"all" | "consulting" | "waiting" | "completed">("all");
  const [search, setSearch] = useState("");
  const waiting = queue.filter((q) => q.status === "Waiting" || q.status === "Next");
  const completed = queue.filter((q) => q.status === "Completed");
  const rows = queue
    .filter((q) => filter === "all" || (filter === "consulting" && q.status === "Now Consulting") || (filter === "waiting" && (q.status === "Waiting" || q.status === "Next")) || (filter === "completed" && q.status === "Completed"))
    .filter((q) => !search || q.name.toLowerCase().includes(search.toLowerCase()) || String(q.token).includes(search));

  return (
    <section className="space-y-6">
      <div className={`${pageCard} space-y-4`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"><Calendar className="text-indigo-600" size={22} /> Today's Live Queue Manager</h2>
            <p className="mt-0.5 text-xs text-slate-500">Manage waiting tokens, voice audio calls, and patient status updates.</p>
          </div>
          <button onClick={addWalkIn} className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200"><Plus size={16} /> Add Walk-In</button>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {([
              ["all", `All Tokens (${queue.length})`],
              ["consulting", "Now Consulting (1)"],
              ["waiting", `Waiting (${waiting.length})`],
              ["completed", `Completed (${completed.length})`],
            ] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`whitespace-nowrap rounded-xl px-3 py-1.5 font-bold transition ${filter === k ? "border border-indigo-200 bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>{label}</button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient or token..." aria-label="Search queue" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Token</th><th className="px-4 py-3">Patient Name</th><th className="px-4 py-3">Age / Gender</th>
                <th className="px-4 py-3">Chief Complaint</th><th className="px-4 py-3">Vitals</th><th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((q) => (
                <tr key={q.id} onClick={() => show(`${q.name}'s record opens here in the real app`)} className="cursor-pointer transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-mono text-sm font-black text-indigo-600">#{q.token}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{q.name}<span className="block text-[10px] font-medium text-slate-400">{q.phone}</span></td>
                  <td className="px-4 py-3.5 text-slate-600">{q.age} Yrs • {q.gender}</td>
                  <td className="max-w-xs truncate px-4 py-3.5 font-medium text-slate-700">{q.complaint}</td>
                  <td className="px-4 py-3.5"><span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">BP: {q.bp} | HR: {q.pulse}</span></td>
                  <td className="px-4 py-3.5"><StatusPill status={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── ALL APPOINTMENTS ────────────────────────────────────────────────────

function AppointmentsView({ show }: { show: Show }) {
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const list = APPOINTMENTS.filter((a) => (!status || a.status === status) && (!method || a.method.startsWith(method)));
  const today = new Date().toISOString().split("T")[0];
  return (
    <section className="space-y-6">
      <div className={`${pageCard} space-y-4`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"><Clock className="text-indigo-600" size={22} /> All Appointments</h2>
            <p className="mt-0.5 text-xs text-slate-500">Filtered to your own patients only.</p>
          </div>
          <button onClick={() => show("Book appointment opens here in the real app")} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"><Plus size={16} /> Book Appointment</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" defaultValue={today} aria-label="Date" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            <option value="">All Statuses</option><option>Waiting</option><option>In Consultation</option><option>Completed</option><option>Cancelled</option>
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Booking type" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            <option value="">AI + Manual</option><option value="AI">AI Booking</option><option value="Manual">Manual Booking</option>
          </select>
          <span className="ml-auto text-[11px] font-bold text-slate-400">{list.length} appointment{list.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <div key={a.id} className={`${card} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-black text-indigo-700">{a.queue}</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{a.status}</span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">{a.name}</h4>
              <span className="text-xs font-medium text-slate-500">{a.phone}</span>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">{today} • {a.dept} • {a.method}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              {a.status === "Waiting" || a.status === "In Consultation" ? (
                <button onClick={() => show(`${a.name} checked in to the queue`)} className="rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100">Check-In to Queue</button>
              ) : (
                <span className="font-bold text-slate-300">{a.status}</span>
              )}
              {a.status !== "Completed" && a.status !== "Cancelled" && (
                <button onClick={() => show("Reschedule opens here in the real app")} className="font-bold text-slate-400 hover:text-slate-700">Reschedule</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── FOLLOW-UP CRM ───────────────────────────────────────────────────────

function FollowUpsView({ followUps, setFollowUps, show }: { followUps: typeof INITIAL_FOLLOW_UPS; setFollowUps: (f: typeof INITIAL_FOLLOW_UPS) => void; show: Show }) {
  const [tab, setTab] = useState<FollowBucket>("dueToday");
  const rows = followUps.filter((f) => f.bucket === tab);
  const count = (b: FollowBucket) => followUps.filter((f) => f.bucket === b).length;
  return (
    <section className="space-y-6">
      <div className={`${pageCard} space-y-2`}>
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"><CheckCircle className="text-indigo-600" size={22} /> Follow-Up CRM</h2>
        <p className="text-xs text-slate-500">Each follow-up has its own F-### token, separate from today's regular queue.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          ["dueToday", "Due Today", "text-amber-600 bg-amber-50 border-amber-200"],
          ["upcoming", "Upcoming", "text-indigo-600 bg-indigo-50 border-indigo-200"],
          ["overdue", "Overdue", "text-rose-600 bg-rose-50 border-rose-200"],
          ["completed", "Completed", "text-emerald-600 bg-emerald-50 border-emerald-200"],
        ] as const).map(([k, label, tone]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-2xl border p-4 text-left transition ${tone} ${tab === k ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}>
            <span className="block text-2xl font-black">{count(k)}</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Patient</th><th className="px-4 py-3">Token</th><th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Follow-Up Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No follow-ups in this bucket.</td></tr>
              ) : rows.map((f) => (
                <tr key={f.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3.5"><span className="block font-bold text-slate-900">{f.name}</span><span className="text-[10px] text-slate-400">{f.phone}</span></td>
                  <td className="px-4 py-3.5 font-mono font-black text-indigo-600">{f.token}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{f.reason}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{f.date}</td>
                  <td className="px-4 py-3.5"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{f.bucket === "completed" ? "completed" : "scheduled"}</span></td>
                  <td className="space-x-1.5 px-4 py-3.5 text-right">
                    {f.bucket !== "completed" && (
                      <>
                        <button onClick={() => { setFollowUps(followUps.map((x) => (x.id === f.id ? { ...x, bucket: "completed" as const } : x))); show(`${f.token} completed`); }} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100">Complete</button>
                        <button onClick={() => { setFollowUps(followUps.filter((x) => x.id !== f.id)); show(`${f.token} cancelled`); }} className="rounded-lg bg-rose-50 px-2.5 py-1.5 font-bold text-rose-600 hover:bg-rose-100">Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── HISTORY (patient directory) ─────────────────────────────────────────

function HistoryView({ queue, show }: { queue: QueuePatient[]; show: Show }) {
  const [search, setSearch] = useState("");
  const rows = queue.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));
  return (
    <section className="space-y-6">
      <PageHeader
        icon={<Users className="text-indigo-600" size={22} />}
        title="Patient Medical Directory"
        sub="Search and view comprehensive patient clinical records."
        action={
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient name or phone..." aria-label="Search patients" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium focus:border-indigo-500 focus:outline-none" />
          </div>
        }
      />
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Patient Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Age / Gender</th>
                <th className="px-4 py-3">Known Allergies</th><th className="px-4 py-3">Last Visit</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{p.name}<span className="block text-[10px] font-semibold text-indigo-600">Token #{p.token}</span></td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{p.phone}</td>
                  <td className="px-4 py-3.5 text-slate-600">{p.age} Yrs • {p.gender}</td>
                  <td className="px-4 py-3.5"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${p.allergies === "None" ? "bg-slate-100 text-slate-600" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>{p.allergies}</span></td>
                  <td className="px-4 py-3.5 font-medium text-slate-500">{p.lastVisit}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => show(`${p.name}'s full history opens here in the real app`)} className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100"><Eye size={13} /> View Record</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── MEDICINES ───────────────────────────────────────────────────────────

function MedicinesView({ show }: { show: Show }) {
  const tabs = [
    { id: "library", label: "Medicine Library", icon: Library },
    { id: "import", label: "Import CSV / Excel", icon: UploadCloud },
    { id: "rules", label: "Suggestion Rules", icon: Sparkles },
    { id: "tests", label: "Tests", icon: FlaskConical },
    { id: "history", label: "Import History", icon: History },
  ];
  const [tab, setTab] = useState("library");
  const [meds, setMeds] = useState(MEDICINES);
  const [search, setSearch] = useState("");
  const rows = meds.filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.generic.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25"><Pill size={22} /></span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Medicines</h2>
            <p className="text-xs text-slate-500">Manage your clinic's medicine library and prescribing suggestions.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => show("Add medicine form opens here in the real app")} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={15} /> Add Medicine</button>
          <button onClick={() => setTab("import")} className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-black text-orange-700 hover:bg-orange-50"><UploadCloud size={15} /> Import CSV / Excel</button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/70 p-1 backdrop-blur" aria-label="Medicines sections">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${tab === t.id ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "library" ? (
        <>
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines..." aria-label="Search medicines" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medicine</th><th className="hidden px-4 py-3 md:table-cell">Category</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Indications</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><span className="block font-bold text-slate-900">{m.name}</span><span className="text-[10px] text-slate-400">{m.generic}</span></td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{m.category}</td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{m.indications}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{m.active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => show(`Edit ${m.name} opens here in the real app`)} className="rounded-xl p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${m.name}`}><Pencil size={15} /></button>
                      <button onClick={() => setMeds(meds.map((x) => (x.name === m.name ? { ...x, active: !x.active } : x)))} className="rounded-xl p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-600" aria-label={m.active ? `Deactivate ${m.name}` : `Activate ${m.name}`}><Power size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-bold text-slate-600">{tabs.find((t) => t.id === tab)?.label}</p>
          <p className="mt-1 text-xs text-slate-400">
            {tab === "import" && "Upload a CSV or Excel file, check the preview, then import your medicine list."}
            {tab === "rules" && "Save your own rules, such as “fever → paracetamol”, to get suggestions while prescribing. You always decide."}
            {tab === "tests" && "Keep a list of lab tests you usually advise."}
            {tab === "history" && "See every file you imported and how many medicines were added."}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── QR ──────────────────────────────────────────────────────────────────

function QrView({ show }: { show: Show }) {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><QrCode size={14} /> Registered Hospital OPD QR</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Hospital Self-Service Patient QR</h2>
            <p className="text-xs font-medium text-slate-500">Patients scan this QR code at reception to view the live queue, fill in their details and book a consultation with {DOCTOR.name}.</p>
          </div>
          <button onClick={() => show("Print poster opens here in the real app")} className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"><Printer size={15} /> Print Poster</button>
        </div>
        <div className="relative mx-auto max-w-md space-y-6 overflow-hidden rounded-3xl border border-indigo-800/40 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 text-center text-white shadow-2xl">
          <div className="flex items-center justify-center gap-3">
            <img src="/assets/brand-icon.png" alt="" className="h-10 w-10 object-contain" />
            <div className="text-left">
              <h3 className="text-base font-black leading-tight tracking-tight">{HOSPITAL}</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Mumbai</p>
            </div>
          </div>
          <div className="inline-block rounded-2xl border-4 border-white bg-white p-4 shadow-xl"><FakeQr size={200} /></div>
          <div className="space-y-2">
            <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-xs font-bold text-indigo-200">TOKEN: {QR_TOKEN}</span>
            <p className="mx-auto max-w-xs text-xs font-semibold text-indigo-200/80">Scan to Book OPD Slot & Track Live Queue Status</p>
          </div>
        </div>
        <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Hospital</span>
          <p className="text-xs font-bold text-slate-800">{HOSPITAL}</p>
          <span className="block pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Appointment Link</span>
          <p className="break-all font-mono text-xs text-indigo-700">{BOOKING_URL}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          {[
            { icon: Copy, label: "Copy Patient Link", sub: "Share via WhatsApp / SMS", msg: "Booking link copied" },
            { icon: ExternalLink, label: "Preview Booking Screen", sub: "Test patient booking flow", msg: "Booking screen opens here in the real app" },
            { icon: Download, label: "Download High-Res QR", sub: "For printing custom standees", msg: "QR download starts here in the real app" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => show(a.msg)} className="flex flex-col items-center justify-center space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:bg-slate-100">
                <Icon size={20} className="mb-1 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">{a.label}</span>
                <span className="text-[10px] text-slate-400">{a.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── AVAILABILITY ────────────────────────────────────────────────────────

function AvailabilityView({ show }: { show: Show }) {
  const [blocks, setBlocks] = useState([{ date: "Next Friday", status: "leave", reason: "Family function" }]);
  const [form, setForm] = useState({ date: "", status: "unavailable", reason: "" });
  const min = new Date().toISOString().split("T")[0];
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className={`${pageCard} space-y-2`}>
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"><CalendarDays className="text-indigo-600" size={22} /> Doctor Availability</h2>
        <p className="text-xs text-slate-500">Dates marked unavailable exclude you from manual and AI booking recommendations. Existing appointments are never deleted automatically.</p>
      </div>
      <div className={`${pageCard} space-y-4`}>
        <h3 className="text-sm font-black text-slate-900">Mark a Date Unavailable</h3>
        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-4">
          <input type="date" min={min} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} aria-label="Status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold">
            <option value="unavailable">Unavailable</option><option value="leave">Leave</option><option value="holiday">Holiday</option><option value="emergency_block">Emergency Block</option>
          </select>
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason (optional)" aria-label="Reason" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold" />
          <button
            disabled={!form.date}
            onClick={() => { setBlocks([...blocks, form]); setForm({ date: "", status: "unavailable", reason: "" }); show("Date marked unavailable"); }}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:bg-slate-200"
          >
            Save
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {blocks.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No unavailable dates marked. You're bookable every day.</td></tr>
            ) : blocks.map((b, i) => (
              <tr key={`${b.date}-${i}`} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3 font-bold text-slate-900">{b.date}</td>
                <td className="px-4 py-3"><span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold capitalize text-rose-700">{b.status.replace("_", " ")}</span></td>
                <td className="px-4 py-3 text-slate-600">{b.reason || "—"}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="font-bold text-rose-500 hover:text-rose-700">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`${pageCard} space-y-3`}>
        <h3 className="text-sm font-black text-slate-900">Working Hours</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[["Morning", "10:00", "14:00"], ["Evening", "17:00", "20:00"]].map(([label, s, e]) => (
            <div key={label} className="space-y-1.5">
              <label className="font-bold text-slate-600">{label}</label>
              <div className="flex items-center gap-2">
                <input type="time" defaultValue={s} aria-label={`${label} start`} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                <span className="text-slate-400">–</span>
                <input type="time" defaultValue={e} aria-label={`${label} end`} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <button onClick={() => show("Working hours saved")} className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700">Save Working Hours</button>
        </div>
      </div>
    </section>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────

function NotificationsView() {
  const [list, setList] = useState(INITIAL_NOTIFICATIONS);
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className={`${pageCard} flex items-center justify-between`}>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"><Bell className="text-indigo-600" size={22} /> Notifications</h2>
          <p className="mt-0.5 text-xs text-slate-500">From MedTech Fixaters platform admin and your hospital admin.</p>
        </div>
        {list.some((n) => !n.read) && (
          <button onClick={() => setList(list.map((n) => ({ ...n, read: true })))} className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100">Mark All as Read</button>
        )}
      </div>
      <div className="space-y-2.5">
        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-500">No notifications</p>
            <p className="mt-1 text-xs text-slate-400">Platform and hospital announcements will appear here.</p>
          </div>
        ) : list.map((n) => (
          <div key={n.id} className={`flex items-start justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm ${n.read ? "border-slate-200" : "border-indigo-300 bg-indigo-50/30"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />}
                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${n.priority === "high" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>{n.priority}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{n.message}</p>
              <p className="mt-1.5 text-[10px] text-slate-400">{n.when} · {n.source}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {!n.read && <button onClick={() => setList(list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">Read</button>}
              <button onClick={() => setList(list.filter((x) => x.id !== n.id))} className="text-[11px] font-bold text-slate-400 hover:text-slate-700">Archive</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────

function SettingsView({ show }: { show: Show }) {
  const [s, setS] = useState({ tts: true, whatsapp: false, sound: true });
  const rows = [
    { key: "tts" as const, title: "Audio Speech Token Callouts", body: "Announces token number and patient name using Web Speech synthesizer." },
    { key: "whatsapp" as const, title: "Automated WhatsApp Prescription Dispatch", body: "Automatically sends digital prescription PDF link to patient's mobile on consultation finish." },
    { key: "sound" as const, title: "Patient Arrival Sound Alerts", body: "Plays a chime sound whenever a patient checks into the waiting queue." },
  ];
  return (
    <section className="space-y-6">
      <div className={`${pageCard} space-y-4`}>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"><Settings className="text-indigo-600" size={22} /> Doctor OPD & Console Settings</h2>
          <p className="mt-0.5 text-xs text-slate-500">Configure audio announcements, WhatsApp auto-send, and OPD preferences.</p>
        </div>
        <div className="space-y-4 divide-y divide-slate-100 pt-2 text-xs">
          {rows.map((r) => (
            <label key={r.key} className="flex cursor-pointer items-center justify-between gap-4 pt-3">
              <div>
                <h4 className="font-extrabold text-slate-900">{r.title}</h4>
                <p className="text-[11px] text-slate-500">{r.body}</p>
              </div>
              <input type="checkbox" checked={s[r.key]} onChange={(e) => setS({ ...s, [r.key]: e.target.checked })} className="h-5 w-5 cursor-pointer rounded accent-indigo-600" />
            </label>
          ))}
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button onClick={() => show("OPD settings saved")} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700">Save OPD Settings</button>
        </div>
      </div>
      <div className={`${pageCard} space-y-4`}>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900"><ShieldCheck className="text-indigo-600" size={20} /> Security</h2>
          <p className="mt-0.5 text-xs text-slate-500">Change your password. It is never stored in plain text anywhere in the app.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
          <input type="password" disabled placeholder="New Password" aria-label="New password (disabled in demo)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold" />
          <input type="password" disabled placeholder="Confirm New Password" aria-label="Confirm password (disabled in demo)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold" />
          <button onClick={() => show("Password change is disabled in the demo")} className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 md:col-span-2">Change Password</button>
        </div>
      </div>
    </section>
  );
}
