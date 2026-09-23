export type BookingScreen =
  | "home"
  | "ai-chat"
  | "ai-recommendation"
  | "manual-details"
  | "manual-department"
  | "manual-doctor"
  | "review"
  | "success"
  | "track";

export type BookingMethod = "AI" | "MANUAL" | "Manual" | "QR" | "Online" | "Walk-in";

export interface PatientIntake {
  fullName: string;
  age: number;
  gender?: string;
  contactNumber: string;
  email?: string;
  primaryConcern: string;
  symptoms: string[];
  symptomDuration?: string;
  previousDoctor?: string;
  medications?: string;
  medicalHistory?: string;
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
  client_type?: 'hospital' | 'individual_doctor';
  is_individual_doctor?: boolean;
  clinic?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
  };
  doctor?: DoctorItem | any;
  doctors?: DoctorItem[];
}

export interface DoctorItem {
  id: string;
  hospital_id: string;
  doctor_code: string;
  name: string;
  department_id?: string;
  department?: string;
  specialty: string;
  qualification?: string;
  registration_number?: string;
  fee: number;
  room_number?: string;
  active: boolean;
  accepting_appointments: boolean;
  todayConsults?: number;
  avatar_url?: string;
  clinic_name?: string;
  clinic_address?: string;
  available_days?: string[];
  available_hours?: { start?: string; end?: string };
  slot_duration?: number;
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

export interface BookingResult {
  id: string;
  appointment_id?: string;
  hospital_id: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  hospital_name: string;
  patient_id?: string;
  patient_number?: string;
  patient_name: string;
  patient_phone: string;
  booking_method: BookingMethod;
  token_number: string;
  queue_number?: string;
  tracking_token?: string;
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

export interface AIChatMessage {
  id: string;
  sender: "ai" | "patient";
  text: string;
  timestamp: string;
  stepKey?: "name" | "phone" | "age" | "gender" | "details" | "concern" | "symptoms" | "meds" | "processing";
  quickChips?: string[];
}
