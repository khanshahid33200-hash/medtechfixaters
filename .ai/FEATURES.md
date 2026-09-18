# FEATURES.md - Feature Inventory & Status

## Feature List

| Feature | Status | Main Files | Description |
| :--- | :--- | :--- | :--- |
| **Hospital Admin Dashboard** | Active | `webapp/src/pages/hospitaldashboard/*` | Complete hospital management suite: appointments, live queue, doctor roster, patients, departments, analytics, QR management. |
| **Doctor Portal** | Active | `webapp/src/pages/Dashboard.tsx` | Doctor consultation workspace: patient history, digital Rx, queue calling, vitals tracking. |
| **QR Kiosk & Self Intake** | Active | `webapp/src/pages/AppointmentBookingPage.tsx`, `IntakePage.tsx` | QR code scanning for patient self-service booking and intake. |
| **Live Queue Tracking** | Active | `webapp/src/pages/TrackPage.tsx`, `DisplayBoard.tsx` | Real-time queue status for patients on mobile and waiting room TV display. |
| **AI Symptom Triage** | In Progress | `clinic_os/modules/queue_triage/`, `claude_client.py` | Automatic severity classification and priority queue sorting. |
| **WhatsApp/Twilio Bot** | In Progress | `clinic_os/modules/checkin/router.py`, `twilio_client.py` | Inbound WhatsApp booking and automated appointment reminders. |
| **Role-Based Auth** | Active | `webapp/src/context/AuthContext.tsx`, `Login.tsx` | Multi-role portal isolation (Doctor, Hospital Admin, Platform Owner). |
| **Audit & PHI Encryption** | Active | `clinic_os/core/security.py`, `encryption.py`, `audit.py` | Field-level encryption and HIPAA-compliant access audit logging. |
