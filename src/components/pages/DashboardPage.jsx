import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
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

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const SummaryCard = ({ title, value, isSuccess = false }) => (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm flex-1">
        <div className="p-3 pb-1 text-sm md:text-lg font-semibold text-gray-800 text-center">{title}</div>
        <div className={`p-3 pt-1 text-xl md:text-2xl font-bold text-center ${isSuccess ? 'text-success' : 'text-primary'}`} style={{ letterSpacing: '0.5px' }}>
            {value}
        </div>
    </div>
);

export default function DashboardPage() {
    // Summary cards (unchanged)
    const { data: salesData } = useSales();
    const { data: productsData } = useProducts();
    const { data: customerData } = useCustomers ? useCustomers() : { data: undefined };
    const { data: summaryData } = useSalesSummary();

    // --- USE SUMMARY HOOKS FOR CHARTS ---
    const { data: topProductsData = [] } = useTopProductsSummary(5);
    const { data: salesByDateData = [] } = useSalesByDateSummary();
    const { data: newCustomersByDateData = [] } = useNewCustomersByDateSummary();

    // --- CHART DATA ---
    // Sales Over Time
    const salesDates = salesByDateData.map(row => row.sale_date ? new Date(row.sale_date).toLocaleDateString() : 'Unknown');
    const salesAmounts = salesByDateData.map(row => Number(row.total_sales || 0));

    // Top-Selling Products
    const topProductNames = topProductsData.map(row => row.product_name);
    const topProductQuantities = topProductsData.map(row => Number(row.total_quantity || 0));

    // New Customers Over Time
    const customerDates = newCustomersByDateData.map(row => row.customer_date ? new Date(row.customer_date).toLocaleDateString() : 'Unknown');
    const customerCounts = newCustomersByDateData.map(row => Number(row.total_customers || 0));

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
                            <h3 className="font-semibold text-lg text-gray-600">Sales Over Time</h3>
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
                            <h3 className="font-semibold text-lg text-gray-600">New Customers Over Time</h3>
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
                {/* Top-Selling Products (Today) can be implemented with a new RPC if needed */}
            </div>
        </div>
    );
}
