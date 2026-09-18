import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidBackground } from "./LiquidBackground";
import { HospitalHeader } from "./HospitalHeader";
import { BookingHome } from "./BookingHome";
import { AIBookingFlow } from "./AIBookingFlow";
import { AIRecommendation } from "./AIRecommendation";
import { ManualBookingFlow } from "./ManualBookingFlow";
import { BookingSuccess } from "./BookingSuccess";
import {
  BookingScreen,
  HospitalWorkspace,
  DoctorItem,
  DepartmentItem,
  PatientIntake,
  DoctorRecommendation,
  BookingResult,
} from "../../types/booking";
import { getHospitalByTokenOrId } from "../../services/hospitalService";
import {
  getHospitalDoctors,
  getHospitalDepartments,
} from "../../services/doctorService";
import { createAppointment } from "../../services/appointmentService";

interface BookingShellProps {
  tokenOrId: string;
}

export const BookingShell: React.FC<BookingShellProps> = ({ tokenOrId }) => {
  const [hospital, setHospital] = useState<HospitalWorkspace | null>(null);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Screen State Machine
  const [screen, setScreen] = useState<BookingScreen>("home");

  // Temporary Flow States
  const [patientIntake, setPatientIntake] = useState<PatientIntake | null>(null);
  const [aiRecommendation, setAiRecommendation] =
    useState<DoctorRecommendation | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);

  // Final Result State
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Multi-Tenant Hospital Data strictly by tokenOrId
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      const resolvedHospital = await getHospitalByTokenOrId(tokenOrId);
      const hospId = resolvedHospital?.id || tokenOrId || "default-hosp";

      const [docsData, deptsData] = await Promise.all([
        getHospitalDoctors(hospId),
        getHospitalDepartments(hospId),
      ]);

      if (isMounted) {
        setHospital(
          resolvedHospital || {
            id: hospId,
            name: "Hospital OPD Desk",
            address: "Main Building",
            city: "OPD Center",
            active: true,
          }
        );
        setDoctors(docsData);
        setDepartments(deptsData);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [tokenOrId]);

  // Handle AI Intake Completion -> Show Recommendation Card
  const handleAIIntakeComplete = (
    intake: PatientIntake,
    recommendation: DoctorRecommendation
  ) => {
    setPatientIntake(intake);
    setAiRecommendation(recommendation);

    // Match doctor object from hospital roster if present
    const doc = doctors.find((d) => d.id === recommendation.doctorId) || doctors[0];
    if (doc) setSelectedDoctor(doc);

    setScreen("ai-recommendation");
  };

  // Handle AI Recommendation Final Confirmation -> Create Real Database Token
  const handleConfirmAIRecommendation = async () => {
    if (!hospital || !patientIntake || !aiRecommendation) return;
    setSubmitting(true);

    try {
      const docId = selectedDoctor?.id || aiRecommendation.doctorId;
      if (!docId) {
        throw new Error("No doctor selected for booking.");
      }

      const newAppt = await createAppointment({
        hospitalId: hospital.id,
        doctorId: docId,
        bookingMethod: "AI",
        patientName: patientIntake.fullName,
        patientPhone: patientIntake.contactNumber,
        patientAge: patientIntake.age,
        patientGender: patientIntake.gender || "Male",
        intake: patientIntake as any,
      });

      const res: BookingResult = {
        id: newAppt.id,
        hospital_id: hospital.id,
        doctor_id: docId,
        doctor_name: newAppt.doctor_name,
        department_name: newAppt.department_name,
        hospital_name: newAppt.hospital_name || hospital.name,
        patient_name: newAppt.patient_name,
        patient_phone: newAppt.patient_phone,
        booking_method: "AI",
        token_number: newAppt.token_number,
        queue_position: newAppt.queue_position,
        patients_ahead: newAppt.patients_ahead,
        estimated_wait_mins: newAppt.estimated_wait_mins,
        appointment_date: newAppt.appointment_date,
        created_at: newAppt.created_at,
      };

      setBookingResult(res);
      setScreen("success");
    } catch (err: any) {
      console.error("AI Booking creation error:", err);
      alert(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Manual Booking Final Confirmation -> Create Real Database Token
  const handleConfirmManualBooking = async (
    patient: PatientIntake,
    doc: DoctorItem,
    dept?: DepartmentItem | null
  ) => {
    if (!hospital) return;
    setSubmitting(true);

    try {
      const newAppt = await createAppointment({
        hospitalId: hospital.id,
        doctorId: doc.id,
        bookingMethod: "Manual",
        patientName: patient.fullName,
        patientPhone: patient.contactNumber,
        patientAge: patient.age,
        patientGender: patient.gender || "Male",
        intake: patient as any,
      });

      const res: BookingResult = {
        id: newAppt.id,
        hospital_id: hospital.id,
        doctor_id: doc.id,
        doctor_name: newAppt.doctor_name || doc.name,
        department_name: newAppt.department_name || dept?.name || doc.department || "General OPD",
        hospital_name: newAppt.hospital_name || hospital.name,
        patient_name: newAppt.patient_name,
        patient_phone: newAppt.patient_phone,
        booking_method: "Manual",
        token_number: newAppt.token_number,
        queue_position: newAppt.queue_position,
        patients_ahead: newAppt.patients_ahead,
        estimated_wait_mins: newAppt.estimated_wait_mins,
        appointment_date: newAppt.appointment_date,
        created_at: newAppt.created_at,
      };

      setBookingResult(res);
      setScreen("success");
    } catch (err: any) {
      console.error("Manual Booking creation error:", err);
      alert(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset for another booking
  const handleBookAnother = () => {
    setPatientIntake(null);
    setAiRecommendation(null);
    setSelectedDoctor(null);
    setBookingResult(null);
    setScreen("home");
  };

  return (
    <div className="min-h-screen w-full font-sans antialiased text-[#1D1D1F] selection:bg-[#007AFF] selection:text-white flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative">
      {/* Organic Animated Liquid Background */}
      <LiquidBackground />

      {/* Main Glass Booking Shell (520px - 620px max-width) */}
      <main className="w-full max-w-[620px] mx-auto flex flex-col items-center">
        {/* Hospital Standalone Header */}
        <HospitalHeader hospital={hospital} loading={loading} />

        {/* Content Container */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {screen === "home" && (
              <BookingHome
                key="home"
                hospital={hospital}
                doctors={doctors}
                onSelectAI={() => setScreen("ai-chat")}
                onSelectManual={() => setScreen("manual-details")}
              />
            )}

            {screen === "ai-chat" && (
              <AIBookingFlow
                key="ai-chat"
                hospital={hospital}
                doctors={doctors}
                departments={departments}
                onCompleteAIIntake={handleAIIntakeComplete}
                onBack={() => setScreen("home")}
              />
            )}

            {screen === "ai-recommendation" && aiRecommendation && (
              <AIRecommendation
                key="ai-recommendation"
                recommendation={aiRecommendation}
                matchedDoctor={selectedDoctor || undefined}
                loading={submitting}
                onConfirm={handleConfirmAIRecommendation}
                onChangeDoctor={() => setScreen("manual-doctor")}
                onSwitchManual={() => setScreen("manual-details")}
              />
            )}

            {(screen === "manual-details" ||
              screen === "manual-department" ||
              screen === "manual-doctor" ||
              screen === "review") && (
              <ManualBookingFlow
                key="manual-flow"
                hospital={hospital}
                doctors={doctors}
                departments={departments}
                currentScreen={screen}
                loading={submitting}
                onNavigateScreen={(scr) => setScreen(scr)}
                onCompleteManualBooking={handleConfirmManualBooking}
              />
            )}

            {screen === "success" && bookingResult && (
              <BookingSuccess
                key="success"
                result={bookingResult}
                onBookAnother={handleBookAnother}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
