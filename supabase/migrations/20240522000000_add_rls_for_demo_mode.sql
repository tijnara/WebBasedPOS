-- 1. Create a helper function to check if the current user is a demo user
CREATE OR REPLACE FUNCTION is_demo_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT is_demo FROM public.users WHERE id = auth.uid();
$$;

-- 2. Apply this condition to your tables' INSERT, UPDATE, and DELETE policies
-- Example for the 'products' table:

-- Allow SELECT for everyone (including demo users)
CREATE POLICY "Allow read access" ON public.products
  FOR SELECT TO authenticated USING (true);

-- Block INSERT, UPDATE, DELETE for demo users
CREATE POLICY "Allow insert for non-demo users" ON public.products
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);

CREATE POLICY "Allow update for non-demo users" ON public.products
  FOR UPDATE TO authenticated USING (is_demo_user() = false);

CREATE POLICY "Allow delete for non-demo users" ON public.products
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Repeat the policy creation for all restricted tables:
-- customers, inventory, gallery, expenses, incentives, articles, settings.

-- Policies for 'customers' table
CREATE POLICY "Allow read access on customers" ON public.customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on customers" ON public.customers
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on customers" ON public.customers
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'sales' table
CREATE POLICY "Allow read access on sales" ON public.sales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on sales" ON public.sales
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on sales" ON public.sales
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'expenses' table
CREATE POLICY "Allow read access on expenses" ON public.expenses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on expenses" ON public.expenses
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'articles' table
CREATE POLICY "Allow read access on articles" ON public.articles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on articles" ON public.articles
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on articles" ON public.articles
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on articles" ON public.articles
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'inventory' table
CREATE POLICY "Allow read access on inventory" ON public.inventory
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on inventory" ON public.inventory
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on inventory" ON public.inventory
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on inventory" ON public.inventory
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'gallery' table
CREATE POLICY "Allow read access on gallery" ON public.gallery
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on gallery" ON public.gallery
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on gallery" ON public.gallery
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on gallery" ON public.gallery
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'incentives' table
CREATE POLICY "Allow read access on incentives" ON public.incentives
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on incentives" ON public.incentives
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on incentives" ON public.incentives
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on incentives" ON public.incentives
  FOR DELETE TO authenticated USING (is_demo_user() = false);

-- Policies for 'settings' table
CREATE POLICY "Allow read access on settings" ON public.settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for non-demo users on settings" ON public.settings
  FOR INSERT TO authenticated WITH CHECK (is_demo_user() = false);
CREATE POLICY "Allow update for non-demo users on settings" ON public.settings
  FOR UPDATE TO authenticated USING (is_demo_user() = false);
CREATE POLICY "Allow delete for non-demo users on settings" ON public.settings
  FOR DELETE TO authenticated USING (is_demo_user() = false);
