# CHANGELOG.md - Project Change History

### 2026-09-18
- **Doctor Onboarding & Department Architecture Fix:**
  - Updated `HospitalDepartmentsPage.tsx` to insert, update, deactivate, and read departments live from Supabase scoped strictly by `hospital_id`.
  - Updated `HospitalDoctorsPage.tsx` to load live active departments for doctor onboarding, enforce mandatory `department_id` selection, and added doctor department reassignment.
  - Enhanced `admin-ops` Edge Function with `department_id` verification, hospital-scope validation, and `update_doctor_department` action.
  - Added Supabase migration `08_departments_and_doctor_onboarding.sql` enabling full CRUD RLS on `public.departments` for hospital administrators and updating the `handle_new_user` auth trigger to store `department_id`.
  - Updated `doctorService.ts` and `DoctorSelection.tsx` to remove hardcoded demo department fallbacks and ensure strict hospital department filtering during QR appointment booking.
  - Updated `DoctorDashboardLayout.tsx` and `AuthContext.tsx` to display real doctor department from Supabase.
- Initialized **Antigravity AI Brain System (v1.0)** with complete persistent memory structure in `.ai/`.
- Started and verified local development servers on `localhost:3000` (React/Vite) and `localhost:8000` (FastAPI).
- **Patient Booking → Real Supabase Queue → Doctor Dashboard Fix:**
  - **Eliminated Fake/Demo Tokens (Bug 1):** Removed all fake/demo token generation (`A-013`, `M-007`, `Math.random()`, `localStorage`). Frontend now retrieves real token numbers and tracking tokens exclusively from Supabase RPC `book_qr_appointment`.
  - **Live Doctor Queue Sync (Bug 2):** Fixed column mismatch in `APPOINTMENT_SELECT` query (`consultation_fee`), aligned RPC parameter bindings (`p_qr_token` and `p_hospital_id`), and migrated `Appointments.tsx` to live Supabase data querying and real-time subscription (`subscribeToDoctorAppointments`).
  - **Atomic Queue Calculation:** Refactored `book_qr_appointment` with row-level locks on `(doctor_id, appointment_date)` to calculate exact sequential tokens and queue numbers atomically in Postgres.
  - **Validation:** Verified full TypeScript and Vite build passes with zero errors.
