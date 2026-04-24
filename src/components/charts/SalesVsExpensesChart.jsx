import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';

// Helper for currency formatting
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // This contains the daily aggregated data
        const totalSales = data.sales || 0;
        const totalExpenses = data.expenses || 0;
        const expenseList = data.expenseList || [];

        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 text-sm">
                <p className="font-bold text-slate-800 mb-2">{label}</p>
                <p className="text-emerald-600 mb-1">
                    Total Sales: <span className="font-semibold">{formatCurrency(totalSales)}</span>
                </p>
                <p className="text-red-600 mb-3">
                    Total Expenses: <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
                </p>

                {expenseList.length > 0 && (
                    <>
                        <p className="font-semibold text-slate-700 mb-2">Itemized Expenses:</p>
                        <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            <ul className="list-disc list-inside space-y-1">
                                {expenseList.map((expense, index) => (
                                    <li key={index} className="text-gray-700">
                                        {expense.name}: <span className="font-medium">{formatCurrency(expense.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
                {expenseList.length === 0 && totalExpenses > 0 && (
                    <p className="text-gray-500 italic">No detailed expense items available.</p>
                )}
            </div>
        );
    }
    return null;
};

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
                .select('amount, expense_date, description, category')
                .gte('expense_date', dateFrom)
                .lte('expense_date', dateTo)
                .order('expense_date', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!dateFrom && !!dateTo,
    });

    const chartData = useMemo(() => {
        if (!parsedDateFrom || !parsedDateTo) return [];

        try {
            const dateRange = eachDayOfInterval({ start: parsedDateFrom, end: parsedDateTo });
            
            const dataMap = {};

            dateRange.forEach(date => {
                const dateKey = format(date, 'yyyy-MM-dd');
                dataMap[dateKey] = {
                    date: format(date, 'MMM dd'),
                    sales: 0,
                    expenses: 0,
                    expenseList: [],
                };
            });

            if (isDemo) {
                dateRange.forEach((date, index) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayMod = (index % 7);
                    dataMap[dateKey].sales = 2000 + (dayMod * 500) + (Math.sin(index) * 300);
                    if (index % 3 === 0) {
                        const expenseAmount = 1500 + (dayMod * 100) + (Math.cos(index) * 200);
                        dataMap[dateKey].expenses = expenseAmount;
                        dataMap[dateKey].expenseList.push(
                            { name: 'Mock Expense A', amount: expenseAmount * 0.6 },
                            { name: 'Mock Expense B', amount: expenseAmount * 0.4 }
                        );
                    }
                });
            } else {
                (salesData || []).forEach(sale => {
                    const ts = sale.saletimestamp || sale.created_at;
                    if (!ts) return;
                    const dateKey = format(parseISO(ts), 'yyyy-MM-dd');
                    if (dataMap[dateKey]) {
                        dataMap[dateKey].sales += (Number(sale.totalamount) || 0);
                    }
                });

                (expensesData || []).forEach(expense => {
                    const ts = expense.expense_date;
                    if (!ts) return;
                    const dateKey = format(parseISO(ts), 'yyyy-MM-dd');
                    if (dataMap[dateKey]) {
                        dataMap[dateKey].expenses += (Number(expense.amount) || 0);
                        dataMap[dateKey].expenseList.push({
                            name: expense.description || expense.category || 'Uncategorized Expense',
                            amount: Number(expense.amount) || 0,
                        });
                    }
                });
            }

            // FILTER: Only include days where there are expenses
            return Object.values(dataMap).filter(day => day.expenses > 0);

        } catch (e) {
            console.error("Error generating chart data:", e);
            return [];
        }
    }, [salesData, expensesData, parsedDateFrom, parsedDateTo, isDemo]);

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

    const hasData = chartData.length > 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Daily Sales vs. Expenses</h2>
                {isDemo && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase tracking-wider">Demo Data</span>
                )}
            </div>
            
            <div className="flex-1 min-h-[300px] w-full relative">
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg">
                        <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>No expenses found for the selected period.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#64748b' }} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => {
                                    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                    return value;
                                }}
                                style={{ fontSize: '11px', fill: '#64748b' }}
                            />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="sales" name="Daily Sales" fill="#10B981" barSize={12} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="Daily Expenses" fill="#EF4444" barSize={12} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default SalesVsExpensesChart;
