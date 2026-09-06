import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, subDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useDroppedOffCustomers({ page = 1, itemsPerPage = 5 }) {
    const isDemo = useStore(s => s.user?.isDemo);

    // Calculate the date range based on the last Sunday.
    // The data refreshes every Sunday and remains static for the week.
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }); // Previous or current Sunday
    const effectiveEndDate = subDays(startOfCurrentWeek, 1); // The Saturday of the week before
    const effectiveStartDate = subDays(effectiveEndDate, 6); // The Sunday of the week before

    const finalStartDate = format(effectiveStartDate, 'yyyy-MM-dd');
    const finalEndDate = format(effectiveEndDate, 'yyyy-MM-dd');

    const queryKey = ['dropped-off-customers', { startDate: finalStartDate, endDate: finalEndDate, isDemo, page, itemsPerPage }];

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
                    p_start_date: finalStartDate,
                    p_end_date: finalEndDate,
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