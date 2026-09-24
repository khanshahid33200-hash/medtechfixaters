import { useState } from "react";
import {
  Home,
  CalendarDays,
  Users,
  Stethoscope,
  FileText,
  ClipboardList,
  BarChart3,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Clock,
  Plus,
  ShieldPlus,
  FlaskConical,
  FilePlus2,
  Upload,
  HelpCircle,
  Building2,
  Star,
  UserCheck,
  HeartPulse,
  Printer,
  Send,
  CheckCircle2,
  Sparkles,
  Zap,
  Radio,
} from "lucide-react";

type Page =
  | "Dashboard"
  | "Today's Queue"
  | "Appointments"
  | "Patients"
  | "Consultations"
  | "Prescriptions"
  | "Templates"
  | "Follow Ups"
  | "Reports"
  | "Profile"
  | "Settings";

interface Patient {
  number: number;
  token: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  status: "Now Consulting" | "Next" | "Waiting" | "Completed";
  wait: string;
  dept: string;
  complaint: string;
  vitals: { bp: string; pulse: string; temp: string; spo2: string };
  history: string;
  allergies: string;
  lastVisit: string;
}

const initialPatients: Patient[] = [
  {
    number: 1,
    token: "CC-012",
    name: "Ravi Kumar",
    age: "32",
    gender: "Male",
    phone: "+91 98765 43210",
    status: "Now Consulting",
    wait: "—",
    dept: "Cardiology",
    complaint: "Chest pain and mild fatigue since 2 days",
    vitals: { bp: "120/80", pulse: "78 bpm", temp: "98.4°F", spo2: "98%" },
    history: "Mild hypertension (2023), Non-smoker",
    allergies: "Penicillin",
    lastVisit: "May 10, 2025",
  },
  {
    number: 2,
    token: "CC-013",
    name: "Neha Singh",
    age: "28",
    gender: "Female",
    phone: "+91 98123 45678",
    status: "Next",
    wait: "5 min",
    dept: "Cardiology",
    complaint: "Palpitations and acidity after meals",
    vitals: { bp: "116/74", pulse: "84 bpm", temp: "98.6°F", spo2: "99%" },
    history: "No significant chronic illness",
    allergies: "None",
    lastVisit: "First Visit",
  },
  {
    number: 3,
    token: "CC-014",
    name: "Mohd. Ali",
    age: "45",
    gender: "Male",
    phone: "+91 97654 32109",
    status: "Waiting",
    wait: "18 min",
    dept: "Cardiology",
    complaint: "Routine blood pressure checkup & medication refill",
    vitals: { bp: "135/88", pulse: "72 bpm", temp: "98.2°F", spo2: "97%" },
    history: "Hypertension (5 yrs) on Telmisartan 40mg",
    allergies: "Sulfa drugs",
    lastVisit: "Apr 28, 2025",
  },
  {
    number: 4,
    token: "CC-015",
    name: "Sunita Devi",
    age: "54",
    gender: "Female",
    phone: "+91 99887 76655",
    status: "Waiting",
    wait: "28 min",
    dept: "Cardiology",
    complaint: "Breathlessness on climbing stairs, swollen ankles",
    vitals: { bp: "142/90", pulse: "88 bpm", temp: "98.8°F", spo2: "95%" },
    history: "Type 2 Diabetes (8 yrs), Hypertension (4 yrs)",
    allergies: "Dust, Pollen",
    lastVisit: "Mar 15, 2025",
  },
  {
    number: 5,
    token: "CC-016",
    name: "Vikas Patel",
    age: "50",
    gender: "Male",
    phone: "+91 94567 89012",
    status: "Waiting",
    wait: "35 min",
    dept: "Cardiology",
    complaint: "Post-angioplasty 6-month routine review",
    vitals: { bp: "124/80", pulse: "68 bpm", temp: "98.4°F", spo2: "99%" },
    history: "PTCA to LAD (Nov 2024), Dyslipidemia",
    allergies: "None",
    lastVisit: "Feb 10, 2025",
  },
  {
    number: 6,
    token: "CC-017",
    name: "Ananya Roy",
    age: "24",
    gender: "Female",
    phone: "+91 98321 65498",
    status: "Waiting",
    wait: "45 min",
    dept: "Cardiology",
    complaint: "Dizziness and low energy while working",
    vitals: { bp: "102/68", pulse: "70 bpm", temp: "98.1°F", spo2: "99%" },
    history: "Mild iron deficiency anemia",
    allergies: "None",
    lastVisit: "First Visit",
  },
  {
    number: 7,
    token: "CC-018",
    name: "Harish Chandra",
    age: "62",
    gender: "Male",
    phone: "+91 91234 56780",
    status: "Waiting",
    wait: "55 min",
    dept: "Cardiology",
    complaint: "ECG review & prescription renewal",
    vitals: { bp: "130/82", pulse: "74 bpm", temp: "98.5°F", spo2: "97%" },
    history: "Ischemic Heart Disease (stable)",
    allergies: "Aspirin (GI intolerance)",
    lastVisit: "Jan 18, 2025",
  },
];

