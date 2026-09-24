import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import {
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSEO } from "../hooks/useSEO";
import { getHospitalByTokenOrId } from "../services/hospitalService";
import { HospitalWorkspace } from "../types/booking";
import { LiquidBackground } from "../components/booking/LiquidBackground";
import { HospitalTrackView } from "../components/booking/HospitalTrackView";

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const { trackingToken: pathToken } = useParams<{ trackingToken?: string }>();
  const trackingTokenParam = pathToken || searchParams.get("t") || searchParams.get("token") || "";
  const hospitalParam = searchParams.get("hospital") || searchParams.get("h") || searchParams.get("qr") || "";

  useSEO({
    title: "Track Appointment Status & Live Queue — MedTechFixaters",
    description: "Hospital-scoped live OPD queue tracking, position updates, and turn notifications.",
  });

  const [hospital, setHospital] = useState<HospitalWorkspace | null>(null);
  const [loadingHospital, setLoadingHospital] = useState(true);

  // 1. Resolve Hospital Context from URL parameters or token
  useEffect(() => {
    let isMounted = true;

    async function loadHospitalContext() {
      setLoadingHospital(true);

      const targetIdOrToken = hospitalParam || trackingTokenParam;
      if (targetIdOrToken) {
        const resolved = await getHospitalByTokenOrId(targetIdOrToken);
        if (isMounted && resolved) {
          setHospital(resolved);
          setLoadingHospital(false);
          return;
        }
      }

      // If only tracking token is provided, try fetching live status once to get hospital name & id
      if (trackingTokenParam) {
        try {
          const { data } = await supabase.rpc("get_live_queue_status", {
            p_tracking_token: trackingTokenParam.trim(),
          });
          if (isMounted && data?.success) {
            setHospital({
              id: data.hospital_id || "hospital-id",
              name: data.hospital_name || "Hospital Facility",
              active: true,
            });
          }
        } catch (e) {
          // Ignore
        }
      }

      if (isMounted) {
        setLoadingHospital(false);
      }
    }

    loadHospitalContext();

    return () => {
      isMounted = false;
    };
  }, [hospitalParam, trackingTokenParam]);

  return (
    <div className="min-h-screen w-full font-sans antialiased text-[#1D1D1F] selection:bg-[#007AFF] selection:text-white flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative">
      {/* Ambient Liquid Background */}
      <LiquidBackground />

      <main className="w-full max-w-[620px] mx-auto flex flex-col items-center">
        {loadingHospital ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#007AFF] animate-spin" />
            <span className="text-xs font-semibold text-slate-500">
              Loading hospital tracking context...
            </span>
          </div>
        ) : (
          <HospitalTrackView
            hospital={hospital}
            initialTrackingToken={trackingTokenParam}
            onBackToBooking={() => {
              if (hospital?.qrToken) {
                window.location.href = `/book/${hospital.qrToken}`;
              } else if (hospital?.id) {
                window.location.href = `/book/${hospital.id}`;
              } else {
                window.history.back();
              }
            }}
          />
        )}
      </main>

      {/* Subtle Footer Branding */}
      <footer className="mt-12 text-center text-[11px] text-slate-400 font-medium">
        <span>Powered by </span>
        <strong className="text-slate-600 font-semibold">MedTechFixaters</strong>
        <span> • Live Queue Synchronization</span>
      </footer>
    </div>
  );
}
