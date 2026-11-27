// src/components/dashboard/TopCustomersCard.jsx
import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import './chartSetup'; // Registers CategoryScale, LinearScale, BarElement
import { useQuery } from '@tanstack/react-query';
import currency from 'currency.js';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Card, CardHeader, CardContent } from '../ui';
import { Users, RotateCcw } from 'lucide-react';

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading Customers Chart...</div>
});

const formatPeso = (val) =>
    currency(Number(val) || 0, { symbol: '₱', precision: 2 }).format();

export default function TopCustomersCard() {
    const user = useStore((state) => state.user);
    const [selectedCustomerName, setSelectedCustomerName] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const checkTheme = () => setIsDarkMode(root.classList.contains('dark'));
        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const { data: topCustomers, isLoading } = useQuery({
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
                    { name: 'Demo Customer J', revenue: 28000.00 }
                ];
            }

            const { data, error } = await supabase
                .from('sales')
                .select('customername, totalamount');

            if (error) throw error;

            const revenueByCustomer = {};
            (data || []).forEach((sale) => {
                const name = sale.customername;
                if (!name || name.toLowerCase() === 'n/a' || name.toLowerCase().includes('walk-in')) return;
                revenueByCustomer[name] = (revenueByCustomer[name] || 0) + Number(sale.totalamount || 0);
            });

            return Object.entries(revenueByCustomer)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
        },
        staleTime: 1000 * 60 * 60
    });

    const topCustomersTotal = useMemo(() => {
        if (!topCustomers || !topCustomers.length) return 0;
        return topCustomers.reduce((acc, c) => acc + (Number(c.revenue) || 0), 0);
    }, [topCustomers]);

    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerName || !topCustomers) return null;
        const idx = topCustomers.findIndex((c) => c.name === selectedCustomerName);
        if (idx === -1) return null;
        const item = topCustomers[idx];
        const sharePct =
            topCustomersTotal > 0 ? ((Number(item.revenue) / topCustomersTotal) * 100).toFixed(1) : '0.0';
        return { ...item, rank: idx + 1, sharePct };
    }, [selectedCustomerName, topCustomers, topCustomersTotal]);

    const topCustomersBarChartData = useMemo(() => {
        if (!topCustomers || topCustomers.length === 0) return { labels: [], datasets: [] };

        return {
            labels: topCustomers.map((c, index) => `${index + 1}. ${c.name}`),
            datasets: [
                {
                    label: 'Total Revenue',
                    data: topCustomers.map((c) => c.revenue),
                    backgroundColor: topCustomers.map((c) => {
                        if (!selectedCustomerName) return '#10b981';
                        return c.name === selectedCustomerName ? '#0284c7' : '#10b98155';
                    }),
                    borderRadius: 6,
                    barPercentage: 0.65
                }
            ]
        };
    }, [topCustomers, selectedCustomerName]);

    const topCustomersBarChartOptions = useMemo(
        () => ({
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (_event, elements) => {
                if (elements && elements.length > 0 && topCustomers?.[elements[0].index]) {
                    const clickedName = topCustomers[elements[0].index].name;
                    setSelectedCustomerName((prev) => (prev === clickedName ? null : clickedName));
                } else {
                    setSelectedCustomerName(null);
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) =>
                            ` Total Spend: ₱${Number(context.parsed.x).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.8)'
                    },
                    border: { display: false },
                    ticks: {
                        callback: (value) => `₱${(value / 1000).toFixed(0)}k`,
                        color: '#94a3b8',
                        font: { size: 11, weight: '500' }
                    }
                },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: isDarkMode ? '#cbd5e1' : '#475569',
                        font: { size: 12, weight: '600' }
                    }
                }
            }
        }),
        [topCustomers, isDarkMode]
    );

    return (
        <Card className="shadow-2xs min-h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <CardHeader className="bg-transparent pb-0 shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/12 dark:bg-sky-950/60 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">
                        Top 10 All-Time Customers
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {selectedCustomer && (
                        <button
                            type="button"
                            onClick={() => setSelectedCustomerName(null)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Reset customer selection"
                        >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset</span>
                        </button>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ₱{(topCustomersTotal / 1000).toFixed(0)}k Cumulative
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 flex-1 flex flex-col w-full h-full gap-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
                        <span>Total Revenue (₱)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Click a bar or pill to inspect
                    </span>
                </div>

                {selectedCustomer && (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs">
                        <div className="min-w-0">
                            <span className="font-extrabold text-sky-700 dark:text-sky-300 mr-1.5">
                                #{selectedCustomer.rank}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                                {selectedCustomer.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/80 dark:bg-slate-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                                {selectedCustomer.sharePct}% of Top 10
                            </span>
                            <span className="font-mono font-black text-sky-700 dark:text-sky-300">
                                {formatPeso(selectedCustomer.revenue)}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex-1 w-full h-full min-h-[235px] relative">
                    {isLoading ? (
                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">
                            Loading customers...
                        </div>
                    ) : topCustomers?.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">
                            No sales data available.
                        </div>
                    ) : (
                        <Bar
                            key="top-customers-bar"
                            data={topCustomersBarChartData}
                            options={topCustomersBarChartOptions}
                        />
                    )}
                </div>

                {!isLoading && topCustomers?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {topCustomers.slice(0, 5).map((c, idx) => {
                            const active = selectedCustomerName === c.name;
                            return (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCustomerName((prev) => (prev === c.name ? null : c.name))
                                    }
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                        active
                                            ? 'bg-sky-600 text-white shadow-2xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300'
                                    }`}
                                >
                                    #{idx + 1} {c.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}