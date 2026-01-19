#backend/app/services/rate_limiter.py

import time
from core.providers import PROVIDERS, LIMITS

usage = {}
windows = {}

def provider_stats():
    result = {}
    for provider, keys in PROVIDERS.items():
        used = sum(usage.get(f"{provider}:{k}", 0) for k in keys if k)
        result[provider] = {
            "used": used,
            "limit": LIMITS[provider],
            "status": "green" if used < LIMITS[provider]*0.7 else "orange"
        }
    return result

def get_available_provider():
    now = time.time()

    for provider, keys in PROVIDERS.items():
        limit = LIMITS[provider]

        for key in keys:
            if not key:
                continue

            k = f"{provider}:{key}"
            if now - windows.get(k, 0) > 60:
                usage[k] = 0
                windows[k] = now

            if usage.get(k, 0) < limit:
                usage[k] = usage.get(k, 0) + 1
                return provider, key

    return None, None
