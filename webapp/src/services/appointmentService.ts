import { supabase } from "../lib/supabase";
import { AppointmentPayload, AppointmentResult } from "../types/appointment";
import { getHospitalDoctors } from "./doctorService";
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
  } = payload;

  if (!hospitalId || !doctorId) {
    throw new Error("Invalid appointment submission: Missing hospital or doctor selection.");
  }

  // 1. Verify doctor belongs to the scanned hospital and is active
  const hospitalDocs = await getHospitalDoctors(hospitalId);
  const selectedDoctor = hospitalDocs.find((d) => d.id === doctorId);

  if (!selectedDoctor) {
    throw new Error("Selected practitioner does not belong to this hospital facility or is currently inactive.");
  }

  const deptName = selectedDoctor.department || "General Medicine";
  const doctorName = selectedDoctor.name;
  const apptDate = payload.appointmentDate || new Date().toISOString().split("T")[0];

  // 2. Safely calculate live queue position for this doctor today
  let queuePos = 1;
  let tokenNum = "A-001";

  try {
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .eq("doctor_id", doctorId)
      .eq("appointment_date", apptDate);

    queuePos = (count || 0) + 1;
    const prefix = deptName.slice(0, 1).toUpperCase() || "A";
    tokenNum = `${prefix}-${queuePos.toString().padStart(3, "0")}`;
  } catch (err) {
    // Local storage queue counter fallback
    const queueKey = `clinicos_hospital_${hospitalId}_queues`;
    try {
      const existingQueues: any[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
      const docQueues = existingQueues.filter((q) => q.doctor_id === doctorId);
      queuePos = docQueues.length + 1;
      const prefix = deptName.slice(0, 1).toUpperCase() || "A";
      tokenNum = `${prefix}-${queuePos.toString().padStart(3, "0")}`;
    } catch {
      queuePos = Math.floor(Math.random() * 5) + 1;
      tokenNum = `A-0${queuePos}`;
    }
  }

  const patientsAhead = Math.max(0, queuePos - 1);
  const estimatedWaitMins = patientsAhead * 12 + 10;
  const apptId = `apt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  // 3. Prepare AI intake summary if booking method is AI
  const aiIntakeSummary = intake
    ? {
        primary_concern: intake.primaryConcern,
        symptoms: intake.symptoms || [],
        symptom_duration: intake.symptomDuration || "1-2 days",
        medications: intake.medications || "None reported",
        recommended_department: deptName,
        recommended_doctor: doctorName,
      }
    : undefined;

  // 4. Save to Supabase appointments table
  try {
    await supabase.from("appointments").insert([
      {
        id: apptId,
        hospital_id: hospitalId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        department_name: deptName,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_age: patientAge ? Number(patientAge) : null,
        patient_gender: patientGender || "Other",
        booking_method: bookingMethod,
        token_number: tokenNum,
        queue_position: queuePos,
        status: "Waiting",
        appointment_date: apptDate,
        fee: selectedDoctor.fee || 500,
        ai_intake_summary: aiIntakeSummary ? JSON.stringify(aiIntakeSummary) : null,
      },
    ]);
  } catch (err) {
    console.warn("Supabase appointment save notice:", err);
  }

  // 5. Save to local hospital queues store for real-time doctor & admin dashboard sync
  try {
    const queueKey = `clinicos_hospital_${hospitalId}_queues`;
    const existingQueues: any[] = JSON.parse(localStorage.getItem(queueKey) || "[]");
    const newQueueItem = {
      id: apptId,
      hospital_id: hospitalId,
      token_number: tokenNum,
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_age: patientAge,
      patient_gender: patientGender,
      doctor_id: doctorId,
      doctor_name: doctorName,
      department: deptName,
      fee: selectedDoctor.fee || 500,
      status: "Waiting",
      created_at: new Date().toISOString(),
      booking_method: bookingMethod,
      ai_intake_summary: aiIntakeSummary,
    };

    existingQueues.unshift(newQueueItem);
    localStorage.setItem(queueKey, JSON.stringify(existingQueues));

    // Also sync to global clinic OS queues
    const globalQueues: any[] = JSON.parse(localStorage.getItem("clinicos_queues") || "[]");
    globalQueues.unshift(newQueueItem);
    localStorage.setItem("clinicos_queues", JSON.stringify(globalQueues));
  } catch (err) {
    console.warn("Local queue sync notice:", err);
  }

  // 6. Save AI intake data if applicable
  if (bookingMethod === "AI" && intake) {
    try {
      await supabase.from("ai_booking_intakes").insert([
        {
          hospital_id: hospitalId,
          patient_name: patientName,
          patient_phone: patientPhone,
          primary_concern: intake.primaryConcern,
          symptoms: intake.symptoms?.join(", "),
          symptom_duration: intake.symptomDuration,
          recommended_department_id: deptName,
          recommended_doctor_id: doctorId,
          patient_confirmed: true,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {}
  }

  return {
    id: apptId,
    hospital_id: hospitalId,
    doctor_id: doctorId,
    doctor_name: doctorName,
    department_name: deptName,
    hospital_name: selectedDoctor.department || "Hospital Facility",
    patient_name: patientName,
    patient_phone: patientPhone,
    booking_method: bookingMethod,
    token_number: tokenNum,
    queue_position: queuePos,
    patients_ahead: patientsAhead,
    estimated_wait_mins: estimatedWaitMins,
    appointment_date: apptDate,
    created_at: new Date().toISOString(),
    ai_intake_summary: aiIntakeSummary,
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
