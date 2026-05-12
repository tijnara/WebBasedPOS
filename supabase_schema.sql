-- SQL Schema for Gallery Feature

-- 1. Create the gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS) - OPTIONAL
-- NOTE: The current project uses a custom login system. If you want to use RLS, 
-- you should switch to Supabase Auth. For now, we enable it but allow public access
-- to avoid breaking the demonstration.
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Allow public read access to gallery items
CREATE POLICY "Allow public read access" ON public.gallery
    FOR SELECT USING (true);

-- Allow public insert/update/delete (FOR DEMO ONLY - INSECURE)
-- In a real app, you would use auth.uid() and check for Admin role.
CREATE POLICY "Allow all for demo" ON public.gallery
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Set up storage (if not already set up)
-- The app uses the 'products' bucket for gallery images as well.
-- Ensure the 'products' bucket is public.
-- Create incentives table with bigint primary key
CREATE TABLE IF NOT EXISTS public.incentives (
    id BIGSERIAL PRIMARY KEY,
    payout_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    base_weekly_sales NUMERIC(12,2) NOT NULL, -- The "Current Week Sales" value
    pool_amount NUMERIC(12,2) NOT NULL,        -- The calculated 25% pool
    staff_name TEXT NOT NULL,
    staff_percentage NUMERIC(5,2) NOT NULL,    -- Staff share percentage (e.g. 50%)
    final_amount NUMERIC(12,2) NOT NULL,       -- Final payout amount
    created_by BIGINT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for staff" ON public.incentives FOR ALL USING (true) WITH CHECK (true);

