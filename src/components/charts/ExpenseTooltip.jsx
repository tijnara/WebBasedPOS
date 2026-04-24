import React from 'react';

// Helper for currency formatting
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);
};

const ExpenseTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // This contains the daily aggregated data
        const totalSales = data.sales || 0;
        const totalExpenses = data.expenses || 0;
        const expenseList = data.expenseList || [];

        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 text-sm">
                <p className="font-bold text-slate-800 mb-2">{label}</p>
                <p className="text-emerald-600 mb-1">
                    Total Sales: <span className="font-semibold">{formatCurrency(totalSales)}</span>
                </p>
                <p className="text-red-600 mb-3">
                    Total Expenses: <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
                </p>

                {expenseList.length > 0 && (
                    <>
                        <p className="font-semibold text-slate-700 mb-2">Itemized Expenses:</p>
                        <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            <ul className="list-disc list-inside space-y-1">
                                {expenseList.map((expense, index) => (
                                    <li key={index} className="text-gray-700">
                                        {expense.name}: <span className="font-medium">{formatCurrency(expense.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
                {expenseList.length === 0 && totalExpenses > 0 && (
                    <p className="text-gray-500 italic">No detailed expense items available.</p>
                )}
            </div>
        );
    }
    return null;
};

export default ExpenseTooltip;
