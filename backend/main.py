# backend/main.py
"""
Main FastAPI application with graceful database connection handling.
FIXED: CORS and TrustedHost middleware configuration
FIXED: SQLAlchemy C extension loading issue on Windows
"""

import os
import sys

# Fix for SQLAlchemy C extension loading issue on Windows
# Disable C extensions to avoid WMI query hangs on some systems
os.environ.setdefault('SQLALCHEMY_DISABLE_CYEXTENSION', '1')

# Pre-import platform to avoid WMI hangs during SQLAlchemy init
try:
    import platform
    # Force platform detection early to avoid hangs later
    _ = platform.machine()
except KeyboardInterrupt:
    # If platform detection hangs, continue anyway
    pass

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.v1 import chat, status, health, admin, web_search
from core.config import settings, validate_startup
from core.logging import setup_logging
from app.db.session import check_database_connection, cleanup_database
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.request_validation import RequestValidationMiddleware
from core.exceptions import global_exception_handler
from services.provider_monitor import start_provider_monitor

import logging
import os

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # ===== STARTUP =====
    try:
        setup_logging()
        logger.info("[OK] Logging initialized")

        validate_startup()
        logger.info("[OK] Configuration validated")

        db_available = await check_database_connection()
        if db_available:
            logger.info("[OK] Database connection verified")
        else:
            logger.warning("[WARN] Database unavailable at startup")

        # Initialize local database if using SQLite
        from app.db.session import initialize_local_database
        await initialize_local_database()

        start_provider_monitor()
        logger.info("[OK] Provider monitor started")

        logger.info(f"[START] GenZ AI Backend starting in {settings.ENV} mode")

    except Exception as e:
        logger.error(f"[WARN] Startup warning: {e}")

    yield

    # ===== SHUTDOWN =====
    try:
        await cleanup_database()
        logger.info("[OK] Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


app = FastAPI(
    title="GenZ AI Backend",
    version="1.0.0",
    description="Multi-provider AI orchestration platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ===== MIDDLEWARE STACK =====

# 1. Request ID
app.add_middleware(RequestIDMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request validation
app.add_middleware(RequestValidationMiddleware)

# 4. Trusted hosts - FIXED
trusted_hosts = ["*"]  # Allow all in development
if settings.is_production():
    trusted_hosts = []
    # Add configured origins
    for origin in settings.allowed_origins:
        hostname = origin.replace("https://", "").replace("http://", "").split("/")[0]
        trusted_hosts.append(hostname)

    # Add Render domain
    render_url = os.getenv("RENDER_EXTERNAL_URL")
    if render_url:
        hostname = render_url.replace("https://", "").replace("http://", "").split("/")[0]
        if hostname not in trusted_hosts:
            trusted_hosts.append(hostname)

    # Add localhost for health checks
    trusted_hosts.extend(["localhost", "127.0.0.1"])

logger.info(f"Trusted hosts: {trusted_hosts}")

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=trusted_hosts,
)

# 5. CORS - FIXED to use property
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # Now a list via @property
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
    max_age=3600,
)


# ===== EXCEPTION HANDLERS =====

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} [request_id: {request_id}]")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "request_id": request_id,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    return await global_exception_handler(request, exc)


# ===== API ROUTERS =====

app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(status.router, prefix="/api/v1", tags=["status"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])
app.include_router(web_search.router, prefix="/api/v1", tags=["search"])


# ===== HEALTH ENDPOINTS =====

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint."""
    return {
        "status": "ok",
        "service": "GenZ AI Backend",
        "environment": settings.ENV,
        "version": "1.0.0",
        "docs": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
        },
    }


@app.get("/health", include_in_schema=False)
async def health_check():
    """Health check for uptime monitors."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "GenZ AI Backend",
    }


@app.get("/ready", include_in_schema=False)
async def ready_check():
    """Readiness probe - checks if service can accept traffic."""
    # Check database connectivity
    db_ready = await check_database_connection()

    # Check if at least one AI provider is configured
    ai_ready = (
        len(settings.GROQ_API_KEYS.split(",")) > 0 or
        len(settings.OPENROUTER_API_KEYS.split(",")) > 0 or
        settings.HUGGINGFACE_API_KEY is not None
    )

    ready = db_ready and ai_ready

    return {
        "ready": ready,
        "database": "connected" if db_ready else "disconnected",
        "ai_providers": "configured" if ai_ready else "not_configured",
        "environment": settings.ENV,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.is_development(),
        log_level=settings.LOG_LEVEL.lower(),
    )