// src/hooks/useWeeklyComparison.js
import { useQuery } from '@tanstack/react-query';
import { subWeeks, format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

export function useWeeklyComparison(dateFromStr, dateToStr) {
    return useQuery({
        queryKey: ['weekly-performance-comparison', dateFromStr, dateToStr],
        queryFn: async () => {
            if (!dateFromStr || !dateToStr) return null;

            const curStart = new Date(`${dateFromStr}T00:00:00+08:00`);
            const curEnd = new Date(`${dateToStr}T23:59:59+08:00`);

            const prevStartDate = subWeeks(curStart, 1);
            const prevEndDate = subWeeks(curEnd, 1);

            const prevStart = format(prevStartDate, 'yyyy-MM-dd');
            const prevEnd = format(prevEndDate, 'yyyy-MM-dd');

            // Fetch Sales
            const { data: prevSales } = await supabase
                .from('sales')
                .select('totalamount')
                .gte('saletimestamp', `${prevStart}T00:00:00+08:00`)
                .lte('saletimestamp', `${prevEnd}T23:59:59+08:00`);

            // Fetch Expenses
            const { data: prevExpenses } = await supabase
                .from('expenses')
                .select('amount')
                .gte('expense_date', prevStart)
                .lte('expense_date', `${prevEnd}T23:59:59`);

            const prevGross = (prevSales || []).reduce((acc, s) => acc + (Number(s.totalamount) || 0), 0);
            const prevExp = (prevExpenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
            const prevNet = prevGross - prevExp;

            return {
                name: `${format(prevStartDate, 'MMM d')} - ${format(prevEndDate, 'MMM d')}`,
                gross: prevGross,
                expenses: prevExp,
                net: prevNet,
                margin: prevGross > 0 ? ((prevNet / prevGross) * 100).toFixed(1) : '0.0'
            };
        },
        staleTime: 1000 * 60 * 5 // Cache for 5 mins
    });
}