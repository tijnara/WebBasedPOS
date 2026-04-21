// src/hooks/useTopCustomers.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// Mock data for demo accounts
const MOCK_TOP_CUSTOMERS = [
    { name: 'Demo Customer A', total_revenue: 1500.50, order_count: 15 },
    { name: 'Demo Customer B', total_revenue: 1250.00, order_count: 12 },
    { name: 'Demo Walk-in', total_revenue: 980.25, order_count: 50 },
    { name: 'Demo Customer C', total_revenue: 750.75, order_count: 8 },
    { name: 'Demo Customer D', total_revenue: 500.00, order_count: 5 },
    { name: 'Demo Customer E', total_revenue: 450.50, order_count: 6 },
    { name: 'Demo Customer F', total_revenue: 300.00, order_count: 4 },
    { name: 'Demo Customer G', total_revenue: 250.25, order_count: 3 },
    { name: 'Demo Customer H', total_revenue: 150.00, order_count: 2 },
    { name: 'Demo Customer I', total_revenue: 75.50, order_count: 1 },
];


export function useTopCustomers({ limit = 10 } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['topCustomers', isDemo, limit],
        queryFn: async () => {
            if (isDemo) {
                // The mock data should match the RPC output structure
                return MOCK_TOP_CUSTOMERS.slice(0, limit).map(c => ({
                    ...c,
                    name: c.name, // Ensure field names are consistent if needed by UI
                    total_revenue: c.total_revenue,
                    order_count: c.order_count,
                }));
            }

            const { data, error } = await supabase.rpc('get_top_customers', { limit_val: limit });

            if (error) {
                console.error("Error fetching top customers:", error);
                throw error;
            }

            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
