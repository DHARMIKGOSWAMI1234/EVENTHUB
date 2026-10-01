"""EVENTHUB Payment Simulation Service

Simulates internal payment confirmations and failures without external gateway dependencies.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
)
from app.models import Booking, Payment, Ticket, EventSeat
from app.schemas.payments import PaymentSimulateRequest


def get_booking_payment(db: Session, booking_id: int, user_id: int, is_admin: bool = False) -> Payment:
    """Retrieve simulated payment record for a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).one_or_none()
    if not booking:
        raise NotFoundException("Booking", booking_id)
    if not is_admin and booking.user_id != user_id:
        raise ForbiddenException("Access not permitted")

    payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not payment:
        raise NotFoundException("Payment record for booking", booking_id)
    return payment


def simulate_booking_payment(
    db: Session, booking_id: int, user_id: int, request: PaymentSimulateRequest
) -> Payment:
    """Simulate a payment gateway callback (SUCCESS or FAILED) on an existing booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).one_or_none()
    if not booking:
        raise NotFoundException("Booking", booking_id)
    if booking.user_id != user_id:
        raise ForbiddenException("Access not permitted to this booking")

    existing_payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()

    if request.simulate_status == "SUCCESS":
        booking.status = "CONFIRMED"
        if existing_payment:
            existing_payment.status = "SUCCESS"
            existing_payment.paid_at = func.now()
            existing_payment.payment_method = request.payment_method
            payment = existing_payment
        else:
            txn_ref = f"TXN-SIM-{uuid.uuid4().hex[:10].upper()}"
            payment = Payment(
                booking_id=booking.id,
                transaction_reference=txn_ref,
                amount=booking.total_amount,
                payment_method=request.payment_method,
                status="SUCCESS",
                paid_at=func.now(),
            )
            db.add(payment)

        # Confirm any associated tickets
        db.query(Ticket).filter(Ticket.booking_id == booking.id).update({"status": "ACTIVE"})

    else:
        # FAILED payment simulation
        booking.status = "CANCELLED"
        if existing_payment:
            existing_payment.status = "FAILED"
            payment = existing_payment
        else:
            txn_ref = f"TXN-FAIL-{uuid.uuid4().hex[:10].upper()}"
            payment = Payment(
                booking_id=booking.id,
                transaction_reference=txn_ref,
                amount=booking.total_amount,
                payment_method=request.payment_method,
                status="FAILED",
            )
            db.add(payment)

        # Release any held seats
        held_seats = db.query(EventSeat).filter(EventSeat.held_by_booking_id == booking.id).all()
        for s in held_seats:
            s.status = "AVAILABLE"
            s.held_by_booking_id = None
            s.hold_expires_at = None

    db.commit()
    db.refresh(payment)
    return payment
