// src/components/pages/ExpensesPage.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import currency from 'currency.js';
import { startOfWeek, endOfWeek, parseISO, format, subWeeks, addWeeks, subDays, addDays } from 'date-fns';
import { Utensils, Car, ShoppingBag, Zap, Receipt, BarChart3 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useQueryClient } from '@tanstack/react-query';

// Extracted Hooks
import {
    useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense,
    useExpenseSummary, useExpenseCategories, useCreateExpenseCategory,
    useUpdateExpenseCategory
} from '../../hooks/useExpenses';
import { useEmployees } from '../../hooks/useEmployees';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useDebounce } from '../../hooks/useDebounce';
import { useAutoSyncExpenses } from '../../hooks/useAutoSyncExpenses';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison';
import { useWeeklyComparison } from '../../hooks/useWeeklyComparison';

// Extracted Components
import ExpenseForm from '../expenses/ExpenseForm';
import ExpenseFilters from '../expenses/ExpenseFilters';
import ExpenseList from '../expenses/ExpenseList';
import ExpenseModals from '../expenses/ExpenseModals';
import FinancialPerformanceSection from '../expenses/FinancialPerformanceSection';

const categoryStyles = {
    'Food': { icon: Utensils, colorClass: 'bg-orange-100 text-orange-600' },
    'Transport': { icon: Car, colorClass: 'bg-blue-100 text-blue-600' },
    'Shopping': { icon: ShoppingBag, colorClass: 'bg-pink-100 text-pink-600' },
    'Bills': { icon: Zap, colorClass: 'bg-emerald-100 text-emerald-600' }
};

const capitalizeWords = (str) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatPeso = (val) => currency(Number(val) || 0, { symbol: '₱', precision: 2 }).format();

const formatDateSafe = (dateStr, formatPattern = 'MMM dd, yyyy') => {
    if (!dateStr) return 'N/A';
    try {
        const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : format(d, formatPattern);
    } catch {
        return dateStr;
    }
};

