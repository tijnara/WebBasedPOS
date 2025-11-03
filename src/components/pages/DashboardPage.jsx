import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomerMutations';
import MobileLogoutButton from '../MobileLogoutButton';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

// New Summary Card Component for responsiveness
const SummaryCard = ({ title, value, isSuccess = false }) => (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm flex-1">
        <div className="p-3 pb-1 text-sm md:text-lg font-semibold text-gray-800 text-center">{title}</div>
        <div className={`p-3 pt-1 text-xl md:text-2xl font-bold text-center ${isSuccess ? 'text-success' : 'text-primary'}`} style={{ letterSpacing: '0.5px' }}>
            {value}
        </div>
    </div>
);

export default function DashboardPage() {
    // Fetch data
    const { data: sales = [] } = useSales();
    const { data: products = [] } = useProducts();
    const { data: customers = [] } = useCustomers ? useCustomers() : { data: [] };

    // --- Sales Over Time ---
    const salesByDate = useMemo(() => {
        const map = {};
        sales.forEach(sale => {
            const date = new Date(sale.saleTimestamp).toLocaleDateString();
            map[date] = (map[date] || 0) + Number(sale.totalAmount || 0);
        });
        return map;
    }, [sales]);
    const salesDates = Object.keys(salesByDate);
    const salesAmounts = Object.values(salesByDate);

    // --- Top-Selling Products ---
    const productSales = useMemo(() => {
        const map = {};
        sales.forEach(sale => {
            (sale.sale_items || []).forEach(item => { // Use sale_items
                map[item.productName] = (map[item.productName] || 0) + item.quantity;
            });
        });
        return map;
    }, [sales]);
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const topProductNames = topProducts.map(([name]) => name);
    const topProductQuantities = topProducts.map(([, qty]) => qty);

    // --- New Customers Over Time ---
    const customersByDate = useMemo(() => {
        const map = {};
        customers.forEach(cust => {
            const date = cust.dateAdded ? new Date(cust.dateAdded).toLocaleDateString() : 'Unknown';
            map[date] = (map[date] || 0) + 1;
        });
        return map;
    }, [customers]);
    const customerDates = Object.keys(customersByDate);
    const customerCounts = Object.values(customersByDate);

    // --- Summary Stats ---
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const transactionsCount = sales.length;
    const newCustomersCount = customers.length;

    // Get today's date string (local time)
    // FIX: Use current date, not a hardcoded one
    const todayDateString = new Date().toLocaleDateString();

    // Filter sales for today
    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleTimestamp).toLocaleDateString();
        return saleDate === todayDateString;
    });

    // Sales Today Revenue
    const salesTodayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);

    // Top-Selling Products Today
    const todayProductSales = (() => {
        const map = {};
        todaySales.forEach(sale => {
            (sale.sale_items || []).forEach(item => { // use sale_items
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

    // Chart options for responsiveness
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        aspectRatio: 2, // Default aspect ratio
    };

    const mobileChartOptions = {
        ...chartOptions,
        aspectRatio: 1.5 // Taller aspect ratio for mobile
    };

    return (
        // Removed fixed width and padding, added responsive padding
        <div className="dashboard-page w-full p-0 md:p-4">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
            <MobileLogoutButton />

            {/* Responsive Header */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-primary tracking-tight">Dashboard</h1>

            {/* Summary Cards - Use Grid for responsiveness */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                <SummaryCard title="Revenue" value={`₱${totalRevenue.toFixed(2)}`} />
                <SummaryCard title="Transactions" value={transactionsCount} />
                <SummaryCard title="New Customers" value={newCustomersCount} />
                <SummaryCard title="Sales Today" value={`₱${salesTodayRevenue.toFixed(2)}`} isSuccess={true} />
            </div>

            {/* Charts - Stack vertically on mobile, row on desktop */}
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
                                        backgroundColor: 'rgba(127,0,255,0.10)',
                                        fill: true,
                                        pointRadius: 2,
                                    }],
                                }}
                                options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, aspectRatio: 2 }}
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
                                options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, aspectRatio: 2 }}
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
                                options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, aspectRatio: 2 }}
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
                                options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, aspectRatio: 2 }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
