# backend/app/services/ai_router.py
"""
Central AI Provider Router
Handles routing requests to multiple AI providers with fallback support.
"""

import random
import logging
from typing import AsyncIterator, List, Optional
from app.core.system_prompt import SYSTEM_PROMPT
from app.providers.groq import GroqProvider
from app.providers.openrouter import OpenRouterProvider
from app.providers.huggingface import HuggingFaceProvider

logger = logging.getLogger(__name__)


class AIRouter:
    """
    Routes AI requests across multiple providers with fallback support.
    Accepts API keys and manages provider selection.
    """

    def __init__(
        self,
        groq_keys: Optional[List[str]] = None,
        openrouter_keys: Optional[List[str]] = None,
        hf_key: Optional[str] = None,
    ):
        """
        Initialize AI Router with provider API keys.

        Args:
            groq_keys: List of Groq API keys
            openrouter_keys: List of OpenRouter API keys
            hf_key: HuggingFace API key
        """
        self.groq_keys = [k for k in (groq_keys or []) if k]
        self.openrouter_keys = [k for k in (openrouter_keys or []) if k]
        self.hf_key = hf_key

        # Initialize providers
        self.groq_provider = GroqProvider()
        self.openrouter_provider = OpenRouterProvider()
        self.hf_provider = HuggingFaceProvider()

        logger.info(
            f"AIRouter initialized: "
            f"Groq keys={len(self.groq_keys)}, "
            f"OpenRouter keys={len(self.openrouter_keys)}, "
            f"HF key={'yes' if self.hf_key else 'no'}"
        )

    async def stream(
        self,
        prompt: str,
        model: str,
        provider: str,
    ) -> AsyncIterator[str]:
        """
        Stream AI response from specified provider.

        Args:
            prompt: User prompt
            model: Model name
            provider: Provider name (groq, openrouter, huggingface)

        Yields:
            Response chunks from AI provider

        Raises:
            ValueError: If provider not found or no keys available
            RuntimeError: If all providers fail
        """

        # Prepare system prompt
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        if provider == "groq":
            if not self.groq_keys:
                raise ValueError("No Groq API keys configured")
            async for chunk in self._stream_groq(prompt, model):
                yield chunk

        elif provider == "openrouter":
            if not self.openrouter_keys:
                raise ValueError("No OpenRouter API keys configured")
            async for chunk in self._stream_openrouter(prompt, model):
                yield chunk

        elif provider == "huggingface":
            if not self.hf_key:
                raise ValueError("No HuggingFace API key configured")
            async for chunk in self._stream_huggingface(prompt, model):
                yield chunk

        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def _stream_groq(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from Groq."""
        if not self.groq_keys:
            raise RuntimeError("No Groq keys available")

        # Try each key
        for key in self.groq_keys:
            try:
                logger.debug(f"Trying Groq with key: {key[:10]}...")
                async for chunk in self.groq_provider.stream(
                    prompt=prompt,
                    model=model,
                    api_key=key,
                ):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Groq failed with key {key[:10]}: {e}")
                continue

        raise RuntimeError("All Groq keys exhausted")

    async def _stream_openrouter(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from OpenRouter."""
        if not self.openrouter_keys:
            raise RuntimeError("No OpenRouter keys available")

        # Try each key
        for key in self.openrouter_keys:
            try:
                logger.debug(f"Trying OpenRouter with key: {key[:10]}...")
                async for chunk in self.openrouter_provider.stream(
                    prompt=prompt,
                    model=model,
                    api_key=key,
                ):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"OpenRouter failed with key {key[:10]}: {e}")
                continue

        raise RuntimeError("All OpenRouter keys exhausted")

    async def _stream_huggingface(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from HuggingFace."""
        if not self.hf_key:
            raise RuntimeError("HuggingFace key not configured")

        try:
            logger.debug("Trying HuggingFace...")
            async for chunk in self.hf_provider.stream(
                prompt=prompt,
                model=model,
                api_key=self.hf_key,
            ):
                yield chunk
        except Exception as e:
            logger.error(f"HuggingFace failed: {e}")
            raise RuntimeError(f"HuggingFace unavailable: {e}")
