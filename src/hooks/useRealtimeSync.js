// src/hooks/useRealtimeSync.js
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const DOMAIN_QUERY_KEYS = {
    sales: [
        ['sales'],
        ['sales-summary'],
        ['daily-sales'],
        ['weekly-growth'],
        ['monthly-growth'],
        ['dashboard-today-orders-count'],
        ['dashboard-lifetime-refills-by-product-id'],
        ['top-products-summary'],
        ['frequent-customers']
    ],
    inventory: [
        ['products'],
        ['navbar-low-stock-products']
    ],
    customers: [
        ['customers'],
        ['customers-all-lookup'],
        ['customer_debts'],
        ['customer-stats']
    ],
    expenses: [
        ['expenses'],
        ['expense-summary'],
        ['expense-categories'],
        ['salary-records']
    ],
    employees: [
        ['employees']
    ],
    debts: [
        ['debts'],
        ['salary-records']
    ],
    scannedLogs: [
        ['scanned-logs']
    ],
    shifts: [
        ['sales', 'active-shift']
    ],
    activityLogs: [
        ['activity-logs']
    ]
};

const TABLE_DOMAIN = {
    sales: 'sales',
    sale_items: 'sales',
    products: 'inventory',
    stock_movements: 'inventory',
    customers: 'customers',
    customer_debts: 'customers',
    expenses: 'expenses',
    expense_categories: 'expenses',
    employees: 'employees',
    debts: 'debts',
    debt_payments: 'debts',
    scanned_sales_logs: 'scannedLogs',
    shifts: 'shifts',
    activity_logs: 'activityLogs'
};

export function useRealtimeSync() {
    const queryClient = useQueryClient();
    const user = useStore((s) => s.user);
    const timersRef = useRef({});
    const hiddenAtRef = useRef(null);

    const storeId = Number(user?.store_id) || 1;

    useEffect(() => {
        if (!user?.id || user?.isDemo) return;

        const scheduleInvalidate = (domain) => {
            if (timersRef.current[domain]) {
                clearTimeout(timersRef.current[domain]);
            }

            timersRef.current[domain] = setTimeout(() => {
                const keys = DOMAIN_QUERY_KEYS[domain] || [];
                keys.forEach((queryKey) => {
                    queryClient.invalidateQueries({ queryKey });
                });
                delete timersRef.current[domain];
            }, 350);
        };

        const channel = supabase
            .channel(`rt:pos-global-sync-${storeId}-${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    const domain = TABLE_DOMAIN[payload.table];
                    if (!domain) return;

                    // Ignore realtime events belonging to other stores
                    const eventStoreId = payload.new?.store_id ?? payload.old?.store_id;
                    if (eventStoreId !== undefined && eventStoreId !== null && Number(eventStoreId) !== storeId) {
                        return;
                    }

                    scheduleInvalidate(domain);
                }
            )
            .subscribe();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                hiddenAtRef.current = Date.now();
            } else if (
                document.visibilityState === 'visible' &&
                hiddenAtRef.current
            ) {
                const awayMs = Date.now() - hiddenAtRef.current;
                hiddenAtRef.current = null;

                if (awayMs > 15000) {
                    Object.keys(DOMAIN_QUERY_KEYS).forEach(scheduleInvalidate);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            Object.values(timersRef.current).forEach(clearTimeout);
            timersRef.current = {};
            supabase.removeChannel(channel);
        };
    }, [user?.id, user?.isDemo, storeId, queryClient]);
}