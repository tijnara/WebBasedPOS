import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomerMutations';
import MobileLogoutButton from '../MobileLogoutButton';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

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
            (sale.items || []).forEach(item => {
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
    const todayDateString = new Date(2025, 9, 30).toLocaleDateString(); // October is month 9 (0-based)
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
            (sale.items || []).forEach(item => {
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

    return (
        <div className="dashboard-page compact-dashboard" style={{ padding: '1rem', maxWidth: 1200, margin: '0 auto' }}>
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} />
            <MobileLogoutButton />
            <h1 className="text-xl font-bold mb-2">Dashboard</h1>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Revenue</h3></CardHeader>
                    <CardContent><div className="text-lg font-bold">₱{totalRevenue.toFixed(2)}</div></CardContent>
                </Card>
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Transactions</h3></CardHeader>
                    <CardContent><div className="text-lg font-bold">{transactionsCount}</div></CardContent>
                </Card>
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">New Customers</h3></CardHeader>
                    <CardContent><div className="text-lg font-bold">{newCustomersCount}</div></CardContent>
                </Card>
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Sales Today</h3></CardHeader>
                    <CardContent><div className="text-lg font-bold">₱{salesTodayRevenue.toFixed(2)}</div></CardContent>
                </Card>
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Sales Over Time</h3></CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        <Line
                            data={{
                                labels: salesDates,
                                datasets: [{
                                    label: 'Sales (₱)',
                                    data: salesAmounts,
                                    borderColor: '#3b82f6',
                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                    fill: true,
                                    pointRadius: 2,
                                }],
                            }}
                            options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, aspectRatio: 2 }}
                        />
                    </CardContent>
                </Card>
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Top-Selling Products</h3></CardHeader>
                    <CardContent style={{ padding: 0 }}>
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
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">New Customers Over Time</h3></CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        <Line
                            data={{
                                labels: customerDates,
                                datasets: [{
                                    label: 'New Customers',
                                    data: customerCounts,
                                    borderColor: '#f59e42',
                                    backgroundColor: 'rgba(245,158,66,0.15)',
                                    fill: true,
                                    pointRadius: 2,
                                }],
                            }}
                            options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, aspectRatio: 2 }}
                        />
                    </CardContent>
                </Card>
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Top-Selling Products (Today)</h3></CardHeader>
                    <CardContent style={{ padding: 0 }}>
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
                <Card style={{ padding: '0.5rem' }}>
                    <CardHeader style={{ paddingBottom: 0 }}><h3 className="font-semibold text-sm">Top Products (Pie, Today)</h3></CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        <Pie
                            data={{
                                labels: todayTopProductNames,
                                datasets: [{
                                    data: todayTopProductQuantities,
                                    backgroundColor: ['#3b82f6', '#10b981', '#f59e42', '#ef4444', '#6366f1'],
                                }],
                            }}
                            options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }, maintainAspectRatio: false, aspectRatio: 2 }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
