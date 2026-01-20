# backend/app/db/session.py
"""
SQLAlchemy async session factory with proper AsyncIO pooling.
Fixed for Supabase compatibility - no server_settings parameter.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from datetime import datetime
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
# from sqlalchemy.pool import AsyncAdaptedQueuePool  # Not needed for async engine
from core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_engine_kwargs() -> dict:
    """
    Generate engine configuration based on environment.
    CRITICAL: Compatible with Supabase connection pooler.
    """
    kwargs = {
        "echo": settings.is_development(),  # Log SQL in dev
        "pool_pre_ping": True,  # Test connection before use
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_POOL_MAX_OVERFLOW,
        "pool_recycle": settings.DATABASE_POOL_RECYCLE_SECONDS,
        # Note: poolclass not specified for async engines
    }

    # Supabase pooler doesn't support server_settings parameter
    # So we DON'T add it here
    # If you're using direct PostgreSQL, uncomment below:
    # if settings.is_production():
    #     kwargs["connect_args"] = {
    #         "server_settings": {"application_name": "genzai_backend"}
    #     }

    return kwargs


# Create async engine
try:
    engine = create_async_engine(
        settings.effective_database_url,
        **get_engine_kwargs(),
    )
    db_type = "PostgreSQL" if settings.DATABASE_URL else "SQLite"
    logger.info(f"✅ Database engine created successfully ({db_type})")
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


async def get_db() -> AsyncGenerator[AsyncSession, None]:
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


@asynccontextmanager
async def get_db_session():
    """
    Context manager for background tasks that need DB access.
    Creates and properly closes its own session.
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Background DB session error: {e}")
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
    try:
        await engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


async def initialize_local_database():
    """
    Initialize local SQLite database with required tables.
    Only runs when using SQLite (local development mode).
    """
    if not settings.effective_database_url.startswith("sqlite"):
        return  # Only initialize for SQLite

    try:
        # Import models to ensure they're registered with SQLAlchemy
        from . import models

        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)

        logger.info("✅ Local SQLite database initialized")

        # Create a demo admin user for testing
        from .models import User
        from datetime import date
        from sqlalchemy import select

        async with get_db_session() as session:
            # Check if demo user exists
            stmt = select(User).where(User.email == "admin@genzai.ai")
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if not existing_user:
                demo_user = User(
                    id=1,  # Fixed ID for demo
                    email="admin@genzai.ai",
                    daily_quota=1000,
                    daily_used=0,
                    last_reset=date.today(),
                    is_admin=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                session.add(demo_user)
                await session.commit()
                logger.info("✅ Demo admin user created: admin@genzai.ai")

    except Exception as e:
        logger.error(f"❌ Failed to initialize local database: {e}")
        # Don't raise error - allow app to continue without local DB
