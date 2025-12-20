#backend/app/api/status.py
from fastapi import APIRouter
from app.services.rate_limiter import provider_stats

router = APIRouter()

@router.get("/status")
def status():
    return provider_stats()
