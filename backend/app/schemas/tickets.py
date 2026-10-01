"""EVENTHUB Ticket Schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TicketResponse(BaseModel):
    """Issued ticket representation."""
    id: int
    booking_id: int
    ticket_type_id: int
    ticket_type_name: Optional[str] = None
    event_id: Optional[int] = None
    event_title: Optional[str] = None
    event_seat_id: Optional[int] = None
    seat_label: Optional[str] = None
    ticket_code: str
    qr_token: str
    status: str
    issued_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "issued_at") and getattr(obj, "issued_at", None):
            setattr(obj, "created_at", obj.issued_at)
        if hasattr(obj, "ticket_type") and getattr(obj, "ticket_type", None):

            setattr(obj, "ticket_type_name", obj.ticket_type.name)
        if hasattr(obj, "booking") and getattr(obj, "booking", None):
            if hasattr(obj.booking, "event") and getattr(obj.booking, "event", None):
                setattr(obj, "event_id", obj.booking.event.id)
                setattr(obj, "event_title", obj.booking.event.title)
        if hasattr(obj, "event_seat") and getattr(obj, "event_seat", None):
            if hasattr(obj.event_seat, "venue_seat") and getattr(obj.event_seat, "venue_seat", None):
                setattr(obj, "seat_label", obj.event_seat.venue_seat.seat_label)
        return super().model_validate(obj, *args, **kwargs)



class TicketValidateResponse(BaseModel):
    """Response returned upon gate validation of a ticket."""
    id: int
    ticket_code: str
    previous_status: str
    current_status: str
    message: str
    validated_at: datetime
