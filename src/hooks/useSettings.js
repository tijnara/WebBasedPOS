// src/hooks/useSettings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useSettings() {
    return useQuery({
        queryKey: ['business-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        }
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (payload) => {
            const { data, error } = await supabase
                .from('business_settings')
                .update(payload)
                .eq('id', 1)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-settings'] });
        }
    });
}
