import { supabase } from "../lib/supabase";
import { DoctorItem, DepartmentItem } from "../types/appointment";

export async function getHospitalDoctors(
  hospitalId: string,
  departmentIdOrName?: string
): Promise<DoctorItem[]> {
  if (!hospitalId) return [];

  try {
    // Primary DB query: strictly scoped by hospital_id
    const { data: dbProfiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("hospital_id", hospitalId)
      .eq("role", "doctor")
      .eq("is_active", true);

    if (!error && dbProfiles && dbProfiles.length > 0) {
      const mapped: DoctorItem[] = dbProfiles.map((p) => ({
        id: p.id,
        hospital_id: p.hospital_id || hospitalId,
        doctor_code: p.doctor_code || `DOC-${p.id.slice(0, 4).toUpperCase()}`,
        name: p.full_name || "Doctor Specialist",
        department_id: p.department || "General",
        department: p.department || "General Medicine",
        specialty: p.specialization || p.department || "Consultant Practitioner",
        fee: p.fee || 500,
        room_number: p.room_number || "Room 101",
        active: p.is_active !== false && p.account_status !== "blocked",
        accepting_appointments: true,
        todayConsults: p.today_consults || 0,
      }));

      let filtered = mapped.filter((d) => d.active);

      if (departmentIdOrName && departmentIdOrName.trim()) {
        const target = departmentIdOrName.toLowerCase().trim();
        filtered = filtered.filter(
          (d) =>
            d.department?.toLowerCase().includes(target) ||
            d.specialty.toLowerCase().includes(target) ||
            d.department_id?.toLowerCase() === target
        );
      }

      return filtered;
    }

    // Fallback query in hospital local storage doctors (multi-tenant key)
    const localKey = `clinicos_hospital_${hospitalId}_doctors`;
    const savedLocal = localStorage.getItem(localKey);
    if (savedLocal) {
      const parsed: any[] = JSON.parse(savedLocal);
      const mapped: DoctorItem[] = parsed.map((d) => ({
        id: d.id,
        hospital_id: hospitalId,
        doctor_code: d.doctor_code || `DOC-${d.id.slice(0, 4)}`,
        name: d.name,
        department_id: d.dept || "General",
        department: d.dept || "General Medicine",
        specialty: d.specialization || "Consultant",
        fee: d.fee || 500,
        room_number: d.room_number || "OPD Room 1",
        active: d.status === "active",
        accepting_appointments: d.status === "active",
      }));

      let filtered = mapped.filter((d) => d.active);
      if (departmentIdOrName && departmentIdOrName.trim()) {
        const target = departmentIdOrName.toLowerCase().trim();
        filtered = filtered.filter(
          (d) =>
            d.department?.toLowerCase().includes(target) ||
            d.specialty.toLowerCase().includes(target)
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
    // Query Supabase departments scoped by hospital_id
    const { data: dbDepts } = await supabase
      .from("departments")
      .select("*")
      .eq("hospital_id", hospitalId);

    if (dbDepts && dbDepts.length > 0) {
      return dbDepts.map((d) => ({
        id: d.id,
        hospital_id: hospitalId,
        name: d.name,
        description: d.description || `OPD Consult Department`,
        is_opd: d.is_opd !== false,
        head_doctor: d.head_doctor,
        avg_wait_mins: d.avg_wait_mins || 15,
      }));
    }

    // Local fallback for hospital departments
    const localKey = `clinicos_hospital_${hospitalId}_departments`;
    const savedLocal = localStorage.getItem(localKey);
    if (savedLocal) {
      const parsed: any[] = JSON.parse(savedLocal);
      return parsed.map((d) => ({
        id: d.id || d.name,
        hospital_id: hospitalId,
        name: d.name,
        description: `OPD Consult Department`,
        is_opd: true,
        avg_wait_mins: d.avgWaitMins || 15,
      }));
    }

    // Extract departments from hospital active doctors list
    const docs = await getHospitalDoctors(hospitalId);
    const deptNames = Array.from(new Set(docs.map((d) => d.department || "General Medicine")));
    
    if (deptNames.length > 0) {
      return deptNames.map((name, i) => ({
        id: `dept-${i + 1}`,
        hospital_id: hospitalId,
        name,
        description: `${name} OPD Consult Department`,
        is_opd: true,
        avg_wait_mins: 15,
      }));
    }
  } catch (err) {
    console.warn("Department service fetch error:", err);
  }

  // Minimum standard department if hospital has no custom setup yet
  return [
    {
      id: "dept-gen",
      hospital_id: hospitalId,
      name: "General Medicine",
      description: "General OPD, primary care, fever, cough & health checkup",
      is_opd: true,
      avg_wait_mins: 15,
    },
  ];
}
