// src/hooks/useSalesSummary.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_SALES = [
    {
        id: 'mock-s-1',
        saleTimestamp: new Date('2025-11-03T09:00:00'),
        totalAmount: 60.00,
        costAmount: 40.00,
        items: [{ product_id: 'p1', productName: 'Refill(20)', quantity: 2, price_at_sale: 30, cost_at_sale: 20 }]
    },
    {
        id: 'mock-s-2',
        saleTimestamp: new Date('2025-11-02T15:30:00'),
        totalAmount: 99.00,
        costAmount: 70.00,
        items: [{ product_id: 'p2', productName: 'Refill(25)', quantity: 3, price_at_sale: 33, cost_at_sale: 23 }]
    }
];

export function useSalesSummary({ startDate, endDate, productName, productId } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['sales-summary', isDemo, startDate, endDate, productName, productId],
        queryFn: async () => {
            if (isDemo) {
                let filtered = MOCK_SALES;
                if (startDate) filtered = filtered.filter(s => s.saleTimestamp >= startDate);
                if (endDate) filtered = filtered.filter(s => s.saleTimestamp <= endDate);

                let totalRevenue = 0;
                let totalProfit = 0;
                let productQuantities = {};
                let firstTransactionDate = null;

                filtered.forEach(sale => {
                    if (sale.items) {
                        sale.items.forEach(item => {
                            const name = (item.productName || '').trim();
                            if (productId && String(item.product_id) !== String(productId)) return;
                            else if (!productId && productName && !name.toLowerCase().includes(productName.toLowerCase())) return;

                            const qty = item.quantity || 0;
                            const revenue = (item.price_at_sale || 0) * qty;
                            const cost = (item.cost_at_sale || 0) * qty;

                            totalRevenue += revenue;
                            totalProfit += (revenue - cost);

                            const pid = item.product_id || name;
                            if (pid) {
                                if (!productQuantities[pid]) {
                                    productQuantities[pid] = { name: name, quantity: 0 };
                                }
                                productQuantities[pid].quantity += qty;
                            }
                        });

                        const sDate = new Date(sale.saleTimestamp);
                        if (!firstTransactionDate || sDate < firstTransactionDate) {
                            firstTransactionDate = sDate;
                        }
                    }
                });

                return { totalRevenue, totalProfit, productQuantities, firstTransactionDate };
            }

            // --- REAL DATABASE LOGIC ---
            let allSales = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            // Loop to bypass Supabase's 1000 row limit and grab ALL time data
            while (hasMore) {
                let query = supabase
                    .from('sales')
                    .select(`
                        id,
                        totalamount,
                        saletimestamp,
                        sale_items (
                            product_id,
                            quantity,
                            price_at_sale,
                            cost_at_sale,
                            products (
                                id,
                                name
                            )
                        )
                    `)
                    .order('saletimestamp', { ascending: true })
                    .range(from, from + step - 1);

                if (startDate) query = query.gte('saletimestamp', startDate.toISOString());
                if (endDate) query = query.lte('saletimestamp', endDate.toISOString());

                const { data, error } = await query;
                if (error) throw error;

                if (data && data.length > 0) {
                    allSales.push(...data);
                }

                if (!data || data.length < step) {
                    hasMore = false;
                } else {
                    from += step;
                }
            }

            let totalRevenue = 0;
            let totalProfit = 0;
            let productQuantities = {};
            let firstTransactionDate = null;

            allSales.forEach(sale => {
                const hasFilter = productId || productName;

                const sDate = new Date(sale.saletimestamp);
                if (!firstTransactionDate || sDate < firstTransactionDate) {
                    firstTransactionDate = sDate;
                }

                if (sale.sale_items && Array.isArray(sale.sale_items)) {
                    sale.sale_items.forEach(item => {
                        const qty = item.quantity || 0;
                        const revenue = (item.price_at_sale || 0) * qty;
                        const cost = (item.cost_at_sale || 0) * qty;

                        const pid = item.product_id;
                        const name = item.products?.name || 'Unknown Product';

                        // Apply product filter — skip non-matching items
                        if (productId) {
                            if (String(pid) !== String(productId)) return;
                        } else if (productName) {
                            if (!name.toLowerCase().includes(productName.toLowerCase())) return;
                        }

                        // When filtered by product, accumulate revenue at item level
                        if (hasFilter) {
                            totalRevenue += revenue;
                        }

                        totalProfit += (revenue - cost);

                        if (pid) {
                            if (!productQuantities[pid]) {
                                productQuantities[pid] = { name: name, quantity: 0 };
                            }
                            productQuantities[pid].quantity += qty;
                        }
                    });

                    // No filter: use accurate sale-level total (accounts for discounts)
                    if (!hasFilter) {
                        totalRevenue += (sale.totalamount || 0);
                    }
                } else if (!hasFilter) {
                    totalRevenue += (sale.totalamount || 0);
                }
            });


            return { totalRevenue, totalProfit, productQuantities, firstTransactionDate };
        },
        staleTime: 1000 * 60 * 3,
    });
}