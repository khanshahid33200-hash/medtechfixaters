"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, User, CalendarDays, Layers,
  Stethoscope, CheckCircle2, ShieldCheck, AlertCircle
} from "lucide-react";
import { DepartmentSelector } from "./DepartmentSelector";
import { DoctorSelector } from "./DoctorSelector";
import {
  DepartmentItem, DoctorItem, HospitalWorkspace, PatientIntake
} from "../../types/appointment";

interface Props {
  hospital: HospitalWorkspace;
  departments: DepartmentItem[];
  doctors: DoctorItem[];
  onSelectDoctorAndSubmit: (
    patientInfo: PatientIntake,
    dept: DepartmentItem,
    doc: DoctorItem
  ) => void;
  onBackToChoice: () => void;
}

export function ManualBookingFlow({
  hospital,
  departments,
  doctors,
  onSelectDoctorAndSubmit,
  onBackToChoice,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Patient Details
  const [patientInfo, setPatientInfo] = useState<PatientIntake>({
    fullName: "",
    age: 32,
    gender: "Male",
    contactNumber: "",
    email: "",
    primaryConcern: "Manual OPD Appointment",
    symptoms: [],
  });

  // Step 2 & 3: Selection
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter doctors by selected department
  const filteredDoctors = selectedDept
    ? doctors.filter(
        (d) =>
          d.department?.toLowerCase().includes(selectedDept.name.toLowerCase()) ||
          d.department_id === selectedDept.id
      )
    : doctors;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInfo.fullName.trim()) {
      setValidationError("Please enter your full name.");
      return;
    }
    if (!patientInfo.contactNumber.trim() || patientInfo.contactNumber.trim().length < 8) {
      setValidationError("Please enter a valid mobile phone number.");
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const handleDeptSelect = (dept: DepartmentItem) => {
    setSelectedDept(dept);
    setStep(3);
  };

  const handleDoctorSelect = (doc: DoctorItem) => {
    setSelectedDoctor(doc);
    if (!selectedDept) {
      const parentDept = departments.find(
        (d) => d.name.toLowerCase() === doc.department?.toLowerCase()
      ) || { id: "dept-gen", hospital_id: hospital.id, name: doc.department || "General Medicine" };
      onSelectDoctorAndSubmit(patientInfo, parentDept, doc);
    } else {
      onSelectDoctorAndSubmit(patientInfo, selectedDept, doc);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 text-left">
      {/* Step Progress Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) onBackToChoice();
              else setStep((s) => (s - 1) as any);
            }}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{step === 1 ? "Back to Choice" : "Previous Step"}</span>
          </button>

          <span className="text-xs font-black text-orange-600 uppercase tracking-wider">
            Manual Booking (Step {step} of 3)
          </span>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Patient Information */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleStep1Submit}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-4"
          >
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Step 1: Patient Information
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Enter details to register your live OPD queue token at {hospital.name}.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={patientInfo.fullName}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition"
                />
              </div>

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
                    value={patientInfo.age}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, age: Number(e.target.value) || 30 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={patientInfo.gender}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, gender: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={patientInfo.contactNumber}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, contactNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. patient@gmail.com"
                  value={patientInfo.email}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Continue to Department Selection</span>
              <ArrowRight size={15} />
            </button>
          </motion.form>
        )}

        {/* STEP 2: Department Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-4"
          >
            <DepartmentSelector
              departments={departments}
              selectedDepartmentId={selectedDept?.id}
              onSelectDepartment={handleDeptSelect}
            />
          </motion.div>
        )}

        {/* STEP 3: Doctor Selection */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-4"
          >
            <DoctorSelector
              doctors={filteredDoctors.length > 0 ? filteredDoctors : doctors}
              selectedDoctorId={selectedDoctor?.id}
              onSelectDoctor={handleDoctorSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
