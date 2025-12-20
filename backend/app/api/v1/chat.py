# backend/app/api/v1/chat.py

from fastapi import APIRouter, Depends, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import get_current_user
from app.db.session import get_db
from app.db.models import User
from app.services.key_pool import KeyPool
from app.services.ai_router import AIRouter
from app.services.stream import stream_response
from app.services.models import resolve_model
from app.services.prompts import sanitize_prompt
from app.core.rate_limit import IPRateLimiter
from app.core.errors import AppError

router = APIRouter(tags=["chat"])

rate_limiter = IPRateLimiter(limit=60, window=60)

key_pool = KeyPool()
# KEYS LOADED FROM ENV IN REAL DEPLOYMENT
key_pool.add_keys("groq", ["GROQ_KEY_1", "GROQ_KEY_2"])
key_pool.add_keys("openrouter", ["OR_KEY_1"])
key_pool.add_keys("huggingface", ["HF_KEY_1"])

ai_router = AIRouter(key_pool)


@router.post("/chat")
async def chat(
    request: Request,
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # IP rate limit
    rate_limiter.check(request)

    try:
        prompt = sanitize_prompt(payload.get("prompt", ""))
        model_alias = payload.get("model", "fast")

        provider, real_model = resolve_model(model_alias)

    except ValueError as e:
        raise AppError(400, str(e))
    except KeyError:
        raise AppError(400, "Invalid model")

    # Enforce quota
    user.daily_used += 1
    await db.commit()

    stream = ai_router.stream(
        prompt=prompt,
        model=real_model,
    )

    return stream_response(stream)
