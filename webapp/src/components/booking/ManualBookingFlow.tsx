import React, { useState, useEffect } from "react";
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
  const isInd = Boolean(hospital?.is_individual_doctor);
  const singleDoc = hospital?.doctor || doctors[0] || null;

  const [patient, setPatient] = useState<PatientIntake | null>(null);
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(() => {
    if (isInd && singleDoc) {
      return (
        departments[0] || {
          id: singleDoc.department_id || "dept-specialty",
          hospital_id: hospital?.id || "",
          name: singleDoc.specialization || singleDoc.department || singleDoc.specialty || "Consultation",
          description: "Direct Practice Consultation",
        }
      );
    }
    return null;
  });
  const [selectedDoc, setSelectedDoc] = useState<DoctorItem | null>(() => (isInd ? singleDoc : null));

  // Ensure individual doctor is always locked
  useEffect(() => {
    if (isInd && singleDoc) {
      setSelectedDoc(singleDoc);
      if (!selectedDept) {
        setSelectedDept(
          departments[0] || {
            id: singleDoc.department_id || "dept-specialty",
            hospital_id: hospital?.id || "",
            name: singleDoc.specialization || singleDoc.department || singleDoc.specialty || "Consultation",
            description: "Direct Practice Consultation",
          }
        );
      }
    }
  }, [isInd, singleDoc, departments]);

  // Helper for current step index (Individual: 1 of 2, Hospital: 1 to 4)
  const totalSteps = isInd ? 2 : 4;
  const getStepNumber = () => {
    if (isInd) {
      return currentScreen === "review" ? 2 : 1;
    }
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
    if (isInd) {
      if (currentScreen === "review") {
        onNavigateScreen("manual-details");
      } else {
        onNavigateScreen("home");
      }
      return;
    }

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
              className={`h-full rounded-full ${isInd ? 'bg-emerald-600' : 'bg-[#007AFF]'}`}
              animate={{ width: `${(getStepNumber() / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className={`text-xs font-bold ${isInd ? 'text-emerald-700' : 'text-[#007AFF]'}`}>
            Step {getStepNumber()} of {totalSteps}
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
                if (isInd) {
                  // Direct bypass: Skip department & doctor selection for individual doctor practice
                  if (singleDoc) setSelectedDoc(singleDoc);
                  onNavigateScreen("review");
                } else {
                  onNavigateScreen("manual-department");
                }
              }}
            />
          </motion.div>
        )}

        {!isInd && currentScreen === "manual-department" && (
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

        {!isInd && currentScreen === "manual-doctor" && (
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

        {currentScreen === "review" && patient && (selectedDoc || singleDoc) && (
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
              doctor={(selectedDoc || singleDoc)!}
              department={selectedDept}
              loading={loading}
              onConfirm={() =>
                onCompleteManualBooking(patient, (selectedDoc || singleDoc)!, selectedDept)
              }
              onEdit={() => onNavigateScreen("manual-details")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
