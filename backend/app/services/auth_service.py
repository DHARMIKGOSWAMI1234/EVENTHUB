"""EVENTHUB Authentication Service"""

from datetime import timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    UnauthorizedException,
)
from app.models import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest


def register_user(db: Session, request: RegisterRequest) -> User:
    """Register a new customer account. Public registration is restricted to CUSTOMER role."""
    normalized_email = request.email.lower().strip()
    existing = db.query(User).filter(User.email == normalized_email).one_or_none()
    if existing:
        raise ConflictException(f"User with email '{normalized_email}' already exists")

    hashed_pw = hash_password(request.password)
    user = User(
        full_name=request.full_name.strip(),
        email=normalized_email,
        password_hash=hashed_pw,
        phone=request.phone.strip() if request.phone else None,
        role="CUSTOMER",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, request: LoginRequest) -> TokenResponse:
    """Validate user credentials and return access and refresh tokens."""
    normalized_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).one_or_none()
    if not user:
        raise UnauthorizedException("Invalid email or password")

    if not verify_password(request.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedException("User account has been deactivated")

    # Generate tokens
    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def refresh_access_token(db: Session, request: RefreshTokenRequest) -> TokenResponse:
    """Issue a fresh access and refresh token pair using a valid refresh token."""
    try:
        payload = decode_token(request.refresh_token, expected_type="refresh")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Refresh token missing subject identifier")
        user_id = int(user_id_str)
    except Exception as e:
        raise UnauthorizedException(f"Invalid or expired refresh token: {e}")

    user = db.query(User).filter(User.id == user_id).one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedException("User associated with refresh token is invalid or inactive")

    token_data = {"sub": str(user.id), "role": user.role}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
