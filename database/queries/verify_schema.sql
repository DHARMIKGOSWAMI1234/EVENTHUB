-- ============================================================================
-- EVENTHUB — Database Schema Verification Script
-- Queries PostgreSQL system catalogs to verify schema integrity.
-- Phase: 2 (Database Foundation)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Database & Version Information
-- ----------------------------------------------------------------------------
SELECT 
    current_database() AS database_name,
    current_user AS connected_user,
    version() AS postgresql_version;

-- ----------------------------------------------------------------------------
-- 2. Verify All Core Tables Exist in 'public' Schema
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name != 'alembic_version'
ORDER BY table_name;

-- Count check (must equal 16)
SELECT 
    count(*) AS total_core_tables,
    CASE WHEN count(*) = 16 THEN 'PASS: Exactly 16 core tables exist'
         ELSE 'FAIL: Unexpected table count'
    END AS verification_status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name != 'alembic_version';

-- ----------------------------------------------------------------------------
-- 3. Verify Primary Keys
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name != 'alembic_version'
ORDER BY tc.table_name;

-- ----------------------------------------------------------------------------
-- 4. Verify Foreign Key Constraints and Delete Actions
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    rc.delete_rule AS on_delete_action,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
    AND rc.unique_constraint_schema = ccu.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ----------------------------------------------------------------------------
-- 5. Verify Unique Constraints
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS unique_columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ----------------------------------------------------------------------------
-- 6. Verify Check Constraints
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.table_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.constraint_name NOT LIKE '%_not_null'
ORDER BY tc.table_name, tc.constraint_name;

-- ----------------------------------------------------------------------------
-- 7. Verify All Indexes
-- ----------------------------------------------------------------------------
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename != 'alembic_version'
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- 8. Verify Table Columns and Data Types
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    ordinal_position,
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name != 'alembic_version'
ORDER BY table_name, ordinal_position;

-- ----------------------------------------------------------------------------
-- 9. Verify Current Row Counts (Naturally 0 in Phase 2)
-- ----------------------------------------------------------------------------
SELECT 'users' AS table_name, count(*) AS row_count FROM users
UNION ALL SELECT 'organizers', count(*) FROM organizers
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'venues', count(*) FROM venues
UNION ALL SELECT 'venue_seats', count(*) FROM venue_seats
UNION ALL SELECT 'events', count(*) FROM events
UNION ALL SELECT 'ticket_types', count(*) FROM ticket_types
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'event_seats', count(*) FROM event_seats
UNION ALL SELECT 'booking_items', count(*) FROM booking_items
UNION ALL SELECT 'payments', count(*) FROM payments
UNION ALL SELECT 'tickets', count(*) FROM tickets
UNION ALL SELECT 'reviews', count(*) FROM reviews
UNION ALL SELECT 'notifications', count(*) FROM notifications
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'favorites', count(*) FROM favorites
ORDER BY table_name;
