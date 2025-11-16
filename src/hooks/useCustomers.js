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
export function useCustomers({ searchTerm = '', page = 1, itemsPerPage = 10 } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        // --- MODIFICATION: Add searchTerm to queryKey ---
        queryKey: ['customers', isDemo, searchTerm, page, itemsPerPage],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                let filtered = MOCK_CUSTOMERS;
                if (term) {
                    filtered = filtered.filter(c =>
                        (c.name && c.name.toLowerCase().includes(term)) ||
                        (c.phone && c.phone.toLowerCase().includes(term)) ||
                        (c.users?.name && c.users.name.toLowerCase().includes(term))
                    );
                }
                const totalCount = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                const paginated = filtered.slice(startIdx, endIdx);
                return { customers: paginated, totalPages, totalCount };
            }
            let query = supabase
                .from('customers')
                .select('*, users!created_by(id, name)', { count: 'exact' })
                .order('name', { ascending: true });
            if (term) {
                query = query.or(
                    `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
                );
            }
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage - 1;
            query = query.range(startIndex, endIndex);
            const { data, error, count } = await query;
            if (error) {
                console.error("useCustomers hook error:", error);
                throw error;
            }
            let filteredData = data || [];
            // JS filter for joined user name
            if (term) {
                filteredData = filteredData.filter(
                    c =>
                        (c.name && c.name.toLowerCase().includes(term)) ||
                        (c.email && c.email.toLowerCase().includes(term)) ||
                        (c.phone && c.phone.toLowerCase().includes(term)) ||
                        (c.users?.name && c.users.name.toLowerCase().includes(term))
                );
            }
            const totalCount = count || 0;
            const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
            return {
                customers: filteredData.map(c => ({
                    ...c,
                    dateAdded: c.created_at ? new Date(c.created_at) : null
                })),
                totalPages,
                totalCount
            };
        },
        staleTime: 1000 * 60 * 5,
    });
}