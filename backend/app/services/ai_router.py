# backend/app/services/ai_router.py

from typing import AsyncIterator

from app.services.key_pool import KeyPool
from app.providers.groq import GroqProvider
from app.providers.openrouter import OpenRouterProvider
from app.providers.huggingface import HuggingFaceProvider
from app.core.errors import AppError


class AIRouter:
    """
    Selects provider + key.
    Handles fallback automatically.
    """

    def __init__(self, key_pool: KeyPool):
        self.key_pool = key_pool
        self.providers = [
            GroqProvider(),
            OpenRouterProvider(),
            HuggingFaceProvider(),
        ]

    async def stream(
        self,
        prompt: str,
        model: str,
    ) -> AsyncIterator[str]:

        for provider in self.providers:
            key = self.key_pool.acquire(provider.name)
            if not key:
                continue

            try:
                async for chunk in provider.stream(
                    prompt=prompt,
                    model=model,
                    api_key=key.key,
                ):
                    yield chunk

                self.key_pool.mark_used(provider.name, key)
                return

            except Exception:
                self.key_pool.cooldown(provider.name, key)
                continue

        raise AppError(503, "All AI providers unavailable")
