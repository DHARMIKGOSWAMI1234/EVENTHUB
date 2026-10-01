"""EVENTHUB Event Seat Schemas"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class EventSeatResponse(BaseModel):
    """Public seat view representation.

    Carefully excludes private hold ownership and booking IDs.
    """
    id: int
    event_id: int
    venue_seat_id: int
    section_name: Optional[str] = None
    row_label: Optional[str] = None
    seat_number: Optional[int] = None
    seat_label: Optional[str] = None
    seat_type: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class EventSeatHoldRequest(BaseModel):
    """Seat hold request payload."""
    event_seat_id: int
    ticket_type_id: int
    hold_minutes: int = Field(default=15, ge=1, le=60)
