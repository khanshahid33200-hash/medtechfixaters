"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useHospitalDoctors } from "../../hooks/useHospitalDoctors";
import { useAppointmentBooking } from "../../hooks/useAppointmentBooking";
import { BookingChoice } from "./BookingChoice";
import { AIBookingFlow } from "./AIBookingFlow";
import { AIRecommendation } from "./AIRecommendation";
import { ManualBookingFlow } from "./ManualBookingFlow";
import { AppointmentConfirmation } from "./AppointmentConfirmation";
import { LiveQueueCard } from "./LiveQueueCard";
import { Loader2, AlertCircle, Building2, Stethoscope } from "lucide-react";

interface Props {
  tokenOrId: string;
}

export function AppointmentLanding({ tokenOrId }: Props) {
  const { loading, error: loadError, hospital, doctors, departments } = useHospitalDoctors(tokenOrId);

  const {
    mode,
    setMode,
    bookingMethod,
    intake,
    recommendation,
    selectedDepartment,
    setSelectedDepartment,
    selectedDoctor,
    setSelectedDoctor,
    confirmedResult,
    isProcessingAI,
    isSubmitting,
    error: bookingError,
    startAIBooking,
    startManualBooking,
    processAIRouting,
    confirmAppointment,
    resetBooking,
  } = useAppointmentBooking(hospital?.id || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 max-w-sm w-full text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Loading Appointment Portal...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Resolving hospital workspace & active doctor list.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">
              Hospital Portal Unavailable
            </h3>
            <p className="text-xs text-rose-600 font-semibold mt-1">
              {loadError || "Invalid or unassigned QR code token."}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Please verify the scanned QR code or contact the hospital reception desk for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-orange-500 selection:text-white py-6 sm:py-10 px-4 sm:px-6">
      {bookingError && (
        <div className="max-w-xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-rose-500" />
          <span>{bookingError}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* MODE 1: CHOICE LANDING */}
        {mode === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.22 }}
          >
            <BookingChoice
              hospital={hospital}
              onAI={startAIBooking}
              onManual={startManualBooking}
            />
          </motion.div>
        )}

        {/* MODE 2: AI BOOKING CHAT FLOW */}
        {mode === "ai" && (
          <motion.div
            key="ai-booking"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
          >
            <AIBookingFlow
              hospital={hospital}
              doctors={doctors}
              departments={departments}
              onManualBooking={startManualBooking}
              onCompleteIntake={(finalIntake) =>
                processAIRouting(finalIntake, doctors, departments)
              }
              isProcessing={isProcessingAI}
            />
          </motion.div>
        )}

        {/* MODE 3: AI RECOMMENDATION CARD */}
        {mode === "recommendation" && recommendation && (
          <motion.div
            key="ai-recommendation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <AIRecommendation
              recommendation={recommendation}
              hospital={hospital}
              selectedDoctor={selectedDoctor}
              onConfirm={() => setMode("confirmation")}
              onChangeDoctor={() => setMode("manual")}
              onSwitchManual={startManualBooking}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}

        {/* MODE 4: MANUAL BOOKING FLOW */}
        {mode === "manual" && (
          <motion.div
            key="manual-booking"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22 }}
          >
            <ManualBookingFlow
              hospital={hospital}
              departments={departments}
              doctors={doctors}
              onSelectDoctorAndSubmit={(info, dept, doc) => {
                setSelectedDepartment(dept);
                setSelectedDoctor(doc);
                setMode("confirmation");
              }}
              onBackToChoice={() => setMode("choice")}
            />
          </motion.div>
        )}

        {/* MODE 5: APPOINTMENT CONFIRMATION */}
        {mode === "confirmation" && selectedDoctor && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22 }}
          >
            <AppointmentConfirmation
              hospital={hospital}
              doctor={selectedDoctor}
              department={selectedDepartment}
              patientInfo={intake}
              bookingMethod={bookingMethod}
              onConfirm={confirmAppointment}
              onBack={() => setMode(bookingMethod === "AI" ? "recommendation" : "manual")}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}

        {/* MODE 6: LIVE QUEUE TOKEN SUCCESS CARD */}
        {mode === "success" && confirmedResult && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <LiveQueueCard
              result={confirmedResult}
              hospital={hospital}
              onTrackQueue={() => {
                window.location.href = `/track?token=${confirmedResult.token_number}&hosp=${hospital.id}`;
              }}
              onReset={resetBooking}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
