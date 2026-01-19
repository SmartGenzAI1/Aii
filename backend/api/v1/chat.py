# backend/api/v1/chat.py
"""
GenZ AI Chat API - Production-ready streaming chat endpoint.
"""

from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Literal

from app.deps.auth import get_current_user
from app.db.session import get_db
from app.db.models import User
from services.ai_router import AIRouter
from services.stream import stream_response
from services.models import resolve_model
from services.prompts import sanitize_prompt
from core.config import settings
from core.content_filter import content_filter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

# ===== BACKGROUND TASKS =====

async def update_user_quota(user_id: int):
    """Background task to update user quota. Creates its own DB session to avoid blocking request path."""
    from sqlalchemy import select
    from app.db.session import get_db_session

    async with get_db_session() as db:
        try:
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()

            if user:
                user.daily_used += 1
                await db.commit()
                logger.debug(f"User quota updated: {user.email} ({user.daily_used}/{user.daily_quota})")
            else:
                logger.error(f"User not found for quota update: {user_id}")
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to update user quota for {user_id}: {e}")

# ===== DEPENDENCIES =====

def get_ai_router() -> AIRouter:
    """Dependency injection for AI router. Ensures thread-safe per-request instances."""
    """Get singleton AI router instance."""
    groq_keys = [k.strip() for k in settings.GROQ_API_KEYS.split(",") if k.strip()] if settings.GROQ_API_KEYS else []
    openrouter_keys = [k.strip() for k in settings.OPENROUTER_API_KEYS.split(",") if k.strip()] if settings.OPENROUTER_API_KEYS else []
    hf_key = settings.HUGGINGFACE_API_KEY

    return AIRouter(
        groq_keys=groq_keys,
        openrouter_keys=openrouter_keys,
        hf_key=hf_key,
    )


# ===== REQUEST VALIDATION =====

class ChatRequest(BaseModel):
    """Validated chat request with strict input constraints for security."""

    prompt: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="User prompt (max 8000 chars)",
    )
    model: Literal["fast", "balanced", "smart"] = Field(
        default="fast",
        description="AI model to use",
    )
    stream: bool = Field(
        default=True,
        description="Enable streaming response",
    )

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        """Sanitize prompt to prevent injection attacks and ensure content safety."""
        try:
            return sanitize_prompt(v)
        except ValueError as e:
            raise ValueError(f"Invalid prompt: {str(e)}")


# ===== CHAT ENDPOINT =====

