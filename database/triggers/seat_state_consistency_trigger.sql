-- ============================================================================
-- EVENTHUB Trigger: validate_event_seat_state
-- Enforces integrity of event seat state transitions:
-- AVAILABLE: must not have hold fields
-- HELD: must specify held_by_booking_id and hold_expires_at
-- BOOKED: hold fields must be cleared; cannot transition directly from BOOKED to HELD
-- BLOCKED: must not have active hold
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_event_seat_state()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'AVAILABLE' THEN
        -- Normalize hold pointers when seat is made available
        NEW.held_by_booking_id := NULL;
        NEW.hold_expires_at := NULL;

    ELSIF NEW.status = 'HELD' THEN
        IF TG_OP = 'UPDATE' AND OLD.status = 'BOOKED' THEN
            RAISE EXCEPTION 'Cannot transition already BOOKED seat to HELD (Seat ID %)', NEW.id;
        END IF;

        -- If held_by_booking_id is missing or cleared by FK ON DELETE SET NULL, reset to AVAILABLE
        IF NEW.held_by_booking_id IS NULL THEN
            NEW.status := 'AVAILABLE';
            NEW.hold_expires_at := NULL;
        ELSIF NEW.hold_expires_at IS NULL THEN
            RAISE EXCEPTION 'HELD seat must specify hold_expires_at (Seat ID %)', NEW.id;
        END IF;

    ELSIF NEW.status = 'BOOKED' THEN
        -- Clear temporary hold pointers upon successful booking
        NEW.hold_expires_at := NULL;
        NEW.held_by_booking_id := NULL;

    ELSIF NEW.status = 'BLOCKED' THEN
        NEW.held_by_booking_id := NULL;
        NEW.hold_expires_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_event_seat_state ON event_seats;
CREATE TRIGGER trg_validate_event_seat_state
BEFORE INSERT OR UPDATE ON event_seats
FOR EACH ROW
EXECUTE FUNCTION validate_event_seat_state();
