-- ============================================================================
-- EVENTHUB View Test Script: test_views.sql
-- Verifies query execution, row returns, and safe arithmetic across all 5 views.
-- ============================================================================

-- 1. Test v_event_sales_summary
SELECT 
    'v_event_sales_summary' AS view_name,
    count(*) AS row_count,
    sum(confirmed_bookings) AS total_confirmed_bookings,
    sum(gross_revenue) AS total_revenue
FROM v_event_sales_summary;

SELECT * FROM v_event_sales_summary LIMIT 5;

-- 2. Test v_event_occupancy (verifying no division by zero)
SELECT 
    'v_event_occupancy' AS view_name,
    count(*) AS row_count,
    avg(occupancy_percentage) AS avg_occupancy
FROM v_event_occupancy;

SELECT * FROM v_event_occupancy LIMIT 5;

-- 3. Test v_organizer_revenue
SELECT 
    'v_organizer_revenue' AS view_name,
    count(*) AS row_count,
    sum(gross_revenue) AS total_organizer_revenue
FROM v_organizer_revenue;

SELECT * FROM v_organizer_revenue LIMIT 5;

-- 4. Test v_monthly_booking_summary
SELECT 
    'v_monthly_booking_summary' AS view_name,
    count(*) AS row_count,
    sum(confirmed_bookings) AS confirmed_bookings_sum
FROM v_monthly_booking_summary;

SELECT * FROM v_monthly_booking_summary;

-- 5. Test v_event_rating_summary
SELECT 
    'v_event_rating_summary' AS view_name,
    count(*) AS row_count,
    avg(average_rating) FILTER (WHERE review_count > 0) AS avg_rated_score
FROM v_event_rating_summary;

SELECT * FROM v_event_rating_summary WHERE review_count > 0 LIMIT 5;
