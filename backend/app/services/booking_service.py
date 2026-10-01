"""EVENTHUB Booking Service

Bridges the REST API with the authoritative Phase 4 booking transaction service
(backend/app/services/booking_transaction.py).
Ensures row-level locking, atomicity, and seat consistency are strictly preserved.
"""

from typing import Tuple, List, Optional
from sqlalchemy.orm import Session, joinedload
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    SeatUnavailableException,
)
from app.models import (
    Booking,
    BookingItem,
    Event,
    EventSeat,
    Ticket,
    Payment,
)
from app.schemas.bookings import BookingCreateRequest, BookingDetailResponse, BookingItemResponse
from app.services.booking_transaction import (
    book_reserved_seat,
    book_general_admission,
    hold_reserved_seat,
    SeatNotAvailableError,
    TicketCapacityExceededError,
    BookingTransactionError,
)


def create_customer_booking(db: Session, user_id: int, request: BookingCreateRequest) -> Booking:
    """Execute customer booking by delegating directly to the Phase 4 transaction service.

    Preserves SELECT ... FOR UPDATE row-level locking, double-booking prevention,
    and automatic ticket count trigger synchronization.
    """
    event = db.query(Event).filter(Event.id == request.event_id).one_or_none()
    if not event:
        raise NotFoundException("Event", request.event_id)
    if event.status != "PUBLISHED":
        raise BadRequestException(f"Event #{request.event_id} is not available for booking (status: {event.status})")

    try:
        if event.seating_mode == "RESERVED_SEATING":
            if not request.event_seat_id:
                raise BadRequestException("event_seat_id is required for Reserved Seating events")

            booking = book_reserved_seat(
                db=db,
                user_id=user_id,
                event_id=request.event_id,
                ticket_type_id=request.ticket_type_id,
                event_seat_id=request.event_seat_id,
                payment_method=request.payment_method,
                discount_amount=request.discount_amount,
                auto_commit=True,
            )
            return booking

        elif event.seating_mode == "GENERAL_ADMISSION":
            quantity = request.quantity or 1
            booking = book_general_admission(
                db=db,
                user_id=user_id,
                event_id=request.event_id,
                ticket_type_id=request.ticket_type_id,
                quantity=quantity,
                payment_method=request.payment_method,
                discount_amount=request.discount_amount,
                auto_commit=True,
            )
            return booking

        else:
            raise BadRequestException(f"Unsupported seating mode '{event.seating_mode}'")

    except SeatNotAvailableError as e:
        # Prompt Part 30: Booking conflicts should use 409 Conflict
        raise SeatUnavailableException("The selected seat is no longer available.")
    except TicketCapacityExceededError as e:
        raise BadRequestException(str(e))
    except BookingTransactionError as e:
        raise BadRequestException(str(e))


def list_user_bookings(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
) -> Tuple[List[Booking], int]:
    """Retrieve customer's own bookings with optional status filter."""
    query = (
        db.query(Booking)
        .options(joinedload(Booking.event))
        .filter(Booking.user_id == user_id)
    )
    if status:
        query = query.filter(Booking.status == status.upper())

    total = query.count()
    items = (
        query.order_by(Booking.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_booking_by_id(
    db: Session, booking_id: int, user_id: int, is_admin: bool = False
) -> Booking:
    """Retrieve booking by ID enforcing customer ownership (unless caller is admin)."""
    booking = (
        db.query(Booking)
        .options(
            joinedload(Booking.event),
            joinedload(Booking.items),
            joinedload(Booking.tickets),
            joinedload(Booking.payments),
        )

        .filter(Booking.id == booking_id)
        .one_or_none()
    )
    if not booking:
        raise NotFoundException("Booking", booking_id)

    if not is_admin and booking.user_id != user_id:
        raise ForbiddenException("You do not have access to view this booking")

    return booking


def cancel_booking(db: Session, booking_id: int, user_id: int, is_admin: bool = False) -> Booking:
    """Cancel a booking, releasing reserved seats and cancelling issued tickets."""
    booking = get_booking_by_id(db, booking_id, user_id, is_admin=is_admin)

    if booking.status in ("CANCELLED", "REFUNDED"):
        raise BadRequestException(f"Booking #{booking_id} is already {booking.status}")

    booking.status = "CANCELLED"

    # Reset any reserved seat allocations
    tickets = db.query(Ticket).filter(Ticket.booking_id == booking.id).all()
    for tkt in tickets:
        tkt.status = "CANCELLED"
        if tkt.event_seat_id:
            seat = db.query(EventSeat).filter(EventSeat.id == tkt.event_seat_id).one_or_none()
            if seat:
                seat.status = "AVAILABLE"
                seat.held_by_booking_id = None
                seat.hold_expires_at = None

    db.commit()
    db.refresh(booking)
    return booking


def expire_booking(db: Session, booking_id: int, user_id: int) -> Booking:
    """Mark a pending booking expired and release its held seats."""
    booking = get_booking_by_id(db, booking_id, user_id)
    if booking.status != "PENDING_PAYMENT":
        raise BadRequestException("Only PENDING_PAYMENT bookings can be expired")

    booking.status = "EXPIRED"

    # Release any held seats linked to this booking
    held_seats = db.query(EventSeat).filter(EventSeat.held_by_booking_id == booking.id).all()
    for s in held_seats:
        s.status = "AVAILABLE"
        s.held_by_booking_id = None
        s.hold_expires_at = None

    db.commit()
    db.refresh(booking)
    return booking
