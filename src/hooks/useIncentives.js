import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useIncentives({ startDate, endDate, page = 1, pageSize = 10 } = {}) {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    const { data, isLoading } = useQuery({
        // Include pagination and date filters in query key so it refetches automatically
        queryKey: ['incentives-history', startDate, endDate, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('incentives')
                .select('*', { count: 'exact' }); // Fetch exact count for pagination

            // DB-side filtering for the specific week
            if (startDate) {
                query = query.gte('payout_date', `${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                query = query.lte('payout_date', `${endDate}T23:59:59.999Z`);
            }

            // DB-side pagination logic
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return { history: data, totalCount: count };
        }
    });

    const createIncentive = useMutation({
        mutationFn: async (payload) => {
            const { error } = await supabase.from('incentives').insert([{
                ...payload,
                created_by: user?.id || null
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incentives-history'] });
        }
    });

    return { 
        history: data?.history || [], 
        totalCount: data?.totalCount || 0,
        isLoading, 
        createIncentive 
    };
}
