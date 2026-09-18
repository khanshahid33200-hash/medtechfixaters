# API_MAP.md - API Routes & Communication Contracts

## 1. Backend REST API (`FastAPI` on `http://localhost:8000/api/v1`)

### System & Health
- `GET /health`: Server health check, version, environment.
- `GET /docs`: Swagger UI OpenAPI specification.
- `GET /redoc`: ReDoc API documentation.

### Check-in & Intake (`/api/v1/checkins`)
- `POST /api/v1/checkins/`: Submit patient intake (name, phone, symptoms, medical history, triage consent).
- `GET /api/v1/checkins/stats`: Aggregated intake metrics per clinic.
- `GET /api/v1/checkins/patient/{patient_id}/history`: Retrieve past check-in history.
- `POST /api/v1/checkins/webhook/twilio`: Twilio SMS & WhatsApp inbound webhook.

### Booking & Appointments (`/api/v1/booking`)
- `GET /api/v1/booking/slots`: Available appointment slots by doctor/date.
- `POST /api/v1/booking/appointments`: Book new appointment.
- `PATCH /api/v1/booking/appointments/{id}/status`: Reschedule or cancel appointment.

### Queue & Triage (`/api/v1/queue`)
- `GET /api/v1/queue/live`: Live queue list for doctor/department.
- `POST /api/v1/queue/call-next`: Call next patient to doctor cabin.
- `PATCH /api/v1/queue/{id}/complete`: Mark consultation complete.

### Reports & Follow-ups (`/api/v1/reports`, `/api/v1/followups`)
- `POST /api/v1/reports/upload`: Upload patient medical report document.
- `GET /api/v1/reports/{patient_id}`: List reports for a patient.
- `POST /api/v1/followups/trigger`: Send follow-up reminder message.

## 2. Supabase Client Integration
- Direct PostgreSQL queries via `@supabase/supabase-js` for real-time dashboard subscriptions, user auth sessions, and live queue broadcasts.
