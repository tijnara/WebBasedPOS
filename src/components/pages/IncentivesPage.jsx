import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { startOfWeek, endOfWeek, format, addDays, subDays, parseISO } from 'date-fns';
import currency from 'currency.js';
import { Wallet, History, Plus, Info, TrendingUp, ChevronLeft, ChevronRight, Calendar, Receipt } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncentives } from '../../hooks/useIncentives';
import { Button, Label } from '../ui';
import Pagination from '../Pagination';

export default function IncentivesPage() {
    const { addToast } = useStore();
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- PAGINATION STATE ---
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // --- WEEKLY CALCULATION LOGIC ---
    const monday = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const sunday = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Reset pagination to Page 1 whenever the selected Week changes
    useEffect(() => {
        setPage(1);
    }, [monday, sunday]);

    // Use DB Pagination and DB Filtering
    const { history, totalCount, createIncentive, isLoading: historyLoading } = useIncentives({
        startDate: monday,
        endDate: sunday,
        page,
        pageSize
    });

    const { data: { totalSum: weeklyExpenses = 0 } = {} } = useExpenses({
        startDate: monday,
        endDate: sunday,
        pageSize: 1000
    });

    // 1. Append time strings to capture the entire start and end days
    const { data: salesSummary } = useSalesSummary({
        startDate: monday ? new Date(`${monday}T00:00:00`) : undefined,
        endDate: sunday ? new Date(`${sunday}T23:59:59.999`) : undefined
    });

    // 2. Use totalRevenue which inherently matches the filtered date range
    const currentWeekSales = useMemo(() => {
        if (!salesSummary) return 0;

        const periodSales = salesSummary.totalRevenue || 0;

        // Removed Math.max so negative values are returned
        return periodSales - (weeklyExpenses || 0);
    }, [salesSummary, weeklyExpenses]);

    const incentivePool = currentWeekSales * 0.25;

    // --- FORM STATES ---
    const [staffName, setStaffName] = useState('');
    const [percentage, setPercentage] = useState('');

    const handleCalculateAndSave = async (e) => {
        e.preventDefault();
        const perc = parseFloat(percentage);
        if (!staffName || isNaN(perc) || perc < 0 || perc > 100) {
            addToast({ title: 'Invalid Input', message: 'Check name and percentage (0-100).', type: 'error' });
            return;
        }

        const finalAmount = (incentivePool * (perc / 100));

        try {
            await createIncentive.mutateAsync({
                base_weekly_sales: currentWeekSales,
                pool_amount: incentivePool,
                staff_name: staffName,
                staff_percentage: perc,
                final_amount: finalAmount,
                payout_date: new Date(`${monday}T12:00:00Z`)
            });
            addToast({ title: 'Incentive Recorded', message: `Saved share for ${staffName}.`, type: 'success' });
            setStaffName('');
            setPercentage('');
        } catch (err) {
            addToast({ title: 'Error', message: err.message, type: 'error' });
        }
    };

    // --- DYNAMIC COLOR HELPER ---
    const getAmountColor = (amount) => {
        if (amount < 0) return "#ef4444"; // Red
        if (amount > 0 && amount < 500) return "#eab308"; // Yellow
        if (amount >= 500) return "#8db600"; // Apple Green
        return undefined; // Fallback to default theme text color for exactly 0
    };

    return (
        <div className="responsive-page min-h-screen bg-background pb-12">
            <div className="w-full max-w-7xl mx-auto bg-surface shadow-xl flex flex-col lg:flex-row rounded-3xl overflow-hidden border border-transparent">

                {/* Main Dashboard (Left) */}
                <div className="w-full lg:w-7/12 flex flex-col bg-surface">
                    <div className="bg-primary text-black dark:text-white p-8 rounded-br-[3rem] shadow-lg z-10 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><Wallet size={200} /></div>
                        <div className="relative z-10">

                            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
                                        <TrendingUp /> Staff Incentives
                                    </h1>
                                    <Link href="/expenses" className="flex items-center gap-2 text-sm font-medium text-black/70 bg-white/20 hover:bg-white/40 px-4 py-2 rounded-full transition-colors shadow-sm">
                                        <Receipt className="w-4 h-4" />
                                        <span>Expenses</span>
                                    </Link>
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-2">
                                    <div className="flex items-center gap-2 bg-black/10 dark:bg-white/20 p-1.5 rounded-2xl backdrop-blur-md">
                                        <Button onClick={() => setCurrentDate(subDays(currentDate, 7))} variant="ghost" className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/20"><ChevronLeft size={18} /></Button>
                                        <div className="relative flex items-center">
                                            <Calendar className="absolute left-2 w-4 h-4 opacity-50 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={format(currentDate, 'yyyy-MM-dd')}
                                                onChange={(e) => {
                                                    if (e.target.value) setCurrentDate(new Date(`${e.target.value}T00:00:00`));
                                                }}
                                                title="Select a date to jump to that week"
                                                className="bg-transparent text-sm font-bold pl-8 pr-2 py-1 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                                            />
                                        </div>
                                        <Button onClick={() => setCurrentDate(addDays(currentDate, 7))} variant="ghost" className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/20"><ChevronRight size={18} /></Button>
                                    </div>
                                    <p className="text-[11px] text-black/80 dark:text-white/80 font-bold uppercase tracking-widest md:pr-2">
                                        {format(parseISO(monday), 'MMMM dd')} - {format(parseISO(sunday), 'MMMM dd, yyyy')} (Monday - Sunday)
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-bold text-black/90 dark:text-primary-soft uppercase">
                                        {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') === monday 
                                            ? 'Current Week Net Sales' 
                                            : 'Selected Week Net Sales'}
                                    </p>
                                    <h2
                                        className="text-4xl font-black"
                                        style={{ color: getAmountColor(currentWeekSales) }}
                                    >
                                        {currency(currentWeekSales, { symbol: '₱' }).format()}
                                    </h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase">
                                        Revenue: {currency(salesSummary?.totalRevenue || 0, { symbol: '₱' }).format()} | Expenses: {currency(weeklyExpenses, { symbol: '₱' }).format()}
                                    </p>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-xs font-bold text-black uppercase">Incentive Pool (25%)</p>
                                    <h3
                                        className="text-5xl font-black"
                                        style={{ color: getAmountColor(incentivePool) }}
                                    >
                                        {currency(incentivePool, { symbol: '₱' }).format()}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-primary-soft rounded-lg text-primary"><Plus size={20} /></div>
                            <h3 className="text-xl font-bold text-black dark:text-white">Assign New Payout</h3>
                        </div>

                        <form onSubmit={handleCalculateAndSave} className="bg-background/50 p-6 rounded-3xl border border-transparent space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 ml-1">Staff Name</Label>
                                    <input
                                        type="text"
                                        value={staffName}
                                        onChange={(e) => setStaffName(e.target.value)}
                                        placeholder="e.g. Juan"
                                        className="input h-12"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 ml-1">Percentage of Pool</Label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={percentage}
                                            onChange={(e) => setPercentage(e.target.value)}
                                            placeholder="50"
                                            className="input h-12 pr-10"
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 dark:text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>

                            {percentage && !isNaN(percentage) && (
                                <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-transparent animate-in fade-in">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Info size={14} /> Estimated Payout:</div>
                                    <div className="text-2xl font-black text-primary">
                                        {currency(incentivePool * (parseFloat(percentage) / 100), { symbol: '₱' }).format()}
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={createIncentive.isPending || incentivePool <= 0}
                                className="btn--primary w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {createIncentive.isPending ? 'Saving...' : 'Record Payout'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* History Panel (Right) */}
                <div className="w-full lg:w-5/12 bg-surface p-8 border-l border-transparent">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2"><History size={20} /> Payout History</h3>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500 uppercase">{totalCount} Entries</span>
                    </div>

                    <div className="space-y-4 min-h-[200px]">
                        {historyLoading ? (
                            <p className="text-center py-10 text-gray-500 dark:text-gray-400 animate-pulse">Loading records...</p>
                        ) : history.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-transparent rounded-3xl text-gray-500 dark:text-gray-400">
                                No incentives recorded for this week.
                            </div>
                        ) : history.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300"
                            >
                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                                            {item.staff_name ? item.staff_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-black dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                                                {item.staff_name || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mt-0.5">
                                                {item.payout_date ? new Date(item.payout_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'No Date'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-primary">
                                            {currency(item.final_amount || 0, { symbol: '₱' }).format()}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5">
                                            {item.staff_percentage || 0}% of Pool
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Output */}
                    {totalCount > pageSize && (
                        <div className="mt-6 border-t border-transparent pt-4">
                            <Pagination
                                currentPage={page}
                                totalCount={totalCount}
                                pageSize={pageSize}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}