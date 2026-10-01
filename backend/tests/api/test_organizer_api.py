"""EVENTHUB Organizer API Tests

Validates:
- Organizer profile management
- Event lifecycle: DRAFT -> Ticket Tiers -> PUBLISH -> CANCEL -> DELETE
- Ticket tier management (price, capacity validations)
- Server-side ownership enforcement (Organizer cannot modify another organizer's event)
- Organizer analytics queries via PostgreSQL views
"""

from datetime import date, time, timedelta
import pytest
from sqlalchemy import text
from app.db.session import SessionLocal


def test_organizer_profile_retrieval_and_update(client, organizer_headers):
    """Test retrieving and updating organization profile."""
    # Get profile
    res = client.get("/api/v1/organizer/profile", headers=organizer_headers)
    assert res.status_code == 200
    assert "organization_name" in res.json()

    # Update profile
    patch_res = client.patch(
        "/api/v1/organizer/profile",
        json={"description": "Updated premiere event production company"},
        headers=organizer_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["description"] == "Updated premiere event production company"


def test_organizer_event_lifecycle(client, organizer_headers, db_session):
    """Test full organizer lifecycle: create DRAFT -> add ticket tier -> publish -> cancel."""
    tomorrow = (date.today() + timedelta(days=20)).isoformat()

    # 1. Create event in DRAFT
    create_payload = {
        "category_id": 1,
        "venue_id": 1,
        "title": "Automated Test Music Gala 2026",
        "description": "An exclusive automated test concert event experience.",
        "event_date": tomorrow,
        "start_time": "19:00:00",
        "seating_mode": "GENERAL_ADMISSION",
    }
    create_res = client.post("/api/v1/organizer/events", json=create_payload, headers=organizer_headers)
    assert create_res.status_code == 201
    event = create_res.json()
    event_id = event["id"]
    assert event["status"] == "DRAFT"

    # 2. Add ticket tier
    tt_payload = {
        "name": "General Admission Pass",
        "description": "Full access ticket",
        "price": "499.00",
        "capacity": 100,
    }
    tt_res = client.post(
        f"/api/v1/organizer/events/{event_id}/ticket-types",
        json=tt_payload,
        headers=organizer_headers,
    )
    assert tt_res.status_code == 201
    tt_id = tt_res.json()["id"]

    # 3. Update ticket tier
    patch_tt = client.patch(
        f"/api/v1/organizer/ticket-types/{tt_id}",
        json={"price": "549.00", "capacity": 120},
        headers=organizer_headers,
    )
    assert patch_tt.status_code == 200
    assert patch_tt.json()["capacity"] == 120

    # 4. Publish event
    pub_res = client.post(f"/api/v1/organizer/events/{event_id}/publish", headers=organizer_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "PUBLISHED"

    # 5. Cancel event
    cancel_res = client.post(f"/api/v1/organizer/events/{event_id}/cancel", headers=organizer_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Cleanup
    with SessionLocal() as db:
        db.execute(text("DELETE FROM ticket_types WHERE event_id = :eid;"), {"eid": event_id})
        db.execute(text("DELETE FROM events WHERE id = :eid;"), {"eid": event_id})
        db.commit()


def test_organizer_cannot_modify_other_organizers_event(client, organizer_headers, organizer_headers_2, db_session):
    """Verify Organizer 2 cannot modify or cancel Organizer 1's event (403 Forbidden)."""
    # Create event as Organizer 1
    create_res = client.post(
        "/api/v1/organizer/events",
        json={
            "category_id": 1,
            "venue_id": 1,
            "title": "Org 1 Private Exclusive Showcase",
            "description": "This event belongs strictly to Organizer 1.",
            "event_date": (date.today() + timedelta(days=25)).isoformat(),
            "start_time": "18:00:00",
            "seating_mode": "GENERAL_ADMISSION",
        },
        headers=organizer_headers,
    )
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    try:
        # Attempt update as Organizer 2
        tamper_res = client.patch(
            f"/api/v1/organizer/events/{event_id}",
            json={"title": "Hacked Title Attempt"},
            headers=organizer_headers_2,
        )
        assert tamper_res.status_code == 403
        assert "permission" in tamper_res.json()["detail"].lower()

        # Attempt publish as Organizer 2
        pub_res = client.post(f"/api/v1/organizer/events/{event_id}/publish", headers=organizer_headers_2)
        assert pub_res.status_code == 403

        # Attempt cancel as Organizer 2
        cancel_res = client.post(f"/api/v1/organizer/events/{event_id}/cancel", headers=organizer_headers_2)
        assert cancel_res.status_code == 403

        # Attempt delete as Organizer 2
        del_res = client.delete(f"/api/v1/organizer/events/{event_id}", headers=organizer_headers_2)
        assert del_res.status_code == 403

    finally:
        # Cleanup
        with SessionLocal() as db:
            db.execute(text("DELETE FROM events WHERE id = :eid;"), {"eid": event_id})
            db.commit()


def test_organizer_analytics(client, organizer_headers):
    """Test organizer overview analytics from PostgreSQL view v_organizer_revenue."""
    res = client.get("/api/v1/organizer/analytics/overview", headers=organizer_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
