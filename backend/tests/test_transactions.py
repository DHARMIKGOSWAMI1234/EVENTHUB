"""EVENTHUB Transaction, Audit, and Hold Expiration Tests

Verifies:
1. Transaction atomicity: successful transactions commit completely; failed transactions rollback completely.
2. No partial records (bookings, booking_items, payments, tickets) are created on failure.
3. Seat state consistency after rollback.
4. Booking and user audit logging: capturing JSONB snapshots with correct entity IDs.
5. Absolute data protection: password_hash never leaks into audit_logs.
6. Hold expiration: release_expired_holds() cleans up past holds safely without affecting booked seats.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models import (
    Event,
    EventSeat,
    TicketType,
    User,
    Ticket,
    Booking,
    BookingItem,
    Payment,
    AuditLog,
)
from app.services.booking_transaction import (
    book_reserved_seat,
    hold_reserved_seat,
    BookingTransactionError,
    SeatNotAvailableError,
)


def test_transaction_atomic_commit():
    """Verify that a successful booking atomically commits all entities."""
    db = SessionLocal()
    try:
        event = (
            db.query(Event)
            .filter(Event.status == "PUBLISHED", Event.seating_mode == "RESERVED_SEATING")
            .first()
        )
        ticket_type = (
            db.query(TicketType)
            .filter(TicketType.event_id == event.id, TicketType.is_active == True)
            .first()
        )
        seat = (
            db.query(EventSeat)
            .filter(EventSeat.event_id == event.id, EventSeat.status == "AVAILABLE")
            .first()
        )
        user = db.query(User).filter(User.role == "CUSTOMER").first()

        seat_id = seat.id
        booking = book_reserved_seat(
            db=db,
            user_id=user.id,
            event_id=event.id,
            ticket_type_id=ticket_type.id,
            event_seat_id=seat_id,
            payment_method="UPI",
            auto_commit=True,
        )

        # Verify all entities were created
        booking_id = booking.id
        assert booking.status == "CONFIRMED"
        assert booking.total_amount > Decimal("0.00")

        # Verify in a fresh session
        verify_db = SessionLocal()
        try:
            persisted_booking = verify_db.query(Booking).filter(Booking.id == booking_id).one_or_none()
            assert persisted_booking is not None

            item = verify_db.query(BookingItem).filter(BookingItem.booking_id == booking_id).one_or_none()
            assert item is not None
            assert item.ticket_type_id == ticket_type.id

            payment = verify_db.query(Payment).filter(Payment.booking_id == booking_id).one_or_none()
            assert payment is not None
            assert payment.status == "SUCCESS"

            ticket = verify_db.query(Ticket).filter(Ticket.booking_id == booking_id).one_or_none()
            assert ticket is not None
            assert ticket.status == "ACTIVE"
            assert ticket.event_seat_id == seat_id

            persisted_seat = verify_db.query(EventSeat).filter(EventSeat.id == seat_id).one()
            assert persisted_seat.status == "BOOKED"
        finally:
            # Clean up test artifacts
            verify_db.query(EventSeat).filter(EventSeat.id == seat_id).update({
                "status": "AVAILABLE",
                "held_by_booking_id": None,
                "hold_expires_at": None,
            })
            verify_db.query(Ticket).filter(Ticket.booking_id == booking_id).delete()
            verify_db.query(Payment).filter(Payment.booking_id == booking_id).delete()
            verify_db.query(BookingItem).filter(BookingItem.booking_id == booking_id).delete()
            verify_db.query(Booking).filter(Booking.id == booking_id).delete()
            verify_db.commit()
            verify_db.close()
    finally:
        db.close()


def test_transaction_rollback_on_failure():
    """Verify that an intentional failure during booking causes a complete rollback."""
    db = SessionLocal()
    try:
        event = (
            db.query(Event)
            .filter(Event.status == "PUBLISHED", Event.seating_mode == "RESERVED_SEATING")
            .first()
        )
        ticket_type = (
            db.query(TicketType)
            .filter(TicketType.event_id == event.id, TicketType.is_active == True)
            .first()
        )
        seat = (
            db.query(EventSeat)
            .filter(EventSeat.event_id == event.id, EventSeat.status == "AVAILABLE")
            .first()
        )
        user = db.query(User).filter(User.role == "CUSTOMER").first()

        seat_id = seat.id
        initial_seat_status = seat.status

        # Count initial bookings and payments
        initial_booking_count = db.query(Booking).count()
        initial_payment_count = db.query(Payment).count()
        initial_ticket_count = db.query(Ticket).count()

        # Intentionally attempt booking with a non-existent ticket type to trigger failure
        with pytest.raises(BookingTransactionError):
            book_reserved_seat(
                db=db,
                user_id=user.id,
                event_id=event.id,
                ticket_type_id=999999,  # Non-existent ticket type
                event_seat_id=seat_id,
                auto_commit=True,
            )

        # Verify rollback: seat remains AVAILABLE
        db.expire_all()
        refreshed_seat = db.query(EventSeat).filter(EventSeat.id == seat_id).one()
        assert refreshed_seat.status == initial_seat_status
        assert refreshed_seat.held_by_booking_id is None
        assert refreshed_seat.hold_expires_at is None

        # Verify no partial records were committed
        assert db.query(Booking).count() == initial_booking_count
        assert db.query(Payment).count() == initial_payment_count
        assert db.query(Ticket).count() == initial_ticket_count
    finally:
        db.close()


def test_audit_trigger_on_booking_lifecycle():
    """Verify that booking creation and status updates generate JSONB audit log records."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "CUSTOMER").first()
        event = db.query(Event).filter(Event.status == "PUBLISHED").first()

        # 1. Test INSERT generates audit log
        booking = Booking(
            user_id=user.id,
            event_id=event.id,
            booking_reference="EVH-AUDIT-TEST-001",
            status="CONFIRMED",
            subtotal=Decimal("500.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("90.00"),
            total_amount=Decimal("590.00"),
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        # Query audit log for this booking
        audit_insert = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "bookings", AuditLog.entity_id == booking.id)
            .filter(AuditLog.action == "BOOKING_CREATED")
            .first()
        )
        assert audit_insert is not None, "Audit trigger must log BOOKING_CREATED on INSERT"
        assert audit_insert.new_data is not None
        assert audit_insert.new_data.get("booking_reference") == "EVH-AUDIT-TEST-001"
        assert audit_insert.old_data is None

        # 2. Test UPDATE generates audit log
        booking.status = "CANCELLED"
        db.commit()

        audit_update = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "bookings", AuditLog.entity_id == booking.id)
            .filter(AuditLog.action == "BOOKING_STATUS_CANCELLED")
            .first()
        )
        assert audit_update is not None, "Audit trigger must log state change on UPDATE"
        assert audit_update.old_data.get("status") == "CONFIRMED"
        assert audit_update.new_data.get("status") == "CANCELLED"

        # Cleanup test booking and associated audit logs
        db.query(AuditLog).filter(AuditLog.entity_type == "bookings", AuditLog.entity_id == booking.id).delete()
        db.query(Booking).filter(Booking.id == booking.id).delete()
        db.commit()
    finally:
        db.close()


