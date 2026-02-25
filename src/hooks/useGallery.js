import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useGallery() {
    return useQuery({
        queryKey: ['gallery'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                // If table doesn't exist (404/PGRST116/etc), return empty array gracefully
                if (error.code === 'PGRST116' || error.status === 404) {
                    console.warn("Gallery table not found. Please run the SQL schema.");
                    return [];
                }
                throw error;
            }
            return data;
        },
    });
}
