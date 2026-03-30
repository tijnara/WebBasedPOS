// src/components/pages/DashboardPage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../ui';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';
import { useStore } from '../../store/useStore';
import { useQueryClient } from '@tanstack/react-query';

import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { startOfWeek, endOfWeek, parseISO, subHours } from 'date-fns';
import currency from 'currency.js';
import ReorderReport from '../dashboard/ReorderReport';
import SpoilageReport from '../dashboard/SpoilageReport';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

// --- Modern Icons ---

// Today's Sales Icon (Cash Register/Receipt)
const TodaysSalesIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a120.48 120.48 0 00-4.5 1.925M14.25 9v1.25M9.75 9v1.25M5.25 9v1.25m4.5 2.5v1.25m4.5-1.25v1.25m-9-1.25v1.25" />
    </svg>
);

// This Week Sales Icon (Calendar with Check/Money)
const ThisWeekSalesIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
);

// All Time Sales Icon (Trophy/Crown)
const AllTimeSalesIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
);

// Total Customers Icon (Group of users with a plus)
const TotalCustomersIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

// Page Views Icon (Eye Focus/Analytics)
const PageViewsIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
    </svg>
);

// Sales Trend Icon (Chart line going up)
const SalesTrendIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

// Top Selling Products Icon (Shopping bag/Star)
const TopSellingIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);


