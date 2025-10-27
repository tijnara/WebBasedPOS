import { useQuery } from '@tanstack/react-query';
import directus from '../lib/directus';
import { readItems } from '@directus/sdk';

export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            console.log('useProducts: Fetching...');
            try {
                const response = await directus.request(
                    readItems('products', { limit: -1 })
                );
                console.log('useProducts: API Response:', response);

                if (!response || !Array.isArray(response)) {
                    console.error('useProducts: Invalid response data structure:', response);
                    return [];
                }

                // Map data with safeguards
                const mappedData = response.map(p => ({
                    id: p.id,
                    name: p.name || 'Unnamed Product',
                    price: parseFloat(p.price) || 0,
                    category: p.category || 'N/A',
                    stock: parseInt(p.stock, 10) || 0,
                }));
                console.log('useProducts: Mapped Data:', mappedData);
                return mappedData;
            } catch (error) {
                console.error('useProducts: Error fetching data:', error);
                throw error;
            }
        },
    });
}