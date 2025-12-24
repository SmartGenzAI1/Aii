# backend/app/core/config.py
"""
Production-grade configuration with validation and security defaults.
FIXED: All list fields now properly parse from environment variables
"""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All critical values are required and validated.
    """

    # ===== DATABASE =====
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL connection string",
        min_length=20,
    )

    # ===== SECURITY =====
    JWT_SECRET: str = Field(
        ...,
        description="JWT signing secret (min 32 chars, base64 preferred)",
        min_length=32,
    )
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRATION_HOURS: int = Field(default=24)

    # ===== API KEYS (Multi-provider support) =====
    # Store as strings, parse in validators
    GROQ_API_KEYS: str = Field(
        default="",
        description="Comma-separated Groq API keys"
    )
    OPENROUTER_API_KEYS: str = Field(
        default="",
        description="Comma-separated OpenRouter API keys"
    )
    HUGGINGFACE_API_KEY: Optional[str] = None

    # ===== ADMIN & SECURITY =====
    ADMIN_EMAILS: str = Field(
        default="",
        description="Comma-separated admin emails",
    )

    # ===== CORS =====
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Comma-separated allowed origins",
    )

    # ===== RATE LIMITING =====
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60)
    USER_DAILY_QUOTA: int = Field(default=50)

    # ===== DATABASE POOLING =====
    DATABASE_POOL_SIZE: int = Field(default=20)
    DATABASE_POOL_MAX_OVERFLOW: int = Field(default=40)
    DATABASE_POOL_RECYCLE_SECONDS: int = Field(default=3600)

    # ===== REQUEST LIMITS =====
    MAX_REQUEST_SIZE_BYTES: int = Field(default=50_000)
    REQUEST_TIMEOUT_SECONDS: int = Field(default=30)

    # ===== ENVIRONMENT =====
    ENV: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")

    # ===== MODEL CONFIGURATION =====
    GROQ_FAST_MODEL: str = Field(default="llama-3.1-8b-instant")
    GROQ_BALANCED_MODEL: str = Field(default="llama-3.1-70b")
    OPENROUTER_SMART_MODEL: str = Field(default="openai/gpt-4o-mini")

    # ===== FEATURE FLAGS =====
    ENABLE_WEB_SEARCH: bool = Field(default=True)
    ENABLE_IMAGE_GENERATION: bool = Field(default=False)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ===== VALIDATORS =====

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Ensure JWT secret is strong enough."""
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    # ===== COMPUTED PROPERTIES =====
    # These parse the string fields into lists at runtime

    @property
    def groq_api_keys(self) -> list[str]:
        """Parse GROQ_API_KEYS into list, filtering placeholders."""
        if not self.GROQ_API_KEYS:
            return []
        keys = [k.strip() for k in self.GROQ_API_KEYS.split(",") if k.strip()]
        return [k for k in keys if k and not k.startswith("GROQ_KEY")]

    @property
    def openrouter_api_keys(self) -> list[str]:
        """Parse OPENROUTER_API_KEYS into list, filtering placeholders."""
        if not self.OPENROUTER_API_KEYS:
            return []
        keys = [k.strip() for k in self.OPENROUTER_API_KEYS.split(",") if k.strip()]
        return [k for k in keys if k and not k.startswith("OR_KEY")]

    @property
    def admin_emails(self) -> list[str]:
        """Parse ADMIN_EMAILS into list."""
        if not self.ADMIN_EMAILS:
            return []
        return [email.strip() for email in self.ADMIN_EMAILS.split(",") if email.strip()]

    @property
    def allowed_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS into list."""
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:3000"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def is_production(self) -> bool:
        return self.ENV.lower() == "production"

    def is_development(self) -> bool:
        return self.ENV.lower() == "development"


# Singleton instance
settings = Settings()


# Validate critical settings at startup
def validate_startup():
    """Called in app startup to verify all critical settings."""
    errors = []

    if not settings.JWT_SECRET:
        errors.append("JWT_SECRET not configured")

    if settings.is_production() and not settings.allowed_origins:
        errors.append("ALLOWED_ORIGINS not configured in production")

    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL not configured")

    if errors:
        raise RuntimeError(f"Configuration errors: {', '.join(errors)}")

    print(f"✅ Configuration validated for {settings.ENV} environment")
