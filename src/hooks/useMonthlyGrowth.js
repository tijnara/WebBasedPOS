// src/hooks/useMonthlyGrowth.js
import { useMemo } from 'react';
import { useSalesSummary } from './useSalesSummary';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function useMonthlyGrowth(date = new Date()) {
    // This month's data
    const thisMonthStart = startOfMonth(date);
    const thisMonthEnd = endOfMonth(date);
    const { data: thisMonthData, isLoading: isThisMonthLoading } = useSalesSummary({
        startDate: thisMonthStart,
        endDate: thisMonthEnd,
    });

    // Previous month's data
    const lastMonthStart = startOfMonth(subMonths(date, 1));
    const lastMonthEnd = endOfMonth(subMonths(date, 1));
    const { data: lastMonthData, isLoading: isLastMonthLoading } = useSalesSummary({
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
    });

    const monthlyGrowth = useMemo(() => {
        const thisMonthSales = thisMonthData?.totalRevenue || 0;
        const lastMonthSales = lastMonthData?.totalRevenue || 0;
        const thisMonthGallons = thisMonthData?.totalGallons || 0;
        const lastMonthGallons = lastMonthData?.totalGallons || 0;

        const salesGrowth = lastMonthSales > 0 
            ? parseFloat((((thisMonthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(2))
            : thisMonthSales > 0 ? 100 : 0;

        const gallonsGrowth = lastMonthGallons > 0
            ? parseFloat((((thisMonthGallons - lastMonthGallons) / lastMonthGallons) * 100).toFixed(2))
            : thisMonthGallons > 0 ? 100 : 0;

        return {
            thisMonthSales,
            lastMonthSales,
            salesGrowth,
            thisMonthGallons,
            lastMonthGallons,
            gallonsGrowth,
            thisMonthStart,
            thisMonthEnd,
            lastMonthStart,
            lastMonthEnd,
        };
    }, [thisMonthData, lastMonthData, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd]);

    return {
        data: monthlyGrowth,
        isLoading: isThisMonthLoading || isLastMonthLoading,
    };
}