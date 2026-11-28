// src/hooks/useSettings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

export function useSettings(storeIdOverride) {
    const currentUser = useStore((s) => s.user);
    const targetStoreId = storeIdOverride || currentUser?.store_id || 1;

    return useQuery({
        queryKey: ['business-settings', targetStoreId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_settings')
                .select('*')
                .eq('store_id', targetStoreId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        },
        staleTime: 1000 * 60
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    const currentUser = useStore((s) => s.user);

    return useMutation({
        mutationFn: async (payload) => {
            const targetStoreId = payload?.store_id || currentUser?.store_id || 1;
            const record = { ...payload, store_id: targetStoreId };

            // Check if a settings row already exists for this store
            const { data: existing, error: fetchError } = await supabase
                .from('business_settings')
                .select('id')
                .eq('store_id', targetStoreId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            let result;
            if (existing?.id) {
                result = await supabase
                    .from('business_settings')
                    .update(record)
                    .eq('id', existing.id)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('business_settings')
                    .insert(record)
                    .select()
                    .single();
            }

            if (result.error) {
                if (result.error.code === 'PGRST204') {
                    throw new Error(
                        'Please run the business_settings SQL migration in Supabase first so the new columns exist.'
                    );
                }
                throw result.error;
            }

            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'SETTINGS',
                description: `Updated store & page settings`
            });

            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-settings'] });
            queryClient.invalidateQueries({ queryKey: ['public-store'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}