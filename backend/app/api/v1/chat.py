# backend/app/api/v1/chat.py
"""
Chat endpoint with security hardening:
- Request size limits
- Input validation
- Rate limiting per user
- Proper error handling
- Streaming responses
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Literal
from datetime import date

from app.deps.auth import get_current_user
from app.db.session import get_db
from app.db.models import User
from app.services.ai_router import AIRouter
from app.services.stream import stream_response
from app.services.models import resolve_model
from app.services.prompts import sanitize_prompt
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

# Initialize AI router with providers from config
ai_router = AIRouter(
    groq_keys=settings.GROQ_API_KEYS,
    openrouter_keys=settings.OPENROUTER_API_KEYS,
    hf_key=settings.HUGGINGFACE_API_KEY,
)


# ===== REQUEST VALIDATION =====

class ChatRequest(BaseModel):
    """
    Validated chat request.
    Enforces strict schema and size limits.
    """

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
        """Sanitize and validate prompt."""
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
async def chat(
    request: Request,
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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

    # Validate user exists
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # ===== REQUEST SIZE VALIDATION =====
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
            if size > settings.MAX_REQUEST_SIZE_BYTES:
                logger.warning(
                    f"Request too large from {user.email}: "
                    f"{size} bytes (limit: {settings.MAX_REQUEST_SIZE_BYTES})"
                )
                raise HTTPException(
                    status_code=413,
                    detail=f"Request payload too large (max {settings.MAX_REQUEST_SIZE_BYTES} bytes)",
                )
        except ValueError:
            pass  # Invalid header, ignore

    # ===== RATE LIMITING CHECK =====
    if user.daily_used >= user.daily_quota:
        logger.warning(
            f"Daily quota exceeded for user: {user.email} "
            f"({user.daily_used}/{user.daily_quota})"
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
        provider, real_model = resolve_model(payload.model)
        logger.info(
            f"Model resolved: {payload.model} -> {provider}/{real_model} "
            f"for user {user.email}"
        )
    except KeyError as e:
        logger.error(f"Invalid model selection: {payload.model}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model: {payload.model}",
        )

    # ===== UPDATE USER QUOTA =====
    user.daily_used += 1
    try:
        await db.commit()
        logger.debug(f"User quota updated: {user.email} ({user.daily_used}/{user.daily_quota})")
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user quota for {user.email}: {e}")
        raise HTTPException(status_code=500, detail="Quota update failed")

    # ===== ROUTE TO AI PROVIDER =====
    try:
        logger.info(
            f"Chat request from {user.email}: "
            f"provider={provider}, model={payload.model}, prompt_len={len(payload.prompt)}"
        )

        # Stream response from provider
        stream_generator = await ai_router.stream(
            prompt=payload.prompt,
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
    List available AI models for this user.
    """
    return {
        "models": [
            {
                "id": "fast",
                "name": "Fast ⚡",
                "provider": "groq",
                "description": "Quick responses, good for simple queries",
                "available": len(settings.GROQ_API_KEYS) > 0,
            },
            {
                "id": "balanced",
                "name": "Balanced ⚖️",
                "provider": "openrouter",
                "description": "Balance of speed and quality",
                "available": len(settings.OPENROUTER_API_KEYS) > 0,
            },
            {
                "id": "smart",
                "name": "Smart 🧠",
                "provider": "openrouter",
                "description": "Best quality, slower responses",
                "available": len(settings.OPENROUTER_API_KEYS) > 0,
            },
        ]
    }
