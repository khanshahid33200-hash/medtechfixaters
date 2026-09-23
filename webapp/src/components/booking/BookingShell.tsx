import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidBackground } from "./LiquidBackground";
import { HospitalHeader } from "./HospitalHeader";
import { BookingHome } from "./BookingHome";
import { AIBookingFlow } from "./AIBookingFlow";
import { AIRecommendation } from "./AIRecommendation";
import { ManualBookingFlow } from "./ManualBookingFlow";
import { BookingSuccess } from "./BookingSuccess";
import { HospitalTrackView } from "./HospitalTrackView";
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
  const [trackInitialToken, setTrackInitialToken] = useState<string>("");

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

      let docsData: DoctorItem[] = [];
      let deptsData: DepartmentItem[] = [];

      if (
        resolvedHospital?.is_individual_doctor &&
        (resolvedHospital.doctor || (resolvedHospital.doctors && resolvedHospital.doctors.length > 0))
      ) {
        const rawDoc: any = resolvedHospital.doctor || resolvedHospital.doctors?.[0];
        if (rawDoc) {
          const singleDoc: DoctorItem = {
            id: rawDoc.id,
            hospital_id: hospId,
            doctor_code: rawDoc.doctor_code || `DOC-${rawDoc.id?.slice(0, 4).toUpperCase() || '01'}`,
            name: rawDoc.name || "Doctor Specialist",
            department_id: rawDoc.department_id || rawDoc.department || "dept-practice",
            department: rawDoc.department || rawDoc.specialization || "Consultation",
            specialty: rawDoc.specialization || rawDoc.department || "Consultant Practitioner",
            qualification: rawDoc.qualification,
            registration_number: rawDoc.registration_number,
            fee: rawDoc.fee || 500,
            room_number: rawDoc.room || "Consultation Room",
            active: true,
            accepting_appointments: true,
            clinic_name: rawDoc.clinic_name || resolvedHospital.name,
            clinic_address: rawDoc.clinic_address || resolvedHospital.address,
            available_days: rawDoc.available_days,
            available_hours: rawDoc.available_hours,
            slot_duration: rawDoc.slot_duration,
          };
          docsData = [singleDoc];
          deptsData = [
            {
              id: singleDoc.department_id || "dept-practice",
              hospital_id: hospId,
              name: singleDoc.specialty || singleDoc.department || "Consultation",
              description: `Direct consultation with ${singleDoc.name}`,
              is_opd: true,
              avg_wait_mins: 15,
            },
          ];
          setSelectedDoctor(singleDoc);
        }
      } else {
        const [dList, deptList] = await Promise.all([
          getHospitalDoctors(hospId),
          getHospitalDepartments(hospId),
        ]);
        docsData = dList;
        deptsData = deptList;
      }

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
        patient_id: newAppt.patient_id,
        patient_number: newAppt.patient_number,
        patient_name: newAppt.patient_name,
        patient_phone: newAppt.patient_phone,
        booking_method: "AI",
        token_number: newAppt.token_number,
        queue_number: newAppt.queue_number,
        tracking_token: newAppt.tracking_token,
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
        patient_id: newAppt.patient_id,
        patient_number: newAppt.patient_number,
        patient_name: newAppt.patient_name,
        patient_phone: newAppt.patient_phone,
        booking_method: "Manual",
        token_number: newAppt.token_number,
        queue_number: newAppt.queue_number,
        tracking_token: newAppt.tracking_token,
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
    if (!hospital?.is_individual_doctor) {
      setSelectedDoctor(null);
    }
    setBookingResult(null);
    setScreen("home");
  };

  return (
    <div className="min-h-screen w-full font-sans antialiased text-[#1D1D1F] selection:bg-[#007AFF] selection:text-white flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative">
      {/* Organic Animated Liquid Background */}
      <LiquidBackground />

      {/* Main Glass Booking Shell (520px - 620px max-width) */}
      <main className="w-full max-w-[620px] mx-auto flex flex-col items-center">
        {/* Hospital / Clinic Standalone Header */}
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
                onTrackStatus={() => {
                  setTrackInitialToken("");
                  setScreen("track");
                }}
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
                isIndividualDoctor={Boolean(hospital?.is_individual_doctor)}
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
                onTrackAppointment={(token) => {
                  setTrackInitialToken(token);
                  setScreen("track");
                }}
              />
            )}

            {screen === "track" && (
              <HospitalTrackView
                key="track"
                hospital={hospital}
                initialTrackingToken={trackInitialToken}
                onBackToBooking={() => setScreen("home")}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
