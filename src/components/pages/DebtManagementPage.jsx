// src/components/pages/DebtManagementPage.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useDebts, useCreateDebt, useCreateDebtPayment } from '../../hooks/useDebts';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useEmployees } from '../../hooks/useEmployees';
import { logActivity } from '../../hooks/useActivityLogs';
import { useStore } from '../../store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import currency from 'currency.js';
import { Landmark, Users } from 'lucide-react';
import { Card, CardContent } from '../ui';

// Modular Subcomponents
import DebtMetricsCards from '../debts/DebtMetricsCards';
import CompanyDebtForm from '../debts/CompanyDebtForm';
import EmployeeDebtForm from '../debts/EmployeeDebtForm';
import DebtRegistryTable from '../debts/DebtRegistryTable';
import DebtPaymentModal from '../debts/DebtPaymentModal';
import EditDebtModal from '../debts/EditDebtModal';

export default function DebtManagementPage() {
    const user = useStore(s => s.user);
    const addToast = useStore(s => s.addToast);
    const isDemo = Boolean(user?.isDemo);
    const queryClient = useQueryClient?.() || null;

    // View & Filter States
    const [activeTab, setActiveTab] = useState('company'); // 'company' | 'employee'
    const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'cleared' | 'all'

    // Queries
    const { data: debts = [], isLoading, refetch } = useDebts();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const createDebtMutation = useCreateDebt();
    const createPaymentMutation = useCreateDebtPayment();
    const createExpenseMutation = useCreateExpense();

    // Modals State
    const [paymentModalTarget, setPaymentModalTarget] = useState(null);
    const [editingDebt, setEditingDebt] = useState(null);
    const [isUpdatingDebt, setIsUpdatingDebt] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Process & Group Debts
    const { companyDebts, employeeDebts } = useMemo(() => {
        const processed = debts.map(debt => {
            const rawPayments = debt.debt_payments || [];
            const debtPayments = rawPayments.filter(p => {
                const pId = p.debt_id ?? p.company_debt_id ?? p.debtId;
                return pId !== undefined && pId !== null ? String(pId) === String(debt.id) : true;
            });

            const totalPaid = debtPayments.reduce((sum, p) => sum.add(currency(p.amount_paid)), currency(0)).value;
            const remainingDebt = Math.max(0, currency(debt.total_debt_amount).subtract(totalPaid).value);
            const sortedPayments = [...debtPayments].sort((a, b) => {
                const dateA = new Date(a.date_paid || a.payment_date || 0);
                const dateB = new Date(b.date_paid || b.payment_date || 0);
                return dateB.getTime() - dateA.getTime();
            });

            return { ...debt, totalPaid, remainingDebt, sortedPayments };
        });

        return {
            companyDebts: processed.filter(d => !d.type || d.type === 'company'),
            employeeDebts: processed.filter(d => d.type === 'employee')
        };
    }, [debts]);

    // Metric Calculations
    const computeMetrics = (list) => {
        let original = currency(0), paid = currency(0), remaining = currency(0);
        list.forEach(d => {
            original = original.add(d.total_debt_amount);
            paid = paid.add(d.totalPaid);
            remaining = remaining.add(d.remainingDebt);
        });
        return {
            original: original.format({ symbol: '₱' }),
            paid: paid.format({ symbol: '₱' }),
            remaining: remaining.format({ symbol: '₱' }),
            activeCount: list.filter(d => d.remainingDebt > 0).length,
            clearedCount: list.filter(d => d.remainingDebt <= 0).length,
            totalCount: list.length
        };
    };

    const companyMetrics = useMemo(() => computeMetrics(companyDebts), [companyDebts]);
    const employeeMetrics = useMemo(() => computeMetrics(employeeDebts), [employeeDebts]);
    const currentMetrics = activeTab === 'company' ? companyMetrics : employeeMetrics;

    const displayedDebts = useMemo(() => {
        const source = activeTab === 'company' ? companyDebts : employeeDebts;
        if (statusFilter === 'active') return source.filter(d => d.remainingDebt > 0);
        if (statusFilter === 'cleared') return source.filter(d => d.remainingDebt <= 0);
        return source;
    }, [activeTab, companyDebts, employeeDebts, statusFilter]);

    // Handlers
    const handleCreateDebt = async (payload) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Adding records is disabled in demo mode.', variant: 'warning' });
        try {
            await createDebtMutation.mutateAsync(payload);

            await logActivity({
                user,
                action: 'CREATE',
                entity_type: 'DEBT',
                description: `Logged ${payload.type === 'company' ? 'company liability' : 'employee advance'}: "${payload.description}" (₱${Number(payload.total_debt_amount || 0).toFixed(2)})`
            });

            addToast({
                title: 'Success',
                description: `${payload.type === 'company' ? 'Company liability' : 'Employee advance'} logged successfully.`,
                variant: 'success'
            });
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['activity-logs'] });
            if (payload.type === 'employee') queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleConfirmPayment = async ({ debt, amount, date, recordToExpense = false }) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Recording payments is disabled in demo mode.', variant: 'warning' });
        setIsSubmittingPayment(true);
        try {
            const numericAmount = currency(amount).value;
            const cleanDateStr = String(date || '').trim().slice(0, 10);

            // 1. Always record payment to reduce the debt balance
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(debt.id, 10),
                amount_paid: numericAmount,
                date_paid: cleanDateStr || date
            });

            // 2. Only record to Expenses if it's a company debt AND user toggled "Record to Expenses" ON
            const isCompanyDebt = !debt.type || debt.type === 'company';
            const shouldLogExpense = isCompanyDebt && Boolean(recordToExpense);

            if (shouldLogExpense) {
                const manilaExpenseIso = /^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)
                    ? new Date(`${cleanDateStr}T12:00:00+08:00`).toISOString()
                    : date;

                await createExpenseMutation.mutateAsync({
                    expense_date: manilaExpenseIso,
                    category: 'Debt Repayment',
                    description: `Debt Payment - ${debt.description || `Account #${debt.id}`}`,
                    amount: numericAmount
                });
            }

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'DEBT',
                description: `Recorded ₱${numericAmount.toFixed(2)} payment for "${debt.description || `Account #${debt.id}`}"${shouldLogExpense ? ' (also logged to Expenses)' : ' (debt deduction only)'}`
            });

            addToast({
                title: 'Payment Recorded',
                description: shouldLogExpense
                    ? `Deducted ₱${numericAmount.toFixed(2)} from ${debt.description} and recorded to Expenses.`
                    : `Deducted ₱${numericAmount.toFixed(2)} from ${debt.description}.`,
                variant: 'success'
            });

            setPaymentModalTarget(null);
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient?.invalidateQueries({ queryKey: ['activity-logs'] });
            if (shouldLogExpense) {
                queryClient?.invalidateQueries({ queryKey: ['expenses'] });
                queryClient?.invalidateQueries({ queryKey: ['expense-summary'] });
            }
        } catch (error) {
            addToast({ title: 'Payment Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleUpdateDebt = async (updatedDebt) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Editing records is disabled in demo mode.', variant: 'warning' });
        setIsUpdatingDebt(true);
        try {
            const { error } = await supabase
                .from('debts')
                .update({
                    description: updatedDebt.description,
                    total_debt_amount: updatedDebt.total_debt_amount,
                    weekly_payment_amount: updatedDebt.weekly_payment_amount,
                    frequency: updatedDebt.frequency,
                    debt_date: updatedDebt.debt_date
                })
                .eq('id', updatedDebt.id);

            if (error) throw error;

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'DEBT',
                description: `Updated debt account #${updatedDebt.id}: "${updatedDebt.description}" (₱${Number(updatedDebt.total_debt_amount || 0).toFixed(2)})`
            });

            addToast({ title: 'Updated', description: `Account #${updatedDebt.id} updated.`, variant: 'success' });
            setEditingDebt(null);
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient?.invalidateQueries({ queryKey: ['activity-logs'] });
        } catch (err) {
            addToast({ title: 'Update Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsUpdatingDebt(false);
        }
    };

    const handleDeleteDebt = async (debt) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Deleting records is disabled in demo mode.', variant: 'warning' });
        if (!window.confirm(`Are you sure you want to delete "${debt.description}" (#${debt.id})? All recorded payments will also be deleted.`)) return;

        try {
            await supabase.from('debt_payments').delete().eq('debt_id', debt.id);
            const { error } = await supabase.from('debts').delete().eq('id', debt.id);
            if (error) throw error;

            await logActivity({
                user,
                action: 'DELETE',
                entity_type: 'DEBT',
                description: `Deleted debt account #${debt.id}: "${debt.description}"`
            });

            addToast({ title: 'Deleted', description: `Account #${debt.id} removed.`, variant: 'success' });
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient?.invalidateQueries({ queryKey: ['activity-logs'] });
        } catch (err) {
            addToast({ title: 'Delete Error', description: err.message, variant: 'destructive' });
        }
    };

    return (
        <div className="debt-page w-full max-w-7xl mx-auto px-1.5 pt-2 pb-32 sm:px-5 sm:pt-5 sm:pb-32 md:p-6 space-y-2.5 sm:space-y-6 overflow-x-hidden transition-colors dark:[color-scheme:dark]">
            <Head>
                <title>Debt Management | Seaside WRS</title>
            </Head>

            {/* Ensure full mobile bottom dock clearance (< 768px) and edge-to-edge fit (< 640px) */}
            <style jsx global>{`
                @media (max-width: 767px) {
                    .app:has(.debt-page) .main,
                    .app:has(.debt-page) .container {
                        padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important;
                    }
                }
                @media (max-width: 639px) {
                    .app:has(.debt-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.debt-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .debt-page .grid.grid-cols-3 {
                        gap: 0.375rem !important;
                    }
                    .debt-page .grid.grid-cols-3 > div {
                        padding: 0.625rem !important;
                        border-radius: 0.75rem !important;
                    }
                    .debt-page .rounded-3xl {
                        border-radius: 0.875rem !important;
                    }
                }
                .debt-page .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .debt-page .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Header & Segmented Domain Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 px-0.5 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        {activeTab === 'company' ? (
                            <>
                                <Landmark className="text-[#8DB600] dark:text-lime-400 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                <span>Company Debt Management</span>
                            </>
                        ) : (
                            <>
                                <Users className="text-indigo-600 dark:text-indigo-400 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                <span>Employee Debt Management</span>
                            </>
                        )}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeTab === 'company'
                            ? 'Log capital liabilities and track real-time amortization balances.'
                            : 'Log cash advances/debts for staff. Connected to Salary Monitoring Auto-Deductions.'}
                    </p>
                </div>

                {/* Segmented Top Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl w-full sm:w-auto border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('company'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer select-none ${
                            activeTab === 'company'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        <Landmark className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400 shrink-0" />
                        <span>Company ({companyMetrics.activeCount})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('employee'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer select-none ${
                            activeTab === 'employee'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Employees ({employeeMetrics.activeCount})</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <DebtMetricsCards metrics={currentMetrics} activeTab={activeTab} />

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-6 items-start">
                {/* Left Column: Form */}
                <div className="lg:col-span-4 space-y-2.5 sm:space-y-4">
                    {activeTab === 'company' ? (
                        <CompanyDebtForm
                            onSubmit={handleCreateDebt}
                            isSubmitting={createDebtMutation.isPending}
                            isDemo={isDemo}
                        />
                    ) : (
                        <EmployeeDebtForm
                            employees={employees}
                            onSubmit={handleCreateDebt}
                            isSubmitting={createDebtMutation.isPending}
                            isDemo={isDemo}
                        />
                    )}
                </div>

                {/* Right Column: Registry Table & Filters */}
                <div className="lg:col-span-8 space-y-2.5 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {activeTab === 'company' ? 'Company Liability Registry' : 'Employee Liability Registry'}
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 ${
                                    statusFilter === 'active'
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>Active</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    statusFilter === 'active'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {currentMetrics.activeCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('cleared')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 ${
                                    statusFilter === 'cleared'
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>Cleared</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    statusFilter === 'cleared'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {currentMetrics.clearedCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none shrink-0 ${
                                    statusFilter === 'all'
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                All ({currentMetrics.totalCount})
                            </button>
                        </div>
                    </div>

                    <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden transition-colors">
                        <CardContent className="p-0">
                            <DebtRegistryTable
                                data={displayedDebts}
                                isLoading={isLoading}
                                emptyMessage={statusFilter === 'active' ? 'No active debts found. All cleared!' : 'No debt records found.'}
                                onPay={setPaymentModalTarget}
                                onEdit={setEditingDebt}
                                onDelete={handleDeleteDebt}
                                isDemo={isDemo}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <DebtPaymentModal
                targetDebt={paymentModalTarget}
                isOpen={!!paymentModalTarget}
                onClose={() => setPaymentModalTarget(null)}
                onConfirm={handleConfirmPayment}
                isSubmitting={isSubmittingPayment}
            />

            <EditDebtModal
                debt={editingDebt}
                isOpen={!!editingDebt}
                onClose={() => setEditingDebt(null)}
                onSave={handleUpdateDebt}
                isUpdating={isUpdatingDebt}
            />
        </div>
    );
}