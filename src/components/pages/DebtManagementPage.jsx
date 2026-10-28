// src/components/pages/DebtManagementPage.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useDebts, useCreateDebt, useCreateDebtPayment } from '../../hooks/useDebts';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useEmployees } from '../../hooks/useEmployees';
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
    const { user } = useStore(s => ({ user: s.user }));
    const isDemo = user?.isDemo;
    const addToast = useStore(s => s.addToast);
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
            const remainingDebt = currency(debt.total_debt_amount).subtract(totalPaid).value;
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
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });
        try {
            await createDebtMutation.mutateAsync(payload);
            addToast({
                title: 'Success',
                description: `${payload.type === 'company' ? 'Company liability' : 'Employee advance'} logged successfully.`,
                variant: 'success'
            });
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            if (payload.type === 'employee') queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleConfirmPayment = async ({ debt, amount, date }) => {
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });
        setIsSubmittingPayment(true);
        try {
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(debt.id, 10),
                amount_paid: amount,
                date_paid: date
            });

            if (!debt.type || debt.type === 'company') {
                await createExpenseMutation.mutateAsync({
                    expense_date: date,
                    category: 'Debt Repayment',
                    description: `Amortization - ${debt.description || `Account #${debt.id}`}`,
                    amount
                });
            }

            addToast({
                title: 'Payment Recorded',
                description: `Successfully logged ₱${amount.toFixed(2)} for ${debt.description}.`,
                variant: 'success'
            });

            setPaymentModalTarget(null);
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient?.invalidateQueries({ queryKey: ['expenses'] });
        } catch (error) {
            addToast({ title: 'Payment Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleUpdateDebt = async (updatedDebt) => {
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });
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

            addToast({ title: 'Updated', description: `Account #${updatedDebt.id} updated.`, variant: 'success' });
            setEditingDebt(null);
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (err) {
            addToast({ title: 'Update Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsUpdatingDebt(false);
        }
    };

    const handleDeleteDebt = async (debt) => {
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });
        if (!window.confirm(`Are you sure you want to delete "${debt.description}" (#${debt.id})? All recorded payments will also be deleted.`)) return;

        try {
            await supabase.from('debt_payments').delete().eq('debt_id', debt.id);
            const { error } = await supabase.from('debts').delete().eq('id', debt.id);
            if (error) throw error;

            addToast({ title: 'Deleted', description: `Account #${debt.id} removed.`, variant: 'success' });
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (err) {
            addToast({ title: 'Delete Error', description: err.message, variant: 'destructive' });
        }
    };

    return (
        <div className="debt-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6 pb-28 md:pb-8 overflow-x-hidden">
            <Head>
                <title>Debt Management | Seaside POS</title>
            </Head>

            {/* Header & Segmented Domain Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {activeTab === 'company' ? (
                            <>
                                <Landmark className="text-[#8DB600] w-6 h-6" />
                                <span>Company Debt Management</span>
                            </>
                        ) : (
                            <>
                                <Users className="text-indigo-600 w-6 h-6" />
                                <span>Employee Debt Management</span>
                            </>
                        )}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {activeTab === 'company'
                            ? 'Log capital liabilities and track real-time amortization balances.'
                            : 'Log cash advances/debts for staff. Connected to Salary Monitoring Auto-Deductions.'}
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto border border-slate-200/80">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('company'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'company' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Landmark className="w-3.5 h-3.5 text-[#8DB600]" />
                        <span>Company ({companyMetrics.activeCount})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('employee'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'employee' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Employees ({employeeMetrics.activeCount})</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <DebtMetricsCards metrics={currentMetrics} activeTab={activeTab} />

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-4">
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

                <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <div className="text-xs font-bold text-slate-700">
                            {activeTab === 'company' ? 'Company Liability Registry' : 'Employee Liability Registry'}
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                    statusFilter === 'active' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <span>Active</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'active' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {currentMetrics.activeCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('cleared')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                    statusFilter === 'cleared' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <span>Cleared</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'cleared' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {currentMetrics.clearedCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    statusFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                All ({currentMetrics.totalCount})
                            </button>
                        </div>
                    </div>

                    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
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