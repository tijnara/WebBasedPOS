CREATE OR REPLACE FUNCTION get_sales_summary(
    start_date_param timestamptz DEFAULT NULL,
    end_date_param timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    time_zone TEXT := 'Asia/Manila';

    total_revenue_val numeric := 0;
    total_profit_val numeric := 0;

    weekly_revenue_map jsonb := '{}'::jsonb;
    monthly_revenue_map jsonb := '{}'::jsonb;

    sale_record record;
    item_record record;

    sale_revenue numeric;
    sale_profit numeric;

    -- Keys for aggregation maps
    week_key text;
    month_key text;

BEGIN
    FOR sale_record IN
        SELECT
            s.id,
            s.totalamount,
            s.saletimestamp
        FROM public.sales s
        WHERE s.status = 'Completed'
          AND (start_date_param IS NULL OR s.saletimestamp >= start_date_param)
          AND (end_date_param IS NULL OR s.saletimestamp <= end_date_param)
    LOOP
        sale_revenue := sale_record.totalamount;
        sale_profit := 0; -- Will be calculated from items

        -- Calculate profit from sale_items
        FOR item_record IN
            SELECT
                si.quantity,
                si.price_at_sale,
                si.cost_at_sale
            FROM public.sale_items si
            WHERE si.sale_id = sale_record.id
        LOOP
            sale_profit := sale_profit + (
                (item_record.price_at_sale - item_record.cost_at_sale) * item_record.quantity
            );
        END LOOP;

        total_revenue_val := total_revenue_val + sale_revenue;
        total_profit_val := total_profit_val + sale_profit;

        -- Generate timezone-aware keys for weekly and monthly aggregation
        week_key := to_char(sale_record.saletimestamp AT TIME ZONE time_zone, 'YYYY-MM-DD" (W)');
        month_key := to_char(sale_record.saletimestamp AT TIME ZONE time_zone, 'YYYY-MM');

        -- Aggregate weekly revenue
        weekly_revenue_map := jsonb_set(
            weekly_revenue_map,
            ARRAY[week_key],
            (COALESCE((weekly_revenue_map->>week_key)::numeric, 0) + sale_revenue)::text::jsonb
        );

        -- Aggregate monthly revenue
        monthly_revenue_map := jsonb_set(
            monthly_revenue_map,
            ARRAY[month_key],
            (COALESCE((monthly_revenue_map->>month_key)::numeric, 0) + sale_revenue)::text::jsonb
        );
    END LOOP;

    RETURN jsonb_build_object(
        'totalRevenue', total_revenue_val,
        'totalProfit', total_profit_val,
        'weeklyRevenue', weekly_revenue_map,
        'monthlyRevenue', monthly_revenue_map
    );
END;
$$;