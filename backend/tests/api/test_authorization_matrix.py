"""EVENTHUB Authorization Matrix Tests (Part 44)

Explicitly verifies:
1. Customer cannot access admin endpoint
2. Customer cannot modify organizer event
3. Organizer cannot modify another organizer's event
4. Organizer cannot access unrelated private organizer data
5. User cannot access another user's booking
6. User cannot access another user's ticket
7. User cannot access another user's notification
8. Admin can access authorized administrative operations
"""

import pytest
from sqlalchemy import text
from app.db.session import SessionLocal


def test_1_customer_cannot_access_admin_endpoint(client, customer_headers):
    """Customer cannot access administrative endpoints (403 Forbidden)."""
    res = client.get("/api/v1/admin/users", headers=customer_headers)
    assert res.status_code == 403
    assert "privileges required" in res.json()["detail"].lower()


def test_2_customer_cannot_modify_organizer_event(client, customer_headers):
    """Customer cannot create or modify events via organizer router (403 Forbidden)."""
    res = client.post(
        "/api/v1/organizer/events",
        json={"title": "Customer Attempt", "category_id": 1, "venue_id": 1},
        headers=customer_headers,
    )
    assert res.status_code == 403
    assert "organizers" in res.json()["detail"].lower()


def test_3_organizer_cannot_modify_another_organizers_event(client, organizer_headers_2):
    """Organizer cannot update or cancel another organizer's event (403 Forbidden)."""
    # Event #8 belongs to Organizer #1
    res = client.patch(
        "/api/v1/organizer/events/8",
        json={"title": "Tampered Event Title"},
        headers=organizer_headers_2,
    )
    assert res.status_code == 403
    assert "permission" in res.json()["detail"].lower()


def test_4_organizer_cannot_access_unrelated_private_organizer_data(client, organizer_headers_2):
    """Organizer cannot inspect detailed sales for an event they do not own (403 Forbidden)."""
    # Event #8 belongs to Organizer #1
    res = client.get("/api/v1/organizer/analytics/events/8", headers=organizer_headers_2)
    assert res.status_code == 403
    assert "permission" in res.json()["detail"].lower()


def test_5_user_cannot_access_another_users_booking(client, customer_headers_2):
    """Customer cannot view another customer's private booking (403 Forbidden)."""
    # Find booking belonging to customer 1 (user_id = 14)
    with SessionLocal() as db:
        booking = db.execute(text("SELECT id, user_id FROM bookings WHERE user_id = 14 LIMIT 1;")).first()

    if booking:
        booking_id = booking[0]
        res = client.get(f"/api/v1/bookings/{booking_id}", headers=customer_headers_2)
        assert res.status_code == 403
        assert "access" in res.json()["detail"].lower()


def test_6_user_cannot_access_another_users_ticket(client, customer_headers_2):
    """Customer cannot inspect another customer's ticket (403 Forbidden)."""
    # Find ticket belonging to customer 1 (user_id = 14)
    with SessionLocal() as db:
        ticket = db.execute(
            text("""
                SELECT t.id 
                FROM tickets t 
                JOIN bookings b ON t.booking_id = b.id 
                WHERE b.user_id = 14 
                LIMIT 1;
            """)
        ).first()

    if ticket:
        ticket_id = ticket[0]
        res = client.get(f"/api/v1/tickets/{ticket_id}", headers=customer_headers_2)
        assert res.status_code == 403
        assert "access not permitted" in res.json()["detail"].lower()


def test_7_user_cannot_access_another_users_notification(client, customer_headers_2):
    """Customer cannot mark as read a notification belonging to another user (403 Forbidden)."""
    # Find notification belonging to customer 1 (user_id = 14)
    with SessionLocal() as db:
        notif = db.execute(text("SELECT id FROM notifications WHERE user_id = 14 LIMIT 1;")).first()

    if notif:
        notif_id = notif[0]
        res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=customer_headers_2)
        assert res.status_code == 403
        assert "access not permitted" in res.json()["detail"].lower()


def test_8_admin_can_access_authorized_administrative_operations(client, admin_headers):
    """Admin can execute privileged operations across users, views, and maintenance."""
    users_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200

    overview_res = client.get("/api/v1/admin/analytics/overview", headers=admin_headers)
    assert overview_res.status_code == 200

    maint_res = client.post("/api/v1/admin/maintenance/release-expired-holds", headers=admin_headers)
    assert maint_res.status_code == 200
