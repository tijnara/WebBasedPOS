// src/hooks/useProducts.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import currency from 'currency.js';

// --- MOCK DATA (For Demo Mode) ---
const MOCK_PRODUCTS = [
    { id: 30, name: 'Refill-Walk-in(20)', price: 20.00, category: 'Refills/Services', image_url: null, barcode: '1001', stock_quantity: 0, min_stock_level: 0, cost_price: 5.00, is_hidden: false, total_sold: 5200 },
    { id: 3, name: 'Refill(25)', price: 25.00, category: 'Refills/Services', image_url: null, barcode: '1002', stock_quantity: 0, min_stock_level: 0, cost_price: 5.00, is_hidden: false, total_sold: 3800 },
    { id: 2, name: 'Refill(30)', price: 30.00, category: 'Refills/Services', image_url: null, barcode: '1003', stock_quantity: 0, min_stock_level: 0, cost_price: 5.00, is_hidden: false, total_sold: 2100 },
    { id: 'mock-p-4', name: 'Container (Slim)', price: 200.00, category: 'Containers', image_url: null, barcode: '1004', stock_quantity: 10, min_stock_level: 5, cost_price: 150.00, is_hidden: false, total_sold: 120 },
    { id: 'mock-p-5', name: 'Container (Round)', price: 200.00, category: 'Containers', image_url: null, barcode: '1005', stock_quantity: 0, min_stock_level: 5, cost_price: 150.00, is_hidden: false, total_sold: 85 },
    { id: 'mock-p-6', name: 'Ice Tubes', price: 20.00, category: 'Ice Cubes/Tubes', image_url: null, barcode: '1006', stock_quantity: 18654, min_stock_level: 100, cost_price: 10.00, is_hidden: false, total_sold: 450 },
    { id: 'mock-p-7', name: 'Pet Bottles', price: 6.00, category: 'Bottled Water', image_url: null, barcode: '1007', stock_quantity: 18068, min_stock_level: 100, cost_price: 3.00, is_hidden: false, total_sold: 320 },
];

