import React, { useState, useMemo, useEffect, useRef } from 'react';
import currency from 'currency.js';
import { startOfWeek, endOfWeek, parseISO, format, subWeeks, addWeeks, subDays, addDays } from 'date-fns';
import { Utensils, Car, ShoppingBag, Zap, Receipt } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenseSummary, useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory } from '../../hooks/useExpenses';
import { useEmployees } from '../../hooks/useEmployees';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useDebounce } from '../../hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

// Extracted Components
import ExpenseForm from '../expenses/ExpenseForm';
import ExpenseFilters from '../expenses/ExpenseFilters';
import ExpenseList from '../expenses/ExpenseList';
import ExpenseModals from '../expenses/ExpenseModals';

const categoryStyles = {
    'Food': { icon: Utensils, colorClass: 'bg-orange-100 text-orange-600' },
    'Transport': { icon: Car, colorClass: 'bg-blue-100 text-blue-600' },
    'Shopping': { icon: ShoppingBag, colorClass: 'bg-pink-100 text-pink-600' },
    'Bills': { icon: Zap, colorClass: 'bg-emerald-100 text-emerald-600' }
};

const capitalizeWords = (str) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const { user } = useStore(s => ({ user: s.user }));
    const isDemo = user?.isDemo;

    const initialDateFrom = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const initialDateTo = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const initialSearchTerm = '';
    const initialFilterCategory = 'All';
    const initialFilterEmployee = 'all';

    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [filterCategory, setFilterCategory] = useState(initialFilterCategory);
    const [filterEmployee, setFilterEmployee] = useState(initialFilterEmployee);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [groupBy, setGroupBy] = useState('date');
    const debouncedSearch = useDebounce(searchTerm, 400);

    const [page, setPage] = useState(1);
    const pageSize = 1000;

    const { data: employees } = useEmployees();

    const fetchStart = dateFrom ? format(subDays(parseISO(dateFrom), 1), 'yyyy-MM-dd') : undefined;
    const fetchEnd = dateTo ? format(addDays(parseISO(dateTo), 1), 'yyyy-MM-dd') : undefined;

    const {
        data: { expenses = [] } = {},
        isLoading,
        isFetching
    } = useExpenses({
        startDate: fetchStart,
        endDate: fetchEnd,
        page: 1,
        pageSize,
        searchTerm: debouncedSearch,
        category: filterCategory,
        employeeName: filterEmployee
    });

    const { data: summary } = useExpenseSummary(fetchStart, fetchEnd, selectedMonth);
    const { data: categories = [] } = useExpenseCategories();

    const { data: salesSummary } = useSalesSummary({
        startDate: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
        endDate: dateTo ? new Date(`${dateTo}T23:59:59.999`) : undefined
    });

    const { validExpenses, localTotalSum, localTotalCount } = useMemo(() => {
        if (!expenses || expenses.length === 0) return { validExpenses: [], localTotalSum: 0, localTotalCount: 0 };

        const start = new Date(`${dateFrom}T00:00:00`);
        const end = new Date(`${dateTo}T23:59:59.999`);

        const valid = expenses.filter(exp => {
            const expDate = parseISO(exp.expense_date);
            return expDate >= start && expDate <= end;
        });

        const sum = valid.reduce((acc, exp) => acc + Number(exp.amount), 0);

        return { validExpenses: valid, localTotalSum: sum, localTotalCount: valid.length };
    }, [expenses, dateFrom, dateTo]);

    const currentWeekSales = useMemo(() => {
        if (!salesSummary) return 0;
        const periodSales = salesSummary.totalRevenue || 0;
        return periodSales - localTotalSum;
    }, [salesSummary, localTotalSum]);

    const groupedExpenses = useMemo(() => {
        if (groupBy === 'none') return { 'All Expenses': validExpenses };

        const sortedExpenses = [...validExpenses].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

        if (groupBy === 'category') {
            return sortedExpenses.reduce((acc, exp) => {
                const key = exp.category || 'Uncategorized';
                if (!acc[key]) acc[key] = [];
                acc[key].push(exp);
                return acc;
            }, {});
        }

        if (groupBy === 'date') {
            return sortedExpenses.reduce((acc, exp) => {
                const key = format(parseISO(exp.expense_date), 'EEE, MMMM d, yyyy');
                if (!acc[key]) acc[key] = [];
                acc[key].push(exp);
                return acc;
            }, {});
        }

        return {};
    }, [validExpenses, groupBy]);

    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();
    const createCategory = useCreateExpenseCategory();
    const updateCategory = useUpdateExpenseCategory();
    const addToast = useStore((state) => state.addToast);

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('Payment for ');
    const [expenseDate, setExpenseDate] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [editingExpense, setEditingExpense] = useState(null);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [catForm, setCatForm] = useState({ id: null, name: '', default_amount: '', default_description: '', is_recurring: false, is_recurring_daily: false });

    const [reasonModal, setReasonModal] = useState({ show: false, expense: null });
    const [reasonText, setReasonText] = useState('');

    const isSyncing = useRef(false);

    useEffect(() => {
        const syncExpenses = async () => {
            const today = new Date();
            if (!categories.length || !user || user.isDemo || isSyncing.current || isFetching) return;

            isSyncing.current = true;

            try {
                const todayStr = format(today, 'yyyy-MM-dd');
                const recurringDailyCategories = categories.filter(cat => cat.is_recurring_daily);
                let dailyCount = 0;

                if (recurringDailyCategories.length > 0) {
                    const { data: existingDaily, error: dailyError } = await supabase
                        .from('expenses')
                        .select('category')
                        .eq('expense_date', todayStr);

                    if (dailyError) throw dailyError;

                    const existingDailyNames = existingDaily?.map(e => e.category) || [];
                    const missingDaily = recurringDailyCategories.filter(
                        cat => !existingDailyNames.includes(cat.name)
                    );

                    if (missingDaily.length > 0) {
                        const insertDaily = missingDaily.map(cat =>
                            createExpense.mutateAsync({
                                amount: cat.default_amount || 0,
                                category: cat.name,
                                description: cat.default_description || `Daily ${cat.name}`,
                                expense_date: todayStr
                            })
                        );
                        await Promise.all(insertDaily);
                        dailyCount = missingDaily.length;
                    }
                }

                const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
                const mondayStr = format(currentMonday, 'yyyy-MM-dd');
                const recurringWeeklyCategories = categories.filter(cat => cat.is_recurring);
                let weeklyCount = 0;

                if (recurringWeeklyCategories.length > 0) {
                    const { data: existingWeekly, error: weeklyError } = await supabase
                        .from('expenses')
                        .select('category')
                        .eq('expense_date', mondayStr);

                    if (weeklyError) throw weeklyError;

                    const existingWeeklyNames = existingWeekly?.map(e => e.category) || [];
                    const missingWeekly = recurringWeeklyCategories.filter(
                        cat => !existingWeeklyNames.includes(cat.name)
                    );

                    if (missingWeekly.length > 0) {
                        const insertWeekly = missingWeekly.map(cat =>
                            createExpense.mutateAsync({
                                amount: cat.default_amount || 0,
                                category: cat.name,
                                description: cat.default_description || `Weekly ${cat.name}`,
                                expense_date: mondayStr
                            })
                        );
                        await Promise.all(insertWeekly);
                        weeklyCount = missingWeekly.length;
                    }
                }

                if (dailyCount > 0 || weeklyCount > 0) {
                    queryClient.invalidateQueries({ queryKey: ['expenses'] });
                    queryClient.invalidateQueries({ queryKey: ['expense-summary'] });

                    if (dailyCount > 0) {
                        addToast({ title: 'Daily Sync', message: `Automatically synced ${dailyCount} recurring daily expenses.`, type: 'success' });
                    }
                    if (weeklyCount > 0) {
                        addToast({ title: 'Weekly Sync', message: `Automatically synced ${weeklyCount} recurring expenses.`, type: 'success' });
                    }
                }
            } catch (err) {
                console.error("Auto-expense sync failed:", err);
            } finally {
                setTimeout(() => { isSyncing.current = false; }, 2000);
            }
        };

        syncExpenses();
    }, [categories, user, isFetching, createExpense, queryClient, addToast, expenses]);

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

        const now = new Date();
        const [year, month, day] = expenseDate.split('-').map(Number);
        const combinedDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

        const localISOString = format(combinedDateTime, "yyyy-MM-dd'T'HH:mm:ss");

        try {
            if (editingExpense) {
                await updateExpense.mutateAsync({
                    id: editingExpense.id,
                    amount,
                    category,
                    description: capitalizedDescription,
                    expense_date: localISOString,
                    employee_name: category === 'Salary' ? employeeName : null
                });
                setEditingExpense(null);
                addToast({ title: 'Expense Updated', message: 'Transaction updated.', type: 'success' });
            } else {
                await createExpense.mutateAsync({
                    amount,
                    category,
                    description: capitalizedDescription,
                    expense_date: localISOString,
                    employee_name: category === 'Salary' ? employeeName : null
                });
                addToast({ title: 'Expense Added', message: 'Transaction saved.', type: 'success' });
            }
            setAmount('');
            setDescription('Payment for ');
            setExpenseDate('');
            setCategory('');
            setEmployeeName('');
        } catch (error) {
            addToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleEditClick = (exp) => {
        setEditingExpense(exp);
        setAmount(exp.amount);
        setCategory(exp.category);
        setDescription(exp.description);
        setEmployeeName(exp.employee_name || '');
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

            addToast({ title: 'Item Skipped', message: 'Recurring item voided for this week.', type: 'success' });
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
        setEmployeeName('');
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
        setFilterEmployee(initialFilterEmployee);
        setPage(1);
    };

    return (
        <div className="responsive-page min-h-screen bg-background">
            <div className="w-full max-w-7xl mx-auto bg-surface shadow-xl flex flex-col lg:flex-row rounded-3xl border-transparent overflow-hidden">
                <div className="w-full lg:w-7/12 flex flex-col bg-surface">
                    <div className="bg-surface text-text p-8 rounded-br-[3rem] shadow-md z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2 text-text"><Receipt /> Expenses</h1>
                                <p className="text-xs text-text-muted mt-1">Created on: April 19, 2026 Sunday</p>
                            </div>
                            <div className="text-right">
                                <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">
                                    {dateFrom === initialDateFrom ? 'Current Week Gross' : 'Selected Week Gross'}
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                    {currency(salesSummary?.totalRevenue || 0, { symbol: '₱' }).format()}
                                </p>
                                <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-2">
                                    {dateFrom === initialDateFrom ? 'Current Week Net' : 'Selected Week Net'}
                                </p>
                                <p className="text-xl font-bold" style={{ color: currentWeekSales >= 0 ? '#8DB600' : '#dc2626' }}>
                                    {currentWeekSales >= 0 ? '+' : ''}{currency(currentWeekSales, { symbol: '₱' }).format()}
                                </p>
                            </div>
                        </div>

                        <p className="text-text-muted text-sm font-medium">Selected Period Total</p>
                        <h2 className="text-5xl font-extrabold mb-4 text-red-600">{currency(localTotalSum || 0, { symbol: '₱' }).format()}</h2>

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
                        <ExpenseForm
                            amount={amount}
                            setAmount={setAmount}
                            category={category}
                            handleCategoryChange={handleCategoryChange}
                            description={description}
                            setDescription={setDescription}
                            expenseDate={expenseDate}
                            setExpenseDate={setExpenseDate}
                            employeeName={employeeName}
                            setEmployeeName={setEmployeeName}
                            editingExpense={editingExpense}
                            cancelEdit={cancelEdit}
                            handleManualSubmit={handleManualSubmit}
                            handleEditCategory={handleEditCategory}
                            categories={categories}
                            employees={employees}
                            isDemo={isDemo}
                            isPending={createExpense.isPending || updateExpense.isPending}
                        />

                        <ExpenseFilters
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filterCategory={filterCategory}
                            setFilterCategory={setFilterCategory}
                            filterEmployee={filterEmployee}
                            setFilterEmployee={setFilterEmployee}
                            dateFrom={dateFrom}
                            setDateFrom={setDateFrom}
                            dateTo={dateTo}
                            setDateTo={setDateTo}
                            setPage={setPage}
                            handleResetFilters={handleResetFilters}
                            categories={categories}
                            employees={employees}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-5/12 bg-surface flex flex-col p-6 lg:border-l-transparent h-full">
                    <ExpenseList
                        groupedExpenses={groupedExpenses}
                        isLoading={isLoading}
                        validExpenses={validExpenses}
                        localTotalSum={localTotalSum}
                        localTotalCount={localTotalCount}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                        categoryStyles={categoryStyles}
                        categories={categories}
                        editingExpense={editingExpense}
                        handleEditClick={handleEditClick}
                        handleDeleteClick={handleDeleteClick}
                        setReasonModal={setReasonModal}
                        setReasonText={setReasonText}
                        isDemo={isDemo}
                        page={page}
                        dateFrom={dateFrom}
                        handlePrevPage={handlePrevPage}
                        handleNextPage={handleNextPage}
                    />
                </div>
            </div>

            <ExpenseModals
                showCategoryModal={showCategoryModal}
                setShowCategoryModal={setShowCategoryModal}
                catForm={catForm}
                setCatForm={setCatForm}
                handleSaveCategory={handleSaveCategory}
                isCategoryPending={createCategory.isPending || updateCategory.isPending}
                isDemo={isDemo}
                reasonModal={reasonModal}
                setReasonModal={setReasonModal}
                reasonText={reasonText}
                setReasonText={setReasonText}
                handleConfirmSkip={handleConfirmSkip}
            />
        </div>
    );
}