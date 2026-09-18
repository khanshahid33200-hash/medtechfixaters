export type BookingMethod = "AI" | "MANUAL" | "Manual" | "QR" | "Online" | "Walk-in";

export type BookingMode = "choice" | "ai" | "manual" | "recommendation" | "confirmation" | "success";

export interface BookingSession {
  hospitalId: string;
  token?: string;
  patientId?: string;
  bookingMethod: BookingMethod;
}

export interface PatientIntake {
  fullName: string;
  age: number;
  gender?: string;
  email: string;
  contactNumber: string;
  primaryConcern: string;
  symptoms: string[];
  symptomDuration?: string;
  severity?: "Mild" | "Moderate" | "Severe";
  previousDoctor?: string;
  medications?: string;
  medicalHistory?: string;
  allergies?: string;
}

export interface DoctorRecommendation {
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  explanation: string;
  availability: string;
  fee?: number;
}

export interface AppointmentPayload {
  hospitalId: string;
  doctorId: string;
  patientId?: string;
  departmentId?: string;
  bookingMethod: BookingMethod;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  patientEmail?: string;
  intake?: PatientIntake;
  appointmentDate?: string;
}

export interface HospitalWorkspace {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  license?: string;
  qrToken?: string;
  active: boolean;
}

export interface DoctorItem {
  id: string;
  hospital_id: string;
  doctor_code: string;
  name: string;
  department_id?: string;
  department?: string;
  specialty: string;
  specialization?: string;
  fee: number;
  room_number?: string;
  room?: string;
  active: boolean;
  accepting_appointments: boolean;
  todayConsults?: number;
  avatar_url?: string;
}

export interface DepartmentItem {
  id: string;
  hospital_id: string;
  name: string;
  description?: string;
  is_opd?: boolean;
  head_doctor?: string;
  avg_wait_mins?: number;
}

export interface AppointmentResult {
  id: string;
  hospital_id: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  hospital_name: string;
  patient_name: string;
  patient_phone: string;
  booking_method: BookingMethod;
  token_number: string;
  queue_position: number;
  patients_ahead: number;
  estimated_wait_mins: number;
  appointment_date: string;
  created_at: string;
  ai_intake_summary?: {
    primary_concern: string;
    symptoms: string[];
    symptom_duration?: string;
    medications?: string;
    recommended_department: string;
    recommended_doctor: string;
  };
}

export interface ChatMessageItem {
  id: string;
  sender: "ai" | "user" | "system";
  text: string;
  timestamp: string;
  stepKey?: "name" | "details" | "concern" | "symptoms" | "meds" | "processing";
}
