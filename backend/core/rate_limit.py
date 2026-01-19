# backend/app/core/rate_limit.py

import time
from collections import defaultdict
from fastapi import Request

from core.errors import RateLimitError


class IPRateLimiter:
    """
    Simple sliding-window IP rate limiter.
    Free-tier friendly.
    """

    def __init__(self, limit: int = 60, window: int = 60):
        self.limit = limit
        self.window = window
        self.hits = defaultdict(list)

    def check(self, request: Request):
        # Security: Safely extract IP address with fallbacks
        client = request.client
        ip = "unknown"
        if client and hasattr(client, 'host') and client.host:
            ip = client.host
        else:
            # Fallback to forwarded headers (security: validate these are from trusted proxy)
            ip = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", "unknown"))

        now = time.time()

        window_start = now - self.window
        hits = [t for t in self.hits[ip] if t > window_start]
        hits.append(now)
        self.hits[ip] = hits

        if len(hits) > self.limit:
            raise RateLimitError("Too many requests")
