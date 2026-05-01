import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { eachWeekOfInterval, format, parseISO, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import ExpenseTooltip from './ExpenseTooltip';

const SalesVsExpensesChart = ({ dateFrom, dateTo }) => {
    const isDemo = useStore(state => state.user?.isDemo);
    const parsedDateFrom = useMemo(() => (dateFrom ? parseISO(dateFrom) : null), [dateFrom]);
    const parsedDateTo = useMemo(() => (dateTo ? parseISO(dateTo) : null), [dateTo]);

    // Fetch sales data
    const { data: salesData, isLoading: isLoadingSales, error: salesError } = useQuery({
        queryKey: ['weeklySales', dateFrom, dateTo, isDemo],
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
        queryKey: ['weeklyExpenses', dateFrom, dateTo, isDemo],
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
            const dateRange = eachWeekOfInterval({ start: parsedDateFrom, end: parsedDateTo }, { weekStartsOn: 1 });

            const dataMap = {};

            dateRange.forEach(date => {
                const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
                const dateKey = format(weekStart, 'yyyy-MM-dd');
                dataMap[dateKey] = {
                    dateKey: dateKey,
                    date: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
                    sales: 0,
                    expenses: 0,
                    expenseList: [],
                };
            });

            if (isDemo) {
                dateRange.forEach((date, index) => {
                    const dateKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    if(dataMap[dateKey]) {
                        dataMap[dateKey].sales = 14000 + (index * 500) + (Math.sin(index) * 2000);
                        if (index % 2 === 0) {
                            const expenseAmount = 10000 + (index * 200) + (Math.cos(index) * 1000);
                            dataMap[dateKey].expenses = expenseAmount;
                            dataMap[dateKey].expenseList.push(
                                { name: 'Mock Expense A', amount: expenseAmount * 0.6 },
                                { name: 'Mock Expense B', amount: expenseAmount * 0.4 }
                            );
                        }
                    }
                });
            } else {
                (salesData || []).forEach(sale => {
                    const ts = sale.saletimestamp || sale.created_at;
                    if (!ts) return;
                    const dateObj = new Date(formatInTimeZone(ts, 'Asia/Manila', 'yyyy-MM-dd HH:mm:ss'));
                    const dateKey = format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    if (dataMap[dateKey]) {
                        dataMap[dateKey].sales += (Number(sale.totalamount) || 0);
                    }
                });

                (expensesData || []).forEach(expense => {
                    const ts = expense.expense_date;
                    if (!ts) return;
                    const dateObj = new Date(formatInTimeZone(ts, 'Asia/Manila', 'yyyy-MM-dd HH:mm:ss'));
                    const dateKey = format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    if (dataMap[dateKey]) {
                        dataMap[dateKey].expenses += (Number(expense.amount) || 0);
                        dataMap[dateKey].expenseList.push({
                            name: expense.description || expense.category || 'Uncategorized Expense',
                            amount: Number(expense.amount) || 0,
                        });
                    }
                });
            }

            const currentWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const START_CUTOFF_DATE_STR = '2026-04-20';

            // FILTER: Only include weeks where there are expenses OR it's the current week
            // Ensure no weeks BEFORE April 20, 2026, are rendered
            return Object.values(dataMap).filter(week => {
                const hasActivityOrCurrent = week.expenses > 0 || week.dateKey === currentWeekKey || week.sales > 0;
                return week.dateKey >= START_CUTOFF_DATE_STR && hasActivityOrCurrent;
            });

        } catch (e) {
            console.error("Error generating chart data:", e);
            return [];
        }
    }, [salesData, expensesData, parsedDateFrom, parsedDateTo, isDemo]);

    if (isLoadingSales || isLoadingExpenses) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 transition-colors p-6 rounded-2xl shadow-sm h-96 animate-pulse flex flex-col">
                <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800 rounded mb-8"></div>
                <div className="flex-1 w-full bg-gray-50 dark:bg-slate-800/50 rounded-xl"></div>
            </div>
        );
    }

    if (salesError || expensesError) {
        return (
            <div className="h-96 flex items-center justify-center bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 transition-colors rounded-xl shadow-sm text-red-500 p-6 text-center">
                <div>
                    <p className="font-bold mb-2">Error loading chart data</p>
                    <p className="text-sm opacity-80">{salesError?.message || expensesError?.message}</p>
                </div>
            </div>
        );
    }

    const hasData = chartData.length > 0;

    return (
        <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 transition-colors p-6 rounded-xl shadow-sm h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Weekly Sales vs. Expenses</h2>
                {isDemo && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase tracking-wider">Demo Data</span>
                )}
            </div>

            <div className="flex-1 min-h-[300px] w-full relative">
                {!hasData ? (
                    <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <p>No data found for the selected period.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => {
                                    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                    return value;
                                }}
                                style={{ fontSize: '11px', fill: '#94a3b8' }}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<ExpenseTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="sales" name="Weekly Sales" fill="#10B981" barSize={24} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="Weekly Expenses" fill="#EF4444" barSize={24} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default SalesVsExpensesChart;