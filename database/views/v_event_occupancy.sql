-- ============================================================================
-- EVENTHUB View: v_event_occupancy
-- Calculates capacity, sold tickets, available tickets, and percentage occupancy.
-- ============================================================================
CREATE OR REPLACE VIEW v_event_occupancy AS
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    v.name AS venue_name,
    e.event_date,
    e.seating_mode,
    coalesce(sum(tt.capacity), 0)::BIGINT AS total_ticket_capacity,
    coalesce(sum(tt.sold_count), 0)::BIGINT AS sold_tickets,
    (coalesce(sum(tt.capacity), 0) - coalesce(sum(tt.sold_count), 0))::BIGINT AS available_tickets,
    round(
        (coalesce(sum(tt.sold_count), 0)::numeric / NULLIF(sum(tt.capacity), 0) * 100), 
        2
    ) AS occupancy_percentage
FROM events e
JOIN venues v ON e.venue_id = v.id
LEFT JOIN ticket_types tt ON e.id = tt.event_id
GROUP BY e.id, e.title, v.name, e.event_date, e.seating_mode;
