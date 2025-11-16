import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, ScrollArea } from '../ui';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import MobileLogoutButton from '../MobileLogoutButton';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { useSalesByDateSummary } from '../../hooks/useSalesByDateSummary';
import { useNewCustomersByDateSummary } from '../../hooks/useNewCustomersByDateSummary';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { startOfWeek } from 'date-fns';

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
    const { data: productsData } = useProducts();
    const { data: customerData } = useCustomers ? useCustomers({ page: 1, itemsPerPage: 1000 }) : { data: undefined };
    const { data: summaryData } = useSalesSummary();

    // --- USE SUMMARY HOOKS FOR CHARTS ---
    const { data: topProductsData = [] } = useTopProductsSummary(5);
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();
    const { data: inactiveCustomers = [], isLoading: isLoadingInactive } = useInactiveCustomers(14);

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
                const addedDate = new Date(cust.dateAdded);
                if (isNaN(addedDate.getTime())) return;
                const weekStart = startOfWeek(addedDate, { weekStartsOn: 1 });
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
        const data = sortedData.map(([, total]) => total);
        return { labels, data };
    }, [customerData]);
    const customerDates = customersByWeek.labels;
    const customerCounts = customersByWeek.data;

    // --- Summary Stats ---
    const totalRevenue = summaryData?.totalRevenue || 0;
    const transactionsCount = salesData?.totalCount || 0;

    // Helper function to check if a date is in the current week
    function isDateInCurrentWeek(dateString) {
        if (!dateString) return false;
        const now = new Date();
        const inputDate = new Date(dateString);
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        return inputDate >= firstDayOfWeek && inputDate <= lastDayOfWeek;
    }

    // New customers this week (from summary data)
    const newCustomersCount = newCustomersByDateData
        .filter(row => isDateInCurrentWeek(row.customer_date))
        .reduce((sum, row) => sum + Number(row.total_customers || 0), 0);

    // Sales today (from summary data)
    const todayDateString = new Date().toLocaleDateString();
    const todaySalesAmount = salesByDateData
        .filter(row => new Date(row.sale_date).toLocaleDateString() === todayDateString)
        .reduce((sum, row) => sum + Number(row.total_sales || 0), 0);

    // --- Top-Selling Products ---
    const productSales = useMemo(() => {
        const map = {};
        salesData?.sales.forEach(sale => {
            (sale.sale_items || []).forEach(item => {
                map[item.productName] = (map[item.productName] || 0) + item.quantity;
            });
        });
        return map;
    }, [salesData]);
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const topProductNames = topProducts.map(([name]) => name);
    const topProductQuantities = topProducts.map(([, qty]) => qty);

    // Today's top-selling products
    const todayProductSales = (() => {
        const map = {};
        salesData?.sales.filter(sale => {
            const saleDate = new Date(sale.saleTimestamp).toLocaleDateString();
            return saleDate === todayDateString;
        }).forEach(sale => {
            (sale.sale_items || []).forEach(item => {
                map[item.productName] = (map[item.productName] || 0) + item.quantity;
            });
        });
        return map;
    })();
    const todayTopProducts = Object.entries(todayProductSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const todayTopProductNames = todayTopProducts.map(([name]) => name);
    const todayTopProductQuantities = todayTopProducts.map(([, qty]) => qty);

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        aspectRatio: 2,
    };

    return (
        <div className="dashboard-page w-full p-0 md:p-4">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
            <MobileLogoutButton />
            <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-primary tracking-tight">Dashboard</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                <SummaryCard title="Revenue" value={`₱${totalRevenue.toFixed(2)}`} />
                <SummaryCard title="Transactions" value={transactionsCount} />
                <SummaryCard title="New Customers" value={newCustomersCount} />
                <SummaryCard title="Sales Today" value={`₱${todaySalesAmount.toFixed(2)}`} isSuccess={true} />
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200 h-[300px] md:h-[400px]">
                        <CardHeader className="pb-2">
                            <h3 className="font-semibold text-lg text-gray-600">Sales Over Time (Weekly)</h3>
                        </CardHeader>
                        <CardContent className="p-2 h-[calc(100%-4rem)]">
                            <Line
                                data={{
                                    labels: salesDates,
                                    datasets: [{
                                        label: 'Sales (₱)',
                                        data: salesAmounts,
                                        borderColor: '#7F00FF',
                                        backgroundColor: 'rgba(127,0,256,0.10)',
                                        fill: true,
                                        pointRadius: 2,
                                    }],
                                }}
                                options={chartOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200 h-[300px] md:h-[400px]">
                        <CardHeader className="pb-2">
                            <h3 className="font-semibold text-lg text-gray-600">New Customers Over Time (Weekly)</h3>
                        </CardHeader>
                        <CardContent className="p-2 h-[calc(100%-4rem)]">
                            <Line
                                data={{
                                    labels: customerDates,
                                    datasets: [{
                                        label: 'New Customers',
                                        data: customerCounts,
                                        borderColor: '#f59e42',
                                        backgroundColor: 'rgba(245,158,66,0.10)',
                                        fill: true,
                                        pointRadius: 2,
                                    }],
                                }}
                                options={chartOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200 h-[300px] md:h-[400px]">
                        <CardHeader className="pb-2">
                            <h3 className="font-semibold text-lg text-gray-600">Top-Selling Products</h3>
                        </CardHeader>
                        <CardContent className="p-2 h-[calc(100%-4rem)]">
                            <Bar
                                data={{
                                    labels: topProductNames,
                                    datasets: [{
                                        label: 'Units Sold',
                                        data: topProductQuantities,
                                        backgroundColor: '#10b981',
                                    }],
                                }}
                                options={chartOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200 h-[300px] md:h-[400px]">
                        <CardHeader className="pb-2">
                            <h3 className="font-semibold text-lg text-gray-600">Top-Selling Products (Today)</h3>
                        </CardHeader>
                        <CardContent className="p-2 h-[calc(100%-4rem)]">
                            <Bar
                                data={{
                                    labels: todayTopProductNames,
                                    datasets: [{
                                        label: 'Units Sold',
                                        data: todayTopProductQuantities,
                                        backgroundColor: '#10b981',
                                    }],
                                }}
                                options={chartOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200 h-[300px] md:h-[400px] flex flex-col">
                        <CardHeader className="pb-2">
                            <h3 className="font-semibold text-lg text-gray-600">Inactive Customers (14+ Days)</h3>
                            <div className="text-xs text-gray-500 mt-1">Customers who have not ordered in the last 14 days or never ordered.</div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                {isLoadingInactive ? (
                                    <p className="p-4 text-center text-gray-500">Loading customers...</p>
                                ) : inactiveCustomers.length === 0 ? (
                                    <p className="p-4 text-center text-gray-500">No inactive customers found. Great!</p>
                                ) : (
                                    <div className="w-full">
                                        {/* Desktop Table */}
                                        <div className="hidden md:block">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Phone</th>
                                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Last Order</th>
                                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {inactiveCustomers.map(cust => (
                                                        <tr key={cust.id}>
                                                            <td className="px-4 py-2 text-gray-800 font-medium">{cust.name}</td>
                                                            <td className="px-4 py-2 text-gray-600">{cust.phone || 'No phone'}</td>
                                                            <td className="px-4 py-2">{formatLastOrderDate(cust.last_order_date)}</td>
                                                            <td className="px-4 py-2">{getStatusBadge(cust.last_order_date)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Mobile Cards */}
                                        <div className="md:hidden p-2 space-y-2">
                                            {inactiveCustomers.map(cust => (
                                                <div key={cust.id} className="bg-gray-50 rounded-lg border p-3 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-medium text-gray-800">{cust.name}</div>
                                                        {getStatusBadge(cust.last_order_date)}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Phone: {cust.phone || 'No phone'}</div>
                                                    <div className="text-xs text-gray-600">Last Order: {formatLastOrderDate(cust.last_order_date)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
