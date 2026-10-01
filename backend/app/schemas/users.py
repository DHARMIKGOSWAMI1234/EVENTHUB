"""EVENTHUB User Schemas"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    """Safe public user profile representation. NEVER includes password_hash."""
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    """User self-update payload."""
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)


class UserRoleUpdateRequest(BaseModel):
    """Admin role update payload."""
    role: Literal["CUSTOMER", "ORGANIZER", "ADMIN"]


class UserStatusUpdateRequest(BaseModel):
    """Admin user active status update payload."""
    is_active: bool
