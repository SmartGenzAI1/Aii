# backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = "production"

    JWT_SECRET: str

    # Neon database URL (single string)
    DATABASE_URL: str

    ADMIN_EMAILS: set[str] = set()

    class Config:
        env_file = ".env"

settings = Settings()
