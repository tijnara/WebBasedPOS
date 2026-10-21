// src/components/expenses/FinancialPerformanceSection.jsx
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import currency from 'currency.js';
import { parseISO, format, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart3, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
    ssr: false,
    loading: () => (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            Loading Business Performance Graph...
        </div>
    )
});

const formatPeso = (val) => currency(Number(val) || 0, { symbol: '₱', precision: 2 }).format();

const formatDateSafe = (dateStr, formatPattern = 'MMM dd, yyyy') => {
    if (!dateStr) return 'N/A';
    try {
        const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : format(d, formatPattern);
    } catch {
        return dateStr;
    }
};

export default function FinancialPerformanceSection({
                                                        dateFrom,
                                                        setDateFrom,
                                                        setDateTo,
                                                        initialDateFrom,
                                                        dateTo,
                                                        weekGrossSales,
                                                        localTotalSum,
                                                        weekNetSales,
                                                        weekNetMargin,
                                                        previousWeekData, // <-- Added
                                                        wowNetGrowth,     // <-- Added
                                                        monthlyComparisonData,
                                                        momNetGrowth,
                                                        selectedMonth,
                                                        setSelectedMonth
                                                    }) {
    const [showBusinessGraph, setShowBusinessGraph] = useState(true);
    const [graphMetricView, setGraphMetricView] = useState('all');

    const handleWeekChange = (e) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate)) {
            setDateFrom(format(startOfWeek(newDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            setDateTo(format(endOfWeek(newDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        }
    };

    const businessChartData = useMemo(() => {
        const labels = [
            previousWeekData?.name || 'Prev Week',
            dateFrom === initialDateFrom ? 'Current Week' : 'Selected Week',
            monthlyComparisonData?.prevMonth?.shortName || 'Prev Month',
            monthlyComparisonData?.currentMonth?.shortName || 'Sel. Month'
        ];

        const datasets = [];

        // Note the 4 array slots corresponding to [Prev Week, Curr Week, Prev Month, Curr Month]
        datasets.push({
            label: 'Gross Sales',
            data: [
                previousWeekData?.gross || 0,
                weekGrossSales,
                monthlyComparisonData?.prevMonth?.gross || 0,
                monthlyComparisonData?.currentMonth?.gross || 0
            ],
            backgroundColor: '#10b981',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
        });

        if (graphMetricView === 'all') {
            datasets.push({
                label: 'Total Expenses',
                data: [
                    previousWeekData?.expenses || 0,
                    localTotalSum,
                    monthlyComparisonData?.prevMonth?.expenses || 0,
                    monthlyComparisonData?.currentMonth?.expenses || 0
                ],
                backgroundColor: '#f43f5e',
                borderRadius: 6,
                barPercentage: 0.6,
                categoryPercentage: 0.7
            });
        }

        datasets.push({
            label: 'Net Profit',
            data: [
                previousWeekData?.net || 0,
                weekNetSales,
                monthlyComparisonData?.prevMonth?.net || 0,
                monthlyComparisonData?.currentMonth?.net || 0
            ],
            backgroundColor: '#0284c7',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
        });

        return { labels, datasets };
    }, [dateFrom, initialDateFrom, monthlyComparisonData, previousWeekData, weekGrossSales, localTotalSum, weekNetSales, graphMetricView]);

    const businessChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, boxWidth: 8, color: '#64748b', font: { family: 'Inter', weight: '600', size: 12 } }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` ${context.dataset.label}: ${formatPeso(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: '600', size: 12 } } },
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 11 }, callback: (val) => `₱${(val / 1000).toFixed(0)}k` } }
        }
    };

    return (
        <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-text">Financial Performance & Margins</h2>
                        <p className="text-xs text-text-muted">Weekly and monthly comparative business metrics</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {showBusinessGraph && (
                        <div className="flex flex-1 sm:flex-initial items-center bg-background p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="flex items-center gap-1.5 px-2">
                                <span className="text-slate-500 font-semibold hidden lg:inline">Week:</span>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={handleWeekChange}
                                    className="bg-transparent text-emerald-600 dark:text-emerald-400 font-bold outline-none cursor-pointer w-[110px]"
                                />
                            </div>
                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                            <div className="flex items-center gap-1.5 px-2">
                                <span className="text-slate-500 font-semibold hidden lg:inline">Month:</span>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-transparent text-sky-600 dark:text-sky-400 font-bold outline-none cursor-pointer w-[110px]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                        {showBusinessGraph && (
                            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                <button onClick={() => setGraphMetricView('gross_net')} className={`px-3 py-1 rounded-lg font-bold transition-all ${graphMetricView === 'gross_net' ? 'bg-surface text-emerald-600 shadow-xs' : 'text-text-muted hover:text-text'}`}>Gross vs. Net</button>
                                <button onClick={() => setGraphMetricView('all')} className={`px-3 py-1 rounded-lg font-bold transition-all ${graphMetricView === 'all' ? 'bg-surface text-emerald-600 shadow-xs' : 'text-text-muted hover:text-text'}`}>Full Breakdown</button>
                            </div>
                        )}
                        <button onClick={() => setShowBusinessGraph(prev => !prev)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors text-xs flex items-center gap-1 font-semibold">
                            <span className="hidden sm:inline">{showBusinessGraph ? 'Hide Graph' : 'Show Graph'}</span>
                            {showBusinessGraph ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {showBusinessGraph && (
                <div className="pt-5 space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Week Gross */}
                        <div className="bg-background rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">{dateFrom === initialDateFrom ? 'Current Week Gross' : 'Selected Week Gross'}</span>
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Sales</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-text">{formatPeso(weekGrossSales)}</div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-text-muted">
                                <span>Prior Week:</span>
                                <span className="font-semibold text-text">{formatPeso(previousWeekData?.gross || 0)}</span>
                            </div>
                        </div>

                        {/* 2. Week Net */}
                        <div className="bg-background rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">{dateFrom === initialDateFrom ? 'Current Week Net' : 'Selected Week Net'}</span>
                                {wowNetGrowth !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(wowNetGrowth) >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                                        {Number(wowNetGrowth) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {Math.abs(wowNetGrowth)}% WoW
                                    </span>
                                )}
                            </div>
                            <div className={`text-xl sm:text-2xl font-black ${weekNetSales >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                {weekNetSales >= 0 ? '+' : ''}{formatPeso(weekNetSales)}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-text-muted">
                                <span>Margin:</span>
                                <span className="font-bold text-sky-600">{weekNetMargin}%</span>
                            </div>
                        </div>

                        {/* 3. Month Gross */}
                        <div className="bg-background rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">{monthlyComparisonData?.currentMonth?.shortName} Gross</span>
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Sales</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-text">{formatPeso(monthlyComparisonData?.currentMonth?.gross || 0)}</div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-text-muted">
                                <span>Prior Month:</span>
                                <span className="font-semibold text-text">{formatPeso(monthlyComparisonData?.prevMonth?.gross || 0)}</span>
                            </div>
                        </div>

                        {/* 4. Month Net */}
                        <div className="bg-background rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">{monthlyComparisonData?.currentMonth?.shortName} Net</span>
                                {momNetGrowth !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(momNetGrowth) >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                                        {Number(momNetGrowth) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {Math.abs(momNetGrowth)}% MoM
                                    </span>
                                )}
                            </div>
                            <div className={`text-xl sm:text-2xl font-black ${monthlyComparisonData?.currentMonth?.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                {formatPeso(monthlyComparisonData?.currentMonth?.net || 0)}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-text-muted">
                                <span>Margin:</span>
                                <span className="font-bold text-sky-600">{monthlyComparisonData?.currentMonth?.margin || '0.0'}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
                        <div className="h-[280px] sm:h-[320px] w-full">
                            <Bar data={businessChartData} options={businessChartOptions} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}