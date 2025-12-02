import React, { useMemo, useState } from 'react';
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
import { startOfWeek } from 'date-fns';
import { UserIcon } from '../Icons'; // <-- FIXED IMPORT
import currency from 'currency.js'; // <-- IMPORTED CURRENCY.JS
import ReorderReport from '../dashboard/ReorderReport'; // <-- IMPORT REORDER REPORT
// Removed Pagination import; using Prev/Next for unknown totals

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const SummaryCard = ({ title, value, isSuccess = false }) => (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm flex-1">
        <div className="p-3 pb-1 text-sm md:text-lg font-semibold text-gray-800 text-center">{title}</div>
        <div className={`p-3 pt-1 text-xl md:text-2xl font-bold text-center ${isSuccess ? 'text-success' : 'text-primary'}`} style={{ letterSpacing: '0.5px' }}>
            {value}
        </div>
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
    // Summary cards (unchanged)
    const { data: salesData } = useSales({ page: 1, itemsPerPage: 1000 });
    const { data: customerData } = useCustomers ? useCustomers({ page: 1, itemsPerPage: 1000 }) : { data: undefined };
    const { data: summaryData } = useSalesSummary();

    // --- USE SUMMARY HOOKS FOR CHARTS ---
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();

    // --- PAGINATION STATE FOR INACTIVE CUSTOMERS ---
    const INACTIVE_PAGE_SIZE = 4;
    const [inactivePage, setInactivePage] = useState(1);

    // Fetch paginated inactive customers
    const {
        data: inactiveResult,
        isLoading: inactiveCustomersLoading
    } = useInactiveCustomers(14, { page: inactivePage, itemsPerPage: INACTIVE_PAGE_SIZE });

    const paginatedInactiveCustomers = inactiveResult?.customers || [];
    const inactiveHasMore = !!inactiveResult?.hasMore;

    // --- CHART DATA ---
    // Sales Over Time
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
        const labels = sortedData.map(([dateKey]) =>
            new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        );
        const data = sortedData.map(([, total]) => total);
        return { labels, data };
    }, [salesData]);
    const salesDates = salesByWeek.labels;
    const salesAmounts = salesByWeek.data;

    // New Customers Over Time
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
        const labels = sortedData.map(([dateKey]) =>
            new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        );
        const data = sortedData.map(([, count]) => count);
        return { labels, data };
    }, [customerData]);
    const customerDates = customersByWeek.labels;
    const customerCounts = customersByWeek.data;

    const salesChartData = {
        labels: salesDates,
        datasets: [
            {
                label: 'Weekly Sales',
                data: salesAmounts,
                borderColor: 'rgba(127, 0, 255, 1)',
                backgroundColor: 'rgba(127, 0, 255, 0.1)',
                fill: true,
                tension: 0.3,
            },
        ],
    };

    const customerChartData = {
        labels: customerDates,
        datasets: [
            {
                label: 'New Customers',
                data: customerCounts,
                backgroundColor: 'rgba(22, 163, 74, 0.6)',
            },
        ],
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <MobileLogoutButton />
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Dashboard</h1>

            <div className="flex flex-col sm:flex-row gap-4">
                <SummaryCard title="Total Revenue" value={currency(summaryData?.totalRevenue || 0, { symbol: '₱' }).format()} isSuccess />
                <SummaryCard title="Total Sales" value={summaryData?.totalSales || 0} />
                <SummaryCard title="Total Customers" value={customerData?.totalCount || 0} />
            </div>

            <ReorderReport />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold text-lg">Sales Over Time</h3>
                        </CardHeader>
                        <CardContent>
                            <Line data={salesChartData} />
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold text-lg">New Customers</h3>
                        </CardHeader>
                        <CardContent>
                            <Bar data={customerChartData} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Inactive Customers Section */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg">Inactive Customers (No orders in 14 days)</h3>
                </CardHeader>
                <CardContent>
                    {inactiveCustomersLoading ? (
                        <p>Loading...</p>
                    ) : paginatedInactiveCustomers.length === 0 ? (
                        <p>No inactive customers found.</p>
                    ) : (
                        <ScrollArea className="h-72">
                            <div className="space-y-4">
                                {paginatedInactiveCustomers.map(customer => (
                                    <div key={customer.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full">
                                                <UserIcon className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-sm text-gray-500">Last Order: {formatLastOrderDate(customer.last_order_date)}</div>
                                            </div>
                                        </div>
                                        {getStatusBadge(customer.last_order_date)}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                    <div className="flex justify-between mt-4">
                        <Button onClick={() => setInactivePage(p => Math.max(1, p - 1))} disabled={inactivePage === 1}>Previous</Button>
                        <Button onClick={() => setInactivePage(p => p + 1)} disabled={!inactiveHasMore}>Next</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
