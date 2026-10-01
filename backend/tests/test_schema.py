import pytest
from sqlalchemy import create_engine, inspect, text
from app.core.config import settings
from app.models import Base

EXPECTED_TABLES = {
    "users",
    "organizers",
    "categories",
    "venues",
    "venue_seats",
    "events",
    "ticket_types",
    "bookings",
    "event_seats",
    "booking_items",
    "payments",
    "tickets",
    "reviews",
    "notifications",
    "audit_logs",
    "favorites",
}


@pytest.fixture(scope="module")
def db_engine():
    engine = create_engine(settings.DATABASE_URL)
    yield engine
    engine.dispose()


def test_models_metadata_has_16_tables():
    """Verify that SQLAlchemy Base.metadata has registered exactly 16 core tables."""
    assert len(Base.metadata.tables) == 16
    assert set(Base.metadata.tables.keys()) == EXPECTED_TABLES


def test_database_connection(db_engine):
    """Verify active connection to PostgreSQL eventhub database."""
    with db_engine.connect() as conn:
        result = conn.execute(text("SELECT 1;")).scalar()
        assert result == 1


def test_postgresql_all_16_tables_exist(db_engine):
    """Verify that PostgreSQL database has all 16 core tables created."""
    inspector = inspect(db_engine)
    all_tables = inspector.get_table_names()
    core_tables = {t for t in all_tables if t != "alembic_version"}
    assert core_tables == EXPECTED_TABLES
    assert len(core_tables) == 16


def test_primary_keys_exist(db_engine):
    """Verify that all 16 tables have an 'id' primary key."""
    inspector = inspect(db_engine)
    for table_name in EXPECTED_TABLES:
        pk = inspector.get_pk_constraint(table_name)
        assert pk is not None, f"Missing primary key on {table_name}"
        assert pk["constrained_columns"] == ["id"], f"Expected 'id' as PK on {table_name}, got {pk['constrained_columns']}"


def test_foreign_keys_verification(db_engine):
    """Verify required foreign keys and their safe delete behaviors."""
    inspector = inspect(db_engine)
    fk_map = {}
    for table_name in EXPECTED_TABLES:
        fks = inspector.get_foreign_keys(table_name)
        for fk in fks:
            source_col = fk["constrained_columns"][0]
            target_table = fk["referred_table"]
            target_col = fk["referred_columns"][0]
            ondelete = fk.get("options", {}).get("ondelete")
            fk_map[(table_name, source_col)] = (target_table, target_col, ondelete)

    # Key foreign key assertions
    assert fk_map[("organizers", "user_id")] == ("users", "id", "RESTRICT")
    assert fk_map[("events", "organizer_id")] == ("organizers", "id", "RESTRICT")
    assert fk_map[("events", "category_id")] == ("categories", "id", "RESTRICT")
    assert fk_map[("events", "venue_id")] == ("venues", "id", "RESTRICT")
    assert fk_map[("venue_seats", "venue_id")] == ("venues", "id", "CASCADE")
    assert fk_map[("ticket_types", "event_id")] == ("events", "id", "RESTRICT")
    assert fk_map[("bookings", "user_id")] == ("users", "id", "RESTRICT")
    assert fk_map[("bookings", "event_id")] == ("events", "id", "RESTRICT")
    assert fk_map[("event_seats", "event_id")] == ("events", "id", "RESTRICT")
    assert fk_map[("event_seats", "venue_seat_id")] == ("venue_seats", "id", "RESTRICT")
    assert fk_map[("event_seats", "held_by_booking_id")] == ("bookings", "id", "SET NULL")
    assert fk_map[("booking_items", "booking_id")] == ("bookings", "id", "RESTRICT")
    assert fk_map[("booking_items", "ticket_type_id")] == ("ticket_types", "id", "RESTRICT")
    assert fk_map[("payments", "booking_id")] == ("bookings", "id", "RESTRICT")
    assert fk_map[("tickets", "booking_id")] == ("bookings", "id", "RESTRICT")
    assert fk_map[("tickets", "ticket_type_id")] == ("ticket_types", "id", "RESTRICT")
    assert fk_map[("tickets", "event_seat_id")] == ("event_seats", "id", "RESTRICT")
    assert fk_map[("reviews", "user_id")] == ("users", "id", "RESTRICT")
    assert fk_map[("reviews", "event_id")] == ("events", "id", "RESTRICT")
    assert fk_map[("notifications", "user_id")] == ("users", "id", "CASCADE")
    assert fk_map[("audit_logs", "user_id")] == ("users", "id", "SET NULL")
    assert fk_map[("favorites", "user_id")] == ("users", "id", "CASCADE")
    assert fk_map[("favorites", "event_id")] == ("events", "id", "CASCADE")


