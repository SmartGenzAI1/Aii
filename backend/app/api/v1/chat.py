# backend/app/api/v1/chat.py

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import get_current_user
from app.db.session import get_db
from app.db.models import User
from app.services.key_pool import KeyPool
from app.services.ai_router import AIRouter
from app.services.stream import stream_response

router = APIRouter(tags=["chat"])

# Global key pool (loaded once)
key_pool = KeyPool()

# Example: load keys from env (DO THIS AT STARTUP)
key_pool.add_keys("groq", ["GROQ_KEY_1", "GROQ_KEY_2"])
key_pool.add_keys("openrouter", ["OR_KEY_1"])
key_pool.add_keys("huggingface", ["HF_KEY_1"])

ai_router = AIRouter(key_pool)


@router.post("/chat")
async def chat(
    data: dict = Body(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prompt = data.get("prompt")
    model = data.get("model", "default")

    # Increment usage early to prevent abuse
    user.daily_used += 1
    await db.commit()

    stream = ai_router.stream(prompt=prompt, model=model)
    return stream_response(stream)
