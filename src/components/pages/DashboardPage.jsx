import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';
import MobileLogoutButton from '../MobileLogoutButton';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useSalesByDateSummary } from '../../hooks/useSalesByDateSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary'; // Added Hook
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { startOfWeek, parseISO } from 'date-fns';
import { UserIcon } from '../Icons';
import currency from 'currency.js';
import ReorderReport from '../dashboard/ReorderReport';

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
    const { data: salesSummary } = useSalesSummary(); // For Total Revenue
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();
    const { data: topProductsData = [] } = useTopProductsSummary(); // For Top Items Graph

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

    // 3. Inactive Customers Logic
    const INACTIVE_PAGE_SIZE = 4;
    const [inactivePage, setInactivePage] = useState(1);
    const [totalInactiveCount, setTotalInactiveCount] = useState(0);
    const { data: inactiveResult, isLoading: inactiveCustomersLoading } = useInactiveCustomers(14, { page: inactivePage, itemsPerPage: INACTIVE_PAGE_SIZE });
    const paginatedInactiveCustomers = inactiveResult?.customers || [];
    const inactiveHasMore = !!inactiveResult?.hasMore;

    useEffect(() => {
        const fetchInactiveCount = async () => {
            const { data, error } = await supabase.rpc('get_inactive_customers', { days_inactive: 14 });
            if (!error && data) setTotalInactiveCount(data.length);
        };
        fetchInactiveCount();
    }, []);

    // 4. Chart Data Preparation

    // Sales Trend (Line Chart)
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

    // Customer Growth (Bar Chart)
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

    // Top Products (Bar Chart - Horizontal usually better for names)
    const topProductsChartData = {
        labels: topProductsData.map(p => p.name),
        datasets: [{
            label: 'Quantity Sold',
            data: topProductsData.map(p => p.quantity),
            backgroundColor: 'rgba(249, 115, 22, 0.6)', // Orange
            borderColor: 'rgba(249, 115, 22, 1)',
            borderWidth: 1
        }]
    };

    const topProductsOptions = {
        indexAxis: 'y', // Horizontal bar
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false }
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-8 bg-gray-50 min-h-screen">
            <MobileLogoutButton />
            <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500 hidden md:inline-block">Overview</span>
            </div>

            {/* SUMMARY CARDS - Updated with Revenue and Total Customers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <SummaryCard
                    title="Total Revenue"
                    // FIX: Changed salesSummary?.totalSales to salesSummary?.totalRevenue
                    value={currency(salesSummary?.totalRevenue || 0, { symbol: '₱' }).format()}
                    subtext="All time"
                    colorClass="text-blue-600"
                    icon={<span className="text-xl">🏦</span>}
                />
                <SummaryCard
                    title="This Week Sales"
                    value={currency(thisWeekSales, { symbol: '₱' }).format()}
                    colorClass="text-indigo-600"
                    icon={<span className="text-xl">💰</span>}
                />
                <SummaryCard
                    title="Total Customers"
                    value={customerData?.totalCount || 0}
                    subtext="Registered"
                    colorClass="text-emerald-600"
                    icon={<span className="text-xl">👨‍👩‍👧</span>}
                />
                <SummaryCard
                    title="New (This Week)"
                    value={newCustomersThisWeek}
                    colorClass="text-green-600"
                    icon={<span className="text-xl">🆕</span>}
                />
                <SummaryCard
                    title="Inactive Customers"
                    value={totalInactiveCount}
                    subtext=">14 days"
                    colorClass="text-amber-600"
                    icon={<span className="text-xl">💤</span>}
                />
            </div>
            <div><br></br></div>
            <ReorderReport />

            {/* CHARTS SECTION - Added top margin for spacing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                {/* Sales Trends (Full Width on Mobile, Half on Desktop) */}
                <div></div>
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

                {/* Customer Growth */}
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

                {/* Most Buy Items (New Graph) */}
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

            {/* Inactive Customers List - Added top margin for spacing */}
            <div><br></br></div>
            <Card className="shadow-sm border-none mt-8">

                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <h3 className="font-semibold text-lg text-gray-700">Recent Inactive Customers</h3>
                </CardHeader>
                <CardContent>
                    {inactiveCustomersLoading ? (
                        <div className="py-8 text-center text-gray-500">Loading inactive list...</div>
                    ) : paginatedInactiveCustomers.length === 0 ? (
                        <div className="py-8 text-center text-green-600 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-xl block mb-1">🎉</span>
                            Everyone is active!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paginatedInactiveCustomers.map(customer => (
                                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
                                            <UserIcon className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{customer.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Last Order: <span className="font-medium">{formatLastOrderDate(customer.last_order_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(customer.last_order_date)}
                                </div>
                            ))}
                            {/* Pagination Controls */}
                            <div className="flex justify-center gap-2 mt-4 pt-2 border-t border-gray-100">
                                <Button variant="ghost" size="sm" onClick={() => setInactivePage(p => Math.max(1, p - 1))} disabled={inactivePage === 1} className="text-gray-600">Previous</Button>
                                <span className="text-sm text-gray-400 py-1 px-2">Page {inactivePage}</span>
                                <Button variant="ghost" size="sm" onClick={() => setInactivePage(p => p + 1)} disabled={!inactiveHasMore} className="text-gray-600">Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}