@router.post(
    "/chat",
    summary="Chat with AI",
    description="Send a message and get an AI response",
)
async def chat(  # Critical path - must be fast and reliable
    request: Request,
    payload: ChatRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_router: AIRouter = Depends(get_ai_router),
):
    """
    Main chat endpoint with multi-provider support.

    Args:
        request: FastAPI request (for validation)
        payload: Chat request body
        user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        Streaming response with AI output
    """

    # Get request ID for tracing
    request_id = getattr(request.state, "request_id", "unknown")

    # Validate user exists
    if not user:
        logger.warning(f"Unauthenticated request [request_id: {request_id}]")
        raise HTTPException(status_code=401, detail="User not authenticated")

    # ===== REQUEST SIZE VALIDATION =====
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
            if size > settings.MAX_REQUEST_SIZE_BYTES:
                logger.warning(
                    f"Request too large from {user.email}: "
                    f"{size} bytes (limit: {settings.MAX_REQUEST_SIZE_BYTES}) "
                    f"[request_id: {request_id}]"
                )
                raise HTTPException(
                    status_code=413,
                    detail=f"Request payload too large (max {settings.MAX_REQUEST_SIZE_BYTES} bytes)",
                )
        except ValueError:
            pass  # Invalid header, ignore

    # ===== CONTENT FILTERING =====
    filter_result = content_filter.filter_content(payload.prompt)
    if filter_result.blocked:
        logger.warning(
            f"Content blocked for user {user.email}: {filter_result.reasons[:1]} "
            f"[request_id: {request_id}]"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Content policy violation",
                "message": "Your request contains content that violates our safety guidelines.",
                "reasons": filter_result.reasons[:2],  # Show first 2 reasons
            },
        )

    # Use sanitized content if available
    safe_prompt = filter_result.sanitized_content or payload.prompt

    # ===== RATE LIMITING CHECK =====
    if user.daily_used >= user.daily_quota:
        logger.warning(
            f"Daily quota exceeded for user: {user.email} "
            f"({user.daily_used}/{user.daily_quota}) "
            f"[request_id: {request_id}]"
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Daily quota exceeded",
                "used": user.daily_used,
                "limit": user.daily_quota,
                "reset_date": user.last_reset.isoformat() if user.last_reset else None,
            },
        )

    # ===== MODEL RESOLUTION =====
    try:
        provider, real_model = await resolve_model(payload.model)
        logger.info(
            f"Model resolved: {payload.model} -> {provider}/{real_model} "
            f"for user {user.email} "
            f"[request_id: {request_id}]"
        )
    except KeyError as e:
        logger.error(f"Invalid model selection: {payload.model}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model: {payload.model}",
        )

    # ===== SCHEDULE USER QUOTA UPDATE (BACKGROUND) =====
    background_tasks.add_task(update_user_quota, user.id)

    # ===== ROUTE TO AI PROVIDER =====
    try:
        logger.info(
            f"Chat request from {user.email}: "
            f"provider={provider}, model={payload.model}, prompt_len={len(payload.prompt)} "
            f"[request_id: {request_id}]"
        )

        # Stream response from provider
        stream_generator = ai_router.stream(
            prompt=safe_prompt,
            model=real_model,
            provider=provider,
        )

        return stream_response(stream_generator)

    except ValueError as e:
        logger.warning(f"AI provider configuration error: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI provider not configured",
        )
    except RuntimeError as e:
        error_str = str(e).lower()
        
        if "rate limit" in error_str:
            logger.warning(f"Provider rate limited: {e}")
            raise HTTPException(
                status_code=429,
                detail="AI provider rate limited. Please try again in a few minutes.",
            )
        elif "key" in error_str or "unauthorized" in error_str:
            logger.error(f"Provider authentication failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI provider authentication failed",
            )
        elif "unavailable" in error_str:
            logger.warning(f"Provider unavailable: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI provider temporarily unavailable",
            )
        else:
            logger.error(f"Provider error: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable",
            )
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error",
        )


# ===== QUOTA ENDPOINT =====

@router.get("/quota", summary="Get user quota")
async def get_quota(
    user: User = Depends(get_current_user),
):
    """
    Get current user's quota information.
    """
    return {
        "used": user.daily_used,
        "limit": user.daily_quota,
        "remaining": max(0, user.daily_quota - user.daily_used),
        "resets_at": user.last_reset.isoformat() if user.last_reset else None,
        "reset_time_utc": "00:00 UTC",
    }


# ===== MODELS ENDPOINT =====

@router.get("/models", summary="List available models")
async def list_models(
    user: User = Depends(get_current_user),
):
    """
    List available AI models for this user with real-time availability.
    """
    from core.model_provider import model_router

    # Check provider health for each model type
    fast_provider = await model_router.get_best_provider("fast")
    balanced_provider = await model_router.get_best_provider("balanced")
    smart_provider = await model_router.get_best_provider("smart")

    fast_available = await model_router._check_provider_health(fast_provider)
    balanced_available = await model_router._check_provider_health(balanced_provider)
    smart_available = await model_router._check_provider_health(smart_provider)

    return {
        "models": [
            {
                "id": "fast",
                "name": "Fast ⚡",
                "description": "Quick responses, good for simple queries",
                "available": fast_available,
                "auto_provider": True,  # Indicates intelligent provider selection
            },
            {
                "id": "balanced",
                "name": "Balanced ⚖️",
                "description": "Balance of speed and quality",
                "available": balanced_available,
                "auto_provider": True,
            },
            {
                "id": "smart",
                "name": "Smart 🧠",
                "description": "Best quality, slower responses",
                "available": smart_available,
                "auto_provider": True,
            },
        ],
        "features": {
            "local_detection": True,
            "auto_fallback": True,
            "health_monitoring": True,
        }
    }
