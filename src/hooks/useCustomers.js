import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// --- Updated mock data structure ---
const MOCK_CUSTOMERS = [
    { id: 'mock-c-1', name: 'Demo Customer A', phone: '09110000001', address: '123 Demo St.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
    { id: 'mock-c-2', name: 'Demo Customer B', phone: '09110000002', address: '456 Demo Ave.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
    { id: 'mock-c-3', name: 'Demo Customer C', phone: '09110000003', address: '789 Demo Blvd.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
];

// --- MODIFICATION: Accept searchTerm ---
export function useCustomers(searchTerm = '') {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        // --- MODIFICATION: Add searchTerm to queryKey ---
        queryKey: ['customers', isDemo, searchTerm],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();

            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                // Simulate client-side filtering for demo mode
                if (!term) {
                    return MOCK_CUSTOMERS;
                }
                return MOCK_CUSTOMERS.filter(c =>
                    (c.name && c.name.toLowerCase().includes(term)) ||
                    (c.phone && c.phone.toLowerCase().includes(term)) ||
                    (c.users?.name && c.users.name.toLowerCase().includes(term))
                );
            }

            // --- MODIFICATION: Build dynamic query ---
            let query = supabase
                .from('customers')
                .select('*, users!created_by(id, name)')
                .order('name', { ascending: true });

            if (term) {
                // Only filter on base table fields in Supabase query
                query = query.or(
                    `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
                );
            }
            // --- END MODIFICATION ---

            const { data, error } = await query;

            if (error) {
                console.error("useCustomers hook error:", error); // Added logging
                throw error;
            }

            // --- Filter joined user name in JS ---
            let filteredData = data || [];
            if (term) {
                filteredData = filteredData.filter(
                    c =>
                        (c.name && c.name.toLowerCase().includes(term)) ||
                        (c.email && c.email.toLowerCase().includes(term)) ||
                        (c.phone && c.phone.toLowerCase().includes(term)) ||
                        (c.users?.name && c.users.name.toLowerCase().includes(term))
                );
            }

            // --- Parse date strings into Date objects ---
            return filteredData.map(c => ({
                ...c,
                dateAdded: c.created_at ? new Date(c.created_at) : null
            }));
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}