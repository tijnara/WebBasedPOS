import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent, ScrollArea, Button } from '../ui';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';
import MobileLogoutButton from '../MobileLogoutButton';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useSalesByDateSummary } from '../../hooks/useSalesByDateSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { startOfWeek, isSameWeek, parseISO } from 'date-fns'; // Added isSameWeek, parseISO
import { UserIcon } from '../Icons';
import currency from 'currency.js';
import ReorderReport from '../dashboard/ReorderReport';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const SummaryCard = ({ title, value, subtext, icon, colorClass = "text-primary" }) => (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm flex-1 p-4 flex items-center justify-between">
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
    if (!dateString) {
        return <span className="text-xs text-gray-500 italic">Never</span>;
    }
    try {
        const date = new Date(dateString);
        return <span className="text-xs text-gray-700">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
    } catch (e) {
        return <span className="text-xs text-red-500">Invalid Date</span>;
    }
};

const getStatusBadge = (lastOrderDate) => {
    if (!lastOrderDate) {
        return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">Never Ordered</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">Inactive</span>;
};

export default function DashboardPage() {
    const { data: salesData } = useSales({ page: 1, itemsPerPage: 1000 });
    const { data: customerData } = useCustomers ? useCustomers({ page: 1, itemsPerPage: 1000 }) : { data: undefined };

    // --- USE SUMMARY HOOKS FOR CHARTS ---
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();

    // --- CALCULATE WEEKLY METRICS ---
    const { thisWeekSales, newCustomersThisWeek } = useMemo(() => {
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });

        // Calculate This Week Sales
        const weeklySalesTotal = salesByDateData
            .filter(item => {
                const itemDate = parseISO(item.sale_date); // Ensure date string is parsed correctly
                return itemDate >= startOfCurrentWeek;
            })
            .reduce((sum, item) => sum + Number(item.total_sales || 0), 0);

        // Calculate New Customers This Week
        const weeklyCustomersTotal = newCustomersByDateData
            .filter(item => {
                const itemDate = parseISO(item.customer_date);
                return itemDate >= startOfCurrentWeek;
            })
            .reduce((sum, item) => sum + Number(item.total_customers || 0), 0);

        return {
            thisWeekSales: weeklySalesTotal,
            newCustomersThisWeek: weeklyCustomersTotal
        };
    }, [salesByDateData, newCustomersByDateData]);

    // --- INACTIVE CUSTOMERS LOGIC ---
    const INACTIVE_PAGE_SIZE = 4;
    const [inactivePage, setInactivePage] = useState(1);
    const [totalInactiveCount, setTotalInactiveCount] = useState(0);

    // Fetch paginated inactive customers
    const {
        data: inactiveResult,
        isLoading: inactiveCustomersLoading
    } = useInactiveCustomers(14, { page: inactivePage, itemsPerPage: INACTIVE_PAGE_SIZE });

    const paginatedInactiveCustomers = inactiveResult?.customers || [];
    const inactiveHasMore = !!inactiveResult?.hasMore;

    // Fetch TOTAL count of inactive customers (separate from pagination)
    useEffect(() => {
        const fetchInactiveCount = async () => {
            // Using the same logic as the hook but fetching all IDs to count
            const { data, error } = await supabase.rpc('get_inactive_customers', { days_inactive: 14 });
            if (!error && data) {
                setTotalInactiveCount(data.length);
            }
        };
        fetchInactiveCount();
    }, []);

    // --- CHART DATA PREPARATION ---
    const salesByWeek = useMemo(() => {
        const map = {};
        salesData?.sales.forEach(sale => {
            if (!sale.saleTimestamp) return;
            try {
                const saleDate = new Date(sale.saleTimestamp);
                const weekStart = startOfWeek(saleDate, { weekStartsOn: 1 });
                const key = weekStart.toISOString().split('T')[0];
                map[key] = (map[key] || 0) + Number(sale.totalAmount || 0);
            } catch (e) {
                console.error("Invalid sale date", sale.saleTimestamp);
            }
        });
        const sortedData = Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        return {
            labels: sortedData.map(([dateKey]) => new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
            data: sortedData.map(([, total]) => total)
        };
    }, [salesData]);

    const customersByWeek = useMemo(() => {
        const map = {};
        customerData?.customers.forEach(cust => {
            if (!cust.dateAdded) return;
            try {
                const joinDate = new Date(cust.dateAdded);
                const weekStart = startOfWeek(joinDate, { weekStartsOn: 1 });
                const key = weekStart.toISOString().split('T')[0];
                map[key] = (map[key] || 0) + 1;
            } catch (e) {
                console.error("Invalid customer date", cust.dateAdded);
            }
        });
        const sortedData = Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        return {
            labels: sortedData.map(([dateKey]) => new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
            data: sortedData.map(([, count]) => count)
        };
    }, [customerData]);

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

    const customerChartData = {
        labels: customersByWeek.labels,
        datasets: [{
            label: 'New Customers',
            data: customersByWeek.data,
            backgroundColor: 'rgba(22, 163, 74, 0.6)',
        }],
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
            <MobileLogoutButton />
            <div className="flex justify-between items-end">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
                <span className="text-sm text-gray-500 hidden md:inline-block">Overview for this week</span>
            </div>

            {/* UPDATED SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    title="This Week Sales"
                    value={currency(thisWeekSales, { symbol: '₱' }).format()}
                    colorClass="text-indigo-600"
                    icon={<span className="text-xl">💰</span>}
                />
                <SummaryCard
                    title="New Customers (This Week)"
                    value={newCustomersThisWeek}
                    colorClass="text-green-600"
                    icon={<span className="text-xl">👥</span>}
                />
                <SummaryCard
                    title="Total Inactive Customers"
                    value={totalInactiveCount}
                    subtext="No orders in 14 days"
                    colorClass="text-amber-600"
                    icon={<span className="text-xl">💤</span>}
                />
            </div>

            {/* UPDATED REORDER REPORT */}
            <ReorderReport />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-sm border-none">
                        <CardHeader>
                            <h3 className="font-semibold text-lg text-gray-700">Sales Trends</h3>
                        </CardHeader>
                        <CardContent>
                            <Line data={salesChartData} />
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="shadow-sm border-none">
                        <CardHeader>
                            <h3 className="font-semibold text-lg text-gray-700">Customer Growth</h3>
                        </CardHeader>
                        <CardContent>
                            <Bar data={customerChartData} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Inactive Customers Section */}
            <Card className="shadow-sm border-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <h3 className="font-semibold text-lg text-gray-700">Recent Inactive Customers</h3>
                    <Button variant="outline" size="sm" onClick={() => {}}>View All</Button>
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
                            <div className="flex justify-center gap-2 mt-4 pt-2 border-t border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setInactivePage(p => Math.max(1, p - 1))}
                                    disabled={inactivePage === 1}
                                    className="text-gray-600"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-400 py-1 px-2">Page {inactivePage}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setInactivePage(p => p + 1)}
                                    disabled={!inactiveHasMore}
                                    className="text-gray-600"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
