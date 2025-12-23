# backend/app/api/v1/__init__.py
"""API v1 routers."""

from . import chat, status, health, admin, web_search

__all__ = ["chat", "status", "health", "admin", "web_search"]
