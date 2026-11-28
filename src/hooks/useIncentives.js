// src/hooks/useIncentives.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useIncentives({ startDate, endDate, page = 1, pageSize = 10, storeId = null } = {}) {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);
    const targetStoreId = Number(storeId || user?.store_id) || 1;

    const { data, isLoading } = useQuery({
        queryKey: ['incentives-history', targetStoreId, startDate, endDate, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('incentives')
                .select('*', { count: 'exact' })
                .eq('store_id', targetStoreId);

            if (startDate) {
                query = query.gte('payout_date', new Date(`${startDate}T00:00:00+08:00`).toISOString());
            }
            if (endDate) {
                query = query.lte('payout_date', new Date(`${endDate}T23:59:59.999+08:00`).toISOString());
            }

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
            const currentUser = useStore.getState().user || user;
            const resolvedStoreId = Number(payload?.store_id || currentUser?.store_id) || 1;

            const { error } = await supabase.from('incentives').insert([{
                ...payload,
                store_id: resolvedStoreId,
                created_by: currentUser?.id || null
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