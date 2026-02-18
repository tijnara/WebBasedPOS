// src/components/pages/DashboardPage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';

import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useSalesByDateSummary } from '../../hooks/useSalesByDateSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { startOfWeek, parseISO } from 'date-fns';
import { UserIcon } from '../Icons';
import currency from 'currency.js';
import ReorderReport from '../dashboard/ReorderReport';
import SpoilageReport from '../dashboard/SpoilageReport';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const SummaryCard = ({ title, value, subtext, icon, colorClass = "text-primary" }) => (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm flex-1 p-4 flex items-center justify-between min-w-[200px]">
        <div>
            <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
            <div className={`text-2xl font-bold ${colorClass}`} style={{ letterSpacing: '0.5px' }}>
                {value}
            </div>
            {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
        </div>
        {icon && <div className={`p-3 rounded-full ${colorClass.replace('text-', 'bg-').replace('700', '100').replace('600', '100')} bg-opacity-10`}>
            {icon}
        </div>}
    </div>
);

// Helper for formatting last order date and status
const formatLastOrderDate = (dateString) => {
    if (!dateString) return <span className="text-xs text-gray-500 italic">Never</span>;
    try {
        const date = new Date(dateString);
        return <span className="text-xs text-gray-700">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
    } catch (e) {
        return <span className="text-xs text-red-500">Invalid Date</span>;
    }
};

const getStatusBadge = (lastOrderDate) => {
    if (!lastOrderDate) return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">Never Ordered</span>;
    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">Inactive</span>;
};

export default function DashboardPage() {
    // 1. Fetch Data
    const { data: salesData } = useSales({ page: 1, itemsPerPage: 1000 });
    const { data: customerData } = useCustomers({ page: 1, itemsPerPage: 1000 });

    // Summary Hooks
    const { data: salesSummary } = useSalesSummary(); // For Total Revenue & Profit
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();
    const { data: topProductsData = [] } = useTopProductsSummary(); 
    const { data: inactiveResult, isLoading: inactiveCustomersLoading } = useInactiveCustomers(14, { page: 1, itemsPerPage: 4 });
    const paginatedInactiveCustomers = inactiveResult?.customers || [];
    const inactiveHasMore = !!inactiveResult?.hasMore;

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
            label: 'Weekly Sales',
            data: salesByWeek.data,
            borderColor: 'rgba(127, 0, 255, 1)',
            backgroundColor: 'rgba(127, 0, 255, 0.1)',
            fill: true,
            tension: 0.3,
        }],
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
            backgroundColor: 'rgba(22, 163, 74, 0.6)',
        }],
    };

    // Top Products Chart
    const topProductsChartData = {
        labels: topProductsData.map(p => p.name),
        datasets: [{
            label: 'Quantity Sold',
            data: topProductsData.map(p => p.quantity),
            backgroundColor: 'rgba(249, 115, 22, 0.6)',
            borderColor: 'rgba(249, 115, 22, 1)',
            borderWidth: 1
        }]
    };

    const topProductsOptions = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false }, title: { display: false } } };

    return (
        <div className="p-4 md:p-6 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500 hidden md:inline-block">Overview</span>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <SummaryCard
                    title="Today's Sales"
                    value={currency(todaySalesSummary?.totalRevenue || 0, { symbol: '₱' }).format()}
                    subtext="Revenue"
                    colorClass="text-purple-600"
                    icon={<span className="text-xl">📅</span>}
                />
                <SummaryCard
                    title="Today's Profit"
                    value={currency(todaySalesSummary?.totalProfit || 0, { symbol: '₱' }).format()}
                    subtext="Est. Profit"
                    colorClass="text-emerald-600"
                    icon={<span className="text-xl">📈</span>}
                />
                <SummaryCard
                    title="Total Revenue"
                    value={currency(salesSummary?.totalRevenue || 0, { symbol: '₱' }).format()}
                    subtext="All time"
                    colorClass="text-blue-600"
                    icon={<span className="text-xl">🏦</span>}
                />
                <SummaryCard
                    title="Gross Profit"
                    value={currency(salesSummary?.totalProfit || 0, { symbol: '₱' }).format()}
                    subtext="All time margin"
                    colorClass="text-green-600"
                    icon={<span className="text-xl">💰</span>}
                />
                <SummaryCard
                    title="Total Customers"
                    value={customerData?.totalCount || 0}
                    subtext="Registered"
                    colorClass="text-indigo-600"
                    icon={<span className="text-xl">👨‍👩‍👧</span>}
                />
                <SummaryCard
                    title="Alerts"
                    value={totalInactiveCount}
                    subtext="Inactive Cust."
                    colorClass="text-amber-600"
                    icon={<span className="text-xl">⚠️</span>}
                />
            </div>
            
            <ReorderReport />
            <SpoilageReport />

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="lg:col-span-2">
                    <Card className="shadow-sm border-none h-full">
                        <CardHeader>
                            <h3 className="font-semibold text-lg text-gray-700">Sales Trends</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <Line data={salesChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="shadow-sm border-none h-full">
                        <CardHeader>
                            <h3 className="font-semibold text-lg text-gray-700">Customer Growth</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <Bar data={customerChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="shadow-sm border-none h-full">
                        <CardHeader>
                            <h3 className="font-semibold text-lg text-gray-700">Top Selling Products</h3>
                        </CardHeader>
                        <CardContent>
                            {topProductsData.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No sales data yet</div>
                            ) : (
                                <div className="h-64">
                                    <Bar data={topProductsChartData} options={{ ...topProductsOptions, maintainAspectRatio: false }} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
