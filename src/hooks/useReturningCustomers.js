import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { subWeeks, startOfDay, endOfDay } from 'date-fns';

export function useReturningCustomers(startDate, endDate) {
    return useQuery({
        queryKey: ['returning-customers', startDate, endDate],
        queryFn: async () => {
            if (!startDate || !endDate) return [];

            const twoWeeksBeforeStart = startOfDay(subWeeks(new Date(startDate), 2)).toISOString();
            const queryEndDate = endOfDay(new Date(endDate)).toISOString();
            const currentPeriodStart = new Date(startDate);

            // 1. Fetch sales from the last 2 weeks + current period using exact schema columns
            const { data: recentSales, error } = await supabase
                .from('sales')
                .select('customername, saletimestamp, totalamount')
                .gte('saletimestamp', twoWeeksBeforeStart)
                .lte('saletimestamp', queryEndDate)
                .eq('status', 'Completed');

            if (error) {
                console.error("Supabase Error in Returning Customers:", error.message);
                throw error;
            }

            // 2. Process data to find returning customers
            const customerStats = {};
            recentSales.forEach(sale => {
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

                    // Track the exact date they ordered in this current period
                    if (!customerStats[sale.customername].lastOrderDate || saleDate > new Date(customerStats[sale.customername].lastOrderDate)) {
                        customerStats[sale.customername].lastOrderDate = saleDate.toISOString();
                    }
                } else {
                    customerStats[sale.customername].orderedPrevious = true;
                }
            });

            // 3. Filter customers who ordered currently, but NOT in the previous 2 weeks
            return Object.entries(customerStats)
                .filter(([_, stats]) => stats.orderedCurrent && !stats.orderedPrevious)
                .map(([name, stats]) => ({
                    customerName: name,
                    currentTotal: stats.currentTotal,
                    lastOrderDate: stats.lastOrderDate,
                    missedPeriodStart: twoWeeksBeforeStart,
                    missedPeriodEnd: startOfDay(new Date(startDate)).toISOString() // Up to the start of the current period
                }));
        },
        enabled: !!startDate && !!endDate
    });
}