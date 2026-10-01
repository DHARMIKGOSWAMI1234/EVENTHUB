"""EVENTHUB Organizer Schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizerResponse(BaseModel):
    """Organizer entity representation."""
    id: int
    user_id: int
    organization_name: str
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    is_verified: bool = True
    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizerUpdateRequest(BaseModel):
    """Organizer profile update payload."""
    organization_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(default=None, max_length=20)
