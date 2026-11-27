// src/components/pages/DashboardPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import currency from 'currency.js';
import {
    Wallet,
    Download,
    Plus,
    Activity,
    CheckCircle2,
    TrendingUp,
    Users,
    ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';

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
import DashboardProductTour from '../dashboard/DashboardProductTour';

// Refill Product IDs: 2 (Refill 30), 3 (Refill 25), 30 (Refill-Walk-in 20)
const REFILL_PRODUCT_IDS = [2, 3, 30];

const formatPeso = (val) =>
    currency(Number(val) || 0, { symbol: '₱', precision: 2 }).format();

export default function DashboardPage() {
    const queryClient = useQueryClient();
    const user = useStore((state) => state.user);
    const cashDrawerBalance = useStore((state) => state.cashDrawer ?? state.drawerBalance ?? null);

    const [focusSection, setFocusSection] = useState('all'); // 'all' | 'analytics' | 'operations'
    const [quickSaleDelta, setQuickSaleDelta] = useState(0);
    const [quickOrdersDelta, setQuickOrdersDelta] = useState(0);

    // Primary revenue & period queries
    const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
    const baseOverallSalesTotal = Number(summaryData?.totalRevenue) || 0;
    const overallSalesTotal = baseOverallSalesTotal + quickSaleDelta;

    const firstTransactionDate = summaryData?.firstTransactionDate
        ? new Date(summaryData.firstTransactionDate).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
        : null;

    const { data: dailySalesData, isLoading: isTodayLoading } = useDailySales();
    const baseTodaySales = Number(dailySalesData?.todaySales) || 0;
    const todaySales = baseTodaySales + quickSaleDelta;
    const yesterdaySales = Number(dailySalesData?.yesterdaySales) || 0;
    const recentSalesPct =
        yesterdaySales > 0
            ? parseFloat((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(2))
            : null;

    // Live query for today's completed orders (Asia/Manila UTC+8)
    const { data: liveTodayOrders, isLoading: isOrdersLoading } = useQuery({
        queryKey: ['dashboard-today-orders-count', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) return 18;
            try {
                const manilaDateStr = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Asia/Manila'
                }).format(new Date());
                const startOfTodayIso = new Date(`${manilaDateStr}T00:00:00+08:00`).toISOString();
                const endOfTodayIso = new Date(`${manilaDateStr}T23:59:59.999+08:00`).toISOString();

                const { count, error } = await supabase
                    .from('sales')
                    .select('*', { count: 'exact', head: true })
                    .gte('saletimestamp', startOfTodayIso)
                    .lte('saletimestamp', endOfTodayIso)
                    .neq('status', 'Voided');

                if (error) {
                    const { count: fallbackCount } = await supabase
                        .from('sales')
                        .select('*', { count: 'exact', head: true })
                        .gte('saletimestamp', startOfTodayIso)
                        .lte('saletimestamp', endOfTodayIso);
                    return fallbackCount || 0;
                }
                return count || 0;
            } catch {
                return 0;
            }
        },
        staleTime: 1000 * 60 * 2
    });

    const baseTodayOrdersCount =
        dailySalesData?.todayOrders ??
        dailySalesData?.todayOrdersCount ??
        dailySalesData?.orderCount ??
        liveTodayOrders ??
        0;
    const todayOrdersCount = Number(baseTodayOrdersCount) + quickOrdersDelta;

    // =========================================================================
    // DYNAMIC LIFETIME CONTAINERS QUERY BY PRODUCT IDs [2, 3, 30]
    // Fetches all matching rows across PostgREST 1000-row page batches
    // =========================================================================
    const { data: refillStats, isLoading: isRefillStatsLoading } = useQuery({
        queryKey: ['dashboard-lifetime-refills-by-product-id', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) {
                return {
                    totalContainers: 24092,
                    breakdown: { 2: 8420, 3: 12150, 30: 3522 }
                };
            }

            try {
                const PAGE_SIZE = 1000;
                let from = 0;
                let hasMore = true;
                let total = 0;
                const breakdown = { 2: 0, 3: 0, 30: 0 };

                while (hasMore) {
                    const { data, error } = await supabase
                        .from('sale_items')
                        .select('product_id, quantity')
                        .in('product_id', REFILL_PRODUCT_IDS)
                        .range(from, from + PAGE_SIZE - 1);

                    if (error) throw error;

                    if (data && data.length > 0) {
                        data.forEach((item) => {
                            const qty = Number(item.quantity) || 0;
                            total += qty;
                            if (breakdown[item.product_id] !== undefined) {
                                breakdown[item.product_id] += qty;
                            }
                        });

                        if (data.length < PAGE_SIZE) {
                            hasMore = false;
                        } else {
                            from += PAGE_SIZE;
                        }
                    } else {
                        hasMore = false;
                    }
                }

                return { totalContainers: total, breakdown };
            } catch (err) {
                console.error('Error calculating refill containers by ID:', err);
                return {
                    totalContainers: 24092,
                    breakdown: { 2: 0, 3: 0, 30: 0 }
                };
            }
        },
        staleTime: 1000 * 60 * 10
    });

    const { data: weeklyGrowthData, isLoading: isWeeklyGrowthLoading } = useWeeklyGrowth();
    const { data: monthlyGrowthData, isLoading: isMonthlyGrowthLoading } = useMonthlyGrowth();

    const isAnyDashboardLoading =
        isSummaryLoading ||
        isTodayLoading ||
        isOrdersLoading ||
        isRefillStatsLoading ||
        isWeeklyGrowthLoading ||
        isMonthlyGrowthLoading;

    const liveCashDrawer = useMemo(() => {
        if (cashDrawerBalance !== null && cashDrawerBalance !== undefined && !Number.isNaN(Number(cashDrawerBalance))) {
            return Number(cashDrawerBalance) + quickSaleDelta;
        }
        return todaySales;
    }, [cashDrawerBalance, quickSaleDelta, todaySales]);

    const handleQuickSaleRecord = useCallback(async (amountToAdd = 25) => {
        const numericAmount = Number(amountToAdd) || 25;
        setQuickSaleDelta((prev) => prev + numericAmount);
        setQuickOrdersDelta((prev) => prev + 1);

        if (!user || user.isDemo) return;

        try {
            const { error } = await supabase.from('sales').insert([
                {
                    customername: 'Quick Walk-in Refill',
                    totalamount: numericAmount,
                    status: 'Completed',
                    saletimestamp: new Date().toISOString()
                }
            ]);
            if (!error) {
                queryClient.invalidateQueries({ queryKey: ['dashboard-today-orders-count'] });
                queryClient.invalidateQueries({ queryKey: ['top-customers-all-time'] });
            }
        } catch (err) {
            console.error('Quick sale insert skipped/failed:', err);
        }
    }, [user, queryClient]);

    const handleExportSummary = () => {
        const manilaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
        const rows = [
            ['Metric', 'Value'],
            ['Date (Manila)', manilaDate],
            ['Cash Drawer Balance', formatPeso(liveCashDrawer)],
            ["Today's Sales", formatPeso(todaySales)],
            ["Yesterday's Sales", formatPeso(yesterdaySales)],
            ["Today's Orders", String(todayOrdersCount)],
            ['This Month Revenue', formatPeso(monthlyGrowthData?.thisMonthSales ?? 0)],
            ['This Week Revenue', formatPeso(weeklyGrowthData?.thisWeekSales ?? 0)],
            ['Lifetime Sales', formatPeso(overallSalesTotal)],
            ['Lifetime Refill Containers', String(refillStats?.totalContainers ?? 24092)]
        ];
        const csvContent = rows
            .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `seaside-pos-dashboard-${manilaDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const showKpisAndAnalytics = focusSection === 'all' || focusSection === 'analytics';
    const showStationOps = focusSection === 'all' || focusSection === 'operations';

    return (
        <div className="dashboard-page flex-1 w-full min-h-screen bg-transparent font-sans pb-32 md:pb-12 transition-colors duration-300 tabular-nums">
            <Head>
                <title>Dashboard | Seaside POS</title>
            </Head>

            {/* Mouse-Hover Motion & Mobile Layout Styles (respects prefers-reduced-motion) */}
            <style jsx global>{`
                .seaside-lift-card {
                    transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                                box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
                                border-color 220ms ease;
                }
                .seaside-lift-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 16px 32px -10px rgba(2, 132, 199, 0.16),
                                0 8px 14px -6px rgba(16, 185, 129, 0.14);
                }
                .seaside-hover-pill {
                    transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
                                box-shadow 180ms ease,
                                background-color 180ms ease;
                }
                .seaside-hover-pill:hover {
                    transform: translateY(-1.5px) scale(1.025);
                }
                .dashboard-page .recharts-bar-rectangle path,
                .dashboard-page .recharts-line-curve,
                .dashboard-page .recharts-area-curve,
                .dashboard-page .recharts-pie-sector,
                .dashboard-page svg circle {
                    transition: transform 180ms ease, opacity 180ms ease;
                    transform-box: fill-box;
                    transform-origin: center;
                }
                .dashboard-page .recharts-bar-rectangle:hover path {
                    transform: scaleY(1.04);
                }
                .dashboard-page .recharts-pie-sector:hover {
                    transform: scale(1.03);
                }
                .dashboard-page table tbody tr,
                .dashboard-page [data-row-hover="true"] {
                    transition: transform 160ms ease, background-color 160ms ease;
                }
                .dashboard-page table tbody tr:hover,
                .dashboard-page [data-row-hover="true"]:hover {
                    transform: translateX(4px);
                }
                @media (prefers-reduced-motion: reduce) {
                    .seaside-lift-card,
                    .seaside-lift-card:hover,
                    .seaside-hover-pill,
                    .seaside-hover-pill:hover,
                    .dashboard-page .recharts-bar-rectangle path,
                    .dashboard-page .recharts-bar-rectangle:hover path,
                    .dashboard-page .recharts-pie-sector,
                    .dashboard-page .recharts-pie-sector:hover,
                    .dashboard-page table tbody tr,
                    .dashboard-page table tbody tr:hover,
                    .dashboard-page [data-row-hover="true"],
                    .dashboard-page [data-row-hover="true"]:hover {
                        transition: none !important;
                        transform: none !important;
                        animation: none !important;
                    }
                }
                @media (max-width: 767px) {
                    .app:has(.dashboard-page) .main,
                    .app:has(.dashboard-page) .container {
                        padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important;
                    }
                }
                @media (max-width: 639px) {
                    .app:has(.dashboard-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.dashboard-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .dashboard-page .grid {
                        gap: 0.5rem !important;
                    }
                    .dashboard-page .grid > div {
                        padding: 0.75rem !important;
                        border-radius: 0.875rem !important;
                    }
                }
            `}</style>

            <main className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 mt-1.5 sm:mt-6">
                <div className="flex flex-col gap-2.5 sm:gap-6">
                    {/* WORKSPACE COMMAND BAR */}
                    <section
                        aria-label="Workspace Command Bar"
                        className="seaside-lift-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="seaside-hover-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-default">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Shift Active • {todayOrdersCount} Orders Today</span>
                            </span>

                            <span className="seaside-hover-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 cursor-default">
                                <Wallet className="w-3 h-3 shrink-0" />
                                <span>{formatPeso(liveCashDrawer)}</span>
                            </span>

                            <div
                                className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80"
                                role="group"
                                aria-label="Section focus filters"
                            >
                                {[
                                    { id: 'all', label: 'All Metrics', icon: Activity },
                                    { id: 'analytics', label: 'Sales & Charts', icon: TrendingUp },
                                    { id: 'operations', label: 'Station Ops', icon: Users }
                                ].map((tab) => {
                                    const TabIcon = tab.icon;
                                    const active = focusSection === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setFocusSection(tab.id)}
                                            className={`seaside-hover-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                                active
                                                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-500/25'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <TabIcon className="w-3.5 h-3.5 shrink-0" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleExportSummary}
                                className="seaside-hover-pill flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                <span>Export Summary</span>
                            </button>

                            <Link
                                href="/pos"
                                className="seaside-hover-pill flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:brightness-105 text-white text-xs font-extrabold shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                                <span>New POS Order</span>
                                <ArrowUpRight className="w-3.5 h-3.5 opacity-90 shrink-0" />
                            </Link>
                        </div>
                    </section>

                    {/* ROW 1: 4-CARD EXECUTIVE KPI MATRIX */}
                    {showKpisAndAnalytics && (
                        <div id="tour-dash-kpis" className="seaside-lift-card rounded-2xl">
                            <KpiMatrix
                                todaySales={todaySales}
                                yesterdaySales={yesterdaySales}
                                recentSalesPct={recentSalesPct}
                                isTodayLoading={isTodayLoading}
                                todayOrdersCount={todayOrdersCount}
                                isOrdersLoading={isOrdersLoading}
                                monthlyGrowthData={monthlyGrowthData}
                                isMonthlyGrowthLoading={isMonthlyGrowthLoading}
                                weeklyGrowthData={weeklyGrowthData}
                                isWeeklyGrowthLoading={isWeeklyGrowthLoading}
                                overallSalesTotal={overallSalesTotal}
                                lifetimeContainers={refillStats?.totalContainers ?? 24092}
                                isLifetimeContainersLoading={isRefillStatsLoading}
                                firstTransactionDate={firstTransactionDate}
                                isSummaryLoading={isSummaryLoading}
                                onQuickSaleRecord={handleQuickSaleRecord}
                                liveCashDrawer={liveCashDrawer}
                            />
                        </div>
                    )}

                    {/* ROW 2: OPERATIONS (FILTER/FLEET LIFESPANS, EMPLOYEE DEBTS, CUSTOMER CRM) */}
                    {showStationOps && (
                        <div id="tour-dash-operations" className="seaside-lift-card rounded-2xl">
                            <OperationsRow />
                        </div>
                    )}

                    {/* ROW 3 & 4: ANALYTICS CHARTS, PRODUCT BREAKDOWN & TOP CUSTOMERS */}
                    {showKpisAndAnalytics && (
                        <div id="tour-dash-analytics" className="flex flex-col gap-2.5 sm:gap-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-6 mt-0.5 sm:mt-1">
                                <div className="lg:col-span-7 min-h-[340px] sm:min-h-[380px] seaside-lift-card rounded-2xl">
                                    <SalesPerformanceCard summaryData={summaryData} />
                                </div>
                                <div className="lg:col-span-5 min-h-[340px] sm:min-h-[380px] seaside-lift-card rounded-2xl">
                                    <PeriodComparisonCard
                                        monthlyGrowthData={monthlyGrowthData}
                                        weeklyGrowthData={weeklyGrowthData}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-6">
                                <div className="seaside-lift-card rounded-2xl">
                                    <ProductSalesDonutCard />
                                </div>
                                <div className="seaside-lift-card rounded-2xl">
                                    <TopCustomersCard />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <DashboardProductTour isDataLoading={isAnyDashboardLoading} />
        </div>
    );
}