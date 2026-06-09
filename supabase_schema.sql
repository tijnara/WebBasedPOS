-- SQL Schema for Seaside POS

-- ----------------------------------------------------------------
-- 1. Users Table
-- Stores user information for authentication and roles.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Note: Storing plain text passwords is not secure. Consider using Supabase Auth or a custom hashing solution.
    phone TEXT,
    role TEXT DEFAULT 'Staff',
    isadmin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------
-- 2. Products Table
-- Stores all product information.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00,
    category TEXT,
    image_url TEXT,
    barcode TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    is_hidden BOOLEAN DEFAULT false,
    parent_product_id BIGINT REFERENCES public.products(id),
    conversion_rate INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------
-- 3. Gallery Table
-- For the landing page gallery feature.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------
-- 4. Incentives Table
-- For staff sales incentives.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incentives (
    id BIGSERIAL PRIMARY KEY,
    payout_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    base_weekly_sales NUMERIC(12,2) NOT NULL,
    pool_amount NUMERIC(12,2) NOT NULL,
    staff_name TEXT NOT NULL,
    staff_percentage NUMERIC(5,2) NOT NULL,
    final_amount NUMERIC(12,2) NOT NULL,
    created_by BIGINT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------

-- Policies for 'gallery' table
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Allow all for demo on gallery" ON public.gallery FOR ALL USING (true) WITH CHECK (true);

-- Policies for 'incentives' table
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for staff on incentives" ON public.incentives FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- Functions
-- ----------------------------------------------------------------

-- Function for custom user authentication
CREATE OR REPLACE FUNCTION authenticate_user(p_email TEXT, p_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user RECORD;
BEGIN
  -- Query the custom users table for a matching email and password
  SELECT id, name, email, phone, role, isadmin
  INTO found_user
  FROM public.users
  WHERE email = p_email AND password = p_password;

  -- Return user payload if credentials match, otherwise return null
  IF FOUND THEN
    RETURN row_to_json(found_user);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;