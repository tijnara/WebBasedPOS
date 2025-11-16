import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useNewCustomersByDateSummary() {
  return useQuery({
    queryKey: ['new-customers-by-date-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_new_customers_by_date_summary');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}
