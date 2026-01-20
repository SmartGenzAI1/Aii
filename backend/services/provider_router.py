#backend/app/services/provider_router.py

"""
Central AI Provider Router
--------------------------
Responsibilities:
- Abstract all AI providers (Groq, OpenRouter, HuggingFace, Scraper)
- Enforce provider-level rate limits
- Rotate API keys safely
- Handle automatic fallback
- Hide provider identity from users
- Return a unified response format

This file is the ONLY place where provider logic lives.
"""

import time
import random
import logging
import httpx
from typing import Dict, List
from core.config import settings
from core.status import status

logger = logging.getLogger(__name__)
# -------------------------
# Provider rate limits (RPM)
# -------------------------
PROVIDER_LIMITS = {
    "groq": 49,          # per key
    "openrouter": 60,    # per key
    "huggingface": 30,
    "scraper": 20,
}

# -------------------------
# Runtime usage tracking
# -------------------------
_usage: Dict[str, Dict[str, List[float]]] = {
    "groq": {},
    "openrouter": {},
    "huggingface": {},
    "scraper": {},
}


def _clean_old(ts_list: List[float], window: int = 60) -> List[float]:
    """Remove timestamps older than window seconds"""
    now = time.time()
    return [ts for ts in ts_list if now - ts < window]


def _can_use(provider: str, key: str) -> bool:
    """Check if provider key is under rate limit"""
    ts_list = _usage[provider].get(key, [])
    ts_list = _clean_old(ts_list)
    _usage[provider][key] = ts_list
    return len(ts_list) < PROVIDER_LIMITS[provider]


def _mark_use(provider: str, key: str):
    """Mark usage for provider key"""
    _usage[provider].setdefault(key, []).append(time.time())


# =====================================================
# Provider Call Implementations
# =====================================================

async def call_groq(prompt: str, model: str) -> str:
    keys = settings.groq_api_keys
    random.shuffle(keys)

    for key in keys:
        if not _can_use("groq", key):
            continue

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
            res.raise_for_status()
            _mark_use("groq", key)
            return res.json()["choices"][0]["message"]["content"]

        except Exception as e:
            logger.warning(f"Groq API call failed: {str(e)}")

    raise RuntimeError("Groq unavailable")


async def call_openrouter(prompt: str, model: str) -> str:
    keys = settings.openrouter_api_keys
    random.shuffle(keys)

    for key in keys:
        if not _can_use("openrouter", key):
            continue

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {key}",
                        "HTTP-Referer": settings.APP_URL,
                        "X-Title": "GenZ AI",
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
            res.raise_for_status()
            _mark_use("openrouter", key)
            return res.json()["choices"][0]["message"]["content"]

        except Exception as e:
            logger.warning(f"OpenRouter failed: {e}")

    raise RuntimeError("OpenRouter unavailable")


async def call_huggingface(prompt: str) -> str:
    key = settings.HUGGINGFACE_API_KEY

    if not key:
        raise RuntimeError("HuggingFace API key not configured")

    if not _can_use("huggingface", key):
        raise RuntimeError("HF rate limit")

    async with httpx.AsyncClient(timeout=25) as client:
        res = await client.post(
            settings.HF_MODEL_ENDPOINT,
            headers={"Authorization": f"Bearer {key}"},
            json={"inputs": prompt},
        )

    res.raise_for_status()
    _mark_use("huggingface", key)
    return res.json()[0]["generated_text"]


async def call_scraper(query: str) -> str:
    """
    Placeholder scraper logic.
    Real implementation will scrape + summarize.
    """
    if not _can_use("scraper", "default"):
        raise RuntimeError("Scraper rate limit")

    _mark_use("scraper", "default")
    return f"Web search results summary for: {query}"


# =====================================================
# Public Router (USED BY API)
# =====================================================

async def generate_response(prompt: str, mode: str) -> Dict:
    """
    mode:
    - fast
    - balanced
    - smart
    """

    try:
        if mode == "fast":
            text = await call_groq(prompt, settings.GROQ_FAST_MODEL)

        elif mode == "balanced":
            try:
                text = await call_openrouter(prompt, settings.OPENROUTER_BALANCED_MODEL)
            except Exception:
                text = await call_groq(prompt, settings.GROQ_FAST_MODEL)

        elif mode == "smart":
            try:
                text = await call_openrouter(prompt, settings.OPENROUTER_SMART_MODEL)
            except Exception:
                text = await call_huggingface(prompt)

        else:
            raise ValueError("Invalid mode")

        return {
            "assistant": "GenZ",
            "mode": mode,
            "content": text,
        }

    except Exception as e:
        logger.error(f"All providers failed: {e}")
        return {
            "assistant": "GenZ",
            "mode": mode,
            "content": "GenZ AI is temporarily unavailable. Please try again shortly.",
            "error": True,
        }
