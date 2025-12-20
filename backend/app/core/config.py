# backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    ENV: str = "production"

settings = Settings()