export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();
    const isDemo = user?.isDemo;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const initialDateFrom = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const initialDateTo = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const initialSearchTerm = '';
    const initialFilterCategory = 'All';
    const initialFilterEmployee = 'all';

    // Mobile Navigation Sub-Tab State ('operations' | 'analytics')
    const [mobileTab, setMobileTab] = useState('operations');

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

    const { data: { expenses = [] } = {}, isLoading, isFetching } = useExpenses({
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
        startDate: dateFrom ? new Date(`${dateFrom}T00:00:00+08:00`) : undefined,
        endDate: dateTo ? new Date(`${dateTo}T23:59:59.999+08:00`) : undefined
    });

    const { validExpenses, localTotalSum, localTotalCount } = useMemo(() => {
        if (!expenses || expenses.length === 0) return { validExpenses: [], localTotalSum: 0, localTotalCount: 0 };
        const start = new Date(`${dateFrom}T00:00:00+08:00`);
        const end = new Date(`${dateTo}T23:59:59.999+08:00`);
        const valid = expenses.filter(exp => {
            const expDate = parseISO(exp.expense_date);
            return expDate >= start && expDate <= end;
        });
        const sum = valid.reduce((acc, exp) => acc + Number(exp.amount), 0);
        return { validExpenses: valid, localTotalSum: sum, localTotalCount: valid.length };
    }, [expenses, dateFrom, dateTo]);

    const weekGrossSales = salesSummary?.totalRevenue || 0;
    const weekNetSales = weekGrossSales - localTotalSum;
    const weekNetMargin = weekGrossSales > 0 ? ((weekNetSales / weekGrossSales) * 100).toFixed(1) : '0.0';

    // Monthly & Weekly Comparisons
    const { monthlyComparisonData, momNetGrowth } = useMonthlyComparison(selectedMonth);
    const { data: previousWeekData } = useWeeklyComparison(dateFrom, dateTo);

    const wowNetGrowth = useMemo(() => {
        if (!previousWeekData) return null;
        const cur = weekNetSales;
        const prev = previousWeekData.net;
        if (!prev || prev === 0) return cur > 0 ? 100 : 0;
        const pct = ((cur - prev) / Math.abs(prev)) * 100;
        if (!isFinite(pct) || Math.abs(pct) > 9999) return cur >= prev ? 999 : -999;
        return Number(pct.toFixed(1));
    }, [weekNetSales, previousWeekData]);

    const createExpense = useCreateExpense();
    useAutoSyncExpenses({ categories, user, isFetching, createExpense, queryClient, addToast });

    // Grouping computation for the ExpenseList
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

    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();
    const createCategory = useCreateExpenseCategory();
    const updateCategory = useUpdateExpenseCategory();

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('Payment for ');
    const [expenseDate, setExpenseDate] = useState(todayStr); // Defaults to today's date
    const [employeeName, setEmployeeName] = useState('');
    const [editingExpense, setEditingExpense] = useState(null);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [catForm, setCatForm] = useState({
        id: null,
        name: '',
        default_amount: '',
        default_description: '',
        is_recurring: false,
        is_recurring_daily: false,
        recurring_day: 1
    });
    const [reasonModal, setReasonModal] = useState({ show: false, expense: null });
    const [reasonText, setReasonText] = useState('');

    const handleCategoryChange = (val) => {
        if (val === 'ADD_NEW') {
            setCatForm({
                id: null,
                name: '',
                default_amount: '',
                default_description: '',
                is_recurring: false,
                is_recurring_daily: false,
                recurring_day: 1
            });
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
        const { id, name, default_amount, default_description, is_recurring, is_recurring_daily, recurring_day } = catForm;
        if (!name.trim()) return;

        const capitalizedName = capitalizeWords(name);
        const capitalizedDescription = capitalizeWords(default_description);

        try {
            if (id) {
                await updateCategory.mutateAsync({
                    id,
                    name: capitalizedName,
                    default_amount,
                    default_description: capitalizedDescription,
                    is_recurring,
                    is_recurring_daily,
                    recurring_day
                });
                addToast({ title: 'Success', message: 'Category updated.', type: 'success' });
            } else {
                if (categories.some(c => c.name.toLowerCase() === capitalizedName.toLowerCase())) {
                    addToast({ title: 'Error', message: 'Category already exists.', type: 'error' });
                    return;
                }
                await createCategory.mutateAsync({
                    name: capitalizedName,
                    default_amount,
                    default_description: capitalizedDescription,
                    is_recurring,
                    is_recurring_daily,
                    recurring_day
                });
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
                is_recurring_daily: selectedCat.is_recurring_daily || false,
                recurring_day: selectedCat.recurring_day ?? 1
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
            setExpenseDate(todayStr);
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
        setExpenseDate(todayStr);
        setCategory('');
        setEmployeeName('');
    };

    const handleNextPage = () => {
        setPage(prev => prev + 1);
        setDateFrom(format(subWeeks(parseISO(dateFrom), 1), 'yyyy-MM-dd'));
        setDateTo(format(subWeeks(parseISO(dateTo), 1), 'yyyy-MM-dd'));
    };

    const handlePrevPage = () => {
        if (page <= 1) return;
        setPage(prev => prev - 1);
        setDateFrom(format(addWeeks(parseISO(dateFrom), 1), 'yyyy-MM-dd'));
        setDateTo(format(addWeeks(parseISO(dateTo), 1), 'yyyy-MM-dd'));
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
        <div className="responsive-page min-h-screen bg-background p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28 md:pb-8">
            <Head><title>Expenses & Financial Performance | Seaside POS</title></Head>

            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

                {/* Mobile Sub-Tab Navigation Bar */}
                <div className="flex lg:hidden bg-surface p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setMobileTab('operations')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            mobileTab === 'operations'
                                ? 'bg-[#8DB600] text-white shadow-xs'
                                : 'text-text-muted hover:text-text'
                        }`}
                    >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipts & Add</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('analytics')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            mobileTab === 'analytics'
                                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                                : 'text-text-muted hover:text-text'
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Analytics & Margins</span>
                    </button>
                </div>

                {/* 1. FINANCIAL PERFORMANCE & MARGINS SECTION */}
                <div className={mobileTab === 'analytics' ? 'block' : 'hidden lg:block'}>
                    <FinancialPerformanceSection
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        setDateTo={setDateTo}
                        initialDateFrom={initialDateFrom}
                        dateTo={dateTo}
                        weekGrossSales={weekGrossSales}
                        localTotalSum={localTotalSum}
                        weekNetSales={weekNetSales}
                        weekNetMargin={weekNetMargin}
                        previousWeekData={previousWeekData}
                        wowNetGrowth={wowNetGrowth}
                        monthlyComparisonData={monthlyComparisonData}
                        momNetGrowth={momNetGrowth}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                    />
                </div>

                {/* 2. EXPENSE LOGGING & TRANSACTION MANAGEMENT */}
                <div className={mobileTab === 'operations' ? 'block' : 'hidden lg:block'}>
                    <div className="w-full bg-surface shadow-xl flex flex-col lg:flex-row rounded-3xl border-transparent overflow-hidden">
                        <div className="w-full lg:w-7/12 flex flex-col bg-surface">
                            <div className="bg-surface text-text p-5 sm:p-8 rounded-br-[3rem] shadow-sm z-10 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-3 sm:mb-4">
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-text">
                                            <Receipt className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" /> Expense Operations
                                        </h1>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            Record payouts, daily operations, and recurring utilities
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-text-muted text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                                            {dateFrom === initialDateFrom ? 'Week Gross' : 'Period Gross'}
                                        </p>
                                        <p className="text-sm sm:text-lg font-bold text-emerald-600">
                                            {formatPeso(salesSummary?.totalRevenue || 0)}
                                        </p>
                                        <p className="text-text-muted text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1">
                                            {dateFrom === initialDateFrom ? 'Week Net' : 'Period Net'}
                                        </p>
                                        <p className="text-base sm:text-xl font-black" style={{ color: weekNetSales >= 0 ? '#10b981' : '#dc2626' }}>
                                            {weekNetSales >= 0 ? '+' : ''}{formatPeso(weekNetSales)}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-text-muted text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Selected Period Expenses</p>
                                <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 sm:mb-4 text-red-600">{formatPeso(localTotalSum || 0)}</h2>

                                <div className="flex flex-wrap gap-4 sm:gap-8 border-t border-slate-100 dark:border-slate-800 pt-3 items-end">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <p className="text-[10px] sm:text-xs uppercase font-semibold text-text-muted">Monthly Filter</p>
                                            <input
                                                type="month"
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="text-[11px] sm:text-xs bg-background border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-0.5 text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <p className="text-sm sm:text-base font-bold text-text">{formatPeso(summary?.monthlyTotal || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs uppercase font-semibold text-text-muted mb-1 pb-1">All-Time Expenses</p>
                                        <p className="text-sm sm:text-base font-bold text-text">{formatPeso(summary?.grandTotal || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

                        <div className="w-full lg:w-5/12 bg-surface flex flex-col p-4 sm:p-6 lg:border-l border-slate-100 dark:border-slate-800 h-full">
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