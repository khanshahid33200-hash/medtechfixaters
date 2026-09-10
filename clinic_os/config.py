"""Application configuration using Pydantic Settings"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_title: str = "Clinic OS"
    app_version: str = "1.0.0"
    app_description: str = "Patient workflow automation platform for clinics"
    environment: str = os.getenv("ENV", "development")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # Database
    database_url: str = os.getenv("DATABASE_URL",
                                  "postgresql+asyncpg://clinic_user:clinic_pass@localhost:5432/clinic_os")

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Security
    jwt_secret: str = os.getenv("JWT_SECRET", "your-super-secret-key-change-in-production")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiration_minutes: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "30"))
    refresh_token_expiration_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRATION_DAYS", "7"))
    encryption_key: str = os.getenv("ENCRYPTION_KEY", "your-fernet-key-change-in-production")

    # Twilio
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_phone_number: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    twilio_whatsapp_number: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")

    # Anthropic Claude
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    claude_model: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

    # n8n
    n8n_webhook_secret: str = os.getenv("N8N_WEBHOOK_SECRET", "")
    n8n_base_url: str = os.getenv("N8N_BASE_URL", "http://localhost:5678")

    # Supabase (Primary)
    supabase_url: Optional[str] = os.getenv("SUPABASE_URL")
    supabase_key: Optional[str] = os.getenv("SUPABASE_KEY")

    # OCR
    tesseract_path: str = os.getenv("TESSERACT_PATH", "/usr/bin/tesseract")

    # CORS
    allowed_origins: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]


settings = Settings()

