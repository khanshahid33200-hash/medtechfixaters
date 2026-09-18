# PROJECT.md - Project Overview

- **Project Name:** Clinic OS / Medtech Fixaters Clinical Operating System
- **Purpose:** Full-stack healthcare management, patient workflow automation, digital reception, AI-assisted triage, live queue tracking, and hospital administration platform.
- **Target Users:**
  - Hospital Administrators & Department Heads
  - Doctors & Clinical Staff
  - Receptionists & Operators
  - Patients (Self-service kiosk, online booking, WhatsApp check-in, live queue display)
- **Main Technologies:**
  - **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, React Query, React Router DOM
  - **Backend:** Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic
  - **Database & Auth:** Supabase (PostgreSQL), SQLite (local fallback), Redis (queue/caching)
  - **Integrations:** Twilio (WhatsApp/SMS), AI Triage (Claude/LLM), S3/Cloud Storage
- **Current Version:** 1.0.0
- **Major Project Goals:**
  - Complete real-time OPD flow: QR Kiosk -> AI Triage -> Live Queue -> Doctor Consultation -> Digital Prescription -> Automated Follow-up.
  - Deliver multi-tenant hospital dashboard and doctor portal.
