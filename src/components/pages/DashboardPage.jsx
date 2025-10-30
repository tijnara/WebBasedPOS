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
        <div className="dashboard-page modern-dashboard" style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', background: '#f9fafb', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} />
            <MobileLogoutButton />
            <h1 className="text-4xl font-bold mb-6 text-primary tracking-tight" style={{marginBottom: 0}}>Dashboard</h1>
            {/* Summary Cards - Replicate Screenshot, horizontal layout */}
            <div className="flex flex-row w-full mb-6" style={{marginTop: '1rem'}}>
                <div className="rounded-t-xl rounded-l-xl border border-gray-200 bg-white flex-1" style={{borderRight: 'none'}}>
                    <div className="p-4 pb-2 text-lg font-semibold text-gray-800 text-center">Revenue</div>
                    <div className="p-4 pt-2 text-2xl font-bold text-primary text-center" style={{letterSpacing: '0.5px'}}>₱{totalRevenue.toFixed(2)}</div>
                </div>
                <div className="border border-gray-200 bg-white flex-1" style={{borderRight: 'none'}}>
                    <div className="p-4 pb-2 text-lg font-semibold text-gray-800 text-center">Transactions</div>
                    <div className="p-4 pt-2 text-2xl font-bold text-primary text-center">{transactionsCount}</div>
                </div>
                <div className="border border-gray-200 bg-white flex-1" style={{borderRight: 'none'}}>
                    <div className="p-4 pb-2 text-lg font-semibold text-gray-800 text-center">New Customers</div>
                    <div className="p-4 pt-2 text-2xl font-bold text-primary text-center">{newCustomersCount}</div>
                </div>
                <div className="rounded-b-xl rounded-r-xl border border-gray-200 bg-white flex-1">
                    <div className="p-4 pb-2 text-lg font-semibold text-gray-800 text-center">Sales Today</div>
                    <div className="p-4 pt-2 text-2xl font-bold text-success text-center" style={{letterSpacing: '0.5px'}}>₱{salesTodayRevenue.toFixed(2)}</div>
                </div>
            </div>
            {/* Charts - Sales Over Time and New Customers Over Time side by side */}
            <div className="flex flex-row gap-4 mb-6">
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200">
                        <CardHeader className="pb-0"><h3 className="font-semibold text-lg text-gray-600">Sales Over Time</h3></CardHeader>
                        <CardContent style={{ padding: 0 }}>
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
                    <Card className="rounded-xl shadow bg-white border border-gray-200">
                        <CardHeader className="pb-0"><h3 className="font-semibold text-lg text-gray-600">New Customers Over Time</h3></CardHeader>
                        <CardContent style={{ padding: 0 }}>
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
            {/* Top-Selling Products and Top-Selling Products (Today) side by side */}
            <div className="flex flex-row gap-4">
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200">
                        <CardHeader className="pb-0"><h3 className="font-semibold text-lg text-gray-600">Top-Selling Products</h3></CardHeader>
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
                </div>
                <div className="flex-1">
                    <Card className="rounded-xl shadow bg-white border border-gray-200">
                        <CardHeader className="pb-0"><h3 className="font-semibold text-lg text-gray-600">Top-Selling Products (Today)</h3></CardHeader>
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
                </div>
            </div>
        </div>
    );
}
