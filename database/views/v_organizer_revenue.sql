-- ============================================================================
-- EVENTHUB View: v_organizer_revenue
-- Summarizes gross revenue, confirmed bookings, and average booking value per organizer.
-- ============================================================================
CREATE OR REPLACE VIEW v_organizer_revenue AS
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
    o.id AS organizer_id,
    o.organization_name,
    count(DISTINCT e.id)::BIGINT AS total_events,
    count(ba.booking_id) FILTER (WHERE ba.status = 'CONFIRMED')::BIGINT AS confirmed_bookings,
    coalesce(sum(ba.total_tickets) FILTER (WHERE ba.status = 'CONFIRMED'), 0)::BIGINT AS tickets_sold,
    coalesce(sum(ba.total_amount) FILTER (WHERE ba.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS gross_revenue,
    round(
        coalesce(sum(ba.total_amount) FILTER (WHERE ba.status = 'CONFIRMED'), 0.00) / 
        NULLIF(count(ba.booking_id) FILTER (WHERE ba.status = 'CONFIRMED'), 0), 
        2
    )::NUMERIC(12, 2) AS average_booking_value
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
LEFT JOIN booking_agg ba ON e.id = ba.event_id
GROUP BY o.id, o.organization_name;
