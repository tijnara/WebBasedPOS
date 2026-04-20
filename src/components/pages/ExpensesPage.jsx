import React, { useState, useMemo, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import currency from 'currency.js';
import { startOfWeek, isAfter, parseISO, format } from 'date-fns';
import { Brain, Plus, Utensils, Car, ShoppingBag, Zap, Receipt } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useExpenses, useCreateExpense, useExpenseSummary, useExpenseCategories, useCreateExpenseCategory } from '../../hooks/useExpenses';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const categoryStyles = {
    'Food': { icon: Utensils, colorClass: 'bg-orange-100 text-orange-600' },
    'Transport': { icon: Car, colorClass: 'bg-blue-100 text-blue-600' },
    'Shopping': { icon: ShoppingBag, colorClass: 'bg-pink-100 text-pink-600' },
    'Bills': { icon: Zap, colorClass: 'bg-emerald-100 text-emerald-600' }
};

export default function ExpensesPage() {
    const { data: expenses = [], isLoading } = useExpenses();
    const { data: summary } = useExpenseSummary();
    const { data: categories = [] } = useExpenseCategories();

    const createExpense = useCreateExpense();
    const createCategory = useCreateExpenseCategory();
    const addToast = useStore((state) => state.addToast);

    // Form States
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // Custom Category States
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Auto-select first category when loaded if none is selected
    useEffect(() => {
        if (categories.length > 0 && !category) {
            setCategory(categories[0].name);
        }
    }, [categories, category]);

    const weeklyChartData = useMemo(() => {
        const totals = [0, 0, 0, 0, 0, 0, 0];
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        expenses.forEach(exp => {
            const expDate = parseISO(exp.expense_date);
            if (isAfter(expDate, weekStart)) {
                let dayIndex = expDate.getDay();
                totals[dayIndex === 0 ? 6 : dayIndex - 1] += parseFloat(exp.amount);
            }
        });
        return totals;
    }, [expenses]);

    const handleCreateCategory = async () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) return;

        // Prevent duplicate submissions
        if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
            addToast({ title: 'Notice', message: 'Category already exists.', type: 'error' });
            setCategory(categories.find(c => c.name.toLowerCase() === trimmedName.toLowerCase()).name);
            setIsAddingCategory(false);
            setNewCategoryName('');
            return;
        }

        try {
            await createCategory.mutateAsync(trimmedName);
            setCategory(trimmedName); // Auto-select newly created category
            setNewCategoryName('');
            setIsAddingCategory(false);
            addToast({ title: 'Success', message: 'New category saved.', type: 'success' });
        } catch (error) {
            addToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description || !category) return;
        try {
            await createExpense.mutateAsync({ amount, category, description });
            setAmount(''); setDescription('');
            addToast({ title: 'Expense Added', message: 'Transaction saved.', type: 'success' });
        } catch (error) {
            addToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    return (
        <div className="responsive-page min-h-screen bg-slate-100">
            <div className="w-full max-w-7xl mx-auto bg-white shadow-xl flex flex-col lg:flex-row rounded-3xl border border-gray-200 overflow-hidden">

                {/* Dashboard Panel */}
                <div className="w-full lg:w-7/12 flex flex-col bg-slate-50">
                    <div className="bg-white text-gray-800 p-8 rounded-br-[3rem] shadow-md z-10">
                        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><Receipt /> Expenses</h1>
                        <p className="text-gray-500 text-sm font-medium">This Week's Total</p>
                        <h2 className="text-5xl font-extrabold mb-4 text-primary">{currency(summary?.weeklyTotal || 0, { symbol: '₱' }).format()}</h2>
                        <div className="flex gap-12 border-t border-gray-200 pt-4">
                            <div><p className="text-xs uppercase font-semibold text-gray-500">Monthly</p><p className="text-lg font-bold">{currency(summary?.monthlyTotal || 0, { symbol: '₱' }).format()}&nbsp;&nbsp;&nbsp;&nbsp;</p></div>
                            <div><p className="text-xs uppercase font-semibold text-gray-500">All Time</p><p className="text-lg font-bold">{currency(summary?.grandTotal || 0, { symbol:'₱' }).format()}</p></div>
                        </div>
                    </div>
                    <div className="p-6 -mt-6">
                        <div className="bg-white rounded-3xl shadow-sm p-6 pt-10 border border-gray-100 h-[250px]">
                            <Bar
                                data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: weeklyChartData, backgroundColor: '#8DB600', borderRadius: 8 }] }}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions Panel */}
                <div className="w-full lg:w-5/12 bg-white flex flex-col p-6 lg:border-l border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Add</h3>
                    <form onSubmit={handleManualSubmit} className="bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-8">
                        <div className="flex flex-col sm:flex-row gap-3 mb-3 items-stretch">
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₱0.00" required step="0.01" className="input flex-[1]" />

                            {/* Category Input / Toggle */}
                            <div className="flex-[1.5]">
                                {isAddingCategory ? (
                                    <div className="flex gap-2 h-full">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Category..."
                                            className="input flex-1 text-sm py-0"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateCategory}
                                            disabled={createCategory.isPending || !newCategoryName.trim()}
                                            className="btn btn--primary text-sm px-3 shrink-0"
                                        >
                                            {createCategory.isPending ? '...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingCategory(false);
                                                setNewCategoryName('');
                                                if(categories.length > 0) setCategory(categories[0].name);
                                            }}
                                            className="btn bg-gray-200 text-gray-600 hover:bg-gray-300 text-sm px-3 shrink-0"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={category}
                                        onChange={(e) => {
                                            if(e.target.value === 'ADD_NEW') { setIsAddingCategory(true); setCategory(''); }
                                            else { setCategory(e.target.value); }
                                        }}
                                        className="input w-full h-full cursor-pointer"
                                    >
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        {categories.length === 0 && <option value="Food">Food</option>}
                                        <option disabled>──────────</option>
                                        <option value="ADD_NEW" className="font-bold text-primary">➕ Add New Category</option>
                                    </select>
                                )}
                            </div>

                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you buy?" required className="input flex-[2]" />
                            <button type="submit" disabled={createExpense.isPending} className="btn btn--primary flex-1 flex justify-center items-center gap-2">
                                {createExpense.isPending ? '...' : 'Add'} <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                        {isLoading ? <p className="text-center py-4">Loading...</p> : expenses.slice(0, 10).map((exp) => {
                            // Fallback if custom category doesn't exist in styles object
                            const style = categoryStyles[exp.category] || { icon: Receipt, colorClass: 'bg-slate-100 text-slate-600' };
                            const Icon = style.icon;
                            return (
                                <div key={exp.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.colorClass}`}><Icon className="w-6 h-6" /></div>
                                        <div>
                                            <h4 className="font-bold">{exp.description}</h4>
                                            <p className="text-xs text-gray-400">{exp.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-extrabold">-{currency(exp.amount, { symbol: '₱' }).format()}</div>
                                        <p className="text-xs text-gray-400">{format(parseISO(exp.expense_date), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {!isLoading && expenses.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 font-medium">No expenses yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}