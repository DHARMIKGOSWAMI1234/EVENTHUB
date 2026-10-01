"""EVENTHUB Event Service

Encapsulates event querying, filtering, organizer ownership validation,
ticket tier management, and real-time inventory calculation.
"""

import re
import uuid
from datetime import date
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, text
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
)
from app.models import (
    Event,
    Organizer,
    Category,
    Venue,
    VenueSeat,
    EventSeat,
    TicketType,
    Review,
)
from app.schemas.events import (
    EventCreateRequest,
    EventUpdateRequest,
    EventAvailabilityResponse,
)
from app.schemas.ticket_types import TicketTypeCreateRequest, TicketTypeUpdateRequest
from app.schemas.seats import EventSeatResponse


def _generate_slug(title: str) -> str:
    """Generate a clean URL-friendly unique slug."""
    clean = re.sub(r"[^\w\s-]", "", title.lower()).strip()
    slug_base = re.sub(r"[-\s]+", "-", clean)[:180]
    return f"{slug_base}-{uuid.uuid4().hex[:6]}"


def get_organizer_for_user(db: Session, user_id: int) -> Organizer:
    """Retrieve organizer profile associated with a user or create default if eligible."""
    org = db.query(Organizer).filter(Organizer.user_id == user_id).one_or_none()
    if not org:
        raise ForbiddenException("User does not have an associated Organizer profile")
    return org


