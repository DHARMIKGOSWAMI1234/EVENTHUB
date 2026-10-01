"""EVENTHUB Events, Catalog, Tickets, Reviews, Favorites, and Notifications API Tests"""

import uuid
import pytest
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models import Review, Favorite, Ticket


# ----------------------------------------------------------------------------
# Categories & Venues
# ----------------------------------------------------------------------------

def test_list_categories(client):
    """Test public category retrieval."""
    res = client.get("/api/v1/categories")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert "name" in data[0]


def test_get_category_by_id(client):
    """Test single category retrieval by ID."""
    res = client.get("/api/v1/categories/1")
    assert res.status_code == 200
    assert res.json()["id"] == 1


def test_list_venues(client):
    """Test public venues retrieval."""
    res = client.get("/api/v1/venues")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert "name" in data[0]
    assert "capacity" in data[0]


def test_get_venue_by_id(client):
    """Test single venue retrieval."""
    res = client.get("/api/v1/venues/1")
    assert res.status_code == 200
    assert res.json()["id"] == 1


def test_get_venue_seats(client):
    """Test physical seats blueprint for a venue."""
    res = client.get("/api/v1/venues/1/seats")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "seat_label" in data[0]
    assert "section_name" in data[0]


# ----------------------------------------------------------------------------
# Events Catalog
# ----------------------------------------------------------------------------

def test_browse_events_public_published_only(client):
    """Verify event listing exposes only PUBLISHED events."""
    res = client.get("/api/v1/events")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data
    for ev in data["items"]:
        assert ev["status"] == "PUBLISHED"


def test_browse_events_filtering(client):
    """Verify filtering events by search query."""
    res = client.get("/api/v1/events?search=DevCon")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any("devcon" in ev["title"].lower() for ev in data["items"])


def test_event_details(client):
    """Verify event detail includes ticket types, rating, and stored function availability."""
    res = client.get("/api/v1/events/8")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 8
    assert "ticket_types" in data
    assert len(data["ticket_types"]) > 0
    assert "available_ticket_count" in data


def test_event_availability(client):
    """Verify authoritative availability calculation endpoint."""
    res = client.get("/api/v1/events/8/availability")
    assert res.status_code == 200
    data = res.json()
    assert data["event_id"] == 8
    assert "total_capacity" in data
    assert "available_tickets" in data
    assert "occupancy_percentage" in data


def test_event_seats_safe_representation(client):
    """Verify event seat map does not expose private hold or booking IDs."""
    res = client.get("/api/v1/events/8/seats")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    first_seat = data[0]
    assert "seat_label" in first_seat
    assert "status" in first_seat
    assert "held_by_booking_id" not in first_seat
    assert "booking_id" not in first_seat


# ----------------------------------------------------------------------------
# Tickets API
# ----------------------------------------------------------------------------

def test_list_caller_tickets(client, customer_headers):
    """Verify customer can list their issued tickets."""
    res = client.get("/api/v1/tickets", headers=customer_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


def test_ticket_admission_validation_lifecycle(client, customer_headers, db_session):
    """Test gate validation: ACTIVE -> USED, and rejection of re-validation."""
    # Find an active ticket belonging to the caller
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE email = 'aarav.mehta@example.com';")).one()
        user_id = user[0]
        ticket = db.execute(
            text("""
                SELECT t.id, t.status 
                FROM tickets t 
                JOIN bookings b ON t.booking_id = b.id 
                WHERE b.user_id = :uid AND t.status = 'ACTIVE' 
                LIMIT 1;
            """),
            {"uid": user_id},
        ).first()

    if ticket:
        ticket_id = ticket[0]
        # First scan: validate ticket
        scan_res = client.post(f"/api/v1/tickets/{ticket_id}/validate", headers=customer_headers)
        assert scan_res.status_code == 200
        data = scan_res.json()
        assert data["previous_status"] == "ACTIVE"
        assert data["current_status"] == "USED"
        assert "granted" in data["message"].lower()

        # Second scan: reject already used ticket
        rescan_res = client.post(f"/api/v1/tickets/{ticket_id}/validate", headers=customer_headers)
        assert rescan_res.status_code == 400
        assert "already been used" in rescan_res.json()["detail"].lower()

        # Reset ticket status to ACTIVE
        with SessionLocal() as db:
            db.execute(text("UPDATE tickets SET status = 'ACTIVE' WHERE id = :tid;"), {"tid": ticket_id})
            db.commit()


# ----------------------------------------------------------------------------
# Reviews API
# ----------------------------------------------------------------------------

def test_reviews_crud_and_uniqueness(client, customer_headers, db_session):
    """Test review creation, duplicate constraint, update, and deletion."""
    event_id = 9
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE email = 'aarav.mehta@example.com';")).one()
        user_id = user[0]
        # Clean existing review if any
        db.execute(
            text("DELETE FROM reviews WHERE user_id = :uid AND event_id = :eid;"),
            {"uid": user_id, "eid": event_id},
        )
        db.commit()

    # 1. Create review
    create_res = client.post(
        f"/api/v1/events/{event_id}/reviews",
        json={"rating": 5, "comment": "Spectacular event!"},
        headers=customer_headers,
    )
    assert create_res.status_code == 201
    rev_data = create_res.json()
    assert rev_data["rating"] == 5
    review_id = rev_data["id"]

    # 2. Duplicate rejection: UNIQUE(user_id, event_id)
    dup_res = client.post(
        f"/api/v1/events/{event_id}/reviews",
        json={"rating": 4, "comment": "Duplicate attempt"},
        headers=customer_headers,
    )
    assert dup_res.status_code == 409
    assert "already reviewed" in dup_res.json()["detail"].lower()

    # 3. Update review
    update_res = client.patch(
        f"/api/v1/reviews/{review_id}",
        json={"rating": 4, "comment": "Updated review comment"},
        headers=customer_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["rating"] == 4

    # 4. Delete review
    del_res = client.delete(f"/api/v1/reviews/{review_id}", headers=customer_headers)
    assert del_res.status_code == 200


# ----------------------------------------------------------------------------
# Favorites API
# ----------------------------------------------------------------------------

def test_favorites_management(client, customer_headers, db_session):
    """Test bookmarking, listing, idempotent duplicate handling, and unbookmarking."""
    event_id = 10

    # Add favorite
    add_res = client.post(f"/api/v1/favorites/{event_id}", headers=customer_headers)
    assert add_res.status_code == 201

    # Idempotent duplicate request produces clean 201/200 without database error
    dup_res = client.post(f"/api/v1/favorites/{event_id}", headers=customer_headers)
    assert dup_res.status_code == 201

    # List favorites
    list_res = client.get("/api/v1/favorites", headers=customer_headers)
    assert list_res.status_code == 200
    assert any(f["event_id"] == event_id for f in list_res.json())

    # Remove favorite
    del_res = client.delete(f"/api/v1/favorites/{event_id}", headers=customer_headers)
    assert del_res.status_code == 200


# ----------------------------------------------------------------------------
# Notifications API
# ----------------------------------------------------------------------------

def test_notifications_listing_and_read_state(client, customer_headers):
    """Test notification listing and mark as read."""
    # List notifications
    res = client.get("/api/v1/notifications", headers=customer_headers)
    assert res.status_code == 200
    notifs = res.json()
    assert isinstance(notifs, list)

    if notifs:
        notif_id = notifs[0]["id"]
        # Mark single as read
        read_res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=customer_headers)
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

    # Mark all read
    all_res = client.patch("/api/v1/notifications/read-all", headers=customer_headers)
    assert all_res.status_code == 200
    assert "marked as read" in all_res.json()["message"].lower()
