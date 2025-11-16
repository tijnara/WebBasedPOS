import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useTopProductsSummary(limit = 5) {
  return useQuery({
    queryKey: ['top-products-summary', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_products_summary', { limit_count: limit });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

