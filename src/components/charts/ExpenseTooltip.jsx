import React from 'react';

// Helper for currency formatting
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);
};

const ExpenseTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // This contains the aggregated data
        const totalSales = data.sales || 0;
        const totalExpenses = data.expenses || 0;

        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 text-sm">
                <p className="font-bold text-slate-800 mb-2">{label}</p>
                <p className="mb-1 text-[#8DB600]">
                    Total Sales: <span className="font-semibold">{formatCurrency(totalSales)}</span>
                </p>
                <p className="text-red-600 mb-1">
                    Total Expenses: <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default ExpenseTooltip;
