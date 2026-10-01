-- ============================================================================
-- EVENTHUB View: v_monthly_booking_summary
-- Aggregates monthly booking volume, confirmation rates, and revenue.
-- ============================================================================
CREATE OR REPLACE VIEW v_monthly_booking_summary AS
SELECT 
    EXTRACT(YEAR FROM created_at)::INTEGER AS booking_year,
    EXTRACT(MONTH FROM created_at)::INTEGER AS booking_month,
    to_char(created_at, 'YYYY-MM') AS month_label,
    count(*)::BIGINT AS total_bookings,
    count(*) FILTER (WHERE status = 'CONFIRMED')::BIGINT AS confirmed_bookings,
    count(*) FILTER (WHERE status = 'CANCELLED')::BIGINT AS cancelled_bookings,
    count(*) FILTER (WHERE status = 'REFUNDED')::BIGINT AS refunded_bookings,
    coalesce(sum(total_amount) FILTER (WHERE status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS total_revenue
FROM bookings
GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), to_char(created_at, 'YYYY-MM')
ORDER BY booking_year, booking_month;
