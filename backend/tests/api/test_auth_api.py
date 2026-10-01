"""EVENTHUB Auth API Tests

Validates:
1. successful registration
2. duplicate email rejection
3. password hashing
4. successful login
5. invalid password rejection
6. inactive user rejection
7. access token validation
8. expired token rejection
9. protected endpoint without token
10. customer role restriction
11. organizer role restriction
12. admin role restriction
"""

import time
import uuid
import pytest
from app.core.security import create_access_token
from app.models import User
from app.db.session import SessionLocal


def test_1_successful_registration(client, db_session):
    """Test successful customer registration."""
    unique_email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "full_name": "Test Candidate",
        "email": unique_email,
        "password": "SecurePassword123!",
        "phone": "+919876543210",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_email
    assert data["role"] == "CUSTOMER"
    assert "password" not in data
    assert "password_hash" not in data

    # Cleanup created user
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == unique_email).first()
        if user:
            db.delete(user)
            db.commit()


def test_2_duplicate_email_rejection(client):
    """Test rejection when registering with an existing email."""
    payload = {
        "full_name": "Duplicate User",
        "email": "aarav.mehta@example.com",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


def test_3_password_hashing(client, db_session):
    """Verify passwords are never stored in plaintext and use PBKDF2 hashing."""
    unique_email = f"hash.verify.{uuid.uuid4().hex[:8]}@example.com"
    raw_password = "SuperSecretPassword2026!"
    payload = {
        "full_name": "Hash Verifier",
        "email": unique_email,
        "password": raw_password,
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == unique_email).first()
        assert user is not None
        assert user.password_hash != raw_password
        assert user.password_hash.startswith("pbkdf2:sha256:")
        # Cleanup
        db.delete(user)
        db.commit()


def test_4_successful_login(client):
    """Test successful authentication returning valid JWT access and refresh tokens."""
    payload = {
        "email": "aarav.mehta@example.com",
        "password": "DemoUser@2026",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_seconds"] > 0


def test_5_invalid_password(client):
    """Test rejection on incorrect credentials."""
    payload = {
        "email": "aarav.mehta@example.com",
        "password": "WrongPassword@999",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_6_inactive_user_rejection(client, db_session):
    """Test login rejection for deactivated user accounts."""
    inactive_email = f"inactive.{uuid.uuid4().hex[:8]}@example.com"
    with SessionLocal() as db:
        from app.core.security import hash_password
        user = User(
            full_name="Inactive User",
            email=inactive_email,
            password_hash=hash_password("DemoUser@2026"),
            role="CUSTOMER",
            is_active=False,
        )
        db.add(user)
        db.commit()

    try:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": inactive_email, "password": "DemoUser@2026"},
        )
        assert response.status_code == 401
        assert "deactivated" in response.json()["detail"].lower()
    finally:
        with SessionLocal() as db:
            u = db.query(User).filter(User.email == inactive_email).first()
            if u:
                db.delete(u)
                db.commit()


def test_7_access_token_validation(client, customer_headers):
    """Test authenticated request to /auth/me with valid Bearer token."""
    response = client.get("/api/v1/auth/me", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "aarav.mehta@example.com"
    assert data["role"] == "CUSTOMER"
    assert "password_hash" not in data


def test_8_expired_token_rejection(client):
    """Test rejection when Bearer token has expired."""
    from datetime import timedelta
    expired_token = create_access_token(
        {"sub": "1", "role": "CUSTOMER"},
        expires_delta=timedelta(seconds=-60),
    )

    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_9_protected_endpoint_without_token(client):
    """Test rejection when no Authorization header is provided."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "required" in response.json()["detail"].lower()


def test_10_customer_role_restriction(client, customer_headers):
    """Verify customers cannot access administrative endpoints."""
    response = client.get("/api/v1/admin/users", headers=customer_headers)
    assert response.status_code == 403
    assert "privileges required" in response.json()["detail"].lower()


def test_11_organizer_role_restriction(client, organizer_headers):
    """Verify organizers cannot access administrative endpoints."""
    response = client.get("/api/v1/admin/users", headers=organizer_headers)
    assert response.status_code == 403
    assert "privileges required" in response.json()["detail"].lower()


def test_12_admin_role_restriction(client, admin_headers):
    """Verify administrators can successfully access administrative endpoints."""
    response = client.get("/api/v1/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
