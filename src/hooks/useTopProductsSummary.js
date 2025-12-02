import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useTopProductsSummary(limit = 5) {
  return useQuery({
    queryKey: ['top-products-summary', limit],
    queryFn: async () => {
      // FIX: Changed 'limit_count' to 'p_limit' to match the new SQL function definition
      const { data, error } = await supabase.rpc('get_top_products_summary', { p_limit: limit });

      if (error) {
        console.error("RPC Error:", error); // Added logging for easier debugging
        throw error;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

