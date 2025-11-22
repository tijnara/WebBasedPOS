import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// --- Updated mock data structure ---
const MOCK_CUSTOMERS = [
    { id: 'mock-c-1', name: 'Demo Customer A', phone: '09110000001', address: '123 Demo St.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
    { id: 'mock-c-2', name: 'Demo Customer B', phone: '09110000002', address: '456 Demo Ave.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
    { id: 'mock-c-3', name: 'Demo Customer C', phone: '09110000003', address: '789 Demo Blvd.', users: { name: 'Demo Staff' }, dateAdded: new Date() },
];

// --- MODIFICATION: Accept searchTerm + date range ---
export function useCustomers({ searchTerm = '', page = 1, itemsPerPage = 10, startDate = null, endDate = null } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        // --- MODIFICATION: Add startDate/endDate to queryKey ---
        queryKey: ['customers', isDemo, searchTerm, page, itemsPerPage, startDate?.toISOString?.() || null, endDate?.toISOString?.() || null],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                let filtered = MOCK_CUSTOMERS;
                // Filter by search term
                if (term) {
                    filtered = filtered.filter(c =>
                        (c.name && c.name.toLowerCase().includes(term)) ||
                        (c.phone && c.phone.toLowerCase().includes(term)) ||
                        (c.users?.name && c.users.name.toLowerCase().includes(term))
                    );
                }
                // Filter by date range
                if (startDate || endDate) {
                    const start = startDate ? new Date(startDate) : new Date(0);
                    const end = endDate ? new Date(endDate) : new Date('9999-12-31');
                    filtered = filtered.filter(c => {
                        const d = c.dateAdded ? new Date(c.dateAdded) : null;
                        return d && d >= start && d <= end;
                    });
                }
                // Sort by most recent
                filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                // Paginate
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
                // --- order by created_at DESC to get most recent ---
                .order('created_at', { ascending: false });

            // Date range filter on created_at
            if (startDate) {
                const iso = (startDate instanceof Date) ? startDate.toISOString() : new Date(startDate).toISOString();
                query = query.gte('created_at', iso);
            }
            if (endDate) {
                const iso = (endDate instanceof Date) ? endDate.toISOString() : new Date(endDate).toISOString();
                query = query.lte('created_at', iso);
            }

            // Text search
            const termLower = searchTerm.trim().toLowerCase();
            if (termLower) {
                query = query.or(
                    `name.ilike.%${termLower}%,email.ilike.%${termLower}%,phone.ilike.%${termLower}%`
                );
            }

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage - 1;
            query = query.range(startIndex, endIndex);

            const { data, error, count } = await query;
            if (error) {
                console.error('useCustomers hook error:', error);
                throw error;
            }
            let filteredData = data || [];
            // JS filter for joined user name
            if (termLower) {
                filteredData = filteredData.filter(
                    c =>
                        (c.name && c.name.toLowerCase().includes(termLower)) ||
                        (c.email && c.email.toLowerCase().includes(termLower)) ||
                        (c.phone && c.phone.toLowerCase().includes(termLower)) ||
                        (c.users?.name && c.users.name.toLowerCase().includes(termLower))
                );
            }
            const totalCount = count || 0;
            const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
            return {
                customers: filteredData.map(c => ({
                    ...c,
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                })),
                totalPages,
                totalCount,
            };
        },
        staleTime: 1000 * 60 * 5,
    });
}