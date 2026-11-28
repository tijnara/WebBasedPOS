// src/hooks/usePublicStore.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function usePublicStore(slug) {
    const user = useStore((s) => s.user);
    const fallbackStoreId = user?.store_id || 1;

    return useQuery({
        queryKey: ['public-store', slug || fallbackStoreId],
        queryFn: async () => {
            // 1. Try matching by URL slug first
            if (slug) {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('slug', String(slug).toLowerCase().trim())
                    .eq('is_active', true)
                    .maybeSingle();

                if (!error && data) return data;
            }

            // 2. Fallback to logged-in user's store or default store #1
            const { data: fallback, error: fallbackError } = await supabase
                .from('stores')
                .select('*')
                .eq('id', fallbackStoreId)
                .maybeSingle();

            if (fallbackError) throw fallbackError;
            return fallback;
        },
        staleTime: 1000 * 60 * 5,
    });
}