// src/hooks/useCustomers.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_CUSTOMERS = [
    {
        id: 'mock-c-1',
        name: 'Demo Customer A',
        phone: '09110000001',
        address: '123 Demo St.',
        credit_balance: 0,
        created_by_name: 'Demo Staff',
        created_by_color: '#3b82f6',
        created_at: new Date(),
        last_seen: new Date(),
        utang_approved_at: null,
        utang_approved_by: null
    },
    {
        id: 'mock-c-2',
        name: 'Demo Customer B',
        phone: '09110000002',
        address: '456 Demo Ave.',
        credit_balance: 250,
        created_by_name: 'Demo Staff',
        created_by_color: '#10b981',
        created_at: new Date(Date.now() - 86400000 * 5),
        last_seen: new Date(Date.now() - 86400000 * 2),
        utang_approved_at: new Date(Date.now() - 86400000 * 2),
        utang_approved_by: 'Estelita Archita'
    },
    {
        id: 'mock-c-3',
        name: 'Demo Customer C',
        phone: '09110000003',
        address: '789 Demo Blvd.',
        credit_balance: 0,
        created_by_name: 'Demo Staff',
        created_by_color: '#f59e0b',
        created_at: new Date(Date.now() - 86400000 * 20),
        last_seen: null,
        utang_approved_at: null,
        utang_approved_by: null
    },
];

// Map frontend UI sort keys to database column names in customers_view
const SORT_COLUMN_MAP = {
    name: 'name',
    phone: 'phone',
    address: 'address',
    dateAdded: 'created_at',
    lastSeen: 'last_seen',
    created_by: 'created_by_name',
    credit_balance: 'credit_balance',
    utangDate: 'utang_approved_at',
    approvedBy: 'utang_approved_by',
};

export function useCustomers({
                                 searchTerm = '',
                                 page = 1,
                                 itemsPerPage = 10,
                                 balanceFilter = 'all', // 'all' | 'debt' | 'zero'
                                 sortBy = 'created_at',
                                 sortDirection = 'desc',
                                 startDate = null,
                                 endDate = null
                             } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: [
            'customers',
            isDemo,
            searchTerm,
            page,
            itemsPerPage,
            balanceFilter,
            sortBy,
            sortDirection,
            startDate?.toISOString?.() || null,
            endDate?.toISOString?.() || null
        ],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();
            const dbSortColumn = SORT_COLUMN_MAP[sortBy] || 'created_at';
            const isAscending = sortDirection === 'asc';

            // --- 0. DEMO SIMULATION ---
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 300));
                let filtered = [...MOCK_CUSTOMERS];

                if (term) {
                    filtered = filtered.filter(c =>
                        (c.name && c.name.toLowerCase().includes(term)) ||
                        (c.phone && c.phone.toLowerCase().includes(term)) ||
                        (c.address && c.address.toLowerCase().includes(term)) ||
                        (c.utang_approved_by && c.utang_approved_by.toLowerCase().includes(term))
                    );
                }

                if (balanceFilter === 'debt') {
                    filtered = filtered.filter(c => Number(c.credit_balance) > 0);
                } else if (balanceFilter === 'zero') {
                    filtered = filtered.filter(c => Number(c.credit_balance) <= 0);
                }

                // Global sort on mock data
                filtered.sort((a, b) => {
                    let aVal = a[dbSortColumn];
                    let bVal = b[dbSortColumn];
                    if (aVal == null) return 1;
                    if (bVal == null) return -1;
                    if (typeof aVal === 'string') {
                        return isAscending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                    }
                    if (aVal instanceof Date && bVal instanceof Date) {
                        return isAscending ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
                    }
                    return isAscending ? aVal - bVal : bVal - aVal;
                });

                const totalCount = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

                return {
                    customers: paginated.map(c => ({
                        ...c,
                        dateAdded: c.created_at ? new Date(c.created_at) : null,
                        lastSeen: c.last_seen || null,
                        utangApprovedAt: c.utang_approved_at || null,
                        utangApprovedBy: c.utang_approved_by || null,
                        users: { name: c.created_by_name, color: c.created_by_color }
                    })),
                    totalPages,
                    totalCount
                };
            }

            // --- 1. SERVER-SIDE QUERY ON CUSTOMERS_VIEW ---
            let query = supabase
                .from('customers_view')
                .select('*', { count: 'exact' });

            // Balance Filter
            if (balanceFilter === 'debt') {
                query = query.gt('credit_balance', 0);
            } else if (balanceFilter === 'zero') {
                query = query.or('credit_balance.is.null,credit_balance.eq.0');
            }

            // Registration Date Range Filter
            if (startDate) {
                const iso = (startDate instanceof Date) ? startDate.toISOString() : new Date(startDate).toISOString();
                query = query.gte('created_at', iso);
            }
            if (endDate) {
                const iso = (endDate instanceof Date) ? endDate.toISOString() : new Date(endDate).toISOString();
                query = query.lte('created_at', iso);
            }

            // Search Term Filter
            if (term) {
                query = query.or(
                    `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%,utang_approved_by.ilike.%${term}%`
                );
            }

            // Server-Side Sorting on the entire database table
            query = query.order(dbSortColumn, {
                ascending: isAscending,
                nullsFirst: false
            });

            // Pagination Range
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage - 1;
            query = query.range(startIndex, endIndex);

            const { data, error, count } = await query;

            if (error) {
                console.error('useCustomers query error:', error);
                throw error;
            }

            const totalCount = count || 0;
            const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

            return {
                customers: (data || []).map(c => ({
                    ...c,
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                    lastSeen: c.last_seen || null,
                    utangApprovedAt: c.utang_approved_at || null,
                    utangApprovedBy: c.utang_approved_by || null,
                    users: {
                        name: c.created_by_name || null,
                        color: c.created_by_color || null
                    }
                })),
                totalPages,
                totalCount,
            };
        },
        staleTime: 1000 * 60 * 3,
    });
}

// Hook for Top KPI Summary Cards
export function useCustomerStats() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['customer-stats', isDemo],
        queryFn: async () => {
            if (isDemo) {
                return {
                    totalCustomers: 3,
                    totalDebt: 250,
                    customersWithDebt: 1,
                    cleanAccounts: 2
                };
            }

            const { data, count, error } = await supabase
                .from('customers')
                .select('credit_balance', { count: 'exact' });

            if (error) throw error;

            const totalCustomers = count || 0;
            let totalDebt = 0;
            let customersWithDebt = 0;

            (data || []).forEach(c => {
                const bal = parseFloat(c.credit_balance) || 0;
                if (bal > 0) {
                    totalDebt += bal;
                    customersWithDebt += 1;
                }
            });

            return {
                totalCustomers,
                totalDebt,
                customersWithDebt,
                cleanAccounts: Math.max(0, totalCustomers - customersWithDebt)
            };
        },
        staleTime: 1000 * 60 * 2,
    });
}