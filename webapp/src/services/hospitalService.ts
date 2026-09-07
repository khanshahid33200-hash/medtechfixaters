import { supabase } from "../lib/supabase";
import { HospitalWorkspace } from "../types/appointment";

export async function getHospitalByTokenOrId(tokenOrId: string): Promise<HospitalWorkspace | null> {
  const clean = (tokenOrId || "").trim();
  if (!clean) return null;

  try {
    // 1. Try RPC get_qr_booking_info
    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_qr_booking_info", {
      p_token: clean,
    });

    if (!rpcErr && rpcData?.success && rpcData?.hospital) {
      const h = rpcData.hospital;
      return {
        id: h.id,
        name: h.name || "Hospital Facility",
        address: h.address || "Main OPD Building",
        city: h.city || h.location || "Central Facility",
        phone: h.phone || "",
        email: h.email || "",
        license: h.license || "",
        qrToken: clean,
        active: true,
      };
    }

    // 2. Direct query on qr_codes join hospitals
    const { data: qrData } = await supabase
      .from("qr_codes")
      .select("*, hospitals(*)")
      .eq("token", clean)
      .maybeSingle();

    if (qrData?.hospitals) {
      const h = qrData.hospitals;
      return {
        id: h.id,
        name: h.name,
        address: h.address || "Main OPD Building",
        city: h.city || "Central Facility",
        phone: h.phone || "",
        email: h.email || "",
        license: h.license || "",
        qrToken: clean,
        active: h.status === "active",
      };
    }

    // 3. Direct query on hospitals table by id
    const { data: hospData } = await supabase
      .from("hospitals")
      .select("*")
      .eq("id", clean)
      .maybeSingle();

    if (hospData) {
      return {
        id: hospData.id,
        name: hospData.name,
        address: hospData.address || "Main OPD Building",
        city: hospData.city || "Central Facility",
        phone: hospData.phone || "",
        email: hospData.email || "",
        license: hospData.license || "",
        qrToken: clean,
        active: hospData.status === "active",
      };
    }

    // 4. Local registry fallback check (sourced from /mrshahidbabu)
    const localHospsRaw = localStorage.getItem("clinicos_hospitals");
    if (localHospsRaw) {
      const localHosps: any[] = JSON.parse(localHospsRaw);
      const matched = localHosps.find(
        (h) =>
          h.id === clean ||
          h.qr_token === clean ||
          h.intake_token === clean ||
          h.name?.toLowerCase().includes(clean.toLowerCase())
      );
      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          address: matched.address || "Main OPD Building",
          city: matched.location || "Central Facility",
          phone: matched.phone || "",
          email: matched.email || "",
          license: matched.license || "",
          qrToken: matched.qr_token || clean,
          active: matched.status === "active",
        };
      }
    }
  } catch (err) {
    console.warn("Hospital service fetch error:", err);
  }

  return null;
}
