// src/hooks/useTopProductsSummary.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_TOP_PRODUCTS = [
    { product_id: 'mock-p-1', name: 'Mock Alkaline (5 Gal)', total_quantity: 42, total_revenue: 56868.22 },
    { product_id: 'mock-p-2', name: 'Mock Purified (5 Gal)', total_quantity: 35, total_revenue: 27112.40 },
    { product_id: 'mock-p-3', name: 'Mock Mineral (1L)', total_quantity: 20, total_revenue: 25125.32 },
];

export function useTopProductsSummary(limit = 5) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['top-products-summary', isDemo, limit],
        queryFn: async () => {
            if (isDemo) {
                return MOCK_TOP_PRODUCTS.slice(0, limit);
            }

            const { data, error } = await supabase.rpc('get_top_products', { limit_val: limit });

            if (error) {
                console.error("Error fetching top products:", error);
                throw error;
            }
            
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
