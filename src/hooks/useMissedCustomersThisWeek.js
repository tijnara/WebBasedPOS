import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useMissedCustomersThisWeek({ page = 1, itemsPerPage = 5, enabled = true, startDate, endDate } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    
    return useQuery({
        // Add dates to the query key so it refetches when you change the date picker
        queryKey: ['missed-customers', page, itemsPerPage, startDate, endDate],
        enabled: enabled && !!startDate && !!endDate,
        queryFn: async () => {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            if (isDemo) {
                // Mock data logic remains the same...
                const mockData = Array.from({ length: 12 }, (_, i) => ({
                    customer_id: i + 1,
                    customer_name: `Demo Customer ${i + 1}`,
                    phone: `0912345678${i}`,
                    last_week_total: 1000 - (i * 50),
                    last_order_date: new Date(Date.now() - (8 + i) * 24 * 60 * 60 * 1000).toISOString() 
                }));
                const slice = mockData.slice(startIndex, endIndex + 1);
                const hasMore = slice.length > itemsPerPage;
                return { customers: slice.slice(0, itemsPerPage), hasMore };
            }

            // Call the NEW rpc and pass the dates
            const { data, error } = await supabase
                .rpc('get_missed_customers_period', {
                    p_start_date: startDate.toISOString(),
                    p_end_date: endDate.toISOString()
                })
                .range(startIndex, endIndex);

            if (error) throw error;
            
            const list = data || [];
            const hasMore = list.length > itemsPerPage; 
            const pageData = hasMore ? list.slice(0, itemsPerPage) : list;
            
            return { customers: pageData, hasMore };
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });
}
