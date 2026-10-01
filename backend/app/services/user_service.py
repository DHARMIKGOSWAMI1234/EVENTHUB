"""EVENTHUB User Service"""

from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import User
from app.schemas.users import UserUpdateRequest, UserRoleUpdateRequest, UserStatusUpdateRequest


def get_user_by_id(db: Session, user_id: int) -> User:
    """Retrieve user by ID or raise NotFoundException."""
    user = db.query(User).filter(User.id == user_id).one_or_none()
    if not user:
        raise NotFoundException("User", user_id)
    return user


def update_user_profile(db: Session, user: User, update_data: UserUpdateRequest) -> User:
    """Update current user profile information."""
    if update_data.full_name is not None:
        user.full_name = update_data.full_name.strip()
    if update_data.phone is not None:
        user.phone = update_data.phone.strip() if update_data.phone else None
    
    db.commit()
    db.refresh(user)
    return user


def list_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
) -> Tuple[List[User], int]:
    """Retrieve paginated list of users with optional filtering."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )
    
    total = query.count()
    items = query.order_by(User.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def update_user_role(db: Session, user_id: int, request: UserRoleUpdateRequest) -> User:
    """Admin: change user role."""
    user = get_user_by_id(db, user_id)
    user.role = request.role
    db.commit()
    db.refresh(user)
    return user


def update_user_status(db: Session, user_id: int, request: UserStatusUpdateRequest) -> User:
    """Admin: activate or deactivate user account."""
    user = get_user_by_id(db, user_id)
    user.is_active = request.is_active
    db.commit()
    db.refresh(user)
    return user
