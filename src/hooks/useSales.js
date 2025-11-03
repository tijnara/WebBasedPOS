import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// --- MODIFIED MOCK DATA ---
const MOCK_SALES = [
    {
        id: 'mock-s-1',
        saleTimestamp: new Date('2025-11-03T09:00:00'),
        totalAmount: 60.00,
        amountReceived: 100.00,
        customerId: 'mock-c-1',
        customerName: 'Demo Customer A',
        sale_items: [
            { productName: 'Mock Alkaline (5 Gal)', productPrice: 35.00, quantity: 1 },
            { productName: 'Mock Purified (5 Gal)', productPrice: 25.00, quantity: 1 }
        ],
        items: [
            { productName: 'Mock Alkaline (5 Gal)', productPrice: 35.00, quantity: 1 },
            { productName: 'Mock Purified (5 Gal)', productPrice: 25.00, quantity: 1 }
        ],
        paymentMethod: 'Cash',
        status: 'Completed',
        createdBy: 'Demo Staff A' // <-- ADDED
    },
    {
        id: 'mock-s-2',
        saleTimestamp: new Date('2025-11-02T15:30:00'),
        totalAmount: 99.00,
        amountReceived: 100.00,
        customerId: 'mock-c-2',
        customerName: 'Demo Customer B',
        sale_items: [
            { productName: 'Mock Product B', productPrice: 99.00, quantity: 1 }
        ],
        items: [
            { productName: 'Mock Product B', productPrice: 99.00, quantity: 1 }
        ],
        paymentMethod: 'GCash',
        status: 'Completed',
        createdBy: 'Demo Staff B' // <-- ADDED
    }
];
// --- END MODIFICATION ---

export function useSales() {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: ['sales', isDemo],
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                return MOCK_SALES;
            }
            try {
                // --- MODIFIED QUERY ---
                // This assumes your 'sales' table 'created_by' column
                // is a foreign key to the 'users' table 'id' column.
                const { data, error } = await supabase
                    .from('sales')
                    .select(`
                        *,
                        sale_items ( *, product:products ( name, price ) ),
                        users:created_by ( name )
                    `) // <-- This line joins the users table
                    .order('saletimestamp', { ascending: false });

                if (error) {
                    console.error("useSales Error:", error); // <-- Better logging
                    throw error;
                }
                // --- END MODIFICATION ---

                if (!data || !Array.isArray(data)) return [];

                // --- MODIFIED MAPPING ---
                return data.map(s => ({
                    id: s.id,
                    saleTimestamp: s.saletimestamp ? new Date(s.saletimestamp) : new Date(s.created_at),
                    totalAmount: parseFloat(s.totalamount) || 0,
                    amountReceived: parseFloat(s.amountreceived) || 0,
                    customerId: s.customerId,
                    customerName: s.customername || 'N/A',
                    // Use the fetched user's name. Fallback to ID if not found.
                    createdBy: s.users?.name || s.created_by || 'N/A', // <-- UPDATED
                    sale_items: Array.isArray(s.sale_items) ? s.sale_items.map(item => ({
                        ...item,
                        productName: item.product?.name || '',
                        productPrice: item.product?.price || 0
                    })) : [],
                    items: Array.isArray(s.sale_items) ? s.sale_items : [],
                    paymentMethod: s.paymentmethod || 'N/A',
                    status: s.status || 'Completed'
                }));
                // --- END MODIFICATION ---

            } catch (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
        },
        staleTime: 1000 * 60 * 3, // Cache data for 3 minutes
    });
}