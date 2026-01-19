# backend/services/models.py

"""
Intelligent model resolution with auto-detection and fallback.
Users get optimal provider selection without seeing complexity.
"""

import asyncio
from typing import Dict, Any, Tuple
from core.model_provider import model_router, ModelProvider
import logging

logger = logging.getLogger(__name__)

# Base model configurations (fallback when auto-detection fails)
MODEL_CONFIGS = {
    "fast": {
        "preferred_providers": [ModelProvider.GROQ, ModelProvider.OPENROUTER],
        "models": {
            ModelProvider.GROQ: "llama-3.1-8b-instant",
            ModelProvider.OPENROUTER: "meta-llama/llama-3.1-8b-instruct",
            ModelProvider.LOCAL: "llama3.1:8b",  # Ollama format
        }
    },
    "balanced": {
        "preferred_providers": [ModelProvider.GROQ, ModelProvider.OPENROUTER],
        "models": {
            ModelProvider.GROQ: "llama-3.1-70b-versatile",
            ModelProvider.OPENROUTER: "anthropic/claude-3-haiku",
            ModelProvider.LOCAL: "llama3.1:70b",  # Ollama format
        }
    },
    "smart": {
        "preferred_providers": [ModelProvider.OPENROUTER, ModelProvider.GROQ],
        "models": {
            ModelProvider.OPENROUTER: "openai/gpt-4o-mini",
            ModelProvider.GROQ: "mixtral-8x7b-32768",
            ModelProvider.LOCAL: "mistral",  # Ollama format
        }
    },
}


async def resolve_model(alias: str) -> Tuple[str, str]:
    """
    Intelligently resolves model alias to best available provider and model.
    Uses auto-detection for local models, falls back to healthy remote providers.

    Args:
        alias: Model alias (fast, balanced, smart)

    Returns:
        Tuple of (provider_name, model_name)

    Raises:
        KeyError: If alias is invalid
    """
    config = MODEL_CONFIGS.get(alias)
    if not config:
        raise KeyError(f"Invalid model selection: {alias}")

    # Get the best available provider for this model class
    best_provider = await model_router.get_best_provider(alias)

    # Get the model name for this provider
    model_name = config["models"].get(best_provider)

    if not model_name:
        # Fallback to first available model if preferred provider doesn't have this model
        for provider, model in config["models"].items():
            if provider != best_provider:  # Skip the already tried provider
                # Check if this provider is healthy
                if await model_router._check_provider_health(provider):
                    best_provider = provider
                    model_name = model
                    logger.warning(f"Falling back to {best_provider.value} for {alias} (model not available on {model_router.get_best_provider.__name__})")
                    break

    if not model_name:
        # Ultimate fallback - use any available model
        for provider, model in config["models"].items():
            if model:
                best_provider = provider
                model_name = model
                logger.warning(f"Emergency fallback to {best_provider.value} for {alias}")
                break

    provider_name = best_provider.value
    logger.info(f"Resolved {alias} -> {provider_name}/{model_name}")

    return provider_name, model_name


def get_model_config(alias: str) -> Dict[str, Any]:
    """
    Get full configuration for a model alias.
    Used by frontend to show available models.
    """
    config = MODEL_CONFIGS.get(alias)
    if not config:
        raise KeyError(f"Invalid model selection: {alias}")

    return {
        "id": alias,
        "available_providers": [p.value for p in config["preferred_providers"]],
        "models": {p.value: m for p, m in config["models"].items()},
    }
