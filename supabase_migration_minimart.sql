-- Mini Mart Feature Migration
-- Run this in your Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Add comment for documentation
COMMENT ON COLUMN products.barcode IS 'Unique barcode/SKU for product scanning';
COMMENT ON COLUMN products.stock_quantity IS 'Current stock quantity available';
COMMENT ON COLUMN products.min_stock_level IS 'Minimum stock level before alert';
COMMENT ON COLUMN products.cost_price IS 'Cost price (purchase price) for profit calculation';
COMMENT ON COLUMN products.category IS 'Product category (Snacks, Drinks, etc.)';

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_products_summary(limit_count integer)
RETURNS TABLE(name text, quantity bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si."productName" AS name,
    SUM(si.quantity) AS quantity
  FROM sale_items si
  GROUP BY si."productName"
  ORDER BY quantity DESC
  LIMIT limit_count;
END;
$$;

-- Function to get overall sales summary
CREATE OR REPLACE FUNCTION get_sales_summary()
RETURNS TABLE("totalSales" bigint, "totalRevenue" numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS "totalSales",
    SUM(s."totalAmount") AS "totalRevenue"
  FROM sales s;
END;
$$;

-- Function to get sales aggregated by date
CREATE OR REPLACE FUNCTION get_sales_by_date_summary()
RETURNS TABLE(sale_date date, total_sales numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(s."saleTimestamp") AS sale_date,
    SUM(s."totalAmount") AS total_sales
  FROM sales s
  GROUP BY DATE(s."saleTimestamp")
  ORDER BY sale_date;
END;
$$;

-- Function to get new customers aggregated by date
CREATE OR REPLACE FUNCTION get_new_customers_by_date_summary()
RETURNS TABLE(customer_date date, total_customers bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(c.created_at) AS customer_date,
    COUNT(*) AS total_customers
  FROM customers c
  GROUP BY DATE(c.created_at)
  ORDER BY customer_date;
END;
$$;

-- Function to get inactive customers
CREATE OR REPLACE FUNCTION get_inactive_customers(days_inactive integer)
RETURNS TABLE(id uuid, name text, last_order_date timestamp with time zone)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    MAX(s."saleTimestamp") AS last_order_date
  FROM customers c
  LEFT JOIN sales s ON c.id = s."customerId"
  GROUP BY c.id, c.name
  HAVING MAX(s."saleTimestamp") < NOW() - (days_inactive || ' days')::interval
  OR MAX(s."saleTimestamp") IS NULL;
END;
$$;

-- Function to safely decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id;
END;
$$;
