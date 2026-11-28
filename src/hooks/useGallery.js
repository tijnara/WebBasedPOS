// src/hooks/useGallery.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useGallery(storeIdOverride) {
    const currentUser = useStore((s) => s.user);
    const targetStoreId = storeIdOverride || currentUser?.store_id || 1;

    return useQuery({
        queryKey: ['gallery', targetStoreId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('gallery')
                .select('*')
                .eq('store_id', targetStoreId)
                .order('created_at', { ascending: false });

            if (error) {
                // If table doesn't exist (404/PGRST116/etc), return empty array gracefully
                if (error.code === 'PGRST116' || error.status === 404) {
                    console.warn('Gallery table not found. Please run the SQL schema.');
                    return [];
                }
                throw error;
            }
            return data || [];
        }
    });
}