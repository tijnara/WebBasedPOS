import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient'; // Use Supabase client

export function useProducts() {
    return useQuery({
        queryKey: ['products'], // Unique key for this query
        queryFn: async () => {
            console.log('useProducts: Fetching...');
            try {
                // Fetch all products from Supabase 'products' table
                const { data, error } = await supabase
                    .from('products')
                    .select('*') // Select all columns
                    .order('name', { ascending: true }); // Optional: Order by name

                if (error) {
                    console.error('useProducts: Supabase query error:', error);
                    throw error; // Throw error to be caught by React Query
                }

                const response = data; // Assign data to response variable for mapping
                console.log('useProducts: API Response:', response);

                if (!response || !Array.isArray(response)) {
                    console.error('useProducts: Invalid response data structure:', response);
                    return []; // Return empty array if data is not as expected
                }

                // Map data with safeguards
                const mappedData = response.map(p => ({
                    id: p.id,
                    name: p.name || 'Unnamed Product',
                    price: parseFloat(p.price) || 0,
                    category: p.category || 'N/A',
                    // Removed stock field
                }));
                console.log('useProducts: Mapped Data:', mappedData);
                return mappedData;
            } catch (error) {
                console.error('useProducts: Error fetching data:', error);
                // Re-throw the error so React Query can handle the error state
                throw error;
            }
        },
        // Optional: Configure staleTime and gcTime here if needed,
        // otherwise uses defaults from QueryClient
        // staleTime: 1000 * 60 * 5, // 5 minutes
        // gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}