# backend/app/api/v1/chat.py

from fastapi import APIRouter, Depends

from app.deps.auth import get_current_user
from app.db.models import User

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat_endpoint(
    user: User = Depends(get_current_user),
):
    """
    Placeholder endpoint.

    Phase 3 will:
    - Increment quota
    - Route to AI providers
    - Stream response
    """
    return {
        "message": "Chat endpoint ready",
        "user": user.email,
    }
