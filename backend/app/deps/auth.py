# backend/app/deps/auth.py

from datetime import date

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import verify_jwt
from app.db.session import get_db
from app.db.models import User
from app.core.errors import RateLimitError


async def get_current_user(
    jwt_payload: dict = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Loads or creates user based on JWT.
    Enforces daily quota.
    """

    user_id = jwt_payload.get("sub")
    email = jwt_payload.get("email")

    if not user_id or not email:
        raise RateLimitError("Invalid token payload")

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    today = date.today()

    if user is None:
        user = User(
            id=user_id,
            email=email,
            last_reset=today,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Daily quota reset
    if user.last_reset != today:
        user.daily_used = 0
        user.last_reset = today
        await db.commit()

    if user.daily_used >= user.daily_quota:
        raise RateLimitError("Daily quota exceeded")

    return user
