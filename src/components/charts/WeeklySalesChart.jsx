// src/components/charts/WeeklySalesChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { getDay } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklySalesChart = ({ salesData }) => {
    const processChartData = (sales) => {
        const weeklySales = Array(7).fill(0); // Sunday to Saturday
        const refill20Data = Array(7).fill(0);
        const refill25Data = Array(7).fill(0);
        const totalRefillsData = Array(7).fill(0);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        (sales || []).forEach(sale => {
            const dayOfWeek = getDay(new Date(sale.saleTimestamp));
            weeklySales[dayOfWeek] += sale.totalAmount;

            // Safely iterate through items to tally the specific products
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
        });

        return {
            labels: days,
            datasets: [
                {
                    label: 'Total Sales',
                    data: weeklySales,
                    // Attach custom data arrays for tooltip access
                    refill20Data,
                    refill25Data,
                    totalRefillsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ],
        };
    };

    const data = processChartData(salesData);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Weekly Sales Performance',
            },
            tooltip: {
                callbacks: {
                    // Formats the primary label (Revenue)
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += `₱${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return label;
                    },
                    // Appends the product quantities below the primary label
                    afterLabel: function(context) {
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
        <div className="bg-white rounded-lg border shadow-sm p-4">
            <Bar data={data} options={options} />
        </div>
    );
};

export default WeeklySalesChart;