export function useProducts({
                                searchTerm = '',
                                category = '',
                                page = 1,
                                itemsPerPage = 10,
                                fetchAll = false,
                                excludeHidden = false,
                                sortBy = 'highest_sold'
                            } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['products', isDemo, searchTerm, category, page, itemsPerPage, fetchAll, excludeHidden, sortBy],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();
            const cat = (category || '').trim();

            // Helper to sort product arrays
            const sortList = (list) => {
                const copy = [...list];
                switch (sortBy) {
                    case 'highest_sold':
                        return copy.sort((a, b) => {
                            const soldA = Number(a.total_sold || 0);
                            const soldB = Number(b.total_sold || 0);
                            if (soldB !== soldA) return soldB - soldA;

                            // If tied, prioritize refills
                            const aRefill = (a.category || '').toLowerCase().includes('refill') || (a.name || '').toLowerCase().startsWith('refill');
                            const bRefill = (b.category || '').toLowerCase().includes('refill') || (b.name || '').toLowerCase().startsWith('refill');
                            if (aRefill && !bRefill) return -1;
                            if (!aRefill && bRefill) return 1;
                            return (a.name || '').localeCompare(b.name || '');
                        });
                    case 'stock_desc':
                        return copy.sort((a, b) => Number(b.stock || b.stock_quantity || 0) - Number(a.stock || a.stock_quantity || 0));
                    case 'stock_asc':
                        return copy.sort((a, b) => Number(a.stock || a.stock_quantity || 0) - Number(b.stock || b.stock_quantity || 0));
                    case 'price_asc':
                        return copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
                    case 'price_desc':
                        return copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
                    default:
                        return copy;
                }
            };

            // --- DEMO MODE LOGIC ---
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 300));
                let filtered = MOCK_PRODUCTS;
                if (excludeHidden) {
                    filtered = filtered.filter(p => !p.is_hidden);
                }
                if (term) {
                    filtered = filtered.filter(p =>
                        (p.name && p.name.toLowerCase().includes(term)) ||
                        (p.category && p.category.toLowerCase().includes(term))
                    );
                }
                if (cat && cat.toLowerCase() !== 'all') {
                    filtered = filtered.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
                }

                filtered = sortList(filtered);

                const totalCount = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                const paginated = fetchAll ? filtered : filtered.slice(startIdx, endIdx);
                return { products: paginated, totalPages, totalCount };
            }

            // --- REAL DATABASE LOGIC ---
            try {
                // Fetch product sales aggregation safely
                const productSalesMap = {};
                try {
                    const { data: saleItemsData, error: saleItemsError } = await supabase
                        .from('sale_items')
                        .select('product_id, quantity');

                    if (!saleItemsError && Array.isArray(saleItemsData)) {
                        saleItemsData.forEach(item => {
                            const pId = item.product_id;
                            if (pId) {
                                productSalesMap[pId] = (productSalesMap[pId] || 0) + Number(item.quantity || 1);
                            }
                        });
                    } else {
                        // Fallback: check sales table if items are stored in JSONB
                        const { data: salesData, error: salesError } = await supabase
                            .from('sales')
                            .select('items');

                        if (!salesError && Array.isArray(salesData)) {
                            salesData.forEach(sale => {
                                const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []);
                                const list = Array.isArray(items) ? items : Object.values(items || {});
                                list.forEach(it => {
                                    const pId = it.productId || it.product_id || it.id;
                                    if (pId) {
                                        productSalesMap[pId] = (productSalesMap[pId] || 0) + Number(it.quantity || 1);
                                    }
                                });
                            });
                        }
                    }
                } catch {
                    // Graceful fallback if sales tables don't exist yet
                }

                let query = supabase
                    .from('products')
                    .select('*', { count: 'exact' });

                // Server-side filters
                if (term) {
                    query = query.or(`name.ilike.%${term}%,barcode.eq.${term}`);
                }
                if (cat && cat.toLowerCase() !== 'all') {
                    query = query.eq('category', cat);
                }
                if (excludeHidden) {
                    query = query.eq('is_hidden', false);
                }

                const { data, error, count } = await query;

                if (error) {
                    throw error;
                }

                const rawProducts = data || [];
                const totalCount = count || rawProducts.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

                // Map and preserve all product properties + calculate total_sold
                let mappedProducts = rawProducts.map(p => {
                    const dbSold = Number(p.total_sold ?? p.total_sales ?? p.sales_count ?? p.sold_quantity ?? 0);
                    const aggregatedSold = Number(productSalesMap[p.id] || 0);

                    // High default volume weighting for core refill services if unrecorded
                    const isRefill = (p.category || '').toLowerCase().includes('refill') || (p.name || '').toLowerCase().startsWith('refill') || [30, 3, 2].includes(Number(p.id));
                    const fallbackRefillWeight = isRefill ? 10000 : 0;

                    const effectiveSold = dbSold > 0 ? dbSold : aggregatedSold > 0 ? aggregatedSold : fallbackRefillWeight;

                    return {
                        ...p,
                        id: p.id,
                        name: p.name || 'Unnamed Product',
                        price: currency(p.price).value || 0,
                        image_url: p.image_url || null,
                        barcode: p.barcode || '',
                        stock: p.stock_quantity ?? p.stock ?? 0,
                        minStock: p.min_stock_level ?? p.minStock ?? 0,
                        cost: currency(p.cost_price).value || 0,
                        category: p.category || 'General',
                        is_hidden: p.is_hidden || false,
                        total_sold: effectiveSold,
                        parent_product_id: p.parent_product_id || null,
                        conversion_rate: p.conversion_rate || 1,
                        created_at: p.created_at || p.create_at || null,
                        updated_at: p.updated_at || null,
                    };
                });

                // Apply active sort
                mappedProducts = sortList(mappedProducts);

                // Paginate after sorting so highest sold appear on Page 1
                if (!fetchAll) {
                    const startIndex = (page - 1) * itemsPerPage;
                    mappedProducts = mappedProducts.slice(startIndex, startIndex + itemsPerPage);
                }

                return {
                    products: mappedProducts,
                    totalPages,
                    totalCount,
                };
            } catch (error) {
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}