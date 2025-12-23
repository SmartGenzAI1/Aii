# backend/app/db/session.py
"""
SQLAlchemy async session factory with proper AsyncIO pooling.
CRITICAL FIX: Use AsyncAdaptedQueuePool for async engines, NOT QueuePool
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_engine_kwargs() -> dict:
    """
    Generate engine configuration based on environment.
    CRITICAL: Use AsyncAdaptedQueuePool, NOT QueuePool with async engines
    """
    kwargs = {
        "echo": settings.is_development(),  # Log SQL in dev
        "future": True,
        "pool_pre_ping": True,  # Test connection before use
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_POOL_MAX_OVERFLOW,
        "pool_recycle": settings.DATABASE_POOL_RECYCLE_SECONDS,
        "poolclass": AsyncAdaptedQueuePool,  # ✅ CORRECT for async
    }

    # In production, add extra connection settings
    if settings.is_production():
        kwargs["connect_args"] = {
            "server_settings": {"application_name": "genzai_backend"}
        }

    return kwargs


# Create async engine
try:
    engine = create_async_engine(
        settings.DATABASE_URL,
        **get_engine_kwargs(),
    )
    logger.info("✅ Database engine created successfully")
except Exception as e:
    logger.error(f"❌ Failed to create database engine: {e}")
    raise RuntimeError("Database configuration failed")


# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """
    FastAPI dependency for database session.
    Properly handles async context.
    
    Usage in endpoints:
        async def my_endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """
    Verify database is reachable at startup.
    
    Returns:
        True if connection successful
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        logger.info("✅ Database connection verified")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


async def cleanup_database():
    """
    Called on app shutdown to properly close database connections.
    """
    await engine.dispose()
    logger.info("✅ Database connections closed")
