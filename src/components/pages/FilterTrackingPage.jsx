// src/components/pages/FilterTrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Button, Card, CardContent } from '../ui';
import { PackageIcon } from '../Icons';
import { ShoppingCart, Info } from 'lucide-react';
import { useCreateExpense } from '../../hooks/useExpenses';
import { startOfWeek, addWeeks } from 'date-fns';

// Added lifespanWeeks to accurately divide costs into weekly expenses
const FILTER_CONFIG = [
    { id: '10_micron', name: '10 Micron Sediment', lifespanDays: 28, lifespanWeeks: 4, containerLimit: 1000, cost: 57, containersText: '1,000', purpose: 'Traps large rust, dirt, and sand', pcs: 1 },
    { id: '5_micron', name: '5 Micron Sediment', lifespanDays: 28, lifespanWeeks: 4, containerLimit: 1000, cost: 61, containersText: '1,000', purpose: 'Traps medium silt and suspended particles', pcs: 1 },
    { id: '1_micron', name: '1 Micron Sediment', lifespanDays: 28, lifespanWeeks: 4, containerLimit: 1000, cost: 57, containersText: '1,000', purpose: 'Catches ultra-fine particles right before treatment', pcs: 2 },
    { id: 'carbon_block', name: 'Carbon Block (CTO)', lifespanDays: 60, lifespanWeeks: 8, containerLimit: 1500, cost: 243, containersText: '1,500', purpose: 'Absorbs chlorine, bad odors, and improves taste', pcs: 2 }
];

