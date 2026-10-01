-- ============================================================================
-- EVENTHUB View: v_event_sales_summary
-- Aggregates booking volume, ticket sales, and gross revenue at the event level.
-- ============================================================================
CREATE OR REPLACE VIEW v_event_sales_summary AS
WITH booking_agg AS (
    SELECT 
        b.event_id,
        b.id AS booking_id,
        b.status,
        b.total_amount,
        coalesce(sum(bi.quantity), 0)::BIGINT AS total_tickets
    FROM bookings b
    LEFT JOIN booking_items bi ON b.id = bi.booking_id
    GROUP BY b.event_id, b.id, b.status, b.total_amount
)
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    o.organization_name,
    c.name AS category_name,
    e.status AS event_status,
    e.event_date,
    count(ba.booking_id)::BIGINT AS total_bookings,
    count(ba.booking_id) FILTER (WHERE ba.status = 'CONFIRMED')::BIGINT AS confirmed_bookings,
    count(ba.booking_id) FILTER (WHERE ba.status = 'CANCELLED')::BIGINT AS cancelled_bookings,
    count(ba.booking_id) FILTER (WHERE ba.status = 'REFUNDED')::BIGINT AS refunded_bookings,
    coalesce(sum(ba.total_tickets) FILTER (WHERE ba.status = 'CONFIRMED'), 0)::BIGINT AS tickets_sold,
    coalesce(sum(ba.total_amount) FILTER (WHERE ba.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS gross_revenue
FROM events e
JOIN organizers o ON e.organizer_id = o.id
JOIN categories c ON e.category_id = c.id
LEFT JOIN booking_agg ba ON e.id = ba.event_id
GROUP BY e.id, e.title, o.organization_name, c.name, e.status, e.event_date;
