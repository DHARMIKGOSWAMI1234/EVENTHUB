"""EVENTHUB Admin and Analytics API Tests

Validates:
- User administrative management (status, role promotion)
- Category management with foreign key deletion safety
- Venue management with unique seat constraint verification
- System analytics mapping all Phase 4 PostgreSQL views
- Immutable audit log inspection with zero password_hash exposure
- Maintenance trigger for release_expired_holds()
- Strict admin-only access control
"""

import uuid
import pytest
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models import User, Category, Venue, VenueSeat


def test_admin_user_management(client, admin_headers, db_session):
    """Test user list retrieval, status deactivation, and role changes."""
    # Create temporary user
    temp_email = f"test.admin.mgmt.{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Admin Mgmt User", "email": temp_email, "password": "Password123!"},
    )
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    try:
        # 1. List users
        users_res = client.get("/api/v1/admin/users?role=CUSTOMER", headers=admin_headers)
        assert users_res.status_code == 200
        assert users_res.json()["total"] >= 1

        # 2. Deactivate user
        status_res = client.patch(
            f"/api/v1/admin/users/{user_id}/status",
            json={"is_active": False},
            headers=admin_headers,
        )
        assert status_res.status_code == 200
        assert status_res.json()["is_active"] is False

        # 3. Promote role to ORGANIZER
        role_res = client.patch(
            f"/api/v1/admin/users/{user_id}/role",
            json={"role": "ORGANIZER"},
            headers=admin_headers,
        )
        assert role_res.status_code == 200
        assert role_res.json()["role"] == "ORGANIZER"

    finally:
        with SessionLocal() as db:
            db.execute(text("DELETE FROM users WHERE id = :uid;"), {"uid": user_id})
            db.commit()


def test_admin_category_management(client, admin_headers, db_session):
    """Test category creation, duplicate rejection, update, and FK conflict handling."""
    cat_name = f"Special Category {uuid.uuid4().hex[:6]}"

    # Create category
    create_res = client.post(
        "/api/v1/admin/categories",
        json={"name": cat_name, "description": "Test category description"},
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    cat_id = create_res.json()["id"]

    # Duplicate rejection
    dup_res = client.post(
        "/api/v1/admin/categories",
        json={"name": cat_name},
        headers=admin_headers,
    )
    assert dup_res.status_code == 409

    # Update category
    patch_res = client.patch(
        f"/api/v1/admin/categories/{cat_id}",
        json={"description": "Updated category description"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200

    # Delete safe category
    del_res = client.delete(f"/api/v1/admin/categories/{cat_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # Attempt delete category with associated events -> 409 Conflict
    conflict_res = client.delete("/api/v1/admin/categories/1", headers=admin_headers)
    assert conflict_res.status_code == 409
    assert "depend on it" in conflict_res.json()["detail"].lower()


def test_admin_venue_and_seat_management(client, admin_headers, db_session):
    """Test venue creation, venue seat creation, and UNIQUE(venue_id, seat_label) validation."""
    venue_name = f"Test Arena {uuid.uuid4().hex[:6]}"

    # 1. Create venue
    v_res = client.post(
        "/api/v1/admin/venues",
        json={
            "name": venue_name,
            "city": "Mumbai",
            "address": "123 Marine Drive",
            "capacity": 500,
        },
        headers=admin_headers,
    )
    assert v_res.status_code == 201
    venue_id = v_res.json()["id"]

    try:
        # 2. Add seat to venue
        seat_res = client.post(
            f"/api/v1/admin/venues/{venue_id}/seats",
            json={
                "section_name": "VIP Balcony",
                "row_label": "A",
                "seat_number": 1,
                "seat_label": "VIP-A-1",
                "seat_type": "VIP",
            },
            headers=admin_headers,
        )
        assert seat_res.status_code == 201
        assert seat_res.json()["seat_label"] == "VIP-A-1"

        # 3. Duplicate seat label in same venue -> 409 Conflict
        dup_seat = client.post(
            f"/api/v1/admin/venues/{venue_id}/seats",
            json={
                "section_name": "VIP Balcony",
                "row_label": "A",
                "seat_number": 2,
                "seat_label": "VIP-A-1",  # Duplicate label
            },
            headers=admin_headers,
        )
        assert dup_seat.status_code == 409

    finally:
        with SessionLocal() as db:
            db.execute(text("DELETE FROM venue_seats WHERE venue_id = :vid;"), {"vid": venue_id})
            db.execute(text("DELETE FROM venues WHERE id = :vid;"), {"vid": venue_id})
            db.commit()


def test_admin_analytics_endpoints_and_views(client, admin_headers):
    """Verify all 5 Phase 4 views are properly queried by admin analytics endpoints."""
    # Overview
    ov_res = client.get("/api/v1/admin/analytics/overview", headers=admin_headers)
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert "total_users" in ov_data
    assert "gross_revenue" in ov_data

    # v_event_sales_summary
    sales_res = client.get("/api/v1/admin/analytics/events", headers=admin_headers)
    assert sales_res.status_code == 200
    assert len(sales_res.json()) > 0
    assert "gross_revenue" in sales_res.json()[0]

    # v_organizer_revenue
    rev_res = client.get("/api/v1/admin/analytics/revenue", headers=admin_headers)
    assert rev_res.status_code == 200
    assert len(rev_res.json()) > 0
    assert "organization_name" in rev_res.json()[0]

    # v_monthly_booking_summary
    mon_res = client.get("/api/v1/admin/analytics/bookings", headers=admin_headers)
    assert mon_res.status_code == 200
    assert len(mon_res.json()) > 0
    assert "month_label" in mon_res.json()[0]

    # v_event_rating_summary
    rat_res = client.get("/api/v1/admin/analytics/ratings", headers=admin_headers)
    assert rat_res.status_code == 200
    assert len(rat_res.json()) > 0
    assert "average_rating" in rat_res.json()[0]


def test_admin_audit_logs_zero_password_leakage(client, admin_headers):
    """Verify audit logs are accessible to admin and strictly sanitize password_hash."""
    res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] > 0

    for log in data["items"]:
        old_data = log.get("old_data") or {}
        new_data = log.get("new_data") or {}
        assert "password_hash" not in old_data, "Leaked password_hash in old_data!"
        assert "password_hash" not in new_data, "Leaked password_hash in new_data!"


def test_admin_maintenance_release_expired_holds(client, admin_headers):
    """Test administrative release of expired holds invoking stored function."""
    res = client.post("/api/v1/admin/maintenance/release-expired-holds", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "expired holds released" in data["message"].lower()


def test_admin_endpoints_forbidden_for_non_admins(client, customer_headers, organizer_headers):
    """Verify customer and organizer are forbidden from accessing admin endpoints."""
    # Customer forbidden
    c_res = client.get("/api/v1/admin/analytics/overview", headers=customer_headers)
    assert c_res.status_code == 403

    # Organizer forbidden
    o_res = client.get("/api/v1/admin/audit-logs", headers=organizer_headers)
    assert o_res.status_code == 403

    # Unauthenticated forbidden
    u_res = client.post("/api/v1/admin/maintenance/release-expired-holds")
    assert u_res.status_code == 401
