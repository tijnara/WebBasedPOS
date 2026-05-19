CREATE OR REPLACE FUNCTION get_expense_summary(p_month date DEFAULT NULL)
RETURNS TABLE(
    "dailyTotal" numeric,
    "weeklyTotal" numeric,
    "monthlyTotal" numeric,
    "grandTotal" numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- Use a specific timezone for all calculations to ensure consistency
    time_zone TEXT := 'Asia/Manila';

    current_moment_in_zone timestamptz;

    today_start timestamptz;
    today_end timestamptz;

    week_start timestamptz;
    week_end timestamptz;

    month_start timestamptz;
    month_end timestamptz;

    target_month_date date;

BEGIN
    -- The current moment in the desired timezone
    current_moment_in_zone := now() AT TIME ZONE time_zone;

    -- If p_month is not provided, use the current date in the specified timezone
    target_month_date := COALESCE(p_month, current_moment_in_zone::date);

    -- Calculate start and end for the current day
    today_start := date_trunc('day', current_moment_in_zone);
    today_end := today_start + interval '1 day';

    -- Calculate start and end for the current week (Postgres week starts on Monday)
    week_start := date_trunc('week', current_moment_in_zone);
    week_end := week_start + interval '1 week';

    -- Calculate start and end for the target month
    -- date_trunc on a date returns a timestamp without timezone.
    -- We convert it to a timestamptz in our target zone.
    month_start := timezone(time_zone, date_trunc('month', target_month_date));
    month_end := month_start + interval '1 month';

    RETURN QUERY
    SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE expense_date >= today_start AND expense_date < today_end) AS "dailyTotal",
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE expense_date >= week_start AND expense_date < week_end) AS "weeklyTotal",
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE expense_date >= month_start AND expense_date < month_end) AS "monthlyTotal",
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses) AS "grandTotal";
END;
$$;