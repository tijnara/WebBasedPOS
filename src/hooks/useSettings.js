// src/hooks/useSettings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

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
        },
        staleTime: 1000 * 60
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (payload) => {
            const record = { id: 1, ...payload };
            const { data, error } = await supabase
                .from('business_settings')
                .upsert(record, { onConflict: 'id' })
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST204' || error.message?.includes('promo_floater')) {
                    throw new Error('Please run the business_settings SQL migration in Supabase first so the new floater columns exist.');
                }
                throw error;
            }

            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'SETTINGS',
                description: `Updated store & page notification settings`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-settings'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}