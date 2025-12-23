# backend/app/main.py
"""
Main FastAPI application with complete security hardening.
- Middleware stack properly ordered
- Logging initialized
- All routers included
- Startup validation
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

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    Runs startup code, then shutdown code after yield.
    """
    # ===== STARTUP =====
    try:
        # Initialize logging first
        setup_logging()
        logger.info("✅ Logging initialized")

        # Validate configuration
        validate_startup()
        logger.info("✅ Configuration validated")

        # Check database connection
        if not await check_database_connection():
            raise RuntimeError("Database unreachable at startup")
        logger.info("✅ Database connection verified")

        # Start background provider monitoring
        start_provider_monitor()
        logger.info("✅ Provider monitor started")

        logger.info(f"🚀 GenZ AI Backend starting in {settings.ENV} mode")

    except Exception as e:
        logger.critical(f"❌ Startup failed: {e}", exc_info=True)
        raise

    yield

    # ===== SHUTDOWN =====
    try:
        await cleanup_database()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)


# Create FastAPI app with lifespan
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


# ===== MIDDLEWARE STACK (order matters - innermost to outermost) =====
# Order is important: middleware executes in REVERSE order

# 1. Request ID for tracing (innermost - executes last on way in)
app.add_middleware(RequestIDMiddleware)

# 2. Security headers (must be before validation)
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request validation (size limits, content-type)
app.add_middleware(RequestValidationMiddleware)

# 4. Trusted hosts (prevent HOST header injection)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_ORIGINS,
)

# 5. CORS (outermost - executes first on way in)
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
    """Handle HTTP exceptions with request ID."""
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


# ===== API ROUTERS (V1 only) =====

app.include_router(
    chat.router,
    prefix="/api/v1",
    tags=["chat"],
)

app.include_router(
    status.router,
    prefix="/api/v1",
    tags=["status"],
)

app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["health"],
)

app.include_router(
    admin.router,
    prefix="/api/v1",
    tags=["admin"],
)

app.include_router(
    web_search.router,
    prefix="/api/v1",
    tags=["search"],
)


# ===== HEALTH & STATUS ENDPOINTS =====

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint for basic health checks."""
    return {
        "status": "ok",
        "service": "GenZ AI Backend",
        "environment": settings.ENV,
        "version": "1.0.0",
    }


@app.get("/health", include_in_schema=False)
async def health_check():
    """
    Basic health check endpoint for uptime monitors.
    Does not require authentication.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "GenZ AI Backend",
    }


@app.get("/ready", include_in_schema=False)
async def ready_check():
    """
    Readiness probe for Kubernetes/container orchestration.
    Checks if app is ready to accept traffic.
    """
    return {
        "ready": True,
        "environment": settings.ENV,
    }


# ===== STARTUP LOGGING =====

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development(),
        log_level=settings.LOG_LEVEL.lower(),
    )
