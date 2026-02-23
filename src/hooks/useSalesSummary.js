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
        costAmount: 40.00,
        items: [{ productName: 'Refill(20)', quantity: 2 }]
    },
    {
        id: 'mock-s-2',
        saleTimestamp: new Date('2025-11-02T15:30:00'),
        totalAmount: 99.00,
        costAmount: 70.00,
        items: [{ productName: 'Refill(25)', quantity: 3 }]
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

                let totalRevenue = 0;
                let totalProfit = 0;
                let totalRefill20 = 0;
                let totalRefill25 = 0;
                let firstTransactionDate = null;

                filtered.forEach(sale => {
                    totalRevenue += Number(sale.totalAmount || 0);
                    totalProfit += (Number(sale.totalAmount) - Number(sale.costAmount || sale.totalAmount * 0.7));
                    if (sale.items) {
                        sale.items.forEach(item => {
                            // Normalize name to handle spaces like "Refill (20)"
                            const name = (item.productName || '').trim().replace(/\s+/g, '');
                            if (name === 'Refill(20)') totalRefill20 += (item.quantity || 0);
                            if (name === 'Refill(25)') totalRefill25 += (item.quantity || 0);
                        });
                    }

                    const sDate = new Date(sale.saleTimestamp);
                    if (!firstTransactionDate || sDate < firstTransactionDate) {
                        firstTransactionDate = sDate;
                    }
                });

                return { totalRevenue, totalProfit, totalRefill20, totalRefill25, firstTransactionDate };
            }

            // --- REAL DATABASE LOGIC ---
            let query = supabase
                .from('sale_items')
                .select(`
                    price_at_sale,
                    cost_at_sale,
                    quantity,
                    product_name,
                    sales!inner (saletimestamp)
                `);

            if (startDate) query = query.gte('sales.saletimestamp', startDate.toISOString());
            if (endDate) query = query.lte('sales.saletimestamp', endDate.toISOString());

            const { data, error } = await query;
            if (error) throw error;

            let totalRevenue = 0;
            let totalProfit = 0;
            let totalRefill20 = 0;
            let totalRefill25 = 0;
            let firstTransactionDate = null;

            if (data && Array.isArray(data)) {
                data.forEach(item => {
                    const qty = item.quantity || 0;
                    const revenue = (item.price_at_sale || 0) * qty;
                    const cost = (item.cost_at_sale || 0) * qty;

                    totalRevenue += revenue;
                    totalProfit += (revenue - cost);

                    // Normalize name to ensure we catch "Refill (20)" or "Refill(20)"
                    const name = (item.product_name || '').trim().replace(/\s+/g, '');
                    if (name === 'Refill(20)') {
                        totalRefill20 += qty;
                    } else if (name === 'Refill(25)') {
                        totalRefill25 += qty;
                    }

                    // Track the very first transaction date
                    if (item.sales && item.sales.saletimestamp) {
                        const sDate = new Date(item.sales.saletimestamp);
                        if (!firstTransactionDate || sDate < firstTransactionDate) {
                            firstTransactionDate = sDate;
                        }
                    }
                });
            }

            return { totalRevenue, totalProfit, totalRefill20, totalRefill25, firstTransactionDate };
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
    });
}