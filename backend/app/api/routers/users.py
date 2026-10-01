"""EVENTHUB User Profile API Router

Provides profile retrieval, profile updates, and public profile views.
Excludes password_hash and internal credentials.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_authenticated_user
from app.models import User
from app.schemas.users import UserResponse, UserUpdateRequest
from app.services.user_service import get_user_by_id, update_user_profile

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get caller profile",
)
def get_current_user_profile(
    current_user: User = Depends(require_authenticated_user),
) -> User:
    """Retrieve full profile information for the authenticated caller."""
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update caller profile",
)
def update_current_user_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> User:
    """Update profile details (name, phone) for the authenticated caller."""
    return update_user_profile(db, current_user, request)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user profile by ID",
)
def get_user_profile(
    user_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> User:
    """Retrieve safe user profile by ID."""
    return get_user_by_id(db, user_id)
