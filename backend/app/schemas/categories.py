"""EVENTHUB Category Schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CategoryResponse(BaseModel):
    """Event category representation."""
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryCreateRequest(BaseModel):
    """Admin category creation payload."""
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None


class CategoryUpdateRequest(BaseModel):
    """Admin category modification payload."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None
