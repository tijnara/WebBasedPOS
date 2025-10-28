import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useSales() {
    return useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            console.log('useSales: Fetching sales and related items...');
            try {
                // Fetch sales and join all related sale_items
                // This is the Supabase way of doing a JOIN
                const { data, error } = await supabase
                    .from('sales')
                    .select(`
                        *,
                        sale_items ( * )
                    `) // This fetches the sale and ALL its related items
                    .order('created_at', { ascending: false }); // Order by the new created_at column

                if (error) {
                    console.error('useSales: Supabase query error:', error);
                    throw error;
                }

                console.log('useSales: API Response:', data);
                if (!data || !Array.isArray(data)) return [];

                // Map the data to the format your HistoryPage expects
                return data.map(s => ({
                    id: s.id,
                    saleTimestamp: new Date(s.saleTimestamp || s.created_at),
                    totalAmount: parseFloat(s.totalamount) || 0,     // <-- Read from lowercase
                    amountReceived: parseFloat(s.amountreceived) || 0, // <-- Added this
                    customerId: s.customerId,
                    customerName: s.customername || 'N/A',     // <-- Read from lowercase
                    // The 'sale_items' array is now directly available from the join
                    items: s.sale_items || [],
                    paymentMethod: s.paymentmethod || 'N/A', // <-- Read from lowercase
                    status: s.status || 'Completed'
                }));

            } catch (error) {
                console.error('useSales: Error fetching data:', error);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 3, // Cache data for 3 minutes
    });
}