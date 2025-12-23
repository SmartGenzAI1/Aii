# backend/app/main.py
"""
Main FastAPI application with graceful database connection handling.
FIXED: Enable FastAPI docs dashboard
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import chat, status, health, admin, web_search
from app.core.config import settings, validate_startup
from app.core.logging import setup_logging
from app.db.session import check_database_connection, cleanup_database
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.request_validation import RequestValidationMiddleware
from app.core.exceptions import global_exception_handler
from app.services.provider_monitor import start_provider_monitor

import logging
import os

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    Graceful startup - app starts even if DB is unavailable initially.
    """
    # ===== STARTUP =====
    try:
        # Initialize logging first
        setup_logging()
        logger.info("✅ Logging initialized")

        # Validate configuration
        validate_startup()
        logger.info("✅ Configuration validated")

        # Try to check database connection (non-blocking)
        db_available = await check_database_connection()
        if db_available:
            logger.info("✅ Database connection verified")
        else:
            logger.warning("⚠️ Database unavailable at startup (will retry on requests)")

        # Start background provider monitoring
        start_provider_monitor()
        logger.info("✅ Provider monitor started")

        logger.info(f"🚀 GenZ AI Backend starting in {settings.ENV} mode")

    except Exception as e:
        logger.error(f"⚠️ Startup warning (non-critical): {e}")
        # Don't raise - allow app to start even with warnings

    yield

    # ===== SHUTDOWN =====
    try:
        await cleanup_database()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app with lifespan
# IMPORTANT: Always enable docs for production - you can disable later if needed
app = FastAPI(
    title="GenZ AI Backend",
    version="1.0.0",
    description="Multi-provider AI orchestration platform",
    lifespan=lifespan,
    # Enable docs (can be disabled in production later if needed)
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json",  # OpenAPI schema
)


# ===== MIDDLEWARE STACK (order matters) =====

# 1. Request ID for tracing
app.add_middleware(RequestIDMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request validation
app.add_middleware(RequestValidationMiddleware)

# 4. Trusted hosts - FIXED for Render
# Include both the Render URL and localhost
trusted_hosts = list(settings.ALLOWED_ORIGINS) + [
    "localhost",
    "127.0.0.1",
    "[::1]",  # IPv6 localhost
]

# Add Render domain from environment if available
render_external_url = os.getenv("RENDER_EXTERNAL_URL")
if render_external_url:
    # Extract just the hostname
    hostname = render_external_url.replace("https://", "").replace("http://", "").split("/")[0]
    trusted_hosts.append(hostname)

logger.info(f"Trusted hosts configured: {trusted_hosts}")

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=trusted_hosts,
)

# 5. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
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
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail} [request_id: {request_id}]"
    )
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
    """Readiness probe."""
    return {
        "ready": True,
        "environment": settings.ENV,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development(),
        log_level=settings.LOG_LEVEL.lower(),
    )
