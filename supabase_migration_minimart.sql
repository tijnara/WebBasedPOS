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

