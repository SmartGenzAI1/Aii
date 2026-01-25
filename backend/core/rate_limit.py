# backend/app/core/rate_limit.py

import time
from collections import defaultdict
from fastapi import Request

from core.errors import RateLimitError


class IPRateLimiter:
    """
    Sliding-window IP rate limiter with memory optimization.
    Provides per-IP request throttling with automatic cleanup.
    """

    def __init__(self, limit: int = 60, window: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            limit: Max requests per window
            window: Time window in seconds
        """
        self.limit = limit
        self.window = window
        self.hits = defaultdict(list)
        self.last_cleanup = time.time()

    def check(self, request: Request) -> bool:
        """
        Check if request is within rate limit.
        
        Args:
            request: FastAPI request object
            
        Raises:
            RateLimitError: If rate limit exceeded
        """
        # Safely extract client IP with fallbacks
        client = request.client
        ip = "unknown"
        
        if client and hasattr(client, 'host') and client.host:
            ip = client.host
        else:
            # Fallback to forwarded headers
            # Security: These headers should only be trusted from configured proxies
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                # X-Forwarded-For can contain multiple IPs, take the first one
                ip = forwarded.split(",")[0].strip()
            else:
                ip = request.headers.get("X-Real-IP", "unknown")

        now = time.time()

        # Clean up old entries periodically (prevent unbounded memory growth)
        if now - self.last_cleanup > 300:  # Cleanup every 5 minutes
            self._cleanup_old_hits()
            self.last_cleanup = now

        # Remove timestamps outside the window
        window_start = now - self.window
        self.hits[ip] = [t for t in self.hits[ip] if t > window_start]
        
        # Add current request
        self.hits[ip].append(now)

        # Check limit
        if len(self.hits[ip]) > self.limit:
            raise RateLimitError(f"Rate limit exceeded ({self.limit} requests per {self.window}s)")

        return True

    def _cleanup_old_hits(self):
        """Remove empty IP entries to prevent memory growth."""
        now = time.time()
        window_start = now - self.window
        
        # Remove IPs with no recent hits
        ips_to_remove = []
        for ip, timestamps in self.hits.items():
            recent = [t for t in timestamps if t > window_start]
            if not recent:
                ips_to_remove.append(ip)
            else:
                self.hits[ip] = recent  # Keep only recent hits
        
        for ip in ips_to_remove:
            del self.hits[ip]
