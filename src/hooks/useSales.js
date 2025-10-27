import { useQuery } from '@tanstack/react-query';
import directus from '../lib/directus';

export function useSales() {
    return useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            const response = await directus.items('sales').readByQuery({
                limit: -1,
                sort: ['-saleTimestamp'], // Sort by newest first
            });
            // Map data just like you did in _app.js
            return response.data.map(s => ({
                id: s.id,
                saleTimestamp: new Date(s.saleTimestamp || s.created_at),
                totalAmount: parseFloat(s.totalAmount) || 0,
                customerId: s.customerId,
                customerName: s.customerName || 'N/A',
                items: s.items || [],
                paymentMethod: s.paymentMethod || 'N/A',
                status: s.status || 'Completed'
            }));
        },
    });
}