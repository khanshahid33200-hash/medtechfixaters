import { supabase } from "../lib/supabase";
import { AppointmentPayload, AppointmentResult } from "../types/appointment";
import { logActivity } from "./auditLogService";
import { APPT_STATUS } from "../hooks/useDashboardStats";

// ============================================================================
// PUBLIC SELF-SERVICE BOOKING (QR / website intake flow) — pre-existing,
// unchanged by Phase 4. Left exactly as it was.
// ============================================================================

export async function createAppointment(
  payload: AppointmentPayload
): Promise<AppointmentResult> {
  const {
    hospitalId,
    doctorId,
    bookingMethod,
    patientName,
    patientPhone,
    patientAge,
    patientGender,
    intake,
    appointmentDate,
    appointmentTime,
  } = payload;

  if (!hospitalId || !doctorId) {
    throw new Error("Invalid appointment submission: Missing hospital or doctor selection.");
  }

  const apptDate = appointmentDate || new Date().toISOString().split("T")[0];
  const symptomsStr = intake
    ? [intake.primaryConcern, Array.isArray(intake.symptoms) ? intake.symptoms.join(", ") : ""]
        .filter(Boolean)
        .join(" — ")
    : undefined;

  // 1. Execute Atomic RPC Transaction in Supabase
  const { data, error } = await supabase.rpc("book_qr_appointment", {
    p_hospital_id: hospitalId,
    p_doctor_id: doctorId,
    p_patient_name: patientName.trim(),
    p_patient_phone: patientPhone.trim(),
    p_patient_age: patientAge ? Number(patientAge) : 30,
    p_patient_gender: patientGender || "Other",
    p_symptoms: symptomsStr || null,
    p_appointment_date: apptDate,
    p_appointment_time: appointmentTime || "09:00 AM",
    p_booking_method: bookingMethod?.toUpperCase() === "AI" ? "AI" : "Manual",
  });

  if (error) {
    console.error("Supabase book_qr_appointment RPC error:", error);
    throw new Error(error.message || "Failed to book appointment in database.");
  }

  if (!data || !data.success) {
    throw new Error(data?.error || "Appointment booking was rejected by database.");
  }

  return {
    id: data.appointment_id,
    hospital_id: data.hospital_id || hospitalId,
    doctor_id: data.doctor_id || doctorId,
    doctor_name: data.doctor_name,
    department_name: data.department || data.department_name || "General OPD",
    hospital_name: data.hospital_name || "Hospital Facility",
    patient_id: data.patient_id,
    patient_number: data.patient_number,
    patient_name: data.patient_name || patientName,
    patient_phone: data.patient_phone || patientPhone,
    booking_method: data.booking_method || bookingMethod,
    token_number: data.queue_number || String(data.token_number),
    queue_number: data.queue_number,
    tracking_token: data.tracking_token || data.queue_number,
    queue_position: data.queue_position || data.token_number || 1,
    patients_ahead: data.patients_ahead ?? Math.max(0, (data.token_number || 1) - 1),
    estimated_wait_mins: data.estimated_wait_mins ?? ((data.patients_ahead ?? 0) * 12 + 10),
    appointment_date: data.appointment_date || apptDate,
    created_at: new Date().toISOString(),
  };
}

// ============================================================================
// HOSPITAL ADMIN DASHBOARD — Appointments module (Phase 4). Operates on the
// real public.appointments columns (queue_number, token_number, status enum)
// rather than the ad-hoc fields the public booking flow above writes under
// its own local-storage-backed path.
// ============================================================================

export type AppointmentStatus = (typeof APPT_STATUS)[keyof typeof APPT_STATUS];

export interface AppointmentRow {
  id: string;
  hospital_id: string;
  doctor_id: string;
  department_id: string | null;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  patient_gender: string | null;
  appointment_date: string;
  queue_number: string;
  token_number: number | null;
  status: string;
  booking_method: "AI" | "Manual";
  symptoms: string | null;
  is_emergency: boolean;
  created_at: string;
  doctor?: { id: string; full_name: string; department: string | null };
  department?: { id: string; name: string } | null;
}

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  departmentId?: string;
  status?: string;
  search?: string;
}

export async function fetchAppointments(hospitalId: string, filters: AppointmentFilters = {}): Promise<AppointmentRow[]> {
  let query = supabase
    .from("appointments")
    .select("*, doctor:profiles!appointments_doctor_id_fkey(id, full_name, department), department:departments(id, name)")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });

  if (filters.date) query = query.eq("appointment_date", filters.date);
  if (filters.doctorId) query = query.eq("doctor_id", filters.doctorId);
  if (filters.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query.limit(500);
  if (error) {
    console.warn("fetchAppointments error:", error.message);
    return [];
  }
  let rows = (data || []) as AppointmentRow[];
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.patient_name?.toLowerCase().includes(q) || r.patient_phone?.includes(q) || r.queue_number?.toLowerCase().includes(q)
    );
  }
  return rows;
}

export async function createManualAppointment(params: {
  doctorId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  departmentId?: string;
  symptoms?: string;
  isEmergency?: boolean;
  appointmentDate?: string;
}) {
  const { data, error } = await supabase.rpc("create_manual_appointment", {
    p_doctor_id: params.doctorId,
    p_patient_name: params.patientName,
    p_patient_phone: params.patientPhone,
    p_patient_age: params.patientAge ?? null,
    p_patient_gender: params.patientGender ?? null,
    p_department_id: params.departmentId ?? null,
    p_symptoms: params.symptoms ?? null,
    p_is_emergency: params.isEmergency ?? false,
    p_appointment_date: params.appointmentDate ?? new Date().toISOString().split("T")[0],
  });
  if (error) throw new Error(error.message);
  const result = data as { success: boolean; error?: string; queue_number?: string; appointment_id?: string };
  if (!result.success) throw new Error(result.error || "Could not create appointment.");
  return result;
}

const STATUS_LOG_LABEL: Record<string, string> = {
  [APPT_STATUS.WAITING]: "Appointment Set to Waiting",
  [APPT_STATUS.IN_CONSULTATION]: "Appointment Called In",
  [APPT_STATUS.COMPLETED]: "Appointment Completed",
  [APPT_STATUS.CANCELLED]: "Appointment Cancelled",
  [APPT_STATUS.NO_SHOW]: "Appointment Marked Missed",
};

export async function updateAppointmentStatus(appointmentId: string, status: string, patientLabel: string) {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw new Error(error.message);
  await logActivity({
    category: "Appointments",
    action: STATUS_LOG_LABEL[status] || `Status changed to ${status}`,
    targetType: "appointment",
    targetId: appointmentId,
    targetLabel: patientLabel,
    metadata: { new_status: status },
  });
}

export async function rescheduleAppointment(appointmentId: string, newDate: string, patientLabel: string) {
  const { error } = await supabase.from("appointments").update({ appointment_date: newDate }).eq("id", appointmentId);
  if (error) throw new Error(error.message);
  await logActivity({
    category: "Appointments",
    action: "Appointment Rescheduled",
    targetType: "appointment",
    targetId: appointmentId,
    targetLabel: patientLabel,
    metadata: { new_date: newDate },
  });
}
