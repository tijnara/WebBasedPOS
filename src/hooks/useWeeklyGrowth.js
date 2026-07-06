// src/hooks/useWeeklyGrowth.js
import { useMemo } from 'react';
import { useSalesSummary } from './useSalesSummary';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export function useWeeklyGrowth(date = new Date()) {
    // This week's data
    const thisWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const { data: thisWeekData, isLoading: isThisWeekLoading } = useSalesSummary({
        startDate: thisWeekStart,
        endDate: thisWeekEnd,
    });

    // Previous week's data
    const lastWeekStart = startOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });
    const { data: lastWeekData, isLoading: isLastWeekLoading } = useSalesSummary({
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
    });

    const weeklyGrowth = useMemo(() => {
        const thisWeekSales = thisWeekData?.totalRevenue || 0;
        const lastWeekSales = lastWeekData?.totalRevenue || 0;
        const thisWeekGallons = thisWeekData?.totalGallons || 0;
        const lastWeekGallons = lastWeekData?.totalGallons || 0;

        const salesGrowth = lastWeekSales > 0 
            ? parseFloat((((thisWeekSales - lastWeekSales) / lastWeekSales) * 100).toFixed(2))
            : thisWeekSales > 0 ? 100 : 0;

        const gallonsGrowth = lastWeekGallons > 0
            ? parseFloat((((thisWeekGallons - lastWeekGallons) / lastWeekGallons) * 100).toFixed(2))
            : thisWeekGallons > 0 ? 100 : 0;

        return {
            thisWeekSales,
            lastWeekSales,
            salesGrowth,
            thisWeekGallons,
            lastWeekGallons,
            gallonsGrowth,
            thisWeekStart,
            thisWeekEnd,
            lastWeekStart,
            lastWeekEnd,
        };
    }, [thisWeekData, lastWeekData, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd]);

    return {
        data: weeklyGrowth,
        isLoading: isThisWeekLoading || isLastWeekLoading,
    };
}