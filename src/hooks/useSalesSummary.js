// src/hooks/useSalesSummary.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import currency from 'currency.js';

// Demo summary for mock data
const MOCK_SALES = [
    {
        id: 'mock-s-1',
        saleTimestamp: new Date('2025-11-03T09:00:00'),
        totalAmount: 60.00,
        costAmount: 40.00, // Mock cost
    },
    {
        id: 'mock-s-2',
        saleTimestamp: new Date('2025-11-02T15:30:00'),
        totalAmount: 99.00,
        costAmount: 70.00, // Mock cost
    }
];

export function useSalesSummary({ startDate, endDate } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    
    return useQuery({
        queryKey: ['sales-summary', isDemo, startDate, endDate],
        queryFn: async () => {
            if (isDemo) {
                let filtered = MOCK_SALES;
                if (startDate) filtered = filtered.filter(s => s.saleTimestamp >= startDate);
                if (endDate) filtered = filtered.filter(s => s.saleTimestamp <= endDate);
                
                const totalRevenue = filtered.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
                // Approx 30% profit margin for demo
                const totalProfit = filtered.reduce((sum, sale) => sum + (Number(sale.totalAmount) - Number(sale.costAmount || sale.totalAmount * 0.7)), 0);
                
                return { totalRevenue, totalProfit };
            }

            // --- REAL DATABASE LOGIC ---
            // We query sale_items to get price AND cost for accurate profit calculation
            // We perform an inner join on sales to filter by date
            let query = supabase
                .from('sale_items')
                .select(`
                    price_at_sale,
                    cost_at_sale,
                    quantity,
                    sales!inner (saletimestamp)
                `);

            if (startDate) query = query.gte('sales.saletimestamp', startDate.toISOString());
            if (endDate) query = query.lte('sales.saletimestamp', endDate.toISOString());

            const { data, error } = await query;
            if (error) throw error;

            let totalRevenue = 0;
            let totalProfit = 0;

            if (data && Array.isArray(data)) {
                data.forEach(item => {
                    const qty = item.quantity || 0;
                    const revenue = (item.price_at_sale || 0) * qty;
                    const cost = (item.cost_at_sale || 0) * qty;
                    
                    totalRevenue += revenue;
                    totalProfit += (revenue - cost);
                });
            }

            return { totalRevenue, totalProfit };
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
    });
}
