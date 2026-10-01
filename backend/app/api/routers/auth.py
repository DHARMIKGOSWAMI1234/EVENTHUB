"""EVENTHUB Authentication API Router

Handles user registration, authentication, token refresh, current identity retrieval,
and stateless session termination.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_authenticated_user
from app.models import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.users import UserResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import (
    register_user,
    authenticate_user,
    refresh_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new customer account",
)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> User:
    """Register a new customer account.

    Public registration assigns the CUSTOMER role by default.
    Administrative privileges cannot be claimed publicly.
    """
    return register_user(db, request)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login authentication",
)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate with email and password to receive JWT access and refresh tokens."""
    return authenticate_user(db, request)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
def refresh(request: RefreshTokenRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Issue a fresh access and refresh token pair using a valid refresh token."""
    return refresh_access_token(db, request)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user identity",
)
def get_me(current_user: User = Depends(require_authenticated_user)) -> User:
    """Retrieve identity profile of the currently authenticated caller."""
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="User logout",
)
def logout(current_user: User = Depends(require_authenticated_user)) -> MessageResponse:
    """Stateless session termination. Client should discard stored tokens."""
    return MessageResponse(message="Successfully logged out")
