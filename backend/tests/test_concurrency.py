"""EVENTHUB Concurrency Tests: Double-Booking Prevention

Demonstrates database-level concurrency control using SELECT ... FOR UPDATE.
Tests that when two concurrent transactions attempt to book or hold the exact same
reserved seat simultaneously:
1. PostgreSQL row-level locks force sequential execution at the row level.
2. The winning transaction succeeds and marks the seat BOOKED.
3. The losing transaction waits for the lock, observes the updated state,
   and fails safely with a controlled SeatNotAvailableError.
4. The database remains completely consistent with exactly one active ticket.
"""

import threading
import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models import Event, EventSeat, TicketType, User, Ticket, Booking, BookingItem, Payment
from app.services.booking_transaction import book_reserved_seat, hold_reserved_seat, SeatNotAvailableError


def test_double_booking_prevention_concurrent_transactions():
    """Verify that simultaneous booking attempts on the same seat result in exactly

    one success and one controlled SeatNotAvailableError.
    """
    # 1. Setup test session and identify an available seat
    db = SessionLocal()
    try:
        # Find a published reserved-seating event with an available seat
        event = (
            db.query(Event)
            .filter(Event.status == "PUBLISHED", Event.seating_mode == "RESERVED_SEATING")
            .first()
        )
        assert event is not None, "A published reserved-seating event must exist"

        ticket_type = (
            db.query(TicketType)
            .filter(TicketType.event_id == event.id, TicketType.is_active == True)
            .first()
        )
        assert ticket_type is not None, "An active ticket type must exist"

        available_seat = (
            db.query(EventSeat)
            .filter(EventSeat.event_id == event.id, EventSeat.status == "AVAILABLE")
            .first()
        )
        assert available_seat is not None, "An available seat must exist for concurrency testing"

        seat_id = available_seat.id
        event_id = event.id
        ticket_type_id = ticket_type.id

        # Get two distinct users
        users = db.query(User).filter(User.role == "CUSTOMER").limit(2).all()
        assert len(users) >= 2, "At least two customer users are required"
        user_a_id = users[0].id
        user_b_id = users[1].id
    finally:
        db.close()

    # 2. Concurrency Barrier to synchronize thread dispatch
    barrier = threading.Barrier(2)
    results = []
    errors = []

    def attempt_booking(user_id: int):
        # Each thread manages its own isolated database session and transaction
        thread_db = SessionLocal()
        try:
            # Wait at barrier so both threads trigger concurrently
            barrier.wait(timeout=5)
            booking = book_reserved_seat(
                db=thread_db,
                user_id=user_id,
                event_id=event_id,
                ticket_type_id=ticket_type_id,
                event_seat_id=seat_id,
                payment_method="UPI",
                auto_commit=True,
            )
            return ("SUCCESS", booking.id, user_id)
        except SeatNotAvailableError as err:
            return ("SEAT_UNAVAILABLE", str(err), user_id)
        except Exception as exc:
            return ("UNEXPECTED_ERROR", str(exc), user_id)
        finally:
            thread_db.close()

    # 3. Execute concurrent booking attempts using a ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(attempt_booking, user_a_id),
            executor.submit(attempt_booking, user_b_id),
        ]
        for future in as_completed(futures):
            status, payload, uid = future.result()
            if status == "SUCCESS":
                results.append((payload, uid))
            elif status == "SEAT_UNAVAILABLE":
                errors.append((payload, uid))
            else:
                pytest.fail(f"Unexpected transaction error occurred: {payload}")

    # 4. Assert strict concurrency control invariants
    assert len(results) == 1, f"Expected exactly 1 successful booking, got {len(results)}"
    assert len(errors) == 1, f"Expected exactly 1 controlled SeatNotAvailableError, got {len(errors)}"

    winning_booking_id, winning_user_id = results[0]
    error_message, losing_user_id = errors[0]

    assert winning_user_id != losing_user_id
    assert "no longer available" in error_message

    # 5. Verify database integrity
    verify_db = SessionLocal()
    try:
        # Check seat status in database
        seat = verify_db.query(EventSeat).filter(EventSeat.id == seat_id).one()
        assert seat.status == "BOOKED", f"Seat status must be BOOKED, found: {seat.status}"

        # Ensure exactly one active ticket was issued for this seat
        tkt_count = (
            verify_db.query(Ticket)
            .filter(Ticket.event_seat_id == seat_id, Ticket.status == "ACTIVE")
            .count()
        )
        assert tkt_count == 1, f"Expected exactly 1 active ticket for seat #{seat_id}, found: {tkt_count}"

        # Clean up test artifacts to preserve pristine demo data state
        verify_db.query(Ticket).filter(Ticket.booking_id == winning_booking_id).delete()
        verify_db.query(Payment).filter(Payment.booking_id == winning_booking_id).delete()
        verify_db.query(BookingItem).filter(BookingItem.booking_id == winning_booking_id).delete()
        verify_db.query(Booking).filter(Booking.id == winning_booking_id).delete()

        # Restore seat to AVAILABLE
        seat.status = "AVAILABLE"
        seat.held_by_booking_id = None
        seat.hold_expires_at = None
        verify_db.commit()
    finally:
        verify_db.close()


