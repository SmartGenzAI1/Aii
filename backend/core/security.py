# backend/app/core/security.py

# backend/app/core/security.py
"""
JWT security layer with proper expiration and validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from jose import jwt, JWTError
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.config import settings
from core.errors import UnauthorizedError
import logging

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)


def create_access_token(
    subject: str,
    email: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: User ID (sub claim)
        email: User email
        expires_delta: Custom expiration (default 24 hours)
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=settings.JWT_EXPIRATION_HOURS)

    now = datetime.now(tz=timezone.utc)
    expire = now + expires_delta

    payload = {
        "sub": subject,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

    logger.info(f"JWT created for user: {email}")
    return encoded_jwt


def verify_jwt_token(token: str) -> Dict:
    """
    Verify JWT token and check expiration.

    Args:
        token: JWT token string

    Returns:
        Decoded payload

    Raises:
        UnauthorizedError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        # Extract claims
        subject = payload.get("sub")
        email = payload.get("email")
        exp = payload.get("exp")
        iat = payload.get("iat")

        # Validate required claims
        if not subject or not email:
            raise UnauthorizedError("Invalid token payload")

        # Validate expiration
        if not exp:
            raise UnauthorizedError("Token missing expiration")

        exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
        now_dt = datetime.now(tz=timezone.utc)

        if exp_dt < now_dt:
            logger.warning(f"Expired token for user: {email}")
            raise UnauthorizedError("Token has expired")

        # Optional: Validate issued-at time (not in future)
        if iat and datetime.fromtimestamp(iat, tz=timezone.utc) > now_dt:
            raise UnauthorizedError("Token issued in future")

        return {
            "sub": subject,
            "email": email,
            "exp": exp,
            "iat": iat,
        }

    except JWTError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        raise UnauthorizedError("Invalid token")


def verify_jwt(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Dict:
    """
    FastAPI dependency to verify JWT from Authorization header.

    Args:
        request: FastAPI request object
        credentials: Bearer token from header

    Returns:
        Decoded JWT payload

    Raises:
        UnauthorizedError: If token missing or invalid
    """
    if credentials is None:
        logger.warning(f"Missing auth token from {request.client.host}")
        raise UnauthorizedError("Missing authorization token")

    token = credentials.credentials
    payload = verify_jwt_token(token)

    # Attach user info to request for logging
    request.state.user_id = payload["sub"]
    request.state.user_email = payload["email"]

    return payload
