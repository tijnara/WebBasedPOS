--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'Admin',
    'Staff'
);


--
-- Name: admin_update_user_credentials(bigint, text, text, boolean, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_user_credentials(p_user_id bigint, p_name text, p_email text, p_isadmin boolean, p_category_id integer, p_color text, p_new_password text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN IF p_new_password IS NOT NULL AND LENGTH(TRIM(p_new_password)) > 0 THEN UPDATE public.users SET name = TRIM(p_name), email = LOWER(TRIM(p_email)), isadmin = p_isadmin, category_id = p_category_id, color = p_color, password = crypt(p_new_password, gen_salt('bf', 10)), password_plain = p_new_password WHERE id = p_user_id; ELSE UPDATE public.users SET name = TRIM(p_name), email = LOWER(TRIM(p_email)), isadmin = p_isadmin, category_id = p_category_id, color = p_color WHERE id = p_user_id; END IF;      RETURN jsonb_build_object('success', true); END; $$;


--
-- Name: authenticate_user(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.authenticate_user(p_email text DEFAULT NULL::text, p_password text DEFAULT NULL::text, p_identifier text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $_$
DECLARE
    v_user RECORD;
    v_clean_id TEXT;
    v_input_id TEXT;
    v_password_valid BOOLEAN := false;
BEGIN
    v_input_id := COALESCE(p_email, p_identifier);

    IF v_input_id IS NULL OR p_password IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Please provide your email/username and password.'
        );
    END IF;

    v_clean_id := LOWER(TRIM(v_input_id));

    -- Match user by name OR email
    SELECT 
        id, 
        name, 
        email, 
        phone, 
        dateadded, 
        isadmin, 
        password, 
        category_id, 
        color, 
        is_demo, 
        is_approved
    INTO v_user
    FROM public.users
    WHERE LOWER(TRIM(name)) = v_clean_id 
       OR (email IS NOT NULL AND LOWER(TRIM(email)) = v_clean_id)
    LIMIT 1;

    -- If no user found
    IF v_user IS NULL OR v_user.password IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid email or password.'
        );
    END IF;

    -- Check 1: Matches bcrypt hash
    IF v_user.password LIKE '$2%' THEN
        IF v_user.password = crypt(p_password, v_user.password) THEN
            v_password_valid := true;
        END IF;
    -- Check 2: Matches plaintext (auto-migrates to bcrypt immediately)
    ELSIF v_user.password = p_password THEN
        v_password_valid := true;
        UPDATE public.users 
        SET password = crypt(p_password, gen_salt('bf', 10))
        WHERE id = v_user.id;
    END IF;

    IF NOT v_password_valid THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid email or password.'
        );
    END IF;

    -- Check approval for non-admins
    IF v_user.isadmin IS NOT TRUE AND v_user.is_approved IS FALSE THEN
        RETURN jsonb_build_object(
            'status', 'PENDING_APPROVAL',
            'message', 'Your account is pending administrator approval before you can access the system.'
        );
    END IF;

    -- Return FLAT user object so userPayload.id exists directly
    RETURN jsonb_build_object(
        'id', v_user.id,
        'name', v_user.name,
        'email', v_user.email,
        'phone', v_user.phone,
        'isadmin', v_user.isadmin,
        'isAdmin', v_user.isadmin,
        'role', CASE WHEN v_user.isadmin IS TRUE THEN 'Admin' ELSE 'Staff' END,
        'category_id', v_user.category_id,
        'color', v_user.color,
        'is_demo', v_user.is_demo,
        'is_approved', COALESCE(v_user.is_approved, true),
        'dateadded', v_user.dateadded,
        'success', true
    );
END;
$_$;


--
-- Name: break_bulk_stock(bigint, bigint, integer, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.break_bulk_stock(p_parent_id bigint, p_child_id bigint, p_quantity_cases integer, p_staff_id bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_rate int;
begin
  select conversion_rate into v_rate from public.products where id = p_child_id;
  
  if v_rate is null or v_rate < 2 then
    raise exception 'Invalid conversion rate for child product';
  end if;

  -- Deduct Parent
  update public.products 
  set stock_quantity = stock_quantity - p_quantity_cases 
  where id = p_parent_id;

  -- Add to Child
  update public.products 
  set stock_quantity = stock_quantity + (p_quantity_cases * v_rate) 
  where id = p_child_id;

  -- Log movements
  insert into public.stock_movements (product_id, staff_id, quantity_change, type)
  values (p_parent_id, p_staff_id, -p_quantity_cases, 'bulk_break_out');

  insert into public.stock_movements (product_id, staff_id, quantity_change, type)
  values (p_child_id, p_staff_id, (p_quantity_cases * v_rate), 'bulk_break_in');
end;
$$;


--
-- Name: break_bulk_stock(bigint, bigint, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.break_bulk_stock(p_parent_id bigint, p_child_id bigint, p_quantity_cases integer, p_staff_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_rate int;
begin
  -- Get conversion rate
  select conversion_rate into v_rate from public.products where id = p_child_id;
  
  if v_rate is null or v_rate < 2 then
    raise exception 'Invalid conversion rate for child product';
  end if;

  -- Deduct Parent
  update public.products 
  set stock_quantity = stock_quantity - p_quantity_cases 
  where id = p_parent_id;

  -- Add to Child
  update public.products 
  set stock_quantity = stock_quantity + (p_quantity_cases * v_rate) 
  where id = p_child_id;

  -- Log the movement (Optional but good for audit)
  insert into public.stock_movements (product_id, staff_id, quantity_change, type)
  values (p_parent_id, p_staff_id, -p_quantity_cases, 'bulk_break_out');

  insert into public.stock_movements (product_id, staff_id, quantity_change, type)
  values (p_child_id, p_staff_id, (p_quantity_cases * v_rate), 'bulk_break_in');
end;
$$;


--
-- Name: break_bulk_stock(bigint, bigint, bigint, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.break_bulk_stock(p_parent_id bigint, p_child_id bigint, p_quantity_cases bigint, p_staff_id bigint DEFAULT NULL::bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_conversion_rate integer;
BEGIN
  -- Get conversion rate (Requires the products table to have this column, see note below)
  SELECT conversion_rate INTO v_conversion_rate
  FROM public.products
  WHERE id = p_child_id;

  -- Default to 1 if not set to avoid multiplication by null
  IF v_conversion_rate IS NULL THEN 
    v_conversion_rate := 1; 
  END IF;

  -- Deduct from Parent
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity_cases,
      updated_at = now()
  WHERE id = p_parent_id;

  -- Add to Child
  UPDATE public.products
  SET stock_quantity = stock_quantity + (p_quantity_cases * v_conversion_rate),
      updated_at = now()
  WHERE id = p_child_id;
END;
$$;


--
-- Name: broadcast_table_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.broadcast_table_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  perform realtime.broadcast_changes(
    'table:' || TG_TABLE_NAME::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return coalesce(NEW, OLD);
end;
$$;


--
-- Name: create_new_user(text, text, text, text, bigint, text, boolean, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_new_user(p_name text, p_password text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_category_id bigint DEFAULT 2, p_color text DEFAULT '#3B82F6'::text, p_isadmin boolean DEFAULT false, p_is_approved boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
    v_new_id BIGINT;
    v_existing_id BIGINT;
BEGIN
    -- Check for duplicate name
    SELECT id INTO v_existing_id
    FROM public.users
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(p_name))
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'A user with this name already exists'
        );
    END IF;

    -- Check for duplicate email if provided
    IF p_email IS NOT NULL AND TRIM(p_email) <> '' THEN
        SELECT id INTO v_existing_id
        FROM public.users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email))
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'A user with this email already exists'
            );
        END IF;
    END IF;

    -- Insert user with salted bcrypt hash
    INSERT INTO public.users (
        name,
        email,
        phone,
        dateadded,
        isadmin,
        password,
        category_id,
        color,
        is_demo,
        is_approved
    ) VALUES (
        TRIM(p_name),
        NULLIF(TRIM(p_email), ''),
        NULLIF(TRIM(p_phone), ''),
        NOW(),
        COALESCE(p_isadmin, false),
        crypt(p_password, gen_salt('bf', 10)),
        COALESCE(p_category_id, 2),
        COALESCE(p_color, '#3B82F6'),
        false,
        COALESCE(p_is_approved, false)
    )
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_new_id
    );
END;
$$;


--
-- Name: decrement_stock(bigint, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_stock(p_product_id bigint, p_quantity integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id;
END;
$$;


--
-- Name: decrement_stock(bigint, integer, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_stock(product_id bigint, quantity_sold integer, staff_id_input bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE products
  SET 
    stock_quantity = stock_quantity - quantity_sold,
    updated_at = now()
  WHERE id = product_id;
END;
$$;


--
-- Name: decrement_stock(bigint, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_stock(p_product_id bigint, p_quantity_sold integer, staff_id_input uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  update public.products
  set stock_quantity = greatest(0, stock_quantity - p_quantity_sold),
      updated_at = now()
  where id = p_product_id;
end;
$$;


--
-- Name: enforce_page_views_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_page_views_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.page_views_log
  WHERE id IN (
    SELECT id 
    FROM public.page_views_log
    ORDER BY viewed_at DESC, id DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$;


--
-- Name: enforce_page_views_log_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_page_views_log_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Serialize cap enforcement to avoid concurrent inserts leaving > 100 rows
  perform pg_advisory_xact_lock(hashtext('public.page_views_log_cap_100'));

  -- Keep latest 100 rows by viewed_at/id; delete the rest
  delete from public.page_views_log p
  using (
    select id
    from (
      select id,
             row_number() over (order by viewed_at desc, id desc) as rn
      from public.page_views_log
    ) t
    where t.rn > 100
  ) to_delete
  where p.id = to_delete.id;

  return null;
end;
$$;


--
-- Name: get_daily_sales_summary(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_daily_sales_summary(start_date timestamp without time zone, end_date timestamp without time zone) RETURNS TABLE(day date, total_sales numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(timezone('Asia/Manila', created_at)) AS day, SUM(total_amount) AS total_sales
  FROM sales
  WHERE created_at >= start_date AND created_at <= end_date
  GROUP BY DATE(timezone('Asia/Manila', created_at))
  ORDER BY day;
END;
$$;


--
-- Name: get_dropped_off_customers(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dropped_off_customers(p_end_date date, p_start_date date) RETURNS TABLE(customer_id uuid, customer_name text, phone text, last_order_date timestamp with time zone, previous_7_days_total numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_expense_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_expense_summary() RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    daily_total NUMERIC;
    weekly_total NUMERIC;
    monthly_total NUMERIC;
    grand_total NUMERIC;
    local_now TIMESTAMP;
BEGIN
    -- Set to Philippine Time (Asia/Manila)
    local_now := now() AT TIME ZONE 'Asia/Manila';

    SELECT COALESCE(SUM(amount), 0) INTO daily_total FROM expenses WHERE (expense_date AT TIME ZONE 'Asia/Manila') >= date_trunc('day', local_now);
    SELECT COALESCE(SUM(amount), 0) INTO weekly_total FROM expenses WHERE (expense_date AT TIME ZONE 'Asia/Manila') >= date_trunc('week', local_now);
    SELECT COALESCE(SUM(amount), 0) INTO monthly_total FROM expenses WHERE (expense_date AT TIME ZONE 'Asia/Manila') >= date_trunc('month', local_now);
    SELECT COALESCE(SUM(amount), 0) INTO grand_total FROM expenses;

    RETURN json_build_object(
        'dailyTotal', daily_total,
        'weeklyTotal', weekly_total,
        'monthlyTotal', monthly_total,
        'grandTotal', grand_total
    );
END;
$$;


--
-- Name: get_expense_summary(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_expense_summary(p_month date DEFAULT NULL::date) RETURNS TABLE("dailyTotal" numeric, "weeklyTotal" numeric, "monthlyTotal" numeric, "grandTotal" numeric)
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


--
-- Name: get_frequent_customers(timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, text, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_frequent_customers(month_start timestamp with time zone, month_end timestamp with time zone, week_start timestamp with time zone, week_end timestamp with time zone, sort_column text DEFAULT 'monthly'::text, sort_desc boolean DEFAULT true, search_term text DEFAULT ''::text) RETURNS TABLE(customername character varying, monthly_order_count bigint, weekly_order_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH counts AS (
      SELECT 
        s.customername, 
        COUNT(CASE WHEN s.saletimestamp >= month_start AND s.saletimestamp <= month_end THEN 1 END) as monthly_order_count,
        COUNT(CASE WHEN s.saletimestamp >= week_start AND s.saletimestamp <= week_end THEN 1 END) as weekly_order_count
      FROM sales s
      WHERE ((s.saletimestamp >= month_start AND s.saletimestamp <= month_end) 
         OR (s.saletimestamp >= week_start AND s.saletimestamp <= week_end))
        AND s.customername IS NOT NULL
        AND s.customername != ''
        AND (search_term = '' OR s.customername ILIKE '%' || search_term || '%')
      GROUP BY s.customername
      HAVING COUNT(CASE WHEN s.saletimestamp >= month_start AND s.saletimestamp <= month_end THEN 1 END) > 0
  )
  SELECT 
    counts.customername, 
    counts.monthly_order_count, 
    counts.weekly_order_count
  FROM counts
  ORDER BY 
    CASE WHEN sort_column = 'weekly' AND sort_desc THEN counts.weekly_order_count END DESC NULLS LAST,
    CASE WHEN sort_column = 'weekly' AND NOT sort_desc THEN counts.weekly_order_count END ASC NULLS LAST,
    CASE WHEN sort_column = 'monthly' AND sort_desc THEN counts.monthly_order_count END DESC NULLS LAST,
    CASE WHEN sort_column = 'monthly' AND NOT sort_desc THEN counts.monthly_order_count END ASC NULLS LAST;
END;
$$;


--
-- Name: get_idle_customers(text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_idle_customers(search_term text, cutoff_date timestamp with time zone) RETURNS TABLE(id bigint, name character varying, created_at date, last_order timestamp with time zone, avg_gallons numeric, total_orders bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        SELECT 
            c.id, 
            c.name, 
            c.created_at,
            MAX(s.saletimestamp) AS last_order,
            COUNT(DISTINCT s.id) AS total_orders,
            SUM(CASE WHEN si.product_id IN (2, 3, 30) THEN si.quantity ELSE 0 END) AS total_gallons
        FROM 
            customers c
        LEFT JOIN sales s ON c.id = s.customerid AND s.status = 'Completed'
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE 
            (search_term = '' OR c.name ILIKE '%' || search_term || '%')
        GROUP BY 
            c.id, c.name, c.created_at
    )
    SELECT 
        cs.id,
        cs.name,
        cs.created_at,
        cs.last_order,
        CASE 
            WHEN cs.total_orders > 0 THEN ROUND((COALESCE(cs.total_gallons, 0))::numeric / cs.total_orders::numeric, 2) 
            ELSE 0.00 
        END AS avg_gallons,
        cs.total_orders::bigint
    FROM 
        customer_stats cs
    WHERE 
        -- Must not have ordered recently, or if they have no orders, must be registered over a month ago
        (cs.last_order IS NOT NULL AND cs.last_order <= cutoff_date)
        OR 
        (cs.last_order IS NULL AND cs.created_at::timestamp with time zone <= cutoff_date)
    ORDER BY 
        COALESCE(cs.last_order, cs.created_at::timestamp with time zone) DESC;
END;
$$;


--
-- Name: get_inactive_customers(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_inactive_customers(days_inactive integer) RETURNS TABLE(id bigint, name character varying, phone character varying, last_order_date timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select 
    c.id,
    c.name,
    c.phone,
    max(s.saletimestamp) as last_order_date
  from customers c
  left join sales s on c.id = s.customerid
  group by c.id, c.name, c.phone
  having max(s.saletimestamp) < (now() - (days_inactive || ' days')::interval) 
     or max(s.saletimestamp) is null
  order by last_order_date asc nulls first;
end;
$$;


--
-- Name: get_lapsed_customers(text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lapsed_customers(search_term text, cutoff_date timestamp with time zone) RETURNS TABLE(customer_id bigint, customer_name character varying, customer_phone character varying, date_registered date, last_order_date timestamp with time zone, avg_refills numeric, total_orders bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
        WITH customer_stats AS (
            SELECT 
                c.id, 
                c.name,
                c.phone,
                c.created_at,
                MAX(s.saletimestamp) AS last_order,
                COUNT(DISTINCT s.id) AS total_orders,
                SUM(CASE WHEN p.category ILIKE '%Water%' OR p.id IN (2, 3, 30) THEN si.quantity ELSE 0 END) AS total_refills
            FROM 
                customers c
            LEFT JOIN sales s ON c.id = s.customerid AND s.status = 'Completed'
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE 
                (search_term = '' OR c.name ILIKE '%' || search_term || '%')
            GROUP BY 
                c.id, c.name, c.phone, c.created_at
        )
        SELECT 
            cs.id AS customer_id,
            cs.name AS customer_name,
            cs.phone AS customer_phone,
            cs.created_at::date AS date_registered,
            cs.last_order AS last_order_date,
            CASE 
                WHEN cs.total_orders > 0 THEN ROUND((COALESCE(cs.total_refills, 0))::numeric / cs.total_orders::numeric, 2) 
                ELSE 0.00 
            END AS avg_refills,
            cs.total_orders::bigint
        FROM 
            customer_stats cs
        WHERE 
            (cs.last_order IS NOT NULL AND cs.last_order <= cutoff_date)
            OR 
            (cs.last_order IS NULL AND cs.created_at::timestamp with time zone <= cutoff_date);
END;
$$;


--
-- Name: get_lifetime_refill_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lifetime_refill_count() RETURNS TABLE(total_containers bigint, refill_30_count bigint, refill_25_count bigint, refill_walkin_20_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(si.quantity), 0)::bigint AS total_containers,
        COALESCE(SUM(CASE WHEN si.product_name = 'Refill(30)' THEN si.quantity ELSE 0 END), 0)::bigint AS refill_30_count,
        COALESCE(SUM(CASE WHEN si.product_name = 'Refill(25)' THEN si.quantity ELSE 0 END), 0)::bigint AS refill_25_count,
        COALESCE(SUM(CASE WHEN si.product_name = 'Refill-Walk-in(20)' THEN si.quantity ELSE 0 END), 0)::bigint AS refill_walkin_20_count
    FROM public.sale_items si
    INNER JOIN public.sales s ON s.id = si.sale_id
    WHERE si.product_name IN ('Refill(30)', 'Refill(25)', 'Refill-Walk-in(20)')
      AND s.status = 'Completed';
END;
$$;


--
-- Name: get_missed_customers_period(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_missed_customers_period(p_start_date timestamp with time zone, p_end_date timestamp with time zone) RETURNS TABLE(customer_id bigint, customer_name character varying, phone character varying, last_week_total numeric, last_order_date timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH LastWeekSales AS (
        SELECT 
            s.customerid, 
            SUM(s.totalamount) as last_week_total,
            MAX(s.saletimestamp) as last_order_date
        FROM sales s
        -- Uses the 7 days prior to your selected start date
        WHERE s.saletimestamp >= (p_start_date - INTERVAL '7 days')
          AND s.saletimestamp < p_start_date
          AND s.customerid IS NOT NULL
        GROUP BY s.customerid
    ),
    ThisPeriodSales AS (
        SELECT DISTINCT s.customerid
        FROM sales s
        -- Uses your selected date range
        WHERE s.saletimestamp >= p_start_date
          AND s.saletimestamp <= p_end_date
          AND s.customerid IS NOT NULL
    )
    
    SELECT 
        c.id as customer_id,
        c.name as customer_name,
        c.phone,
        lws.last_week_total,
        lws.last_order_date 
    FROM LastWeekSales lws
    JOIN customers c ON lws.customerid = c.id
    LEFT JOIN ThisPeriodSales tps ON lws.customerid = tps.customerid
    WHERE tps.customerid IS NULL
    ORDER BY lws.last_week_total DESC;
END;
$$;


--
-- Name: get_missed_customers_this_week(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_missed_customers_this_week() RETURNS TABLE(customer_id bigint, customer_name character varying, phone character varying, last_week_total numeric, last_order_date timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH LastWeekSales AS (
        SELECT 
            s.customerid, 
            SUM(s.totalamount) as last_week_total,
            MAX(s.saletimestamp) as last_order_date -- Gets their most recent order from last week
        FROM sales s
        WHERE s.saletimestamp >= (NOW() - INTERVAL '14 days')
          AND s.saletimestamp < (NOW() - INTERVAL '7 days')
          AND s.customerid IS NOT NULL
        GROUP BY s.customerid
    ),
    ThisWeekSales AS (
        SELECT DISTINCT s.customerid
        FROM sales s
        WHERE s.saletimestamp >= (NOW() - INTERVAL '7 days')
          AND s.customerid IS NOT NULL
    )
    
    SELECT 
        c.id as customer_id,
        c.name as customer_name,
        c.phone,
        lws.last_week_total,
        lws.last_order_date 
    FROM LastWeekSales lws
    JOIN customers c ON lws.customerid = c.id
    LEFT JOIN ThisWeekSales tws ON lws.customerid = tws.customerid
    WHERE tws.customerid IS NULL
    ORDER BY lws.last_week_total DESC;
END;
$$;


--
-- Name: get_new_customers_by_date_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_new_customers_by_date_summary() RETURNS TABLE(customer_date text, total_customers bigint)
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select 
    to_char(created_at, 'YYYY-MM-DD') as customer_date,
    count(id) as total_customers
  from customers
  group by 1
  order by 1;
end;
$$;


--
-- Name: get_page_views(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_page_views() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_count INT;
BEGIN
    SELECT view_count INTO current_count FROM public.site_analytics WHERE id = 1;
    RETURN current_count;
END;
$$;


--
-- Name: get_report_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_report_summary() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  total_gallons INT;
  sales_after_apr20 DECIMAL;
  expenses_after_apr20 DECIMAL;
  -- Locking the timezone to Philippine Time (PST) to ensure exact April 20 cutoffs
  target_date TIMESTAMPTZ := '2026-04-20 00:00:00+08'; 
BEGIN
  -- 1. Total gallons sold (All Time)
  SELECT COALESCE(SUM(gallon_quantity), 0) INTO total_gallons
  FROM sales;

  -- 2. Total Sales (April 20 onwards)
  SELECT COALESCE(SUM(total_amount), 0) INTO sales_after_apr20
  FROM sales
  WHERE created_at >= target_date;

  -- 3. Total Expenses (April 20 onwards)
  SELECT COALESCE(SUM(amount), 0) INTO expenses_after_apr20
  FROM expenses
  WHERE created_at >= target_date;

  -- Return the calculated object
  RETURN json_build_object(
    'totalGallons', total_gallons,
    'netRevenue', sales_after_apr20 - expenses_after_apr20
  );
END;
$$;


--
-- Name: get_salary_monitoring(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_salary_monitoring(target_date date) RETURNS TABLE(employee_id bigint, employee_name text, salary_type character varying, daily_rate numeric, container_multiplier integer, total_gallons_sold numeric, calculated_salary numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS employee_id,
        e.name AS employee_name,
        e.salary_type,
        e.default_salary AS daily_rate,
        e.container_multiplier,
        COALESCE(SUM(si.quantity), 0)::numeric AS total_gallons_sold, -- Also changed here for consistency

        CASE
            WHEN e.salary_type = 'per_container' THEN (COALESCE(SUM(si.quantity), 0) * e.container_multiplier)::numeric
            WHEN e.salary_type = 'per_day' THEN e.default_salary
            ELSE e.default_salary
        END AS calculated_salary
    FROM
        public.employees e
    LEFT JOIN
        public.sales s ON e.id = s.created_by
        AND DATE(s.saletimestamp) = target_date
        AND s.status != 'Void'
    LEFT JOIN
        public.sale_items si ON s.id = si.sale_id
        AND si.product_id IN (2, 3, 30)
    WHERE
        e.is_active = true
    GROUP BY
        e.id, e.name, e.salary_type, e.default_salary, e.container_multiplier
    ORDER BY
        e.name ASC;
END;
$$;


--
-- Name: get_sales_by_date_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sales_by_date_summary() RETURNS TABLE(sale_date text, total_sales numeric)
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select 
    to_char(saletimestamp, 'YYYY-MM-DD') as sale_date,
    sum(totalamount) as total_sales
  from sales
  group by 1
  order by 1;
end;
$$;


--
-- Name: get_sales_summary(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sales_summary(start_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone, end_date_param timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
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


--
-- Name: get_top_customers(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_customers(limit_val integer DEFAULT 10) RETURNS TABLE(name text, "totalRevenue" numeric, "orderCount" bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(sales.customername, 'Walk-in Customer') AS name,
        SUM(sales.totalamount) AS "totalRevenue",
        COUNT(*) AS "orderCount"
    FROM sales
    GROUP BY COALESCE(sales.customername, 'Walk-in Customer')
    ORDER BY "totalRevenue" DESC
    LIMIT limit_val;
END;
$$;


--
-- Name: get_top_products(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_products(limit_val integer DEFAULT 5) RETURNS TABLE(product_id bigint, name text, total_quantity bigint, total_revenue numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.name::TEXT,
        CAST(COALESCE(SUM(si.quantity), 0) AS BIGINT) AS total_quantity,
        CAST(COALESCE(SUM(si.quantity * si.price_at_sale), 0) AS NUMERIC) AS total_revenue
    FROM 
        public.products p
    JOIN 
        public.sale_items si ON p.id = si.product_id
    GROUP BY 
        p.id, p.name
    ORDER BY 
        total_revenue DESC
    LIMIT limit_val;
END;
$$;


--
-- Name: get_top_products_summary(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_products_summary(p_limit integer) RETURNS TABLE(name text, quantity bigint)
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select 
    si.product_name::text as name, 
    sum(si.quantity)::bigint as quantity
  from sale_items si
  group by si.product_name
  order by quantity desc
  limit p_limit;
end;
$$;


--
-- Name: handle_customer_entry(text, bigint, text, text, text, text, bigint, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_customer_entry(p_mode text, p_existing_customer_id bigint DEFAULT NULL::bigint, p_name text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_user_id bigint DEFAULT NULL::bigint, p_link_sales boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_customer_id bigint;
    v_result jsonb;
    v_linked_count int := 0;
BEGIN
    -- 1. ADD NEW CUSTOMER
    IF p_mode = 'new' THEN
        IF p_name IS NULL OR trim(p_name) = '' THEN
            RAISE EXCEPTION 'Customer name is required.';
        END IF;

        INSERT INTO public.customers (
            name,
            phone,
            address,
            email,
            created_by,
            credit_balance,
            status,
            is_active
        ) VALUES (
            trim(p_name),
            NULLIF(trim(p_phone), ''),
            NULLIF(trim(p_address), ''),
            NULLIF(trim(p_email), ''),
            p_user_id,
            0,
            'Active',
            true
        )
        RETURNING id INTO v_customer_id;

        -- Retroactively link past unlinked sales matching this customer's name
        IF p_link_sales THEN
            UPDATE public.sales
            SET customerid = v_customer_id
            WHERE (customerid IS NULL OR customerid = 0)
              AND LOWER(TRIM(customername)) = LOWER(TRIM(p_name));
            GET DIAGNOSTICS v_linked_count = ROW_COUNT;
        END IF;

    -- 2. ADD TO EXISTING CUSTOMER (Merge / Update)
    ELSIF p_mode = 'existing' THEN
        IF p_existing_customer_id IS NULL THEN
            RAISE EXCEPTION 'Please select an existing customer.';
        END IF;

        v_customer_id := p_existing_customer_id;

        -- Update customer details only if new values are provided
        UPDATE public.customers
        SET
            phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
            address = COALESCE(NULLIF(trim(p_address), ''), address),
            email = COALESCE(NULLIF(trim(p_email), ''), email),
            status = 'Active',
            is_active = true
        WHERE id = v_customer_id;

        -- Link unassigned sales using the scanned/entered name
        IF p_link_sales AND p_name IS NOT NULL AND trim(p_name) <> '' THEN
            UPDATE public.sales
            SET customerid = v_customer_id
            WHERE (customerid IS NULL OR customerid = 0)
              AND LOWER(TRIM(customername)) = LOWER(TRIM(p_name));
            GET DIAGNOSTICS v_linked_count = ROW_COUNT;
        END IF;

    ELSE
        RAISE EXCEPTION 'Invalid mode: must be "new" or "existing"';
    END IF;

    -- Return the customer record and number of retroactively linked sales
    SELECT jsonb_build_object(
        'customer', row_to_json(c),
        'linked_sales_count', v_linked_count
    )
    INTO v_result
    FROM public.customers c
    WHERE c.id = v_customer_id;

    RETURN v_result;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Do nothing because the user profile already exists in the legacy table.
  -- The application logic will handle linking them.
  RETURN NEW;
END;
$$;


--
-- Name: increment_page_view(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_page_view() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    new_count INT;
BEGIN
    UPDATE public.site_analytics
    SET view_count = view_count + 1
    WHERE id = 1
    RETURNING view_count INTO new_count;
    
    RETURN new_count;
END;
$$;


--
-- Name: increment_stock(bigint, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_stock(p_product_id bigint, p_quantity integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE products
  SET 
    stock_quantity = stock_quantity + p_quantity,
    updated_at = now()
  WHERE id = p_product_id;
END;
$$;


--
-- Name: is_demo_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_demo_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (SELECT is_demo FROM public.users WHERE id = (current_setting('app.current_user_id', true)::BIGINT)),
    false
  );
$$;


--
-- Name: moddatetime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.moddatetime() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


--
-- Name: page_views_log_keep_last_100(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.page_views_log_keep_last_100() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Keep only the newest 100 rows by viewed_at (and id as tie-breaker)
  DELETE FROM public.page_views_log
  WHERE id NOT IN (
    SELECT id
    FROM public.page_views_log
    ORDER BY viewed_at DESC, id DESC
    LIMIT 100
  );

  RETURN NEW;
END;
$$;


--
-- Name: page_views_log_limit_100(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.page_views_log_limit_100() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    WITH to_delete AS (
      SELECT id
      FROM public.page_views_log
      ORDER BY viewed_at ASC, id ASC
      OFFSET 100
    )
    DELETE FROM public.page_views_log pl
    USING to_delete td
    WHERE pl.id = td.id;

    RETURN NEW;
  END;
  $$;


--
-- Name: process_sale(jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_sale(p_sale_data jsonb, p_items jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_sale_id BIGINT;
  v_item JSONB;
  v_current_stock INT;
  v_product_id BIGINT;
  v_quantity INT;
BEGIN
  -- 1. Insert the main sale record
  INSERT INTO sales (
    saletimestamp,
    totalamount,
    customerid,
    customername,
    paymentmethod,
    amountreceived,
    changegiven,
    status,
    created_by
  ) VALUES (
    (p_sale_data->>'saleTimestamp')::TIMESTAMPTZ,
    (p_sale_data->>'totalAmount')::NUMERIC,
    (p_sale_data->>'customerId')::TEXT, -- Assuming customerid is text/uuid
    (p_sale_data->>'customerName')::TEXT,
    (p_sale_data->>'paymentMethod')::TEXT,
    (p_sale_data->>'amountReceived')::NUMERIC,
    (p_sale_data->>'changeGiven')::NUMERIC,
    (p_sale_data->>'status')::TEXT,
    (p_sale_data->>'created_by')::BIGINT -- Change to UUID if your users table uses UUID
  )
  RETURNING id INTO v_sale_id;

  -- 2. Loop through items to Insert sale_items and Update inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::BIGINT; -- Change type if needed
    v_quantity := (v_item->>'quantity')::INT;

    -- A. Insert into sale_items
    INSERT INTO sale_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      price_at_sale,
      subtotal,
      cost_at_sale
    ) VALUES (
      v_sale_id,
      v_product_id,
      (v_item->>'productName')::TEXT,
      v_quantity,
      (v_item->>'priceAtSale')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC,
      COALESCE((v_item->>'cost_at_sale')::NUMERIC, 0)
    );

    -- B. Deduct Stock (Atomic Update)
    -- This locks the row briefly to ensure consistency
    UPDATE products
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_product_id;
    
    -- Optional: Check if stock went negative and raise error if you want to prevent it
    -- IF (SELECT stock_quantity FROM products WHERE id = v_product_id) < 0 THEN
    --   RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    -- END IF;

  END LOOP;

  -- Return the created sale ID and status
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Automatically rolls back the transaction on error
  RAISE;
END;
$$;


--
-- Name: record_batch_delivery_sales(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_batch_delivery_sales(payload jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    item jsonb;
    v_sale_id bigint;
    v_customer_id bigint;
    v_clean_name text;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        v_customer_id := (item->>'customer_id')::bigint;
        v_clean_name := trim(item->>'customer_name');

        -- 1. Auto-create missing customers (Ignore Walk-ins)
        IF v_customer_id IS NULL AND lower(v_clean_name) != 'walk-in' AND v_clean_name != '' THEN
            -- Check if it was already created in an earlier iteration of this same batch
            SELECT id INTO v_customer_id FROM public.customers WHERE lower(name) = lower(v_clean_name) LIMIT 1;
            
            IF v_customer_id IS NULL THEN
                INSERT INTO public.customers (name, created_by) 
                VALUES (v_clean_name, (item->>'created_by')::bigint)
                RETURNING id INTO v_customer_id;
            END IF;
        END IF;

        -- 2. Insert the Sale
        INSERT INTO public.sales (
            customername, totalamount, paymentmethod, status, saletimestamp, created_by, customer_id
        ) VALUES (
            v_clean_name, 
            (item->>'total_amount')::numeric, 
            item->>'payment_method', 
            item->>'status', 
            (item->>'sale_timestamp')::timestamptz, 
            (item->>'created_by')::bigint,
            v_customer_id
        ) RETURNING id INTO v_sale_id;

        -- 3. Insert the Sale Item
        IF (item->>'product_id') IS NOT NULL THEN
            INSERT INTO public.sale_items (
                sale_id, product_id, product_name, quantity, price_at_sale, subtotal, cost_at_sale, discount_amount
            ) VALUES (
                v_sale_id,
                (item->>'product_id')::bigint,
                item->>'product_name',
                (item->>'quantity')::integer,
                (item->>'unit_price')::numeric,
                (item->>'total_amount')::numeric,
                0,
                0
            );

            -- 4. Deduct Inventory Stock Dynamically (Only if tracked)
            IF (item->>'stock_field') IS NOT NULL THEN
                EXECUTE format(
                    'UPDATE public.products SET %I = GREATEST(0, COALESCE(%I, 0) - %L::numeric) WHERE id = %L::bigint', 
                    item->>'stock_field', item->>'stock_field', item->>'quantity', item->>'product_id'
                );
            END IF;
        END IF;

        -- 5. Increase Customer Credit (Utang) Balance if applicable
        IF item->>'payment_method' = 'Credit' AND v_customer_id IS NOT NULL THEN
            UPDATE public.customers 
            SET credit_balance = COALESCE(credit_balance, 0) + (item->>'total_amount')::numeric
            WHERE id = v_customer_id;
        END IF;

    END LOOP;
END;
$$;


--
-- Name: settle_customer_debt(bigint, numeric, bigint, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.settle_customer_debt(p_customer_id bigint, p_amount numeric, p_debt_id bigint DEFAULT NULL::bigint, p_staff_name text DEFAULT 'Staff'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_remaining_payment numeric := p_amount;
    v_debt_rec RECORD;
    v_deduct numeric;
BEGIN
    -- 1. Deduct from customer's overall credit balance in customers table
    UPDATE public.customers
    SET credit_balance = GREATEST(0, COALESCE(credit_balance, 0) - p_amount)
    WHERE id = p_customer_id;

    -- 2. If a specific debt_id was clicked, settle that debt entry first
    IF p_debt_id IS NOT NULL THEN
        SELECT * INTO v_debt_rec FROM public.customer_debts WHERE id = p_debt_id;
        IF FOUND THEN
            v_deduct := LEAST(v_remaining_payment, COALESCE(v_debt_rec.remaining_balance, v_debt_rec.amount));
            UPDATE public.customer_debts
            SET remaining_balance = GREATEST(0, COALESCE(remaining_balance, amount) - v_deduct),
                status = CASE 
                    WHEN (COALESCE(remaining_balance, amount) - v_deduct) <= 0 THEN 'Paid' 
                    ELSE 'Partially Paid' 
                END
            WHERE id = p_debt_id;
            v_remaining_payment := v_remaining_payment - v_deduct;
        END IF;
    END IF;

    -- 3. If there is leftover payment (or no specific debt_id was provided), apply FIFO to oldest unpaid debts
    IF v_remaining_payment > 0 THEN
        FOR v_debt_rec IN 
            SELECT * FROM public.customer_debts 
            WHERE customer_id = p_customer_id 
              AND (p_debt_id IS NULL OR id <> p_debt_id)
              AND status IN ('Unpaid', 'Partially Paid')
            ORDER BY incurred_at ASC
        LOOP
            EXIT WHEN v_remaining_payment <= 0;
            v_deduct := LEAST(v_remaining_payment, COALESCE(v_debt_rec.remaining_balance, v_debt_rec.amount));
            UPDATE public.customer_debts
            SET remaining_balance = GREATEST(0, COALESCE(remaining_balance, amount) - v_deduct),
                status = CASE 
                    WHEN (COALESCE(remaining_balance, amount) - v_deduct) <= 0 THEN 'Paid' 
                    ELSE 'Partially Paid' 
                END
            WHERE id = v_debt_rec.id;
            v_remaining_payment := v_remaining_payment - v_deduct;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'customer_id', p_customer_id, 
        'amount_settled', p_amount
    );
END;
$$;


--
-- Name: update_customer_credit(bigint, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_customer_credit(p_customer_id bigint, p_amount numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE customers
  SET credit_balance = COALESCE(credit_balance, 0) + p_amount
  WHERE id = p_customer_id;
END;
$$;


--
-- Name: users_sync_isadmin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.users_sync_isadmin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.role = 'Admin' THEN
    NEW.isadmin = true;
  ELSE
    NEW.isadmin = false;
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_name text NOT NULL,
    user_role text,
    action text NOT NULL,
    entity_type text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id bigint
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    content text NOT NULL,
    icon_name text DEFAULT 'BookOpen'::text,
    image_url text,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    id integer NOT NULL
);


--
-- Name: articles_id_new_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.articles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.articles_id_new_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: business_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_settings (
    id integer DEFAULT 1 NOT NULL,
    business_name text DEFAULT 'Seaside Water Refilling Station'::text NOT NULL,
    logo_url text,
    contact_number text,
    facebook_link text,
    messenger_link text,
    about_content text,
    location_embed text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    business_hours text DEFAULT 'Monday - Saturday: 8:00 AM - 5:00 PM'::text,
    physical_address text DEFAULT 'Laois, Labrador, Pangasinan'::text,
    hero_title text,
    hero_subtitle text,
    email text,
    services_title text,
    services_subtitle text,
    services_data jsonb,
    promo_floater_enabled boolean DEFAULT true NOT NULL,
    promo_floater_title text DEFAULT 'Monthly Schedule & Reminder'::text,
    promo_floater_content text DEFAULT 'Reminder: Our monthly promo & billing schedule is active from the 10th to the 15th of the month!'::text,
    promo_floater_month integer DEFAULT 0 NOT NULL,
    promo_floater_start_day integer DEFAULT 10 NOT NULL,
    promo_floater_end_day integer DEFAULT 15 NOT NULL,
    promo_floater_audience text DEFAULT 'all'::text NOT NULL,
    promo_floater_frequency text DEFAULT 'once_a_day'::text NOT NULL,
    promo_floater_reset_at timestamp with time zone DEFAULT now(),
    tds_reading text DEFAULT '002 PPM'::text,
    jug_price_range text DEFAULT '₱20-₱30 / Jug'::text,
    hero_tagline text DEFAULT 'Always Fresh, Cold & Pure'::text
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id bigint NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contact_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customer_debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_debts (
    id bigint NOT NULL,
    customer_id bigint NOT NULL,
    sale_id bigint,
    amount numeric NOT NULL,
    remaining_balance numeric NOT NULL,
    staff_id bigint,
    staff_name text NOT NULL,
    incurred_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'Asia/Manila'::text),
    status text DEFAULT 'Unpaid'::text,
    notes text
);


--
-- Name: customer_debts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.customer_debts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.customer_debts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id bigint NOT NULL,
    name character varying NOT NULL,
    phone character varying,
    address character varying,
    created_at date DEFAULT CURRENT_DATE NOT NULL,
    email character varying,
    created_by bigint,
    credit_balance numeric DEFAULT 0,
    customer_name text GENERATED ALWAYS AS (name) STORED,
    fullname text GENERATED ALWAYS AS (name) STORED,
    status text DEFAULT 'Active'::text,
    is_active boolean DEFAULT true
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.customers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    saletimestamp timestamp with time zone DEFAULT now(),
    totalamount numeric(10,2),
    customerid bigint,
    customername character varying,
    paymentmethod character varying,
    amountreceived numeric(10,2),
    changegiven numeric(10,2),
    status character varying,
    created_by bigint
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255),
    dateadded timestamp without time zone DEFAULT now() NOT NULL,
    isadmin boolean DEFAULT false,
    password text NOT NULL,
    category_id bigint DEFAULT 2,
    color character varying DEFAULT '#3B82F6'::character varying,
    is_demo boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    password_plain text
);


--
-- Name: customers_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.customers_view WITH (security_invoker='true') AS
 SELECT c.id,
    c.name,
    c.phone,
    c.address,
    c.created_at,
    c.email,
    c.created_by,
    c.credit_balance,
    u.name AS created_by_name,
    u.color AS created_by_color,
    ( SELECT max(s.saletimestamp) AS max
           FROM public.sales s
          WHERE (s.customerid = c.id)) AS last_seen,
    COALESCE(( SELECT cd.incurred_at
           FROM public.customer_debts cd
          WHERE ((cd.customer_id = c.id) AND (cd.status = ANY (ARRAY['Unpaid'::text, 'Partially Paid'::text])))
          ORDER BY cd.incurred_at DESC
         LIMIT 1), ( SELECT s.saletimestamp
           FROM public.sales s
          WHERE ((s.customerid = c.id) AND ((s.paymentmethod)::text = 'Charge'::text) AND ((s.status)::text = 'Unpaid'::text))
          ORDER BY s.saletimestamp DESC
         LIMIT 1)) AS utang_approved_at,
    COALESCE(( SELECT cd.staff_name
           FROM public.customer_debts cd
          WHERE ((cd.customer_id = c.id) AND (cd.status = ANY (ARRAY['Unpaid'::text, 'Partially Paid'::text])))
          ORDER BY cd.incurred_at DESC
         LIMIT 1), (( SELECT u2.name
           FROM (public.sales s
             LEFT JOIN public.users u2 ON ((u2.id = s.created_by)))
          WHERE ((s.customerid = c.id) AND ((s.paymentmethod)::text = 'Charge'::text) AND ((s.status)::text = 'Unpaid'::text))
          ORDER BY s.saletimestamp DESC
         LIMIT 1))::text) AS utang_approved_by
   FROM (public.customers c
     LEFT JOIN public.users u ON ((u.id = c.created_by)));


--
-- Name: debt_additions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_additions (
    id integer NOT NULL,
    debt_id integer NOT NULL,
    date_incurred date DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'::text))::date NOT NULL,
    amount_added numeric NOT NULL,
    reason text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT debt_additions_amount_added_check CHECK ((amount_added > (0)::numeric))
);


--
-- Name: debt_additions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debt_additions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: debt_additions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debt_additions_id_seq OWNED BY public.debt_additions.id;


--
-- Name: debt_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_payments (
    id integer NOT NULL,
    debt_id integer,
    date_paid date NOT NULL,
    amount_paid numeric(10,2) NOT NULL
);


--
-- Name: debt_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debt_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: debt_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debt_payments_id_seq OWNED BY public.debt_payments.id;


--
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id integer NOT NULL,
    debt_date date NOT NULL,
    total_debt_amount numeric(10,2) NOT NULL,
    weekly_payment_amount numeric(10,2) NOT NULL,
    description text,
    type text DEFAULT 'company'::text,
    employee_id bigint,
    frequency text DEFAULT 'Weekly'::text
);


--
-- Name: debts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debts_id_seq OWNED BY public.debts.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    name text NOT NULL,
    default_salary numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    id bigint NOT NULL,
    salary_type character varying DEFAULT 'per_day'::character varying,
    container_multiplier integer
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_categories (
    id bigint NOT NULL,
    name text NOT NULL,
    created_by bigint,
    default_amount numeric(10,2) DEFAULT NULL::numeric,
    default_description text,
    is_recurring boolean DEFAULT false,
    recurring_day integer DEFAULT 1,
    is_recurring_daily boolean DEFAULT false
);


--
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.expense_categories ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.expense_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    created_by bigint,
    expense_date timestamp with time zone DEFAULT timezone('Asia/Manila'::text, now()) NOT NULL,
    employee_id bigint,
    employee_name character varying
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.expenses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: filter_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filter_configs (
    id text NOT NULL,
    name text NOT NULL,
    lifespan_days integer DEFAULT 28 NOT NULL,
    container_limit integer DEFAULT 1000 NOT NULL,
    cost numeric DEFAULT 0,
    pcs integer DEFAULT 1,
    purpose text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: filter_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filter_tracking (
    id bigint NOT NULL,
    filter_id text NOT NULL,
    last_replaced_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    replaced_by bigint,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: filter_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.filter_tracking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: filter_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.filter_tracking_id_seq OWNED BY public.filter_tracking.id;


--
-- Name: forgot_password_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forgot_password_config (
    id integer DEFAULT 1 NOT NULL,
    receiver_user_id bigint,
    receiver_name text DEFAULT 'Aranjit Archita'::text NOT NULL,
    receiver_email text DEFAULT 'aranjitarchita@gmail.com'::text NOT NULL,
    updated_by bigint,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT forgot_password_config_id_check CHECK ((id = 1))
);


--
-- Name: gallery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery (
    id_old uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    id bigint NOT NULL,
    category text DEFAULT 'General'::text,
    created_by bigint
);


--
-- Name: gallery_id_new_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gallery_id_new_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gallery_id_new_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gallery_id_new_seq OWNED BY public.gallery.id;


--
-- Name: incentives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incentives (
    id bigint NOT NULL,
    payout_date timestamp with time zone DEFAULT timezone('Asia/Manila'::text, now()) NOT NULL,
    base_weekly_sales numeric(12,2) NOT NULL,
    pool_amount numeric(12,2) NOT NULL,
    staff_name text NOT NULL,
    staff_percentage numeric(5,2) NOT NULL,
    final_amount numeric(12,2) NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT timezone('Asia/Manila'::text, now()) NOT NULL
);


--
-- Name: incentives_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.incentives_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incentives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.incentives_id_seq OWNED BY public.incentives.id;


--
-- Name: maintenance_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id text NOT NULL,
    item_type text NOT NULL,
    replaced_at timestamp with time zone NOT NULL,
    replaced_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    content text NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    id integer NOT NULL,
    updated_by bigint
);


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: page_views_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views_log (
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    id bigint NOT NULL
);


--
-- Name: page_views_log_id_bigint_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.page_views_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.page_views_log_id_bigint_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_requests (
    id bigint NOT NULL,
    user_id bigint,
    email text NOT NULL,
    reset_code text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_requests_id_seq OWNED BY public.password_reset_requests.id;


--
-- Name: product_3d_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_3d_assets (
    id bigint NOT NULL,
    asset_key text NOT NULL,
    label text NOT NULL,
    category text NOT NULL,
    description text,
    suggested_price numeric(10,2) DEFAULT 0,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    is_builtin boolean DEFAULT false NOT NULL
);


--
-- Name: product_3d_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product_3d_assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.product_3d_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    image_url text,
    barcode text,
    stock_quantity integer DEFAULT 0,
    min_stock_level integer DEFAULT 5,
    cost_price numeric(10,2) DEFAULT 0.00,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    parent_product_id bigint,
    conversion_rate integer DEFAULT 1,
    is_hidden boolean DEFAULT false,
    track_stock boolean DEFAULT true,
    icon_3d_key text
);


--
-- Name: COLUMN products.parent_product_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.products.parent_product_id IS 'Link to the parent Case/Pack product';


--
-- Name: COLUMN products.conversion_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.products.conversion_rate IS 'How many units are in the parent pack (e.g. 24)';


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.products ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: refill_game_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refill_game_logs (
    id bigint NOT NULL,
    player_key text NOT NULL,
    player_name text NOT NULL,
    is_guest boolean DEFAULT true NOT NULL,
    jug_type text DEFAULT 'round'::text NOT NULL,
    liters_filled numeric(5,2) NOT NULL,
    grade text NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    streak_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refill_game_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.refill_game_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.refill_game_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: refill_game_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refill_game_players (
    id bigint NOT NULL,
    player_key text NOT NULL,
    player_name text NOT NULL,
    is_guest boolean DEFAULT true NOT NULL,
    total_score integer DEFAULT 0 NOT NULL,
    best_single_score integer DEFAULT 0 NOT NULL,
    jugs_completed integer DEFAULT 0 NOT NULL,
    perfect_seals integer DEFAULT 0 NOT NULL,
    best_streak integer DEFAULT 0 NOT NULL,
    last_jug_type text DEFAULT 'round'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refill_game_players_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.refill_game_players ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.refill_game_players_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    sale_id bigint NOT NULL,
    product_id bigint,
    product_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    price_at_sale numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    cost_at_sale numeric(10,2) DEFAULT 0,
    id bigint NOT NULL,
    discount_amount numeric DEFAULT 0,
    notes text,
    is_custom boolean DEFAULT false
);


--
-- Name: sale_items_id_new_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sale_items ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sale_items_id_new_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sales ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: scanned_sales_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scanned_sales_logs (
    id bigint NOT NULL,
    image_url text NOT NULL,
    delivery_date date DEFAULT CURRENT_DATE NOT NULL,
    items_count integer DEFAULT 0 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    items_snapshot jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    scanned_by bigint,
    scanned_by_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scanned_sales_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.scanned_sales_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.scanned_sales_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id bigint NOT NULL,
    staff_id bigint,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    starting_cash numeric(10,2) DEFAULT 0,
    ending_cash numeric(10,2),
    total_sales_cash numeric(10,2) DEFAULT 0,
    status text DEFAULT 'OPEN'::text
);


--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shifts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: site_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_analytics (
    id integer DEFAULT 1 NOT NULL,
    view_count integer DEFAULT 0
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity_change integer NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    staff_id bigint,
    expiry_date date,
    remarks text
);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.stock_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_categories (
    id bigint NOT NULL,
    name character varying NOT NULL,
    description text,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_categories ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.user_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    lifespan_months integer NOT NULL,
    purpose text,
    created_at timestamp with time zone DEFAULT now(),
    lifespan_days integer DEFAULT 180,
    gallon_limit integer DEFAULT 2000
);


--
-- Name: view_spoilage_report; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_spoilage_report WITH (security_invoker='on') AS
 SELECT sm.id,
    p.name AS product_name,
    sm.type AS reason,
    abs(sm.quantity_change) AS quantity_lost,
    ((abs(sm.quantity_change))::numeric * COALESCE(p.cost_price, (0)::numeric)) AS total_loss_value,
    sm.created_at,
    u.name AS reported_by
   FROM ((public.stock_movements sm
     JOIN public.products p ON ((sm.product_id = p.id)))
     LEFT JOIN public.users u ON ((sm.staff_id = u.id)))
  WHERE (sm.type = ANY (ARRAY['damage'::text, 'expired'::text]));


--
-- Name: water_test_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.water_test_schedules (
    id integer DEFAULT 1 NOT NULL,
    next_test_date date DEFAULT (CURRENT_DATE + 15) NOT NULL,
    test_time text DEFAULT '09:00'::text NOT NULL,
    interval_days integer DEFAULT 30 NOT NULL,
    test_type text DEFAULT 'Monthly Bacteriological & Physico-Chemical Test'::text NOT NULL,
    notes text DEFAULT 'Water quality parameters are normal. Prepare sterile sample bottles prior to scheduled lab testing.'::text,
    last_tested_at timestamp with time zone,
    updated_by bigint,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: water_test_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.water_test_types (
    id bigint NOT NULL,
    name text NOT NULL,
    default_interval_days integer DEFAULT 30 NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: water_test_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.water_test_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.water_test_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: debt_additions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_additions ALTER COLUMN id SET DEFAULT nextval('public.debt_additions_id_seq'::regclass);


--
-- Name: debt_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments ALTER COLUMN id SET DEFAULT nextval('public.debt_payments_id_seq'::regclass);


--
-- Name: debts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts ALTER COLUMN id SET DEFAULT nextval('public.debts_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: filter_tracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_tracking ALTER COLUMN id SET DEFAULT nextval('public.filter_tracking_id_seq'::regclass);


--
-- Name: gallery id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery ALTER COLUMN id SET DEFAULT nextval('public.gallery_id_new_seq'::regclass);


--
-- Name: incentives id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentives ALTER COLUMN id SET DEFAULT nextval('public.incentives_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: password_reset_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests ALTER COLUMN id SET DEFAULT nextval('public.password_reset_requests_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- Name: business_settings business_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_settings
    ADD CONSTRAINT business_settings_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: customer_debts customer_debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_debts
    ADD CONSTRAINT customer_debts_pkey PRIMARY KEY (id);


--
-- Name: customers customers_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_id_key UNIQUE (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: debt_additions debt_additions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_additions
    ADD CONSTRAINT debt_additions_pkey PRIMARY KEY (id);


--
-- Name: debt_payments debt_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: employees employees_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_name_key UNIQUE (name);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: filter_configs filter_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_configs
    ADD CONSTRAINT filter_configs_pkey PRIMARY KEY (id);


--
-- Name: filter_tracking filter_tracking_filter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_tracking
    ADD CONSTRAINT filter_tracking_filter_id_key UNIQUE (filter_id);


--
-- Name: filter_tracking filter_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_tracking
    ADD CONSTRAINT filter_tracking_pkey PRIMARY KEY (id);


--
-- Name: forgot_password_config forgot_password_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forgot_password_config
    ADD CONSTRAINT forgot_password_config_pkey PRIMARY KEY (id);


--
-- Name: gallery gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery
    ADD CONSTRAINT gallery_pkey PRIMARY KEY (id);


--
-- Name: incentives incentives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentives
    ADD CONSTRAINT incentives_pkey PRIMARY KEY (id);


--
-- Name: maintenance_history maintenance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_history
    ADD CONSTRAINT maintenance_history_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: page_views_log page_views_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views_log
    ADD CONSTRAINT page_views_log_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: product_3d_assets product_3d_assets_asset_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_3d_assets
    ADD CONSTRAINT product_3d_assets_asset_key_key UNIQUE (asset_key);


--
-- Name: product_3d_assets product_3d_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_3d_assets
    ADD CONSTRAINT product_3d_assets_pkey PRIMARY KEY (id);


--
-- Name: products products_barcode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_barcode_key UNIQUE (barcode);


--
-- Name: products products_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_name_key UNIQUE (name);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: refill_game_logs refill_game_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refill_game_logs
    ADD CONSTRAINT refill_game_logs_pkey PRIMARY KEY (id);


--
-- Name: refill_game_players refill_game_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refill_game_players
    ADD CONSTRAINT refill_game_players_pkey PRIMARY KEY (id);


--
-- Name: refill_game_players refill_game_players_player_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refill_game_players
    ADD CONSTRAINT refill_game_players_player_key_key UNIQUE (player_key);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: scanned_sales_logs scanned_sales_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scanned_sales_logs
    ADD CONSTRAINT scanned_sales_logs_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: site_analytics site_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_analytics
    ADD CONSTRAINT site_analytics_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: user_categories user_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_categories
    ADD CONSTRAINT user_categories_name_key UNIQUE (name);


--
-- Name: user_categories user_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_categories
    ADD CONSTRAINT user_categories_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: water_test_schedules water_test_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_test_schedules
    ADD CONSTRAINT water_test_schedules_pkey PRIMARY KEY (id);


--
-- Name: water_test_types water_test_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_test_types
    ADD CONSTRAINT water_test_types_name_key UNIQUE (name);


--
-- Name: water_test_types water_test_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_test_types
    ADD CONSTRAINT water_test_types_pkey PRIMARY KEY (id);


--
-- Name: idx_debt_additions_debt_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debt_additions_debt_id ON public.debt_additions USING btree (debt_id);


--
-- Name: idx_products_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_barcode ON public.products USING btree (barcode);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name ON public.products USING gin (name public.gin_trgm_ops);


--
-- Name: idx_refill_logs_player_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refill_logs_player_key ON public.refill_game_logs USING btree (player_key, created_at DESC);


--
-- Name: idx_refill_players_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refill_players_score ON public.refill_game_players USING btree (total_score DESC, jugs_completed DESC);


--
-- Name: idx_sale_items_productid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_productid ON public.sale_items USING btree (product_id);


--
-- Name: idx_sale_items_saleid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_saleid ON public.sale_items USING btree (sale_id);


--
-- Name: idx_scanned_sales_logs_delivery_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scanned_sales_logs_delivery_date ON public.scanned_sales_logs USING btree (delivery_date DESC, created_at DESC);


--
-- Name: idx_stock_movements_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_date ON public.stock_movements USING btree (created_at);


--
-- Name: idx_stock_movements_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_product ON public.stock_movements USING btree (product_id);


--
-- Name: stock_movements_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_created_at_idx ON public.stock_movements USING btree (created_at);


--
-- Name: stock_movements_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_product_id_idx ON public.stock_movements USING btree (product_id);


--
-- Name: stock_movements_staff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_staff_id_idx ON public.stock_movements USING btree (staff_id);


--
-- Name: articles articles_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER articles_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: business_settings business_settings_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER business_settings_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: customers customers_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER customers_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: gallery gallery_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER gallery_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.gallery FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: notes handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: shifts n8n-end-shift; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "n8n-end-shift" AFTER UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://interconsonantal-mahalia-roentgenoscopic.ngrok-free.dev/webhook-test/end-shift', 'POST', '{"Content-type":"application/json"}', '{}', '5000');


--
-- Name: notes notes_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notes_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: page_views_log page_views_log_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER page_views_log_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.page_views_log FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: page_views_log page_views_log_limit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER page_views_log_limit_trigger AFTER INSERT ON public.page_views_log FOR EACH STATEMENT EXECUTE FUNCTION public.enforce_page_views_log_limit();


--
-- Name: products products_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER products_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: sale_items sale_items_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sale_items_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: sales sales_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sales_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: shifts shifts_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER shifts_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: site_analytics site_analytics_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER site_analytics_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.site_analytics FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: stock_movements stock_movements_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER stock_movements_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: page_views_log trg_limit_page_views; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_limit_page_views AFTER INSERT ON public.page_views_log FOR EACH ROW EXECUTE FUNCTION public.enforce_page_views_limit();


--
-- Name: page_views_log trg_page_views_log_keep_last_100; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_page_views_log_keep_last_100 AFTER INSERT ON public.page_views_log FOR EACH ROW EXECUTE FUNCTION public.page_views_log_keep_last_100();

ALTER TABLE public.page_views_log DISABLE TRIGGER trg_page_views_log_keep_last_100;


--
-- Name: page_views_log trg_page_views_log_limit_100; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_page_views_log_limit_100 AFTER INSERT ON public.page_views_log FOR EACH ROW EXECUTE FUNCTION public.page_views_log_limit_100();

ALTER TABLE public.page_views_log DISABLE TRIGGER trg_page_views_log_limit_100;


--
-- Name: users users_broadcast_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER users_broadcast_changes AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: customer_debts customer_debts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_debts
    ADD CONSTRAINT customer_debts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_debts customer_debts_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_debts
    ADD CONSTRAINT customer_debts_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: customer_debts customer_debts_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_debts
    ADD CONSTRAINT customer_debts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id);


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: debt_additions debt_additions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_additions
    ADD CONSTRAINT debt_additions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: debt_additions debt_additions_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_additions
    ADD CONSTRAINT debt_additions_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE CASCADE;


--
-- Name: debt_payments debt_payments_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE CASCADE;


--
-- Name: debts debts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: expense_categories expense_categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: filter_tracking filter_tracking_replaced_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filter_tracking
    ADD CONSTRAINT filter_tracking_replaced_by_fkey FOREIGN KEY (replaced_by) REFERENCES public.users(id);


--
-- Name: forgot_password_config forgot_password_config_receiver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forgot_password_config
    ADD CONSTRAINT forgot_password_config_receiver_user_id_fkey FOREIGN KEY (receiver_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: forgot_password_config forgot_password_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forgot_password_config
    ADD CONSTRAINT forgot_password_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gallery gallery_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery
    ADD CONSTRAINT gallery_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incentives incentives_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentives
    ADD CONSTRAINT incentives_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notes notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notes notes_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: password_reset_requests password_reset_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_parent_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_parent_product_id_fkey FOREIGN KEY (parent_product_id) REFERENCES public.products(id);


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales sales_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: scanned_sales_logs scanned_sales_logs_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scanned_sales_logs
    ADD CONSTRAINT scanned_sales_logs_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: users users_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.user_categories(id);


--
-- Name: water_test_schedules water_test_schedules_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_test_schedules
    ADD CONSTRAINT water_test_schedules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: water_test_types water_test_types_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_test_types
    ADD CONSTRAINT water_test_types_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: customers Allow ALL access for logged-in users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow ALL access for logged-in users" ON public.customers TO anon USING (true) WITH CHECK (true);


--
-- Name: incentives Allow all access for demo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access for demo" ON public.incentives USING (true) WITH CHECK (true);


--
-- Name: incentives Allow all access for staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access for staff" ON public.incentives USING (true) WITH CHECK (true);


--
-- Name: filter_tracking Allow all access on filter_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access on filter_tracking" ON public.filter_tracking USING (true) WITH CHECK (true);


--
-- Name: debt_additions Allow all access to debt_additions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to debt_additions" ON public.debt_additions USING (true) WITH CHECK (true);


--
-- Name: debt_payments Allow all access to debt_payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to debt_payments" ON public.debt_payments USING (true) WITH CHECK (true);


--
-- Name: debts Allow all access to debts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to debts" ON public.debts USING (true) WITH CHECK (true);


--
-- Name: articles Allow all for admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for admins" ON public.articles USING (true) WITH CHECK (true);


--
-- Name: expense_categories Allow all for demo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for demo" ON public.expense_categories USING (true) WITH CHECK (true);


--
-- Name: expenses Allow all for demo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for demo" ON public.expenses USING (true) WITH CHECK (true);


--
-- Name: gallery Allow all for demo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for demo" ON public.gallery USING (true) WITH CHECK (true);


--
-- Name: business_settings Allow all operations for staff/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations for staff/admin" ON public.business_settings USING (true) WITH CHECK (true);


--
-- Name: notes Allow all operations on notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on notes" ON public.notes USING (true) WITH CHECK (true);


--
-- Name: activity_logs Allow all to insert activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all to insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);


--
-- Name: activity_logs Allow all to read activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all to read activity logs" ON public.activity_logs FOR SELECT USING (true);


--
-- Name: customers Allow anon all customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon all customers" ON public.customers TO anon USING (true) WITH CHECK (true);


--
-- Name: customer_debts Allow anon full access to customer_debts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to customer_debts" ON public.customer_debts TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: filter_configs Allow anon full access to filter_configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to filter_configs" ON public.filter_configs TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: gallery Allow anon full access to gallery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to gallery" ON public.gallery TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: sale_items Allow anon full access to sale_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to sale_items" ON public.sale_items TO anon USING (true) WITH CHECK (true);


--
-- Name: scanned_sales_logs Allow anon full access to scanned_sales_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to scanned_sales_logs" ON public.scanned_sales_logs TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: water_test_schedules Allow anon full access to water_test_schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to water_test_schedules" ON public.water_test_schedules TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: water_test_types Allow anon full access to water_test_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon full access to water_test_types" ON public.water_test_types TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: customers Allow anon read customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon read customers" ON public.customers FOR SELECT TO anon USING (true);


--
-- Name: customers Allow anon write customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon write customers" ON public.customers TO anon USING (true) WITH CHECK (true);


--
-- Name: users Allow authenticated read access on users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read access on users" ON public.users FOR SELECT TO authenticated USING (true);


--
-- Name: user_categories Allow authenticated read access to user categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read access to user categories" ON public.user_categories FOR SELECT TO authenticated USING (true);


--
-- Name: contact_messages Allow delete contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete contact messages" ON public.contact_messages FOR DELETE TO authenticated, anon USING (true);


--
-- Name: users Allow delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated users" ON public.users FOR DELETE TO authenticated USING (true);


--
-- Name: products Allow delete for non-demo users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users" ON public.products FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: articles Allow delete for non-demo users on articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users on articles" ON public.articles FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: customers Allow delete for non-demo users on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users on customers" ON public.customers FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: expenses Allow delete for non-demo users on expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users on expenses" ON public.expenses FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: gallery Allow delete for non-demo users on gallery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users on gallery" ON public.gallery FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: incentives Allow delete for non-demo users on incentives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users on incentives" ON public.incentives FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: sales Allow delete for non-demo users on sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for non-demo users on sales" ON public.sales FOR DELETE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: debt_payments Allow full access for authenticated users on debt_payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow full access for authenticated users on debt_payments" ON public.debt_payments TO authenticated USING (true) WITH CHECK (true);


--
-- Name: debts Allow full access for authenticated users on debts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow full access for authenticated users on debts" ON public.debts TO authenticated USING (true) WITH CHECK (true);


--
-- Name: users Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.users FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: products Allow insert for non-demo users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users" ON public.products FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: articles Allow insert for non-demo users on articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users on articles" ON public.articles FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: customers Allow insert for non-demo users on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users on customers" ON public.customers FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: expenses Allow insert for non-demo users on expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users on expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: gallery Allow insert for non-demo users on gallery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users on gallery" ON public.gallery FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: incentives Allow insert for non-demo users on incentives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users on incentives" ON public.incentives FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: sales Allow insert for non-demo users on sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for non-demo users on sales" ON public.sales FOR INSERT TO authenticated WITH CHECK ((public.is_demo_user() = false));


--
-- Name: debt_payments Allow public access to debt_payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public access to debt_payments" ON public.debt_payments USING (true) WITH CHECK (true);


--
-- Name: debts Allow public access to debts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public access to debts" ON public.debts USING (true) WITH CHECK (true);


--
-- Name: user_categories Allow public delete on user_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on user_categories" ON public.user_categories FOR DELETE USING (true);


--
-- Name: contact_messages Allow public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert" ON public.contact_messages FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: page_views_log Allow public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert" ON public.page_views_log FOR INSERT WITH CHECK (true);


--
-- Name: user_categories Allow public insert on user_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on user_categories" ON public.user_categories FOR INSERT WITH CHECK (true);


--
-- Name: refill_game_logs Allow public insert refill_game_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert refill_game_logs" ON public.refill_game_logs FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: refill_game_players Allow public insert refill_game_players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert refill_game_players" ON public.refill_game_players FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: page_views_log Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.page_views_log FOR SELECT USING (true);


--
-- Name: articles Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.articles FOR SELECT USING ((is_published = true));


--
-- Name: business_settings Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.business_settings FOR SELECT USING (true);


--
-- Name: expense_categories Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.expense_categories FOR SELECT USING (true);


--
-- Name: expenses Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.expenses FOR SELECT USING (true);


--
-- Name: gallery Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.gallery FOR SELECT USING (true);


--
-- Name: site_analytics Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.site_analytics FOR SELECT USING (true);


--
-- Name: user_categories Allow public read access on user_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on user_categories" ON public.user_categories FOR SELECT USING (true);


--
-- Name: refill_game_logs Allow public read refill_game_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read refill_game_logs" ON public.refill_game_logs FOR SELECT TO authenticated, anon USING (true);


--
-- Name: refill_game_players Allow public read refill_game_players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read refill_game_players" ON public.refill_game_players FOR SELECT TO authenticated, anon USING (true);


--
-- Name: user_categories Allow public update on user_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on user_categories" ON public.user_categories FOR UPDATE USING (true);


--
-- Name: refill_game_players Allow public update refill_game_players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update refill_game_players" ON public.refill_game_players FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: contact_messages Allow read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access" ON public.contact_messages FOR SELECT USING (true);


--
-- Name: products Allow read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access" ON public.products FOR SELECT TO authenticated USING (true);


--
-- Name: articles Allow read access on articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on articles" ON public.articles FOR SELECT TO authenticated USING (true);


--
-- Name: customers Allow read access on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on customers" ON public.customers FOR SELECT TO authenticated USING (true);


--
-- Name: expenses Allow read access on expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on expenses" ON public.expenses FOR SELECT TO authenticated USING (true);


--
-- Name: gallery Allow read access on gallery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on gallery" ON public.gallery FOR SELECT TO authenticated USING (true);


--
-- Name: incentives Allow read access on incentives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on incentives" ON public.incentives FOR SELECT TO authenticated USING (true);


--
-- Name: sales Allow read access on sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on sales" ON public.sales FOR SELECT TO authenticated USING (true);


--
-- Name: product_3d_assets Allow read product_3d_assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read product_3d_assets" ON public.product_3d_assets FOR SELECT TO authenticated, anon USING (true);


--
-- Name: notes Allow update access on notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update access on notes" ON public.notes FOR UPDATE TO authenticated USING (true);


--
-- Name: users Allow update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated users" ON public.users FOR UPDATE TO authenticated USING (true);


--
-- Name: products Allow update for non-demo users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users" ON public.products FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: articles Allow update for non-demo users on articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users on articles" ON public.articles FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: customers Allow update for non-demo users on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users on customers" ON public.customers FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: expenses Allow update for non-demo users on expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users on expenses" ON public.expenses FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: gallery Allow update for non-demo users on gallery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users on gallery" ON public.gallery FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: incentives Allow update for non-demo users on incentives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users on incentives" ON public.incentives FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: sales Allow update for non-demo users on sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for non-demo users on sales" ON public.sales FOR UPDATE TO authenticated USING ((public.is_demo_user() = false));


--
-- Name: product_3d_assets Allow write product_3d_assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow write product_3d_assets" ON public.product_3d_assets TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: employees Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.employees FOR DELETE USING (true);


--
-- Name: maintenance_history Enable full access for all on maintenance_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable full access for all on maintenance_history" ON public.maintenance_history USING (true) WITH CHECK (true);


--
-- Name: vehicles Enable full access for all on vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable full access for all on vehicles" ON public.vehicles USING (true) WITH CHECK (true);


--
-- Name: contact_messages Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: employees Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.employees FOR INSERT WITH CHECK (true);


--
-- Name: activity_logs Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: contact_messages Enable read access for admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for admins" ON public.contact_messages FOR SELECT TO authenticated USING ((( SELECT (auth.jwt() ->> 'role'::text)) = 'admin'::text));


--
-- Name: contact_messages Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.contact_messages FOR SELECT USING (true);


--
-- Name: employees Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);


--
-- Name: activity_logs Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.activity_logs FOR SELECT TO authenticated USING (true);


--
-- Name: employees Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.employees FOR UPDATE USING (true);


--
-- Name: users Only admins can delete users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete users" ON public.users FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_categories c
  WHERE ((c.id = users.category_id) AND ((c.name)::text = 'Admin'::text)))));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: products all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "all" ON public.products TO anon USING (true) WITH CHECK (true);


--
-- Name: sale_items all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "all" ON public.sale_items TO anon USING (true) WITH CHECK (true);


--
-- Name: shifts all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "all" ON public.shifts TO anon USING (true) WITH CHECK (true);


--
-- Name: stock_movements all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "all" ON public.stock_movements TO anon USING (true) WITH CHECK (true);


--
-- Name: users all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "all" ON public.users TO anon USING (true) WITH CHECK (true);


--
-- Name: sales allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "allow all" ON public.sales TO anon USING (true) WITH CHECK (true);


--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: business_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_debts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: debt_additions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debt_additions ENABLE ROW LEVEL SECURITY;

--
-- Name: debt_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: debts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: expense_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: filter_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.filter_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: filter_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.filter_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

--
-- Name: incentives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views_log ENABLE ROW LEVEL SECURITY;

--
-- Name: product_3d_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_3d_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: refill_game_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refill_game_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: refill_game_players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refill_game_players ENABLE ROW LEVEL SECURITY;

--
-- Name: sale_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

--
-- Name: sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

--
-- Name: scanned_sales_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scanned_sales_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

--
-- Name: site_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: water_test_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.water_test_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: water_test_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.water_test_types ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


