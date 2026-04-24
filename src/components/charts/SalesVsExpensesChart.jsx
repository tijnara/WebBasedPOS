import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

const SalesVsExpensesChart = ({ dateFrom, dateTo }) => {
    const isDemo = useStore(state => state.user?.isDemo);
    const parsedDateFrom = useMemo(() => (dateFrom ? parseISO(dateFrom) : null), [dateFrom]);
    const parsedDateTo = useMemo(() => (dateTo ? parseISO(dateTo) : null), [dateTo]);

    // Fetch sales data
    const { data: salesData, isLoading: isLoadingSales, error: salesError } = useQuery({
        queryKey: ['dailySales', dateFrom, dateTo, isDemo],
        queryFn: async () => {
            if (isDemo) return [];
            const { data, error } = await supabase
                .from('sales')
                .select('totalamount, saletimestamp')
                .gte('saletimestamp', dateFrom)
                .lte('saletimestamp', dateTo)
                .order('saletimestamp', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!dateFrom && !!dateTo,
    });

    // Fetch expenses data
    const { data: expensesData, isLoading: isLoadingExpenses, error: expensesError } = useQuery({
        queryKey: ['dailyExpenses', dateFrom, dateTo, isDemo],
        queryFn: async () => {
            if (isDemo) return [];
            const { data, error } = await supabase
                .from('expenses')
                .select('amount, expense_date')
                .gte('expense_date', dateFrom)
                .lte('expense_date', dateTo)
                .order('expense_date', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!dateFrom && !!dateTo,
    });

    const chartData = useMemo(() => {
        if (!parsedDateFrom || !parsedDateTo) return { labels: [], datasets: [] };

        try {
            const dateRange = eachDayOfInterval({ start: parsedDateFrom, end: parsedDateTo });
            
            let aggregatedSales = {};
            let aggregatedExpenses = {};

            if (isDemo) {
                // Generate mock data for demo mode
                dateRange.forEach((date, index) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayMod = (index % 7);
                    aggregatedSales[dateKey] = 2000 + (dayMod * 500) + (Math.sin(index) * 300);
                    // Mock expenses only on certain days (e.g., every 3 days)
                    if (index % 3 === 0) {
                        aggregatedExpenses[dateKey] = 1500 + (dayMod * 100) + (Math.cos(index) * 200);
                    }
                });
            } else {
                (salesData || []).forEach(sale => {
                    const ts = sale.saletimestamp || sale.created_at;
                    if (!ts) return;
                    const dateKey = format(parseISO(ts), 'yyyy-MM-dd');
                    aggregatedSales[dateKey] = (aggregatedSales[dateKey] || 0) + (Number(sale.totalamount) || 0);
                });

                (expensesData || []).forEach(expense => {
                    const ts = expense.expense_date;
                    if (!ts) return;
                    const dateKey = format(parseISO(ts), 'yyyy-MM-dd');
                    aggregatedExpenses[dateKey] = (aggregatedExpenses[dateKey] || 0) + (Number(expense.amount) || 0);
                });
            }

            // FILTER: Only include days where there are expenses
            const filteredDates = dateRange.filter(date => {
                const dateKey = format(date, 'yyyy-MM-dd');
                return (aggregatedExpenses[dateKey] || 0) > 0;
            });

            const labels = filteredDates.map(date => format(date, 'MMM dd'));
            const salesValues = filteredDates.map(date => aggregatedSales[format(date, 'yyyy-MM-dd')] || 0);
            const expensesValues = filteredDates.map(date => aggregatedExpenses[format(date, 'yyyy-MM-dd')] || 0);

            return {
                labels,
                datasets: [
                    {
                        label: 'Daily Sales',
                        data: salesValues,
                        backgroundColor: '#10B981',
                        borderColor: '#10B981',
                        borderWidth: 0,
                        borderRadius: 4,
                        barThickness: 12,
                    },
                    {
                        label: 'Daily Expenses',
                        data: expensesValues,
                        backgroundColor: '#EF4444',
                        borderColor: '#EF4444',
                        borderWidth: 0,
                        borderRadius: 4,
                        barThickness: 12,
                    }
                ]
            };
        } catch (e) {
            console.error("Error generating chart data:", e);
            return { labels: [], datasets: [] };
        }
    }, [salesData, expensesData, parsedDateFrom, parsedDateTo, isDemo]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: { size: 12, weight: '600' },
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#1e293b',
                bodyColor: '#64748b',
                borderColor: '#e2e8f0',
                borderWidth: 0,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { font: { size: 11, weight: '500' }, color: '#64748b' }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { size: 11, weight: '500' },
                    color: '#64748b',
                    callback: function(value) {
                        if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                        return value;
                    }
                }
            }
        }
    };

    if (isLoadingSales || isLoadingExpenses) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                <p>Loading Sales vs Expenses Chart...</p>
            </div>
        );
    }

    if (salesError || expensesError) {
        return (
            <div className="h-96 flex items-center justify-center bg-white rounded-xl shadow-sm text-red-500 p-6 text-center">
                <div>
                    <p className="font-bold mb-2">Error loading chart data</p>
                    <p className="text-sm opacity-80">{salesError?.message || expensesError?.message}</p>
                </div>
            </div>
        );
    }

    const hasData = chartData.labels.length > 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Daily Sales vs. Expenses</h2>
                {isDemo && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase tracking-wider">Demo Data</span>
                )}
            </div>
            
            <div className="flex-1 min-h-0">
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg">
                        <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>No expenses found for the selected period.</p>
                    </div>
                ) : (
                    <Bar data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default SalesVsExpensesChart;
