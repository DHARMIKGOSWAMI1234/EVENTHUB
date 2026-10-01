"""EVENTHUB Seats API Router

Provides safe public inspection of event seats and physical seating maps.
Internal booking IDs and customer identifiers are stripped.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import EventSeat, VenueSeat
from app.schemas.seats import EventSeatResponse
from app.core.exceptions import NotFoundException
from app.services.event_service import get_event_seats_safe

router = APIRouter(prefix="/seats", tags=["Seats"])


@router.get(
    "/events/{event_id}",
    response_model=List[EventSeatResponse],
    summary="Get seats for an event",
)
def get_seats_by_event(event_id: int, db: Session = Depends(get_db)) -> List[EventSeatResponse]:
    """Retrieve seat availability map for an event."""
    return get_event_seats_safe(db, event_id)


@router.get(
    "/{event_seat_id}",
    response_model=EventSeatResponse,
    summary="Get seat details by ID",
)
def get_seat(event_seat_id: int, db: Session = Depends(get_db)) -> EventSeatResponse:
    """Retrieve single seat status safely."""
    seat_data = (
        db.query(
            EventSeat.id,
            EventSeat.event_id,
            EventSeat.venue_seat_id,
            EventSeat.status,
            VenueSeat.section_name,
            VenueSeat.row_label,
            VenueSeat.seat_number,
            VenueSeat.seat_label,
            VenueSeat.seat_type,
        )
        .join(VenueSeat, EventSeat.venue_seat_id == VenueSeat.id)
        .filter(EventSeat.id == event_seat_id)
        .one_or_none()
    )
    if not seat_data:
        raise NotFoundException("EventSeat", event_seat_id)

    return EventSeatResponse(
        id=seat_data.id,
        event_id=seat_data.event_id,
        venue_seat_id=seat_data.venue_seat_id,
        status=seat_data.status,
        section_name=seat_data.section_name,
        row_label=seat_data.row_label,
        seat_number=seat_data.seat_number,
        seat_label=seat_data.seat_label,
        seat_type=seat_data.seat_type,
    )
