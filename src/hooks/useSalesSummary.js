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
    },
    {
        id: 'mock-s-2',
        saleTimestamp: new Date('2025-11-02T15:30:00'),
        totalAmount: 99.00,
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
                return { totalRevenue };
            }
            // --- Supabase RPC (recommended) ---
            // If you have a Postgres function get_sales_summary, use it:
            // const { data, error } = await supabase.rpc('get_sales_summary', { start_date: startDate?.toISOString(), end_date: endDate?.toISOString() });
            // if (error) throw error;
            // return { totalRevenue: data };
            // --- Fallback: Query and sum client-side ---
            // This is still fast because it only selects the amount and timestamp.
            let query = supabase.from('sales').select('totalamount,saletimestamp');
            if (startDate) query = query.gte('saletimestamp', startDate.toISOString());
            if (endDate) query = query.lte('saletimestamp', endDate.toISOString());
            const { data, error } = await query;
            if (error) throw error;
            const totalRevenue = Array.isArray(data)
                ? data.reduce((sum, sale) => currency(sum).add(sale.totalamount).value, currency(0).value)
                : 0;
            return { totalRevenue };
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
    });
}

// No changes needed for display, as currency.js is only used for value extraction here.
