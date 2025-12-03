// src/hooks/useProductByBarcode.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import currency from 'currency.js';

/**
 * Fetches a single product directly from the database by its barcode.
 * This hook is optimized to only run when a valid-looking barcode is provided.
 * @param {string} barcode - The barcode to search for.
 */
export function useProductByBarcode(barcode) {
  return useQuery({
    queryKey: ['product-by-barcode', barcode],
    queryFn: async () => {
      // Don't run if barcode is empty
      if (!barcode) return null;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single(); // Expect only one product per barcode

      if (error) {
        // 'PGRST116' is the code for "No rows found", which is not a true error for scanning.
        // It just means the barcode doesn't exist. We return null.
        if (error.code === 'PGRST116') {
          return null;
        }
        // For other errors, we should throw them to be caught by React Query.
        throw error;
      }

      // If data is found, map it to the consistent product structure used elsewhere.
      const p = data;
      return {
        id: p.id,
        name: p.name || 'Unnamed Product',
        price: currency(p.price).value || 0,
        image_url: p.image_url || null,
        barcode: p.barcode || '',
        stock: p.stock_quantity || 0,
        minStock: p.min_stock_level || 0,
        cost: currency(p.cost_price).value || 0,
        category: p.category || 'General',
        created_at: p.created_at || null,
        updated_at: p.updated_at || null,
      };
    },
    // --- OPTIMIZATION ---
    // 1. `enabled`: The query will only execute if `barcode` is a non-empty string
    //    that consists of 3 or more digits. This prevents firing on every keystroke.
    // 2. `retry: false`: If a barcode is not found, don't retry the request.
    // 3. `staleTime`: Caches the result briefly to prevent re-fetching the same barcode instantly.
    enabled: !!barcode && /^[0-9]{3,}$/.test(barcode),
    retry: false,
    staleTime: 1000 * 5, // 5 seconds
  });
}

