// src/components/charts/WeeklySalesChart.jsx
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { getDay, eachWeekOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklySalesChart = ({ salesData = [], startDate, endDate }) => {
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
            const dates = salesData.map(s => new Date(s.saleTimestamp));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            return eachWeekOfInterval({ start: minDate, end: maxDate }, weekOptions);
        }
        return [startOfWeek(new Date(), weekOptions)];
    }, [startDate, endDate, salesData]);

    const processChartDataForWeek = (sales, weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weeklySales = Array(7).fill(0);
        const refill20Data = Array(7).fill(0);
        const refill25Data = Array(7).fill(0);
        const totalRefillsData = Array(7).fill(0);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        sales.forEach(sale => {
            const saleDate = new Date(sale.saleTimestamp);
            if (saleDate >= weekStart && saleDate <= weekEnd) {
                let dayOfWeek = getDay(saleDate);
                dayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Adjust Sunday to be the last day
                weeklySales[dayOfWeek] += sale.totalAmount;

                const itemsToProcess = sale.sale_items || sale.items || [];
                itemsToProcess.forEach(item => {
                    const name = (item.productName || item.product_name || '').trim().replace(/\s+/g, '');
                    const qty = item.quantity || 0;

                    if (name === 'Refill(20)') {
                        refill20Data[dayOfWeek] += qty;
                        totalRefillsData[dayOfWeek] += qty;
                    } else if (name === 'Refill(25)') {
                        refill25Data[dayOfWeek] += qty;
                        totalRefillsData[dayOfWeek] += qty;
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
                    refill20Data,
                    refill25Data,
                    totalRefillsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                },
            ],
        };
    };

    const isMultiWeek = weeks.length > 1;

    return (
        <div className="bg-white rounded-lg p-4 responsive-page">
            <h2 className="text-center font-bold text-xl text-slate-800 mb-6">Weekly Sales Performance</h2>

            <div className={isMultiWeek ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "block"}>
                {weeks.map((weekStart, idx) => {
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
                                        const dataset = context.dataset;
                                        const index = context.dataIndex;
                                        const r20 = dataset.refill20Data[index] || 0;
                                        const r25 = dataset.refill25Data[index] || 0;
                                        const total = dataset.totalRefillsData[index] || 0;

                                        return [
                                            `Refill(20): ${r20}`,
                                            `Refill(25): ${r25}`,
                                            `Total Refills: ${total}`
                                        ];
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

                    return (
                        <div key={idx} className={isMultiWeek ? "h-[250px] w-full" : "h-[500px] w-full"}>
                            <Bar data={data} options={options} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklySalesChart;