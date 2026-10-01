-- ============================================================================
-- EVENTHUB Performance Checks & Index Validation: performance_checks.sql
-- Evaluates query plans (EXPLAIN / EXPLAIN ANALYZE) across core access paths:
-- 1. Event Search
-- 2. Event Category Filtering
-- 3. Organizer Event Lookup
-- 4. Booking Lookup
-- 5. Ticket Lookup
-- 6. Seat Availability Lookup
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Event Search: Querying published events filtered by date range
-- ----------------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT 
    e.id,
    e.title,
    e.event_date,
    e.status,
    v.name AS venue_name
FROM events e
JOIN venues v ON e.venue_id = v.id
WHERE e.status = 'PUBLISHED'
  AND e.event_date >= '2026-06-01'
ORDER BY e.event_date ASC;

-- ----------------------------------------------------------------------------
-- 2. Event Category Filtering: Lookup events belonging to a specific category
-- ----------------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT 
    e.id,
    e.title,
    e.status,
    c.name AS category_name
FROM events e
JOIN categories c ON e.category_id = c.id
WHERE e.category_id = 1
  AND e.status IN ('PUBLISHED', 'COMPLETED');

-- ----------------------------------------------------------------------------
-- 3. Organizer Event Lookup: Retrieve all events managed by an organizer
-- ----------------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT 
    e.id,
    e.title,
    e.event_date,
    e.seating_mode,
    e.status
FROM events e
WHERE e.organizer_id = 2
ORDER BY e.event_date DESC;

-- ----------------------------------------------------------------------------
-- 4. Booking Lookup: Fast single-row retrieval by booking reference
-- Uses unique btree index: bookings_booking_reference_key
-- ----------------------------------------------------------------------------
SET enable_seqscan = off;
EXPLAIN ANALYZE
SELECT 
    b.id,
    b.booking_reference,
    b.status,
    b.total_amount,
    b.created_at
FROM bookings b
WHERE b.booking_reference = 'EVH-2026-000001';
SET enable_seqscan = on;

-- ----------------------------------------------------------------------------
-- 5. Ticket Lookup: High-frequency gate/scanner lookup by ticket code
-- Uses unique btree index: tickets_ticket_code_key
-- ----------------------------------------------------------------------------
SET enable_seqscan = off;
EXPLAIN ANALYZE
SELECT 
    t.id,
    t.ticket_code,
    t.status,
    t.qr_token,
    t.booking_id
FROM tickets t
WHERE t.ticket_code = 'EVH-TKT-000001';
SET enable_seqscan = on;

-- ----------------------------------------------------------------------------
-- 6. Seat Availability Lookup: Real-time inventory availability per event
-- Uses composite btree index: uq_event_seats_event_seat (event_id, venue_seat_id)
-- ----------------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT 
    es.id AS event_seat_id,
    es.status,
    vs.seat_label,
    vs.seat_type
FROM event_seats es
JOIN venue_seats vs ON es.venue_seat_id = vs.id
WHERE es.event_id = 2
  AND es.status = 'AVAILABLE'
ORDER BY vs.seat_label;
