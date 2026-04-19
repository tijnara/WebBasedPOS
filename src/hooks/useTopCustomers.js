// src/hooks/useTopCustomers.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import currency from 'currency.js';

// Mock data for demo accounts
const MOCK_TOP_CUSTOMERS = [
    { name: 'Demo Customer A', totalRevenue: 1500.50, orderCount: 15 },
    { name: 'Demo Customer B', totalRevenue: 1250.00, orderCount: 12 },
    { name: 'Demo Walk-in', totalRevenue: 980.25, orderCount: 50 },
    { name: 'Demo Customer C', totalRevenue: 750.75, orderCount: 8 },
    { name: 'Demo Customer D', totalRevenue: 500.00, orderCount: 5 },
    { name: 'Demo Customer E', totalRevenue: 450.50, orderCount: 6 },
    { name: 'Demo Customer F', totalRevenue: 300.00, orderCount: 4 },
    { name: 'Demo Customer G', totalRevenue: 250.25, orderCount: 3 },
    { name: 'Demo Customer H', totalRevenue: 150.00, orderCount: 2 },
    { name: 'Demo Customer I', totalRevenue: 75.50, orderCount: 1 },
];


export function useTopCustomers({ limit = 10 } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['topCustomers', isDemo, limit],
        queryFn: async () => {
            if (isDemo) {
                return MOCK_TOP_CUSTOMERS.slice(0, limit);
            }

            // This is a client-side aggregation and can be slow on large datasets.
            // For better performance, consider creating a Supabase RPC function (e.g., 'get_top_customers_by_revenue').
            let allSales = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('sales')
                    .select('customername, totalamount')
                    .range(from, from + step - 1);

                if (error) {
                    console.error("Error fetching sales for top customers:", error);
                    throw error;
                }

                if (data && data.length > 0) {
                    allSales.push(...data);
                }

                if (!data || data.length < step) {
                    hasMore = false;
                } else {
                    from += step;
                }
            }

            // Aggregate data
            const customerRevenue = allSales.reduce((acc, sale) => {
                const name = sale.customername || 'Walk-in Customer';
                const amount = currency(sale.totalamount).value || 0;
                
                if (!acc[name]) {
                    acc[name] = { name, totalRevenue: 0, orderCount: 0 };
                }
                
                acc[name].totalRevenue = currency(acc[name].totalRevenue).add(amount).value;
                acc[name].orderCount += 1;
                
                return acc;
            }, {});

            // Sort and limit
            const sortedCustomers = Object.values(customerRevenue)
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, limit);

            return sortedCustomers;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}