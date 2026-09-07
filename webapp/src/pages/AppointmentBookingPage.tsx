import { useParams, useSearchParams } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import { AppointmentLanding } from "../components/appointment/AppointmentLanding";
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
    title: "Book Hospital Appointment — MedTech Fixaters AI & Manual QR System",
    description:
      "Book OPD appointments via AI-assisted symptom guidance or manual doctor selection with live queue token tracking.",
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      <PublicHeader />
      <div className="pt-24 sm:pt-28 pb-12 flex-1">
        <AppointmentLanding tokenOrId={tokenOrId} />
      </div>
      <PublicFooter />
    </div>
  );
}
