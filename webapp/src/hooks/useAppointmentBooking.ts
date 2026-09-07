import { useState } from "react";
import {
  BookingMode,
  BookingMethod,
  PatientIntake,
  DoctorRecommendation,
  DoctorItem,
  DepartmentItem,
  AppointmentResult,
} from "../types/appointment";
import { routePatientWithAI } from "../services/aiRoutingService";
import { createAppointment } from "../services/appointmentService";

export function useAppointmentBooking(hospitalId: string) {
  const [mode, setMode] = useState<BookingMode>("choice");
  const [bookingMethod, setBookingMethod] = useState<BookingMethod>("AI");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intake State
  const [intake, setIntake] = useState<PatientIntake>({
    fullName: "",
    age: 30,
    gender: "Male",
    email: "",
    contactNumber: "",
    primaryConcern: "",
    symptoms: [],
    symptomDuration: "1-2 days",
  });

  // Selection & Recommendation State
  const [recommendation, setRecommendation] = useState<DoctorRecommendation | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [confirmedResult, setConfirmedResult] = useState<AppointmentResult | null>(null);

  const startAIBooking = () => {
    setBookingMethod("AI");
    setError(null);
    setMode("ai");
  };

  const startManualBooking = () => {
    setBookingMethod("MANUAL");
    setError(null);
    setMode("manual");
  };

  const processAIRouting = async (
    patientIntake: PatientIntake,
    doctors: DoctorItem[],
    departments: DepartmentItem[]
  ) => {
    setIsProcessingAI(true);
    setError(null);

    try {
      setIntake(patientIntake);
      const rec = await routePatientWithAI(patientIntake, doctors, departments);
      setRecommendation(rec);

      // Also set the recommended doctor as the selected doctor
      const recDoctor = doctors.find((d) => d.id === rec.doctorId);
      if (recDoctor) setSelectedDoctor(recDoctor);

      setMode("recommendation");
    } catch (err: any) {
      setError(err.message || "Unable to route appointment automatically. Please proceed with manual booking.");
      setMode("manual");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const confirmAppointment = async () => {
    if (!hospitalId || !selectedDoctor) {
      setError("Please select a doctor to confirm your appointment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createAppointment({
        hospitalId,
        doctorId: selectedDoctor.id,
        bookingMethod,
        patientName: intake.fullName || "Patient",
        patientPhone: intake.contactNumber || "9876543210",
        patientAge: intake.age,
        patientGender: intake.gender,
        patientEmail: intake.email,
        intake: bookingMethod === "AI" ? intake : undefined,
      });

      setConfirmedResult(result);
      setMode("success");
    } catch (err: any) {
      setError(err.message || "Failed to confirm appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setMode("choice");
    setBookingMethod("AI");
    setRecommendation(null);
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setConfirmedResult(null);
    setError(null);
  };

  return {
    mode,
    setMode,
    bookingMethod,
    intake,
    setIntake,
    recommendation,
    selectedDepartment,
    setSelectedDepartment,
    selectedDoctor,
    setSelectedDoctor,
    confirmedResult,
    isProcessingAI,
    isSubmitting,
    error,
    setError,
    startAIBooking,
    startManualBooking,
    processAIRouting,
    confirmAppointment,
    resetBooking,
  };
}
