# DECISIONS.md - Architectural & Technical Decisions Log

### 2026-09-18: Persistent AI Brain System Initialization
- **Decision:** Establish `.ai/` persistent knowledge layer with 14 standardized memory documents.
- **Reason:** Prevent repeated repository rescans, ensure strict adherence to existing architecture, eliminate duplicate patterns, and optimize token efficiency.
- **Affected Areas:** Whole repository, future AI assistant workflows.

### 2025-08-20: Unified Hospital Dashboard Architecture
- **Decision:** Consolidate legacy standalone hospital admin pages into unified `/hospitaldashboard/*` system with sub-routing and shared layout.
- **Reason:** Simplify navigation, role guarding, and state management for multi-department hospital administrators.
- **Affected Areas:** `webapp/src/pages/hospitaldashboard/`, `webapp/src/App.tsx`.

### 2025-08-19: Dual Backend & Supabase Architecture
- **Decision:** Support both direct Supabase PostgreSQL connections (for reactive web UI) and a FastAPI backend service (for complex business logic, Twilio webhooks, encryption, and AI triage).
- **Reason:** Real-time reactivity in the frontend paired with server-side security and heavy integrations on FastAPI.
- **Affected Areas:** `clinic_os/`, `webapp/src/api/`.
