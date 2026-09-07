import { useParams, useSearchParams } from "react-router-dom";
import { BookingShell } from "../components/booking/BookingShell";
import { useSEO } from "../hooks/useSEO";

export default function AppointmentBookingPage() {
  const { hospitalId, token } = useParams();
  const [searchParams] = useSearchParams();

  const tokenOrId =
    hospitalId ||
    token ||
    searchParams.get("token") ||
    searchParams.get("t") ||
    searchParams.get("hosp_id") ||
    searchParams.get("hospital_id") ||
    "";

  useSEO({
    title: "Hospital Appointment Booking — MedTech Fixaters Digital Reception",
    description:
      "Apple-inspired Liquid Glass QR appointment booking system. Book OPD appointments via AI-assisted symptom guidance or direct doctor roster selection.",
  });

  return <BookingShell tokenOrId={tokenOrId} />;
}
