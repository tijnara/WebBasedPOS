import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useIncentives({ startDate, endDate } = {}) {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    const { data: history = [], isLoading } = useQuery({
        // Add startDate and endDate to the query key so it refetches when the week changes
        queryKey: ['incentives-history', startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('incentives')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter history by the currently selected week range
            if (startDate) query = query.gte('payout_date', startDate);
            if (endDate) query = query.lte('payout_date', endDate + 'T23:59:59.999Z');

            const { data, error } = await query;
            if (error) throw error;
            return data;
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

    return { history, isLoading, createIncentive };
}
