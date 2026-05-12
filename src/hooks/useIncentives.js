import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useIncentives() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    const { data: history = [], isLoading } = useQuery({
        queryKey: ['incentives-history'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('incentives')
                .select('*')
                .order('created_at', { ascending: false });
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
