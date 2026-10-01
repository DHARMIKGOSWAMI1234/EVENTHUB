"""EVENTHUB Event Schemas"""

from datetime import date, time, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.ticket_types import TicketTypeResponse


class EventResponse(BaseModel):
    """Event summary representation."""
    id: int
    organizer_id: int
    category_id: int
    venue_id: int
    title: str
    slug: str
    description: str
    event_date: date
    start_time: time
    end_time: Optional[time] = None
    seating_mode: str
    status: str
    banner_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Summary relations
    category_name: Optional[str] = None
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    organization_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "category") and getattr(obj, "category", None):
            setattr(obj, "category_name", obj.category.name)
        if hasattr(obj, "venue") and getattr(obj, "venue", None):
            setattr(obj, "venue_name", obj.venue.name)
            setattr(obj, "venue_city", obj.venue.city)
        if hasattr(obj, "organizer") and getattr(obj, "organizer", None):
            setattr(obj, "organization_name", obj.organizer.organization_name)
        return super().model_validate(obj, *args, **kwargs)



class EventDetailResponse(EventResponse):
    """Comprehensive event representation including ticket tiers and real-time inventory."""
    ticket_types: List[TicketTypeResponse] = []
    available_ticket_count: Optional[int] = None
    average_rating: Optional[float] = None
    review_count: Optional[int] = None


class EventCreateRequest(BaseModel):
    """Organizer event creation payload."""
    category_id: int
    venue_id: int
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    event_date: date
    start_time: time
    end_time: Optional[time] = None
    seating_mode: Literal["GENERAL_ADMISSION", "RESERVED_SEATING"] = "GENERAL_ADMISSION"
    banner_image_url: Optional[str] = None


class EventUpdateRequest(BaseModel):
    """Organizer event modification payload."""
    category_id: Optional[int] = None
    venue_id: Optional[int] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10)
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    banner_image_url: Optional[str] = None


class EventAvailabilityResponse(BaseModel):
    """Real-time ticket and seat availability summary for an event."""
    event_id: int
    title: str
    seating_mode: str
    total_capacity: int
    sold_tickets: int
    available_tickets: int
    occupancy_percentage: float
