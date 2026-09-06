CREATE OR REPLACE FUNCTION get_dropped_off_customers(p_end_date date, p_start_date date)
RETURNS TABLE(
    customer_id uuid,
    customer_name text,
    phone text,
    last_order_date timestamp with time zone,
    previous_7_days_total numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period_customers AS (
        SELECT DISTINCT s.customer_id
        FROM sales s
        WHERE s.sale_date >= p_start_date AND s.sale_date <= p_end_date
    ),
    previous_period_customers AS (
        SELECT
            s.customer_id,
            MAX(s.sale_date) as last_order_date,
            SUM(s.total_price) as total_sales
        FROM sales s
        WHERE s.sale_date >= p_start_date - interval '7 days' AND s.sale_date < p_start_date
        GROUP BY s.customer_id
    )
    SELECT
        c.id,
        c.name,
        c.phone,
        ppc.last_order_date,
        ppc.total_sales
    FROM previous_period_customers ppc
    JOIN customers c ON c.id = ppc.customer_id
    WHERE ppc.customer_id NOT IN (SELECT customer_id FROM current_period_customers);
END;
$$ LANGUAGE plpgsql;