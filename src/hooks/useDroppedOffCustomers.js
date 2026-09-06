import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useDroppedOffCustomers({ startDate, endDate, page = 1, itemsPerPage = 5 }) {
    const isDemo = useStore(s => s.user?.isDemo);

    const queryKey = ['dropped-off-customers', { startDate, endDate, isDemo, page, itemsPerPage }];

    return useQuery({
        queryKey,
        queryFn: async () => {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            if (isDemo) {
                // Mock data for demo mode
                const mockData = [
                    { customer_name: 'Ramos', phone: 'N/A', last_order_date: '2026-08-25T10:00:00Z', previous_7_days_total: 300.00 },
                    { customer_name: 'Ikit', phone: 'N/A', last_order_date: '2026-08-28T10:00:00Z', previous_7_days_total: 290.00 },
                    { customer_name: 'Troy', phone: 'N/A', last_order_date: '2026-08-25T10:00:00Z', previous_7_days_total: 250.00 },
                    { customer_name: 'Alma', phone: 'N/A', last_order_date: '2026-08-28T10:00:00Z', previous_7_days_total: 180.00 },
                    { customer_name: 'Genoviva', phone: 'N/A', last_order_date: '2026-08-28T10:00:00Z', previous_7_days_total: 150.00 },
                ];
                await new Promise(resolve => setTimeout(resolve, 200));
                const slice = mockData.slice(startIndex, endIndex + 1);
                const hasMore = slice.length > itemsPerPage;
                const pageData = slice.slice(0, itemsPerPage);
                return { customers: pageData, hasMore };
            }

            const { data, error } = await supabase
                .rpc('get_dropped_off_customers', {
                    p_start_date: startDate,
                    p_end_date: endDate,
                })
                .range(startIndex, endIndex);

            if (error) throw error;

            const list = data || [];
            const hasMore = list.length > itemsPerPage;
            const pageData = hasMore ? list.slice(0, itemsPerPage) : list;

            return { customers: pageData, hasMore };
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}