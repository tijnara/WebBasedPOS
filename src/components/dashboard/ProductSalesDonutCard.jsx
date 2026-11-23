// src/components/dashboard/ProductSalesDonutCard.jsx
import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import currency from 'currency.js';
import './chartSetup'; // Registers ArcElement, Tooltip, Legend
import { Card, CardHeader, CardContent } from '../ui';
import { useTopProductsSummary } from '../../hooks/useTopProductsSummary';
import { PieChart, RotateCcw } from 'lucide-react';

const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
            Loading chart...
        </div>
    )
});

const formatPeso = (val) =>
    currency(Number(val) || 0, { symbol: '₱', precision: 0 }).format();

export default function ProductSalesDonutCard() {
    const { data: topProducts, isLoading, isError } = useTopProductsSummary(5);
    const [activeIndex, setActiveIndex] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Sync slice border color with active theme (light vs dark mode)
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const checkTheme = () => setIsDarkMode(root.classList.contains('dark'));
        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Reset active slice if data changes
    useEffect(() => {
        setActiveIndex(null);
    }, [topProducts]);

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
            const qty = Number(p.total_quantity ?? p.quantity ?? p.units_sold ?? 0);
            const pct = total > 0 ? parseFloat(((rev / total) * 100).toFixed(1)) : 0;
            return {
                name: p.name || 'Unknown',
                revenue: rev,
                quantity: qty,
                percentage: pct,
                color: palette[idx % palette.length]
            };
        });

        return { items, total };
    }, [topProducts]);

    const activeItem =
        activeIndex !== null && productStats.items[activeIndex]
            ? productStats.items[activeIndex]
            : null;

    const doughnutChartData = useMemo(() => {
        if (!productStats.items.length) return { labels: [], datasets: [] };

        return {
            labels: productStats.items.map((i) => i.name),
            datasets: [
                {
                    data: productStats.items.map((i) => i.revenue),
                    backgroundColor: productStats.items.map((item, idx) =>
                        activeIndex !== null && activeIndex !== idx ? `${item.color}4D` : item.color
                    ),
                    borderWidth: 2.5,
                    borderColor: isDarkMode ? '#0f172a' : '#ffffff',
                    hoverBorderColor: isDarkMode ? '#0f172a' : '#ffffff',
                    offset: productStats.items.map((_, idx) => (activeIndex === idx ? 10 : 0)),
                    hoverOffset: 8
                }
            ]
        };
    }, [productStats, activeIndex, isDarkMode]);

    const doughnutChartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            layout: {
                padding: 8
            },
            onClick: (_event, elements) => {
                if (elements && elements.length > 0) {
                    const clickedIdx = elements[0].index;
                    setActiveIndex((prev) => (prev === clickedIdx ? null : clickedIdx));
                } else {
                    setActiveIndex(null);
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                        label: (context) => {
                            const item = productStats.items[context.dataIndex];
                            return item
                                ? ` ₱${item.revenue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })} (${item.percentage}%)`
                                : '';
                        }
                    }
                }
            }
        }),
        [productStats.items]
    );

    return (
        <Card className="shadow-2xs flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-visible">
            <CardHeader className="bg-transparent px-4 pt-4 pb-2 shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <PieChart className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                            Sales by Product
                        </h3>
                        <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
                            Top {productStats.items.length} revenue contributors
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {activeIndex !== null && (
                        <button
                            type="button"
                            onClick={() => setActiveIndex(null)}
                            className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Reset selection"
                        >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>All</span>
                        </button>
                    )}
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70">
                        {formatPeso(productStats.total)}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between w-full">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-medium">
                        Loading product breakdown...
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center py-16 text-rose-400 text-xs font-medium">
                        Error loading product sales data.
                    </div>
                ) : !productStats.items.length ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-medium">
                        No sales data available.
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-between gap-4 sm:gap-5 pt-1">
                        {/* Interactive Donut Ring */}
                        <div className="flex flex-col items-center justify-center shrink-0">
                            <div
                                onClick={() => activeIndex !== null && setActiveIndex(null)}
                                className={`relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center ${
                                    activeIndex !== null ? 'cursor-pointer' : ''
                                }`}
                            >
                                <Doughnut
                                    key="product-doughnut-chart"
                                    data={doughnutChartData}
                                    options={doughnutChartOptions}
                                />

                                {/* Center Dynamic Readout */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-5 text-center">
                                    {activeItem ? (
                                        <>
                                            <span
                                                className="text-[10px] font-extrabold uppercase tracking-wider truncate max-w-[106px]"
                                                style={{ color: activeItem.color }}
                                            >
                                                {activeItem.name}
                                            </span>
                                            <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white leading-tight mt-0.5">
                                                {formatPeso(activeItem.revenue)}
                                            </span>
                                            <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-black font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                                                {activeItem.percentage}% share
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[9.5px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                                                Total Sales
                                            </span>
                                            <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white leading-tight mt-0.5">
                                                {formatPeso(productStats.total)}
                                            </span>
                                            <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                                Tap slice to inspect
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Unclipped Interactive Product Legend */}
                        <div className="flex-1 w-full flex flex-col justify-center gap-2 min-w-0">
                            {productStats.items.map((item, idx) => {
                                const isSelected = activeIndex === idx;
                                const isDimmed = activeIndex !== null && !isSelected;

                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() =>
                                            setActiveIndex((prev) => (prev === idx ? null : idx))
                                        }
                                        style={
                                            isSelected
                                                ? { borderColor: item.color }
                                                : undefined
                                        }
                                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                                            isSelected
                                                ? 'bg-slate-100/90 dark:bg-slate-800 shadow-xs'
                                                : 'bg-slate-50/90 dark:bg-slate-800/55 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/90'
                                        } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {item.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[10px] font-mono font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">
                                                    {item.percentage}%
                                                </span>
                                                <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                                                    {formatPeso(item.revenue)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Proportional Share Bar */}
                                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.max(item.percentage, 3)}%`,
                                                    backgroundColor: item.color
                                                }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}