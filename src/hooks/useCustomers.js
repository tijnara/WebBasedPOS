import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// --- MODIFIED MOCK DATA ---
const MOCK_CUSTOMERS = [
    { id: 'mock-c-1', name: 'Demo Customer A', phone: '09110000001', address: '123 Demo St.', created_at: new Date('2025-11-01T10:00:00Z'), createdBy: 'Demo Staff A' },
    { id: 'mock-c-2', name: 'Demo Customer B', phone: '09110000002', address: '456 Demo Ave.', created_at: new Date('2025-11-02T11:00:00Z'), createdBy: 'Demo Staff B' },
    { id: 'mock-c-3', name: 'Demo Customer C', phone: '09110000003', address: '789 Demo Blvd.', created_at: new Date('2025-11-03T12:00:00Z'), createdBy: 'Demo Staff A' },
];
// --- END MODIFICATION ---

export function useCustomers() {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: ['customers', isDemo],
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                // Map mock data to include dateAdded
                return MOCK_CUSTOMERS.map(c => ({
                    ...c,
                    dateAdded: c.created_at ? new Date(c.created_at) : null
                }));
            }

            // --- MODIFIED QUERY ---
            const { data, error } = await supabase
                .from('customers')
                .select(`
            *,
            users:created_by ( name )
        `) // <-- This line joins the users table
                .order('name', { ascending: true });

            if (error) {
                console.error("useCustomers Error:", error); // <-- Better logging
                throw error;
            }
            // --- END MODIFICATION ---

            if (!data) return [];

            // --- ADDED MAPPING ---
            // Process the data just like in useSales
            return data.map(c => ({
                ...c,
                // Ensure dateAdded is a Date object
                dateAdded: c.created_at ? new Date(c.created_at) : null,
                // Use the fetched user's name
                createdBy: c.users?.name || c.created_by || 'N/A',
                email: c.email || 'N/A', // Ensure nulls are handled
                phone: c.phone || 'N/A', // Ensure nulls are handled
            }));
            // --- END MAPPING ---
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}