export interface PrescriptionHospitalInfo {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string | null
}

export interface PrescriptionDoctorInfo {
  id: string
  name: string
  qualification?: string
  specialization?: string
  registration_number?: string
  medical_license?: string
  department?: string
  hospital_name?: string
  phone?: string
  email?: string
  signature_url?: string | null
}

export interface PrescriptionPatientInfo {
  id: string
  patient_number: string // Must come from patients.patient_number
  name: string
  phone?: string
  age?: number | string
  gender?: string
  dob?: string
  address?: string
  city?: string
  known_allergies?: string
  known_diseases?: string
  current_medicines?: string
  chief_complaint?: string
}

export interface PrescriptionVitalsInfo {
  bp?: string
  pulse?: string
  temp?: string
  spo2?: string
  weight?: string
  height?: string
  bmi?: string
}

export interface PrescriptionDiagnosisInfo {
  diagnosis: string
  secondary_diagnosis?: string
  clinical_findings?: string
  symptoms?: string
  clinical_notes?: string
  vitals?: PrescriptionVitalsInfo
}

export interface PrescriptionTestItem {
  name: string
  purpose?: string
  notes?: string
  is_urgent?: boolean
}

export interface PrescriptionMedicineItem {
  sr: number
  medicine_name: string
  generic_name?: string
  strength?: string
  dosage_form?: string
  dosage: string
  frequency: string
  duration: string
  route?: string
  instructions?: string
}

export interface PrescriptionAdviceInfo {
  advice_points: string[]
  general_notes?: string
  dietary_advice?: string
}

export interface PrescriptionFollowUpInfo {
  follow_up_date?: string
  purpose?: string
  notes?: string
}

export interface PrescriptionMetadata {
  prescription_id: string
  prescription_number: string // e.g. RX-2026-000124
  appointment_id: string
  consultation_id?: string
  version: number
  status: 'draft' | 'final' | 'revised' | 'cancelled'
  issued_at: string
  issued_date_formatted: string // e.g. 25 Sep 2026
  issued_time_formatted: string // e.g. 10:30 AM
  verification_token: string
  verification_url: string
}

export interface PrescriptionDocumentData {
  metadata: PrescriptionMetadata
  hospital: PrescriptionHospitalInfo
  doctor: PrescriptionDoctorInfo
  patient: PrescriptionPatientInfo
  diagnosis: PrescriptionDiagnosisInfo
  tests: PrescriptionTestItem[]
  medicines: PrescriptionMedicineItem[]
  advice: PrescriptionAdviceInfo
  follow_up?: PrescriptionFollowUpInfo
}
