// Created on Sunday, April 20, 2026
import React, { useState, useMemo, useEffect } from 'react';
import currency from 'currency.js';
import { startOfWeek, endOfWeek, parseISO, format, subWeeks, addWeeks } from 'date-fns';
import { Plus, Utensils, Car, ShoppingBag, Zap, Receipt, Edit, Trash2, X, Calendar, ChevronLeft, ChevronRight, Search, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenseSummary, useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory } from '../../hooks/useExpenses';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useDebounce } from '../../hooks/useDebounce';

const categoryStyles = {
    'Food': { icon: Utensils, colorClass: 'bg-orange-100 text-orange-600' },
    'Transport': { icon: Car, colorClass: 'bg-blue-100 text-blue-600' },
    'Shopping': { icon: ShoppingBag, colorClass: 'bg-pink-100 text-pink-600' },
    'Bills': { icon: Zap, colorClass: 'bg-emerald-100 text-emerald-600' }
};

// Helper function to capitalize each word
const capitalizeWords = (str) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ExpensesPage() {
    // Initial filter states
    const initialDateFrom = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const initialDateTo = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const initialSearchTerm = '';
    const initialFilterCategory = 'All';

    // Filter States
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [filterCategory, setFilterCategory] = useState(initialFilterCategory);
    const debouncedSearch = useDebounce(searchTerm, 400);

    const [page, setPage] = useState(1);
    const pageSize = 1000;

    const { data: { expenses = [], totalCount = 0, totalSum = 0 } = {}, isLoading } = useExpenses({
        startDate: dateFrom, 
        endDate: dateTo,
        page: 1,
        pageSize,
        searchTerm: debouncedSearch,
        category: filterCategory
    });
    const { data: summary } = useExpenseSummary();
    const { data: categories = [] } = useExpenseCategories();
    const { data: salesSummary } = useSalesSummary({
        startDate: dateFrom ? parseISO(dateFrom) : undefined,
        endDate: dateTo ? parseISO(dateTo) : undefined
    });

    const currentWeekSales = useMemo(() => {
        if (!salesSummary?.weeklyRevenue) return 0;
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        const weekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        return (salesSummary.weeklyRevenue[weekKey] || 0) - (summary?.weeklyTotal || 0);
    }, [salesSummary, summary]);

    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();
    const createCategory = useCreateExpenseCategory();
    const updateCategory = useUpdateExpenseCategory();
    const addToast = useStore((state) => state.addToast);

    // Form States
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [editingExpense, setEditingExpense] = useState(null);

    // Custom Category States
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [catForm, setCatForm] = useState({ id: null, name: '', default_amount: '', default_description: '' });

    const handleCategoryChange = (val) => {
        if (val === 'ADD_NEW') {
            setCatForm({ id: null, name: '', default_amount: '', default_description: '' });
            setShowCategoryModal(true);
            return;
        }
        setCategory(val);
        const selectedCat = categories.find(c => c.name === val);
        if (selectedCat) {
            setAmount(selectedCat.default_amount ? selectedCat.default_amount.toString() : '');
            setDescription(selectedCat.default_description || '');
        }
    };

    const handleSaveCategory = async () => {
        const { id, name, default_amount, default_description } = catForm;
        if (!name.trim()) return;

        const capitalizedName = capitalizeWords(name);
        const capitalizedDescription = capitalizeWords(default_description);

        try {
            if (id) {
                await updateCategory.mutateAsync({ id, name: capitalizedName, default_amount, default_description: capitalizedDescription });
                addToast({ title: 'Success', message: 'Category updated.', type: 'success' });
            } else {
                if (categories.some(c => c.name.toLowerCase() === capitalizedName.toLowerCase())) {
                    addToast({ title: 'Error', message: 'Category already exists.', type: 'error' });
                    return;
                }
                await createCategory.mutateAsync({ name: capitalizedName, default_amount, default_description: capitalizedDescription });
                addToast({ title: 'Success', message: 'Category created.', type: 'success' });
            }
            setCategory(capitalizedName);
            setAmount(default_amount ? default_amount.toString() : '');
            setDescription(capitalizedDescription || '');
            setShowCategoryModal(false);
        } catch (error) {
            addToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleEditCategory = () => {
        const selectedCat = categories.find(c => c.name === category);
        if (selectedCat) {
            setCatForm({
                id: selectedCat.id,
                name: selectedCat.name,
                default_amount: selectedCat.default_amount || '',
                default_description: selectedCat.default_description || ''
            });
            setShowCategoryModal(true);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description || !category || !expenseDate) return;

        const capitalizedDescription = capitalizeWords(description);

        try {
            if (editingExpense) {
                await updateExpense.mutateAsync({
                    id: editingExpense.id,
                    amount,
                    category,
                    description: capitalizedDescription,
                    expense_date: expenseDate
                });
                setEditingExpense(null);
                addToast({ title: 'Expense Updated', message: 'Transaction updated.', type: 'success' });
            } else {
                await createExpense.mutateAsync({ amount, category, description: capitalizedDescription, expense_date: expenseDate });
                addToast({ title: 'Expense Added', message: 'Transaction saved.', type: 'success' });
            }
            setAmount('');
            setDescription('');
            setExpenseDate('');
            setCategory('');
        } catch (error) {
            addToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleEditClick = (exp) => {
        setEditingExpense(exp);
        setAmount(exp.amount);
        setCategory(exp.category);
        setDescription(exp.description);
        setExpenseDate(format(parseISO(exp.expense_date), 'yyyy-MM-dd'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteExpense.mutateAsync(id);
                addToast({ title: 'Deleted', message: 'Expense removed.', type: 'success' });
            } catch (error) {
                addToast({ title: 'Error', message: error.message, type: 'error' });
            }
        }
    };

    const cancelEdit = () => {
        setEditingExpense(null);
        setAmount('');
        setDescription('');
        setExpenseDate('');
        setCategory('');
    };

    const handleNextPage = () => {
        setPage(prev => prev + 1);
        const newFrom = format(subWeeks(parseISO(dateFrom), 1), 'yyyy-MM-dd');
        const newTo = format(subWeeks(parseISO(dateTo), 1), 'yyyy-MM-dd');
        setDateFrom(newFrom);
        setDateTo(newTo);
        const listContainer = document.querySelector('.overflow-y-auto');
        if (listContainer) listContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrevPage = () => {
        if (page <= 1) return;
        setPage(prev => prev - 1);
        const newFrom = format(addWeeks(parseISO(dateFrom), 1), 'yyyy-MM-dd');
        const newTo = format(addWeeks(parseISO(dateTo), 1), 'yyyy-MM-dd');
        setDateFrom(newFrom);
        setDateTo(newTo);
        const listContainer = document.querySelector('.overflow-y-auto');
        if (listContainer) listContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleResetFilters = () => {
        setDateFrom(initialDateFrom);
        setDateTo(initialDateTo);
        setSearchTerm(initialSearchTerm);
        setFilterCategory(initialFilterCategory);
        setPage(1); // Reset page to 1 when filters are reset
    };

    return (
        <div className="responsive-page min-h-screen bg-slate-100">
            <div className="w-full max-w-7xl mx-auto bg-white shadow-xl flex flex-col lg:flex-row rounded-3xl border border-gray-200 overflow-hidden">

                {/* Dashboard Panel */}
                <div className="w-full lg:w-7/12 flex flex-col bg-slate-50">
                    <div className="bg-white text-gray-800 p-8 rounded-br-[3rem] shadow-md z-10">
                        {/* Modified Header with Current Week Sales included */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt /> Expenses</h1>
                                <p className="text-xs text-gray-400 mt-1">Created on: {new Date().toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Current Week Sales</p>
                                <p className="text-xl font-bold" style={{ color: currentWeekSales >= 0 ? '#8DB600' : '#dc2626' }}>
                                    {currentWeekSales >= 0 ? '+' : ''}{currency(currentWeekSales, { symbol: '₱' }).format()}
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm font-medium">This Week's Total</p>
                        <h2 className="text-5xl font-extrabold mb-4 text-primary">{currency(summary?.weeklyTotal || 0, { symbol: '₱' }).format()}</h2>
                        <div className="flex gap-12 border-t border-gray-200 pt-4">
                            <div><p className="text-xs uppercase font-semibold text-gray-500">Monthly</p><p className="text-lg font-bold">{currency(summary?.monthlyTotal || 0, { symbol: '₱' }).format()}&nbsp;&nbsp;&nbsp;&nbsp;</p></div>
                            <div><p className="text-xs uppercase font-semibold text-gray-500">All Time</p><p className="text-lg font-bold">{currency(summary?.grandTotal || 0, { symbol:'₱' }).format()}</p></div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Quick Add Section */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{editingExpense ? 'Edit Expense' : 'Quick Add'}</h3>
                            {editingExpense && (
                                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-medium">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleManualSubmit} className={`${editingExpense ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'} p-4 rounded-3xl border shadow-sm mb-6 transition-colors`}>
                            <div className="flex flex-col sm:flex-row gap-3 mb-3 items-stretch">
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₱0.00" required step="0.01" className="input flex-[1]" />

                                <div className="flex-[1] flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1">Date</span>
                                    <input 
                                        type="date" 
                                        value={expenseDate} 
                                        onChange={(e) => setExpenseDate(e.target.value)} 
                                        required 
                                        className="input" 
                                    />
                                </div>

                                {/* Category Input / Toggle */}
                                <div className="flex-[1.5] flex gap-2">
                                    <select
                                        value={category}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="input w-full h-full cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        {categories.length === 0 && <option value="Food">Food</option>}
                                        <option disabled>──────────</option>
                                        <option value="ADD_NEW" className="font-bold text-primary">➕ Add New Category</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleEditCategory}
                                        className="btn bg-gray-100 text-gray-500 hover:bg-gray-200 p-2 shrink-0"
                                        title="Edit Category Defaults"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>

                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you buy?" required className="input flex-[2]" />
                                <button type="submit" disabled={createExpense.isPending || updateExpense.isPending} className="btn btn--primary flex-1 flex justify-center items-center gap-2">
                                    {createExpense.isPending || updateExpense.isPending ? '...' : (editingExpense ? 'Update' : 'Add')} {editingExpense ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>

                        {/* Filter Section */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-gray-500 font-bold">
                                    <Calendar className="w-5 h-5 text-primary" /> Filter & Search
                                </div>
                                <button
                                    onClick={handleResetFilters}
                                    className="btn bg-gray-200 text-gray-600 hover:bg-gray-300 text-sm px-3 py-2 flex items-center gap-1 rounded-lg"
                                >
                                    <RotateCcw className="w-4 h-4" /> Reset
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1">Search Description</span>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={searchTerm} 
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search expenses..."
                                            className="input text-sm pl-10 h-10 w-full" 
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1">Category</span>
                                    <select 
                                        value={filterCategory} 
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="input text-sm h-10 w-full cursor-pointer"
                                    >
                                        <option value="All">All Categories</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1">From</span>
                                    <input 
                                        type="date" 
                                        value={dateFrom} 
                                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                        className="input text-sm h-10 w-full" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1">To</span>
                                    <input 
                                        type="date" 
                                        value={dateTo} 
                                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                        className="input text-sm h-10 w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Panel */}
                <div className="w-full lg:w-5/12 bg-white flex flex-col p-6 lg:border-l border-gray-100 h-full min-h-[600px] lg:h-auto">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">List of Expenses</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Filtered Total:</span>
                                <span className="text-sm font-semibold text-red-500">
                                    {currency(totalSum, { symbol: '₱' }).format()}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400 pb-1">{totalCount} total</span>
                    </div>

                    <div className="flex-1 space-y-2 mb-8">
                        {isLoading ? <p className="text-center py-4">Loading...</p> : expenses.map((exp) => {
                            // Fallback if custom category doesn't exist in styles object
                            const style = categoryStyles[exp.category] || { icon: Receipt, colorClass: 'bg-slate-100 text-slate-600' };
                            const Icon = style.icon;
                            return (
                                <div key={exp.id} className={`flex justify-between items-center p-3 hover:bg-gray-50 bg-white rounded-xl border transition-colors ${editingExpense?.id === exp.id ? 'border-primary ring-1 ring-primary' : 'border-gray-300'}`}>
                                    <div className="flex items-center gap-3 flex-1 pr-3 border-r border-gray-300">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.colorClass}`}><Icon className="w-5 h-5" /></div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800 text-sm">{exp.description}</span>
                                            <span className="text-xs font-medium text-gray-500">
                                                {exp.category} &bull; {format(parseISO(exp.expense_date), 'EEEE, MMM d, yyyy')}
                                                {exp.users?.name && <span className="ml-1 text-primary font-bold italic opacity-70">by {exp.users.name}</span>}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end pl-3 min-w-[120px]">
                                        <span className="font-bold text-red-500">-{currency(exp.amount, { symbol: '₱' }).format()}</span>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => handleEditClick(exp)}
                                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(exp.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
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

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 1}
                            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Page {page}</span>
                            <span className="text-xs font-bold text-gray-600">Week of {format(parseISO(dateFrom), 'MMM d')}</span>
                        </div>
                        <button
                            onClick={handleNextPage}
                            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-gray-900">{catForm.id ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Category Name</label>
                                <input
                                    type="text"
                                    value={catForm.name}
                                    onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Fuel, Maintenance"
                                    className="input w-full"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Default Amount</label>
                                    <input
                                        type="number"
                                        value={catForm.default_amount}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, default_amount: e.target.value }))}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Default Description</label>
                                    <input
                                        type="text"
                                        value={catForm.default_description}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, default_description: e.target.value }))}
                                        placeholder="e.g. Weekly Fuel Refill"
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="btn flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                disabled={createCategory.isPending || updateCategory.isPending || !catForm.name.trim()}
                                className="btn btn--primary flex-1 font-bold shadow-lg shadow-primary/20"
                            >
                                {createCategory.isPending || updateCategory.isPending ? 'Saving...' : 'Save Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
