import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_CUSTOMERS = [
  { id: 'mock-c-1', name: 'Demo Customer A', phone: '09110000001', address: '123 Demo St.' },
  { id: 'mock-c-2', name: 'Demo Customer B', phone: '09110000002', address: '456 Demo Ave.' },
  { id: 'mock-c-3', name: 'Demo Customer C', phone: '09110000003', address: '789 Demo Blvd.' },
];

export function useCustomers() {
  const isDemo = useStore(s => s.user?.isDemo);
  return useQuery({
    queryKey: ['customers', isDemo],
    queryFn: async () => {
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return MOCK_CUSTOMERS;
      }
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
