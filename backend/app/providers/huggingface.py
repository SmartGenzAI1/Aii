# backend/app/providers/huggingface.py

import httpx
from typing import AsyncIterator

from app.providers.base import AIProvider
from core.errors import AppError


class HuggingFaceProvider(AIProvider):
    name = "huggingface"

    async def stream(
        self,
        prompt: str,
        model: str,
        api_key: str,
    ) -> AsyncIterator[str]:

        headers = {"Authorization": f"Bearer {api_key}"}
        payload = {"inputs": prompt}

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers,
                json=payload,
            )

        if response.status_code != 200:
            raise AppError(502, "HuggingFace provider error")

        yield response.json()[0]["generated_text"]
