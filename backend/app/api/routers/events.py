"""EVENTHUB Events API Router

Provides public event catalog browsing, filtering, search, detailed inspection,
real-time ticket inventory calculations, and seat availability maps.
Only PUBLISHED events are exposed publicly.
"""

import math
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.deps import get_db
from app.models import TicketType
from app.schemas.events import (
    EventResponse,
    EventDetailResponse,
    EventAvailabilityResponse,
)
from app.schemas.ticket_types import TicketTypeResponse
from app.schemas.seats import EventSeatResponse
from app.schemas.reviews import ReviewResponse
from app.schemas.common import PaginatedResponse
from app.services.event_service import (
    list_events,
    get_event_by_id,
    get_event_availability,
    get_event_seats_safe,
)
from app.services.review_service import list_event_reviews

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=PaginatedResponse[EventResponse],
    summary="Browse and search published events",
)
def browse_events(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    category_id: Optional[int] = Query(None, description="Filter by Category ID"),
    organizer_id: Optional[int] = Query(None, description="Filter by Organizer ID"),
    venue_id: Optional[int] = Query(None, description="Filter by Venue ID"),
    date_from: Optional[date] = Query(None, description="Filter events on/after this date"),
    date_to: Optional[date] = Query(None, description="Filter events on/before this date"),
    seating_mode: Optional[str] = Query(None, description="GENERAL_ADMISSION or RESERVED_SEATING"),
    search: Optional[str] = Query(None, description="Search keyword in title or description"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[EventResponse]:
    """Retrieve filtered, paginated catalog of published events."""
    items, total = list_events(
        db=db,
        page=page,
        page_size=page_size,
        category_id=category_id,
        organizer_id=organizer_id,
        venue_id=venue_id,
        date_from=date_from,
        date_to=date_to,
        seating_mode=seating_mode,
        status="PUBLISHED",
        search=search,
    )
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[EventResponse.model_validate(e) for e in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


@router.get(
    "/{event_id}",
    response_model=EventDetailResponse,
    summary="Get published event details",
)
def get_event_details(event_id: int, db: Session = Depends(get_db)) -> EventDetailResponse:
    """Retrieve full details of a published event including ticket tiers and real-time inventory."""
    event = get_event_by_id(db, event_id, only_published=True)

    # Authority: PostgreSQL stored function get_available_ticket_count
    available_tickets = db.execute(
        text("SELECT get_available_ticket_count(:event_id);"),
        {"event_id": event.id},
    ).scalar() or 0

    # Aggregate rating
    rating_data = db.execute(
        text("SELECT coalesce(avg(rating), 0.0), count(*) FROM reviews WHERE event_id = :event_id;"),
        {"event_id": event.id},
    ).one()
    avg_rating = round(float(rating_data[0]), 2) if rating_data[1] > 0 else None
    review_cnt = rating_data[1]

    ticket_types = [
        TicketTypeResponse.model_validate(tt)
        for tt in event.ticket_types
        if tt.is_active
    ]

    resp = EventDetailResponse.model_validate(event)
    resp.ticket_types = ticket_types
    resp.available_ticket_count = available_tickets
    resp.average_rating = avg_rating
    resp.review_count = review_cnt
    return resp


@router.get(
    "/{event_id}/availability",
    response_model=EventAvailabilityResponse,
    summary="Get real-time event inventory and occupancy metrics",
)
def get_availability(event_id: int, db: Session = Depends(get_db)) -> EventAvailabilityResponse:
    """Calculate authoritative available capacity and occupancy percentage."""
    return get_event_availability(db, event_id)


@router.get(
    "/{event_id}/seats",
    response_model=List[EventSeatResponse],
    summary="Get public seat availability map",
)
def get_event_seats(event_id: int, db: Session = Depends(get_db)) -> List[EventSeatResponse]:
    """Retrieve safe public seat availability map.

    Excludes held_by_booking_id and private customer information to prevent data leakage.
    """
    return get_event_seats_safe(db, event_id)


@router.get(
    "/{event_id}/ticket-types",
    response_model=List[TicketTypeResponse],
    summary="List active ticket tiers for an event",
)
def get_ticket_types(event_id: int, db: Session = Depends(get_db)) -> List[TicketTypeResponse]:
    """Retrieve active ticket tiers for a published event."""
    event = get_event_by_id(db, event_id, only_published=True)
    return [
        TicketTypeResponse.model_validate(tt)
        for tt in event.ticket_types
        if tt.is_active
    ]


@router.get(
    "/{event_id}/reviews",
    response_model=PaginatedResponse[ReviewResponse],
    summary="List reviews for an event",
)
def get_event_reviews_endpoint(
    event_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ReviewResponse]:
    """Retrieve paginated customer reviews and ratings for an event."""
    items, total = list_event_reviews(db, event_id, page=page, page_size=page_size)
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[ReviewResponse.model_validate(r) for r in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )
