// src/hooks/useReturningCustomers.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { subWeeks, startOfDay, endOfDay } from 'date-fns';

const normalizeManilaDate = (val, isEnd = false) => {
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
        return new Date(`${val.trim()}T${isEnd ? '23:59:59.999' : '00:00:00.000'}+08:00`);
    }
    const d = new Date(val);
    return isEnd ? endOfDay(d) : startOfDay(d);
};

export function useReturningCustomers(startDate, endDate, storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['returning-customers', targetStoreId, startDate, endDate],
        queryFn: async () => {
            if (!startDate || !endDate) return [];

            const currentPeriodStart = normalizeManilaDate(startDate, false);
            const twoWeeksBeforeStart = subWeeks(currentPeriodStart, 2).toISOString();
            const queryEndDate = normalizeManilaDate(endDate, true).toISOString();

            const { data: recentSales, error } = await supabase
                .from('sales')
                .select('customername, saletimestamp, totalamount')
                .eq('store_id', targetStoreId)
                .gte('saletimestamp', twoWeeksBeforeStart)
                .lte('saletimestamp', queryEndDate)
                .eq('status', 'Completed');

            if (error) {
                console.error('Supabase Error in Returning Customers:', error.message);
                throw error;
            }

            const customerStats = {};
            (recentSales || []).forEach(sale => {
                if (!sale.customername || sale.customername === 'Walk-in') return;

                if (!customerStats[sale.customername]) {
                    customerStats[sale.customername] = {
                        orderedCurrent: false,
                        orderedPrevious: false,
                        currentTotal: 0,
                        lastOrderDate: null
                    };
                }

                const saleDate = new Date(sale.saletimestamp);

                if (saleDate >= currentPeriodStart) {
                    customerStats[sale.customername].orderedCurrent = true;
                    customerStats[sale.customername].currentTotal += Number(sale.totalamount) || 0;

                    if (!customerStats[sale.customername].lastOrderDate || saleDate > new Date(customerStats[sale.customername].lastOrderDate)) {
                        customerStats[sale.customername].lastOrderDate = saleDate.toISOString();
                    }
                } else {
                    customerStats[sale.customername].orderedPrevious = true;
                }
            });

            return Object.entries(customerStats)
                .filter(([_, stats]) => stats.orderedCurrent && !stats.orderedPrevious)
                .map(([name, stats]) => ({
                    customerName: name,
                    currentTotal: stats.currentTotal,
                    lastOrderDate: stats.lastOrderDate,
                    missedPeriodStart: twoWeeksBeforeStart,
                    missedPeriodEnd: currentPeriodStart.toISOString()
                }));
        },
        enabled: !!startDate && !!endDate
    });
}