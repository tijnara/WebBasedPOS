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
                        sale_items ( *, product:products ( name, price ) )
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
                    totalAmount: parseFloat(s.totalamount) || 0,
                    amountReceived: parseFloat(s.amountreceived) || 0,
                    customerId: s.customerId,
                    customerName: s.customername || 'N/A',
                    sale_items: Array.isArray(s.sale_items) ? s.sale_items.map(item => ({
                        ...item,
                        productName: item.product?.name || '',
                        productPrice: item.product?.price || 0
                    })) : [], // Always provide sale_items array
                    items: Array.isArray(s.sale_items) ? s.sale_items : [], // For backward compatibility
                    paymentMethod: s.paymentmethod || 'N/A',
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