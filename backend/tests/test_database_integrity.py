"""EVENTHUB Database Integrity & Consistency Tests

Implements Part 12 requirements by executing strict relational and domain consistency
validation across all tables in the live PostgreSQL database:
1. No invalid foreign keys (referential integrity).
2. No duplicate unique values (email, booking_reference, transaction_ref, etc.).
3. No invalid event seat states (status invariants).
4. No negative monetary values.
5. No ticket capacity violations (sold_count <= capacity).
6. No invalid booking totals (subtotal - discount + tax == total).
7. No duplicate active event seats (seat assigned to multiple active tickets).
8. No duplicate ticket codes.
9. No duplicate QR tokens.
10. No duplicate favorites (user + event pairs).
11. No invalid reviews (rating between 1 and 5, user + event uniqueness).
12. No corrupted audit JSON (all old_data and new_data are valid JSONB).
"""

import json
from decimal import Decimal
import pytest
from sqlalchemy import text
from app.db.session import SessionLocal


@pytest.fixture
def db_conn():
    """Yield an isolated database session for read-only integrity checks."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def test_no_invalid_foreign_keys(db_conn):
    """1. Verify referential integrity: no orphaned records across core relations."""
    checks = [
        ("organizers.user_id -> users.id", "SELECT count(*) FROM organizers o LEFT JOIN users u ON o.user_id = u.id WHERE u.id IS NULL;"),
        ("events.organizer_id -> organizers.id", "SELECT count(*) FROM events e LEFT JOIN organizers o ON e.organizer_id = o.id WHERE o.id IS NULL;"),
        ("events.venue_id -> venues.id", "SELECT count(*) FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE v.id IS NULL;"),
        ("events.category_id -> categories.id", "SELECT count(*) FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE c.id IS NULL;"),
        ("ticket_types.event_id -> events.id", "SELECT count(*) FROM ticket_types tt LEFT JOIN events e ON tt.event_id = e.id WHERE e.id IS NULL;"),
        ("venue_seats.venue_id -> venues.id", "SELECT count(*) FROM venue_seats vs LEFT JOIN venues v ON vs.venue_id = v.id WHERE v.id IS NULL;"),
        ("event_seats.event_id -> events.id", "SELECT count(*) FROM event_seats es LEFT JOIN events e ON es.event_id = e.id WHERE e.id IS NULL;"),
        ("event_seats.venue_seat_id -> venue_seats.id", "SELECT count(*) FROM event_seats es LEFT JOIN venue_seats vs ON es.venue_seat_id = vs.id WHERE vs.id IS NULL;"),
        ("bookings.user_id -> users.id", "SELECT count(*) FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE u.id IS NULL;"),
        ("bookings.event_id -> events.id", "SELECT count(*) FROM bookings b LEFT JOIN events e ON b.event_id = e.id WHERE e.id IS NULL;"),
        ("booking_items.booking_id -> bookings.id", "SELECT count(*) FROM booking_items bi LEFT JOIN bookings b ON bi.booking_id = b.id WHERE b.id IS NULL;"),
        ("booking_items.ticket_type_id -> ticket_types.id", "SELECT count(*) FROM booking_items bi LEFT JOIN ticket_types tt ON bi.ticket_type_id = tt.id WHERE tt.id IS NULL;"),
        ("payments.booking_id -> bookings.id", "SELECT count(*) FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE b.id IS NULL;"),
        ("tickets.booking_id -> bookings.id", "SELECT count(*) FROM tickets t LEFT JOIN bookings b ON t.booking_id = b.id WHERE b.id IS NULL;"),
        ("tickets.ticket_type_id -> ticket_types.id", "SELECT count(*) FROM tickets t LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id WHERE tt.id IS NULL;"),
        ("reviews.user_id -> users.id", "SELECT count(*) FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE u.id IS NULL;"),
        ("reviews.event_id -> events.id", "SELECT count(*) FROM reviews r LEFT JOIN events e ON r.event_id = e.id WHERE e.id IS NULL;"),
    ]

    for label, query in checks:
        orphans = db_conn.execute(text(query)).scalar()
        assert orphans == 0, f"Orphaned records detected for {label}: count = {orphans}"


def test_no_duplicate_unique_values(db_conn):
    """2. Verify candidate keys and unique constraint integrity."""
    unique_checks = [
        ("users.email", "SELECT email, count(*) FROM users GROUP BY email HAVING count(*) > 1;"),
        ("bookings.booking_reference", "SELECT booking_reference, count(*) FROM bookings GROUP BY booking_reference HAVING count(*) > 1;"),
        ("payments.transaction_reference", "SELECT transaction_reference, count(*) FROM payments GROUP BY transaction_reference HAVING count(*) > 1;"),
        ("categories.name", "SELECT name, count(*) FROM categories GROUP BY name HAVING count(*) > 1;"),
        ("events.slug", "SELECT slug, count(*) FROM events GROUP BY slug HAVING count(*) > 1;"),
    ]

    for label, query in unique_checks:
        duplicates = db_conn.execute(text(query)).fetchall()
        assert len(duplicates) == 0, f"Duplicate values found in {label}: {duplicates}"


def test_no_invalid_event_seat_states(db_conn):
    """3. Verify event seat state invariants."""
    # AVAILABLE must not have hold fields
    invalid_avail = db_conn.execute(text("""
        SELECT count(*) FROM event_seats
        WHERE status = 'AVAILABLE' AND (held_by_booking_id IS NOT NULL OR hold_expires_at IS NOT NULL);
    """)).scalar()
    assert invalid_avail == 0, f"Found {invalid_avail} AVAILABLE seats with non-null hold fields"

    # HELD must have both hold fields
    invalid_held = db_conn.execute(text("""
        SELECT count(*) FROM event_seats
        WHERE status = 'HELD' AND (held_by_booking_id IS NULL OR hold_expires_at IS NULL);
    """)).scalar()
    assert invalid_held == 0, f"Found {invalid_held} HELD seats missing hold fields"

    # BLOCKED must not have hold fields
    invalid_blocked = db_conn.execute(text("""
        SELECT count(*) FROM event_seats
        WHERE status = 'BLOCKED' AND (held_by_booking_id IS NOT NULL OR hold_expires_at IS NOT NULL);
    """)).scalar()
    assert invalid_blocked == 0, f"Found {invalid_blocked} BLOCKED seats with hold fields"


def test_no_negative_monetary_values(db_conn):
    """4. Verify that financial and numerical amounts are non-negative."""
    monetary_checks = [
        ("ticket_types.price", "SELECT count(*) FROM ticket_types WHERE price < 0.00;"),
        ("bookings.subtotal", "SELECT count(*) FROM bookings WHERE subtotal < 0.00;"),
        ("bookings.discount_amount", "SELECT count(*) FROM bookings WHERE discount_amount < 0.00;"),
        ("bookings.tax_amount", "SELECT count(*) FROM bookings WHERE tax_amount < 0.00;"),
        ("bookings.total_amount", "SELECT count(*) FROM bookings WHERE total_amount < 0.00;"),
        ("booking_items.unit_price", "SELECT count(*) FROM booking_items WHERE unit_price < 0.00;"),
        ("booking_items.subtotal", "SELECT count(*) FROM booking_items WHERE subtotal < 0.00;"),
        ("payments.amount", "SELECT count(*) FROM payments WHERE amount < 0.00;"),
    ]

    for label, query in monetary_checks:
        negative_count = db_conn.execute(text(query)).scalar()
        assert negative_count == 0, f"Negative monetary value found in {label}: count = {negative_count}"


def test_no_ticket_capacity_violations(db_conn):
    """5. Verify ticket capacity constraints (sold_count <= capacity)."""
    violations = db_conn.execute(text("""
        SELECT id, name, capacity, sold_count
        FROM ticket_types
        WHERE sold_count > capacity OR sold_count < 0 OR capacity < 0;
    """)).fetchall()
    assert len(violations) == 0, f"Ticket capacity violations found: {violations}"


def test_no_invalid_booking_totals(db_conn):
    """6. Verify booking totals match the DBMS function calculate_booking_total."""
    discrepancies = db_conn.execute(text("""
        SELECT id, booking_reference, subtotal, discount_amount, tax_amount, total_amount,
               calculate_booking_total(subtotal, discount_amount, tax_amount) AS computed_total
        FROM bookings
        WHERE total_amount <> calculate_booking_total(subtotal, discount_amount, tax_amount);
    """)).fetchall()
    assert len(discrepancies) == 0, f"Booking total discrepancies found: {discrepancies}"


def test_no_duplicate_active_event_seats(db_conn):
    """7. Verify no seat is assigned to multiple active tickets simultaneously."""
    conflicts = db_conn.execute(text("""
        SELECT event_seat_id, count(*)
        FROM tickets
        WHERE event_seat_id IS NOT NULL AND status IN ('ACTIVE', 'USED')
        GROUP BY event_seat_id
        HAVING count(*) > 1;
    """)).fetchall()
    assert len(conflicts) == 0, f"Double-assigned active tickets found for event seats: {conflicts}"


def test_no_duplicate_ticket_codes(db_conn):
    """8. Verify all ticket codes are globally unique."""
    duplicates = db_conn.execute(text("""
        SELECT ticket_code, count(*)
        FROM tickets
        GROUP BY ticket_code
        HAVING count(*) > 1;
    """)).fetchall()
    assert len(duplicates) == 0, f"Duplicate ticket codes found: {duplicates}"


def test_no_duplicate_qr_tokens(db_conn):
    """9. Verify all QR tokens are globally unique."""
    duplicates = db_conn.execute(text("""
        SELECT qr_token, count(*)
        FROM tickets
        GROUP BY qr_token
        HAVING count(*) > 1;
    """)).fetchall()
    assert len(duplicates) == 0, f"Duplicate QR tokens found: {duplicates}"


def test_no_duplicate_favorites(db_conn):
    """10. Verify no user has favorited the same event multiple times."""
    duplicates = db_conn.execute(text("""
        SELECT user_id, event_id, count(*)
        FROM favorites
        GROUP BY user_id, event_id
        HAVING count(*) > 1;
    """)).fetchall()
    assert len(duplicates) == 0, f"Duplicate favorites found: {duplicates}"


def test_no_invalid_reviews(db_conn):
    """11. Verify rating range [1, 5] and unique review per user per event."""
    invalid_ratings = db_conn.execute(text("""
        SELECT count(*) FROM reviews WHERE rating < 1 OR rating > 5;
    """)).scalar()
    assert invalid_ratings == 0, f"Reviews with invalid ratings out of range [1, 5]: {invalid_ratings}"

    duplicate_reviews = db_conn.execute(text("""
        SELECT user_id, event_id, count(*)
        FROM reviews
        GROUP BY user_id, event_id
        HAVING count(*) > 1;
    """)).fetchall()
    assert len(duplicate_reviews) == 0, f"Duplicate reviews by user for same event: {duplicate_reviews}"


def test_no_corrupted_audit_json(db_conn):
    """12. Verify that all audit logs contain valid, non-corrupted JSONB data."""
    logs = db_conn.execute(text("""
        SELECT id, old_data::text, new_data::text
        FROM audit_logs;
    """)).fetchall()

    for log_id, old_str, new_str in logs:
        if old_str is not None:
            try:
                parsed = json.loads(old_str)
                assert parsed is None or isinstance(parsed, (dict, list))
            except Exception as err:
                pytest.fail(f"Corrupted old_data JSON in audit_log #{log_id}: {err}")

        if new_str is not None:
            try:
                parsed = json.loads(new_str)
                assert parsed is None or isinstance(parsed, (dict, list))
            except Exception as err:
                pytest.fail(f"Corrupted new_data JSON in audit_log #{log_id}: {err}")
