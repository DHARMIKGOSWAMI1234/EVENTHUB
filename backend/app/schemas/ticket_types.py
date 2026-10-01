"""EVENTHUB Ticket Type Schemas"""

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TicketTypeResponse(BaseModel):
    """Ticket tier representation."""
    id: int
    event_id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    capacity: int
    sold_count: int
    is_active: bool
    available_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class TicketTypeCreateRequest(BaseModel):
    """Organizer ticket type creation payload."""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    price: Decimal = Field(ge=Decimal("0.00"), description="Ticket price in INR")
    capacity: int = Field(gt=0, description="Available quota")


class TicketTypeUpdateRequest(BaseModel):
    """Organizer ticket type update payload."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, ge=Decimal("0.00"))
    capacity: Optional[int] = Field(default=None, gt=0)
    is_active: Optional[bool] = None
