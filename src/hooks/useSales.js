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

export function useSales({ searchTerm, startDate, endDate } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: ['sales', isDemo, searchTerm, startDate, endDate],
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                let filtered = MOCK_SALES;
                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    filtered = filtered.filter(s =>
                        (s.customerName && s.customerName.toLowerCase().includes(term)) ||
                        (s.status && s.status.toLowerCase().includes(term)) ||
                        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(term)) ||
                        (s.createdBy && s.createdBy.toLowerCase().includes(term))
                    );
                }
                if (startDate) {
                    filtered = filtered.filter(s => s.saleTimestamp >= startDate);
                }
                if (endDate) {
                    filtered = filtered.filter(s => s.saleTimestamp <= endDate);
                }
                return filtered;
            }
            try {
                let query = supabase
                    .from('sales')
                    .select(`
                        *,
                        sale_items ( *, product:products ( name, price ) ),
                        users:created_by ( name )
                    `)
                    .order('saletimestamp', { ascending: false });
                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    query = query.or(
                        `customername.ilike.%${term}%,status.ilike.%${term}%,paymentmethod.ilike.%${term}%`
                    );
                }
                if (startDate) {
                    query = query.gte('saletimestamp', startDate.toISOString());
                }
                if (endDate) {
                    query = query.lte('saletimestamp', endDate.toISOString());
                }
                const { data, error } = await query;
                if (error) {
                    console.error("useSales Error:", error);
                    throw error;
                }
                if (!data || !Array.isArray(data)) return [];
                return data.map(s => ({
                    id: s.id,
                    saleTimestamp: s.saletimestamp ? new Date(s.saletimestamp) : new Date(s.created_at),
                    totalAmount: parseFloat(s.totalamount) || 0,
                    amountReceived: parseFloat(s.amountreceived) || 0,
                    customerId: s.customerId,
                    customerName: s.customername || 'N/A',
                    createdBy: s.users?.name || s.created_by || 'N/A',
                    sale_items: Array.isArray(s.sale_items) ? s.sale_items.map(item => ({
                        ...item,
                        productName: item.product?.name || '',
                        productPrice: item.product?.price || 0
                    })) : [],
                    items: Array.isArray(s.sale_items) ? s.sale_items : [],
                    paymentMethod: s.paymentmethod || 'N/A',
                    status: s.status || 'Completed'
                }));
            } catch (error) {
                throw error;
            }
        },
        staleTime: 1000 * 60 * 3,
    });
}