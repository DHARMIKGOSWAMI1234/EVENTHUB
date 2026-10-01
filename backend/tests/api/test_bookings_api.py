"""EVENTHUB Booking API Tests

Validates:
1. valid booking (reserved seating)
2. invalid event
3. invalid ticket type
4. invalid seat
5. wrong event seat
6. unavailable seat (409 Conflict)
7. general admission quantity
8. insufficient inventory
9. customer can view own booking
10. customer cannot view another customer's booking (403 Forbidden)
11. cancellation (releasing reserved seat)
12. transaction rollback
13. ticket creation
14. simulated payment
15. booking total correctness
"""

import pytest
from decimal import Decimal
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models import Booking, EventSeat, Ticket, Payment


def test_1_valid_reserved_booking(client, customer_headers, db_session):
    """Test successful booking of a reserved seat."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    assert seat is not None
    assert tt_id is not None

    payload = {
        "event_id": 8,
        "ticket_type_id": tt_id,
        "event_seat_id": seat,
        "payment_method": "UPI",
        "discount_amount": "0.00",
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "CONFIRMED"
    assert data["event_id"] == 8
    assert "booking_reference" in data
    booking_id = data["id"]

    # Verify seat transitioned to BOOKED
    with SessionLocal() as db:
        seat_status = db.execute(
            text("SELECT status FROM event_seats WHERE id = :sid;"), {"sid": seat}
        ).scalar()
        assert seat_status == "BOOKED"

        # Cleanup booking and reset seat
        db.execute(text("DELETE FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM payments WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM booking_items WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM bookings WHERE id = :bid;"), {"bid": booking_id})
        db.execute(text("UPDATE event_seats SET status = 'AVAILABLE' WHERE id = :sid;"), {"sid": seat})
        db.commit()


def test_2_invalid_event_booking(client, customer_headers):
    """Test rejection when booking a non-existent event."""
    payload = {
        "event_id": 999999,
        "ticket_type_id": 1,
        "event_seat_id": 1,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code == 404


def test_3_invalid_ticket_type_booking(client, customer_headers):
    """Test rejection when specifying a ticket type that does not belong to the event."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()

    payload = {
        "event_id": 8,
        "ticket_type_id": 999999,
        "event_seat_id": seat,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code in (400, 404)



def test_4_invalid_seat_booking(client, customer_headers):
    """Test rejection when specifying a non-existent seat ID."""
    with SessionLocal() as db:
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    payload = {
        "event_id": 8,
        "ticket_type_id": tt_id,
        "event_seat_id": 9999999,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code in (400, 404, 409)


def test_5_wrong_event_seat(client, customer_headers):
    """Test rejection when seat belongs to a different event."""
    with SessionLocal() as db:
        # Find a seat belonging to event 9 instead of event 8
        other_seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 9 LIMIT 1;")
        ).scalar()
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    payload = {
        "event_id": 8,
        "ticket_type_id": tt_id,
        "event_seat_id": other_seat,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code in (400, 409)


def test_6_unavailable_seat_409_conflict(client, customer_headers):
    """Verify booking an already BOOKED seat returns 409 Conflict with exact error message."""
    with SessionLocal() as db:
        booked_seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'BOOKED' LIMIT 1;")
        ).scalar()
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    payload = {
        "event_id": 8,
        "ticket_type_id": tt_id,
        "event_seat_id": booked_seat,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "The selected seat is no longer available."


def test_7_general_admission_booking(client, customer_headers, db_session):
    """Test booking general admission tickets."""
    with SessionLocal() as db:
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 11 AND is_active = TRUE AND capacity > sold_count LIMIT 1;")
        ).scalar()

    assert tt_id is not None
    payload = {
        "event_id": 11,
        "ticket_type_id": tt_id,
        "quantity": 2,
        "payment_method": "CARD",
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "CONFIRMED"
    booking_id = data["id"]

    # Verify tickets were generated
    with SessionLocal() as db:
        ticket_count = db.execute(
            text("SELECT count(*) FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id}
        ).scalar()
        assert ticket_count == 2

        # Cleanup
        db.execute(text("DELETE FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM payments WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM booking_items WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM bookings WHERE id = :bid;"), {"bid": booking_id})
        db.commit()


def test_8_insufficient_inventory(client, customer_headers):
    """Test rejection when requested quantity exceeds available capacity."""
    with SessionLocal() as db:
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 11 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    # Request payload with excessive quantity
    payload = {
        "event_id": 11,
        "ticket_type_id": tt_id,
        "quantity": 99999,
    }
    response = client.post("/api/v1/bookings", json=payload, headers=customer_headers)
    # 422 (pydantic ge/le constraint) or 400 (service capacity check)
    assert response.status_code in (400, 422)


def test_9_customer_can_view_own_booking(client, customer_headers):
    """Verify customer can view their own booking history."""
    response = client.get("/api/v1/bookings", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_10_customer_cannot_view_another_customer_booking(client, customer_headers_2):
    """Verify Customer 2 cannot access Customer 1's private booking (403 Forbidden)."""
    # Booking #1 belongs to Customer 1
    with SessionLocal() as db:
        booking = db.execute(text("SELECT id, user_id FROM bookings ORDER BY id ASC LIMIT 1;")).one()
        booking_id = booking[0]
        owner_id = booking[1]

    # Verify Customer 2 has a different ID
    response = client.get("/api/v1/auth/me", headers=customer_headers_2)
    caller_id = response.json()["id"]
    assert caller_id != owner_id

    # Attempt access to Customer 1's booking
    res = client.get(f"/api/v1/bookings/{booking_id}", headers=customer_headers_2)
    assert res.status_code == 403


def test_11_cancellation_releases_seat(client, customer_headers, db_session):
    """Test booking cancellation releases seat back to AVAILABLE status."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    # Create booking
    create_res = client.post(
        "/api/v1/bookings",
        json={"event_id": 8, "ticket_type_id": tt_id, "event_seat_id": seat},
        headers=customer_headers,
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["id"]

    # Cancel booking
    cancel_res = client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=customer_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Verify seat is AVAILABLE again
    with SessionLocal() as db:
        seat_status = db.execute(
            text("SELECT status FROM event_seats WHERE id = :sid;"), {"sid": seat}
        ).scalar()
        assert seat_status == "AVAILABLE"

        # Cleanup
        db.execute(text("DELETE FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM payments WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM booking_items WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM bookings WHERE id = :bid;"), {"bid": booking_id})
        db.commit()


def test_12_transaction_rollback_preserves_state(client, customer_headers):
    """Verify invalid booking parameters do not leave orphan records or mutate seat state."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()

    # Pass invalid ticket_type_id
    payload = {
        "event_id": 8,
        "ticket_type_id": -999,
        "event_seat_id": seat,
    }
    client.post("/api/v1/bookings", json=payload, headers=customer_headers)

    # Verify seat state was NOT modified
    with SessionLocal() as db:
        status_val = db.execute(
            text("SELECT status FROM event_seats WHERE id = :sid;"), {"sid": seat}
        ).scalar()
        assert status_val == "AVAILABLE"


def test_13_ticket_creation_and_qr_tokens(client, customer_headers, db_session):
    """Verify booking creates valid tickets with secure qr_tokens."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    create_res = client.post(
        "/api/v1/bookings",
        json={"event_id": 8, "ticket_type_id": tt_id, "event_seat_id": seat},
        headers=customer_headers,
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["id"]

    # Inspect tickets
    with SessionLocal() as db:
        tickets = db.query(Ticket).filter(Ticket.booking_id == booking_id).all()
        assert len(tickets) == 1
        t = tickets[0]
        assert "TKT-" in t.ticket_code
        assert len(t.qr_token) >= 20

        assert "password" not in t.qr_token.lower()

        # Cleanup
        db.execute(text("DELETE FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM payments WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM booking_items WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM bookings WHERE id = :bid;"), {"bid": booking_id})
        db.execute(text("UPDATE event_seats SET status = 'AVAILABLE' WHERE id = :sid;"), {"sid": seat})
        db.commit()


def test_14_simulated_payment_callback(client, customer_headers, db_session):
    """Test payment simulation endpoint transitions booking and payment states."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()
        tt_id = db.execute(
            text("SELECT id FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).scalar()

    res = client.post(
        "/api/v1/bookings",
        json={"event_id": 8, "ticket_type_id": tt_id, "event_seat_id": seat},
        headers=customer_headers,
    )
    booking_id = res.json()["id"]

    # Simulate payment SUCCESS
    sim_res = client.post(
        f"/api/v1/bookings/{booking_id}/payment/simulate",
        json={"payment_method": "NET_BANKING", "simulate_status": "SUCCESS"},
        headers=customer_headers,
    )
    assert sim_res.status_code == 200
    pay_data = sim_res.json()
    assert pay_data["status"] == "SUCCESS"
    assert pay_data["payment_method"] == "NET_BANKING"
    assert "TXN-" in pay_data["transaction_reference"]

    # Verify payment retrieval
    get_pay = client.get(f"/api/v1/bookings/{booking_id}/payment", headers=customer_headers)
    assert get_pay.status_code == 200
    assert get_pay.json()["status"] == "SUCCESS"

    # Cleanup
    with SessionLocal() as db:
        db.execute(text("DELETE FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM payments WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM booking_items WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM bookings WHERE id = :bid;"), {"bid": booking_id})
        db.execute(text("UPDATE event_seats SET status = 'AVAILABLE' WHERE id = :sid;"), {"sid": seat})
        db.commit()


def test_15_booking_total_correctness(client, customer_headers, db_session):
    """Verify total_amount = subtotal + tax_amount - discount_amount exactly matches."""
    with SessionLocal() as db:
        seat = db.execute(
            text("SELECT id FROM event_seats WHERE event_id = 8 AND status = 'AVAILABLE' LIMIT 1;")
        ).scalar()
        tt = db.execute(
            text("SELECT id, price FROM ticket_types WHERE event_id = 8 AND is_active = TRUE LIMIT 1;")
        ).one()
        tt_id = tt[0]
        price = tt[1]

    discount = Decimal("50.00")
    res = client.post(
        "/api/v1/bookings",
        json={
            "event_id": 8,
            "ticket_type_id": tt_id,
            "event_seat_id": seat,
            "discount_amount": str(discount),
        },
        headers=customer_headers,
    )
    assert res.status_code == 201
    data = res.json()
    booking_id = data["id"]

    subtotal = Decimal(str(data["subtotal"]))
    tax = Decimal(str(data["tax_amount"]))
    disc = Decimal(str(data["discount_amount"]))
    total = Decimal(str(data["total_amount"]))

    expected_total = (subtotal - disc) + tax
    assert total == expected_total

    # Cleanup
    with SessionLocal() as db:
        db.execute(text("DELETE FROM tickets WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM payments WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM booking_items WHERE booking_id = :bid;"), {"bid": booking_id})
        db.execute(text("DELETE FROM bookings WHERE id = :bid;"), {"bid": booking_id})
        db.execute(text("UPDATE event_seats SET status = 'AVAILABLE' WHERE id = :sid;"), {"sid": seat})
        db.commit()
