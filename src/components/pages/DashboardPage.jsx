// src/components/pages/DashboardPage.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardContent, Select } from '../ui';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Query & DB imports
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';

// Custom hooks
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { useDailySales } from '../../hooks/useDailySales';
import { useWeeklyGrowth } from '../../hooks/useWeeklyGrowth';
import { useMonthlyGrowth } from '../../hooks/useMonthlyGrowth';

import { format } from 'date-fns';
import {
    Droplets,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Award,
    Users
} from 'lucide-react';

// Loading placeholder for dynamic charts
const ChartLoading = () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading Chart...
    </div>
);

// Dynamic imports for Chart components
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
    ssr: false,
    loading: () => <ChartLoading />
});
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
    ssr: false,
    loading: () => <ChartLoading />
});
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
    ssr: false,
    loading: () => <ChartLoading />
});

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// =========================================================================
// UNIFIED DUAL-METRIC PERIOD CARD (Sales Revenue + Gallon Volume Consolidated)
// =========================================================================
function UnifiedPeriodCard({
                               title,
                               currentSales,
                               previousSales,
                               salesGrowth,
                               currentGallons,
                               previousGallons,
                               gallonsGrowth,
                               currentRange,
                               previousRange,
                               rawCurrentSales = 0,
                               rawPreviousSales = 0,
                               isLoading
                           }) {
    const isSalesPositive = (salesGrowth || 0) >= 0;
    const isGalPositive = (gallonsGrowth || 0) >= 0;
    const paceRatio = rawPreviousSales > 0 ? Math.min(100, Math.round((rawCurrentSales / rawPreviousSales) * 100)) : 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
            <div>
                {/* Header: Title + Revenue Trend Pill */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 shrink-0">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            {title}
                        </span>
                    </div>

                    {salesGrowth !== undefined && salesGrowth !== null && !isLoading && (
                        <div
                            className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shrink-0 ${
                                isSalesPositive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            }`}
                        >
                            {isSalesPositive ? (
                                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                            ) : (
                                <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                            )}
                            <span>{Math.abs(salesGrowth).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                {/* Primary Metric: Monetary Revenue */}
                <div className="mt-1">
                    {isLoading ? (
                        <div className="h-6 sm:h-7 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    ) : (
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currentSales}
                        </h2>
                    )}
                </div>

                {/* Secondary Metric: Physical Gallon Volume (Integrated Chip) */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold truncate">
                        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                            {isLoading ? '...' : currentGallons}
                        </span>
                    </div>

                    {gallonsGrowth !== undefined && gallonsGrowth !== null && !isLoading && (
                        <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isGalPositive
                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                                    : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
                            }`}
                        >
                            {isGalPositive ? '↗' : '↘'} {Math.abs(gallonsGrowth).toFixed(1)}%
                        </span>
                    )}
                </div>

                {/* Progress Pace Bar */}
                <div className="mt-2.5 space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                isSalesPositive ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${paceRatio}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold text-slate-400">
                        <span>Pace: <strong className="text-slate-700 dark:text-slate-300">{paceRatio}%</strong></span>
                        <span className="truncate pl-1">Prior: <strong className="text-slate-600 dark:text-slate-400">{previousSales}</strong></span>
                    </div>
                </div>
            </div>

            {/* Bottom Period Label */}
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Period:</span>
                <span className="font-medium truncate pl-1">
                    {currentRange && previousRange ? `${currentRange} vs. ${previousRange}` : 'Current vs Prior'}
                </span>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const user = useStore(state => state.user);

    // Toggles for charts
    const [salesView, setSalesView] = useState('Monthly');
    const [periodGraphMode, setPeriodGraphMode] = useState('revenue');

    // Fetch live data from the database
    const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
    const overallSalesTotal = summaryData?.totalRevenue || 0;
    const firstTransactionDate = summaryData?.firstTransactionDate
        ? new Date(summaryData.firstTransactionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    const { data: topProducts, isLoading: isTopProductsLoading, isError: isTopProductsError } = useTopProductsSummary(5);

    const { data: dailySalesData, isLoading: isTodayLoading } = useDailySales();
    const todaySales = dailySalesData?.todaySales || 0;
    const yesterdaySales = dailySalesData?.yesterdaySales || 0;
    const recentSalesPct = yesterdaySales > 0
        ? parseFloat((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(2))
        : null;

    const { data: weeklyGrowthData, isLoading: isWeeklyGrowthLoading } = useWeeklyGrowth();
    const { data: monthlyGrowthData, isLoading: isMonthlyGrowthLoading } = useMonthlyGrowth();

    // Safe Numeric Metric Extractions
    const mThisSales = Number(monthlyGrowthData?.thisMonthSales) || 0;
    const mLastSales = Number(monthlyGrowthData?.lastMonthSales) || 0;
    const mSalesGrowth = monthlyGrowthData?.salesGrowth;

    const mThisGal = Number(monthlyGrowthData?.thisMonthGallons) || 0;
    const mLastGal = Number(monthlyGrowthData?.lastMonthGallons) || 0;
    const mGalGrowth = monthlyGrowthData?.gallonsGrowth;

    const wThisSales = Number(weeklyGrowthData?.thisWeekSales) || 0;
    const wLastSales = Number(weeklyGrowthData?.lastWeekSales) || 0;
    const wSalesGrowth = weeklyGrowthData?.salesGrowth;

    const wThisGal = Number(weeklyGrowthData?.thisWeekGallons) || 0;
    const wLastGal = Number(weeklyGrowthData?.lastWeekGallons) || 0;
    const wGalGrowth = weeklyGrowthData?.gallonsGrowth;

    // Clean Date Ranges
    const mRange = useMemo(() => {
        if (!monthlyGrowthData?.thisMonthStart) return null;
        try {
            const curStart = format(new Date(monthlyGrowthData.thisMonthStart), 'MMM d');
            const curEnd = format(new Date(monthlyGrowthData.thisMonthEnd || monthlyGrowthData.thisMonthStart), 'd');
            const prevStart = format(new Date(monthlyGrowthData.lastMonthStart), 'MMM d');
            const prevEnd = format(new Date(monthlyGrowthData.lastMonthEnd || monthlyGrowthData.lastMonthStart), 'd');
            return {
                current: `${curStart} - ${curEnd}`,
                previous: `${prevStart} - ${prevEnd}`
            };
        } catch {
            return null;
        }
    }, [monthlyGrowthData]);

    const wRange = useMemo(() => {
        if (!weeklyGrowthData?.thisWeekStart) return null;
        try {
            const curStart = format(new Date(weeklyGrowthData.thisWeekStart), 'MMM d');
            const curEnd = format(new Date(weeklyGrowthData.thisWeekEnd || weeklyGrowthData.thisWeekStart), 'd');
            const prevStart = format(new Date(weeklyGrowthData.lastWeekStart), 'MMM d');
            const prevEnd = format(new Date(weeklyGrowthData.lastWeekEnd || weeklyGrowthData.lastWeekStart), 'd');
            return {
                current: `${curStart} - ${curEnd}`,
                previous: `${prevStart} - ${prevEnd}`
            };
        } catch {
            return null;
        }
    }, [weeklyGrowthData]);

    // --- TOP 10 ALL-TIME CUSTOMERS ---
    const { data: topCustomers, isLoading: isTopCustomersLoading } = useQuery({
        queryKey: ['top-customers-all-time', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) {
                return [
                    { name: 'Demo Customer A', revenue: 125000.00 },
                    { name: 'Demo Customer B', revenue: 98000.50 },
                    { name: 'Demo Customer C', revenue: 85000.00 },
                    { name: 'Demo Customer D', revenue: 76000.25 },
                    { name: 'Demo Customer E', revenue: 68000.00 },
                    { name: 'Demo Customer F', revenue: 54000.00 },
                    { name: 'Demo Customer G', revenue: 49000.75 },
                    { name: 'Demo Customer H', revenue: 41000.00 },
                    { name: 'Demo Customer I', revenue: 32000.50 },
                    { name: 'Demo Customer J', revenue: 28000.00 },
                ];
            }

            const { data, error } = await supabase
                .from('sales')
                .select('customername, totalamount');

            if (error) throw error;

            const revenueByCustomer = {};
            data.forEach(sale => {
                const name = sale.customername;
                if (!name || name.toLowerCase() === 'n/a' || name.toLowerCase().includes('walk-in')) return;

                revenueByCustomer[name] = (revenueByCustomer[name] || 0) + Number(sale.totalamount || 0);
            });

            return Object.entries(revenueByCustomer)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
        },
        staleTime: 1000 * 60 * 60
    });

    const topCustomersTotal = useMemo(() => {
        if (!topCustomers || !topCustomers.length) return 0;
        return topCustomers.reduce((acc, c) => acc + (Number(c.revenue) || 0), 0);
    }, [topCustomers]);

    // Comparative Bar Graph: Current Period vs Previous Period
    const periodComparisonBarData = useMemo(() => {
        const isRev = periodGraphMode === 'revenue';

        return {
            labels: ['Monthly Analysis', 'Weekly Analysis'],
            datasets: [
                {
                    label: 'Current Period',
                    data: isRev ? [mThisSales, wThisSales] : [mThisGal, wThisGal],
                    backgroundColor: isRev ? '#10b981' : '#0284c7',
                    borderRadius: 6,
                    barPercentage: 0.55,
                    categoryPercentage: 0.65
                },
                {
                    label: 'Previous Period',
                    data: isRev ? [mLastSales, wLastSales] : [mLastGal, wLastGal],
                    backgroundColor: '#cbd5e1',
                    borderRadius: 6,
                    barPercentage: 0.55,
                    categoryPercentage: 0.65
                }
            ]
        };
    }, [periodGraphMode, mThisSales, wThisSales, mLastSales, wLastSales, mThisGal, wThisGal, mLastGal, wLastGal]);

    const periodComparisonBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#64748b',
                    font: { family: 'Inter', weight: '600', size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        const val = context.parsed.y;
                        const formatted = periodGraphMode === 'revenue'
                            ? `₱${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${Number(val).toLocaleString()} gal`;
                        return ` ${context.dataset.label}: ${formatted}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { weight: '600', size: 12 } }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (val) => periodGraphMode === 'revenue' ? `₱${(val / 1000).toFixed(0)}k` : `${val} gal`
                }
            }
        }
    };

    // =========================================================================
    // STEP 3 CHART 1: LINE CHART WITH HORIZONTAL, AUTO-SKIPPED X-AXIS TICKS
    // =========================================================================
    const lineChartData = useMemo(() => {
        if (!summaryData) return { labels: [], datasets: [] };

        let labels = [];
        let data = [];

        if (salesView === 'Monthly' && summaryData.monthlyRevenue) {
            const sortedMonths = Object.keys(summaryData.monthlyRevenue).sort();
            labels = sortedMonths.map(month => {
                const [year, m] = month.split('-');
                const date = new Date(year, Number(m) - 1);
                // Clean short format: e.g., Oct '25
                return `${date.toLocaleString('default', { month: 'short' })} '${String(year).slice(-2)}`;
            });
            data = sortedMonths.map(month => summaryData.monthlyRevenue[month]);

        } else if (salesView === 'Weekly' && summaryData.weeklyRevenue) {
            const sortedWeeks = Object.keys(summaryData.weeklyRevenue).sort();
            labels = sortedWeeks.map(weekStart => {
                const [year, m, d] = weekStart.split('-');
                const date = new Date(year, Number(m) - 1, d);
                return `${date.toLocaleString('default', { month: 'short', day: 'numeric' })}`;
            });
            data = sortedWeeks.map(week => summaryData.weeklyRevenue[week]);
        }

        return {
            labels,
            datasets: [
                {
                    label: `${salesView} Sales`,
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }
            ]
        };
    }, [summaryData, salesView]);

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                align: 'start',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#64748b',
                    font: { family: 'Inter', weight: '600', size: 13 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 13 },
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) label += `₱${(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: '600' },
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 7
                }
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}k`,
                    color: '#94a3b8',
                    font: { size: 11, weight: '500' },
                    padding: 8
                }
            }
        }
    };

    // =========================================================================
    // STEP 3 CHART 2: TOP 10 ALL-TIME CUSTOMERS (HORIZONTAL BAR WITH TICKS)
    // =========================================================================
    const topCustomersBarChartData = useMemo(() => {
        if (!topCustomers || topCustomers.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = topCustomers.map((c, index) => `${index + 1}. ${c.name}`);
        const data = topCustomers.map(c => c.revenue);

        return {
            labels: labels,
            datasets: [{
                label: 'Total Revenue',
                data: data,
                backgroundColor: '#10b981',
                borderRadius: 6,
                barPercentage: 0.65
            }]
        };
    }, [topCustomers]);

    const topCustomersBarChartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` Total Spend: ₱${context.parsed.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                border: { display: false },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}k`,
                    color: '#94a3b8',
                    font: { size: 11, weight: '500' }
                }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: '#475569',
                    font: { size: 12, weight: '600' }
                }
            }
        }
    };

    // =========================================================================
    // STEP 3 CHART 3: DOUGHNUT CHART WITH STRUCTURED SIDE/BOTTOM LEGEND
    // =========================================================================
    const productStats = useMemo(() => {
        if (!Array.isArray(topProducts) || topProducts.length === 0) {
            return { items: [], total: 0 };
        }
        const total = topProducts.reduce((sum, p) => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            return sum + rev;
        }, 0);

        const palette = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

        const items = topProducts.map((p, idx) => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            const pct = total > 0 ? parseFloat(((rev / total) * 100).toFixed(1)) : 0;
            return {
                name: p.name || 'Unknown',
                revenue: rev,
                percentage: pct,
                color: palette[idx % palette.length]
            };
        });

        return { items, total };
    }, [topProducts]);

    const doughnutChartData = useMemo(() => {
        if (!productStats.items.length) {
            return { labels: [], datasets: [] };
        }

        return {
            labels: productStats.items.map(i => i.name),
            datasets: [{
                data: productStats.items.map(i => i.revenue),
                backgroundColor: productStats.items.map(i => i.color),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        };
    }, [productStats]);

    const doughnutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                display: false // Turned off in favor of clean side legend
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        const item = productStats.items[context.dataIndex];
                        if (!item) return '';
                        return ` ₱${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${item.percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="flex-1 min-h-screen bg-transparent font-sans responsive-page pb-12 transition-colors duration-300">
            <Head>
                <title>Dashboard | Seaside POS</title>
            </Head>
            <main className="max-w-7xl mx-auto px-3.5 sm:px-6 mt-4 sm:mt-6">
                <div className="flex flex-col gap-5 sm:gap-6">

                    {/* --- ROW 1: CONSOLIDATED 4-CARD EXECUTIVE KPI MATRIX --- */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">

                        {/* TILE 1: TODAY'S SALES */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
                            <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#8DB600]/15 dark:bg-lime-950/50 flex items-center justify-center text-[#8DB600] dark:text-lime-400 border border-[#8DB600]/30 shrink-0">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                        </div>
                                        <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                            Today's Sales
                                        </span>
                                    </div>

                                    {recentSalesPct !== null && !isTodayLoading && (
                                        <div
                                            className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shrink-0 ${
                                                recentSalesPct >= 0
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                            }`}
                                        >
                                            {recentSalesPct >= 0 ? (
                                                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                                            ) : (
                                                <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                                            )}
                                            <span>{Math.abs(recentSalesPct)}%</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-1">
                                    {isTodayLoading ? (
                                        <div className="h-6 sm:h-7 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                                    ) : (
                                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                            ₱{todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    )}
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">vs Yesterday:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        ₱{yesterdaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                                <span className="font-semibold text-slate-500 dark:text-slate-400">Status:</span>
                                <span className="font-bold text-[#8DB600] dark:text-lime-400">Active Register</span>
                            </div>
                        </div>

                        {/* TILE 2: THIS MONTH */}
                        <UnifiedPeriodCard
                            title="This Month"
                            isLoading={isMonthlyGrowthLoading}
                            currentSales={`₱${mThisSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            previousSales={`₱${mLastSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            salesGrowth={mSalesGrowth}
                            currentGallons={`${mThisGal.toLocaleString()} gal`}
                            previousGallons={`${mLastGal.toLocaleString()} gal`}
                            gallonsGrowth={mGalGrowth}
                            currentRange={mRange?.current}
                            previousRange={mRange?.previous}
                            rawCurrentSales={mThisSales}
                            rawPreviousSales={mLastSales}
                        />

                        {/* TILE 3: THIS WEEK */}
                        <UnifiedPeriodCard
                            title="This Week"
                            isLoading={isWeeklyGrowthLoading}
                            currentSales={`₱${wThisSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            previousSales={`₱${wLastSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            salesGrowth={wSalesGrowth}
                            currentGallons={`${wThisGal.toLocaleString()} gal`}
                            previousGallons={`${wLastGal.toLocaleString()} gal`}
                            gallonsGrowth={wGalGrowth}
                            currentRange={wRange?.current}
                            previousRange={wRange?.previous}
                            rawCurrentSales={wThisSales}
                            rawPreviousSales={wLastSales}
                        />

                        {/* TILE 4: OVERALL LIFETIME SALES */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
                            <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60 shrink-0">
                                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                        </div>
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                            Lifetime Sales
                                        </span>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shrink-0">
                                        All-Time
                                    </span>
                                </div>

                                <div className="mt-1">
                                    {isSummaryLoading ? (
                                        <div className="h-6 sm:h-7 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                                    ) : (
                                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                            ₱{overallSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    )}
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] font-medium text-slate-400 leading-tight">
                                    <span>Milestone:</span>
                                    <p className="font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                        {firstTransactionDate ? `Since ${firstTransactionDate}` : 'Total Station Receipts'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                                <span className="font-semibold text-slate-500 dark:text-slate-400">System:</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Live Database</span>
                            </div>
                        </div>

                    </div>

                    {/* --- ROW 2: CHARTS SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mt-1">
                        <div className="lg:col-span-7 min-h-[360px] sm:min-h-[380px]">
                            <Card className="h-full shadow-xs flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <CardHeader className="bg-transparent pb-0 flex flex-row items-center justify-between">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Sales Performance Over Time</h3>
                                    <Select
                                        value={salesView}
                                        onChange={(e) => setSalesView(e.target.value)}
                                        className="w-32 h-8 py-1 px-3 text-xs bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 shadow-2xs outline-none"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Weekly">Weekly</option>
                                    </Select>
                                </CardHeader>
                                <CardContent className="p-4 pt-4 flex-1 flex flex-col w-full h-full">
                                    <div className="flex-1 w-full h-full min-h-[280px] sm:min-h-[300px]">
                                        <Line data={lineChartData} options={lineChartOptions} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-5 min-h-[360px] sm:min-h-[380px]">
                            <Card className="h-full shadow-xs flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <CardHeader className="bg-transparent pb-0 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                                        <h3 className="font-bold text-slate-800 dark:text-white text-base">Period Comparison</h3>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setPeriodGraphMode('revenue')}
                                            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                                periodGraphMode === 'revenue'
                                                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Revenue
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPeriodGraphMode('gallons')}
                                            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                                periodGraphMode === 'gallons'
                                                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Gallons
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-3 flex-1 flex flex-col w-full h-full">
                                    <div className="flex-1 w-full h-full min-h-[280px] sm:min-h-[300px]">
                                        <Bar data={periodComparisonBarData} options={periodComparisonBarOptions} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* --- ROW 3: PRODUCT BREAKDOWN (DONUT + SIDE LEGEND) & TOP CUSTOMERS --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

                        {/* DONUT CHART: NEW SALES BY PRODUCT */}
                        <Card className="shadow-xs min-h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <CardHeader className="bg-transparent pb-0 shrink-0 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white text-base">New Sales by Product</h3>
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                    Total: ₱{Number(productStats.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col w-full h-full">
                                {isTopProductsLoading ? (
                                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">Loading products...</div>
                                ) : isTopProductsError ? (
                                    <div className="flex items-center justify-center flex-1 text-red-400 text-sm">Error loading data.</div>
                                ) : !productStats.items.length ? (
                                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">No sales data available.</div>
                                ) : (
                                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                                        {/* Donut with Center Total */}
                                        <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
                                            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Top Share</span>
                                                <span className="text-base font-black text-slate-900 dark:text-white">
                                                    ₱{Number(productStats.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Structured High-Information Side Legend */}
                                        <div className="flex-1 w-full flex flex-col justify-center space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                            {productStats.items.map((item) => (
                                                <div
                                                    key={item.name}
                                                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                                                >
                                                    <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80">
                                                            {item.percentage}%
                                                        </span>
                                                        <span className="font-black text-slate-900 dark:text-white text-xs">
                                                            ₱{Number(item.revenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* TOP 10 ALL-TIME CUSTOMERS */}
                        <Card className="shadow-xs min-h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <CardHeader className="bg-transparent pb-0 shrink-0 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Top 10 All-Time Customers</h3>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    ₱{(topCustomersTotal / 1000).toFixed(0)}k Cumulative
                                </span>
                            </CardHeader>
                            <CardContent className="p-4 pt-1 flex-1 flex flex-col w-full h-full">
                                <div className="flex items-center gap-2 mb-2 ml-1 text-xs text-slate-500 font-semibold shrink-0">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
                                    Total Revenue (₱)
                                </div>
                                <div className="flex-1 w-full h-full min-h-[270px] relative">
                                    {isTopCustomersLoading ? (
                                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">Loading customers...</div>
                                    ) : topCustomers?.length === 0 ? (
                                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">No sales data available.</div>
                                    ) : (
                                        <Bar data={topCustomersBarChartData} options={topCustomersBarChartOptions} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                </div>
            </main>
        </div>
    );
}