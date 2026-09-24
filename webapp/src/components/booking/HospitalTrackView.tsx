import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Search,
  Activity,
  Building2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { HospitalWorkspace } from "../../types/booking";

interface QueueProgressItem {
  token_number: number;
  queue_number: string;
  status: string;
  is_current: boolean;
  is_you: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface MatchedAppointmentItem {
  id: string;
  token_number: number;
  queue_number: string;
  tracking_token?: string;
  patient_id?: string;
  patient_number?: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  status: string;
  created_at: string;
}

interface QueueStatus {
  appointment_id: string;
  hospital_id?: string;
  hospital_name: string;
  doctor_id?: string;
  doctor_name: string;
  doctor_code?: string;
  department: string;
  room_number: string;
  appointment_date: string;
  token_number: number;
  original_token: number;
  queue_number: string;
  tracking_token?: string;
  patient_id?: string;
  patient_number?: string;
  patient_name: string;
  patient_phone?: string;
  current_serving_token: number;
  live_position: number;
  patients_ahead: number;
  waiting_before_you: number;
  estimated_wait_mins: number;
  status: "Waiting" | "In Consultation" | "Completed" | "Cancelled" | "No Show";
  live_status_label: "Now Serving" | "Your Turn Soon" | "Waiting" | "Completed" | "Cancelled" | "Missed";
  queue_progress?: QueueProgressItem[];
  notifications?: NotificationItem[];
  matched_appointments?: MatchedAppointmentItem[];
}

// Audio chime using standard Web Audio API
function playTurnChime(type: "urgent" | "alert" | "normal" = "normal") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "urgent") {
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6
    } else {
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc2.frequency.setValueAtTime(659.25, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.6);
  } catch {
    // AudioContext blocked by browser autoplay policy until interaction
  }
}

interface HospitalTrackViewProps {
  hospital: HospitalWorkspace | null;
  initialTrackingToken?: string;
  onBackToBooking: () => void;
}

