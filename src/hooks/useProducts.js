import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore'; // <-- 1. Import the store

// --- 2. DEFINE MOCK DATA ---
const MOCK_PRODUCTS = [
    { id: 'mock-p-1', name: 'Mock Alkaline (5 Gal)', price: 35.00, category: 'Water' },
    { id: 'mock-p-2', name: 'Mock Purified (5 Gal)', price: 25.00, category: 'Water' },
    { id: 'mock-p-3', name: 'Mock Mineral (1L)', price: 15.00, category: 'Retail' },
    { id: 'mock-p-4', name: 'Empty Bottle (Slim)', price: 250.00, category: 'Container' },
    { id: 'mock-p-5', name: 'Bottle Cap Seals (100pcs)', price: 50.00, category: 'Supplies' },
    { id: 'mock-p-6', name: 'Mock Product A', price: 10.00, category: 'N/A' },
    { id: 'mock-p-7', name: 'Mock Product B', price: 99.00, category: 'N/A' },
];
// --- END MOCK DATA ---

// --- MODIFICATION: Accept searchTerm ---
export function useProducts(searchTerm = '') {
    // 3. Get the user state and check the isDemo flag
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        // 4. Add 'isDemo' and 'searchTerm' to the queryKey
        queryKey: ['products', isDemo, searchTerm],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();

            // --- 5. DEMO MODE LOGIC ---
            if (isDemo) {
                // Simulate a network delay for a realistic feel
                await new Promise(resolve => setTimeout(resolve, 400));
                // Simulate client-side filtering for demo mode
                if (!term) {
                    return MOCK_PRODUCTS;
                }
                return MOCK_PRODUCTS.filter(p =>
                    (p.name && p.name.toLowerCase().includes(term)) ||
                    (p.category && p.category.toLowerCase().includes(term))
                );
            }
            // --- END DEMO MODE LOGIC ---

            // --- ORIGINAL LOGIC (if not demo) ---
            try {
                // Fetch all products from Supabase 'products' table
                let query = supabase
                    .from('products')
                    .select('*') // Select all columns
                    .order('name', { ascending: true }); // Optional: Order by name

                // --- MODIFICATION: Add server-side filtering ---
                if (term) {
                    // Use .ilike() to search the name column only
                    query = query.ilike('name', `%${term}%`);
                }
                // --- END MODIFICATION ---

                const { data, error } = await query;

                if (error) {
                    // Intentionally rethrow for React Query error handling
                    throw error;
                }

                const response = data;
                if (!response || !Array.isArray(response)) {
                    return [];
                }

                // Return mapped data directly
                return response.map(p => ({
                    id: p.id,
                    name: p.name || 'Unnamed Product',
                    price: parseFloat(p.price) || 0,
                    category: p.category || 'N/A',
                }));
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