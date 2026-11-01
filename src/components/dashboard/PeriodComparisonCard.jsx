// src/components/dashboard/PeriodComparisonCard.jsx
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import './chartSetup'; // Registers CategoryScale, LinearScale, BarElement
import { Card, CardHeader, CardContent } from '../ui';
import { BarChart3 } from 'lucide-react';

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading Comparison Chart...</div>
});

export default function PeriodComparisonCard({ monthlyGrowthData, weeklyGrowthData }) {
    const [periodGraphMode, setPeriodGraphMode] = useState('revenue');

    const mThisSales = Number(monthlyGrowthData?.thisMonthSales) || 0;
    const mLastSales = Number(monthlyGrowthData?.lastMonthSales) || 0;
    const mThisGal = Number(monthlyGrowthData?.thisMonthGallons) || 0;
    const mLastGal = Number(monthlyGrowthData?.lastMonthGallons) || 0;

    const wThisSales = Number(weeklyGrowthData?.thisWeekSales) || 0;
    const wLastSales = Number(weeklyGrowthData?.lastWeekSales) || 0;
    const wThisGal = Number(weeklyGrowthData?.thisWeekGallons) || 0;
    const wLastGal = Number(weeklyGrowthData?.lastWeekGallons) || 0;

    const periodComparisonBarData = useMemo(() => {
        const isRev = periodGraphMode === 'revenue';

        return {
            labels: ['Monthly Analysis', 'Weekly Analysis'],
            datasets: [
                {
                    label: 'Current Period',
                    data: isRev ? [mThisSales, wThisSales] : [mThisGal, wThisGal],
                    backgroundColor: isRev ? '#10b981' : '#0284c7',
                    borderRadius: 6,
                    barPercentage: 0.55,
                    categoryPercentage: 0.65
                },
                {
                    label: 'Previous Period',
                    data: isRev ? [mLastSales, wLastSales] : [mLastGal, wLastGal],
                    backgroundColor: '#cbd5e1',
                    borderRadius: 6,
                    barPercentage: 0.55,
                    categoryPercentage: 0.65
                }
            ]
        };
    }, [periodGraphMode, mThisSales, wThisSales, mLastSales, wLastSales, mThisGal, wThisGal, mLastGal, wLastGal]);

    const periodComparisonBarOptions = {
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
                    label: (context) => {
                        const val = context.parsed.y;
                        const formatted = periodGraphMode === 'revenue'
                            ? `₱${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${Number(val).toLocaleString()} gal`;
                        return ` ${context.dataset.label}: ${formatted}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { weight: '600', size: 12 } }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (val) => periodGraphMode === 'revenue' ? `₱${(val / 1000).toFixed(0)}k` : `${val} gal`
                }
            }
        }
    };

    return (
        <Card className="h-full shadow-xs flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <CardHeader className="bg-transparent pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Period Comparison</h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                    <button
                        type="button"
                        onClick={() => setPeriodGraphMode('revenue')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${periodGraphMode === 'revenue' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Revenue
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriodGraphMode('gallons')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${periodGraphMode === 'gallons' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Gallons
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 flex-1 flex flex-col w-full h-full">
                <div className="flex-1 w-full h-full min-h-[280px] sm:min-h-[300px]">
                    <Bar key={`comparison-bar-${periodGraphMode}`} data={periodComparisonBarData} options={periodComparisonBarOptions} />
                </div>
            </CardContent>
        </Card>
    );
}