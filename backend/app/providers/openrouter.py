# backend/app/providers/openrouter.py

import httpx
from typing import AsyncIterator

from app.providers.base import AIProvider
from core.errors import AppError


class OpenRouterProvider(AIProvider):
    name = "openrouter"

    async def stream(
        self,
        prompt: str,
        model: str,
        api_key: str,
    ) -> AsyncIterator[str]:

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            async with client.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            ) as response:

                if response.status_code != 200:
                    raise AppError(502, "OpenRouter provider error")

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        chunk = line.removeprefix("data: ").strip()
                        if chunk and chunk != "[DONE]":
                            yield chunk
