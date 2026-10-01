-- ============================================================================
-- EVENTHUB Trigger: update_ticket_type_sold_count
-- Synchronizes ticket_types.sold_count with active/used ticket allocations.
--
-- Counting Rules:
-- 1. Status 'ACTIVE' or 'USED' represents an active issued ticket (+1 to sold_count).
-- 2. Status 'CANCELLED' or 'REFUNDED' returns inventory to available pool (-1 from sold_count).
-- 3. Avoids recursive loops by triggering only on table `tickets` to update `ticket_types`.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ticket_type_sold_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('ACTIVE', 'USED') THEN
            UPDATE ticket_types
            SET sold_count = least(capacity, sold_count + 1)
            WHERE id = NEW.ticket_type_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Case A: Ticket type unchanged, status changed
        IF OLD.ticket_type_id = NEW.ticket_type_id THEN
            IF OLD.status IN ('ACTIVE', 'USED') AND NEW.status IN ('CANCELLED', 'REFUNDED') THEN
                UPDATE ticket_types
                SET sold_count = greatest(0, sold_count - 1)
                WHERE id = NEW.ticket_type_id;
            ELSIF OLD.status IN ('CANCELLED', 'REFUNDED') AND NEW.status IN ('ACTIVE', 'USED') THEN
                UPDATE ticket_types
                SET sold_count = least(capacity, sold_count + 1)
                WHERE id = NEW.ticket_type_id;
            END IF;
        ELSE
            -- Case B: Ticket transferred to different ticket_type_id
            IF OLD.status IN ('ACTIVE', 'USED') THEN
                UPDATE ticket_types
                SET sold_count = greatest(0, sold_count - 1)
                WHERE id = OLD.ticket_type_id;
            END IF;
            IF NEW.status IN ('ACTIVE', 'USED') THEN
                UPDATE ticket_types
                SET sold_count = least(capacity, sold_count + 1)
                WHERE id = NEW.ticket_type_id;
            END IF;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('ACTIVE', 'USED') THEN
            UPDATE ticket_types
            SET sold_count = greatest(0, sold_count - 1)
            WHERE id = OLD.ticket_type_id;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_ticket_type_sold_count ON tickets;
CREATE TRIGGER trg_update_ticket_type_sold_count
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_type_sold_count();
