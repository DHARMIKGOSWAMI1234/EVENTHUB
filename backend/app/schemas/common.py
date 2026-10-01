"""EVENTHUB Common & Pagination Schemas"""

from typing import Generic, List, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Standard message response."""
    message: str
    detail: str = ""


class PaginationParams(BaseModel):
    """Query parameters for list pagination."""
    page: int = Field(default=1, ge=1, description="Page number starting at 1")
    page_size: int = Field(default=20, ge=1, le=100, description="Number of items per page (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic envelope for paginated collections."""
    items: List[T]
    page: int
    page_size: int
    total: int
    pages: int

    model_config = ConfigDict(from_attributes=True)
