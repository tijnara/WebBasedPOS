// src/components/dashboard/ProductSalesDonutCard.jsx
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import './chartSetup'; // Registers ArcElement, Tooltip, Legend
import { Card, CardHeader, CardContent } from '../ui';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';

const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading Donut Chart...</div>
});

export default function ProductSalesDonutCard() {
    const { data: topProducts, isLoading, isError } = useTopProductsSummary(5);

    const productStats = useMemo(() => {
        if (!Array.isArray(topProducts) || topProducts.length === 0) {
            return { items: [], total: 0 };
        }
        const total = topProducts.reduce((sum, p) => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            return sum + rev;
        }, 0);

        const palette = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

        const items = topProducts.map((p, idx) => {
            const rev = Number(p.total_revenue) || Number(p.revenue) || 0;
            const pct = total > 0 ? parseFloat(((rev / total) * 100).toFixed(1)) : 0;
            return {
                name: p.name || 'Unknown',
                revenue: rev,
                percentage: pct,
                color: palette[idx % palette.length]
            };
        });

        return { items, total };
    }, [topProducts]);

    const doughnutChartData = useMemo(() => {
        if (!productStats.items.length) return { labels: [], datasets: [] };

        return {
            labels: productStats.items.map(i => i.name),
            datasets: [{
                data: productStats.items.map(i => i.revenue),
                backgroundColor: productStats.items.map(i => i.color),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        };
    }, [productStats]);

    const doughnutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        const item = productStats.items[context.dataIndex];
                        return item ? ` ₱${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${item.percentage}%)` : '';
                    }
                }
            }
        }
    };

    return (
        <Card className="shadow-xs min-h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <CardHeader className="bg-transparent pb-0 shrink-0 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">New Sales by Product</h3>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    Total: ₱{Number(productStats.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col w-full h-full">
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">Loading products...</div>
                ) : isError ? (
                    <div className="flex items-center justify-center flex-1 text-red-400 text-sm">Error loading data.</div>
                ) : !productStats.items.length ? (
                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">No sales data available.</div>
                ) : (
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                        <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
                            <Doughnut key="product-doughnut-chart" data={doughnutChartData} options={doughnutChartOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Top Share</span>
                                <span className="text-base font-black text-slate-900 dark:text-white">
                                    ₱{Number(productStats.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 w-full flex flex-col justify-center space-y-2 max-h-[260px] overflow-y-auto pr-1">
                            {productStats.items.map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                                >
                                    <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80">
                                            {item.percentage}%
                                        </span>
                                        <span className="font-black text-slate-900 dark:text-white text-xs">
                                            ₱{Number(item.revenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}