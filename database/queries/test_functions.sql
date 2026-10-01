-- ============================================================================
-- EVENTHUB Function Test Script: test_functions.sql
-- Tests all 4 custom PostgreSQL functions against the live database.
-- ============================================================================

-- 1. Test calculate_booking_total
SELECT 
    'calculate_booking_total standard' AS test_case,
    calculate_booking_total(1000.00, 100.00, 162.00) AS total,
    CASE WHEN calculate_booking_total(1000.00, 100.00, 162.00) = 1062.00 THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 
    'calculate_booking_total non-negative protection' AS test_case,
    calculate_booking_total(100.00, 500.00, 0.00) AS total,
    CASE WHEN calculate_booking_total(100.00, 500.00, 0.00) = 0.00 THEN 'PASS' ELSE 'FAIL' END AS status;

-- 2. Test get_available_ticket_count
SELECT 
    e.id AS event_id,
    e.title,
    get_available_ticket_count(e.id) AS available_tickets
FROM events e
LIMIT 5;

-- 3. Test get_event_revenue
SELECT 
    e.id AS event_id,
    e.title,
    get_event_revenue(e.id) AS confirmed_revenue
FROM events e
WHERE e.status IN ('COMPLETED', 'PUBLISHED')
ORDER BY confirmed_revenue DESC
LIMIT 5;

-- 4. Test release_expired_holds
SELECT 
    'release_expired_holds execution' AS test_case,
    release_expired_holds() AS released_count;
