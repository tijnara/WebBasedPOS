import { useQuery } from '@tanstack/react-query';
import directus from '../lib/directus';

export function useProducts() {
    return useQuery({
        // 1. A unique key for this data
        queryKey: ['products'],

        // 2. The function to fetch the data
        queryFn: async () => {
            console.log('Fetching products from Directus API...');
            const response = await directus.items('products').readByQuery({
                limit: -1, // Get all products
            });

            if (!response.data || !Array.isArray(response.data)) {
                console.error('Invalid response data:', response);
                return [];
            }

            // Map data with safeguards
            return response.data.map(p => ({
                id: p.id,
                name: p.name,
                price: parseFloat(p.price).toFixed(2), // Ensure price is formatted
                category: p.category || 'N/A',
                stock: parseInt(p.stock, 10) || 0,
            }));
        },
    });
}