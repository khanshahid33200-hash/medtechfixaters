# DEPLOYMENT.md - Deployment & Environment Configuration

## 1. Environments
- **Local Dev Server:**
  - Frontend: `http://localhost:3000` (Vite)
  - Backend: `http://localhost:8000` (FastAPI / Uvicorn)
- **Production Hosting:** Vercel (Frontend) & Cloud/Docker (Backend).

## 2. Environment Variables (Names Only - No Secrets)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `SECRET_KEY`
- `ENCRYPTION_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ANTHROPIC_API_KEY`
- `REDIS_URL`

## 3. Build & Run Commands
- **Local Frontend:** `cd webapp && npm run dev`
- **Frontend Build:** `cd webapp && npm run build`
- **Local Backend:** `venv\Scripts\python.exe -m uvicorn clinic_os.main:app --host 0.0.0.0 --port 8000`
- **Migrations:** `alembic upgrade head`
