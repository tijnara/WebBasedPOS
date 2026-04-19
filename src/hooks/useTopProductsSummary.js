// src/hooks/useTopProductsSummary.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_TOP_PRODUCTS = [
    { id: 'mock-p-1', name: 'Mock Alkaline (5 Gal)', quantity: 42, revenue: 56868.22 },
    { id: 'mock-p-2', name: 'Mock Purified (5 Gal)', quantity: 35, revenue: 27112.40 },
    { id: 'mock-p-3', name: 'Mock Mineral (1L)', quantity: 20, revenue: 25125.32 },
];

export function useTopProductsSummary(limit = 5) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['top-products-summary', isDemo, limit],
        queryFn: async () => {
            if (isDemo) {
                return MOCK_TOP_PRODUCTS.slice(0, limit);
            }

            // Fetch all sale_items joined with products via FK (product_id → products.id)
            // Paginate to bypass Supabase's 1000-row default limit
            let allItems = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('sale_items')
                    .select(`
                        product_id,
                        quantity,
                        subtotal,
                        products (
                            id,
                            name,
                            is_hidden
                        )
                    `)
                    .range(from, from + step - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allItems.push(...data);
                }

                if (!data || data.length < step) {
                    hasMore = false;
                } else {
                    from += step;
                }
            }

            // Group by product_id, using the product's canonical name from the products table
            const productMap = {};
            allItems.forEach(item => {
                const pid = item.product_id;
                // Skip items whose product has been marked hidden
                if (item.products?.is_hidden) return;

                const name = item.products?.name || 'Unknown Product';
                const qty = item.quantity || 0;
                const revenue = parseFloat(item.subtotal) || 0;

                if (pid) {
                    if (!productMap[pid]) {
                        productMap[pid] = { id: pid, name, quantity: 0, revenue: 0 };
                    }
                    productMap[pid].quantity += qty;
                    productMap[pid].revenue += revenue;
                }
            });

            // Sort by total revenue (descending) and return top N
            return Object.values(productMap)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, limit);
        },
        staleTime: 1000 * 60 * 5,
    });
}
