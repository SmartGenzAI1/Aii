#backend/app/core/providers.py

import os

PROVIDERS = {
    "groq": [
        os.getenv("GROQ_API_KEY_1"),
        os.getenv("GROQ_API_KEY_2"),
        os.getenv("GROQ_API_KEY_3"),
    ],
    "openrouter": [
        os.getenv("OPENROUTER_API_KEY_1"),
        os.getenv("OPENROUTER_API_KEY_2"),
    ],
    "huggingface": [
        os.getenv("HF_API_KEY"),
    ],
}

LIMITS = {
    "groq": 49,
    "openrouter": 90,
    "huggingface": 25,
}
