// src/hooks/useMissedCustomersThisWeek.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useMissedCustomersThisWeek({ page = 1, itemsPerPage = 5, enabled = true } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    
    return useQuery({
        queryKey: ['missed-customers', page, itemsPerPage],
        enabled: enabled, // <--- Add this line
        queryFn: async () => {
            // Calculate range for database pagination
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage; // Fetch one extra to detect hasMore

            if (isDemo) {
                // Mock data for demo mode
                const mockData = Array.from({ length: 12 }, (_, i) => ({
                    customer_id: i + 1,
                    customer_name: `Demo Customer ${i + 1}`,
                    phone: `0912345678${i}`,
                    last_week_total: 1000 - (i * 50)
                }));
                const slice = mockData.slice(startIndex, endIndex + 1);
                const hasMore = slice.length > itemsPerPage;
                return { customers: slice.slice(0, itemsPerPage), hasMore };
            }

            // Call the RPC and apply range for DB-level pagination
            const { data, error } = await supabase
                .rpc('get_missed_customers_this_week')
                .range(startIndex, endIndex);

            if (error) throw error;
            
            const list = data || [];
            const hasMore = list.length > itemsPerPage; // True if we got that extra item
            const pageData = hasMore ? list.slice(0, itemsPerPage) : list;
            
            return { customers: pageData, hasMore };
        },
        keepPreviousData: true, // Keeps the old data visible while fetching the next page
        staleTime: 1000 * 60 * 5,
    });
}