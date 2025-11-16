import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useSalesByDateSummary() {
  return useQuery({
    queryKey: ['sales-by-date-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_by_date_summary');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

