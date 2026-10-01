-- ============================================================================
-- EVENTHUB Function: get_available_ticket_count
-- Calculates total remaining available tickets for a specific event.
-- ============================================================================
CREATE OR REPLACE FUNCTION get_available_ticket_count(
    p_event_id BIGINT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_available_count INTEGER := 0;
BEGIN
    SELECT coalesce(sum(greatest(0, capacity - sold_count)), 0)::INTEGER
    INTO v_available_count
    FROM ticket_types
    WHERE event_id = p_event_id
      AND is_active = TRUE;

    RETURN coalesce(v_available_count, 0);
END;
$$;