def test_concurrent_hold_and_book_conflict():
    """Verify race condition when Customer A holds and Customer B books the same seat concurrently."""
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
        available_seat = (
            db.query(EventSeat)
            .filter(EventSeat.event_id == event.id, EventSeat.status == "AVAILABLE")
            .first()
        )
        seat_id = available_seat.id
        event_id = event.id
        ticket_type_id = ticket_type.id

        users = db.query(User).filter(User.role == "CUSTOMER").limit(2).all()
        user_a_id = users[0].id
        user_b_id = users[1].id
    finally:
        db.close()

    barrier = threading.Barrier(2)
    outcomes = []

    def op_hold():
        tdb = SessionLocal()
        try:
            barrier.wait(timeout=5)
            bk = hold_reserved_seat(
                db=tdb,
                user_id=user_a_id,
                event_id=event_id,
                ticket_type_id=ticket_type_id,
                event_seat_id=seat_id,
                hold_minutes=15,
                auto_commit=True,
            )
            return ("HOLD_SUCCESS", bk.id)
        except SeatNotAvailableError as err:
            return ("HOLD_FAIL", str(err))
        finally:
            tdb.close()

    def op_book():
        tdb = SessionLocal()
        try:
            barrier.wait(timeout=5)
            bk = book_reserved_seat(
                db=tdb,
                user_id=user_b_id,
                event_id=event_id,
                ticket_type_id=ticket_type_id,
                event_seat_id=seat_id,
                auto_commit=True,
            )
            return ("BOOK_SUCCESS", bk.id)
        except SeatNotAvailableError as err:
            return ("BOOK_FAIL", str(err))
        finally:
            tdb.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        f_hold = executor.submit(op_hold)
        f_book = executor.submit(op_book)
        res_hold = f_hold.result()
        res_book = f_book.result()

    # Exactly one succeeded and one failed
    success_count = (1 if res_hold[0] == "HOLD_SUCCESS" else 0) + (1 if res_book[0] == "BOOK_SUCCESS" else 0)
    fail_count = (1 if res_hold[0] == "HOLD_FAIL" else 0) + (1 if res_book[0] == "BOOK_FAIL" else 0)

    assert success_count == 1, f"Expected 1 success, got hold: {res_hold}, book: {res_book}"
    assert fail_count == 1, f"Expected 1 failure, got hold: {res_hold}, book: {res_book}"

    # Cleanup
    cleanup_db = SessionLocal()
    try:
        # Reset seat status to AVAILABLE
        seat = cleanup_db.query(EventSeat).filter(EventSeat.id == seat_id).one()
        seat.status = "AVAILABLE"
        seat.held_by_booking_id = None
        seat.hold_expires_at = None
        cleanup_db.flush()

        created_booking_id = res_hold[1] if res_hold[0] == "HOLD_SUCCESS" else res_book[1]
        cleanup_db.query(Ticket).filter(Ticket.booking_id == created_booking_id).delete()
        cleanup_db.query(Payment).filter(Payment.booking_id == created_booking_id).delete()
        cleanup_db.query(BookingItem).filter(BookingItem.booking_id == created_booking_id).delete()
        cleanup_db.query(Booking).filter(Booking.id == created_booking_id).delete()
        cleanup_db.commit()
    finally:
        cleanup_db.close()
