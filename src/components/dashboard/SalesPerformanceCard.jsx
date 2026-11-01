// src/components/dashboard/SalesPerformanceCard.jsx
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import './chartSetup'; // Registers CategoryScale, LinearScale, PointElement, LineElement, Filler
import { Card, CardHeader, CardContent, Select } from '../ui';

const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading Line Chart...</div>
});

export default function SalesPerformanceCard({ summaryData }) {
    const [salesView, setSalesView] = useState('Monthly');

    const lineChartData = useMemo(() => {
        if (!summaryData) return { labels: [], datasets: [] };

        let labels = [];
        let data = [];

        if (salesView === 'Monthly' && summaryData.monthlyRevenue) {
            const sortedMonths = Object.keys(summaryData.monthlyRevenue).sort();
            labels = sortedMonths.map(month => {
                const [year, m] = month.split('-');
                const date = new Date(year, Number(m) - 1);
                return `${date.toLocaleString('default', { month: 'short' })} '${String(year).slice(-2)}`;
            });
            data = sortedMonths.map(month => summaryData.monthlyRevenue[month]);
        } else if (salesView === 'Weekly' && summaryData.weeklyRevenue) {
            const sortedWeeks = Object.keys(summaryData.weeklyRevenue).sort();
            labels = sortedWeeks.map(weekStart => {
                const [year, m, d] = weekStart.split('-');
                const date = new Date(year, Number(m) - 1, d);
                return `${date.toLocaleString('default', { month: 'short', day: 'numeric' })}`;
            });
            data = sortedWeeks.map(week => summaryData.weeklyRevenue[week]);
        }

        return {
            labels,
            datasets: [{
                label: `${salesView} Sales`,
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
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
                labels: { usePointStyle: true, boxWidth: 8, color: '#64748b', font: { family: 'Inter', weight: '600', size: 13 } }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` ${context.dataset.label}: ₱${Number(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#64748b', font: { size: 11, weight: '600' }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 7 }
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}k`,
                    color: '#94a3b8',
                    font: { size: 11, weight: '500' },
                    padding: 8
                }
            }
        }
    };

    return (
        <Card className="h-full shadow-xs flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <CardHeader className="bg-transparent pb-0 flex flex-row items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Sales Performance Over Time</h3>
                <Select
                    value={salesView}
                    onChange={(e) => setSalesView(e.target.value)}
                    className="w-32 h-8 py-1 px-3 text-xs bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 shadow-2xs outline-none"
                >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                </Select>
            </CardHeader>
            <CardContent className="p-4 pt-4 flex-1 flex flex-col w-full h-full">
                <div className="flex-1 w-full h-full min-h-[280px] sm:min-h-[300px]">
                    <Line key={`sales-line-${salesView}`} data={lineChartData} options={lineChartOptions} />
                </div>
            </CardContent>
        </Card>
    );
}