"""
Deprecated Database Module (Compatibility Shim)

This module previously implemented a separate database engine, sessions, and models.
It has been consolidated to avoid duplication and conflicts. All database responsibilities
are now handled in backend/app/db/session.py and backend/app/db/models.py.

This shim preserves backward compatibility by re-exporting common functions and objects
and delegating to the canonical implementations. Remove imports to this module over time
and update code to use backend.app.db.* modules directly.
"""

from __future__ import annotations

import logging
from typing import Any, AsyncGenerator, Dict, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# Canonical database layer
from app.db.session import (
    engine,
    async_session_maker,
    get_db as _get_db,
    get_db_session as _get_db_session,
    check_database_connection as _check_database_connection,
    cleanup_database as _cleanup_database,
    initialize_local_database as _initialize_local_database,
)

logger = logging.getLogger(__name__)

# Re-exports for compatibility
get_db = _get_db
get_db_session = _get_db_session
check_database_connection = _check_database_connection
cleanup_database = _cleanup_database
initialize_local_database = _initialize_local_database


async def initialize_database() -> None:
    """Initialize database. For SQLite, ensure local schema exists.
    In production Postgres, this should be handled by migrations.
    """
    try:
        await initialize_local_database()
        logger.info("Database initialization completed (shim)")
    except Exception as e:
        logger.error(f"Database initialization failed (shim): {e}")
        raise


async def health_check() -> Dict[str, Any]:
    """Perform a simple health check using the canonical engine."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        # Pool stats may not be available uniformly across drivers; report minimal info
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Database health check failed (shim): {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


# No-op functions kept for compatibility. Prefer migration tooling (Alembic) for these.
async def optimize_tables() -> None:
    logger.info("optimize_tables is a no-op in shim; use DB maintenance and ANALYZE/VACUUM externally.")


async def create_indexes() -> None:
    logger.info("create_indexes is a no-op in shim; use migrations to create indexes.")


# Deprecated exports removed:
# - db engine wrapper class
# - ORM model classes (User, Chat, Message, File)
# Migrate to backend/app/db/models.py for ORM models.
