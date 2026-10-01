"""EVENTHUB API Dependencies Module

Provides database session injection, JWT Bearer parsing, user resolution,
and strict role-based authorization guards.
"""

from typing import Generator
import jwt
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_token
from app.core.exceptions import (
    UnauthorizedException,
    ForbiddenException,
)
from app.db.session import SessionLocal
from app.models import User, Organizer

# HTTP Bearer scheme
security_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a transactional SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT access token from Authorization header and return active User.

    Raises UnauthorizedException on invalid, expired, or missing token, or inactive user.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication token is required")

    token = credentials.credentials
    try:
        payload = decode_token(token, expected_type="access")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Token missing subject identifier")
        user_id = int(user_id_str)
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Token has expired. Please login again.")
    except (jwt.PyJWTError, ValueError) as err:
        raise UnauthorizedException(f"Invalid authentication token: {err}")

    user = db.query(User).filter(User.id == user_id).one_or_none()
    if not user:
        raise UnauthorizedException("User associated with token no longer exists")
    if not user.is_active:
        raise UnauthorizedException("User account has been deactivated")

    return user


def require_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency verifying the caller is an active authenticated user."""
    return current_user


def require_customer(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency restricting endpoint to Customer accounts (or Admin)."""
    if current_user.role not in ("CUSTOMER", "ADMIN"):
        raise ForbiddenException("Access restricted to customer accounts")
    return current_user


def require_organizer(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Dependency restricting endpoint to registered Organizers (or Admin)."""
    if current_user.role not in ("ORGANIZER", "ADMIN"):
        raise ForbiddenException("Access restricted to event organizers")
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency strictly restricting endpoint to Administrators."""
    if current_user.role != "ADMIN":
        raise ForbiddenException("Administrative privileges required")
    return current_user
