// src/components/pages/DashboardPage.jsx
import React from 'react';
import Head from 'next/head';

// Custom Hooks
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useDailySales } from '../../hooks/useDailySales';
import { useWeeklyGrowth } from '../../hooks/useWeeklyGrowth';
import { useMonthlyGrowth } from '../../hooks/useMonthlyGrowth';

// Modular Subcomponents
import KpiMatrix from '../dashboard/KpiMatrix';
import OperationsRow from '../dashboard/OperationsRow';
import SalesPerformanceCard from '../dashboard/SalesPerformanceCard';
import PeriodComparisonCard from '../dashboard/PeriodComparisonCard';
import ProductSalesDonutCard from '../dashboard/ProductSalesDonutCard';
import TopCustomersCard from '../dashboard/TopCustomersCard';

export default function DashboardPage() {
    // Primary revenue & period queries
    const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
    const overallSalesTotal = summaryData?.totalRevenue || 0;
    const firstTransactionDate = summaryData?.firstTransactionDate
        ? new Date(summaryData.firstTransactionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    const { data: dailySalesData, isLoading: isTodayLoading } = useDailySales();
    const todaySales = dailySalesData?.todaySales || 0;
    const yesterdaySales = dailySalesData?.yesterdaySales || 0;
    const recentSalesPct = yesterdaySales > 0
        ? parseFloat((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(2))
        : null;

    const { data: weeklyGrowthData, isLoading: isWeeklyGrowthLoading } = useWeeklyGrowth();
    const { data: monthlyGrowthData, isLoading: isMonthlyGrowthLoading } = useMonthlyGrowth();

    return (
        <div className="flex-1 min-h-screen bg-transparent font-sans responsive-page pb-12 transition-colors duration-300">
            <Head>
                <title>Dashboard | Seaside POS</title>
            </Head>

            <main className="max-w-7xl mx-auto px-3.5 sm:px-6 mt-4 sm:mt-6">
                <div className="flex flex-col gap-5 sm:gap-6">
                    {/* ROW 1: 4-CARD EXECUTIVE KPI MATRIX */}
                    <KpiMatrix
                        todaySales={todaySales}
                        yesterdaySales={yesterdaySales}
                        recentSalesPct={recentSalesPct}
                        isTodayLoading={isTodayLoading}
                        monthlyGrowthData={monthlyGrowthData}
                        isMonthlyGrowthLoading={isMonthlyGrowthLoading}
                        weeklyGrowthData={weeklyGrowthData}
                        isWeeklyGrowthLoading={isWeeklyGrowthLoading}
                        overallSalesTotal={overallSalesTotal}
                        firstTransactionDate={firstTransactionDate}
                        isSummaryLoading={isSummaryLoading}
                    />

                    {/* ROW 2: OPERATIONS (FILTER/FLEET LIFESPANS, EMPLOYEE DEBTS, CUSTOMER CRM) */}
                    <OperationsRow />

                    {/* ROW 3: CHARTS (SALES PERFORMANCE & PERIOD COMPARISON) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mt-1">
                        <div className="lg:col-span-7 min-h-[360px] sm:min-h-[380px]">
                            <SalesPerformanceCard summaryData={summaryData} />
                        </div>
                        <div className="lg:col-span-5 min-h-[360px] sm:min-h-[380px]">
                            <PeriodComparisonCard
                                monthlyGrowthData={monthlyGrowthData}
                                weeklyGrowthData={weeklyGrowthData}
                            />
                        </div>
                    </div>

                    {/* ROW 4: PRODUCT BREAKDOWN & TOP CUSTOMERS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                        <ProductSalesDonutCard />
                        <TopCustomersCard />
                    </div>
                </div>
            </main>
        </div>
    );
}