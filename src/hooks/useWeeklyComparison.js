// src/hooks/useWeeklyComparison.js
import { useQuery } from '@tanstack/react-query';
import { subWeeks, format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useWeeklyComparison(dateFromStr, dateToStr, storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['weekly-performance-comparison', targetStoreId, dateFromStr, dateToStr],
        queryFn: async () => {
            if (!dateFromStr || !dateToStr) return null;

            const curStart = new Date(`${dateFromStr}T00:00:00+08:00`);
            const curEnd = new Date(`${dateToStr}T23:59:59+08:00`);

            const prevStartDate = subWeeks(curStart, 1);
            const prevEndDate = subWeeks(curEnd, 1);

            const prevStart = format(prevStartDate, 'yyyy-MM-dd');
            const prevEnd = format(prevEndDate, 'yyyy-MM-dd');

            const prevStartIso = new Date(`${prevStart}T00:00:00+08:00`).toISOString();
            const prevEndIso = new Date(`${prevEnd}T23:59:59.999+08:00`).toISOString();

            const [salesRes, expensesRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('totalamount')
                    .eq('store_id', targetStoreId)
                    .gte('saletimestamp', prevStartIso)
                    .lte('saletimestamp', prevEndIso),
                supabase
                    .from('expenses')
                    .select('amount')
                    .eq('store_id', targetStoreId)
                    .gte('expense_date', prevStartIso)
                    .lte('expense_date', prevEndIso)
            ]);

            const prevGross = (salesRes.data || []).reduce((acc, s) => acc + (Number(s.totalamount) || 0), 0);
            const prevExp = (expensesRes.data || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
            const prevNet = prevGross - prevExp;

            return {
                name: `${format(prevStartDate, 'MMM d')} - ${format(prevEndDate, 'MMM d')}`,
                gross: prevGross,
                expenses: prevExp,
                net: prevNet,
                margin: prevGross > 0 ? ((prevNet / prevGross) * 100).toFixed(1) : '0.0'
            };
        },
        staleTime: 1000 * 60 * 5
    });
}