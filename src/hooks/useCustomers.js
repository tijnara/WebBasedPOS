import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// --- Updated mock data structure ---
const MOCK_CUSTOMERS = [
    { id: 'mock-c-1', name: 'Demo Customer A', phone: '09110000001', address: '123 Demo St.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
    { id: 'mock-c-2', name: 'Demo Customer B', phone: '09110000002', address: '456 Demo Ave.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
    { id: 'mock-c-3', name: 'Demo Customer C', phone: '09110000003', address: '789 Demo Blvd.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
];

export function useCustomers() {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: ['customers', isDemo],
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                return MOCK_CUSTOMERS;
            }
            const { data, error } = await supabase
                .from('customers')
                .select('*, users!created_by(id, name)')
                .order('name', { ascending: true });

            if (error) throw error;

            // --- Parse date strings into Date objects ---
            const processedData = (data || []).map(c => ({
                ...c,
                dateAdded: c.created_at ? new Date(c.created_at) : null
            }));

            return processedData;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}