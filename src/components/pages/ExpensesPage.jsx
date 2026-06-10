// Created on Sunday, April 20, 2026
    import React, { useState, useMemo, useEffect, useRef } from 'react';
    import Link from 'next/link';
    import currency from 'currency.js';
    import { startOfWeek, endOfWeek, parseISO, format, subWeeks, addWeeks, getDay, startOfToday } from 'date-fns';
    import { Plus, Utensils, Car, ShoppingBag, Zap, Receipt, Edit, Trash2, X, Calendar, ChevronLeft, ChevronRight, Search, RotateCcw, XCircle, AlertTriangle, Star, Layers, Clock } from 'lucide-react';
    import { useStore } from '../../store/useStore';
    import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenseSummary, useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory } from '../../hooks/useExpenses';
    import { useSalesSummary } from '../../hooks/useSalesSummary';
    import { useDebounce } from '../../hooks/useDebounce';
    import { useQueryClient } from '@tanstack/react-query';
    import { supabase } from '../../lib/supabaseClient';

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
        const queryClient = useQueryClient();
        const { user } = useStore(s => ({ user: s.user }));
        const isDemo = user?.isDemo;
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
        const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM')); // NEW STATE
        const [groupBy, setGroupBy] = useState('date'); // 'date', 'category'
        const debouncedSearch = useDebounce(searchTerm, 400);

        const [page, setPage] = useState(1);
        const pageSize = 1000;

        const { 
            data: { expenses = [], totalCount = 0, totalSum = 0 } = {}, 
            isLoading,
            isFetching 
        } = useExpenses({
            startDate: dateFrom,
            endDate: dateTo,
            page: 1,
            pageSize,
            searchTerm: debouncedSearch,
            category: filterCategory
        });
        const { data: summary } = useExpenseSummary(dateFrom, dateTo, selectedMonth);
        const { data: categories = [] } = useExpenseCategories();
        const { data: salesSummary } = useSalesSummary({
            startDate: dateFrom ? parseISO(dateFrom) : undefined,
            endDate: dateTo ? parseISO(dateTo) : undefined
        });

        const currentWeekSales = useMemo(() => {
            if (!salesSummary?.weeklyRevenue) return 0;

            const weekKey = dateFrom;
            const weeklySales = salesSummary.weeklyRevenue[weekKey] || 0;

            return weeklySales - (totalSum || 0);
        }, [salesSummary, dateFrom, totalSum]);

        const groupedExpenses = useMemo(() => {
            if (groupBy === 'none') {
                return { 'All Expenses': expenses };
            }
        
            const sortedExpenses = [...expenses].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
        
            if (groupBy === 'category') {
                return sortedExpenses.reduce((acc, exp) => {
                    const key = exp.category || 'Uncategorized';
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(exp);
                    return acc;
                }, {});
            }
        
            if (groupBy === 'date') {
                return sortedExpenses.reduce((acc, exp) => {
                    const key = format(parseISO(exp.expense_date), 'MMMM d, yyyy');
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(exp);
                    return acc;
                }, {});
            }
        
            return {};
        }, [expenses, groupBy]);

        const createExpense = useCreateExpense();
        const updateExpense = useUpdateExpense();
        const deleteExpense = useDeleteExpense();
        const createCategory = useCreateExpenseCategory();
        const updateCategory = useUpdateExpenseCategory();
        const addToast = useStore((state) => state.addToast);

        // Form States
        const [amount, setAmount] = useState('');
        const [category, setCategory] = useState('');
        const [description, setDescription] = useState('Payment for ');
        const [expenseDate, setExpenseDate] = useState('');
        const [editingExpense, setEditingExpense] = useState(null);

        // Custom Category States
        const [showCategoryModal, setShowCategoryModal] = useState(false);
        const [catForm, setCatForm] = useState({ id: null, name: '', default_amount: '', default_description: '', is_recurring: false, is_recurring_daily: false });

        // State for skip reason modal
        const [reasonModal, setReasonModal] = useState({ show: false, expense: null });
        const [reasonText, setReasonText] = useState('');

        // Optimistic locking ref
        const isSyncing = useRef(false);

        // AUTO-SYNC DAILY EXPENSES EFFECT
        useEffect(() => {
            const syncDailyExpenses = async () => {
                const today = new Date();
                if (!categories.length || !user || user.isDemo || isSyncing.current || isFetching) return;

                const todayStr = format(today, 'yyyy-MM-dd');
                isSyncing.current = true;

                try {
                    const recurringDailyCategories = categories.filter(cat => cat.is_recurring_daily);
                    if (recurringDailyCategories.length === 0) {
                        isSyncing.current = false;
                        return;
                    }

                    const { data: existing, error } = await supabase
                        .from('expenses')
                        .select('category')
                        .eq('expense_date', todayStr);

                    if (error) throw error;

                    const existingCategoryNames = existing?.map(e => e.category) || [];
                    const missingCategories = recurringDailyCategories.filter(
                        cat => !existingCategoryNames.includes(cat.name)
                    );

                    if (missingCategories.length > 0) {
                        const insertPromises = missingCategories.map(cat => 
                            createExpense.mutateAsync({
                                amount: cat.default_amount || 0,
                                category: cat.name,
                                description: cat.default_description || `Daily ${cat.name}`,
                                expense_date: todayStr
                            })
                        );

                        await Promise.all(insertPromises);
                        
                        queryClient.invalidateQueries({ queryKey: ['expenses'] });
                        queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
                        
                        addToast({ 
                            title: 'Daily Sync', 
                            message: `Automatically synced ${missingCategories.length} recurring daily expenses.`, 
                            type: 'success' 
                        });
                    }
                } catch (err) {
                    console.error("Auto-daily-expense sync failed:", err);
                } finally {
                    setTimeout(() => {
                        isSyncing.current = false;
                    }, 2000);
                }
            };

            syncDailyExpenses();
        }, [categories, user, isFetching, createExpense, queryClient, addToast]);

        // AUTO-SYNC WEEKLY EXPENSES EFFECT
        useEffect(() => {
            const syncWeeklyExpenses = async () => {
                const today = new Date();
                if (getDay(today) !== 1) return;

                if (!categories.length || !user || user.isDemo || isSyncing.current || isFetching) return;

                const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
                const mondayStr = format(currentMonday, 'yyyy-MM-dd');

                isSyncing.current = true;

                try {
                    const recurringCategories = categories.filter(cat => cat.is_recurring);
                    if (recurringCategories.length === 0) {
                        isSyncing.current = false;
                        return;
                    }

                    const { data: existing, error } = await supabase
                        .from('expenses')
                        .select('category')
                        .eq('expense_date', mondayStr);

                    if (error) throw error;

                    const existingCategoryNames = existing?.map(e => e.category) || [];
                    const missingCategories = recurringCategories.filter(
                        cat => !existingCategoryNames.includes(cat.name)
                    );

                    if (missingCategories.length > 0) {
                        const insertPromises = missingCategories.map(cat => 
                            createExpense.mutateAsync({
                                amount: cat.default_amount || 0,
                                category: cat.name,
                                description: cat.default_description || `Weekly ${cat.name}`,
                                expense_date: mondayStr
                            })
                        );

                        await Promise.all(insertPromises);
                        
                        queryClient.invalidateQueries({ queryKey: ['expenses'] });
                        queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
                        
                        addToast({ 
                            title: 'Weekly Sync', 
                            message: `Automatically synced ${missingCategories.length} recurring expenses.`, 
                            type: 'success' 
                        });
                    }
                } catch (err) {
                    console.error("Auto-expense sync failed:", err);
                } finally {
                    setTimeout(() => {
                        isSyncing.current = false;
                    }, 2000);
                }
            };

            syncWeeklyExpenses();

        }, [categories, user, expenses, isFetching, createExpense, queryClient, addToast]);

        const handleCategoryChange = (val) => {
            if (val === 'ADD_NEW') {
                setCatForm({ id: null, name: '', default_amount: '', default_description: '', is_recurring: false, is_recurring_daily: false });
                setShowCategoryModal(true);
                return;
            }
            setCategory(val);
            const selectedCat = categories.find(c => c.name === val);
            if (selectedCat) {
                setAmount(selectedCat.default_amount ? selectedCat.default_amount.toString() : '');
                setDescription(selectedCat.default_description || 'Payment for ');
            }
        };

        const handleSaveCategory = async () => {
            const { id, name, default_amount, default_description, is_recurring, is_recurring_daily } = catForm;
            if (!name.trim()) return;

            const capitalizedName = capitalizeWords(name);
            const capitalizedDescription = capitalizeWords(default_description);

            try {
                if (id) {
                    await updateCategory.mutateAsync({ id, name: capitalizedName, default_amount, default_description: capitalizedDescription, is_recurring, is_recurring_daily });
                    addToast({ title: 'Success', message: 'Category updated.', type: 'success' });
                } else {
                    if (categories.some(c => c.name.toLowerCase() === capitalizedName.toLowerCase())) {
                        addToast({ title: 'Error', message: 'Category already exists.', type: 'error' });
                        return;
                    }
                    await createCategory.mutateAsync({ name: capitalizedName, default_amount, default_description: capitalizedDescription, is_recurring, is_recurring_daily });
                    addToast({ title: 'Success', message: 'Category created.', type: 'success' });
                }
                setCategory(capitalizedName);
                setAmount(default_amount ? default_amount.toString() : '');
                setDescription(capitalizedDescription || 'Payment for ');
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
                    default_description: selectedCat.default_description || '',
                    is_recurring: selectedCat.is_recurring || false,
                    is_recurring_daily: selectedCat.is_recurring_daily || false
                });
                setShowCategoryModal(true);
            }
        };

        const handleManualSubmit = async (e) => {
            e.preventDefault();
            if (!amount || !description || !category || !expenseDate) return;
        
            const capitalizedDescription = capitalizeWords(description);
        
            // Combine the selected date with the current time
            const now = new Date();
            const [year, month, day] = expenseDate.split('-').map(Number);
            const combinedDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
        
            try {
                if (editingExpense) {
                    await updateExpense.mutateAsync({
                        id: editingExpense.id,
                        amount,
                        category,
                        description: capitalizedDescription,
                        expense_date: combinedDateTime.toISOString() // Pass ISO string
                    });
                    setEditingExpense(null);
                    addToast({ title: 'Expense Updated', message: 'Transaction updated.', type: 'success' });
                } else {
                    await createExpense.mutateAsync({
                        amount,
                        category,
                        description: capitalizedDescription,
                        expense_date: combinedDateTime.toISOString() // Pass ISO string
                    });
                    addToast({ title: 'Expense Added', message: 'Transaction saved.', type: 'success' });
                }
                setAmount('');
                setDescription('Payment for ');
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

        const handleConfirmSkip = async () => {
            if (!reasonText.trim() || !reasonModal.expense) return;

            try {
                await updateExpense.mutateAsync({
                    id: reasonModal.expense.id,
                    amount: 0,
                    category: reasonModal.expense.category,
                    description: `[SKIPPED] ${reasonText} (Was: ${reasonModal.expense.description})`,
                    expense_date: reasonModal.expense.expense_date
                });
                
                addToast({ 
                    title: 'Item Skipped', 
                    message: 'Recurring item voided for this week.', 
                    type: 'success' 
                });
                setReasonModal({ show: false, expense: null });
                setReasonText('');
            } catch (error) {
                addToast({ title: 'Error', message: error.message, type: 'error' });
            }
        };

        const cancelEdit = () => {
            setEditingExpense(null);
            setAmount('');
            setDescription('Payment for ');
            setExpenseDate('');
            setCategory('');
        };

        const handleNextPage = () => {
            setPage(prev => prev + 1);
            const newFrom = format(subWeeks(parseISO(dateFrom), 1), 'yyyy-MM-dd');
            const newTo = format(subWeeks(parseISO(dateTo), 1), 'yyyy-MM-dd');
            setDateFrom(newFrom);
            setDateTo(newTo);
        };

        const handlePrevPage = () => {
            if (page <= 1) return;
            setPage(prev => prev - 1);
            const newFrom = format(addWeeks(parseISO(dateFrom), 1), 'yyyy-MM-dd');
            const newTo = format(addWeeks(parseISO(dateTo), 1), 'yyyy-MM-dd');
            setDateFrom(newFrom);
            setDateTo(newTo);
        };

        const handleResetFilters = () => {
            setDateFrom(initialDateFrom);
            setDateTo(initialDateTo);
            setSearchTerm(initialSearchTerm);
            setFilterCategory(initialFilterCategory);
            setPage(1); // Reset page to 1 when filters are reset
        };

        return (
            <div className="responsive-page min-h-screen bg-background">
                <div className="w-full max-w-7xl mx-auto bg-surface shadow-xl flex flex-col lg:flex-row rounded-3xl border-transparent overflow-hidden">

                    {/* Dashboard Panel */}
                    <div className="w-full lg:w-7/12 flex flex-col bg-surface">
                        <div className="bg-surface text-text p-8 rounded-br-[3rem] shadow-md z-10">
                            {/* Modified Header with Current Week Sales included */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold flex items-center gap-2 text-text"><Receipt /> Expenses</h1>
                                    <p className="text-xs text-text-muted mt-1">Created on: April 19, 2026 Sunday</p>
                                </div>
                                <div className="text-right">
                                    <Link href="/incentives" className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors shadow-sm mb-2">
                                        <Star className="w-4 h-4" />
                                        <span>Incentives</span>
                                    </Link>
                                    <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Current Week Sales</p>
                                    <p className="text-xl font-bold" style={{ color: currentWeekSales >= 0 ? '#8DB600' : '#dc2626' }}>
                                        {currentWeekSales >= 0 ? '+' : ''}{currency(currentWeekSales, { symbol: '₱' }).format()}
                                    </p>
                                </div>
                            </div>

                            <p className="text-text-muted text-sm font-medium">Selected Period Total</p>
                            <h2 className="text-5xl font-extrabold mb-4 text-red-600">{currency(summary?.weeklyTotal || 0, { symbol: '₱' }).format()}</h2>
                            
                            <div className="flex gap-12 border-t-transparent pt-4 items-end">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-xs uppercase font-semibold text-text-muted">Monthly</p>
                                        <input 
                                            type="month" 
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="text-xs bg-background border border-gray-200 dark:border-gray-800 rounded px-2 py-1 text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <p className="text-lg font-bold text-text">{currency(summary?.monthlyTotal || 0, { symbol: '₱' }).format()}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-semibold text-text-muted mb-1 pb-[10px]">All Time (Since Apr 20)</p>
                                    <p className="text-lg font-bold text-text">{currency(summary?.grandTotal || 0, { symbol:'₱' }).format()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Quick Add Section */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-text">{editingExpense ? 'Edit Expense' : 'Quick Add'}</h3>
                                {editingExpense && (
                                    <button onClick={cancelEdit} className="text-text-muted hover:text-text flex items-center gap-1 text-sm font-medium">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleManualSubmit} className={`${editingExpense ? 'bg-amber-50 border-transparent' : 'bg-surface border-transparent'} p-4 rounded-3xl border-transparent shadow-sm mb-6 transition-colors`}>
                                <div className="flex flex-col sm:flex-row gap-3 mb-3 items-stretch">
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₱0.00" required step="0.01" className="input flex-[1]" disabled={isDemo} />

                                    <div className="flex-[1] flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Date</span>
                                        <input
                                            type="date"
                                            value={expenseDate}
                                            onChange={(e) => setExpenseDate(e.target.value)}
                                            required
                                            className="input"
                                            disabled={isDemo}
                                        />
                                    </div>

                                    {/* Category Input / Toggle */}
                                    <div className="flex-[1.5] flex gap-2">
                                        <select
                                            value={category}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="input w-full h-full cursor-pointer"
                                            required
                                            disabled={isDemo}
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
                                            className="btn bg-background text-text-muted hover:bg-border p-2 shrink-0"
                                            title="Edit Category Defaults"
                                            disabled={isDemo}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>

                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you buy?" required className="input flex-[2]" disabled={isDemo} />
                                    <button type="submit" disabled={createExpense.isPending || updateExpense.isPending || isDemo} className="btn btn--primary flex-1 flex justify-center items-center gap-2">
                                        {createExpense.isPending || updateExpense.isPending ? '...' : (editingExpense ? 'Update' : 'Add')} {editingExpense ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </button>
                                </div>
                            </form>

                            {/* Filter Section */}
                            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-transparent mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-text-muted font-bold">
                                        <Calendar className="w-5 h-5 text-primary" /> Filter & Search
                                    </div>
                                    <button
                                        onClick={handleResetFilters}
                                        className="btn bg-background text-text-muted hover:bg-border text-sm px-3 py-2 flex items-center gap-1 rounded-lg"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reset
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Search Description</span>
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
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
                                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Category</span>
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
                                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">From</span>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                            className="input text-sm h-10 w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">To</span>
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
                    <div className="w-full lg:w-5/12 bg-surface flex flex-col p-6 lg:border-l-transparent h-full">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-text">List of Expenses</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Filtered Total:</span>
                                    <span className="text-sm font-semibold text-red-600">
                                        {currency(totalSum, { symbol: '₱' }).format()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setGroupBy('date')} className={`p-1.5 rounded-md ${groupBy === 'date' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`} title="Group by Date">
                                    <Clock className="w-4 h-4" />
                                </button>
                                <button onClick={() => setGroupBy('category')} className={`p-1.5 rounded-md ${groupBy === 'category' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`} title="Group by Category">
                                    <Layers className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-medium text-text-muted pb-1">{totalCount} total</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 mb-8">
                            {isLoading ? <p className="text-center py-4 text-text-muted">Loading...</p> : 
                                Object.entries(groupedExpenses).map(([groupTitle, groupExpenses]) => (
                                    <div key={groupTitle}>
                                        <h4 className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-md my-3 sticky top-0 z-10">{groupTitle}</h4>
                                        {groupExpenses.map((exp, index) => {
                                            const style = categoryStyles[exp.category] || { icon: Receipt, colorClass: 'bg-background text-text-muted' };
                                            const Icon = style.icon;
                                            const categoryInfo = categories.find(c => c.name === exp.category);
                                            const isRecurring = categoryInfo?.is_recurring || categoryInfo?.is_recurring_daily;
                                            const isVoided = exp.amount === 0 || exp.amount === "0.00";
                                            return (
                                                <div key={exp.id}>
                                                    {index > 0 && <hr className="border-t border-gray-100 my-2 dark:border-gray-800" />}
                                                    <div className={`flex justify-between items-center p-3 hover:bg-background bg-surface rounded-xl border-transparent transition-colors ${editingExpense?.id === exp.id ? 'border-primary ring-1 ring-primary' : 'border-transparent'}`}>
                                                        <div className="flex items-center gap-3 flex-1 pr-3 border-r-transparent">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.colorClass}`}><Icon className="w-5 h-5" /></div>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-text text-sm">{exp.description}</span>
                                                                <span className="text-xs font-medium text-text-muted">
                                                                    {exp.category} &bull; {format(parseISO(exp.expense_date), 'MMM d, yyyy h:mm a')}
                                                                    <div className="inline-flex items-center space-x-2 font-semibold" style={{ color: exp.userColor }}>
                                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: exp.userColor }}></span>
                                                                        <span>{exp.staffName}</span>
                                                                    </div>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end pl-3 min-w-[120px]">
                                                            <span className={`font-bold ${isVoided ? 'text-text-muted line-through' : 'text-red-600'}`}>
                                                                -{currency(exp.amount, { symbol: '₱' }).format()}
                                                            </span>
                                                            <div className="flex gap-2 mt-1">
                                                                {!isVoided && (
                                                                    <button onClick={() => handleEditClick(exp)} className="p-1 text-text-muted expense-action-btn" title="Edit" disabled={isDemo}>
                                                                        <Edit className="w-3.5 h-3.5"/>
                                                                    </button>
                                                                )}
                                                                
                                                                <button onClick={() => handleDeleteClick(exp.id)} className="p-1 text-text-muted expense-action-btn" title="Delete" disabled={isDemo}>
                                                                    <Trash2 className="w-3.5 h-3.5"/>
                                                                </button>

                                                                {isRecurring && !isVoided && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setReasonModal({ show: true, expense: exp });
                                                                            setReasonText('');
                                                                        }}
                                                                        className="p-1 text-text-muted expense-action-btn"
                                                                        title="Skip/Void this recurring item"
                                                                        disabled={isDemo}
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5"/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            }

                            {!isLoading && expenses.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-text-muted font-medium">No expenses yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between border-t-transparent pt-4 mt-auto">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-text-muted">Page {page}</span>
                                <span className="text-xs font-bold text-text-muted">Week of {format(parseISO(dateFrom), 'MMM d')}</span>
                            </div>
                            <button
                                onClick={handleNextPage}
                                className="flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Management Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/60 z-[110] flex items-start justify-center p-4 sm:p-6 pt-[10vh]">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-base font-bold text-blue-800">
                                        {catForm.id ? 'Edit Category' : 'New Category'}
                                    </h2>
                                    <p className="text-blue-600 text-xs">Manage expense categories</p>
                                </div>
                                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Category Name</label>
                                    <input
                                        type="text"
                                        value={catForm.name}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Fuel, Maintenance"
                                        className="input w-full h-10 text-sm"
                                        autoFocus
                                        disabled={isDemo}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Default Amount</label>
                                        <input
                                            type="number"
                                            value={catForm.default_amount}
                                            onChange={(e) => setCatForm(prev => ({ ...prev, default_amount: e.target.value }))}
                                            placeholder="0.00"
                                            step="0.01"
                                            className="input w-full h-10 text-sm"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Default Description</label>
                                        <input
                                            type="text"
                                            value={catForm.default_description}
                                            onChange={(e) => setCatForm(prev => ({ ...prev, default_description: e.target.value }))}
                                            placeholder="e.g. Weekly Fuel Refill"
                                            className="input w-full h-10 text-sm"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_recurring"
                                            checked={catForm.is_recurring}
                                            onChange={(e) => setCatForm(prev => ({ ...prev, is_recurring: e.target.checked, is_recurring_daily: e.target.checked ? false : prev.is_recurring_daily }))}
                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                            disabled={isDemo}
                                        />
                                        <label htmlFor="is_recurring" className="text-sm font-medium text-gray-800">
                                            Auto-add every Monday
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_recurring_daily"
                                            checked={catForm.is_recurring_daily}
                                            onChange={(e) => setCatForm(prev => ({ ...prev, is_recurring_daily: e.target.checked, is_recurring: e.target.checked ? false : prev.is_recurring }))}
                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                            disabled={isDemo}
                                        />
                                        <label htmlFor="is_recurring_daily" className="text-sm font-medium text-gray-800">
                                            Auto-add everyday
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => setShowCategoryModal(false)}
                                        className="btn flex-1 h-10 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveCategory}
                                        disabled={createCategory.isPending || updateCategory.isPending || !catForm.name.trim() || isDemo}
                                        className="btn btn--primary flex-1 h-10 text-sm"
                                    >
                                        {createCategory.isPending || updateCategory.isPending ? 'Saving...' : 'Save Category'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {reasonModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <AlertTriangle className="w-6 h-6"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-orange-900">Skip Recurring Entry</h3>
                                <p className="text-xs text-orange-700">This will void the item for this week.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-text-muted font-medium italic">
                                "{reasonModal.expense?.description}"
                            </p>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">
                                    Reason for skipping
                                </label>
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    placeholder="e.g. Supplier out of stock, already paid last week..."
                                    className="input w-full min-h-[100px] resize-none py-3 text-sm"
                                    autoFocus
                                    disabled={isDemo}
                                 />
                            </div>
                        </div>
                        <div className="p-4 bg-background flex gap-3">
                            <button 
                                onClick={() => setReasonModal({ show: false, expense: null })}
                                className="btn flex-1 bg-surface text-text-muted font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSkip}
                                disabled={!reasonText.trim() || isDemo}
                                className="btn flex-1 bg-orange-600 text-white font-bold disabled:opacity-50"
                            >
                                Skip Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    }