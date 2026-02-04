# backend/core/model_provider.py
"""
Intelligent model provider selection with local model auto-detection.
Provides secure, resilient model routing with automatic fallback.
"""

import asyncio
import aiohttp
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from core.config import settings
import logging

logger = logging.getLogger(__name__)


class ModelProvider(Enum):
    """Supported model providers with priority order."""
    LOCAL = "local"      # Ollama, local servers
    GROQ = "groq"        # Fast remote inference
    OPENROUTER = "openrouter"  # Broad model selection
    OPENAI = "openai"    # Fallback premium models


@dataclass
class ModelHealth:
    """Health status of a model provider."""
    provider: ModelProvider
    healthy: bool
    latency_ms: Optional[float] = None
    last_checked: float = 0
    error_count: int = 0


class ModelRouter:
    """
    Intelligent model routing with local detection and fallback.
    Security-first design with timeouts and circuit breaking.
    """

    def __init__(self):
        self.health_cache: Dict[ModelProvider, ModelHealth] = {}
        self.cache_timeout = 300  # 5 minutes
        self.max_errors = 3  # Circuit breaker threshold
        self.request_timeout = 10  # seconds

    async def get_best_provider(self, model_id: str) -> ModelProvider:
        """
        Get the best available provider for a model.
        Prioritizes local models, falls back safely to remote.
        """
        # Always check local first if available
        if await self._check_local_availability():
            return ModelProvider.LOCAL

        # Check cached health for remote providers
        healthy_providers = await self._get_healthy_providers()

        # Priority order for fallback
        priority = [ModelProvider.GROQ, ModelProvider.OPENROUTER, ModelProvider.OPENAI]

        for provider in priority:
            if provider in healthy_providers:
                return provider

        # Ultimate fallback - use first available
        if healthy_providers:
            return healthy_providers[0]

        # Emergency fallback to Groq (most reliable)
        logger.warning("All providers unhealthy, using Groq as emergency fallback")
        return ModelProvider.GROQ

    async def _check_local_availability(self) -> bool:
        """Check if local Ollama server is available."""
        if not settings.OLLAMA_URL:
            return False

        # Check cache first
        now = time.time()
        if ModelProvider.LOCAL in self.health_cache:
            cached = self.health_cache[ModelProvider.LOCAL]
            if (now - cached.last_checked) < self.cache_timeout:
                return cached.healthy

        try:
            # Quick health check to Ollama
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=3)) as session:
                url = f"{settings.OLLAMA_URL.rstrip('/')}/api/tags"
                start_time = time.time()

                async with session.get(url) as response:
                    latency = (time.time() - start_time) * 1000

                    if response.status == 200:
                        # Verify we can actually get models
                        data = await response.json()
                        if isinstance(data, dict) and 'models' in data:
                            self._update_health(ModelProvider.LOCAL, True, latency)
                            logger.info(f"Local Ollama detected: {len(data.get('models', []))} models available")
                            return True

        except Exception as e:
            logger.debug(f"Local Ollama check failed: {e}")

        self._update_health(ModelProvider.LOCAL, False)
        return False

    async def _get_healthy_providers(self) -> List[ModelProvider]:
        """Get list of healthy remote providers."""
        providers = [ModelProvider.GROQ, ModelProvider.OPENROUTER, ModelProvider.OPENAI]
        healthy = []

        for provider in providers:
            if await self._check_provider_health(provider):
                healthy.append(provider)

        return healthy

    async def _check_provider_health(self, provider: ModelProvider) -> bool:
        """Check health of a remote provider."""
        now = time.time()
        if provider in self.health_cache:
            cached = self.health_cache[provider]
            if (now - cached.last_checked) < self.cache_timeout:
                return cached.healthy and cached.error_count < self.max_errors

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.request_timeout)) as session:
                start_time = time.time()

                # Provider-specific health checks
                if provider == ModelProvider.GROQ:
                    await self._test_groq_health(session)
                elif provider == ModelProvider.OPENROUTER:
                    await self._test_openrouter_health(session)
                elif provider == ModelProvider.OPENAI:
                    await self._test_openai_health(session)

                latency = (time.time() - start_time) * 1000
                self._update_health(provider, True, latency)
                return True

        except Exception as e:
            logger.debug(f"Provider {provider.value} health check failed: {e}")
            self._update_health(provider, False)
            return False

    async def _test_groq_health(self, session: aiohttp.ClientSession) -> None:
        """Test Groq API health."""
        if not settings.GROQ_API_KEYS:
            raise ValueError("No Groq API keys")

        # Simple models list request
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEYS[0]}"}
        async with session.get("https://api.groq.com/openai/v1/models", headers=headers) as response:
            response.raise_for_status()

    async def _test_openrouter_health(self, session: aiohttp.ClientSession) -> None:
        """Test OpenRouter API health."""
        if not settings.OPENROUTER_API_KEYS:
            raise ValueError("No OpenRouter API keys")

        # Simple models list request
        headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEYS[0]}"}
        async with session.get("https://openrouter.ai/api/v1/models", headers=headers) as response:
            response.raise_for_status()

    async def _test_openai_health(self, session: aiohttp.ClientSession) -> None:
        """Test OpenAI API health."""
        if not settings.OPENAI_API_KEY:
            raise ValueError("No OpenAI API key")

        # Simple models list request
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        async with session.get("https://api.openai.com/v1/models", headers=headers) as response:
            response.raise_for_status()

    def _update_health(self, provider: ModelProvider, healthy: bool, latency: Optional[float] = None) -> None:
        """Update health status for a provider."""
        if provider not in self.health_cache:
            self.health_cache[provider] = ModelHealth(provider=provider, healthy=healthy)

        health = self.health_cache[provider]
        health.healthy = healthy
        health.last_checked = time.time()

        if healthy:
            health.latency_ms = latency
            health.error_count = 0
        else:
            health.error_count += 1

    def get_provider_config(self, provider: ModelProvider) -> Dict[str, Any]:
        """Get configuration for a specific provider."""
        configs = {
            ModelProvider.LOCAL: {
                "base_url": settings.OLLAMA_URL,
                "type": "ollama"
            },
            ModelProvider.GROQ: {
                "api_key": settings.GROQ_API_KEYS[0] if settings.GROQ_API_KEYS else None,
                "base_url": "https://api.groq.com/openai/v1",
                "type": "openai-compatible"
            },
            ModelProvider.OPENROUTER: {
                "api_key": settings.OPENROUTER_API_KEYS[0] if settings.OPENROUTER_API_KEYS else None,
                "base_url": "https://openrouter.ai/api/v1",
                "type": "openai-compatible"
            },
            ModelProvider.OPENAI: {
                "api_key": settings.OPENAI_API_KEY,
                "base_url": "https://api.openai.com/v1",
                "type": "openai"
            }
        }

        return configs.get(provider, {})


# Global instance
model_router = ModelRouter()