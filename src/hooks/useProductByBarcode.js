// src/hooks/useProductByBarcode.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import currency from 'currency.js';

export function useProductByBarcode(barcode, storeId = null) {
  const userStoreId = useStore(s => s.user?.store_id);
  const targetStoreId = Number(storeId || userStoreId) || 1;

  return useQuery({
    queryKey: ['product-by-barcode', targetStoreId, barcode],
    queryFn: async () => {
      if (!barcode) return null;

      const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', targetStoreId)
          .eq('barcode', barcode)
          .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

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
    enabled: !!barcode && /^[0-9]{3,}$/.test(barcode),
    retry: false,
    staleTime: 1000 * 5,
  });
}