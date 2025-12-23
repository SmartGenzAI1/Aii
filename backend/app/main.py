# backend/app/main.py

# backend/app/main.py
"""
Main FastAPI application with security hardening.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import chat, status, health, admin, web_search
from app.core.config import settings, validate_startup
from app.db.session import check_database_connection, cleanup_database
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.core.exceptions import global_exception_handler
from app.services.provider_monitor import start_provider_monitor

import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    Runs startup code, then shutdown code after yield.
    """
    # ===== STARTUP =====
    try:
        # Validate configuration
        validate_startup()
        logger.info("✅ Configuration validated")

        # Check database connection
        if not await check_database_connection():
            raise RuntimeError("Database unreachable at startup")

        # Start background provider monitoring
        start_provider_monitor()
        logger.info("✅ Provider monitor started")

        logger.info(f"🚀 GenZ AI Backend starting in {settings.ENV} mode")

    except Exception as e:
        logger.critical(f"❌ Startup failed: {e}")
        raise

    yield

    # ===== SHUTDOWN =====
    try:
        await cleanup_database()
        logger.info("✅ Database cleaned up")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title="GenZ AI Backend",
    version="1.0.0",
    description="Multi-provider AI orchestration platform",
    lifespan=lifespan,
    # Disable automatic docs in production
    docs_url="/docs" if settings.is_development() else None,
    redoc_url="/redoc" if settings.is_development() else None,
    openapi_url="/openapi.json" if settings.is_development() else None,
)


# ===== MIDDLEWARE STACK (order matters) =====

# 1. Request ID for tracing
app.add_middleware(RequestIDMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Trusted hosts (prevent HOST header injection)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_ORIGINS,
)

# 4. CORS (restrictive)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Whitelist only
    allow_credentials=False,  # Don't include credentials
    allow_methods=["GET", "POST"],  # Only needed methods
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
    max_age=3600,  # Cache preflight 1 hour
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


# ===== ROUTERS =====

app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(status.router, prefix="/api/v1", tags=["status"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])

# Protected route: web search only for authenticated users
app.include_router(web_search.router, prefix="/api/v1", tags=["search"])


# ===== HEALTH ENDPOINTS =====

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint for health checks."""
    return {
        "status": "ok",
        "service": "GenZ AI Backend",
        "environment": settings.ENV,
    }


@app.get("/health", include_in_schema=False)
async def health_check():
    """
    Basic health check for uptime monitors.
    Doesn't require authentication.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
    }


# ===== STARTUP LOG =====

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development(),
        log_level=settings.LOG_LEVEL.lower(),
    )
