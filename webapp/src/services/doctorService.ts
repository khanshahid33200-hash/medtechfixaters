import { supabase } from "../lib/supabase";
import { DoctorItem, DepartmentItem } from "../types/appointment";

export async function getHospitalDoctors(
  hospitalId: string,
  departmentIdOrName?: string
): Promise<DoctorItem[]> {
  if (!hospitalId) return [];

  try {
    // Primary DB query: strictly scoped by hospital_id and active status
    const { data: dbProfiles, error } = await supabase
      .from("profiles")
      .select("id, hospital_id, doctor_code, full_name, department_id, department, specialization, is_active, account_status")
      .eq("hospital_id", hospitalId)
      .eq("role", "doctor")
      .eq("is_active", true);

    if (!error && dbProfiles && dbProfiles.length > 0) {
      const mapped: DoctorItem[] = dbProfiles.map((p) => ({
        id: p.id,
        hospital_id: p.hospital_id || hospitalId,
        doctor_code: p.doctor_code || `DOC-${p.id.slice(0, 4).toUpperCase()}`,
        name: p.full_name || "Doctor Specialist",
        department_id: p.department_id || p.department || "",
        department: p.department || "General Medicine",
        specialty: p.specialization || p.department || "Consultant Practitioner",
        fee: 500,
        room_number: "Room 101",
        active: p.is_active !== false && p.account_status !== "blocked",
        accepting_appointments: true,
      }));

      let filtered = mapped.filter((d) => d.active);

      if (departmentIdOrName && departmentIdOrName.trim()) {
        const target = departmentIdOrName.toLowerCase().trim();
        filtered = filtered.filter(
          (d) =>
            d.department_id?.toLowerCase() === target ||
            d.department?.toLowerCase() === target ||
            d.specialty.toLowerCase() === target
        );
      }

      return filtered;
    }
  } catch (err) {
    console.warn("Doctor service fetch error:", err);
  }

  return [];
}

export async function getHospitalDepartments(
  hospitalId: string
): Promise<DepartmentItem[]> {
  if (!hospitalId) return [];

  try {
    // Query Supabase departments scoped by hospital_id and active status
    const { data: dbDepts, error } = await supabase
      .from("departments")
      .select("id, hospital_id, name, description, avg_wait_mins, is_active")
      .eq("hospital_id", hospitalId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error && dbDepts && dbDepts.length > 0) {
      return dbDepts.map((d) => ({
        id: d.id,
        hospital_id: d.hospital_id || hospitalId,
        name: d.name,
        description: d.description || "Clinical Outpatient Department",
        is_opd: true,
        avg_wait_mins: d.avg_wait_mins || 15,
      }));
    }
  } catch (err) {
    console.warn("Department service fetch error:", err);
  }

  // Strictly return empty array if no departments are configured in Supabase (no demo/mock departments)
  return [];
}
