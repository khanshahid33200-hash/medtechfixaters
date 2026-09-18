# FILE_MAP.md - Functionality to Source File Mapping

## Frontend Webapp (`webapp/`)

### Entry & Core
- Main Application Root: `webapp/src/App.tsx`
- Entry HTML & Boot: `webapp/index.html`, `webapp/src/main.tsx`
- Vite Config & Proxy: `webapp/vite.config.ts`
- Tailwind Config: `webapp/tailwind.config.js`

### Authentication & Context
- Auth Provider & Session: `webapp/src/context/AuthContext.tsx`
- Protected Route Guard: `webapp/src/components/ProtectedRoute.tsx`
- Login & Portal Gates: `webapp/src/pages/Login.tsx`

### Patient Workflows & Public Pages
- Landing Page: `webapp/src/pages/LandingPage.tsx`
- Appointment Booking: `webapp/src/pages/AppointmentBookingPage.tsx`
- Patient Intake: `webapp/src/pages/IntakePage.tsx`
- Queue Live Tracking: `webapp/src/pages/TrackPage.tsx`
- Prescription View (Rx): `webapp/src/pages/RxPage.tsx`
- Public Waiting Display Board: `webapp/src/pages/DisplayBoard.tsx`

### Hospital Administration Dashboard (`webapp/src/pages/hospitaldashboard/`)
- Main Overview: `HospitalDashboardHome.tsx`
- Appointments: `HospitalAppointmentsPage.tsx`
- Live Queue: `HospitalLiveQueuePage.tsx`
- Patients: `HospitalPatientsPage.tsx`
- Doctors: `HospitalDoctorsPage.tsx`
- Departments: `HospitalDepartmentsPage.tsx`
- Reports: `HospitalReportsPage.tsx`
- Analytics: `HospitalAnalyticsPage.tsx`
- QR Code Management: `HospitalQRManagementPage.tsx`
- Staff & Roles: `HospitalUsersRolesPage.tsx`
- Settings & Profile: `HospitalSettingsPage.tsx`
- Chat & Logs: `HospitalChatPage.tsx`, `HospitalLogsPage.tsx`

### Doctor Dashboard (`webapp/src/pages/Dashboard.tsx` & subcomponents)
- Doctor View Tabs: `webapp/src/pages/Dashboard.tsx`
- Prescriptions & Consultations: `webapp/src/pages/DoctorProfile.tsx`, `webapp/src/pages/Checkin.tsx`, `webapp/src/pages/Queue.tsx`

### API & Data Access
- Axios API Client: `webapp/src/api/client.ts`
- Supabase Client: `webapp/src/lib/supabase.ts` (or `webapp/src/api/supabase.ts`)

---

## Backend (`clinic_os/`)

### Core & Server
- FastAPI Entry: `clinic_os/main.py`
- Configuration & Env: `clinic_os/config.py`
- Database Connector: `clinic_os/database.py`
- Security & JWT: `clinic_os/core/security.py`
- Encryption: `clinic_os/core/encryption.py`
- Audit Logging: `clinic_os/core/audit.py`

### Feature Modules
- Check-in & WhatsApp: `clinic_os/modules/checkin/` (models, router, service, schemas)
- Booking & Slots: `clinic_os/modules/booking/`
- Queue & AI Triage: `clinic_os/modules/queue_triage/`
- Reports: `clinic_os/modules/reports/`
- Follow-ups: `clinic_os/modules/followups/`
- Integrations: `clinic_os/integrations/` (twilio_client.py, claude_client.py)
