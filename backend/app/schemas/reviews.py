"""EVENTHUB Review Schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReviewResponse(BaseModel):
    """Customer review representation."""
    id: int
    user_id: int
    user_name: Optional[str] = None
    event_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "user") and getattr(obj, "user", None):
            setattr(obj, "user_name", obj.user.full_name)
        return super().model_validate(obj, *args, **kwargs)



class ReviewCreateRequest(BaseModel):
    """Customer review submission payload."""
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(default=None, max_length=1000)


class ReviewUpdateRequest(BaseModel):
    """Customer review update payload."""
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)
