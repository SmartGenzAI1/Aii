# backend/app/services/models.py

"""
Model alias registry.
Users never see real provider model names.
You can swap models anytime without UI changes.
"""

MODEL_MAP = {
    "fast": {
        "provider": "groq",
        "model": "llama-3.1-8b-instant",
    },
    "balanced": {
        "provider": "groq",
        "model": "llama-3.1-70b",
    },
    "smart": {
        "provider": "openrouter",
        "model": "openai/gpt-4o-mini",
    },
}


def resolve_model(alias: str) -> tuple[str, str]:
    """
    Resolves public alias to provider + real model.
    Raises KeyError if invalid.
    """
    config = MODEL_MAP.get(alias)
    if not config:
        raise KeyError("Invalid model selection")

    return config["provider"], config["model"]
