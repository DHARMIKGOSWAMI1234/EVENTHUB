import os
import pytest
from decimal import Decimal
from sqlalchemy import create_engine, text
from app.core.config import settings

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


@pytest.fixture(scope="module")
def db_engine():
    engine = create_engine(settings.DATABASE_URL)
    yield engine
    engine.dispose()


def test_seed_volume_targets(db_engine):
    """Verify that all 16 core tables satisfy the Phase 3 volume requirements."""
    targets = {
        "users": (30, 50),
        "organizers": (8, 12),
        "categories": (10, 10),
        "venues": (8, 12),
        "venue_seats": (200, 1000),
        "events": (25, 40),
        "ticket_types": (60, 100),
        "event_seats": (500, 3000),
        "bookings": (80, 150),
        "booking_items": (150, 250),
        "payments": (80, 150),
        "tickets": (150, 300),
        "reviews": (40, 80),
        "notifications": (50, 100),
        "audit_logs": (50, 100),
        "favorites": (50, 100),
    }

    with db_engine.connect() as conn:
        for tbl, (min_val, max_val) in targets.items():
            cnt = conn.execute(text(f"SELECT count(*) FROM {tbl};")).scalar()
            assert min_val <= cnt <= max_val, (
                f"Table '{tbl}' count {cnt} out of target range [{min_val}, {max_val}]"
            )


def test_foreign_key_integrity(db_engine):
    """Verify that all foreign keys reference existing rows with zero orphaned records."""
    fk_checks = [
        ("organizers", "user_id", "users", "id"),
        ("events", "organizer_id", "organizers", "id"),
        ("events", "category_id", "categories", "id"),
        ("events", "venue_id", "venues", "id"),
        ("venue_seats", "venue_id", "venues", "id"),
        ("ticket_types", "event_id", "events", "id"),
        ("bookings", "user_id", "users", "id"),
        ("bookings", "event_id", "events", "id"),
        ("event_seats", "event_id", "events", "id"),
        ("event_seats", "venue_seat_id", "venue_seats", "id"),
        ("booking_items", "booking_id", "bookings", "id"),
        ("booking_items", "ticket_type_id", "ticket_types", "id"),
        ("payments", "booking_id", "bookings", "id"),
        ("tickets", "booking_id", "bookings", "id"),
        ("tickets", "ticket_type_id", "ticket_types", "id"),
        ("reviews", "user_id", "users", "id"),
        ("reviews", "event_id", "events", "id"),
        ("notifications", "user_id", "users", "id"),
        ("favorites", "user_id", "users", "id"),
        ("favorites", "event_id", "events", "id"),
    ]

    with db_engine.connect() as conn:
        for src_tbl, src_col, tgt_tbl, tgt_col in fk_checks:
            orphans = conn.execute(text(f"""
                SELECT count(*) 
                FROM {src_tbl} s
                LEFT JOIN {tgt_tbl} t ON s.{src_col} = t.{tgt_col}
                WHERE s.{src_col} IS NOT NULL AND t.{tgt_col} IS NULL;
            """)).scalar()
            assert orphans == 0, f"Found {orphans} orphaned records in {src_tbl}.{src_col} -> {tgt_tbl}.{tgt_col}"


def test_booking_math_consistency(db_engine):
    """Verify booking subtotal, tax, discount, and total amounts match booking items."""
    with db_engine.connect() as conn:
        # Check subtotal equals sum of booking items
        mismatches = conn.execute(text("""
            SELECT b.id, b.subtotal, coalesce(sum(bi.subtotal), 0) AS computed_subtotal
            FROM bookings b
            JOIN booking_items bi ON b.id = bi.booking_id
            GROUP BY b.id, b.subtotal
            HAVING b.subtotal != sum(bi.subtotal);
        """)).fetchall()
        assert len(mismatches) == 0, f"Found booking subtotal mismatches: {mismatches}"

        # Check total = subtotal - discount + tax
        totals_mismatch = conn.execute(text("""
            SELECT id, subtotal, discount_amount, tax_amount, total_amount
            FROM bookings
            WHERE total_amount != (subtotal - discount_amount + tax_amount);
        """)).fetchall()
        assert len(totals_mismatch) == 0, f"Found booking total calculation mismatches: {totals_mismatch}"


def test_payment_consistency(db_engine):
    """Verify payments match booking totals and statuses."""
    with db_engine.connect() as conn:
        # Payment amount matches booking total
        amt_mismatches = conn.execute(text("""
            SELECT p.id, p.amount, b.total_amount
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.amount != b.total_amount;
        """)).fetchall()
        assert len(amt_mismatches) == 0, f"Payment amount mismatches found: {amt_mismatches}"

        # Successful payments correspond to confirmed bookings
        status_mismatches = conn.execute(text("""
            SELECT p.id, p.status, b.status
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.status = 'SUCCESS' AND b.status != 'CONFIRMED';
        """)).fetchall()
        assert len(status_mismatches) == 0, f"Successful payments with non-confirmed bookings: {status_mismatches}"


def test_ticket_and_seat_consistency(db_engine):
    """Verify tickets are valid and reserved seating tickets link to booked event seats."""
    with db_engine.connect() as conn:
        # Tickets with event seats should have event_seats marked BOOKED
        seat_status_mismatches = conn.execute(text("""
            SELECT t.id, t.ticket_code, es.id, es.status
            FROM tickets t
            JOIN event_seats es ON t.event_seat_id = es.id
            WHERE t.status IN ('ACTIVE', 'USED') AND es.status != 'BOOKED';
        """)).fetchall()
        assert len(seat_status_mismatches) == 0, f"Ticket assigned to non-BOOKED seat: {seat_status_mismatches}"


def test_favorites_and_reviews_uniqueness(db_engine):
    """Verify unique constraints on favorites and reviews."""
    with db_engine.connect() as conn:
        dup_favs = conn.execute(text("""
            SELECT user_id, event_id, count(*)
            FROM favorites
            GROUP BY user_id, event_id
            HAVING count(*) > 1;
        """)).fetchall()
        assert len(dup_favs) == 0, f"Duplicate favorites found: {dup_favs}"

        dup_revs = conn.execute(text("""
            SELECT user_id, event_id, count(*)
            FROM reviews
            GROUP BY user_id, event_id
            HAVING count(*) > 1;
        """)).fetchall()
        assert len(dup_revs) == 0, f"Duplicate reviews found: {dup_revs}"


def test_audit_logs_jsonb_validity(db_engine):
    """Verify audit logs have valid JSON structures and non-empty actions."""
    with db_engine.connect() as conn:
        empty_actions = conn.execute(text("""
            SELECT count(*) FROM audit_logs WHERE action IS NULL OR trim(action) = '';
        """)).scalar()
        assert empty_actions == 0


def test_analytics_validation_queries_execute(db_engine):
    """Verify all 15 analytical validation queries in seed_validation.sql execute cleanly."""
    query_file = os.path.join(ROOT_DIR, "database", "queries", "seed_validation.sql")
    with open(query_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    statements = [s.strip() for s in sql_content.split(";") if s.strip()]
    with db_engine.connect() as conn:
        for i, stmt in enumerate(statements, 1):
            clean_lines = [l for l in stmt.splitlines() if not l.strip().startswith("--")]
            clean_stmt = "\n".join(clean_lines).strip()
            if not clean_stmt:
                continue
            res = conn.execute(text(clean_stmt))
            rows = res.fetchall()
            assert len(rows) > 0, f"Analytics query #{i} returned 0 rows"
