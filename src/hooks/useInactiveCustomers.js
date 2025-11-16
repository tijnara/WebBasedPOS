import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// Demo mode mock data
const MOCK_INACTIVE_CUSTOMERS = [
    { id: 'mock-c-98', name: 'Old Customer', phone: '09123456789', last_order_date: '2025-10-01T10:00:00Z' },
    { id: 'mock-c-99', name: 'New Customer (No Orders)', phone: '09987654321', last_order_date: null },
];

export function useInactiveCustomers(days_inactive = 14) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['inactive-customers', days_inactive, isDemo],
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 300));
                return MOCK_INACTIVE_CUSTOMERS;
            }
            const { data, error } = await supabase.rpc('get_inactive_customers', {
                days_inactive: days_inactive
            });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
