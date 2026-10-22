// src/components/pages/DashboardPage.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardContent, Select } from '../ui';
import SummaryCard from '../ui/SummaryCard';
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
    TrendingUp,
    TrendingDown,
    Droplets,
    DollarSign,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

// Floating action buttons
import FloatingMessages from '../FloatingMessages';
import FloatingNotes from '../FloatingNotes';

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
const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
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

// Executive Graphical Business KPI Card
function GraphicalMetricCard({
                                 title,
                                 currentValue,
                                 previousValue,
                                 percentage,
                                 isPositive,
                                 currentRange,
                                 previousRange,
                                 unit = '₱',
                                 rawCurrent = 0,
                                 rawPrevious = 0,
                                 icon: Icon,
                                 isLoading
                             }) {
    const ratio = rawPrevious > 0 ? Math.min(100, Math.round((rawCurrent / rawPrevious) * 100)) : 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
            <div>
                {/* Header: Title + Icon + Trend Pill */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-slate-100 dark:border-slate-700/60">
                            {Icon && <Icon className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-tight">
                            {title}
                        </span>
                    </div>

                    {percentage !== undefined && percentage !== null && !isLoading && (
                        <div
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black border ${
                                isPositive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            }`}
                        >
                            {isPositive ? (
                                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                            ) : (
                                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                            )}
                            <span>{Math.abs(percentage).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                {/* Primary Metric Value */}
                <div className="mt-2">
                    {isLoading ? (
                        <div className="h-7 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    ) : (
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currentValue}
                        </h2>
                    )}
                </div>

                {/* Visual Comparative Progress Bar */}
                <div className="mt-3.5 space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                isPositive ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${ratio}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span>Pace: <strong className="text-slate-700 dark:text-slate-300">{ratio}%</strong> of prior</span>
                        <span>Prior: <strong className="text-slate-600 dark:text-slate-400">{previousValue}</strong></span>
                    </div>
                </div>
            </div>

            {/* Bottom Comparison Date Range */}
            <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Period:</span>
                <span className="font-medium truncate pl-1">
                    {currentRange && previousRange ? `${currentRange} vs. ${previousRange}` : 'Current vs Prior Period'}
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
                grid: { color: '#f1f5f9' },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (val) => periodGraphMode === 'revenue' ? `₱${(val / 1000).toFixed(0)}k` : `${val} gal`
                }
            }
        }
    };

    // Line Chart Data: Live Monthly/Weekly Sales
    const lineChartData = useMemo(() => {
        if (!summaryData) return { labels: [], datasets: [] };

        let labels = [];
        let data = [];

        if (salesView === 'Monthly' && summaryData.monthlyRevenue) {
            const sortedMonths = Object.keys(summaryData.monthlyRevenue).sort();
            labels = sortedMonths.map(month => {
                const [year, m] = month.split('-');
                const date = new Date(year, Number(m) - 1);
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            });
            data = sortedMonths.map(month => summaryData.monthlyRevenue[month]);

        } else if (salesView === 'Weekly' && summaryData.weeklyRevenue) {
            const sortedWeeks = Object.keys(summaryData.weeklyRevenue).sort();
            labels = sortedWeeks.map(weekStart => {
                const [year, m, d] = weekStart.split('-');
                const date = new Date(year, Number(m) - 1, d);
                return `Week of ${date.toLocaleString('default', { month: 'short', day: 'numeric' })}`;
            });
            data = sortedWeeks.map(week => summaryData.weeklyRevenue[week]);
        }

        return {
            labels,
            datasets: [
                {
                    label: `${salesView} Sales`,
                    data: data,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(16, 185, 129, 1)',
                    pointRadius: 4,
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
                    boxWidth: 10,
                    color: '#64748b',
                    font: { family: 'Inter', weight: '600', size: 14 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 0,
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 14 },
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
                ticks: { color: '#64748b', font: { size: 13, weight: '500' } }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `₱${(value).toLocaleString()}`,
                    color: '#64748b',
                    font: { size: 13, weight: '500' },
                    padding: 8
                },
                grid: { display: false },
                border: { display: false }
            }
        }
    };

    // Bar Chart Data: Top 10 All-Time Customers
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
                borderRadius: 4,
                barPercentage: 0.6
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
                callbacks: {
                    label: (context) => `₱${context.parsed.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}K`,
                    color: '#94a3b8'
                }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#64748b', font: { weight: '500' } }
            }
        }
    };

    // Pie Chart Data: Top Products
    const pieChartData = useMemo(() => {
        if (!Array.isArray(topProducts) || topProducts.length === 0) {
            return { labels: [], datasets: [] };
        }
        const totalRevenue = topProducts.reduce((sum, p) => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            return sum + rev;
        }, 0);

        const percentages = topProducts.map(p => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            return totalRevenue > 0 ? parseFloat(((rev / totalRevenue) * 100).toFixed(1)) : 0;
        });

        return {
            labels: topProducts.map(p => p.name || 'Unknown'),
            datasets: [{
                data: percentages,
                backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        };
    }, [topProducts]);

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    color: '#475569',
                    font: { weight: '500' }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        if (!Array.isArray(topProducts) || !topProducts[context.dataIndex]) {
                            return ` ${context.label}: ${context.parsed}%`;
                        }
                        const product = topProducts[context.dataIndex];
                        const revenue = Number(product.total_revenue) || Number(product.revenue) || 0;
                        const revenueFormatted = `₱${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        return ` ${context.label}: ${context.parsed}% (${revenueFormatted})`;
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                <div className="flex flex-col gap-6">

                    {/* --- ROW 1: LIFETIME & TODAY'S METRICS --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SummaryCard
                            title="Overall Lifetime Sales"
                            isLoading={isSummaryLoading}
                            value={`₱${overallSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            isPositive={true}
                            comparisonText={firstTransactionDate ? `First Transaction: ${firstTransactionDate}` : "Lifetime total"}
                        />
                        <SummaryCard
                            title="Today's Sales"
                            isLoading={isTodayLoading}
                            value={`₱${todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            percentage={recentSalesPct !== null ? Math.abs(recentSalesPct) : undefined}
                            isPositive={recentSalesPct !== null ? recentSalesPct >= 0 : true}
                            comparisonText="vs. Yesterday"
                        />
                    </div>

                    {/* --- ROW 2: REFACTORED GRAPHICAL PERIOD METRIC CARDS --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <GraphicalMetricCard
                            title="Monthly Sales"
                            isLoading={isMonthlyGrowthLoading}
                            currentValue={`₱${mThisSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            previousValue={`₱${mLastSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            percentage={mSalesGrowth}
                            isPositive={mSalesGrowth >= 0}
                            currentRange={mRange?.current}
                            previousRange={mRange?.previous}
                            rawCurrent={mThisSales}
                            rawPrevious={mLastSales}
                            icon={DollarSign}
                        />

                        <GraphicalMetricCard
                            title="Monthly Gallons"
                            isLoading={isMonthlyGrowthLoading}
                            currentValue={`${mThisGal.toLocaleString()} gal`}
                            previousValue={`${mLastGal.toLocaleString()} gal`}
                            percentage={mGalGrowth}
                            isPositive={mGalGrowth >= 0}
                            currentRange={mRange?.current}
                            previousRange={mRange?.previous}
                            rawCurrent={mThisGal}
                            rawPrevious={mLastGal}
                            icon={Droplets}
                        />

                        <GraphicalMetricCard
                            title="Weekly Sales"
                            isLoading={isWeeklyGrowthLoading}
                            currentValue={`₱${wThisSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            previousValue={`₱${wLastSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            percentage={wSalesGrowth}
                            isPositive={wSalesGrowth >= 0}
                            currentRange={wRange?.current}
                            previousRange={wRange?.previous}
                            rawCurrent={wThisSales}
                            rawPrevious={wLastSales}
                            icon={DollarSign}
                        />

                        <GraphicalMetricCard
                            title="Weekly Gallons"
                            isLoading={isWeeklyGrowthLoading}
                            currentValue={`${wThisGal.toLocaleString()} gal`}
                            previousValue={`${wLastGal.toLocaleString()} gal`}
                            percentage={wGalGrowth}
                            isPositive={wGalGrowth >= 0}
                            currentRange={wRange?.current}
                            previousRange={wRange?.previous}
                            rawCurrent={wThisGal}
                            rawPrevious={wLastGal}
                            icon={Droplets}
                        />
                    </div>

                    {/* --- ROW 3: CHARTS SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
                        <div className="lg:col-span-7 min-h-[380px]">
                            <Card className="h-full shadow-sm flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                <CardHeader className="bg-transparent pb-0 flex flex-row items-center justify-between">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Sales Performance Over Time</h3>
                                    <Select
                                        value={salesView}
                                        onChange={(e) => setSalesView(e.target.value)}
                                        className="w-32 h-8 py-1 px-3 text-xs bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 shadow-xs outline-none"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Weekly">Weekly</option>
                                    </Select>
                                </CardHeader>
                                <CardContent className="p-4 pt-4 flex-1 flex flex-col w-full h-full">
                                    <div className="flex-1 w-full h-full min-h-[300px]">
                                        <Line data={lineChartData} options={lineChartOptions} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-5 min-h-[380px]">
                            <Card className="h-full shadow-sm flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
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
                                                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
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
                                                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Gallons
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-3 flex-1 flex flex-col w-full h-full">
                                    <div className="flex-1 w-full h-full min-h-[300px]">
                                        <Bar data={periodComparisonBarData} options={periodComparisonBarOptions} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* --- ROW 4: PRODUCT BREAKDOWN & TOP CUSTOMERS --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <CardHeader className="bg-transparent pb-0 shrink-0">
                                <h3 className="font-bold text-slate-800 dark:text-white text-base">New Sales by Product</h3>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col w-full h-full">
                                <div className="flex-1 w-full h-full relative flex justify-center items-center">
                                    {isTopProductsLoading ? (
                                        <div className="text-slate-400 text-sm">Loading...</div>
                                    ) : isTopProductsError ? (
                                        <div className="text-red-400 text-sm">Error loading data.</div>
                                    ) : !Array.isArray(topProducts) || topProducts.length === 0 ? (
                                        <div className="text-slate-400 text-sm">No sales data available.</div>
                                    ) : (
                                        <div className="w-full flex justify-center items-center" style={{ height: '270px' }}>
                                            <div className="relative h-full w-full max-w-[270px]">
                                                <Pie data={pieChartData} options={pieChartOptions} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <CardHeader className="bg-transparent pb-0 shrink-0">
                                <h3 className="font-bold text-slate-800 dark:text-white text-base">Top 10 All-Time Customers</h3>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-1 flex flex-col w-full h-full">
                                <div className="flex items-center gap-2 mb-2 ml-4 text-xs text-slate-500 font-semibold shrink-0">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                                    Total Revenue
                                </div>
                                <div className="flex-1 w-full h-full relative">
                                    {isTopCustomersLoading ? (
                                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">Loading...</div>
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

            {/* Floating Action Buttons */}
            <FloatingMessages />
            <FloatingNotes />
        </div>
    );
}