export default function FilterTrackingPage() {
    const { user, addToast } = useStore();
    const isDemo = user?.isDemo;
    const [trackingData, setTrackingData] = useState({});
    const [usageData, setUsageData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const createExpense = useCreateExpense();

    const fetchTrackingData = async () => {
        setIsLoading(true);
        if (isDemo) {
            const mockDates = {
                '10_micron': new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                '5_micron': new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                '1_micron': new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
                'carbon_block': new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
            };
            const mockUsage = {
                '10_micron': 1050,
                '5_micron': 400,
                '1_micron': 600,
                'carbon_block': 1200
            };
            setTrackingData(mockDates);
            setUsageData(mockUsage);
            checkNotifications(mockDates, mockUsage);
            setIsLoading(false);
            return;
        }

        const { data, error } = await supabase.from('filter_tracking').select('*');
        if (!error && data) {
            const mappedDates = {};
            data.forEach(row => { mappedDates[row.filter_id] = row.last_replaced_at; });
            setTrackingData(mappedDates);

            const mappedUsage = {};
            for (const filter of FILTER_CONFIG) {
                if (mappedDates[filter.id]) {
                    const { data: salesData } = await supabase
                        .from('sale_items')
                        .select('quantity, sales!inner(saletimestamp, status)')
                        .in('product_id', [2, 3, 30])
                        .eq('sales.status', 'Completed')
                        .gte('sales.saletimestamp', mappedDates[filter.id]);

                    mappedUsage[filter.id] = salesData ? salesData.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
                } else {
                    mappedUsage[filter.id] = 0;
                }
            }

            setUsageData(mappedUsage);
            checkNotifications(mappedDates, mappedUsage);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTrackingData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkNotifications = (dates, usages) => {
        let overdueFilters = [];
        FILTER_CONFIG.forEach(filter => {
            const lastReplaced = dates[filter.id] ? new Date(dates[filter.id]) : new Date();
            const daysPassed = Math.floor((new Date() - lastReplaced) / (1000 * 60 * 60 * 24));
            const containersSold = usages[filter.id] || 0;

            if (daysPassed >= filter.lifespanDays || containersSold >= filter.containerLimit) {
                overdueFilters.push(filter.name);
            }
        });

        if (overdueFilters.length > 0) {
            addToast({
                title: 'Filter Replacement Required!',
                description: `Filters overdue by time or usage: ${overdueFilters.join(', ')}`,
                variant: 'destructive'
            });
        }
    };

    const handleReplace = async (filterId) => {
        if (isDemo) {
            setTrackingData(prev => ({ ...prev, [filterId]: new Date().toISOString() }));
            setUsageData(prev => ({ ...prev, [filterId]: 0 }));
            addToast({ title: 'Filter Replaced', description: 'Counter has been reset.', variant: 'success' });
            return;
        }

        const { error } = await supabase
            .from('filter_tracking')
            .upsert({
                filter_id: filterId,
                last_replaced_at: new Date().toISOString(),
                replaced_by: user?.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'filter_id' });

        if (!error) {
            addToast({ title: 'Filter Replaced', description: 'Counter has been reset.', variant: 'success' });
            fetchTrackingData();
        } else {
            addToast({ title: 'Error', description: 'Failed to update tracking.', variant: 'destructive' });
        }
    };

    const processedFilters = FILTER_CONFIG.map(filter => {
        const lastReplaced = trackingData[filter.id] ? new Date(trackingData[filter.id]) : new Date();
        const daysPassed = Math.floor((new Date() - lastReplaced) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, filter.lifespanDays - daysPassed);
        const timePercent = Math.min(100, (daysPassed / filter.lifespanDays) * 100);
        const isTimeOverdue = daysLeft === 0;

        const containersSold = usageData[filter.id] || 0;
        const containersLeft = Math.max(0, filter.containerLimit - containersSold);
        const usagePercent = Math.min(100, (containersSold / filter.containerLimit) * 100);
        const isUsageOverdue = containersSold >= filter.containerLimit;

        const isOverdue = isTimeOverdue || isUsageOverdue;

        return {
            ...filter,
            daysPassed, daysLeft, timePercent, isTimeOverdue,
            containersSold, containersLeft, usagePercent, isUsageOverdue,
            isOverdue
        };
    });

    const overdueFilters = processedFilters.filter(f => f.isOverdue);
    const totalOverdueCost = overdueFilters.reduce((sum, f) => sum + (f.cost * f.pcs), 0);

    const handlePurchaseAndRecord = async () => {
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Cannot record expenses in demo mode.', variant: 'destructive' });
            return;
        }

        setIsPurchasing(true);
        try {
            const today = new Date();
            const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday

            const expensePromises = [];

            // Loop through each overdue filter and spread its cost across its lifespan in weeks
            overdueFilters.forEach(filter => {
                const totalFilterCost = filter.cost * filter.pcs;
                const weeklyCost = totalFilterCost / filter.lifespanWeeks;

                for (let i = 0; i < filter.lifespanWeeks; i++) {
                    const expenseDate = addWeeks(startOfCurrentWeek, i); // Adds 1 week per iteration
                    expensePromises.push(
                        createExpense.mutateAsync({
                            amount: weeklyCost.toFixed(2),
                            category: 'Maintenance',
                            description: `Filter Replacement (${filter.name}) - Amortized Week ${i + 1}/${filter.lifespanWeeks}`,
                            expense_date: expenseDate.toISOString()
                        })
                    );
                }
            });

            await Promise.all(expensePromises);

            // Reset the tracking dates
            const replacePromises = overdueFilters.map(f => {
                return supabase
                    .from('filter_tracking')
                    .upsert({
                        filter_id: f.id,
                        last_replaced_at: new Date().toISOString(),
                        replaced_by: user?.id,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'filter_id' });
            });
            await Promise.all(replacePromises);

            addToast({
                title: 'Purchase Recorded',
                description: `Expenses have been successfully amortized weekly. Counters reset.`,
                variant: 'success'
            });
            fetchTrackingData();
        } catch (error) {
            console.error(error);
            addToast({ title: 'Error', description: 'Failed to record expenses. Check console for details.', variant: 'destructive' });
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Filter Replacement Tracking</h1>
                <p className="text-gray-500 text-xs mt-0.5">Monitor maintenance based on days elapsed or total containers sold.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Sidebar / Pending Purchases Panel - ALWAYS VISIBLE */}
                <div className="w-full lg:w-80 shrink-0 order-first lg:order-last">
                    <Card className="sticky top-24 bg-orange-50 overflow-hidden shadow-md">
                        <div className="bg-orange-100/50 px-5 py-4">
                            <h3 className="font-bold text-orange-900 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" /> Pending Purchases
                            </h3>
                            <p className="text-xs text-orange-700 mt-1">Filters that require replacement.</p>
                        </div>

                        <CardContent className="p-5 space-y-4">
                            {overdueFilters.length > 0 ? (
                                <ul className="space-y-3">
                                    {overdueFilters.map(f => (
                                        <li key={f.id} className="flex justify-between items-center text-sm border-b border-orange-200/50 pb-2">
                                            <div>
                                                <span className="font-semibold text-gray-800">{f.name}</span>
                                                <span className="text-xs text-gray-500 block">₱{f.cost} x {f.pcs} pcs</span>
                                            </div>
                                            <span className="font-bold text-gray-900">₱{f.cost * f.pcs}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4 bg-white rounded-lg border border-orange-100">
                                    All filters are currently in good condition.
                                </div>
                            )}

                            <div className="bg-white rounded-lg p-3 flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">Total Due</span>
                                <span className="text-xl font-black text-red-600">₱{totalOverdueCost}</span>
                            </div>

                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
                                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                <p>
                                    Clicking the button below will automatically create <strong>weekly expenses</strong> for each filter spread across its lifespan (e.g., 4 weeks for Sediment filters) to accurately reflect your 6-day operating schedule.
                                </p>
                            </div>

                            <Button
                                onClick={handlePurchaseAndRecord}
                                disabled={isPurchasing || isDemo || overdueFilters.length === 0}
                                className={`w-full h-12 shadow-sm font-bold ${
                                    overdueFilters.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                            >
                                {isPurchasing ? 'Recording...' : 'Purchase & Record Expense'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Filter Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full order-last lg:order-first">
                    {processedFilters.map(filter => (
                        <Card key={filter.id} className={`border-0 ring-1 shadow-sm ${filter.isOverdue ? 'ring-red-200 bg-red-50/30' : 'ring-gray-200 bg-white'}`}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${filter.isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <PackageIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{filter.name} {filter.pcs > 1 && <span className="text-xs font-normal text-gray-500">({filter.pcs} pcs)</span>}</h3>
                                            <p className="text-[11px] text-gray-500 max-w-[200px] leading-tight mt-0.5">{filter.purpose}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-gray-800">₱{filter.cost * filter.pcs}</span>
                                        <p className="text-[10px] text-gray-400">total piece(s) cost</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Detailed Stats Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                            <span className="text-gray-500 block">Time Elapsed</span>
                                            <span className="font-semibold text-gray-800">{filter.daysPassed} / {filter.lifespanDays} Days</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                            <span className="text-gray-500 block">Usage (Sold)</span>
                                            <span className="font-semibold text-gray-800">{filter.containersSold} / {filter.containersText}</span>
                                        </div>
                                    </div>

                                    {/* Time Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 font-medium">Time Remaining</span>
                                            <span className={`font-bold ${filter.isTimeOverdue ? 'text-red-600' : 'text-primary'}`}>
                                                {filter.isTimeOverdue ? 'OVERDUE' : `${filter.daysLeft} days left`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full ${filter.isTimeOverdue ? 'bg-red-500' : filter.timePercent > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                style={{ width: `${filter.timePercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Usage Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 font-medium">Containers Remaining</span>
                                            <span className={`font-bold ${filter.isUsageOverdue ? 'text-red-600' : 'text-primary'}`}>
                                                {filter.isUsageOverdue ? 'LIMIT REACHED' : `${filter.containersLeft} containers left`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full ${filter.isUsageOverdue ? 'bg-red-500' : filter.usagePercent > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                style={{ width: `${filter.usagePercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Manual Action Button */}
                                    <Button
                                        onClick={() => handleReplace(filter.id)}
                                        disabled={isPurchasing}
                                        className={`w-full h-10 mt-2 shadow-sm ${filter.isOverdue ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn--outline'}`}
                                    >
                                        {filter.isOverdue ? 'Mark as Replaced Manually' : 'Record New Replacement'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}