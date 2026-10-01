-- ============================================================================
-- EVENTHUB Trigger: audit_booking_change
-- Automatically records booking state transitions into the audit_logs table.
-- Captures INSERT, UPDATE, and DELETE operations with JSONB payload snapshots.
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_action VARCHAR(100);
    v_entity_id BIGINT;
    v_user_id BIGINT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'BOOKING_CREATED';
        v_entity_id := NEW.id;
        v_user_id := NEW.user_id;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status <> NEW.status THEN
            v_action := 'BOOKING_STATUS_' || NEW.status;
        ELSE
            v_action := 'BOOKING_UPDATED';
        END IF;
        v_entity_id := NEW.id;
        v_user_id := NEW.user_id;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'BOOKING_DELETED';
        v_entity_id := OLD.id;
        v_user_id := OLD.user_id;
        v_old_data := to_jsonb(OLD);
    END IF;

    -- Insert immutable audit log record
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        v_user_id,
        v_action,
        'bookings',
        v_entity_id,
        v_old_data,
        v_new_data,
        CURRENT_TIMESTAMP
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_booking_change ON bookings;
CREATE TRIGGER trg_audit_booking_change
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION audit_booking_change();
