"""EVENTHUB — Booking Transaction Service

Encapsulates atomic database transactions and concurrency control for reservations.
Demonstrates:
- SELECT ... FOR UPDATE row-level locking
- Double-booking prevention
- Atomic multi-table updates with rollback protection
- Mathematical integrity
"""

import uuid
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    Event,
    EventSeat,
    TicketType,
    Booking,
    BookingItem,
    Payment,
    Ticket,
)


class BookingTransactionError(Exception):
    """Base exception for booking transaction failures."""
    pass


class SeatNotAvailableError(BookingTransactionError):
    """Raised when a requested event seat is not in AVAILABLE state."""
    pass


class EventNotBookableError(BookingTransactionError):
    """Raised when an event does not exist or is not published."""
    pass


class TicketCapacityExceededError(BookingTransactionError):
    """Raised when a ticket tier capacity has been exhausted."""
    pass


def book_reserved_seat(
    db: Session,
    user_id: int,
    event_id: int,
    ticket_type_id: int,
    event_seat_id: int,
    payment_method: str = "UPI",
    discount_amount: Decimal = Decimal("0.00"),
    auto_commit: bool = True,
) -> Booking:
    """Execute atomic booking of a reserved event seat using row-level locking.

    Transaction Workflow:
    BEGIN
    1. Verify event exists and is PUBLISHED.
    2. Acquire exclusive row lock on event_seats via SELECT ... FOR UPDATE.
    3. Check seat status: must be AVAILABLE. If not, raise SeatNotAvailableError.
    4. Acquire row lock on ticket_types, check capacity.
    5. Calculate subtotal, tax (18%), and total_amount.
    6. Insert Booking record.
    7. Insert BookingItem record.
    8. Transition EventSeat status to 'BOOKED'.
    9. Insert simulated Payment record (SUCCESS).
    10. Insert Ticket record (ACTIVE) linking booking, ticket type, and seat.
    COMMIT (or ROLLBACK on failure)
    """
    try:
        # 1. Validate event
        event = db.query(Event).filter(Event.id == event_id).one_or_none()
        if not event:
            raise EventNotBookableError(f"Event #{event_id} not found.")
        if event.status != "PUBLISHED":
            raise EventNotBookableError(f"Event #{event_id} is {event.status}; only PUBLISHED events can be booked.")
        if event.seating_mode != "RESERVED_SEATING":
            raise EventNotBookableError(f"Event #{event_id} is not configured for RESERVED_SEATING.")

        # 2. Acquire exclusive lock on the target seat (SELECT ... FOR UPDATE)
        seat = (
            db.query(EventSeat)
            .filter(EventSeat.id == event_seat_id, EventSeat.event_id == event_id)
            .with_for_update()
            .one_or_none()
        )

        if not seat:
            raise SeatNotAvailableError(f"EventSeat #{event_seat_id} not found for event #{event_id}.")

        # 3. Check seat status after acquiring lock
        if seat.status != "AVAILABLE":
            raise SeatNotAvailableError(
                f"EventSeat #{event_seat_id} is no longer available (current status: '{seat.status}')."
            )

        # 4. Acquire lock on ticket type and verify capacity
        ticket_type = (
            db.query(TicketType)
            .filter(TicketType.id == ticket_type_id, TicketType.event_id == event_id)
            .with_for_update()
            .one_or_none()
        )

        if not ticket_type or not ticket_type.is_active:
            raise TicketCapacityExceededError(f"TicketType #{ticket_type_id} is inactive or not found.")
        if ticket_type.sold_count >= ticket_type.capacity:
            raise TicketCapacityExceededError(
                f"TicketType '{ticket_type.name}' is sold out ({ticket_type.sold_count}/{ticket_type.capacity})."
            )

        # 5. Calculate amounts
        subtotal = ticket_type.price
        discount = max(Decimal("0.00"), discount_amount)
        taxable = max(Decimal("0.00"), subtotal - discount)
        tax = (taxable * Decimal("0.18")).quantize(Decimal("0.01"))
        total = taxable + tax

        # 6. Create Booking
        booking_ref = f"EVH-TX-{uuid.uuid4().hex[:8].upper()}"
        booking = Booking(
            user_id=user_id,
            event_id=event_id,
            booking_reference=booking_ref,
            status="CONFIRMED",
            subtotal=subtotal,
            discount_amount=discount,
            tax_amount=tax,
            total_amount=total,
            expires_at=None,
        )
        db.add(booking)
        db.flush()  # Populates booking.id

        # 7. Create Booking Item
        item = BookingItem(
            booking_id=booking.id,
            ticket_type_id=ticket_type.id,
            quantity=1,
            unit_price=ticket_type.price,
            subtotal=subtotal,
        )
        db.add(item)

        # 8. Update EventSeat status to BOOKED
        seat.status = "BOOKED"
        seat.hold_expires_at = None
        seat.held_by_booking_id = None

        # 9. Create simulated Payment
        txn_ref = f"TXN-EVH-{uuid.uuid4().hex[:10].upper()}"
        payment = Payment(
            booking_id=booking.id,
            transaction_reference=txn_ref,
            amount=total,
            payment_method=payment_method,
            status="SUCCESS",
            paid_at=func.now(),
        )
        db.add(payment)

        # 10. Issue Ticket
        tkt_code = f"EVH-TKT-{uuid.uuid4().hex[:8].upper()}"
        qr_token = f"EVH-QR-{uuid.uuid4().hex[:16].upper()}"
        ticket = Ticket(
            booking_id=booking.id,
            ticket_type_id=ticket_type.id,
            event_seat_id=seat.id,
            ticket_code=tkt_code,
            qr_token=qr_token,
            status="ACTIVE",
        )
        db.add(ticket)
        db.flush()

        if auto_commit:
            db.commit()
            db.refresh(booking)

        return booking
    except Exception:
        if auto_commit:
            db.rollback()
        raise


