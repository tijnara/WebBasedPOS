import React, { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, format, addDays, subDays } from 'date-fns';
import currency from 'currency.js';
import { Wallet, Users, History, Percent, Plus, Info, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncentives } from '../../hooks/useIncentives';
import { Button, Input, Label, Card, CardContent } from '../ui';

export default function IncentivesPage() {
    const { addToast } = useStore();
    const { history, createIncentive, isLoading: historyLoading } = useIncentives();
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- WEEKLY CALCULATION LOGIC ---
    const monday = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const sunday = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const { data: { totalSum: weeklyExpenses = 0 } = {} } = useExpenses({
        startDate: monday,
        endDate: sunday,
        pageSize: 1000
    });

    const { data: salesSummary } = useSalesSummary({
        startDate: new Date(monday),
        endDate: new Date(sunday)
    });

    const currentWeekSales = useMemo(() => {
        const revenue = salesSummary?.weeklyRevenue?.[monday] || 0;
        return revenue - weeklyExpenses; // Net Profit
    }, [salesSummary, weeklyExpenses, monday]);

    const incentivePool = currentWeekSales * 0.25; // 25% of Net

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
                payout_date: new Date(monday)
            });
            addToast({ title: 'Incentive Recorded', message: `Saved share for ${staffName}.`, type: 'success' });
            setStaffName('');
            setPercentage('');
        } catch (err) {
            addToast({ title: 'Error', message: err.message, type: 'error' });
        }
    };

    return (
        <div className="responsive-page min-h-screen bg-background">
            <div className="w-full max-w-7xl mx-auto bg-surface shadow-xl flex flex-col lg:flex-row rounded-3xl overflow-hidden border border-transparent">

                {/* Main Dashboard (Left) */}
                <div className="w-full lg:w-7/12 flex flex-col bg-surface">
                    <div className="bg-primary text-black dark:text-white p-8 rounded-br-[3rem] shadow-lg z-10 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><Wallet size={200} /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp /> Staff Incentives</h1>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => setCurrentDate(subDays(currentDate, 7))} variant="ghost" className="p-2 rounded-full hover:bg-white/20"><ChevronLeft /></Button>
                                    <Button onClick={() => setCurrentDate(addDays(currentDate, 7))} variant="ghost" className="p-2 rounded-full hover:bg-white/20"><ChevronRight /></Button>
                                </div>
                            </div>
                            <p className="text-xs text-black/80 dark:text-white/80 font-medium uppercase tracking-widest">Week of {format(new Date(monday), 'MMMM dd')}</p>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-bold text-black/90 dark:text-primary-soft uppercase">Current Week Sales (Net)</p>
                                    <h2 className="text-4xl font-black">{currency(currentWeekSales, { symbol: '₱' }).format()}</h2>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-xs font-bold text-black uppercase">Incentive Pool (25%)</p>
                                    <h3 className="text-5xl font-black text-black">{currency(incentivePool, { symbol: '₱' }).format()}</h3>
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
                                disabled={createIncentive.isPending}
                                className="btn--primary w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
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
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500 uppercase">{history.length} Entries</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 menu-scrollbar">
                        {historyLoading ? (
                            <p className="text-center py-10 text-gray-500 dark:text-gray-400 animate-pulse">Loading records...</p>
                        ) : history.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-transparent rounded-3xl text-gray-500 dark:text-gray-400">
                                No incentives recorded yet.
                            </div>
                        ) : history.map((item, idx) => (
                            <div key={item.id} className="group relative">
                                {idx > 0 && <div className="w-px h-4 bg-transparent mx-auto my-1" />}
                                <div className="bg-background hover:bg-white p-4 rounded-2xl border border-transparent hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">{item.staff_name[0]}</div>
                                            <div>
                                                <p className="font-bold text-black dark:text-white">{item.staff_name}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">{format(new Date(item.payout_date), 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-primary">{currency(item.final_amount, { symbol: '₱' }).format()}</p>
                                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{item.staff_percentage}% of Pool</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}