// src/hooks/useSales.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import currency from 'currency.js';

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
        createdBy: 'Demo Staff A'
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
        createdBy: 'Demo Staff B'
    }
];

export function useSales({ searchTerm, startDate, endDate, productName, productId, page = 1, itemsPerPage = 10, fetchAll = false } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: ['sales', isDemo, searchTerm, startDate, endDate, productName, productId, page, itemsPerPage, fetchAll],
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
                if (productId) {
                    filtered = filtered.filter(s =>
                        s.sale_items && s.sale_items.some(i => String(i.product_id) === String(productId))
                    );
                } else if (productName) {
                    const pName = productName.trim().toLowerCase();
                    filtered = filtered.filter(s =>
                        s.sale_items && s.sale_items.some(i => i.productName.toLowerCase().includes(pName))
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
                const totalPages = fetchAll ? 1 : Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = fetchAll ? 0 : (page - 1) * itemsPerPage;
                const endIdx = fetchAll ? totalCount : startIdx + itemsPerPage;
                const paginated = filtered.slice(startIdx, endIdx);
                return { sales: paginated, totalPages, totalCount };
            }
            try {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage - 1;

                // If filtering by productId or productName, force an INNER JOIN on sale_items
                const hasProductFilter = productId || productName;
                const selectString = `
                    *,
                    sale_items${hasProductFilter ? '!inner' : ''} ( *, product:products ( name, price ) ),
                    users:created_by ( name )
                `;

                let query = supabase
                    .from('sales')
                    .select(selectString, { count: 'exact' })
                    .order('saletimestamp', { ascending: false });

                // Conditionally apply pagination
                if (!fetchAll) {
                    query = query.range(startIndex, endIndex);
                }

                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    query = query.or(
                        `customername.ilike.%${term}%,status.ilike.%${term}%,paymentmethod.ilike.%${term}%`
                    );
                }
                if (productId) {
                    query = query.eq('sale_items.product_id', productId);
                } else if (productName) {
                    const pName = productName.trim().toLowerCase();
                    query = query.ilike('sale_items.product_name', `%${pName}%`);
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
                    totalAmount: currency(s.totalamount).value || 0,
                    amountReceived: currency(s.amountreceived).value || 0,
                    customerId: s.customerId,
                    customerName: s.customername || 'N/A',
                    createdBy: s.users?.name || s.created_by || 'N/A',
                    sale_items: Array.isArray(s.sale_items) ? s.sale_items.map(item => ({
                        ...item,
                        productName: item.product?.name || item.product_name || '',
                        productPrice: item.product?.price || item.price_at_sale || 0
                    })) : [],
                    items: Array.isArray(s.sale_items) ? s.sale_items : [],
                    paymentMethod: s.paymentmethod || 'N/A',
                    status: s.status || 'Completed'
                }));
                const totalCount = count || 0;
                const totalPages = fetchAll ? 1 : Math.max(1, Math.ceil(totalCount / itemsPerPage));
                return { sales, totalPages, totalCount };
            } catch (error) {
                throw error;
            }
        },
        staleTime: 1000 * 60 * 3,
    });
}