// --- UI Components ---
const SummaryCard = ({ title, value, subtext, icon, colorClass = "text-indigo-600", className = "", children }) => {
    const bgClass = colorClass.replace('text-', 'bg-').replace('600', '100');
    return (
        <Card className={`border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white flex flex-col h-full ${className}`}>
            <CardContent className="p-5 flex-1 flex flex-col">
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
                {children && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex-1">
                        {children}
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

const NewCustomersList = ({ customers }) => {
    if (!customers || customers.length === 0) {
        return <div className="text-center text-sm text-slate-400 py-4">No new customers this week.</div>;
    }

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Newly Registered</p>
            <ul className="space-y-2 text-sm text-slate-700 overflow-y-auto" style={{ maxHeight: '150px' }}>
                {customers.slice(0, 10).map((customer) => (
                    <li key={customer.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-md">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-slate-400">
                            {new Date(customer.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function DashboardPage() {
    const user = useStore(s => s.user);
    const queryClient = useQueryClient();

    // 1. Fetch Data
    const { data: salesData } = useSales({ page: 1, itemsPerPage: 1000 });
    const { data: customerData } = useCustomers({ page: 1, itemsPerPage: 1000 });

    // Summary Hooks
    const { data: salesSummary } = useSalesSummary(); 
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();
    const { data: topProductsData = [] } = useTopProductsSummary();

    const [viewCount, setViewCount] = useState(null);
    const [recentViews, setRecentViews] = useState([]); 

    // --- Date Ranges for Today & This Week ---
    const { todayStart, todayEnd, weekStart, weekEnd } = useMemo(() => {
        const now = new Date();

        const tStart = new Date(now);
        tStart.setHours(0, 0, 0, 0);
        const tEnd = new Date(now);
        tEnd.setHours(23, 59, 59, 999);

        const wStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        wStart.setHours(0, 0, 0, 0);
        const wEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
        wEnd.setHours(23, 59, 59, 999);

        return { todayStart: tStart, todayEnd: tEnd, weekStart: wStart, weekEnd: wEnd };
    }, []);

    // Fetch Today's Sales
    const { data: todaySalesSummary } = useSalesSummary({
        startDate: todayStart,
        endDate: todayEnd
    });

    // Fetch This Week's Sales
    const { data: weekSalesSummary } = useSalesSummary({
        startDate: weekStart,
        endDate: weekEnd
    });
    const thisWeekSales = weekSalesSummary?.totalRevenue || 0;

    // 2. Calculate Weekly Customer Metrics
    const { newCustomersThisWeek } = useMemo(() => {
        const weeklyCustomersTotal = newCustomersByDateData
            .filter(item => {
                const itemDate = parseISO(item.customer_date);
                return itemDate >= weekStart && itemDate <= weekEnd;
            })
            .reduce((sum, item) => sum + Number(item.total_customers || 0), 0);

        return {
            newCustomersThisWeek: weeklyCustomersTotal
        };
    }, [newCustomersByDateData, weekStart, weekEnd]);

    const newCustomersThisWeekList = useMemo(() => {
        if (!customerData?.customers) return [];
        return customerData.customers.filter(customer => {
            const customerDate = customer.dateAdded ? new Date(customer.dateAdded) : null;
            if (!customerDate) return false;
            return customerDate >= weekStart && customerDate <= weekEnd;
        });
    }, [customerData, weekStart, weekEnd]);

    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch page views
            const { data: viewsData, error: viewsError } = await supabase.rpc('get_page_views');
            if (!viewsError && viewsData !== null) {
                setViewCount(viewsData);
            }

            // Fetch recent views log
            const { data: recentViewsData, error: recentViewsError } = await supabase
                .from('page_views_log')
                .select('viewed_at')
                .order('viewed_at', { ascending: false })
                .limit(5);
            if (!recentViewsError && recentViewsData) {
                setRecentViews(recentViewsData);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const channels = [
            supabase.channel('customer_changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customers' }, () => {
                queryClient.invalidateQueries(['customers']);
            })
        ];

        channels.forEach(channel => {
            channel.subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Connected to Supabase Realtime channel: ${channel.topic}`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn(`Realtime connection failed for ${channel.topic}. It will auto-reconnect.`);
                }
            });
        });

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [queryClient]);

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
                    callback: (value) => `₱${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`
                },
                beginAtZero: true
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    const formattedFirstTx = salesSummary?.firstTransactionDate
        ? new Date(salesSummary.firstTransactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : "All time";

    return (
        <div className="p-4 md:p-6 bg-slate-50/50 min-h-screen responsive-page">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
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

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <SummaryCard className="col-span-1" title="Today's Sales" value={currency(todaySalesSummary?.totalRevenue || 0, { symbol: '₱' }).format()} subtext="Sales today" colorClass="text-[#8BC34A]" icon={<TodaysSalesIcon />} />
                <SummaryCard className="col-span-1" title="This Week Sales" value={currency(thisWeekSales || 0, { symbol: '₱' }).format()} subtext="Current week revenue" colorClass="text-blue-600" icon={<ThisWeekSalesIcon />} />
                <SummaryCard className="col-span-2 lg:col-span-1" title="All Time Sales" value={currency(salesSummary?.totalRevenue || 0, { symbol: '₱' }).format()} subtext={`Since ${formattedFirstTx}`} colorClass="text-emerald-600" icon={<AllTimeSalesIcon />} />
                <SummaryCard className="col-span-1 lg:col-span-2" title="Total Customers" value={customerData?.totalCount || 0} subtext={`${newCustomersThisWeek} new this week`} colorClass="text-orange-600" icon={<TotalCustomersIcon />}>
                    <NewCustomersList customers={newCustomersThisWeekList} />
                </SummaryCard>
                <SummaryCard className="col-span-1" title="Page Views" value={viewCount !== null ? viewCount.toLocaleString() : '...'} subtext="Landing page visits" colorClass="text-purple-600" icon={<PageViewsIcon />}>
                    {recentViews && recentViews.length > 0 && (
                        <div className="hidden md:block space-y-2 mt-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last 5 Visitors</p>
                            <ul className="text-xs text-slate-600 space-y-1.5">
                                {recentViews.map((view, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                        {new Date(view.viewed_at).toLocaleString('en-US', {
                                            month: 'short', day: 'numeric',
                                            hour: 'numeric', minute: '2-digit'
                                        })}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </SummaryCard>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* Sales Trend and Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="h-full border-slate-200 shadow-sm">
                            <CardHeader className="bg-white border-b border-slate-100 py-5">
                                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                                     <SalesTrendIcon className="w-5 h-5 text-indigo-500"/>
                                     Sales Trend
                                </h3>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="h-[350px]">
                                    <Line data={salesChartData} options={salesChartOptions} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="h-full border-slate-200 shadow-sm">
                            <CardHeader className="bg-white border-b border-slate-100 py-5">
                                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                                     <TopSellingIcon className="w-5 h-5 text-indigo-500"/>
                                     Top Selling Products
                                </h3>
                            </CardHeader>
                            <CardContent className="p-5 overflow-y-auto" style={{maxHeight: '350px'}}>
                                <TopProductsList products={topProductsData} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Reports and Other Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <ReorderReport />
                    </div>
                    <div className="lg:col-span-1">
                        <SpoilageReport />
                    </div>
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
