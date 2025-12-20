# backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration object.
    Loaded once at startup.
    Uses environment variables only (Render-compatible).
    """

    APP_NAME: str = "AI Backend"
    ENV: str = "production"
    DEBUG: bool = False

    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
    )


# Singleton settings object (import-safe, fast)
settings = Settings()
