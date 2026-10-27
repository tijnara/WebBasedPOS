// src/components/charts/WeeklySalesChart.jsx
import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { getDay, eachWeekOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Custom Chart.js plugin to draw values on top of each bar so small values are never missed
const barTopValuePlugin = {
    id: 'barTopValuePlugin',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const val = dataset.data[index];
                if (val > 0) {
                    ctx.save();
                    ctx.fillStyle = '#64748b'; // slate-500
                    ctx.font = 'bold 9.5px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    let label = '';
                    if (dataset.metric === 'revenue') {
                        label = val >= 1000 ? `₱${(val / 1000).toFixed(1)}k` : `₱${val}`;
                    } else {
                        label = `${val}g`;
                    }

                    ctx.fillText(label, bar.x, bar.y - 3);
                    ctx.restore();
                }
            });
        });
    }
};

const WeeklySalesChart = ({ salesData = [], startDate, endDate, isLoading }) => {
    // Metric Toggle State: 'revenue' | 'gallons'
    const [metric, setMetric] = useState('revenue');

    // Determine the weeks to display based on the selected date range
    const weeks = useMemo(() => {
        const weekOptions = { weekStartsOn: 1 }; // Monday
        if (startDate && endDate) {
            try {
                return eachWeekOfInterval({ start: startDate, end: endDate }, weekOptions);
            } catch (e) {
                console.error("Invalid interval for WeeklySalesChart", e);
                return [startOfWeek(new Date(), weekOptions)];
            }
        } else if (salesData.length > 0) {
            const dates = salesData.map(s => new Date(s.saleTimestamp || s.saletimestamp));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            return eachWeekOfInterval({ start: minDate, end: maxDate }, weekOptions);
        }
        return [startOfWeek(new Date(), weekOptions)];
    }, [startDate, endDate, salesData]);

    const processChartDataForWeek = (sales, weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weeklySales = Array(7).fill(0);
        const weeklyGallons = Array(7).fill(0);

        // Array of 7 objects (one for each day) to hold product breakdowns
        const productsSoldPerDay = Array.from({ length: 7 }, () => ({}));
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        sales.forEach(sale => {
            const utcSaleDate = new Date(sale.saleTimestamp || sale.saletimestamp);
            const zonedSaleDate = toZonedTime(utcSaleDate, 'Asia/Manila');

            if (zonedSaleDate >= weekStart && zonedSaleDate <= weekEnd) {
                let dayOfWeek = getDay(zonedSaleDate);
                // Adjust Sunday (0) to index 6, Monday (1) to 0
                dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                weeklySales[dayOfWeek] += Number(sale.totalAmount || sale.totalamount || 0);

                const itemsToProcess = sale.sale_items || sale.items || [];

                itemsToProcess.forEach(item => {
                    const pid = item.product_id || item.productId;
                    const name = item.product_name || item.productName || item.name || 'Product';
                    const qty = Number(item.quantity || 0);

                    if (pid) {
                        if (!productsSoldPerDay[dayOfWeek][pid]) {
                            productsSoldPerDay[dayOfWeek][pid] = { name, quantity: 0 };
                        }
                        productsSoldPerDay[dayOfWeek][pid].quantity += qty;
                    }

                    // Count gallons for refill items
                    const lowerName = name.toLowerCase();
                    const lowerCat = (item.category || '').toLowerCase();
                    const isRefill = [2, 3, 30].includes(Number(pid)) || lowerName.includes('refill') || lowerCat.includes('refill');

                    if (isRefill) {
                        weeklyGallons[dayOfWeek] += qty;
                    }
                });
            }
        });

        const isRevenue = metric === 'revenue';

        return {
            labels: days,
            datasets: [
                {
                    label: isRevenue ? 'Total Revenue' : 'Gallons Sold',
                    metric,
                    data: isRevenue ? weeklySales : weeklyGallons,
                    alternateData: isRevenue ? weeklyGallons : weeklySales,
                    productsSold: productsSoldPerDay,
                    backgroundColor: isRevenue ? 'rgba(141, 182, 0, 0.78)' : 'rgba(13, 148, 136, 0.78)',
                    borderColor: isRevenue ? '#8DB600' : '#0d9488',
                    hoverBackgroundColor: isRevenue ? '#7ca000' : '#0f766e',
                    borderWidth: 1.5,
                    borderRadius: 8,
                    borderSkipped: false,
                    minBarLength: 6, // Prevents small revenue/volume days from disappearing as flat 0px lines
                },
            ],
        };
    };

    const isMultiWeek = weeks.length > 1;

    const chartConfigs = useMemo(() => {
        return weeks.map((weekStart, idx) => {
            const data = processChartDataForWeek(salesData, weekStart);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const title = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: title,
                        font: { size: isMultiWeek ? 12 : 14, weight: 'bold' },
                        color: '#334155',
                        padding: { bottom: 12 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 10,
                        cornerRadius: 10,
                        callbacks: {
                            label: function (context) {
                                const dataset = context.dataset;
                                const index = context.dataIndex;
                                const val = context.parsed.y || 0;
                                const altVal = dataset.alternateData[index] || 0;

                                if (dataset.metric === 'revenue') {
                                    return [
                                        `Revenue: ₱${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                        `Volume: ${altVal.toLocaleString()} gal`
                                    ];
                                } else {
                                    return [
                                        `Volume: ${val.toLocaleString()} gal`,
                                        `Revenue: ₱${altVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    ];
                                }
                            },
                            afterLabel: function (context) {
                                const dataset = context.dataset;
                                const index = context.dataIndex;
                                const dailyProducts = dataset.productsSold[index] || {};

                                const productLines = [];
                                let totalItems = 0;

                                const sortedProducts = Object.values(dailyProducts).sort((a, b) => b.quantity - a.quantity);

                                sortedProducts.forEach(p => {
                                    productLines.push(`• ${p.name}: ${p.quantity}`);
                                    totalItems += p.quantity;
                                });

                                if (productLines.length > 0) {
                                    productLines.unshift(''); // Spacer
                                    productLines.push('──────────────────');
                                    productLines.push(`Total Units Sold: ${totalItems}`);
                                }

                                return productLines;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { weight: 'bold', size: 11 }, color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        grace: '14%', // Extra headroom so data labels above the tallest bar are never clipped
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            font: { size: 10 },
                            color: '#94a3b8',
                            callback: function (val) {
                                return metric === 'revenue' ? `₱${val}` : `${val}g`;
                            }
                        }
                    },
                },
            };

            return { key: idx, data, options };
        });
    }, [weeks, salesData, isMultiWeek, metric]);

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs h-96 animate-pulse flex flex-col">
                <div className="h-6 w-48 bg-slate-200 rounded-lg mb-2"></div>
                <div className="h-4 w-64 bg-slate-100 rounded-lg mb-8"></div>
                <div className="flex-1 w-full bg-slate-50 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Chart Header & Metric Toggle Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
                <div>
                    <h2 className="font-black text-base sm:text-lg text-slate-900">
                        Weekly Sales Performance
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {metric === 'revenue'
                            ? 'Displaying monetary sales volume across days (₱)'
                            : 'Displaying water volume and refill container output (gal)'}
                    </p>
                </div>

                {/* 1-Click Toggle: ₱ Revenue vs. Gallons Sold */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setMetric('revenue')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            metric === 'revenue'
                                ? 'bg-white text-[#5f7d00] shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        ₱ Revenue
                    </button>
                    <button
                        type="button"
                        onClick={() => setMetric('gallons')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            metric === 'gallons'
                                ? 'bg-white text-teal-700 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Gallons Sold
                    </button>
                </div>
            </div>

            {/* Render Charts */}
            <div className={isMultiWeek ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "block"}>
                {chartConfigs.map((config) => (
                    <div key={config.key} className={isMultiWeek ? "h-[260px] w-full" : "h-[420px] w-full"}>
                        <Bar
                            data={config.data}
                            options={config.options}
                            plugins={[barTopValuePlugin]}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeeklySalesChart;