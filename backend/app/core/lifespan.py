# backend/app/core/lifespan.py

from contextlib import asynccontextmanager
from app.db.session import engine
from app.models import provider_status
from app.services.provider_monitor import start_provider_monitor
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def validate_env():
    required = [
        "JWT_SECRET",
        "DATABASE_URL",
    ]
    for key in required:
        if not getattr(settings, key, None):
            raise RuntimeError(f"Missing required env var: {key}")

@asynccontextmanager
async def lifespan(app):
    logger.info("Starting application lifecycle")

    validate_env()

    # Verify DB connection
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Database connection OK")
    except Exception as e:
        logger.critical("Database connection failed", exc_info=e)
        raise

    # Start provider monitor
    monitor_task = start_provider_monitor()

    yield

    logger.info("Shutting down application")
    monitor_task.cancel()