const initialAppointments = [
  { time: "10:30 AM", name: "Ravi Kumar", type: "Follow up", token: "CC-012", status: "In Consultation", fee: "₹800" },
  { time: "11:00 AM", name: "Neha Singh", type: "New Patient", token: "CC-013", status: "Arrived", fee: "₹1,000" },
  { time: "11:30 AM", name: "Mohd. Ali", type: "Refill Check", token: "CC-014", status: "Arrived", fee: "₹600" },
  { time: "12:00 PM", name: "Sunita Devi", type: "Cardiac Review", token: "CC-015", status: "Waiting", fee: "₹1,000" },
  { time: "12:30 PM", name: "Vikas Patel", type: "Post-Op Review", token: "CC-016", status: "Waiting", fee: "₹800" },
  { time: "01:00 PM", name: "Ananya Roy", type: "New Consultation", token: "CC-017", status: "Confirmed", fee: "₹1,000" },
  { time: "01:30 PM", name: "Harish Chandra", type: "ECG Evaluation", token: "CC-018", status: "Confirmed", fee: "₹800" },
  { time: "02:30 PM", name: "Kavita Sharma", type: "Follow up", token: "CC-019", status: "Confirmed", fee: "₹800" },
  { time: "03:00 PM", name: "Deepak Verma", type: "Echo Review", token: "CC-020", status: "Confirmed", fee: "₹1,200" },
];

