# backend/app/providers/groq.py

import httpx
from typing import AsyncIterator

from app.providers.base import AIProvider
from core.errors import AppError


class GroqProvider(AIProvider):
    name = "groq"

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

        timeout = httpx.Timeout(20.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
            ) as response:

                if response.status_code != 200:
                    raise AppError(502, "Groq provider error")

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        chunk = line.removeprefix("data: ").strip()
                        if chunk and chunk != "[DONE]":
                            yield chunk
