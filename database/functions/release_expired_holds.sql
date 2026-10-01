-- ============================================================================
-- EVENTHUB Function: release_expired_holds
-- Releases event seats where status is HELD and hold_expires_at < NOW().
-- Safely resets status to AVAILABLE and clears hold fields.
-- Never affects BOOKED or BLOCKED seats.
-- ============================================================================
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    v_released_count INTEGER := 0;
BEGIN
    WITH released AS (
        UPDATE event_seats
        SET status = 'AVAILABLE',
            hold_expires_at = NULL,
            held_by_booking_id = NULL
        WHERE status = 'HELD'
          AND hold_expires_at IS NOT NULL
          AND hold_expires_at < CURRENT_TIMESTAMP
        RETURNING id
    )
    SELECT count(*)::INTEGER INTO v_released_count FROM released;

    RETURN v_released_count;
END;
$$;
