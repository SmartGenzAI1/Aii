# backend/app/core/security.py

from jose import jwt, JWTError
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.errors import UnauthorizedError

security_scheme = HTTPBearer(auto_error=False)


def verify_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """
    Verifies JWT issued by Auth.js.
    We only validate signature + expiry.
    """

    if credentials is None:
        raise UnauthorizedError("Missing authorization token")

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload

    except JWTError:
        raise UnauthorizedError("Invalid or expired token")
