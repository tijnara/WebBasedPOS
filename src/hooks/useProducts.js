import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore'; // <-- 1. Import the store
import currency from 'currency.js';

// --- 2. DEFINE MOCK DATA ---
const MOCK_PRODUCTS = [
    { id: 'mock-p-1', name: 'Mock Alkaline (5 Gal)', price: 35.00, category: 'Water', image_url: null, barcode: '1001', stock_quantity: 50, min_stock_level: 10, cost_price: 25.00 },
    { id: 'mock-p-2', name: 'Mock Purified (5 Gal)', price: 25.00, category: 'Water', image_url: null, barcode: '1002', stock_quantity: 30, min_stock_level: 10, cost_price: 18.00 },
    { id: 'mock-p-3', name: 'Mock Mineral (1L)', price: 15.00, category: 'Retail', image_url: null, barcode: '1003', stock_quantity: 100, min_stock_level: 20, cost_price: 10.00 },
    { id: 'mock-p-4', name: 'Empty Bottle (Slim)', price: 250.00, category: 'Container', image_url: null, barcode: '1004', stock_quantity: 15, min_stock_level: 5, cost_price: 200.00 },
    { id: 'mock-p-5', name: 'Bottle Cap Seals (100pcs)', price: 50.00, category: 'Supplies', image_url: null, barcode: '1005', stock_quantity: 25, min_stock_level: 5, cost_price: 35.00 },
    { id: 'mock-p-6', name: 'Mock Product A', price: 10.00, category: 'N/A', image_url: null, barcode: '1006', stock_quantity: 5, min_stock_level: 10, cost_price: 7.00 },
    { id: 'mock-p-7', name: 'Mock Product B', price: 99.00, category: 'N/A', image_url: null, barcode: '1007', stock_quantity: 8, min_stock_level: 5, cost_price: 75.00 },
];
// --- END MOCK DATA ---

// --- MODIFICATION: Accept searchTerm and category ---
export function useProducts({ searchTerm = '', category = '', page = 1, itemsPerPage = 10 } = {}) {
    // 3. Get the user state and check the isDemo flag
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        // Include category in query key
        queryKey: ['products', isDemo, searchTerm, category, page, itemsPerPage],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();
            const cat = (category || '').trim();

            // --- 5. DEMO MODE LOGIC ---
            if (isDemo) {
                // Simulate a network delay for a realistic feel
                await new Promise(resolve => setTimeout(resolve, 400));
                // Simulate client-side filtering for demo mode
                let filtered = MOCK_PRODUCTS;
                if (term) {
                    filtered = filtered.filter(p =>
                        (p.name && p.name.toLowerCase().includes(term)) ||
                        (p.category && p.category.toLowerCase().includes(term))
                    );
                }
                const totalCount = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                const paginated = filtered.slice(startIdx, endIdx);
                return { products: paginated, totalPages, totalCount };
            }
            // --- END DEMO MODE LOGIC ---

            // --- ORIGINAL LOGIC (if not demo) ---
            try {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage - 1;
                let query = supabase
                    .from('products')
                    .select('*', { count: 'exact' }) // Select all columns
                    .order('name', { ascending: true }) // Optional: Order by name
                    .range(startIndex, endIndex); // <-- 6. Enable pagination

                // Server-side filters
                if (term) {
                    query = query.or(`name.ilike.%${term}%,barcode.eq.${term}`);
                }
                if (cat && cat.toLowerCase() !== 'all') {
                    query = query.eq('category', cat);
                }

                const { data, error, count } = await query;

                if (error) {
                    // Intentionally rethrow for React Query error handling
                    throw error;
                }

                const products = data || [];
                const totalCount = count || 0;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                return {
                    products: products.map(p => ({
                        id: p.id,
                        name: p.name || 'Unnamed Product',
                        price: currency(p.price).value || 0,
                        image_url: p.image_url || null,
                        // --- NEW FIELDS ---
                        barcode: p.barcode || '',
                        stock: p.stock_quantity || 0,
                        minStock: p.min_stock_level || 0,
                        cost: currency(p.cost_price).value || 0,
                        category: p.category || 'General',
                        created_at: p.created_at || p.create_at || null,
                        updated_at: p.updated_at || null,
                    })),
                    totalPages,
                    totalCount,
                };
            } catch (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
        },
        // Optional: Configure staleTime and gcTime here if needed,
        // otherwise uses defaults from QueryClient
        // staleTime: 1000 * 60 * 5, // 5 minutes
        // gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

// No changes needed for display, as currency.js is only used for value extraction here.
