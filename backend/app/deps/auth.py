# backend/app/deps/auth.py

"""
Authentication dependencies.
Handles JWT verification, user lookup, and quota enforcement.
"""

from datetime import date
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import verify_jwt
from app.db.session import get_db
from app.db.models import User
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)


async def get_current_user(
    jwt_payload: dict = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get or create user from JWT payload.
    Enforces daily quota and resets.

    Args:
        jwt_payload: Decoded JWT token from verify_jwt
        db: Async database session

    Returns:
        User model instance

    Raises:
        HTTPException 401: If user ID/email invalid
        HTTPException 429: If daily quota exceeded
    """

    user_id = jwt_payload.get("sub")
    email = jwt_payload.get("email")

    # Validate JWT payload
    if not user_id or not email:
        logger.warning("Invalid JWT payload: missing sub or email")
        raise HTTPException(status_code=401, detail="Invalid token")

    # ===== LOOKUP OR CREATE USER =====
    try:
        # Query user by ID
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if user is None:
            # Create new user
            logger.info(f"Creating new user: {email}")
            user = User(
                id=user_id,
                email=email,
                daily_quota=settings.USER_DAILY_QUOTA,
                daily_used=0,
                last_reset=date.today(),
            )
            db.add(user)
            await db.flush()  # Get generated fields
            await db.commit()
        else:
            # User exists, verify email matches
            if user.email != email:
                logger.warning(
                    f"Email mismatch for user {user_id}: "
                    f"token={email}, db={user.email}"
                )
                raise HTTPException(status_code=401, detail="Invalid token")

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error looking up user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication failed")

    # ===== RESET DAILY QUOTA =====
    today = date.today()
    if user.last_reset != today:
        logger.info(f"Resetting quota for {email}")
        user.daily_used = 0
        user.last_reset = today

        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(f"Error resetting quota: {e}")
            raise HTTPException(status_code=500, detail="Quota reset failed")

    # ===== ENFORCE QUOTA =====
    if user.daily_used >= user.daily_quota:
        logger.warning(
            f"Quota exceeded for {email}: {user.daily_used}/{user.daily_quota}"
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Daily quota exceeded",
                "used": user.daily_used,
                "limit": user.daily_quota,
            },
        )

    logger.debug(f"User authenticated: {email} ({user.daily_used}/{user.daily_quota})")
    return user


async def get_admin_user(
    user: User = Depends(get_current_user),
) -> User:
    """
    Verify user is an admin.

    Args:
        user: Current user from get_current_user

    Returns:
        User if admin

    Raises:
        HTTPException 403: If not admin
    """

    if user.email not in settings.ADMIN_EMAILS:
        logger.warning(f"Admin access denied for: {user.email}")
        raise HTTPException(status_code=403, detail="Admin access required")

    return user
