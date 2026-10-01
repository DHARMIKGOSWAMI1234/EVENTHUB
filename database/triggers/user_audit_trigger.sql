-- ============================================================================
-- EVENTHUB Trigger: audit_user_change
-- Records user creation and updates into audit_logs while strictly sanitizing
-- sensitive data (password_hash is completely excluded from audit snapshots).
-- ============================================================================

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
        -- Explicitly strip password_hash to ensure zero secret exposure
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

DROP TRIGGER IF EXISTS trg_audit_user_change ON users;
CREATE TRIGGER trg_audit_user_change
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_user_change();
