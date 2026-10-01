-- ============================================================================
-- EVENTHUB DBMS Query Showcase: advanced_dbms_queries.sql
-- Demonstrates 15 core DBMS SQL features running on the real EVENTHUB database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. JOIN: Basic 2-table join relating tickets to their ticket types
-- ----------------------------------------------------------------------------
SELECT 
    t.ticket_code,
    t.status AS ticket_status,
    tt.name AS tier_name,
    tt.price
FROM tickets t
JOIN ticket_types tt ON t.ticket_type_id = tt.id
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 2. INNER JOIN: Multi-table inner join relating bookings, users, and events
-- ----------------------------------------------------------------------------
SELECT 
    b.booking_reference,
    u.full_name AS customer_name,
    u.email AS customer_email,
    e.title AS event_title,
    b.total_amount
FROM bookings b
INNER JOIN users u ON b.user_id = u.id
INNER JOIN events e ON b.event_id = e.id
WHERE b.status = 'CONFIRMED'
ORDER BY b.total_amount DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 3. LEFT JOIN: Venues with their events (retaining venues without upcoming events)
-- ----------------------------------------------------------------------------
SELECT 
    v.name AS venue_name,
    v.city,
    count(e.id) AS event_count
FROM venues v
LEFT JOIN events e ON v.id = e.venue_id
GROUP BY v.id, v.name, v.city
ORDER BY event_count DESC;

-- ----------------------------------------------------------------------------
-- 4. GROUP BY: Aggregate total tickets and revenue by category
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS category_name,
    count(DISTINCT e.id) AS total_events,
    count(DISTINCT b.id) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed_bookings,
    coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS category_revenue
FROM categories c
JOIN events e ON c.id = e.category_id
LEFT JOIN bookings b ON e.id = b.event_id
GROUP BY c.name
ORDER BY category_revenue DESC;

-- ----------------------------------------------------------------------------
-- 5. HAVING: Categories with at least 3 confirmed bookings
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS category_name,
    count(b.id) AS confirmed_booking_count,
    sum(b.total_amount)::NUMERIC(12, 2) AS revenue
FROM categories c
JOIN events e ON c.id = e.category_id
JOIN bookings b ON e.id = b.event_id
WHERE b.status = 'CONFIRMED'
GROUP BY c.name
HAVING count(b.id) >= 3
ORDER BY revenue DESC;

-- ----------------------------------------------------------------------------
-- 6. Subquery (Scalar / Filter): Events whose price is above overall average price
-- ----------------------------------------------------------------------------
SELECT 
    e.title,
    tt.name AS tier_name,
    tt.price
FROM ticket_types tt
JOIN events e ON tt.event_id = e.id
WHERE tt.price > (SELECT avg(price) FROM ticket_types)
ORDER BY tt.price DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 7. Correlated Subquery: Find bookings that exceed the user's average booking spend
-- ----------------------------------------------------------------------------
SELECT 
    b.id,
    b.booking_reference,
    b.user_id,
    b.total_amount
FROM bookings b
WHERE b.status = 'CONFIRMED'
  AND b.total_amount > (
      SELECT avg(b2.total_amount)
      FROM bookings b2
      WHERE b2.user_id = b.user_id
        AND b2.status = 'CONFIRMED'
  )
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 8. CTE (Common Table Expression): Top 3 grossing organizers with ranking
-- ----------------------------------------------------------------------------
WITH organizer_stats AS (
    SELECT 
        o.id,
        o.organization_name,
        count(DISTINCT e.id) AS total_events,
        coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS gross_revenue
    FROM organizers o
    JOIN events e ON o.id = e.organizer_id
    LEFT JOIN bookings b ON e.id = b.event_id
    GROUP BY o.id, o.organization_name
)
SELECT 
    organization_name,
    total_events,
    gross_revenue
FROM organizer_stats
ORDER BY gross_revenue DESC
LIMIT 3;

-- ----------------------------------------------------------------------------
-- 9. Window Function: Dense rank of events by gross revenue within category
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS category_name,
    e.title AS event_title,
    coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS revenue,
    DENSE_RANK() OVER (
        PARTITION BY c.name 
        ORDER BY coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'CONFIRMED'), 0.00) DESC
    ) AS category_rank
FROM events e
JOIN categories c ON e.category_id = c.id
LEFT JOIN bookings b ON e.id = b.event_id
GROUP BY c.name, e.id, e.title
ORDER BY category_name, category_rank
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 10. CASE Expression: Categorize booking size into Volume Tiers
-- ----------------------------------------------------------------------------
SELECT 
    booking_reference,
    total_amount,
    CASE 
        WHEN total_amount >= 5000.00 THEN 'PREMIUM_TIER'
        WHEN total_amount >= 2000.00 THEN 'STANDARD_TIER'
        ELSE 'ECONOMY_TIER'
    END AS spend_category
FROM bookings
WHERE status = 'CONFIRMED'
ORDER BY total_amount DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 11. Aggregate Functions: Aggregate booking statistics across the platform
-- ----------------------------------------------------------------------------
SELECT 
    count(*) AS total_bookings,
    sum(total_amount)::NUMERIC(12, 2) AS aggregate_gross_volume,
    avg(total_amount)::NUMERIC(12, 2) AS avg_booking_value,
    min(total_amount)::NUMERIC(12, 2) AS min_booking_value,
    max(total_amount)::NUMERIC(12, 2) AS max_booking_value,
    round(stddev(total_amount), 2)::NUMERIC(12, 2) AS stddev_booking_value
FROM bookings
WHERE status = 'CONFIRMED';

-- ----------------------------------------------------------------------------
-- 12. View Usage: Query the v_event_sales_summary view
-- ----------------------------------------------------------------------------
SELECT 
    event_id,
    event_title,
    organization_name,
    confirmed_bookings,
    tickets_sold,
    gross_revenue
FROM v_event_sales_summary
WHERE gross_revenue > 10000.00
ORDER BY gross_revenue DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 13. Function Usage: Query get_available_ticket_count and get_event_revenue
-- ----------------------------------------------------------------------------
SELECT 
    e.id AS event_id,
    e.title,
    get_available_ticket_count(e.id) AS available_tickets,
    get_event_revenue(e.id) AS confirmed_revenue
FROM events e
WHERE e.status = 'PUBLISHED'
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 14. Transaction Example: Demonstrate explicit BEGIN ... COMMIT block
-- ----------------------------------------------------------------------------
BEGIN;
SELECT count(*) AS active_bookings_before FROM bookings WHERE status = 'CONFIRMED';
-- Transaction reads are protected within the transaction scope
COMMIT;

-- ----------------------------------------------------------------------------
-- 15. Row Locking Example: Demonstrate SELECT ... FOR UPDATE row-level lock
-- ----------------------------------------------------------------------------
BEGIN;
SELECT id, event_id, status
FROM event_seats
WHERE event_id = 2 AND status = 'AVAILABLE'
LIMIT 1
FOR UPDATE;
-- Exclusive lock held on selected event_seat row until transaction end
COMMIT;