export default function DoctorDashboardSimulator() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(initialPatients[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentPatient = patients[currentPatientIndex] || patients[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCallNext = () => {
    if (currentPatientIndex < patients.length - 1) {
      const nextIdx = currentPatientIndex + 1;
      const updated = [...patients];
      updated[currentPatientIndex].status = "Completed";
      updated[nextIdx].status = "Now Consulting";
      if (nextIdx + 1 < updated.length) updated[nextIdx + 1].status = "Next";
      setPatients(updated);
      setCurrentPatientIndex(nextIdx);
      setSelectedPatient(updated[nextIdx]);
      showToast(`Token #${updated[nextIdx].token} (${updated[nextIdx].name}) called to Room 204`);
    } else {
      showToast("All current queue patients completed!");
    }
  };

  const navigation = [
    { label: "Dashboard", icon: Home },
    { label: "Today's Queue", icon: CalendarDays },
    { label: "Appointments", icon: Clock },
    { label: "Patients", icon: Users },
    { label: "Consultations", icon: Stethoscope },
    { label: "Prescriptions", icon: FileText },
    { label: "Templates", icon: ClipboardList },
    { label: "Follow Ups", icon: HelpCircle },
    { label: "Reports", icon: BarChart3 },
    { label: "Profile", icon: User },
    { label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-[#f7f8fc] font-sans text-slate-800 shadow-[0_30px_100px_rgba(15,23,42,0.12)] text-left relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-[920px]">
        {/* ─── SIDEBAR ─── */}
        <aside className="w-full lg:w-[250px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col">
          <div className="flex h-[82px] items-center gap-3 border-b border-slate-100 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#2563EB] text-lg font-bold text-white shadow-md shadow-orange-500/20">
              <HeartPulse size={20} />
            </div>
            <div>
              <p className="text-[17px] font-bold tracking-tight text-slate-900">
                MedTech Fixaters
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium">
                Clinical OS Simulator
              </p>
            </div>
          </div>

          {/* Doctor Info Card */}
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 shadow-xs flex items-center justify-center text-lg font-bold text-[#2563EB]">
                AS
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Dr. Amit Sharma
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Chief Cardiologist
                </p>
                <p className="text-[10px] text-slate-400">
                  MBBS, MD • Room 204
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  OPD Live Active
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-x-auto lg:overflow-visible flex lg:flex-col gap-1 lg:gap-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => setActivePage(item.label as Page)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition-all duration-200 shrink-0 lg:w-full ${
                    isActive
                      ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] font-bold text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#2563EB]"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Need Help Box */}
          <div className="mx-4 mb-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#2563EB]" />
              <p className="text-xs font-bold text-slate-800">Demo Environment</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
              Try clicking any patient, calling the next token, or switching tabs.
            </p>
          </div>

          <button
            onClick={() => showToast("Simulator reset to initial state")}
            className="flex items-center gap-2.5 border-t border-slate-100 px-6 py-4 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <LogOut size={15} />
            <span>Reset Demo State</span>
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[82px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900">
                    City Care Super Specialty Hospital
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] text-[9px] font-bold uppercase">
                    HOSPITAL H1
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  OPD Department of Cardiology • Mumbai
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => showToast("Date filter: May 31, 2025")}
                className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 md:flex"
              >
                <CalendarDays size={14} className="text-[#2563EB]" />
                <span>Today (May 31, 2025)</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              <button
                onClick={() => showToast("3 pending patient lab reports ready for review")}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Bell size={18} className="text-slate-600" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  3
                </span>
              </button>
            </div>
          </header>

          {/* Tab Body Router */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto max-h-[840px]">
            {activePage === "Dashboard" && (
              <DashboardContent
                patients={patients}
                currentPatient={currentPatient}
                currentPatientIndex={currentPatientIndex}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
                onCallNext={handleCallNext}
                onToast={showToast}
                setActivePage={setActivePage}
              />
            )}

            {activePage === "Today's Queue" && (
              <QueuePageContent
                patients={patients}
                currentPatient={currentPatient}
                onSelectPatient={setSelectedPatient}
                onCallNext={handleCallNext}
                onToast={showToast}
              />
            )}

            {activePage === "Appointments" && (
              <AppointmentsPageContent
                appointments={initialAppointments}
                onToast={showToast}
              />
            )}

            {activePage === "Patients" && (
              <PatientsDirectoryContent
                patients={patients}
                onSelectPatient={(p: Patient) => {
                  setSelectedPatient(p);
                  setActivePage("Consultations");
                }}
                onToast={showToast}
              />
            )}

            {activePage === "Consultations" && (
              <ConsultationPageContent
                patient={selectedPatient}
                onCallNext={handleCallNext}
                onToast={showToast}
              />
            )}

            {activePage === "Prescriptions" && (
              <PrescriptionPageContent
                patient={selectedPatient}
                onToast={showToast}
              />
            )}

            {activePage === "Templates" && (
              <TemplatesPageContent onToast={showToast} />
            )}

            {activePage === "Follow Ups" && (
              <FollowUpsPageContent onToast={showToast} />
            )}

            {activePage === "Reports" && (
              <ReportsPageContent onToast={showToast} />
            )}

            {activePage === "Profile" && (
              <ProfilePageContent onToast={showToast} />
            )}

            {activePage === "Settings" && (
              <SettingsPageContent onToast={showToast} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 1. DASHBOARD VIEW
// ═════════════════════════════════════════════════════════════════════
function DashboardContent({
  patients,
  currentPatient,
  currentPatientIndex,
  selectedPatient,
  onSelectPatient,
  onCallNext,
  onToast,
  setActivePage,
}: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        {/* ─── METRIC CARDS ─── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Users size={20} />}
            iconClass="bg-[#2563EB]"
            title="Total Registered OPD"
            value="28"
            subtitle="Today's Patient Intake"
            trend="↑ 12% vs yesterday"
            trendClass="text-emerald-600"
          />

          <MetricCard
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-[#059669]"
            title="Consultations Done"
            value="16"
            subtitle="Avg. 14 mins / patient"
            trend="↑ On Schedule"
            trendClass="text-emerald-600"
          />

          <MetricCard
            icon={<Radio size={20} />}
            iconClass="bg-[#FF6B2C]"
            title="Active in Queue"
            value="12"
            suffix="Patients"
            subtitle="Next Token #CC-013"
            trend="● Live Broadcasting"
            trendClass="text-[#FF6B2C]"
          />

          <MetricCard
            icon={<Star size={20} />}
            iconClass="bg-[#D97706]"
            title="Patient Satisfaction"
            value="4.9"
            suffix="/ 5"
            subtitle="Based on 114 reviews"
            trend="↑ 98% positive"
            trendClass="text-emerald-600"
          />
        </section>

        {/* ─── TODAY'S QUEUE & APPOINTMENTS ─── */}
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-900">Today's Live Queue</h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live Sync
                </span>
              </div>

              <button
                onClick={() => setActivePage("Today's Queue")}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                View Full Queue →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-semibold">Token</th>
                    <th className="px-3 py-3 font-semibold">Patient</th>
                    <th className="px-3 py-3 font-semibold">Age / Sex</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Wait Time</th>
                  </tr>
                </thead>

                <tbody>
                  {patients.slice(0, 5).map((patient: Patient) => {
                    const isSelected = selectedPatient.token === patient.token;

                    return (
                      <tr
                        key={patient.token}
                        onClick={() => onSelectPatient(patient)}
                        className={`cursor-pointer border-b border-slate-100 text-xs transition-colors hover:bg-blue-50/50 ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-transparent font-medium"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          #{patient.token}
                        </td>

                        <td className="px-3 py-3.5 font-semibold text-slate-900">
                          {patient.name}
                        </td>

                        <td className="px-3 py-3.5 text-slate-500">
                          {patient.age}Y • {patient.gender}
                        </td>

                        <td className="px-3 py-3.5">
                          <QueueStatusBadge status={patient.status} />
                        </td>

                        <td className="px-5 py-3.5 text-right text-slate-500 font-medium">
                          {patient.wait}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/50 text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#2563EB]" />
                <span>Total Waiting in Lounge: <strong>5 Patients</strong></span>
              </div>
              <button
                onClick={onCallNext}
                className="px-3 py-1 rounded-lg bg-[#FF6B2C] hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
              >
                Call Next Token
              </button>
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Appointments</h2>
                <button
                  onClick={() => setActivePage("Appointments")}
                  className="text-xs font-bold text-[#2563EB] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {initialAppointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.token}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors bg-slate-50/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{apt.name}</span>
                        <span className="text-[10px] text-slate-400">#{apt.token}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {apt.time} • {apt.type}
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onToast("Appointment booking drawer opened")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-800 transition-colors"
            >
              <Plus size={14} />
              <span>Book Walk-in Appointment</span>
            </button>
          </div>
        </section>

        {/* ─── QUICK ACTIONS & TODAY'S SUMMARY ─── */}
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Quick Clinical Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Consultation", icon: Stethoscope, color: "bg-blue-50 text-[#2563EB]", action: () => setActivePage("Consultations") },
                { label: "Prescription", icon: FilePlus2, color: "bg-emerald-50 text-emerald-600", action: () => setActivePage("Prescriptions") },
                { label: "Lab Tests", icon: FlaskConical, color: "bg-orange-50 text-[#FF6B2C]", action: () => onToast("Lab test requisition builder opened") },
                { label: "Follow Up", icon: CalendarDays, color: "bg-purple-50 text-purple-600", action: () => setActivePage("Follow Ups") },
                { label: "Certificates", icon: ShieldPlus, color: "bg-indigo-50 text-indigo-600", action: () => onToast("Medical fitness certificate generator opened") },
                { label: "Templates", icon: ClipboardList, color: "bg-cyan-50 text-cyan-700", action: () => setActivePage("Templates") },
                { label: "Upload Scan", icon: Upload, color: "bg-rose-50 text-rose-600", action: () => onToast("EHR scan & report uploader opened") },
                { label: "Analytics", icon: BarChart3, color: "bg-amber-50 text-amber-600", action: () => setActivePage("Reports") },
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={act.action}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col items-center text-center gap-2 group"
                >
                  <div className={`p-2.5 rounded-xl ${act.color} transition-transform group-hover:scale-110`}>
                    <act.icon size={18} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 leading-tight">
                    {act.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Today's OPD Throughput</h2>
              <span className="text-xs font-semibold text-slate-400">Total 28 Registered</span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-xl font-black text-emerald-700">16</div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Completed (57%)</div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <div className="text-xl font-black text-orange-700">9</div>
                <div className="text-[10px] font-bold text-orange-600 uppercase">In Lounge (32%)</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="text-xl font-black text-rose-700">2</div>
                <div className="text-[10px] font-bold text-rose-600 uppercase">No Show (7%)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-xl font-black text-slate-700">1</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Rescheduled</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-amber-500" />
                <span>AI Triage Accuracy: <strong>99.2% matching</strong></span>
              </div>
              <span className="text-[11px] font-bold text-[#2563EB]">Zero Overlaps</span>
            </div>
          </div>
        </section>
      </div>

      {/* ─── RIGHT PATIENT PANEL ─── */}
      <aside className="space-y-4">
        {/* Active Token Call Box */}
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xs">
          <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 py-3.5 text-xs font-bold text-white flex items-center justify-between">
            <span>LIVE CONSULTATION DESK</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="p-5 space-y-3">
            <div className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider">
              Now in Room 204
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              #{currentPatient.token}
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">{currentPatient.name}</div>
              <div className="text-xs text-slate-500">{currentPatient.age} Yrs • {currentPatient.gender} • {currentPatient.phone}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Chief Complaint</div>
              <div className="font-medium text-slate-800">{currentPatient.complaint}</div>
            </div>

            <button
              onClick={() => {
                onToast(`Viewing full clinical record for #${currentPatient.token}`);
                setActivePage("Consultations");
              }}
              className="w-full rounded-xl border border-blue-200 py-2.5 text-xs font-bold text-[#2563EB] hover:bg-blue-50 transition-colors"
            >
              Open Active Consultation
            </button>

            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={onCallNext}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B2C] to-[#FF8A4C] hover:from-[#e5591d] hover:to-[#ff7b38] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition-all"
              >
                <UserCheck size={16} />
                <span>Call Next Patient ({patients[currentPatientIndex + 1]?.token || "End"})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Patient Vitals Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Selected File</span>
              <h3 className="text-sm font-bold text-slate-900">{selectedPatient.name}</h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#2563EB]">#{selectedPatient.token}</span>
          </div>

          <div>
            <div className="text-[10.5px] font-bold text-slate-400 uppercase mb-2">Recorded Vitals</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                <span className="text-sm font-black text-slate-900">{selectedPatient.vitals.bp}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Heart Rate</span>
                <span className="text-sm font-black text-slate-900">{selectedPatient.vitals.pulse}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Temp</span>
                <span className="text-sm font-black text-slate-900">{selectedPatient.vitals.temp}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">SpO2 Oxygen</span>
                <span className="text-sm font-black text-slate-900">{selectedPatient.vitals.spo2}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Allergies:</span>
              <span className="font-bold text-rose-600">{selectedPatient.allergies}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Last Visit:</span>
              <span className="font-medium text-slate-800">{selectedPatient.lastVisit}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Medical History:</span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[150px]">{selectedPatient.history}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 2. TODAY'S QUEUE FULL VIEW
// ═════════════════════════════════════════════════════════════════════
function QueuePageContent({ patients, currentPatient, onSelectPatient, onCallNext, onToast }: any) {
  const [filter, setFilter] = useState("all");

  const filteredPatients = patients.filter((p: Patient) => {
    if (filter === "waiting") return p.status === "Waiting" || p.status === "Next";
    if (filter === "completed") return p.status === "Completed";
    if (filter === "now") return p.status === "Now Consulting";
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Real-Time OPD Queue Dispatcher</h2>
          <p className="text-xs text-slate-500">Manage patient token sequence, announce room calls, and balance doctor load.</p>
        </div>

        <div className="flex items-center gap-2">
          {["all", "now", "waiting", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={onCallNext}
            className="px-4 py-1.5 rounded-xl bg-[#FF6B2C] text-white text-xs font-bold shadow-xs hover:bg-orange-600"
          >
            Call Next Token
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
              <th className="px-5 py-3.5">Token #</th>
              <th className="px-4 py-3.5">Patient Name</th>
              <th className="px-4 py-3.5">Contact / Demographics</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Chief Complaint</th>
              <th className="px-4 py-3.5">Queue Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p: Patient) => (
              <tr
                key={p.token}
                className="border-b border-slate-100 text-xs hover:bg-blue-50/40 transition-colors"
              >
                <td className="px-5 py-4 font-black text-slate-900 text-sm">
                  #{p.token}
                </td>
                <td className="px-4 py-4 font-bold text-slate-900">
                  {p.name}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {p.age} Yrs • {p.gender}<br />
                  <span className="text-[10.5px] text-slate-400 font-mono">{p.phone}</span>
                </td>
                <td className="px-4 py-4 text-slate-700 font-medium">
                  {p.dept}
                </td>
                <td className="px-4 py-4 text-slate-600 max-w-xs truncate">
                  {p.complaint}
                </td>
                <td className="px-4 py-4">
                  <QueueStatusBadge status={p.status} />
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button
                    onClick={() => onToast(`Calling #${p.token} into Room 204`)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-[11px]"
                  >
                    Call In
                  </button>
                  <button
                    onClick={() => onToast(`SMS reminder sent to ${p.phone}`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                  >
                    SMS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 3. APPOINTMENTS VIEW
// ═════════════════════════════════════════════════════════════════════
function AppointmentsPageContent({ appointments, onToast }: any) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">OPD Appointment Schedule</h2>
          <p className="text-xs text-slate-500">Doctor Dr. Amit Sharma • Daily Slot Capacity: 24 Slots</p>
        </div>
        <button
          onClick={() => onToast("Appointment booking modal opened")}
          className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-xs hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>New Appointment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {appointments.map((apt: any) => (
          <div
            key={apt.token}
            className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] font-mono font-bold text-xs">
                {apt.time}
              </span>
              <span className="text-xs font-bold text-slate-400">Token #{apt.token}</span>
            </div>

            <div>
              <div className="text-base font-bold text-slate-900">{apt.name}</div>
              <div className="text-xs text-slate-500">{apt.type} • Consultation Fee: {apt.fee}</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                {apt.status}
              </span>
              <button
                onClick={() => onToast(`Checking in ${apt.name} for ${apt.time}`)}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Start Check-in →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 4. PATIENTS DIRECTORY VIEW
// ═════════════════════════════════════════════════════════════════════
function PatientsDirectoryContent({ patients, onSelectPatient, onToast }: any) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = patients.filter((p: Patient) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.token.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hospital Patient Master Index</h2>
          <p className="text-xs text-slate-500">Comprehensive EMR records with visit histories and diagnostic tags.</p>
        </div>

        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient name, token..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p: Patient) => (
          <div
            key={p.token}
            className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-[#2563EB] font-bold flex items-center justify-center text-xs">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                  <span className="text-xs text-slate-500">{p.age}Y • {p.gender} • {p.phone}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                #{p.token}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Allergies</span>
                <span className="font-bold text-rose-600">{p.allergies}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Last Visit</span>
                <span className="font-medium text-slate-800">{p.lastVisit}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {p.history}
              </span>
              <button
                onClick={() => onSelectPatient(p)}
                className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-700"
              >
                Open EMR File
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 5. ACTIVE CONSULTATION WORKSPACE
// ═════════════════════════════════════════════════════════════════════
function ConsultationPageContent({ patient, onCallNext, onToast }: any) {
  const [diagnosis, setDiagnosis] = useState("Essential (Primary) Hypertension - ICD I10");
  const [notes, setNotes] = useState(
    "Patient presents with mild chest discomfort and fatigue. S1, S2 heard normal. Advised 2D Echocardiography and Lipid Profile. Continue Telmisartan 40mg once daily."
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-[#2563EB] uppercase">ACTIVE CONSULTATION ROOM 204</span>
          <h2 className="text-xl font-black text-slate-900">{patient.name} ({patient.age}Y • {patient.gender})</h2>
          <p className="text-xs text-slate-500">Token #{patient.token} • Contact: {patient.phone}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onToast("Prescription generated & sent to patient SMS")}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>Complete &amp; Next</span>
          </button>
          <button
            onClick={onCallNext}
            className="px-4 py-2 rounded-xl bg-[#FF6B2C] hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
          >
            Call Next Token
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Clinical Assessment */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Clinical Assessment &amp; Diagnosis
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ICD-10 Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Doctor's Clinical Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-normal focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Prescribed Medications</label>
              <div className="space-y-2">
                {[
                  { drug: "Tab. Telmisartan", dose: "40 mg", freq: "1-0-0 (Morning After Food)", dur: "30 Days" },
                  { drug: "Tab. Atorvastatin", dose: "10 mg", freq: "0-0-1 (Night After Food)", dur: "30 Days" },
                  { drug: "Tab. Pantoprazole", dose: "40 mg", freq: "1-0-0 (Empty Stomach)", dur: "14 Days" },
                ].map((med, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{med.drug} {med.dose}</span>
                      <div className="text-[11px] text-slate-500">{med.freq}</div>
                    </div>
                    <span className="font-bold text-slate-700">{med.dur}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Patient Vitals & History */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Live Vitals</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <span className="text-[9px] font-bold text-slate-400 block">BP</span>
                <span className="text-sm font-black text-slate-900">{patient.vitals.bp}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <span className="text-[9px] font-bold text-slate-400 block">Pulse</span>
                <span className="text-sm font-black text-slate-900">{patient.vitals.pulse}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <span className="text-[9px] font-bold text-slate-400 block">Temp</span>
                <span className="text-sm font-black text-slate-900">{patient.vitals.temp}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <span className="text-[9px] font-bold text-slate-400 block">SpO2</span>
                <span className="text-sm font-black text-slate-900">{patient.vitals.spo2}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Allergies</span>
                <span className="font-bold text-rose-600">{patient.allergies}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Medical Background</span>
                <span className="text-slate-700">{patient.history}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 6. PRESCRIPTION RX GENERATOR
// ═════════════════════════════════════════════════════════════════════
function PrescriptionPageContent({ patient, onToast }: any) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Digital Prescription Studio (Rx)</h2>
          <p className="text-xs text-slate-500">Automated print formatting and WhatsApp digital copy sync.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToast("Prescription sent to patient WhatsApp")}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Send to WhatsApp</span>
          </button>
          <button
            onClick={() => onToast("Sending prescription to thermal/A4 printer")}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print Rx</span>
          </button>
        </div>
      </div>

      {/* Prescription Paper Preview */}
      <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 text-slate-800 font-serif">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 font-sans">
          <div>
            <h1 className="text-lg font-black text-slate-900">CITY CARE SUPER SPECIALTY HOSPITAL</h1>
            <p className="text-xs text-slate-500 font-semibold">Department of Cardiology • NABH Accredited</p>
            <p className="text-[11px] text-slate-400">Dr. Amit Sharma, MBBS, MD (Cardiology) • Reg #MH-84920</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-slate-900 font-mono">Date: May 31, 2025</span>
            <div className="text-slate-500">OPD Room #204</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 font-sans text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div><strong>Patient:</strong> {patient.name}</div>
          <div><strong>Age/Sex:</strong> {patient.age}Y / {patient.gender}</div>
          <div><strong>Token:</strong> #{patient.token}</div>
        </div>

        <div className="space-y-4">
          <div className="text-2xl font-black text-[#2563EB] font-serif italic">℞</div>
          <div className="space-y-3 font-sans text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <div>
                <strong>1. Tab. Telmisartan 40mg</strong>
                <p className="text-slate-500">Take 1 tablet in the morning after breakfast</p>
              </div>
              <div className="font-bold text-slate-700">30 Days (1-0-0)</div>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <div>
                <strong>2. Tab. Atorvastatin 10mg</strong>
                <p className="text-slate-500">Take 1 tablet at night after dinner</p>
              </div>
              <div className="font-bold text-slate-700">30 Days (0-0-1)</div>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <div>
                <strong>3. Tab. Pantoprazole 40mg</strong>
                <p className="text-slate-500">Take 1 tablet early morning before food</p>
              </div>
              <div className="font-bold text-slate-700">14 Days (1-0-0)</div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-slate-900 pt-6 flex justify-between items-end font-sans text-xs">
          <div className="text-[11px] text-slate-400">
            Next Follow-up: 1 Month (June 30, 2025)<br />
            For emergencies, call: +91 22 8765 4321
          </div>
          <div className="text-center">
            <div className="font-bold text-slate-800 font-serif italic text-sm">Dr. Amit Sharma</div>
            <div className="text-[10px] text-slate-400">Signature &amp; Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 7. TEMPLATES VIEW
// ═════════════════════════════════════════════════════════════════════
function TemplatesPageContent({ onToast }: any) {
  const templates = [
    { title: "Hypertension Stage 1 OPD Protocol", drugs: "Telmisartan 40mg + Hydrochlorothiazide 12.5mg", dept: "Cardiology" },
    { title: "Type-2 Diabetes Initial Regimen", drugs: "Metformin 500mg SR + Glimepiride 1mg", dept: "Endocrinology" },
    { title: "Acute Bronchitis Short Course", drugs: "Amoxicillin-Clav 625mg + Levocetirizine 5mg", dept: "Pulmonology" },
    { title: "Post-PTCA Cardiac Follow-up", drugs: "Aspirin 75mg + Clopidogrel 75mg + Rosuvastatin 20mg", dept: "Cardiology" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Clinical Protocol Templates</h2>
          <p className="text-xs text-slate-500">1-click prescription templates for rapid outpatient consultations.</p>
        </div>
        <button
          onClick={() => onToast("New template builder opened")}
          className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-xs hover:bg-blue-700"
        >
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">{t.title}</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-bold">{t.dept}</span>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{t.drugs}</p>
            <button
              onClick={() => onToast(`Applied template '${t.title}' to current prescription`)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-800 text-xs font-bold transition-colors"
            >
              Apply Template to Rx
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 8. FOLLOW UPS VIEW
// ═════════════════════════════════════════════════════════════════════
function FollowUpsPageContent({ onToast }: any) {
  const followUps = [
    { patient: "Sunita Devi", token: "CC-015", date: "June 07, 2025", reason: "Echo evaluation & dosage adjustment", status: "SMS Scheduled" },
    { patient: "Vikas Patel", token: "CC-016", date: "June 14, 2025", reason: "Lipid profile review", status: "SMS Scheduled" },
    { patient: "Ananya Roy", token: "CC-017", date: "June 21, 2025", reason: "Hemoglobin & Ferritin review", status: "Confirmed" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Scheduled Follow-up Reminders</h2>
          <p className="text-xs text-slate-500">Automated SMS/WhatsApp reminders sent 48 hours prior to appointment.</p>
        </div>
        <button
          onClick={() => onToast("Bulk reminder SMS blast triggered to 3 patients")}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
        >
          Send Bulk SMS Reminders
        </button>
      </div>

      <div className="space-y-3">
        {followUps.map((f, i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{f.patient}</span>
                <span className="text-xs text-slate-400 font-mono">#{f.token}</span>
              </div>
              <p className="text-xs text-slate-500">{f.reason} • Due on: <strong>{f.date}</strong></p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 9. REPORTS & ANALYTICS VIEW
// ═════════════════════════════════════════════════════════════════════
function ReportsPageContent({ onToast }: any) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Monthly OPD Intelligence &amp; Performance</h2>
          <p className="text-xs text-slate-500">Aggregated analytics for patient wait times, throughput, and collections.</p>
        </div>
        <button
          onClick={() => onToast("Exporting PDF report for May 2025")}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs"
        >
          Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Monthly Consultations</span>
          <div className="text-3xl font-black text-slate-900 mt-1">482</div>
          <span className="text-xs font-bold text-emerald-600">↑ 18% vs last month</span>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Avg. Waiting Room Time</span>
          <div className="text-3xl font-black text-[#FF6B2C] mt-1">8.4 mins</div>
          <span className="text-xs font-bold text-emerald-600">↓ Reduced from 34 mins</span>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Direct QR Bookings</span>
          <div className="text-3xl font-black text-[#2563EB] mt-1">92.4%</div>
          <span className="text-xs font-bold text-slate-500">Near zero front-desk friction</span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 10. PROFILE VIEW
// ═════════════════════════════════════════════════════════════════════
function ProfilePageContent({ onToast }: any) {
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="h-16 w-16 rounded-full bg-blue-100 text-[#2563EB] font-black text-xl flex items-center justify-center">
          AS
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Dr. Amit Sharma</h2>
          <p className="text-xs text-slate-500">MBBS, MD Cardiology • Registration #MH-84920</p>
          <span className="text-xs font-bold text-[#2563EB]">City Care Hospital • Room 204</span>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between p-3 rounded-xl bg-slate-50">
          <span className="text-slate-500">OPD Consultation Hours:</span>
          <span className="font-bold text-slate-800">10:00 AM – 04:30 PM (Mon-Sat)</span>
        </div>
        <div className="flex justify-between p-3 rounded-xl bg-slate-50">
          <span className="text-slate-500">Consultation Fee:</span>
          <span className="font-bold text-emerald-600">₹800 / Visit</span>
        </div>
        <div className="flex justify-between p-3 rounded-xl bg-slate-50">
          <span className="text-slate-500">Hospital Multi-Tenant ID:</span>
          <span className="font-bold font-mono text-slate-700">HOSP_CITYCARE_01</span>
        </div>
      </div>

      <button
        onClick={() => onToast("Doctor profile updated successfully")}
        className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
      >
        Update Doctor Profile
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 11. SETTINGS VIEW
// ═════════════════════════════════════════════════════════════════════
function SettingsPageContent({ onToast }: any) {
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">OPD System Configurations</h2>
      <div className="space-y-3 text-xs">
        {[
          { title: "Automated WhatsApp Queue Updates", desc: "Notify patients when 2 tokens remain before their turn" },
          { title: "Audio Token Announcement (Lounge TV)", desc: "Play voice chime when next patient is called" },
          { title: "Auto-Generate Digital Rx PDF", desc: "Automatically sync signed prescriptions with hospital server" },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-slate-900 block">{s.title}</span>
              <span className="text-slate-500 text-[11px]">{s.desc}</span>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 text-[#2563EB] rounded" />
          </div>
        ))}
      </div>

      <button
        onClick={() => onToast("Settings saved successfully")}
        className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
      >
        Save OPD Preferences
      </button>
    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────
function MetricCard({ icon, iconClass, title, value, suffix, subtitle, trend, trendClass }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-start gap-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${iconClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{value}</span>
            {suffix && <span className="text-xs font-bold text-slate-500">{suffix}</span>}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>
      <p className={`mt-3 text-[11px] font-bold ${trendClass}`}>{trend}</p>
    </div>
  );
}

function QueueStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Now Consulting": "bg-emerald-50 text-emerald-700 border-emerald-200",
    Next: "bg-orange-50 text-orange-700 border-orange-200",
    Waiting: "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${styles[status] || "bg-slate-50 text-slate-600"}`}>
      {status === "Now Consulting" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status}
    </span>
  );
}
