"""FastAPI application entry point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from clinic_os.config import settings
from clinic_os.database import init_db
from clinic_os.modules.checkin import router as checkin_router
from clinic_os.modules.booking import router as booking_router
from clinic_os.modules.reports import router as reports_router
from clinic_os.modules.followups import router as followups_router
from clinic_os.modules.queue_triage import router as queue_router
from clinic_os.modules.doctor import router as doctor_router

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description=settings.app_description,
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.environment,
    }


# API v1 routes
app.include_router(
    checkin_router.router,
    prefix="/api/v1/checkins",
    tags=["Module 1: Check-in"],
)

app.include_router(
    booking_router.router,
    prefix="/api/v1/appointments",
    tags=["Module 2: Booking"],
)

app.include_router(
    reports_router.router,
    prefix="/api/v1/reports",
    tags=["Module 3: Reports"],
)

app.include_router(
    followups_router.router,
    prefix="/api/v1/followups",
    tags=["Module 4: Follow-ups"],
)

app.include_router(
    queue_router.router,
    prefix="/api/v1/queue",
    tags=["Module 5: Queue & Triage"],
)

app.include_router(
    doctor_router.router,
    prefix="/api/v1",
    tags=["Doctor Profile & Multi-Tenant Auth"],
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": settings.app_title,
        "version": settings.app_version,
        "description": settings.app_description,
        "docs": "/docs",
        "redoc": "/redoc",
        "supabase_project": settings.supabase_url,
    }


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info(f"Clinic OS starting in {settings.environment} mode")
    logger.info(f"Database: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'configured'}")
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Could not auto-initialize DB on startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Clinic OS shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "clinic_os.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