def list_events(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    category_id: Optional[int] = None,
    organizer_id: Optional[int] = None,
    venue_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    seating_mode: Optional[str] = None,
    status: Optional[str] = "PUBLISHED",
    search: Optional[str] = None,
) -> Tuple[List[Event], int]:
    """Retrieve filtered, paginated events."""
    query = (
        db.query(Event)
        .options(
            joinedload(Event.category),
            joinedload(Event.venue),
            joinedload(Event.organizer),
        )
    )

    if status:
        query = query.filter(Event.status == status.upper())
    if category_id:
        query = query.filter(Event.category_id == category_id)
    if organizer_id:
        query = query.filter(Event.organizer_id == organizer_id)
    if venue_id:
        query = query.filter(Event.venue_id == venue_id)
    if date_from:
        query = query.filter(Event.event_date >= date_from)
    if date_to:
        query = query.filter(Event.event_date <= date_to)
    if seating_mode:
        query = query.filter(Event.seating_mode == seating_mode.upper())
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Event.title.ilike(term),
                Event.description.ilike(term),
            )
        )

    total = query.count()
    items = (
        query.order_by(Event.event_date.asc(), Event.start_time.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_event_by_id(db: Session, event_id: int, only_published: bool = False) -> Event:
    """Retrieve event with related metadata or raise NotFoundException."""
    query = (
        db.query(Event)
        .options(
            joinedload(Event.category),
            joinedload(Event.venue),
            joinedload(Event.organizer),
            joinedload(Event.ticket_types),
        )
        .filter(Event.id == event_id)
    )
    if only_published:
        query = query.filter(Event.status == "PUBLISHED")
    event = query.one_or_none()
    if not event:
        raise NotFoundException("Event", event_id)
    return event


def get_event_availability(db: Session, event_id: int) -> EventAvailabilityResponse:
    """Calculate real-time capacity and occupancy metrics using DBMS functions and relations."""
    event = get_event_by_id(db, event_id)

    # Invoke database function get_available_ticket_count
    available_tickets = db.execute(
        text("SELECT get_available_ticket_count(:event_id);"),
        {"event_id": event_id},
    ).scalar() or 0

    # Aggregate total capacity and sold tickets from ticket_types
    caps = (
        db.query(
            func.coalesce(func.sum(TicketType.capacity), 0).label("tot_cap"),
            func.coalesce(func.sum(TicketType.sold_count), 0).label("tot_sold"),
        )
        .filter(TicketType.event_id == event_id, TicketType.is_active == True)
        .one()
    )
    total_capacity = caps.tot_cap
    sold_tickets = caps.tot_sold

    occ_pct = (sold_tickets / total_capacity * 100.0) if total_capacity > 0 else 0.0

    return EventAvailabilityResponse(
        event_id=event.id,
        title=event.title,
        seating_mode=event.seating_mode,
        total_capacity=total_capacity,
        sold_tickets=sold_tickets,
        available_tickets=available_tickets,
        occupancy_percentage=round(occ_pct, 2),
    )


def get_event_seats_safe(db: Session, event_id: int) -> List[EventSeatResponse]:
    """Retrieve public event seat status, stripping internal booking and customer IDs."""
    event = get_event_by_id(db, event_id)
    if event.seating_mode != "RESERVED_SEATING":
        raise BadRequestException("Event is configured for General Admission, not Reserved Seating")

    seats = (
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
        .filter(EventSeat.event_id == event_id)
        .order_by(VenueSeat.section_name, VenueSeat.row_label, VenueSeat.seat_number)
        .all()
    )

    return [
        EventSeatResponse(
            id=s.id,
            event_id=s.event_id,
            venue_seat_id=s.venue_seat_id,
            status=s.status,
            section_name=s.section_name,
            row_label=s.row_label,
            seat_number=s.seat_number,
            seat_label=s.seat_label,
            seat_type=s.seat_type,
        )
        for s in seats
    ]


# ----------------------------------------------------------------------------
# Organizer Event Operations
# ----------------------------------------------------------------------------

def create_organizer_event(db: Session, user_id: int, request: EventCreateRequest) -> Event:
    """Organizer: Create new event in DRAFT state."""
    org = get_organizer_for_user(db, user_id)

    # Validate category and venue
    category = db.query(Category).filter(Category.id == request.category_id).one_or_none()
    if not category:
        raise NotFoundException("Category", request.category_id)

    venue = db.query(Venue).filter(Venue.id == request.venue_id).one_or_none()
    if not venue:
        raise NotFoundException("Venue", request.venue_id)

    slug = _generate_slug(request.title)
    event = Event(
        organizer_id=org.id,
        category_id=request.category_id,
        venue_id=request.venue_id,
        title=request.title.strip(),
        slug=slug,
        description=request.description.strip(),
        event_date=request.event_date,
        start_time=request.start_time,
        end_time=request.end_time,
        seating_mode=request.seating_mode,
        status="DRAFT",
        banner_image_url=request.banner_image_url,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # If RESERVED_SEATING, populate event_seats from venue_seats
    if event.seating_mode == "RESERVED_SEATING":
        venue_seats = (
            db.query(VenueSeat)
            .filter(VenueSeat.venue_id == event.venue_id, VenueSeat.is_active == True)
            .all()
        )
        event_seats = [
            EventSeat(
                event_id=event.id,
                venue_seat_id=vs.id,
                status="AVAILABLE",
            )
            for vs in venue_seats
        ]
        db.add_all(event_seats)
        db.commit()

    return event


def update_organizer_event(
    db: Session, user_id: int, event_id: int, request: EventUpdateRequest
) -> Event:
    """Organizer: Update event properties. Enforces server-side ownership."""
    org = get_organizer_for_user(db, user_id)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id:
        raise ForbiddenException("You do not have permission to modify this event")

    if request.category_id is not None:
        cat = db.query(Category).filter(Category.id == request.category_id).one_or_none()
        if not cat:
            raise NotFoundException("Category", request.category_id)
        event.category_id = request.category_id

    if request.venue_id is not None:
        v = db.query(Venue).filter(Venue.id == request.venue_id).one_or_none()
        if not v:
            raise NotFoundException("Venue", request.venue_id)
        event.venue_id = request.venue_id

    if request.title is not None:
        event.title = request.title.strip()
    if request.description is not None:
        event.description = request.description.strip()
    if request.event_date is not None:
        event.event_date = request.event_date
    if request.start_time is not None:
        event.start_time = request.start_time
    if request.end_time is not None:
        event.end_time = request.end_time
    if request.banner_image_url is not None:
        event.banner_image_url = request.banner_image_url

    db.commit()
    db.refresh(event)
    return event


def publish_organizer_event(db: Session, user_id: int, event_id: int) -> Event:
    """Organizer: Transition event from DRAFT to PUBLISHED."""
    org = get_organizer_for_user(db, user_id)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id:
        raise ForbiddenException("You do not have permission to publish this event")

    active_tiers = (
        db.query(TicketType)
        .filter(TicketType.event_id == event_id, TicketType.is_active == True)
        .count()
    )
    if active_tiers == 0:
        raise BadRequestException("Cannot publish an event with no active ticket tiers")

    event.status = "PUBLISHED"
    db.commit()
    db.refresh(event)
    return event


def cancel_organizer_event(db: Session, user_id: int, event_id: int) -> Event:
    """Organizer: Transition event to CANCELLED."""
    org = get_organizer_for_user(db, user_id)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id:
        raise ForbiddenException("You do not have permission to cancel this event")

    event.status = "CANCELLED"
    db.commit()
    db.refresh(event)
    return event


def delete_organizer_event(db: Session, user_id: int, event_id: int) -> None:
    """Organizer: Delete a DRAFT event. Events with booking history cannot be deleted."""
    org = get_organizer_for_user(db, user_id)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id:
        raise ForbiddenException("You do not have permission to delete this event")
    if event.status != "DRAFT":
        raise BadRequestException("Only DRAFT events can be deleted. Use cancel for published events.")

    db.query(EventSeat).filter(EventSeat.event_id == event_id).delete()
    db.query(TicketType).filter(TicketType.event_id == event_id).delete()
    db.delete(event)
    db.commit()


# ----------------------------------------------------------------------------
# Ticket Type Management
# ----------------------------------------------------------------------------

def create_event_ticket_type(
    db: Session, user_id: int, event_id: int, request: TicketTypeCreateRequest
) -> TicketType:
    """Organizer: Add a ticket tier to an event."""
    org = get_organizer_for_user(db, user_id)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id:
        raise ForbiddenException("You do not have permission to manage this event's tickets")

    existing = (
        db.query(TicketType)
        .filter(TicketType.event_id == event_id, TicketType.name == request.name.strip())
        .one_or_none()
    )
    if existing:
        raise ConflictException(f"Ticket tier '{request.name}' already exists for this event")

    ticket_type = TicketType(
        event_id=event_id,
        name=request.name.strip(),
        description=request.description.strip() if request.description else None,
        price=request.price,
        capacity=request.capacity,
        sold_count=0,
        is_active=True,
    )
    db.add(ticket_type)
    db.commit()
    db.refresh(ticket_type)
    return ticket_type


def update_event_ticket_type(
    db: Session, user_id: int, ticket_type_id: int, request: TicketTypeUpdateRequest
) -> TicketType:
    """Organizer: Update a ticket tier."""
    org = get_organizer_for_user(db, user_id)
    tt = db.query(TicketType).filter(TicketType.id == ticket_type_id).one_or_none()
    if not tt:
        raise NotFoundException("TicketType", ticket_type_id)

    event = get_event_by_id(db, tt.event_id)
    if event.organizer_id != org.id:
        raise ForbiddenException("You do not have permission to modify this ticket tier")

    if request.name is not None:
        tt.name = request.name.strip()
    if request.description is not None:
        tt.description = request.description.strip() if request.description else None
    if request.price is not None:
        tt.price = request.price
    if request.capacity is not None:
        if request.capacity < tt.sold_count:
            raise BadRequestException(f"New capacity ({request.capacity}) cannot be less than already sold tickets ({tt.sold_count})")
        tt.capacity = request.capacity
    if request.is_active is not None:
        tt.is_active = request.is_active

    db.commit()
    db.refresh(tt)
    return tt
