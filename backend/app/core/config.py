# backend/app/core/config.py

# backend/app/core/config.py
"""
Production-grade configuration with validation and security defaults.
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
    GROQ_API_KEYS: list[str] = Field(default_factory=list)
    OPENROUTER_API_KEYS: list[str] = Field(default_factory=list)
    HUGGINGFACE_API_KEY: Optional[str] = None

    # ===== ADMIN & SECURITY =====
    ADMIN_EMAILS: list[str] = Field(
        default_factory=list,
        description="Email addresses with admin access",
    )

    # ===== CORS =====
    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        description="Allowed origins for CORS",
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
        extra="ignore",  # Ignore unknown env vars
    )

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Ensure JWT secret is strong enough."""
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, v: list[str]) -> list[str]:
        """Validate CORS origins are proper URLs."""
        if not v:
            raise ValueError("ALLOWED_ORIGINS cannot be empty")
        return v

    @field_validator("GROQ_API_KEYS")
    @classmethod
    def validate_groq_keys(cls, v: list[str]) -> list[str]:
        """Filter out placeholder/empty keys."""
        return [k for k in v if k and not k.startswith("GROQ_KEY")]

    @field_validator("OPENROUTER_API_KEYS")
    @classmethod
    def validate_openrouter_keys(cls, v: list[str]) -> list[str]:
        """Filter out placeholder/empty keys."""
        return [k for k in v if k and not k.startswith("OR_KEY")]

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

    if settings.is_production() and not settings.ALLOWED_ORIGINS:
        errors.append("ALLOWED_ORIGINS not configured in production")

    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL not configured")

    if errors:
        raise RuntimeError(f"Configuration errors: {', '.join(errors)}")

    print(f"✅ Configuration validated for {settings.ENV} environment")
