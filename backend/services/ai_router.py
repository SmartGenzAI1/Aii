# backend/app/services/ai_router.py
"""
Central AI Provider Router
Handles routing requests to multiple AI providers with fallback support.
"""

import random
import logging
from typing import AsyncIterator, List, Optional
from core.system_prompt import SYSTEM_PROMPT
from core.config import settings
from app.providers.groq import GroqProvider
from app.providers.openrouter import OpenRouterProvider
from app.providers.huggingface import HuggingFaceProvider
from app.providers.ollama import OllamaProvider

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
        self.ollama_provider = OllamaProvider()

        logger.info(
            f"AIRouter initialized: "
            f"Groq keys={len(self.groq_keys)}, "
            f"OpenRouter keys={len(self.openrouter_keys)}, "
            f"HF key={'yes' if self.hf_key else 'no'}, "
            f"Ollama={'configured' if settings.OLLAMA_URL else 'not configured'}"
        )

    async def stream(
        self,
        prompt: str,
        model: str,
        provider: str,
    ) -> AsyncIterator[str]:
        """
        Stream AI response from specified provider with comprehensive error handling.

        Args:
            prompt: User prompt
            model: Model name
            provider: Provider name (groq, openrouter, huggingface, local)

        Yields:
            Response chunks from AI provider

        Raises:
            ValueError: If provider not found or no keys available
            RuntimeError: If all providers fail
        """
        # Validate inputs
        if not prompt or not isinstance(prompt, str):
            raise ValueError("Prompt must be a non-empty string")
        if not model:
            raise ValueError("Model name is required")

        try:
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

            elif provider == "local":
                # Local Ollama provider - no API key needed
                async for chunk in self._stream_ollama(prompt, model):
                    yield chunk

            else:
                raise ValueError(
                    f"Unknown provider: {provider}. "
                    f"Available providers: groq, openrouter, huggingface, local"
                )
        except ValueError:
            # Re-raise validation errors
            raise
        except Exception as e:
            logger.error(f"Error streaming from {provider}: {e}", exc_info=e)
            raise RuntimeError(f"Failed to stream from {provider}: {str(e)}")

    async def _stream_groq(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from Groq with key rotation and error handling."""
        if not self.groq_keys:
            raise RuntimeError("No Groq keys available")

        last_error = None
        # Try each key
        for idx, key in enumerate(self.groq_keys):
            try:
                logger.debug(f"Attempting Groq with key index {idx}/{len(self.groq_keys)}")
                async for chunk in self.groq_provider.stream(
                    prompt=prompt,
                    model=model,
                    api_key=key,
                ):
                    yield chunk
                return
            except Exception as e:
                last_error = e
                logger.warning(f"Groq key {idx} failed: {type(e).__name__}: {str(e)}")
                if idx < len(self.groq_keys) - 1:
                    continue
                break

        raise RuntimeError(f"All Groq keys exhausted. Last error: {last_error}")

    async def _stream_openrouter(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from OpenRouter with key rotation and error handling."""
        if not self.openrouter_keys:
            raise RuntimeError("No OpenRouter keys available")

        last_error = None
        # Try each key
        for idx, key in enumerate(self.openrouter_keys):
            try:
                logger.debug(f"Attempting OpenRouter with key index {idx}/{len(self.openrouter_keys)}")
                async for chunk in self.openrouter_provider.stream(
                    prompt=prompt,
                    model=model,
                    api_key=key,
                ):
                    yield chunk
                return
            except Exception as e:
                last_error = e
                logger.warning(f"OpenRouter key {idx} failed: {type(e).__name__}: {str(e)}")
                if idx < len(self.openrouter_keys) - 1:
                    continue
                break

        raise RuntimeError(f"All OpenRouter keys exhausted. Last error: {last_error}")

    async def _stream_huggingface(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from HuggingFace with proper error handling."""
        if not self.hf_key:
            raise RuntimeError("HuggingFace key not configured")

        try:
            logger.debug("Attempting HuggingFace...")
            async for chunk in self.hf_provider.stream(
                prompt=prompt,
                model=model,
                api_key=self.hf_key,
            ):
                yield chunk
        except Exception as e:
            logger.error(f"HuggingFace failed: {type(e).__name__}: {str(e)}", exc_info=e)
            raise RuntimeError(f"HuggingFace unavailable: {str(e)}")

    async def _stream_ollama(self, prompt: str, model: str) -> AsyncIterator[str]:
        """Stream response from local Ollama with proper error handling."""
        try:
            logger.debug(f"Attempting Ollama with model: {model}")
            async for chunk in self.ollama_provider.stream(
                prompt=prompt,
                model=model,
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Ollama failed: {type(e).__name__}: {str(e)}", exc_info=e)
            raise RuntimeError(f"Ollama unavailable: {str(e)}")
