// src/components/charts/WeeklySalesChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { getDay } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklySalesChart = ({ salesData }) => {
    const processChartData = (sales) => {
        const weeklySales = Array(7).fill(0); // Sunday to Saturday
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        sales.forEach(sale => {
            const dayOfWeek = getDay(new Date(sale.saleTimestamp));
            weeklySales[dayOfWeek] += sale.totalAmount;
        });

        return {
            labels: days,
            datasets: [
                {
                    label: 'Total Sales',
                    data: weeklySales,
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