def test_audit_logs_zero_password_leakage():
    """Verify that user updates and inserts NEVER leak password_hash into audit snapshots."""
    db = SessionLocal()
    try:
        # Create a test user with a dummy password hash
        test_user = User(
            email="audit_security_test@eventhub.local",
            password_hash="$2b$12$eX4mpL3H4shD0N0tL34kS3cr3tsT0Aud1tL0gs123456",
            full_name="Audit Security User",
            phone="+91 99999 88888",
            role="CUSTOMER",
            is_active=True,
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # Check audit log for INSERT
        insert_audit = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "users", AuditLog.entity_id == test_user.id)
            .filter(AuditLog.action == "USER_CREATED")
            .first()
        )
        assert insert_audit is not None
        assert "password_hash" not in insert_audit.new_data, "password_hash MUST be stripped from audit snapshot!"

        # Update test user
        test_user.full_name = "Audit Security User Renamed"
        db.commit()

        # Check audit log for UPDATE
        update_audit = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "users", AuditLog.entity_id == test_user.id)
            .filter(AuditLog.action == "USER_UPDATED")
            .first()
        )
        assert update_audit is not None
        assert "password_hash" not in update_audit.old_data, "password_hash MUST be stripped from old_data!"
        assert "password_hash" not in update_audit.new_data, "password_hash MUST be stripped from new_data!"

        # Cleanup
        db.query(AuditLog).filter(AuditLog.entity_type == "users", AuditLog.entity_id == test_user.id).delete()
        db.query(User).filter(User.id == test_user.id).delete()
        db.commit()
    finally:
        db.close()


def test_hold_expiration_release_function():
    """Verify release_expired_holds():

    1. A seat is HELD.
    2. hold_expires_at is set in the past.
    3. release_expired_holds() executes.
    4. Seat becomes AVAILABLE.
    5. Hold fields become NULL.
    6. No booked seats are affected.
    """
    db = SessionLocal()
    try:
        # Find an available seat
        seat = db.query(EventSeat).filter(EventSeat.status == "AVAILABLE").first()
        assert seat is not None
        seat_id = seat.id

        # Create a pending booking to act as held_by_booking_id
        user = db.query(User).filter(User.role == "CUSTOMER").first()
        event = db.query(Event).filter(Event.id == seat.event_id).first()

        past_time = datetime.now(timezone.utc) - timedelta(minutes=30)
        hold_booking = Booking(
            user_id=user.id,
            event_id=event.id,
            booking_reference="EVH-EXP-HOLD-TEST",
            status="PENDING_PAYMENT",
            subtotal=Decimal("200.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("36.00"),
            total_amount=Decimal("236.00"),
            expires_at=past_time,
        )
        db.add(hold_booking)
        db.commit()
        db.refresh(hold_booking)

        # Place hold in the past
        seat.status = "HELD"
        seat.held_by_booking_id = hold_booking.id
        seat.hold_expires_at = past_time
        db.commit()

        # Count how many seats were booked beforehand
        booked_count_before = db.query(EventSeat).filter(EventSeat.status == "BOOKED").count()

        # Execute release_expired_holds() function via raw SQL
        released = db.execute(text("SELECT release_expired_holds();")).scalar()
        assert released >= 1, f"Expected at least 1 released hold, got {released}"

        # Refresh seat and verify state
        db.expire_all()
        refreshed_seat = db.query(EventSeat).filter(EventSeat.id == seat_id).one()
        assert refreshed_seat.status == "AVAILABLE"
        assert refreshed_seat.held_by_booking_id is None
        assert refreshed_seat.hold_expires_at is None

        # Verify no BOOKED seats were touched
        booked_count_after = db.query(EventSeat).filter(EventSeat.status == "BOOKED").count()
        assert booked_count_after == booked_count_before

        # Cleanup booking
        db.query(AuditLog).filter(AuditLog.entity_type == "bookings", AuditLog.entity_id == hold_booking.id).delete()
        db.query(Booking).filter(Booking.id == hold_booking.id).delete()
        db.commit()
    finally:
        db.close()
