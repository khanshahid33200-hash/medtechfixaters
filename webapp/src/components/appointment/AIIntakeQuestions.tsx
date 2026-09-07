"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, AlertCircle, ShieldCheck, Check } from "lucide-react";
import { PatientIntake } from "../../types/appointment";

interface Props {
  currentStep: "name" | "details" | "concern" | "symptoms" | "meds";
  onAnswerName: (name: string) => void;
  onAnswerDetails: (details: { age: number; gender: string; contact: string; email: string }) => void;
  onAnswerConcern: (concern: string) => void;
  onAnswerSymptoms: (symptoms: string[], duration: string) => void;
  onAnswerMeds: (meds: string, history: string) => void;
}

export function AIIntakeQuestions({
  currentStep,
  onAnswerName,
  onAnswerDetails,
  onAnswerConcern,
  onAnswerSymptoms,
  onAnswerMeds,
}: Props) {
  // Step A: Name
  const [nameInput, setNameInput] = useState("");

  // Step B: Details
  const [ageInput, setAgeInput] = useState("32");
  const [genderInput, setGenderInput] = useState("Male");
  const [contactInput, setContactInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  // Step C: Concern & Symptoms
  const [concernInput, setConcernInput] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [durationInput, setDurationInput] = useState("1-2 days");

  // Step D: Meds
  const [medsInput, setMedsInput] = useState("");
  const [historyInput, setHistoryInput] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  const commonSymptomChips = [
    "Fever", "Cough", "Headache", "Body Ache",
    "Joint Pain", "Skin Rash", "Chest Discomfort",
    "Stomach Ache", "Acidity / Gas", "Eye Irritation",
    "Sore Throat", "Fatigue"
  ];

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setValidationError("Please enter your full name.");
      return;
    }
    setValidationError(null);
    onAnswerName(nameInput.trim());
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim() || contactInput.trim().length < 8) {
      setValidationError("Please enter a valid mobile contact number.");
      return;
    }
    setValidationError(null);
    onAnswerDetails({
      age: Number(ageInput) || 30,
      gender: genderInput,
      contact: contactInput.trim(),
      email: emailInput.trim(),
    });
  };

  const handleConcernSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernInput.trim() || concernInput.trim().length < 4) {
      setValidationError("Please describe your health concern (at least 4 characters).");
      return;
    }
    setValidationError(null);
    onAnswerConcern(concernInput.trim());
  };

  const toggleSymptomChip = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSymptomsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswerSymptoms(selectedSymptoms, durationInput);
  };

  const handleMedsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswerMeds(medsInput.trim(), historyInput.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg shadow-slate-200/60 text-left mt-4"
    >
      {validationError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP A: Full Name */}
      {currentStep === "name" && (
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Rahul Sharma"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Question</span>
            <ArrowRight size={14} />
          </button>
        </form>
      )}

      {/* STEP B: Basic Details */}
      {currentStep === "details" && (
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Age *
              </label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={genderInput}
                onChange={(e) => setGenderInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mobile Contact Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. patient@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Health Concern</span>
            <ArrowRight size={14} />
          </button>
        </form>
      )}

      {/* STEP C: Primary Medical Concern */}
      {currentStep === "concern" && (
        <form onSubmit={handleConcernSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Primary Health Concern *
            </label>
            <textarea
              rows={3}
              required
              autoFocus
              placeholder="e.g. Experiencing fever, severe headache, and joint pain for 2 days..."
              value={concernInput}
              onChange={(e) => setConcernInput(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Select Symptoms</span>
            <ArrowRight size={14} />
          </button>
        </form>
      )}

      {/* STEP D: Symptoms Chips & Duration */}
      {currentStep === "symptoms" && (
        <form onSubmit={handleSymptomsSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Symptoms (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {commonSymptomChips.map((chip) => {
                const selected = selectedSymptoms.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleSymptomChip(chip)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      selected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {selected && <Check size={12} />}
                    <span>{chip}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Symptom Duration
            </label>
            <select
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition cursor-pointer"
            >
              <option value="Just started today">Just started today</option>
              <option value="1-2 days">1-2 days</option>
              <option value="3-7 days">3-7 days</option>
              <option value="More than 1 week">More than 1 week</option>
              <option value="Chronic / Ongoing">Chronic / Ongoing</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next: Medications & History</span>
            <ArrowRight size={14} />
          </button>
        </form>
      )}

      {/* STEP E: Medications & History */}
      {currentStep === "meds" && (
        <form onSubmit={handleMedsSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Current Medications (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol 500mg, BP medication"
              value={medsInput}
              onChange={(e) => setMedsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Medical History / Known Allergies (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Diabetes, Penicillin Allergy"
              value={historyInput}
              onChange={(e) => setHistoryInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition"
            />
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>AI routing assists appointment selection & does not replace clinical diagnosis.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Analyze Concern with AI & Find Doctor</span>
          </button>
        </form>
      )}
    </motion.div>
  );
}
