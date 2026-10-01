"""EVENTHUB Ticket Service

Handles ticket retrieval and gate admission validation.
"""

from datetime import datetime, timezone
from typing import Tuple, List, Optional
from sqlalchemy.orm import Session, joinedload
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
)
from app.models import Ticket, Booking, Event, EventSeat, VenueSeat, TicketType
from app.schemas.tickets import TicketValidateResponse


def list_user_tickets(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
) -> Tuple[List[Ticket], int]:
    """Retrieve tickets belonging to a customer."""
    query = (
        db.query(Ticket)
        .join(Booking, Ticket.booking_id == Booking.id)
        .options(
            joinedload(Ticket.ticket_type),
            joinedload(Ticket.event_seat).joinedload(EventSeat.venue_seat),
            joinedload(Ticket.booking).joinedload(Booking.event),
        )
        .filter(Booking.user_id == user_id)
    )
    if status:
        query = query.filter(Ticket.status == status.upper())

    total = query.count()
    items = (
        query.order_by(Ticket.issued_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total



def get_ticket_by_id(
    db: Session, ticket_id: int, user_id: int, is_admin: bool = False
) -> Ticket:
    """Retrieve ticket by ID ensuring caller is the ticket owner or admin."""
    ticket = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.ticket_type),
            joinedload(Ticket.event_seat).joinedload(EventSeat.venue_seat),
            joinedload(Ticket.booking).joinedload(Booking.event),
        )
        .filter(Ticket.id == ticket_id)
        .one_or_none()
    )
    if not ticket:
        raise NotFoundException("Ticket", ticket_id)

    if not is_admin and ticket.booking.user_id != user_id:
        raise ForbiddenException("Access not permitted to this ticket")

    return ticket


def validate_ticket_admission(
    db: Session, ticket_id: int, user_id: int, is_authorized_staff: bool = False
) -> TicketValidateResponse:
    """Validate ticket at gate scanner. If ACTIVE, transition to USED."""
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.booking))
        .filter(Ticket.id == ticket_id)
        .one_or_none()
    )
    if not ticket:
        raise NotFoundException("Ticket", ticket_id)

    # If caller is not staff, verify ticket ownership
    if not is_authorized_staff and ticket.booking.user_id != user_id:
        raise ForbiddenException("Access not permitted to validate this ticket")

    prev_status = ticket.status

    if prev_status == "USED":
        raise BadRequestException("Ticket has already been used and cannot be re-validated")
    if prev_status in ("CANCELLED", "REFUNDED"):
        raise BadRequestException(f"Ticket has been {prev_status} and is invalid for admission")
    if prev_status != "ACTIVE":
        raise BadRequestException(f"Ticket status '{prev_status}' is invalid for admission")

    # Mark ticket as USED
    ticket.status = "USED"
    db.commit()
    db.refresh(ticket)

    return TicketValidateResponse(
        id=ticket.id,
        ticket_code=ticket.ticket_code,
        previous_status=prev_status,
        current_status=ticket.status,
        message="Ticket validated successfully. Admission granted.",
        validated_at=datetime.now(timezone.utc),
    )