def hold_reserved_seat(
    db: Session,
    user_id: int,
    event_id: int,
    ticket_type_id: int,
    event_seat_id: int,
    hold_minutes: int = 15,
    auto_commit: bool = True,
) -> Booking:
    """Place a temporary hold on an event seat using row-level locking."""
    try:
        # Acquire lock on seat
        seat = (
            db.query(EventSeat)
            .filter(EventSeat.id == event_seat_id, EventSeat.event_id == event_id)
            .with_for_update()
            .one_or_none()
        )

        if not seat or seat.status != "AVAILABLE":
            raise SeatNotAvailableError(
                f"EventSeat #{event_seat_id} is not available for hold (status: '{seat.status if seat else 'NOT_FOUND'}')."
            )

        ticket_type = db.query(TicketType).filter(TicketType.id == ticket_type_id).one_or_none()
        if not ticket_type or not ticket_type.is_active:
            raise TicketCapacityExceededError(f"TicketType #{ticket_type_id} is not available.")

        subtotal = ticket_type.price
        tax = (subtotal * Decimal("0.18")).quantize(Decimal("0.01"))
        total = subtotal + tax

        hold_expiry = datetime.now(timezone.utc) + timedelta(minutes=hold_minutes)
        booking_ref = f"EVH-HLD-{uuid.uuid4().hex[:8].upper()}"

        booking = Booking(
            user_id=user_id,
            event_id=event_id,
            booking_reference=booking_ref,
            status="PENDING_PAYMENT",
            subtotal=subtotal,
            discount_amount=Decimal("0.00"),
            tax_amount=tax,
            total_amount=total,
            expires_at=hold_expiry,
        )
        db.add(booking)
        db.flush()

        # Update seat to HELD
        seat.status = "HELD"
        seat.held_by_booking_id = booking.id
        seat.hold_expires_at = hold_expiry

        if auto_commit:
            db.commit()
            db.refresh(booking)

        return booking
    except Exception:
        if auto_commit:
            db.rollback()
        raise


