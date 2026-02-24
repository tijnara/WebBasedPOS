// src/components/pages/DashboardPage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';
import { useStore } from '../../store/useStore';
import { useRouter } from 'next/router';

import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useSalesByDateSummary } from '../../hooks/useSalesByDateSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { startOfWeek, parseISO } from 'date-fns';
import currency from 'currency.js';
import ReorderReport from '../dashboard/ReorderReport';
import SpoilageReport from '../dashboard/SpoilageReport';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

// --- Modern Icons ---
const CurrencyDollarIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrendingUpIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const GlobeIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

const UsersGroupIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const BellAlertIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
    </svg>
);

// --- UI Components ---
const SummaryCard = ({ title, value, subtext, icon, colorClass = "text-indigo-600" }) => {
    const bgClass = colorClass.replace('text-', 'bg-').replace('600', '100');
    return (
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
            <CardContent className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className={`text-2xl font-bold mt-1 tracking-tight text-slate-800`}>{value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClass} ${bgClass} bg-opacity-40`}>
                        {icon}
                    </div>
                </div>
                {subtext && (
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-400">{subtext}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const TopProductsList = ({ products }) => {
    if (!products || products.length === 0) return <div className="text-center text-sm text-slate-400 py-8">No data available</div>;

    const maxQty = Math.max(...products.map(p => p.quantity));

    return (
        <div className="space-y-5">
            {products.map((p, i) => (
                <div key={i} className="relative group">
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-slate-700 truncate pr-4">{p.name}</span>
                        <span className="font-bold text-slate-900">{p.quantity} <span className="text-xs text-slate-400 font-normal">sold</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-indigo-600"
                            style={{ width: `${(p.quantity / maxQty) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const router = useRouter();
    const user = useStore(s => s.user);

    // 1. Fetch Data
    const { data: salesData } = useSales({ page: 1, itemsPerPage: 1000 });
    const { data: customerData } = useCustomers({ page: 1, itemsPerPage: 1000 });

    // Summary Hooks
    const { data: salesSummary } = useSalesSummary(); // Contains totalRevenue and firstTransactionDate
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();
    const { data: topProductsData = [] } = useTopProductsSummary();

    const [totalInactiveCount, setTotalInactiveCount] = useState(0);

    // --- Date Ranges for Today ---
    const { todayStart, todayEnd } = useMemo(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { todayStart: start, todayEnd: end };
    }, []);

    // Fetch Today's Sales
    const { data: todaySalesSummary } = useSalesSummary({
        startDate: todayStart,
        endDate: todayEnd
    });

    // 2. Calculate Weekly Metrics
    const { thisWeekSales, newCustomersThisWeek } = useMemo(() => {
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });

        const weeklySalesTotal = salesByDateData
            .filter(item => parseISO(item.sale_date) >= startOfCurrentWeek)
            .reduce((sum, item) => sum + Number(item.total_sales || 0), 0);

        const weeklyCustomersTotal = newCustomersByDateData
            .filter(item => parseISO(item.customer_date) >= startOfCurrentWeek)
            .reduce((sum, item) => sum + Number(item.total_customers || 0), 0);

        return {
            thisWeekSales: weeklySalesTotal,
            newCustomersThisWeek: weeklyCustomersTotal
        };
    }, [salesByDateData, newCustomersByDateData]);

    useEffect(() => {
        const fetchInactiveCount = async () => {
            const { data, error } = await supabase.rpc('get_inactive_customers', { days_inactive: 14 });
            if (!error && data) setTotalInactiveCount(data.length);
        };
        fetchInactiveCount();
    }, []);

    // Chart Data Preparation (Sales Trend)
    const salesByWeek = useMemo(() => {
        const map = {};
        salesData?.sales.forEach(sale => {
            if (!sale.saleTimestamp) return;
            const weekStart = startOfWeek(new Date(sale.saleTimestamp), { weekStartsOn: 1 });
            const key = weekStart.toISOString().split('T')[0];
            map[key] = (map[key] || 0) + Number(sale.totalAmount || 0);
        });
        const sortedData = Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        return {
            labels: sortedData.map(([dateKey]) => new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
            data: sortedData.map(([, total]) => total)
        };
    }, [salesData]);

    const salesChartData = {
        labels: salesByWeek.labels,
        datasets: [{
            label: 'Revenue',
            data: salesByWeek.data,
            borderColor: '#6366f1', // Indigo 500
            backgroundColor: (context) => {
                const ctx = context.chart?.ctx;
                if (!ctx) return 'transparent';
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
        }],
    };

    const salesChartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#4f46e5',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                callbacks: {
                    label: (context) => `₱${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#6b7280', font: { family: 'Inter', size: 12 } }
            },
            y: {
                grid: { color: '#f3f4f6', drawBorder: false, borderDash: [5, 5] },
                ticks: {
                    color: '#6b7280',
                    font: { family: 'Inter', size: 12 },
                    callback: (value) => `₱${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}`
                },
                beginAtZero: true
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    // Customer Growth Chart
    const customersByWeek = useMemo(() => {
        const map = {};
        customerData?.customers.forEach(cust => {
            if (!cust.dateAdded) return;
            const weekStart = startOfWeek(new Date(cust.dateAdded), { weekStartsOn: 1 });
            const key = weekStart.toISOString().split('T')[0];
            map[key] = (map[key] || 0) + 1;
        });
        const sortedData = Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        return {
            labels: sortedData.map(([dateKey]) => new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
            data: sortedData.map(([, count]) => count)
        };
    }, [customerData]);

    const customerChartData = {
        labels: customersByWeek.labels,
        datasets: [{
            label: 'New Customers',
            data: customersByWeek.data,
            backgroundColor: '#10b981', // Emerald 500
            borderRadius: 4,
            barThickness: 'flex',
            maxBarThickness: 32
        }],
    };

    const customerChartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#10b981',
                borderColor: '#e5e7eb',
                borderWidth: 1,
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5], color: '#f3f4f6' }, beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280' } }
        }
    };

    const formattedFirstTx = salesSummary?.firstTransactionDate
        ? new Date(salesSummary.firstTransactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : "All time";

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-screen">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Here's what's happening with your store today.</p>
                </div>
                <div className="text-sm text-slate-600 font-medium bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                    <CalendarIcon />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Top KPI Cards - 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <SummaryCard
                    title="Today's Sales"
                    value={currency(todaySalesSummary?.totalRevenue || 0, { symbol: '₱' }).format()}
                    subtext="Sales today"
                    colorClass="text-[#8BC34A]"
                    icon={<CurrencyDollarIcon />}
                />
                <SummaryCard
                    title="This Week Sales"
                    value={currency(thisWeekSales || 0, { symbol: '₱' }).format()}
                    subtext="Current week revenue"
                    colorClass="text-blue-600"
                    icon={<TrendingUpIcon />}
                />
                <SummaryCard
                    title="All Time Sales"
                    value={currency(salesSummary?.totalRevenue || 0, { symbol: '₱' }).format()}
                    subtext={`Since ${formattedFirstTx}`}
                    colorClass="text-emerald-600"
                    icon={<GlobeIcon />}
                />
                <SummaryCard
                    title="Total Customers"
                    value={customerData?.totalCount || 0}
                    subtext={`${newCustomersThisWeek} new this week`}
                    colorClass="text-orange-600"
                    icon={<UsersGroupIcon />}
                />
            </div>

            {/* Middle Section: Main Chart & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-full border-slate-200 shadow-sm">
                        <CardHeader className="bg-white border-b border-slate-100 py-5">
                            <h3 className="font-semibold text-slate-800 text-lg">Sales Trend</h3>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-[320px]">
                                <Line data={salesChartData} options={salesChartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="h-full border-slate-200 shadow-sm">
                        <CardHeader className="bg-white border-b border-slate-100 py-5">
                            <h3 className="font-semibold text-slate-800 text-lg">Top Selling Products</h3>
                        </CardHeader>
                        <CardContent className="p-5 overflow-y-auto max-h-[320px]">
                            <TopProductsList products={topProductsData} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Section: Operations / Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="border-slate-200 shadow-sm h-full">
                        <CardHeader className="bg-white border-b border-slate-100 py-4">
                            <h3 className="font-semibold text-slate-800">Customer Growth</h3>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-[200px]">
                                <Bar data={customerChartData} options={customerChartOptions} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-white">
                        <CardHeader className="py-4 border-b border-orange-100">
                            <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                                <BellAlertIcon className="w-5 h-5" />
                                Action Required
                            </h3>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-orange-100">
                                <div className="p-5 flex items-center justify-between hover:bg-orange-50/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Inactive Customers</p>
                                        <p className="text-xs text-slate-500 mt-0.5">No orders in 14+ days</p>
                                    </div>
                                    <span className="bg-orange-100 border border-orange-200 text-orange-700 px-3.5 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                        {totalInactiveCount}
                                    </span>
                                </div>
                                <div className="p-5 flex items-center justify-between hover:bg-orange-50/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Low Stock Items</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Requires restocking</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs font-semibold bg-white border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                                        onClick={() => router.push('/inventory')}
                                    >
                                        Manage
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <ReorderReport />
                    <SpoilageReport />
                </div>
            </div>

        </div>
    );
}

// Inline Calendar Icon specifically for the date badge header
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
)