// src/hooks/useMonthlyComparison.js
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

export function useMonthlyComparison(selectedMonthStr) {
    const { data: monthlyComparisonData, isLoading } = useQuery({
        queryKey: ['monthly-performance-comparison', selectedMonthStr],
        queryFn: async () => {
            // Use the explicitly selected month, localized to Asia/Manila
            const baseDate = selectedMonthStr ? new Date(`${selectedMonthStr}-01T00:00:00+08:00`) : new Date();

            const curStart = format(startOfMonth(baseDate), 'yyyy-MM-dd');
            const curEnd = format(endOfMonth(baseDate), 'yyyy-MM-dd');
            const prevMonthDate = subMonths(baseDate, 1);
            const prevStart = format(startOfMonth(prevMonthDate), 'yyyy-MM-dd');
            const prevEnd = format(endOfMonth(prevMonthDate), 'yyyy-MM-dd');

            // Sales queries
            const { data: curSales } = await supabase
                .from('sales')
                .select('totalamount')
                .gte('saletimestamp', `${curStart}T00:00:00+08:00`)
                .lte('saletimestamp', `${curEnd}T23:59:59+08:00`);

            const { data: prevSales } = await supabase
                .from('sales')
                .select('totalamount')
                .gte('saletimestamp', `${prevStart}T00:00:00+08:00`)
                .lte('saletimestamp', `${prevEnd}T23:59:59+08:00`);

            // Expenses queries
            const { data: curExpenses } = await supabase
                .from('expenses')
                .select('amount')
                .gte('expense_date', curStart)
                .lte('expense_date', `${curEnd}T23:59:59`);

            const { data: prevExpenses } = await supabase
                .from('expenses')
                .select('amount')
                .gte('expense_date', prevStart)
                .lte('expense_date', `${prevEnd}T23:59:59`);

            const curGross = (curSales || []).reduce((acc, s) => acc + (Number(s.totalamount) || 0), 0);
            const prevGross = (prevSales || []).reduce((acc, s) => acc + (Number(s.totalamount) || 0), 0);
            const curExp = (curExpenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
            const prevExp = (prevExpenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

            const curNet = curGross - curExp;
            const prevNet = prevGross - prevExp;

            return {
                currentMonth: {
                    name: format(baseDate, 'MMMM yyyy'),
                    shortName: format(baseDate, 'MMM yyyy'),
                    gross: curGross,
                    expenses: curExp,
                    net: curNet,
                    margin: curGross > 0 ? ((curNet / curGross) * 100).toFixed(1) : '0.0'
                },
                prevMonth: {
                    name: format(prevMonthDate, 'MMMM yyyy'),
                    shortName: format(prevMonthDate, 'MMM yyyy'),
                    gross: prevGross,
                    expenses: prevExp,
                    net: prevNet,
                    margin: prevGross > 0 ? ((prevNet / prevGross) * 100).toFixed(1) : '0.0'
                }
            };
        },
        staleTime: 1000 * 60 * 5 // Cache for 5 mins
    });

    const momNetGrowth = useMemo(() => {
        if (!monthlyComparisonData) return null;
        const cur = monthlyComparisonData.currentMonth.net;
        const prev = monthlyComparisonData.prevMonth.net;
        if (prev === 0) return cur > 0 ? 100 : 0;
        return (((cur - prev) / Math.abs(prev)) * 100).toFixed(1);
    }, [monthlyComparisonData]);

    return { monthlyComparisonData, momNetGrowth, isLoading };
}