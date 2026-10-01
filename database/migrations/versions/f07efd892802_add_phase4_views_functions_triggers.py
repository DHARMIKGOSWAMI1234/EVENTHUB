"""add_phase4_views_functions_triggers

Revision ID: f07efd892802
Revises: 171a3cddf5ff
Create Date: 2026-10-01 21:32:50.059840

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f07efd892802'
down_revision: Union[str, None] = '171a3cddf5ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. DATABASE FUNCTIONS
    # -------------------------------------------------------------------------
    op.execute("""
    CREATE OR REPLACE FUNCTION calculate_booking_total(
        p_subtotal NUMERIC(12, 2),
        p_discount_amount NUMERIC(12, 2) DEFAULT 0.00,
        p_tax_amount NUMERIC(12, 2) DEFAULT 0.00
    )
    RETURNS NUMERIC(12, 2)
    LANGUAGE plpgsql
    IMMUTABLE
    AS $$
    DECLARE
        v_subtotal NUMERIC(12, 2) := coalesce(p_subtotal, 0.00);
        v_discount NUMERIC(12, 2) := coalesce(p_discount_amount, 0.00);
        v_tax      NUMERIC(12, 2) := coalesce(p_tax_amount, 0.00);
        v_total    NUMERIC(12, 2);
    BEGIN
        v_total := v_subtotal - v_discount + v_tax;
        IF v_total < 0.00 THEN
            v_total := 0.00;
        END IF;
        RETURN round(v_total, 2);
    END;
    $$;
    """)

    op.execute("""
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
    """)

    op.execute("""
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
    """)

    op.execute("""
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
    """)

    # -------------------------------------------------------------------------
    # 2. TRIGGER FUNCTIONS AND TRIGGERS
    # -------------------------------------------------------------------------
    # 2a. updated_at Trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$;
    """)

    for table in ["users", "organizers", "venues", "events", "ticket_types", "bookings", "reviews"]:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};")
        op.execute(f"""
        CREATE TRIGGER trg_{table}_updated_at
        BEFORE UPDATE ON {table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        """)

    # 2b. Booking Audit Trigger
    op.execute("""
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
    """)

    op.execute("DROP TRIGGER IF EXISTS trg_audit_booking_change ON bookings;")
    op.execute("""
    CREATE TRIGGER trg_audit_booking_change
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION audit_booking_change();
    """)

    # 2c. User Audit Trigger (Zero password_hash leakage)
    op.execute("""
    CREATE OR REPLACE FUNCTION audit_user_change()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_action VARCHAR(100);
        v_entity_id BIGINT;
        v_user_id BIGINT := NULL;
        v_old_data JSONB := NULL;
        v_new_data JSONB := NULL;
    BEGIN
        IF TG_OP = 'INSERT' THEN
            v_action := 'USER_CREATED';
            v_entity_id := NEW.id;
            v_user_id := NEW.id;
            v_new_data := to_jsonb(NEW) - 'password_hash';
        ELSIF TG_OP = 'UPDATE' THEN
            v_action := 'USER_UPDATED';
            v_entity_id := NEW.id;
            v_user_id := NEW.id;
            v_old_data := to_jsonb(OLD) - 'password_hash';
            v_new_data := to_jsonb(NEW) - 'password_hash';
        ELSIF TG_OP = 'DELETE' THEN
            v_action := 'USER_DELETED';
            v_entity_id := OLD.id;
            v_user_id := NULL;
            v_old_data := to_jsonb(OLD) - 'password_hash';
        END IF;

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
            'users',
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
    """)

    op.execute("DROP TRIGGER IF EXISTS trg_audit_user_change ON users;")
    op.execute("""
    CREATE TRIGGER trg_audit_user_change
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_change();
    """)

    # 2d. Seat State Consistency Trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_event_seat_state()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF NEW.status = 'AVAILABLE' THEN
            NEW.held_by_booking_id := NULL;
            NEW.hold_expires_at := NULL;

        ELSIF NEW.status = 'HELD' THEN
            IF TG_OP = 'UPDATE' AND OLD.status = 'BOOKED' THEN
                RAISE EXCEPTION 'Cannot transition already BOOKED seat to HELD (Seat ID %)', NEW.id;
            END IF;

            IF NEW.held_by_booking_id IS NULL THEN
                NEW.status := 'AVAILABLE';
                NEW.hold_expires_at := NULL;
            ELSIF NEW.hold_expires_at IS NULL THEN
                RAISE EXCEPTION 'HELD seat must specify hold_expires_at (Seat ID %)', NEW.id;
            END IF;

        ELSIF NEW.status = 'BOOKED' THEN
            NEW.hold_expires_at := NULL;
            NEW.held_by_booking_id := NULL;

        ELSIF NEW.status = 'BLOCKED' THEN
            NEW.held_by_booking_id := NULL;
            NEW.hold_expires_at := NULL;
        END IF;

        RETURN NEW;
    END;
    $$;
    """)

    op.execute("DROP TRIGGER IF EXISTS trg_validate_event_seat_state ON event_seats;")
    op.execute("""
    CREATE TRIGGER trg_validate_event_seat_state
    BEFORE INSERT OR UPDATE ON event_seats
    FOR EACH ROW
    EXECUTE FUNCTION validate_event_seat_state();
    """)

    # 2e. Ticket Count Consistency Trigger
    op.execute("""
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
    """)

    op.execute("DROP TRIGGER IF EXISTS trg_update_ticket_type_sold_count ON tickets;")
    op.execute("""
    CREATE TRIGGER trg_update_ticket_type_sold_count
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_type_sold_count();
    """)

    # -------------------------------------------------------------------------
    # 3. DATABASE VIEWS
    # -------------------------------------------------------------------------
    # 3a. v_event_sales_summary
    op.execute("""
    CREATE OR REPLACE VIEW v_event_sales_summary AS
    WITH booking_agg AS (
        SELECT 
            b.event_id,
            b.id AS booking_id,
            b.status,
            b.total_amount,
            coalesce(sum(bi.quantity), 0)::BIGINT AS total_tickets
        FROM bookings b
        LEFT JOIN booking_items bi ON b.id = bi.booking_id
        GROUP BY b.event_id, b.id, b.status, b.total_amount
    )
    SELECT 
        e.id AS event_id,
        e.title AS event_title,
        o.organization_name,
        c.name AS category_name,
        e.status AS event_status,
        e.event_date,
        count(ba.booking_id)::BIGINT AS total_bookings,
        count(ba.booking_id) FILTER (WHERE ba.status = 'CONFIRMED')::BIGINT AS confirmed_bookings,
        count(ba.booking_id) FILTER (WHERE ba.status = 'CANCELLED')::BIGINT AS cancelled_bookings,
        count(ba.booking_id) FILTER (WHERE ba.status = 'REFUNDED')::BIGINT AS refunded_bookings,
        coalesce(sum(ba.total_tickets) FILTER (WHERE ba.status = 'CONFIRMED'), 0)::BIGINT AS tickets_sold,
        coalesce(sum(ba.total_amount) FILTER (WHERE ba.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS gross_revenue
    FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    JOIN categories c ON e.category_id = c.id
    LEFT JOIN booking_agg ba ON e.id = ba.event_id
    GROUP BY e.id, e.title, o.organization_name, c.name, e.status, e.event_date;
    """)

    # 3b. v_event_occupancy
    op.execute("""
    CREATE OR REPLACE VIEW v_event_occupancy AS
    SELECT 
        e.id AS event_id,
        e.title AS event_title,
        v.name AS venue_name,
        e.event_date,
        e.seating_mode,
        coalesce(sum(tt.capacity), 0)::BIGINT AS total_ticket_capacity,
        coalesce(sum(tt.sold_count), 0)::BIGINT AS sold_tickets,
        (coalesce(sum(tt.capacity), 0) - coalesce(sum(tt.sold_count), 0))::BIGINT AS available_tickets,
        round(
            (coalesce(sum(tt.sold_count), 0)::numeric / NULLIF(sum(tt.capacity), 0) * 100), 
            2
        ) AS occupancy_percentage
    FROM events e
    JOIN venues v ON e.venue_id = v.id
    LEFT JOIN ticket_types tt ON e.id = tt.event_id
    GROUP BY e.id, e.title, v.name, e.event_date, e.seating_mode;
    """)

    # 3c. v_organizer_revenue
    op.execute("""
    CREATE OR REPLACE VIEW v_organizer_revenue AS
    WITH booking_agg AS (
        SELECT 
            b.event_id,
            b.id AS booking_id,
            b.status,
            b.total_amount,
            coalesce(sum(bi.quantity), 0)::BIGINT AS total_tickets
        FROM bookings b
        LEFT JOIN booking_items bi ON b.id = bi.booking_id
        GROUP BY b.event_id, b.id, b.status, b.total_amount
    )
    SELECT 
        o.id AS organizer_id,
        o.organization_name,
        count(DISTINCT e.id)::BIGINT AS total_events,
        count(ba.booking_id) FILTER (WHERE ba.status = 'CONFIRMED')::BIGINT AS confirmed_bookings,
        coalesce(sum(ba.total_tickets) FILTER (WHERE ba.status = 'CONFIRMED'), 0)::BIGINT AS tickets_sold,
        coalesce(sum(ba.total_amount) FILTER (WHERE ba.status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS gross_revenue,
        round(
            coalesce(sum(ba.total_amount) FILTER (WHERE ba.status = 'CONFIRMED'), 0.00) / 
            NULLIF(count(ba.booking_id) FILTER (WHERE ba.status = 'CONFIRMED'), 0), 
            2
        )::NUMERIC(12, 2) AS average_booking_value
    FROM organizers o
    LEFT JOIN events e ON o.id = e.organizer_id
    LEFT JOIN booking_agg ba ON e.id = ba.event_id
    GROUP BY o.id, o.organization_name;
    """)

    # 3d. v_monthly_booking_summary
    op.execute("""
    CREATE OR REPLACE VIEW v_monthly_booking_summary AS
    SELECT 
        EXTRACT(YEAR FROM created_at)::INTEGER AS booking_year,
        EXTRACT(MONTH FROM created_at)::INTEGER AS booking_month,
        to_char(created_at, 'YYYY-MM') AS month_label,
        count(*)::BIGINT AS total_bookings,
        count(*) FILTER (WHERE status = 'CONFIRMED')::BIGINT AS confirmed_bookings,
        count(*) FILTER (WHERE status = 'CANCELLED')::BIGINT AS cancelled_bookings,
        count(*) FILTER (WHERE status = 'REFUNDED')::BIGINT AS refunded_bookings,
        coalesce(sum(total_amount) FILTER (WHERE status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS total_revenue
    FROM bookings
    GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), to_char(created_at, 'YYYY-MM')
    ORDER BY booking_year, booking_month;
    """)

    # 3e. v_event_rating_summary
    op.execute("""
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
    """)


def downgrade() -> None:
    # 1. Drop Views
    op.execute("DROP VIEW IF EXISTS v_event_rating_summary;")
    op.execute("DROP VIEW IF EXISTS v_monthly_booking_summary;")
    op.execute("DROP VIEW IF EXISTS v_organizer_revenue;")
    op.execute("DROP VIEW IF EXISTS v_event_occupancy;")
    op.execute("DROP VIEW IF EXISTS v_event_sales_summary;")

    # 2. Drop Triggers and Functions
    op.execute("DROP TRIGGER IF EXISTS trg_update_ticket_type_sold_count ON tickets;")
    op.execute("DROP FUNCTION IF EXISTS update_ticket_type_sold_count();")

    op.execute("DROP TRIGGER IF EXISTS trg_validate_event_seat_state ON event_seats;")
    op.execute("DROP FUNCTION IF EXISTS validate_event_seat_state();")

    op.execute("DROP TRIGGER IF EXISTS trg_audit_user_change ON users;")
    op.execute("DROP FUNCTION IF EXISTS audit_user_change();")

    op.execute("DROP TRIGGER IF EXISTS trg_audit_booking_change ON bookings;")
    op.execute("DROP FUNCTION IF EXISTS audit_booking_change();")

    for table in ["reviews", "bookings", "ticket_types", "events", "venues", "organizers", "users"]:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")

    # 3. Drop Custom Functions
    op.execute("DROP FUNCTION IF EXISTS release_expired_holds();")
    op.execute("DROP FUNCTION IF EXISTS get_event_revenue(BIGINT);")
    op.execute("DROP FUNCTION IF EXISTS get_available_ticket_count(BIGINT);")
    op.execute("DROP FUNCTION IF EXISTS calculate_booking_total(NUMERIC, NUMERIC, NUMERIC);")