def test_unique_constraints_and_indexes(db_engine):
    """Verify unique constraints exist on designated columns."""
    inspector = inspect(db_engine)
    
    # users.email
    users_uqs = [u["column_names"] for u in inspector.get_unique_constraints("users")]
    assert ["email"] in users_uqs

    # organizers.user_id
    org_uqs = [u["column_names"] for u in inspector.get_unique_constraints("organizers")]
    assert ["user_id"] in org_uqs

    # categories.name
    cat_uqs = [u["column_names"] for u in inspector.get_unique_constraints("categories")]
    assert ["name"] in cat_uqs

    # venue_seats.(venue_id, seat_label)
    vs_uqs = [set(u["column_names"]) for u in inspector.get_unique_constraints("venue_seats")]
    assert {"venue_id", "seat_label"} in vs_uqs

    # events.slug
    ev_uqs = [u["column_names"] for u in inspector.get_unique_constraints("events")]
    assert ["slug"] in ev_uqs

    # bookings.booking_reference
    b_uqs = [u["column_names"] for u in inspector.get_unique_constraints("bookings")]
    assert ["booking_reference"] in b_uqs

    # event_seats.(event_id, venue_seat_id)
    es_uqs = [set(u["column_names"]) for u in inspector.get_unique_constraints("event_seats")]
    assert {"event_id", "venue_seat_id"} in es_uqs

    # payments.transaction_reference
    pay_uqs = [u["column_names"] for u in inspector.get_unique_constraints("payments")]
    assert ["transaction_reference"] in pay_uqs

    # tickets.ticket_code and qr_token
    t_uqs = [u["column_names"] for u in inspector.get_unique_constraints("tickets")]
    assert ["ticket_code"] in t_uqs
    assert ["qr_token"] in t_uqs

    # reviews.(user_id, event_id)
    rev_uqs = [set(u["column_names"]) for u in inspector.get_unique_constraints("reviews")]
    assert {"user_id", "event_id"} in rev_uqs

    # favorites.(user_id, event_id)
    fav_uqs = [set(u["column_names"]) for u in inspector.get_unique_constraints("favorites")]
    assert {"user_id", "event_id"} in fav_uqs


def test_check_constraints_verification(db_engine):
    """Verify check constraints on tables."""
    inspector = inspect(db_engine)
    
    # Users role check
    user_checks = [c["name"] for c in inspector.get_check_constraints("users")]
    assert "ck_users_role" in user_checks

    # Venues capacity check
    venue_checks = [c["name"] for c in inspector.get_check_constraints("venues")]
    assert "ck_venues_capacity" in venue_checks

    # Events seating_mode, status, end_time checks
    event_checks = [c["name"] for c in inspector.get_check_constraints("events")]
    assert "ck_events_seating_mode" in event_checks
    assert "ck_events_status" in event_checks
    assert "ck_events_end_time_after_start" in event_checks

    # Ticket types capacity and price
    tt_checks = [c["name"] for c in inspector.get_check_constraints("ticket_types")]
    assert "ck_ticket_types_capacity" in tt_checks
    assert "ck_ticket_types_price" in tt_checks

    # Bookings status
    b_checks = [c["name"] for c in inspector.get_check_constraints("bookings")]
    assert "ck_bookings_status" in b_checks

    # Reviews rating range
    rev_checks = [c["name"] for c in inspector.get_check_constraints("reviews")]
    assert "ck_reviews_rating_range" in rev_checks


def test_tables_are_empty_in_phase_2(db_engine):
    """Confirm zero rows exist across all tables in Phase 2."""
    with db_engine.connect() as conn:
        for table_name in EXPECTED_TABLES:
            count = conn.execute(text(f"SELECT count(*) FROM {table_name};")).scalar()
            assert count == 0, f"Expected 0 rows in table {table_name}, found {count}"
