// src/hooks/useSalesByDateSummary.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useSalesByDateSummary(storeId = null) {
  const userStoreId = useStore(s => s.user?.store_id);
  const targetStoreId = Number(storeId || userStoreId) || 1;

  return useQuery({
    queryKey: ['sales-by-date-summary', targetStoreId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_by_date_summary', {
        p_store_id: targetStoreId
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}