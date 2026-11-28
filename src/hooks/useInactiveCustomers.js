// src/hooks/useInactiveCustomers.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_INACTIVE_CUSTOMERS = [
    { id: 'mock-c-98', name: 'Old Customer', phone: '09123456789', last_order_date: '2025-10-01T10:00:00Z' },
    { id: 'mock-c-99', name: 'New Customer (No Orders)', phone: '09987654321', last_order_date: null },
    { id: 'mock-c-100', name: 'Another Inactive', phone: '09112223333', last_order_date: '2025-09-15T10:00:00Z' },
    { id: 'mock-c-101', name: 'Yet Another', phone: '09112224444', last_order_date: null },
    { id: 'mock-c-102', name: 'Long Ago', phone: '09112225555', last_order_date: '2024-12-01T10:00:00Z' },
    { id: 'mock-c-103', name: 'Way Back', phone: '09112226666', last_order_date: '2024-10-01T10:00:00Z' },
];

export function useInactiveCustomers(days_inactive = 14, { page = 1, itemsPerPage = 5, storeId = null } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['inactive-customers', targetStoreId, days_inactive, isDemo, page, itemsPerPage],
        queryFn: async () => {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 200));
                const sorted = [...MOCK_INACTIVE_CUSTOMERS].sort((a, b) => {
                    const da = a.last_order_date ? new Date(a.last_order_date) : new Date(0);
                    const db = b.last_order_date ? new Date(b.last_order_date) : new Date(0);
                    return db - da;
                });
                const slice = sorted.slice(startIndex, endIndex + 1);
                const hasMore = slice.length > itemsPerPage;
                const pageData = slice.slice(0, itemsPerPage);
                return { customers: pageData, hasMore };
            }

            let rpc = supabase.rpc('get_inactive_customers', {
                days_inactive,
                p_store_id: targetStoreId,
            });

            rpc = rpc.range(startIndex, endIndex);

            const { data, error } = await rpc;
            if (error) throw error;
            const list = data || [];
            const hasMore = list.length > itemsPerPage;
            const pageData = hasMore ? list.slice(0, itemsPerPage) : list;
            return { customers: pageData, hasMore };
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 10,
    });
}