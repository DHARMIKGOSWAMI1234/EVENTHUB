-- ============================================================================
-- EVENTHUB View: v_event_rating_summary
-- Summarizes customer review counts and rating statistics per event.
-- ============================================================================
CREATE OR REPLACE VIEW v_event_rating_summary AS
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    c.name AS category_name,
    count(r.id)::BIGINT AS review_count,
    round(coalesce(avg(r.rating), 0.00), 2)::NUMERIC(3, 2) AS average_rating,
    coalesce(min(r.rating), 0)::INTEGER AS minimum_rating,
    coalesce(max(r.rating), 0)::INTEGER AS maximum_rating
FROM events e
JOIN categories c ON e.category_id = c.id
LEFT JOIN reviews r ON e.id = r.event_id
GROUP BY e.id, e.title, c.name;
