# backend/app/api/v1/health.py

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health endpoint.
    Used by:
    - Render health checks
    - UptimeRobot / cron pings
    - Cold-start detection
    """
    return {
        "status": "ok",
        "service": "backend",
    }
