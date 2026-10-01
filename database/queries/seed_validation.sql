-- ============================================================================
-- EVENTHUB — Phase 3 Demo Dataset Analytics & Validation Queries
-- Demonstrates SQL JOINs, GROUP BY, aggregations, window functions, and analytics.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Total Users by Role
-- ----------------------------------------------------------------------------
SELECT 
    role,
    count(*) AS total_users,
    count(*) FILTER (WHERE is_active) AS active_users
FROM users
GROUP BY role
ORDER BY total_users DESC;

-- ----------------------------------------------------------------------------
-- 2. Events by Category
-- ----------------------------------------------------------------------------
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    count(e.id) AS event_count
FROM categories c
LEFT JOIN events e ON c.id = e.category_id
GROUP BY c.id, c.name
ORDER BY event_count DESC, c.name;

-- ----------------------------------------------------------------------------
-- 3. Events by Organizer
-- ----------------------------------------------------------------------------
SELECT 
    o.id AS organizer_id,
    o.organization_name,
    count(e.id) AS total_events,
    count(e.id) FILTER (WHERE e.status = 'PUBLISHED') AS published_events,
    count(e.id) FILTER (WHERE e.status = 'COMPLETED') AS completed_events,
    count(e.id) FILTER (WHERE e.status = 'DRAFT') AS draft_events,
    count(e.id) FILTER (WHERE e.status = 'CANCELLED') AS cancelled_events
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.organization_name
ORDER BY total_events DESC, o.organization_name;

-- ----------------------------------------------------------------------------
-- 4. Events by Status
-- ----------------------------------------------------------------------------
SELECT 
    status,
    count(*) AS event_count,
    round(count(*)::numeric / sum(count(*)) OVER () * 100, 2) AS percentage
FROM events
GROUP BY status
ORDER BY event_count DESC;

-- ----------------------------------------------------------------------------
-- 5. Bookings by Status
-- ----------------------------------------------------------------------------
SELECT 
    status AS booking_status,
    count(*) AS booking_count,
    coalesce(sum(subtotal), 0.00) AS total_subtotal,
    coalesce(sum(discount_amount), 0.00) AS total_discounts,
    coalesce(sum(tax_amount), 0.00) AS total_taxes,
    coalesce(sum(total_amount), 0.00) AS aggregate_booking_value
FROM bookings
GROUP BY status
ORDER BY booking_count DESC;

-- ----------------------------------------------------------------------------
-- 6. Payment Status Distribution
-- ----------------------------------------------------------------------------
SELECT 
    payment_method,
    status AS payment_status,
    count(*) AS transaction_count,
    sum(amount) AS total_amount_processed
FROM payments
GROUP BY payment_method, status
ORDER BY payment_method, transaction_count DESC;

-- ----------------------------------------------------------------------------
-- 7. Revenue by Event
-- ----------------------------------------------------------------------------
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    e.status AS event_status,
    count(b.id) AS total_bookings,
    coalesce(sum(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0.00) AS confirmed_revenue
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id
LEFT JOIN payments p ON b.id = p.booking_id
GROUP BY e.id, e.title, e.status
ORDER BY confirmed_revenue DESC, total_bookings DESC
LIMIT 15;

-- ----------------------------------------------------------------------------
-- 8. Revenue by Organizer
-- ----------------------------------------------------------------------------
SELECT 
    o.id AS organizer_id,
    o.organization_name,
    count(DISTINCT e.id) AS hosted_events,
    count(DISTINCT b.id) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed_bookings,
    coalesce(sum(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0.00) AS gross_revenue
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
LEFT JOIN bookings b ON e.id = b.event_id
LEFT JOIN payments p ON b.id = p.booking_id
GROUP BY o.id, o.organization_name
ORDER BY gross_revenue DESC;

-- ----------------------------------------------------------------------------
-- 9. Average Event Rating
-- ----------------------------------------------------------------------------
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    count(r.id) AS total_reviews,
    round(avg(r.rating), 2) AS average_rating,
    min(r.rating) AS lowest_rating,
    max(r.rating) AS highest_rating
FROM events e
JOIN reviews r ON e.id = r.event_id
GROUP BY e.id, e.title
ORDER BY average_rating DESC, total_reviews DESC;

-- ----------------------------------------------------------------------------
-- 10. Event Occupancy (Capacity vs Sold Tickets)
-- ----------------------------------------------------------------------------
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    e.seating_mode,
    sum(tt.capacity) AS total_ticket_capacity,
    sum(tt.sold_count) AS total_tickets_sold,
    round((sum(tt.sold_count)::numeric / nullif(sum(tt.capacity), 0) * 100), 2) AS occupancy_percentage
FROM events e
JOIN ticket_types tt ON e.id = tt.event_id
GROUP BY e.id, e.title, e.seating_mode
ORDER BY occupancy_percentage DESC NULLS LAST
LIMIT 15;

-- ----------------------------------------------------------------------------
-- 11. Top Customers by Booking Count
-- ----------------------------------------------------------------------------
SELECT 
    u.id AS user_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    count(b.id) AS total_bookings,
    count(b.id) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed_bookings,
    coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'CONFIRMED'), 0.00) AS total_spend
FROM users u
JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.full_name, u.email
ORDER BY total_bookings DESC, total_spend DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 12. Most Favorited Events
-- ----------------------------------------------------------------------------
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    c.name AS category_name,
    v.city AS venue_city,
    count(f.id) AS favorite_count
FROM events e
JOIN categories c ON e.category_id = c.id
JOIN venues v ON e.venue_id = v.id
LEFT JOIN favorites f ON e.id = f.event_id
GROUP BY e.id, e.title, c.name, v.city
ORDER BY favorite_count DESC, e.title
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 13. Ticket Status Distribution
-- ----------------------------------------------------------------------------
SELECT 
    status AS ticket_status,
    count(*) AS ticket_count,
    round(count(*)::numeric / sum(count(*)) OVER () * 100, 2) AS percentage
FROM tickets
GROUP BY status
ORDER BY ticket_count DESC;

-- ----------------------------------------------------------------------------
-- 14. Monthly Booking Counts
-- ----------------------------------------------------------------------------
SELECT 
    to_char(created_at, 'YYYY-MM') AS booking_month,
    count(*) AS total_bookings,
    count(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed_bookings,
    sum(total_amount) AS total_gross_value
FROM bookings
GROUP BY to_char(created_at, 'YYYY-MM')
ORDER BY booking_month;

-- ----------------------------------------------------------------------------
-- 15. Average Ticket Price by Category
-- ----------------------------------------------------------------------------
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    count(DISTINCT e.id) AS events_in_category,
    count(tt.id) AS ticket_tiers_count,
    round(avg(tt.price), 2) AS average_ticket_price,
    min(tt.price) AS min_ticket_price,
    max(tt.price) AS max_ticket_price
FROM categories c
JOIN events e ON c.id = e.category_id
JOIN ticket_types tt ON e.id = tt.event_id
GROUP BY c.id, c.name
ORDER BY average_ticket_price DESC;
