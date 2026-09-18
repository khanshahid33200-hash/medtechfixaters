# DATABASE.md - Database Architecture & Schema Conventions

## 1. Database Providers
- **Production / Cloud:** Supabase PostgreSQL with RLS enabled.
- **Local Dev Fallback:** SQLite `clinic_os.db` (SQLAlchemy async/sync).

## 2. Primary Entities & Tables

### Multi-Tenancy & Auth
- `clinics` / `hospitals`: Hospital tenant profiles (`id`, `name`, `subdomain`, `phone`, `email`, `settings`).
- `users` / `staff`: Staff and doctor accounts (`id`, `hospital_id`, `email`, `role`, `department_id`, `status`).
- `doctors`: Doctor profiles, specialties, consultation charges, room assignments, active schedule.

### Patients & Intake
- `patients`: Patient master records (`id`, `hospital_id`, `name`, `phone`, `age`, `gender`, `encrypted_medical_history`, `encrypted_allergies`, `encrypted_medications`).
- `checkins`: Walk-in / QR intake sessions (`id`, `patient_id`, `clinic_id`, `symptoms`, `severity`, `source`, `status`).

### Appointments & Queue
- `appointments`: Scheduled visits (`id`, `patient_id`, `doctor_id`, `hospital_id`, `appointment_time`, `status`, `type`).
- `appointment_slots`: Availability time blocks for doctor booking.
- `queue_entries`: Live OPD queue (`id`, `patient_id`, `doctor_id`, `queue_number`, `priority_score`, `triage_level`, `status`, `called_at`).

### Consultations, Prescriptions & Reports
- `consultations`: Doctor visit notes, diagnosis, vitals.
- `prescriptions`: Digital Rx, medication instructions, dosage.
- `reports`: Lab results, imaging attachments, document metadata.
- `audit_logs`: Security and access audit entries for PHI compliance.

## 3. Database Conventions
- Multi-tenancy: Every query must filter by `hospital_id` or `clinic_id`.
- PHI Encryption: Medical history, allergies, and current medications are encrypted via Fernet before storing.
- Migrations: Managed via Alembic in `migrations/versions/` and Supabase SQL in `supabase/migrations/`.
