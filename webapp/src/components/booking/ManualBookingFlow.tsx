import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PatientDetails } from "./PatientDetails";
import { DepartmentSelection } from "./DepartmentSelection";
import { DoctorSelection } from "./DoctorSelection";
import { BookingReview } from "./BookingReview";
import {
  PatientIntake,
  DoctorItem,
  DepartmentItem,
  HospitalWorkspace,
  BookingScreen,
} from "../../types/booking";

interface ManualBookingFlowProps {
  hospital: HospitalWorkspace | null;
  doctors: DoctorItem[];
  departments: DepartmentItem[];
  currentScreen: BookingScreen;
  onNavigateScreen: (screen: BookingScreen) => void;
  onCompleteManualBooking: (
    patient: PatientIntake,
    doctor: DoctorItem,
    department?: DepartmentItem | null
  ) => void;
  loading?: boolean;
}

export const ManualBookingFlow: React.FC<ManualBookingFlowProps> = ({
  hospital,
  doctors,
  departments,
  currentScreen,
  onNavigateScreen,
  onCompleteManualBooking,
  loading = false,
}) => {
  const [patient, setPatient] = useState<PatientIntake | null>(null);
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DoctorItem | null>(null);

  // Helper for current step index (1: Details, 2: Dept, 3: Doctor, 4: Review)
  const getStepNumber = () => {
    switch (currentScreen) {
      case "manual-details":
        return 1;
      case "manual-department":
        return 2;
      case "manual-doctor":
        return 3;
      case "review":
        return 4;
      default:
        return 1;
    }
  };

  const handleBack = () => {
    switch (currentScreen) {
      case "manual-details":
        onNavigateScreen("home");
        break;
      case "manual-department":
        onNavigateScreen("manual-details");
        break;
      case "manual-doctor":
        onNavigateScreen("manual-department");
        break;
      case "review":
        onNavigateScreen("manual-doctor");
        break;
      default:
        onNavigateScreen("home");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 w-full max-w-xl mx-auto"
    >
      {/* Stepper Bar Header */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleBack}
          className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
            <motion.div
              className="h-full bg-[#007AFF] rounded-full"
              animate={{ width: `${(getStepNumber() / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-semibold text-[#007AFF]">
            Step {getStepNumber()} of 4
          </span>
        </div>
      </div>

      {/* Step Views */}
      <AnimatePresence mode="wait">
        {currentScreen === "manual-details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <PatientDetails
              initialIntake={patient || undefined}
              onSubmitDetails={(data) => {
                setPatient(data);
                onNavigateScreen("manual-department");
              }}
            />
          </motion.div>
        )}

        {currentScreen === "manual-department" && (
          <motion.div
            key="dept"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <DepartmentSelection
              departments={departments}
              doctors={doctors}
              onSelectDepartment={(dept) => {
                setSelectedDept(dept);
                onNavigateScreen("manual-doctor");
              }}
            />
          </motion.div>
        )}

        {currentScreen === "manual-doctor" && (
          <motion.div
            key="doc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <DoctorSelection
              doctors={doctors}
              selectedDepartment={selectedDept}
              onSelectDoctor={(doc) => {
                setSelectedDoc(doc);
                onNavigateScreen("review");
              }}
            />
          </motion.div>
        )}

        {currentScreen === "review" && patient && selectedDoc && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <BookingReview
              hospital={hospital}
              patient={patient}
              doctor={selectedDoc}
              department={selectedDept}
              loading={loading}
              onConfirm={() =>
                onCompleteManualBooking(patient, selectedDoc, selectedDept)
              }
              onEdit={() => onNavigateScreen("manual-details")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
