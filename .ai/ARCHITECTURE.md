# ARCHITECTURE.md - System Architecture

## 1. Frontend Architecture (`webapp/`)
- **Framework:** React with Vite build system.
- **Routing:** React Router DOM (v6) with public routes, patient self-service routes, role-locked login routes, doctor dashboard, and hospital administration dashboard (`/hospitaldashboard/*`).
- **State & Data Management:** React Query (`@tanstack/react-query` / `react-query`), React Context (`AuthContext`), local storage caching.
- **Styling:** Tailwind CSS + custom glassmorphic & modern medical themes.
- **Realtime:** Supabase Realtime subscriptions + WebSocket for live queue updates and display boards.

## 2. Backend Architecture (`clinic_os/`)
- **Framework:** FastAPI (Python) with modular routing (`clinic_os/modules/*`).
- **Core Modules:**
  - `checkin`: Patient intake, WhatsApp/Twilio webhook integration, demographic capture.
  - `booking`: Appointment scheduling, slot management, reminders.
  - `queue_triage`: AI triage scoring, live queue assignment, priority routing.
  - `reports`: Medical document uploads, report generation, dispatch.
  - `followups`: Automated SMS/WhatsApp follow-up triggers.
- **Security Core (`clinic_os/core/`):**
  - JWT Authentication (`security.py`).
  - Field-level encryption using Fernet for PHI (`encryption.py`).
  - Audit logging for HIPAA/compliance (`audit.py`).

## 3. Database Architecture
- **Primary:** Supabase PostgreSQL with Row Level Security (RLS) isolating tenant data by `hospital_id` / `clinic_id`.
- **Local / Fallback:** SQLite `clinic_os.db` for zero-dependency local backend testing.
- **Caching & Broker:** Redis for queue state, pub/sub, rate limiting.

## 4. External Integrations
- **Twilio:** Inbound/outbound SMS and WhatsApp business messaging.
- **AI Triage Engine:** Structured symptom analysis and severity classification.
- **Storage:** Supabase Storage / AWS S3 for patient reports and prescriptions.
