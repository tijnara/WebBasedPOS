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

export function useSales({ searchTerm, startDate, endDate, page = 1, itemsPerPage = 10 } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: ['sales', isDemo, searchTerm, startDate, endDate, page, itemsPerPage],
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
                // Server-side pagination for demo
                const totalCount = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                const paginated = filtered.slice(startIdx, endIdx);
                return { sales: paginated, totalPages, totalCount };
            }
            try {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage - 1;
                let query = supabase
                    .from('sales')
                    .select(`
                        *,
                        sale_items ( *, product:products ( name, price ) ),
                        users:created_by ( name )
                    `, { count: 'exact' })
                    .order('saletimestamp', { ascending: false })
                    .range(startIndex, endIndex);
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
                const { data, error, count } = await query;
                if (error) {
                    console.error("useSales Error:", error);
                    throw error;
                }
                if (!data || !Array.isArray(data)) return { sales: [], totalPages: 1, totalCount: 0 };
                const sales = data.map(s => ({
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
                const totalCount = count || 0;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                return { sales, totalPages, totalCount };
            } catch (error) {
                throw error;
            }
        },
        staleTime: 1000 * 60 * 3,
    });
}