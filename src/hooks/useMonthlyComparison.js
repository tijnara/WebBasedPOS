// src/hooks/useMonthlyComparison.js
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useMonthlyComparison(selectedMonthStr, storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    const { data: monthlyComparisonData, isLoading } = useQuery({
        queryKey: ['monthly-performance-comparison', targetStoreId, selectedMonthStr],
        queryFn: async () => {
            const baseDate = selectedMonthStr ? new Date(`${selectedMonthStr}-01T00:00:00+08:00`) : new Date();

            const curStart = format(startOfMonth(baseDate), 'yyyy-MM-dd');
            const curEnd = format(endOfMonth(baseDate), 'yyyy-MM-dd');
            const prevMonthDate = subMonths(baseDate, 1);
            const prevStart = format(startOfMonth(prevMonthDate), 'yyyy-MM-dd');
            const prevEnd = format(endOfMonth(prevMonthDate), 'yyyy-MM-dd');

            const curStartIso = new Date(`${curStart}T00:00:00+08:00`).toISOString();
            const curEndIso = new Date(`${curEnd}T23:59:59.999+08:00`).toISOString();
            const prevStartIso = new Date(`${prevStart}T00:00:00+08:00`).toISOString();
            const prevEndIso = new Date(`${prevEnd}T23:59:59.999+08:00`).toISOString();

            const [curSalesRes, prevSalesRes, curExpensesRes, prevExpensesRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('totalamount')
                    .eq('store_id', targetStoreId)
                    .gte('saletimestamp', curStartIso)
                    .lte('saletimestamp', curEndIso),
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
                    .gte('expense_date', curStartIso)
                    .lte('expense_date', curEndIso),
                supabase
                    .from('expenses')
                    .select('amount')
                    .eq('store_id', targetStoreId)
                    .gte('expense_date', prevStartIso)
                    .lte('expense_date', prevEndIso),
            ]);

            const curGross = (curSalesRes.data || []).reduce((acc, s) => acc + (Number(s.totalamount) || 0), 0);
            const prevGross = (prevSalesRes.data || []).reduce((acc, s) => acc + (Number(s.totalamount) || 0), 0);
            const curExp = (curExpensesRes.data || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
            const prevExp = (prevExpensesRes.data || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

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
        staleTime: 1000 * 60 * 5
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