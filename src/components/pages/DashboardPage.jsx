import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardContent, Select } from '../ui';
import SummaryCard from '../ui/SummaryCard'; // Import the global SummaryCard
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Query & DB imports
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';

// Import your custom hook to fetch real database data
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { useDailySales } from '../../hooks/useDailySales';

// Import floating buttons
import FloatingMessages from '../FloatingMessages';
import FloatingNotes from '../FloatingNotes';

// Loading placeholder for dynamic charts
const ChartLoading = () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading Chart...
    </div>
);

// Dynamic imports for Chart components
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { 
    ssr: false, 
    loading: () => <ChartLoading /> 
});
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { 
    ssr: false, 
    loading: () => <ChartLoading /> 
});
const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), { 
    ssr: false, 
    loading: () => <ChartLoading /> 
});

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function DashboardPage() {
    const user = useStore(state => state.user);

    const [dateFilter, setDateFilter] = useState('Trailing 12 Months');
    const [territory, setTerritory] = useState('All');

    // Toggle for Monthly vs Weekly chart view
    const [salesView, setSalesView] = useState('Monthly');

    // Fetch live data from the database
    const { data: summaryData, isLoading: isSummaryLoading } = useSalesSummary();
    const overallSalesTotal = summaryData?.totalRevenue || 0;
    const firstTransactionDate = summaryData?.firstTransactionDate
        ? new Date(summaryData.firstTransactionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : null;
    const { data: topProducts, isLoading: isTopProductsLoading, isError: isTopProductsError } = useTopProductsSummary(5);

    const { data: dailySalesData, isLoading: isTodayLoading } = useDailySales();
    const todaySales = dailySalesData?.todaySales || 0;
    const yesterdaySales = dailySalesData?.yesterdaySales || 0;
    const recentSalesPct = yesterdaySales > 0
        ? parseFloat((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(2))
        : null;

    // --- TOP 10 ALL-TIME CUSTOMERS ---
    const { data: topCustomers, isLoading: isTopCustomersLoading } = useQuery({
        queryKey: ['top-customers-all-time', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) {
                return [
                    { name: 'Demo Customer A', revenue: 125000.00 },
                    { name: 'Demo Customer B', revenue: 98000.50 },
                    { name: 'Demo Customer C', revenue: 85000.00 },
                    { name: 'Demo Customer D', revenue: 76000.25 },
                    { name: 'Demo Customer E', revenue: 68000.00 },
                    { name: 'Demo Customer F', revenue: 54000.00 },
                    { name: 'Demo Customer G', revenue: 49000.75 },
                    { name: 'Demo Customer H', revenue: 41000.00 },
                    { name: 'Demo Customer I', revenue: 32000.50 },
                    { name: 'Demo Customer J', revenue: 28000.00 },
                ];
            }

            const { data, error } = await supabase
                .from('sales')
                .select('customername, totalamount');

            if (error) throw error;

            const revenueByCustomer = {};
            data.forEach(sale => {
                const name = sale.customername;
                if (!name || name.toLowerCase() === 'n/a' || name.toLowerCase().includes('walk-in')) return;

                revenueByCustomer[name] = (revenueByCustomer[name] || 0) + Number(sale.totalamount || 0);
            });

            return Object.entries(revenueByCustomer)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
        },
        staleTime: 1000 * 60 * 60 // Cache for 1 hour
    });

    // Line Chart Data: Live Monthly/Weekly Sales from Database
    const lineChartData = useMemo(() => {
        if (!summaryData) return { labels: [], datasets: [] };

        let labels = [];
        let data = [];

        if (salesView === 'Monthly' && summaryData.monthlyRevenue) {
            const sortedMonths = Object.keys(summaryData.monthlyRevenue).sort();
            labels = sortedMonths.map(month => {
                const [year, m] = month.split('-');
                const date = new Date(year, m - 1);
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            });
            data = sortedMonths.map(month => summaryData.monthlyRevenue[month]);

        } else if (salesView === 'Weekly' && summaryData.weeklyRevenue) {
            const sortedWeeks = Object.keys(summaryData.weeklyRevenue).sort();
            labels = sortedWeeks.map(weekStart => {
                const [year, m, d] = weekStart.split('-');
                const date = new Date(year, m - 1, d);
                return `Week of ${date.toLocaleString('default', { month: 'short', day: 'numeric' })}`;
            });
            data = sortedWeeks.map(week => summaryData.weeklyRevenue[week]);
        }

        return {
            labels,
            datasets: [
                {
                    label: `${salesView} Sales`,
                    data: data,
                    borderColor: 'rgba(94, 234, 212, 1)',
                    backgroundColor: 'rgba(153, 246, 228, 0.5)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(94, 234, 212, 1)',
                    pointRadius: 4,
                }
            ]
        };
    }, [summaryData, salesView]);

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                align: 'start',
                labels: {
                    usePointStyle: true,
                    boxWidth: 10,
                    color: '#64748b',
                    font: { family: 'Inter', weight: '600', size: 14 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 0,
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 14 },
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) label += `₱${(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#64748b', font: { size: 13, weight: '500' } }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `₱${(value).toLocaleString()}`,
                    color: '#64748b',
                    font: { size: 13, weight: '500' },
                    padding: 8
                },
                grid: { display: false },
                border: { display: false }
            }
        }
    };

    // Bar Chart Data: Top Products by Revenue from Database
    const barChartData = useMemo(() => {
        if (!topProducts || topProducts.length === 0) {
            return { labels: [], datasets: [] };
        }
        const sorted = [...topProducts].sort((a, b) => a.revenue - b.revenue);
        return {
            labels: sorted.map(p => p.name),
            datasets: [{
                label: 'Revenue',
                data: sorted.map(p => p.revenue),
                backgroundColor: '#38bdf8',
                borderRadius: 4,
                barPercentage: 0.6
            }]
        };
    }, [topProducts]);

    const barChartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `₱${context.parsed.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}K`,
                    color: '#94a3b8'
                }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#64748b', font: { weight: '500' } }
            }
        }
    };

    const pieChartData = useMemo(() => {
        if (!Array.isArray(topProducts) || topProducts.length === 0) {
            return { labels: [], datasets: [] };
        }
        const totalRevenue = topProducts.reduce((sum, p) => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            return sum + rev;
        }, 0);
        
        const percentages = topProducts.map(p => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            return totalRevenue > 0 ? parseFloat(((rev / totalRevenue) * 100).toFixed(1)) : 0;
        });
        
        return {
            labels: topProducts.map(p => p.name || 'Unknown'),
            datasets: [{
                data: percentages,
                backgroundColor: ['#38bdf8', '#fbbf24', '#f97316', '#78350f', '#a78bfa'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        };
    }, [topProducts]);

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top', 
                labels: { 
                    usePointStyle: true, 
                    boxWidth: 8, 
                    padding: 20, 
                    color: '#475569', 
                    font: { weight: '500' } 
                } 
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        if (!Array.isArray(topProducts) || !topProducts[context.dataIndex]) {
                            return ` ${context.label}: ${context.parsed}%`;
                        }
                        const product = topProducts[context.dataIndex];
                        const revenue = Number(product.total_revenue) || Number(product.revenue) || 0;
                        const revenueFormatted = `₱${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        return ` ${context.label}: ${context.parsed}% (${revenueFormatted})`;
                    }
                }
            }
        }
    };

    // Bar Chart Data: Top 10 All-Time Customers
    const topCustomersBarChartData = useMemo(() => {
        if (!topCustomers || topCustomers.length === 0) {
            return { labels: [], datasets: [] };
        }

        // topCustomers is already sorted from highest to lowest revenue.
        // Removed .reverse() so the #1 customer shows up at the top of the chart.
        const labels = topCustomers.map((c, index) => `${index + 1}. ${c.name}`);
        const data = topCustomers.map(c => c.revenue);

        return {
            labels: labels,
            datasets: [{
                label: 'Total Revenue',
                data: data,
                backgroundColor: '#8DB600', // Apple Green
                borderRadius: 4,
                barPercentage: 0.6
            }]
        };
    }, [topCustomers]);

    const topCustomersBarChartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `₱${context.parsed.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}K`,
                    color: '#94a3b8'
                }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#64748b', font: { weight: '500' } }
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans responsive-page pb-12">
            <Head>
                <title>Sales Analytics</title>
            </Head>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                {/* Main Content Sections */}
                <div className="flex flex-col gap-6">

                    {/* --- TOP ROW --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Column: Summary Cards */}
                        <div className="lg:col-span-1 flex flex-col gap-6 min-h-[400px]">
                            <div className="flex-1">
                                <SummaryCard
                                    title="Overall Sales"
                                    isLoading={isSummaryLoading}
                                    value={`₱${overallSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    isPositive={true}
                                    comparisonText={firstTransactionDate ? `First Transaction: ${firstTransactionDate}` : "Lifetime total"}
                                />                            </div>
                            <div className="flex-1">
                                <SummaryCard
                                    title="Recent Sales"
                                    isLoading={isTodayLoading}
                                    value={`₱${todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    percentage={recentSalesPct !== null ? Math.abs(recentSalesPct) : undefined}
                                    isPositive={recentSalesPct !== null ? recentSalesPct >= 0 : true}
                                    comparisonText="vs yesterday"
                                />
                            </div>
                        </div>

                        {/* Right Column: Line Chart */}
                        <div className="lg:col-span-3 min-h-[400px]">
                            <Card className="h-full shadow-sm flex flex-col">
                                <CardHeader className="bg-transparent pb-0 flex flex-row items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-xl">Sales Performance Over Time</h3>
                                    <Select
                                        value={salesView}
                                        onChange={(e) => setSalesView(e.target.value)}
                                        className="w-32 h-8 py-1 px-3 text-sm bg-slate-50 rounded-md font-medium text-slate-700 cursor-pointer hover:bg-slate-100 shadow-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Weekly">Weekly</option>
                                    </Select>
                                </CardHeader>
                                <CardContent className="p-4 pt-4 flex-1 flex flex-col w-full h-full">
                                    <div className="flex-1 w-full h-full min-h-[350px]">
                                        <Line data={lineChartData} options={lineChartOptions} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* --- BOTTOM ROW (2 Columns) --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bottom Middle: Pie Chart */}
                        <Card className="shadow-sm h-[400px] flex flex-col">
                            <CardHeader className="bg-transparent pb-0 shrink-0">
                                <h3 className="font-semibold text-slate-800 text-lg">New Sales by Product</h3>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col w-full h-full">
                                <div className="flex-1 w-full h-full relative flex justify-center items-center">
                                    {isTopProductsLoading ? (
                                        <div className="text-slate-400 text-sm">Loading...</div>
                                    ) : isTopProductsError ? (
                                        <div className="text-red-400 text-sm">Error loading data.</div>
                                    ) : !Array.isArray(topProducts) || topProducts.length === 0 ? (
                                        <div className="text-slate-400 text-sm">No sales data available.</div>
                                    ) : (
                                        <div className="w-full flex justify-center items-center" style={{ height: '280px' }}>
                                            <div className="relative h-full w-full max-w-[280px]">
                                                <Pie data={pieChartData} options={pieChartOptions} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bottom Right: Top 10 All-Time Customers */}
                        <Card className="shadow-sm h-[400px] flex flex-col">
                            <CardHeader className="bg-transparent pb-0 shrink-0">
                                <h3 className="font-semibold text-slate-800 text-lg">Top 10 All-Time Customers</h3>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-1 flex flex-col w-full h-full">
                                <div className="flex items-center gap-2 mb-2 ml-4 text-sm text-slate-600 font-medium shrink-0">
                                    <div className="w-3 h-3 bg-[#8DB600] rounded-sm"></div>
                                    Total Revenue
                                </div>
                                <div className="flex-1 w-full h-full relative">
                                    {isTopCustomersLoading ? (
                                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">Loading...</div>
                                    ) : topCustomers?.length === 0 ? (
                                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">No sales data available.</div>
                                    ) : (
                                        <Bar data={topCustomersBarChartData} options={topCustomersBarChartOptions} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>

            {/* Floating Action Buttons */}
            <FloatingMessages />
            <FloatingNotes />
        </div>
    );
}