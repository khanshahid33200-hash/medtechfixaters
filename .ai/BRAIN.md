# BRAIN.md - AI Operating Rules & Master Memory Index

## 1. Operating Rules
- Memory First: Always check relevant memory files in `.ai/` before inspecting source code.
- Targeted Reading: Inspect only the files required for the task. Never perform full-codebase rescans unless strictly necessary.
- Source Code Authority: Source code is ground truth. Update memory if contradictions are found.
- Security: Never store secrets, tokens, or plaintext passwords in `.ai/`.
- Updates: Keep memory files concise, accurate, and up-to-date after completing tasks.
- Manual Steps Clarification: ALWAYS clearly list every manual step the user needs to execute in external dashboards or CLIs (e.g., Supabase SQL Editor, Edge Function deployments, Auth settings, domain DNS).

## 2. Memory Index
- [PROJECT.md](file:///d:/clinical%20os/.ai/PROJECT.md): Name, purpose, tech stack, goals.
- [ARCHITECTURE.md](file:///d:/clinical%20os/.ai/ARCHITECTURE.md): Frontend, backend, database, auth & integration architecture.
- [FILE_MAP.md](file:///d:/clinical%20os/.ai/FILE_MAP.md): Functional mapping to source files.
- [DATABASE.md](file:///d:/clinical%20os/.ai/DATABASE.md): Tables, schema, RLS, conventions.
- [API_MAP.md](file:///d:/clinical%20os/.ai/API_MAP.md): REST & Supabase endpoints, functions, contracts.
- [FEATURES.md](file:///d:/clinical%20os/.ai/FEATURES.md): Feature inventory & statuses.
- [UI_SYSTEM.md](file:///d:/clinical%20os/.ai/UI_SYSTEM.md): Tailwind styling, theme tokens, components.
- [DECISIONS.md](file:///d:/clinical%20os/.ai/DECISIONS.md): Architectural decisions log.
- [TASK_STATE.md](file:///d:/clinical%20os/.ai/TASK_STATE.md): Current dev state, blockers, priorities.
- [BUGS.md](file:///d:/clinical%20os/.ai/BUGS.md): Active bugs & tracking.
- [DEPLOYMENT.md](file:///d:/clinical%20os/.ai/DEPLOYMENT.md): Deployment setup, ports, environment variable names.
- [CHANGELOG.md](file:///d:/clinical%20os/.ai/CHANGELOG.md): History of completed changes.
- [SESSION.md](file:///d:/clinical%20os/.ai/SESSION.md): Active session context.

## 3. Critical Architecture Rules
- Webapp is React (Vite) on port 3000, connecting to Supabase for data/auth and FastAPI for core services.
- FastAPI backend runs on port 8000 (SQLite/PostgreSQL + Redis).
- Multi-tenancy is enforced via `clinic_id` / `hospital_id`.
- Sensitive health fields (PHI) require encryption at rest.
