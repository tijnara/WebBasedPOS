import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useSales() {
    return useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            console.log('useSales: Fetching sales and related items...');
            try {
                // Fetch sales and join all related sale_items
                const { data, error } = await supabase
                    .from('sales')
                    .select(`
                        *,
                        sale_items ( * )
                    `) // This fetches the sale and all its items
                    .order('created_at', { ascending: false }); // Order by creation date

                if (error) {
                    console.error('useSales: Supabase query error:', error);
                    throw error;
                }

                console.log('useSales: API Response:', data);
                if (!data || !Array.isArray(data)) return [];

                // Map the data
                return data.map(s => ({
                    id: s.id,
                    saleTimestamp: new Date(s.saleTimestamp || s.created_at),
                    totalAmount: parseFloat(s.totalAmount) || 0,
                    customerId: s.customerId,
                    customerName: s.customerName || 'N/A',
                    // The 'sale_items' array is now directly available
                    items: s.sale_items || [],
                    paymentMethod: s.paymentMethod || 'N/A',
                    status: s.status || 'Completed'
                }));

            } catch (error) {
                console.error('useSales: Error fetching data:', error);
                throw error;
            }
        },
    });
}