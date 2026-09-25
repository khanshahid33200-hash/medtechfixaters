import React, { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

// Asks the patient, after booking, whether the clinic may send follow-up reminders.
// Nothing is sent without a "yes" here. Saved with set_patient_communication_prefs, which
// only accepts the unguessable tracking token of the booking that was just made.
export const ReminderConsent: React.FC<{ trackingToken: string }> = ({ trackingToken }) => {
  const [whatsapp, setWhatsapp] = useState(true);
  const [emailOn, setEmailOn] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "declined">("idle");
  const [error, setError] = useState<string | null>(null);

  const save = async (optIn: boolean) => {
    setError(null);
    if (optIn && emailOn && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())) {
      setError("Please enter a valid email address, or untick email.");
      return;
    }
    setState("saving");
    const { data, error: rpcError } = await supabase.rpc("set_patient_communication_prefs", {
      p_tracking_token: trackingToken,
      p_email: optIn && emailOn ? email.trim() : null,
      p_whatsapp_opt_in: optIn ? whatsapp : false,
      p_email_opt_in: optIn ? emailOn : false,
    });
    if (rpcError || !data?.success) {
      setState("idle");
      setError(data?.error || "Couldn’t save your choice. You can tell the clinic at your visit.");
      return;
    }
    setState(optIn && (whatsapp || emailOn) ? "saved" : "declined");
  };

  if (state === "saved" || state === "declined") {
    return (
      <p className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
        <Check className="h-3.5 w-3.5 text-[#34C759]" />
        {state === "saved" ? "Thanks. The clinic will remind you about follow-ups." : "No problem. You won’t get follow-up reminders."}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 p-4 text-left text-xs">
      <p className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
        <Bell className="h-4 w-4 text-[#007AFF]" /> Follow-up reminders
      </p>
      <p className="text-[#6E6E73]">If your doctor schedules a follow-up, may the clinic remind you?</p>
      <label className="flex items-center gap-2 font-semibold text-slate-700">
        <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="h-4 w-4 accent-[#007AFF]" />
        On WhatsApp (this mobile number)
      </label>
      <label className="flex items-center gap-2 font-semibold text-slate-700">
        <input type="checkbox" checked={emailOn} onChange={(e) => setEmailOn(e.target.checked)} className="h-4 w-4 accent-[#007AFF]" />
        By email
      </label>
      {emailOn && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email for reminders"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#007AFF]/50"
        />
      )}
      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => save(false)} disabled={state === "saving"} className="rounded-xl bg-slate-100 py-2 font-bold text-slate-600 hover:bg-slate-200">
          No thanks
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={state === "saving" || (!whatsapp && !emailOn)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] py-2 font-bold text-white hover:bg-[#0062D6] disabled:opacity-50"
        >
          {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Yes, remind me
        </button>
      </div>
      <p className="text-[10px] text-slate-400">You can stop reminders any time by telling the clinic.</p>
    </div>
  );
};
