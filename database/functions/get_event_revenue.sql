-- ============================================================================
-- EVENTHUB Function: get_event_revenue
-- Calculates aggregate revenue from confirmed bookings for a specific event.
-- ============================================================================
CREATE OR REPLACE FUNCTION get_event_revenue(
    p_event_id BIGINT
)
RETURNS NUMERIC(12, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_revenue NUMERIC(12, 2) := 0.00;
BEGIN
    SELECT coalesce(sum(total_amount), 0.00)::NUMERIC(12, 2)
    INTO v_revenue
    FROM bookings
    WHERE event_id = p_event_id
      AND status = 'CONFIRMED';

    RETURN coalesce(v_revenue, 0.00);
END;
$$;
