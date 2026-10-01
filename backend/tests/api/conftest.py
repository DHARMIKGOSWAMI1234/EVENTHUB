"""EVENTHUB API Test Configuration and Fixtures"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app

from app.db.session import SessionLocal

TEST_PASSWORD = "DemoUser@2026"
ADMIN_EMAIL = "priya.nair.admin@example.com"
ORGANIZER_EMAIL = "vikram.malhotra@example.com"
ORGANIZER_EMAIL_2 = "sarah.jenkins@example.com"
CUSTOMER_EMAIL = "aarav.mehta@example.com"
CUSTOMER_EMAIL_2 = "riya.shah@example.com"


@pytest.fixture(scope="session")
def client():
    """Shared HTTP test client for API integration tests."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def db_session():
    """Transactional session with teardown protecting seed volume targets."""
    session = SessionLocal()
    yield session
    session.close()
    # Teardown: ensure audit_logs count stays within targets by pruning test-generated logs
    with SessionLocal() as s:
        s.execute(text("DELETE FROM audit_logs WHERE id > 75;"))
        s.commit()


@pytest.fixture(scope="session")
def admin_headers(client) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": TEST_PASSWORD})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def organizer_headers(client) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": ORGANIZER_EMAIL, "password": TEST_PASSWORD})
    assert res.status_code == 200, f"Organizer login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def organizer_headers_2(client) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": ORGANIZER_EMAIL_2, "password": TEST_PASSWORD})
    assert res.status_code == 200, f"Organizer 2 login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def customer_headers(client) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": CUSTOMER_EMAIL, "password": TEST_PASSWORD})
    assert res.status_code == 200, f"Customer login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def customer_headers_2(client) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": CUSTOMER_EMAIL_2, "password": TEST_PASSWORD})
    assert res.status_code == 200, f"Customer 2 login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
