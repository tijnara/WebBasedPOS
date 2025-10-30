import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            try {
                // Fetch all products from Supabase 'products' table
                const { data, error } = await supabase
                    .from('products')
                    .select('*') // Select all columns
                    .order('name', { ascending: true }); // Optional: Order by name

                if (error) {
                    // Intentionally rethrow for React Query error handling
                    throw error;
                }

                const response = data;
                if (!response || !Array.isArray(response)) {
                    return [];
                }

                // Return mapped data directly
                return response.map(p => ({
                    id: p.id,
                    name: p.name || 'Unnamed Product',
                    price: parseFloat(p.price) || 0,
                    category: p.category || 'N/A',
                }));
            } catch (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
        },
        // Optional: Configure staleTime and gcTime here if needed,
        // otherwise uses defaults from QueryClient
        // staleTime: 1000 * 60 * 5, // 5 minutes
        // gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}