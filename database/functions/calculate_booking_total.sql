-- ============================================================================
-- EVENTHUB Function: calculate_booking_total
-- Calculates final booking total from subtotal, discount, and tax.
-- ============================================================================
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
    
    -- Ensure non-negative total
    IF v_total < 0.00 THEN
        v_total := 0.00;
    END IF;

    RETURN round(v_total, 2);
END;
$$;
