#backend/app/services/router.py

from app.services.rate_limiter import get_available_provider
from app.services.adapters import groq, openrouter, huggingface

HANDLERS = {
    "groq": groq.generate,
    "openrouter": openrouter.generate,
    "huggingface": huggingface.generate,
}

async def route_request(prompt: str):
    provider, key = get_available_provider()
    if not provider:
        return "All AI systems are busy. Please try again shortly."

    return await HANDLERS[provider](prompt, key)
