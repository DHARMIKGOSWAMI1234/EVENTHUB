"""EVENTHUB Database Portal & Showcase API Tests

Verifies all read-only database metadata endpoints, allowlist validation,
security masking, query execution safety, and export file downloads.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_database_overview():
    """Verify GET /api/v1/database/overview returns correct DBMS structure."""
    response = client.get("/api/v1/database/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["engine"] == "PostgreSQL 18.6"
    assert data["database_name"] == "eventhub"
    assert data["table_count"] == 16
    assert data["view_count"] == 5
    assert data["trigger_count"] == 18
    assert data["function_count"] == 4
    assert data["trigger_function_count"] == 5
    assert data["total_records"] > 0
    assert len(data["features"]) >= 7
    assert "client_layer" in data["architecture"]


def test_database_tables_list():
    """Verify GET /api/v1/database/tables lists all 16 core relational tables."""
    response = client.get("/api/v1/database/tables")
    assert response.status_code == 200
    tables = response.json()
    assert len(tables) == 16
    table_names = [t["name"] for t in tables]
    assert "users" in table_names
    assert "events" in table_names
    assert "bookings" in table_names
    assert "tickets" in table_names
    assert "event_seats" in table_names
    assert "audit_logs" in table_names


def test_database_table_detail_and_masking():
    """Verify table detail returns columns, keys, and masks sensitive data."""
    response = client.get("/api/v1/database/tables/users")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "users"
    assert data["primary_key"] == "id"
    col_names = [c["name"] for c in data["columns"]]
    assert "id" in col_names
    assert "email" in col_names
    assert "password_hash" in col_names

    # Verify sensitive data masking in sample rows
    for row in data["sample_rows"]:
        assert row.get("password_hash") == "[PROTECTED]"
        assert "password" not in row or row["password"] == "[PROTECTED]"


def test_database_table_not_found():
    """Verify non-allowlisted table name returns 404."""
    response = client.get("/api/v1/database/tables/non_existent_table")
    assert response.status_code == 404


def test_database_relationships():
    """Verify GET /api/v1/database/relationships returns table nodes and FK edges."""
    response = client.get("/api/v1/database/relationships")
    assert response.status_code == 200
    data = response.json()
    assert len(data["tables"]) == 16
    assert len(data["relationships"]) > 0
    # Spot check booking -> user or event -> venue foreign key
    fks = [(r["from_table"], r["to_table"]) for r in data["relationships"]]
    assert ("bookings", "users") in fks
    assert ("events", "venues") in fks


def test_database_views_list_and_detail():
    """Verify GET /api/v1/database/views returns the 5 analytical views."""
    response = client.get("/api/v1/database/views")
    assert response.status_code == 200
    views = response.json()
    assert len(views) == 5
    vnames = [v["name"] for v in views]
    assert "v_event_sales_summary" in vnames
    assert "v_event_occupancy" in vnames
    assert "v_organizer_revenue" in vnames

    # Test single view detail
    v_resp = client.get("/api/v1/database/views/v_event_sales_summary")
    assert v_resp.status_code == 200
    v_data = v_resp.json()
    assert v_data["name"] == "v_event_sales_summary"
    assert "CREATE OR REPLACE VIEW" in v_data["definition_sql"]


def test_database_view_not_found():
    """Verify non-allowlisted view returns 404."""
    response = client.get("/api/v1/database/views/fake_view")
    assert response.status_code == 404


def test_database_functions():
    """Verify GET /api/v1/database/functions returns business and trigger functions."""
    response = client.get("/api/v1/database/functions")
    assert response.status_code == 200
    funcs = response.json()
    fnames = [f["name"] for f in funcs]
    assert "calculate_booking_total" in fnames
    assert "get_available_ticket_count" in fnames
    assert "release_expired_holds" in fnames
    assert "audit_booking_change" in fnames
    assert "validate_event_seat_state" in fnames


def test_database_triggers():
    """Verify GET /api/v1/database/triggers returns the 18 active database triggers."""
    response = client.get("/api/v1/database/triggers")
    assert response.status_code == 200
    triggers = response.json()
    assert len(triggers) == 18
    tables = {t["table"] for t in triggers}
    assert "bookings" in tables
    assert "users" in tables
    assert "event_seats" in tables
    assert "tickets" in tables


def test_database_indexes():
    """Verify GET /api/v1/database/indexes returns B-tree index summaries."""
    response = client.get("/api/v1/database/indexes")
    assert response.status_code == 200
    indexes = response.json()
    assert len(indexes) > 16
    for idx in indexes:
        assert idx["index_type"] == "btree"
        assert len(idx["columns"]) > 0


def test_database_statistics():
    """Verify GET /api/v1/database/statistics returns storage distributions."""
    response = client.get("/api/v1/database/statistics")
    assert response.status_code == 200
    stats = response.json()
    assert "PostgreSQL" in stats["engine_version"]
    assert stats["database_size_bytes"] > 0
    assert len(stats["table_sizes"]) == 16
    assert stats["total_records"] > 0


def test_database_queries_catalog_and_execution():
    """Verify GET /api/v1/database/queries lists cards and executes allowlisted queries safely."""
    response = client.get("/api/v1/database/queries")
    assert response.status_code == 200
    queries = response.json()
    assert len(queries) >= 15
    keys = [q["key"] for q in queries]
    assert "basic_join" in keys
    assert "group_by_category" in keys
    assert "window_dense_rank" in keys

    # Execute an allowlisted query
    exec_resp = client.get("/api/v1/database/queries/basic_join")
    assert exec_resp.status_code == 200
    res_data = exec_resp.json()
    assert res_data["key"] == "basic_join"
    assert res_data["execution_time_ms"] is not None
    assert len(res_data["columns"]) > 0
    assert len(res_data["sample_rows"]) > 0


def test_database_query_not_found():
    """Verify non-allowlisted query key returns 404."""
    response = client.get("/api/v1/database/queries/arbitrary_injection_attempt")
    assert response.status_code == 404


def test_database_exports_list_and_download():
    """Verify exports endpoint lists files and downloads allowlisted archives."""
    response = client.get("/api/v1/database/exports")
    assert response.status_code == 200
    exports = response.json()
    assert len(exports) >= 2
    fnames = [e["filename"] for e in exports]
    assert "eventhub_demo.sql" in fnames
    assert "eventhub_csv_dataset.zip" in fnames

    # Test download of SQL dump
    dl_resp = client.get("/api/v1/database/exports/download/eventhub_demo.sql")
    assert dl_resp.status_code == 200
    assert len(dl_resp.content) > 1000

    # Test path traversal prevention
    bad_dl = client.get("/api/v1/database/exports/download/../../secret.txt")
    assert bad_dl.status_code == 404
