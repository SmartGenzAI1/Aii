# backend/services/user_service.py
"""
User Service - Microservice for user management
Scalable architecture for 1M+ users
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta

from core.config import settings
from core.enhanced_security import verify_jwt_comprehensive, log_security_event
from core.stability_engine import stability_engine
from core.performance_monitor import performance_monitor
from app.db.session import get_db
from app.db.models import User, Profile, UserSession
from core.exceptions import global_exception_handler
from services.models import resolve_model
from services.prompts import sanitize_prompt

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
    responses={404: {"description": "Not found"}}
)

class UserCreate(BaseModel):
    """User creation request with validation."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=64, description="User password")
    name: Optional[str] = Field(None, max_length=100, description="User full name")
    username: Optional[str] = Field(None, max_length=50, description="Username")

    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

class UserUpdate(BaseModel):
    """User update request."""
    name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    profile_picture: Optional[str] = Field(None, max_length=500)

class UserResponse(BaseModel):
    """User response model."""
    id: int
    email: EmailStr
    name: Optional[str]
    username: Optional[str]
    created_at: datetime
    last_active: Optional[datetime]
    is_active: bool
    is_verified: bool

@router.post(
    "/",
    summary="Create new user",
    description="Register a new user with email and password",
    response_model=UserResponse,
    status_code=201
)
async def create_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user with comprehensive validation."""
    try:
        # Validate email doesn't exist
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Validate username uniqueness
        if user_data.username:
            existing_username = await db.execute(
                select(User).where(User.username == user_data.username)
            )
            if existing_username.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Username already taken"
                )

        # Hash password
        salt = secrets.token_hex(16)
        hashed_password = hashlib.pbkdf2_hmac(
            'sha256',
            user_data.password.encode(),
            salt.encode(),
            200000
        ).hex()

        # Create user
        new_user = User(
            email=user_data.email,
            password_hash=f"{salt}${hashed_password}",
            name=user_data.name,
            username=user_data.username,
            is_active=True,
            is_verified=False
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Create profile
        new_profile = Profile(
            user_id=new_user.id,
            email=new_user.email,
            name=new_user.name or "",
            username=new_user.username
        )

        db.add(new_profile)
        await db.commit()

        # Background: Send welcome email
        background_tasks.add_task(
            send_welcome_email,
            new_user.email,
            new_user.name or "User"
        )

        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            username=new_user.username,
            created_at=new_user.created_at,
            last_active=new_user.last_active,
            is_active=new_user.is_active,
            is_verified=new_user.is_verified
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"User creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="User creation failed"
        )

@router.get(
    "/me",
    summary="Get current user",
    description="Get authenticated user details",
    response_model=UserResponse
)
async def get_current_user(
    auth_data: dict = Depends(verify_jwt_comprehensive),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user details."""
    try:
        user_id = auth_data["user_id"]
        user = await db.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            username=user.username,
            created_at=user.created_at,
            last_active=user.last_active,
            is_active=user.is_active,
            is_verified=user.is_verified
        )

    except Exception as e:
        logger.error(f"Failed to get user: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve user"
        )

@router.put(
    "/me",
    summary="Update current user",
    description="Update authenticated user profile",
    response_model=UserResponse
)
async def update_current_user(
    user_data: UserUpdate,
    auth_data: dict = Depends(verify_jwt_comprehensive),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile."""
    try:
        user_id = auth_data["user_id"]
        user = await db.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Update user fields
        if user_data.name is not None:
            user.name = user_data.name
        if user_data.username is not None:
            # Check username uniqueness
            existing = await db.execute(
                select(User).where(
                    User.username == user_data.username,
                    User.id != user_id
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Username already taken"
                )
            user.username = user_data.username

        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            username=user.username,
            created_at=user.created_at,
            last_active=user.last_active,
            is_active=user.is_active,
            is_verified=user.is_verified
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"User update failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="User update failed"
        )

@router.get(
    "/{user_id}",
    summary="Get user by ID",
    description="Get user details by user ID",
    response_model=UserResponse
)
async def get_user_by_id(
    user_id: int,
    auth_data: dict = Depends(verify_jwt_comprehensive),
    db: AsyncSession = Depends(get_db)
):
    """Get user details by ID (admin or self only)."""
    try:
        current_user_id = auth_data["user_id"]
        current_user = await db.get(User, current_user_id)

        # Check if current user is admin or requesting self
        if current_user_id != user_id and not current_user.is_admin:
            raise HTTPException(
                status_code=403,
                detail="Not authorized"
            )

        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            username=user.username,
            created_at=user.created_at,
            last_active=user.last_active,
            is_active=user.is_active,
            is_verified=user.is_verified
        )

    except Exception as e:
        logger.error(f"Failed to get user by ID: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve user"
        )

async def send_welcome_email(email: str, name: str):
    """Send welcome email to new user."""
    try:
        # In production, integrate with email service
        logger.info(f"Sending welcome email to {email}")
        # await email_service.send(
        #     to=email,
        #     subject="Welcome to GenZ AI!",
        #     template="welcome",
        #     context={"name": name}
        # )
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")

# Register the user service router
def register_user_service(app):
    """Register user service routes with main app."""
    app.include_router(router)
    logger.info("✅ User Service registered")
