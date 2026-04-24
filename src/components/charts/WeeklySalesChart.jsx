// src/components/charts/WeeklySalesChart.jsx
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { getDay, eachWeekOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz'; // Corrected import for date-fns-tz v3+

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklySalesChart = ({ salesData = [], startDate, endDate, isLoading }) => {
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

        // Array of 7 objects (one for each day) to hold dynamic product quantities
        const productsSoldPerDay = Array.from({ length: 7 }, () => ({}));

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        sales.forEach(sale => {
            const utcSaleDate = new Date(sale.saleTimestamp || sale.saletimestamp);
            // Convert UTC sale date to 'Asia/Manila' timezone for accurate day grouping using toZonedTime (date-fns-tz v3+)
            const zonedSaleDate = toZonedTime(utcSaleDate, 'Asia/Manila');

            if (zonedSaleDate >= weekStart && zonedSaleDate <= weekEnd) {
                let dayOfWeek = getDay(zonedSaleDate);
                dayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Adjust Sunday to be the last day

                weeklySales[dayOfWeek] += Number(sale.totalAmount || sale.totalamount || 0);

                const itemsToProcess = sale.sale_items || sale.items || [];

                itemsToProcess.forEach(item => {
                    // Use product_id from database, fallback to ID from state if offline/mock
                    const pid = item.product_id || item.productId;
                    const name = item.product_name || item.productName || 'Unknown Product';
                    const qty = item.quantity || 0;

                    if (pid) {
                        if (!productsSoldPerDay[dayOfWeek][pid]) {
                            productsSoldPerDay[dayOfWeek][pid] = { name, quantity: 0 };
                        }
                        productsSoldPerDay[dayOfWeek][pid].quantity += qty;
                    }
                });
            }
        });

        return {
            labels: days,
            datasets: [
                {
                    label: 'Total Sales',
                    data: weeklySales,
                    productsSold: productsSoldPerDay, // Attach the dynamic dictionary to the dataset
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
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
                        display: !isMultiWeek,
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: title,
                        font: { size: isMultiWeek ? 13 : 16 },
                        padding: { bottom: 10 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += `₱${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                                return label;
                            },
                            afterLabel: function (context) {
                                // Retrieve our custom dictionary for this specific day (bar)
                                const dataset = context.dataset;
                                const index = context.dataIndex;
                                const dailyProducts = dataset.productsSold[index] || {};

                                const productLines = [];
                                let totalItems = 0;

                                // Convert dictionary to an array and sort by top-selling products first
                                const sortedProducts = Object.values(dailyProducts).sort((a, b) => b.quantity - a.quantity);

                                sortedProducts.forEach(p => {
                                    productLines.push(`${p.name}: ${p.quantity}`);
                                    totalItems += p.quantity;
                                });

                                if (productLines.length > 0) {
                                    productLines.push('-------------------');
                                    productLines.push(`Total Items: ${totalItems}`);
                                }

                                return productLines;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            };

            return { key: idx, data, options };
        });
    }, [weeks, salesData, isMultiWeek]);

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96 animate-pulse flex flex-col">
                <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-100 rounded mb-8"></div>
                <div className="flex-1 w-full bg-gray-50 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-4 responsive-page">
            <h2 className="text-center font-bold text-xl text-slate-800 mb-6">Weekly Sales Performance</h2>

            <div className={isMultiWeek ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "block"}>
                {chartConfigs.map((config) => (
                    <div key={config.key} className={isMultiWeek ? "h-[250px] w-full" : "h-[500px] w-full"}>
                        <Bar data={config.data} options={config.options} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeeklySalesChart;