export const HospitalTrackView: React.FC<HospitalTrackViewProps> = ({
  hospital,
  initialTrackingToken = "",
  onBackToBooking,
}) => {
  const [searchMode, setSearchMode] = useState<"phone" | "patient_id">("phone");
  const [inputValue, setInputValue] = useState(initialTrackingToken);
  const [queueData, setQueueData] = useState<QueueStatus | null>(null);
  const [matchedAppointments, setMatchedAppointments] = useState<MatchedAppointmentItem[]>([]);
  const [loadingStage, setLoadingStage] = useState<"" | "finding" | "queue">("");
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);

  const previousPatientsAhead = useRef<number | null>(null);

  const hospitalName = hospital?.name || "Hospital Facility";
  const hospitalId = hospital?.id || hospital?.qrToken || "";

  // Helper to trigger browser push notifications
  const triggerBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      } catch {
        // Notification failed in background
      }
    }
  };

  // Perform Hospital-Scoped Live Status Query
  const fetchLiveStatus = async (searchTerm: string, isSilent = false) => {
    const clean = (searchTerm || "").trim();
    if (!clean) return;

    if (!isSilent) {
      setError(null);
      setLoadingStage("finding");
    }

    try {
      if (!isSilent) {
        // Subtle delay to transition loading state smoothly
        await new Promise((r) => setTimeout(r, 200));
        setLoadingStage("queue");
      }

      const { data, error: rpcErr } = await supabase.rpc("get_live_queue_status", {
        p_tracking_token: clean,
        p_hospital_id: hospitalId || null,
      });

      if (rpcErr) throw rpcErr;

      if (data && data.success) {
        setQueueData(data);
        setIsConnected(true);

        if (Array.isArray(data.matched_appointments) && data.matched_appointments.length > 1) {
          setMatchedAppointments(data.matched_appointments);
        } else {
          setMatchedAppointments([]);
        }

        if (Array.isArray(data.notifications)) {
          setLocalNotifications(data.notifications);
        }

        // Sound trigger & Browser Notification on threshold changes
        if (
          previousPatientsAhead.current !== null &&
          previousPatientsAhead.current !== data.patients_ahead
        ) {
          if (data.status === "In Consultation" || data.patients_ahead === 0) {
            if (soundEnabled) playTurnChime("urgent");
            triggerBrowserNotification(
              "🟢 It's your turn!",
              `Token #${data.token_number} is now being called by Dr. ${data.doctor_name}.`
            );
          } else if (data.patients_ahead === 1) {
            if (soundEnabled) playTurnChime("alert");
            triggerBrowserNotification(
              "⚡ You're next!",
              `Token #${data.token_number} is next in line for Dr. ${data.doctor_name}.`
            );
          } else if (data.patients_ahead === 2) {
            if (soundEnabled) playTurnChime("normal");
            triggerBrowserNotification(
              "⏱️ You're 2 turns away",
              `Current token is #${data.current_serving_token}. Please be ready.`
            );
          }
        }
        previousPatientsAhead.current = data.patients_ahead;
      } else {
        throw new Error(data?.error || "No active appointment found for this hospital.");
      }
    } catch (err: any) {
      console.warn("Hospital-scoped queue tracking notice:", err.message);
      if (!isSilent) {
        setError(err.message || "No active appointment found for this hospital.");
      }
    } finally {
      if (!isSilent) setLoadingStage("");
    }
  };

  // Initial load if tracking token provided
  useEffect(() => {
    if (initialTrackingToken) {
      fetchLiveStatus(initialTrackingToken);
    }
  }, [initialTrackingToken]);

  // Realtime Subscription scoped to this appointment & doctor queue
  useEffect(() => {
    if (!queueData?.appointment_id) return;

    const apptId = queueData.appointment_id;
    const docId = queueData.doctor_id;

    const channel = supabase
      .channel(`hospital_queue_${apptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${apptId}`,
        },
        () => {
          fetchLiveStatus(queueData.tracking_token || inputValue, true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `appointment_id=eq.${apptId}`,
        },
        () => {
          fetchLiveStatus(queueData.tracking_token || inputValue, true);
        }
      );

    if (docId) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${docId}`,
        },
        () => {
          fetchLiveStatus(queueData.tracking_token || inputValue, true);
        }
      );
    }

    channel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
    });

    // Polling fallback every 12 seconds for resilience
    const interval = setInterval(() => {
      if (queueData?.tracking_token || inputValue) {
        fetchLiveStatus(queueData?.tracking_token || inputValue, true);
      }
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [queueData?.appointment_id, queueData?.doctor_id, queueData?.tracking_token, inputValue, soundEnabled]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError(
        searchMode === "phone"
          ? "Please enter your mobile phone number."
          : "Please enter your permanent Patient ID."
      );
      return;
    }
    fetchLiveStatus(inputValue);
  };

  const isLoading = Boolean(loadingStage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl mx-auto space-y-6"
    >
      {/* ─── TOP HOSPITAL IDENTITY HEADER (HOSPITAL-SCOPED) ─── */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>{hospitalName}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
          Track Live Queue Status
        </h2>

        <p className="text-xs sm:text-sm text-[#6E6E73]">
          Real-time appointment and OPD queue tracker for {hospitalName}
        </p>
      </div>

      {/* ─── SEARCH INPUT CARD (WHEN NO ACTIVE RESULT LOADED) ─── */}
      {!queueData ? (
        <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(0,122,255,0.08)] p-6 sm:p-7 space-y-5 relative overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSearchMode("phone");
                setError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                searchMode === "phone"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>By Mobile Number</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchMode("patient_id");
                setError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                searchMode === "patient_id"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>By Patient ID</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {searchMode === "phone" ? "Mobile Phone Number" : "Permanent Patient ID / Token"}
              </label>

              <div className="relative">
                <input
                  type={searchMode === "phone" ? "tel" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    searchMode === "phone"
                      ? "Enter 10-digit mobile number (e.g. 9876543210)..."
                      : "Enter Patient ID (e.g. 2026092301)..."
                  }
                  className="w-full h-13 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 focus:border-[#007AFF] focus:ring-4 focus:ring-blue-500/10"
                />

                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                {searchMode === "phone"
                  ? `💡 Searches exclusively for active appointments registered under this mobile at ${hospitalName}.`
                  : `💡 Permanent Patient ID is printed on your booking confirmation or prescription.`}
              </p>
            </div>

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-[#007AFF] hover:bg-[#0062D6] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {loadingStage === "finding"
                      ? "Finding your appointment..."
                      : "Checking live queue..."}
                  </span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Status →</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Back to Booking link */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onBackToBooking}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Booking Options</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─── LIVE APPOINTMENT & QUEUE TRACKING RESULT CARD ─── */
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                setQueueData(null);
                setInputValue("");
                setError(null);
                setMatchedAppointments([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Search Another</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-xl border transition ${
                  soundEnabled
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-slate-100 text-slate-400 border-slate-200"
                }`}
                title={soundEnabled ? "Audio alerts enabled" : "Audio alerts muted"}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <button
                type="button"
                onClick={() => fetchLiveStatus(queueData.tracking_token || inputValue)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition"
              >
                <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Multiple Appointments Selector for this Hospital (if any) */}
          {matchedAppointments.length > 1 && (
            <div className="rounded-2xl bg-blue-50/60 border border-blue-200/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  Multiple Appointments at {hospitalName}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {matchedAppointments.length} Found
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedAppointments.map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => fetchLiveStatus(appt.tracking_token || appt.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      appt.id === queueData.appointment_id
                        ? "bg-white border-blue-500 shadow-sm"
                        : "bg-white/70 hover:bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{appt.doctor_name}</span>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        #{appt.token_number}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{appt.department} • {appt.appointment_date}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MAIN LIVE QUEUE STATUS HERO CARD */}
          <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_16px_48px_rgba(0,122,255,0.12)] p-6 sm:p-7 space-y-6 relative overflow-hidden text-center">
            {/* Realtime Live Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-left">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  {queueData.hospital_name || hospitalName}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                  }`}
                />
                <span>{isConnected ? "● LIVE" : "Connecting..."}</span>
              </div>
            </div>

            {/* DOCTOR & SPECIALTY */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
                Consulting Doctor
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {queueData.doctor_name}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {queueData.department} • {queueData.room_number}
              </p>
            </div>

            {/* YOUR TOKEN HERO DISPLAY */}
            <div className="py-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Your OPD Token
              </span>
              <div className="inline-block px-9 py-4 rounded-3xl bg-gradient-to-tr from-[#007AFF] via-[#0062D6] to-[#004BB5] text-white shadow-xl shadow-blue-500/30 border border-white/20">
                <span className="text-5xl sm:text-6xl font-extrabold tracking-wider font-mono">
                  #{queueData.token_number}
                </span>
              </div>
            </div>

            {/* LIVE QUEUE METRICS GRID */}
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-600" /> Current Token
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  #{queueData.current_serving_token}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Est. Wait Time
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  ~{queueData.estimated_wait_mins} mins
                </span>
              </div>
            </div>

            {/* PATIENTS AHEAD & LIVE STATUS BANNER */}
            <div
              className={`p-4 rounded-2xl border text-center transition ${
                queueData.status === "In Consultation" || queueData.patients_ahead === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : queueData.patients_ahead <= 2
                  ? "bg-orange-50 border-orange-200 text-orange-900"
                  : "bg-blue-50/70 border-blue-100 text-blue-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider">
                  {queueData.patients_ahead === 0
                    ? "🟢 Now Serving Your Token"
                    : queueData.patients_ahead === 1
                    ? "⚡ 1 Patient Ahead • You're Next!"
                    : queueData.patients_ahead === 2
                    ? "⏱️ 2 Patients Ahead • Your Turn Soon"
                    : `${queueData.patients_ahead} Patients Ahead`}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-80">
                {queueData.patients_ahead === 0
                  ? `Please proceed directly to ${queueData.room_number}.`
                  : queueData.patients_ahead <= 2
                  ? "Please remain near the OPD consultation room."
                  : "Queue updates automatically in real-time. No manual refresh required."}
              </p>
            </div>

            {/* PATIENT IDENTITY DETAILS */}
            <div className="text-left space-y-2 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient Name</span>
                <span className="font-bold text-slate-900">{queueData.patient_name}</span>
              </div>

              {queueData.patient_number && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Patient ID</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {queueData.patient_number}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Appointment Date</span>
                <span className="font-semibold text-slate-800">{queueData.appointment_date}</span>
              </div>
            </div>

            {/* Back to booking action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToBooking}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Hospital Booking Page</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
