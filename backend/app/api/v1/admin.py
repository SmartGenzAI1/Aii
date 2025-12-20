# backend/app/api/v1/admin.py

from fastapi import APIRouter, Depends
from app.deps.auth import get_current_user
from app.db.models import User

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAILS = {"your@email.com"}

@router.get("/stats")
async def stats(user: User = Depends(get_current_user)):
    if user.email not in ADMIN_EMAILS:
        return {"error": "Forbidden"}

    return {
        "total_users": 123,
        "requests_today": 456,
    }