def book_general_admission(
    db: Session,
    user_id: int,
    event_id: int,
    ticket_type_id: int,
    quantity: int = 1,
    payment_method: str = "UPI",
    discount_amount: Decimal = Decimal("0.00"),
    auto_commit: bool = True,
) -> Booking:
    """Execute atomic booking of General Admission tickets using row-level locking."""
    try:
        if quantity < 1:
            raise BookingTransactionError("Quantity must be at least 1")

        # 1. Validate event
        event = db.query(Event).filter(Event.id == event_id).one_or_none()
        if not event:
            raise EventNotBookableError(f"Event #{event_id} not found.")
        if event.status != "PUBLISHED":
            raise EventNotBookableError(f"Event #{event_id} is {event.status}; only PUBLISHED events can be booked.")
        if event.seating_mode != "GENERAL_ADMISSION":
            raise EventNotBookableError(f"Event #{event_id} is not configured for GENERAL_ADMISSION.")

        # 2. Acquire exclusive lock on ticket type row and verify quota
        ticket_type = (
            db.query(TicketType)
            .filter(TicketType.id == ticket_type_id, TicketType.event_id == event_id)
            .with_for_update()
            .one_or_none()
        )
        if not ticket_type or not ticket_type.is_active:
            raise TicketCapacityExceededError(f"TicketType #{ticket_type_id} is inactive or not found for this event.")
        if ticket_type.sold_count + quantity > ticket_type.capacity:
            raise TicketCapacityExceededError(
                f"Requested quantity ({quantity}) exceeds available capacity ({ticket_type.capacity - ticket_type.sold_count} remaining)."
            )

        # 3. Calculate amounts
        subtotal = ticket_type.price * Decimal(quantity)
        discount = max(Decimal("0.00"), discount_amount)
        taxable = max(Decimal("0.00"), subtotal - discount)
        tax = (taxable * Decimal("0.18")).quantize(Decimal("0.01"))
        total = taxable + tax

        # 4. Create Booking
        booking_ref = f"EVH-TX-{uuid.uuid4().hex[:8].upper()}"
        booking = Booking(
            user_id=user_id,
            event_id=event_id,
            booking_reference=booking_ref,
            status="CONFIRMED",
            subtotal=subtotal,
            discount_amount=discount,
            tax_amount=tax,
            total_amount=total,
            expires_at=None,
        )
        db.add(booking)
        db.flush()

        # 5. Create Booking Item
        item = BookingItem(
            booking_id=booking.id,
            ticket_type_id=ticket_type.id,
            quantity=quantity,
            unit_price=ticket_type.price,
            subtotal=subtotal,
        )
        db.add(item)

        # 6. Create simulated Payment
        txn_ref = f"TXN-EVH-{uuid.uuid4().hex[:10].upper()}"
        payment = Payment(
            booking_id=booking.id,
            transaction_reference=txn_ref,
            amount=total,
            payment_method=payment_method,
            status="SUCCESS",
            paid_at=func.now(),
        )
        db.add(payment)

        # 7. Issue Tickets (quantity tickets, unassigned seat)
        for _ in range(quantity):
            tkt_code = f"EVH-TKT-{uuid.uuid4().hex[:8].upper()}"
            qr_token = f"EVH-QR-{uuid.uuid4().hex[:16].upper()}"
            ticket = Ticket(
                booking_id=booking.id,
                ticket_type_id=ticket_type.id,
                event_seat_id=None,
                ticket_code=tkt_code,
                qr_token=qr_token,
                status="ACTIVE",
            )
            db.add(ticket)

        db.flush()
        if auto_commit:
            db.commit()
            db.refresh(booking)

        return booking
    except Exception:
        if auto_commit:
            db.rollback()
        raise
