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
import { format, parseISO } from 'date-fns';
import {
    Card, CardHeader, CardContent, Button, Input, Label, Select,
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../ui';
import {
    Landmark, PlusCircle, Calendar, History, Users,
    ChevronDown, ChevronUp, Edit2, Trash2, CheckCircle2, Receipt,
    DollarSign, AlertCircle, X, ArrowRight
} from 'lucide-react';

const getPhilippineDateString = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(now);
};

const formatDateSafe = (dateStr, formatPattern = 'MMM dd, yyyy') => {
    if (!dateStr) return 'N/A';
    try {
        const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : format(d, formatPattern);
    } catch {
        return dateStr;
    }
};

export default function DebtManagementPage() {
    const { user } = useStore(s => ({ user: s.user }));
    const isDemo = user?.isDemo;
    const addToast = useStore(s => s.addToast);
    const queryClient = useQueryClient?.() || null;

    // Active View Mode: 'company' | 'employee'
    const [activeTab, setActiveTab] = useState('company');
    // Status Filter: 'active' | 'cleared' | 'all'
    const [statusFilter, setStatusFilter] = useState('active');

    // Queries
    const { data: debts = [], isLoading, refetch } = useDebts();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const createDebtMutation = useCreateDebt();
    const createPaymentMutation = useCreateDebtPayment();
    const createExpenseMutation = useCreateExpense();

    // Form State: Company Debt Creation
    const [debtDate, setDebtDate] = useState(getPhilippineDateString());
    const [description, setDescription] = useState('');
    const [totalDebtAmount, setTotalDebtAmount] = useState('');
    const [weeklyPaymentAmount, setWeeklyPaymentAmount] = useState('');
    const [debtFrequency, setDebtFrequency] = useState('Weekly');

    // Form State: Employee Debt Creation
    const [empDebtDate, setEmpDebtDate] = useState(getPhilippineDateString());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [empReason, setEmpReason] = useState('');
    const [empTotalDebtAmount, setEmpTotalDebtAmount] = useState('');
    const [empWeeklyPaymentAmount, setEmpWeeklyPaymentAmount] = useState('');
    const [empDebtFrequency, setEmpDebtFrequency] = useState('Weekly');

    // Payment Settlement Modal State
    const [paymentModalTarget, setPaymentModalTarget] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(getPhilippineDateString());
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Edit Account Modal State
    const [editingDebt, setEditingDebt] = useState(null);
    const [isUpdatingDebt, setIsUpdatingDebt] = useState(false);

    // Process Debts & Separate Company vs Employee
    const { companyDebts, employeeDebts } = useMemo(() => {
        const processed = debts.map(debt => {
            const rawPayments = debt.debt_payments || [];

            const debtPayments = rawPayments.filter(p => {
                const pId = p.debt_id ?? p.company_debt_id ?? p.debtId;
                if (pId !== undefined && pId !== null) {
                    return String(pId) === String(debt.id);
                }
                return true;
            });

            const totalPaid = debtPayments.reduce((sum, payment) => {
                return sum.add(currency(payment.amount_paid));
            }, currency(0)).value;

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

    // KPI Metrics
    const companyMetrics = useMemo(() => {
        let original = currency(0), paid = currency(0), remaining = currency(0);
        companyDebts.forEach(d => {
            original = original.add(d.total_debt_amount);
            paid = paid.add(d.totalPaid);
            remaining = remaining.add(d.remainingDebt);
        });
        return {
            original: original.format({ symbol: '₱' }),
            paid: paid.format({ symbol: '₱' }),
            remaining: remaining.format({ symbol: '₱' }),
            activeCount: companyDebts.filter(d => d.remainingDebt > 0).length,
            clearedCount: companyDebts.filter(d => d.remainingDebt <= 0).length,
            totalCount: companyDebts.length
        };
    }, [companyDebts]);

    const employeeMetrics = useMemo(() => {
        let original = currency(0), paid = currency(0), remaining = currency(0);
        employeeDebts.forEach(d => {
            original = original.add(d.total_debt_amount);
            paid = paid.add(d.totalPaid);
            remaining = remaining.add(d.remainingDebt);
        });
        return {
            original: original.format({ symbol: '₱' }),
            paid: paid.format({ symbol: '₱' }),
            remaining: remaining.format({ symbol: '₱' }),
            activeCount: employeeDebts.filter(d => d.remainingDebt > 0).length,
            clearedCount: employeeDebts.filter(d => d.remainingDebt <= 0).length,
            totalCount: employeeDebts.length
        };
    }, [employeeDebts]);

    // Filtered List based on Status Filter
    const displayedDebts = useMemo(() => {
        const source = activeTab === 'company' ? companyDebts : employeeDebts;
        if (statusFilter === 'active') return source.filter(d => d.remainingDebt > 0);
        if (statusFilter === 'cleared') return source.filter(d => d.remainingDebt <= 0);
        return source;
    }, [activeTab, companyDebts, employeeDebts, statusFilter]);

    // Creation Handlers
    const handleNewDebtSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });

        try {
            await createDebtMutation.mutateAsync({
                debt_date: debtDate,
                description,
                total_debt_amount: parseFloat(totalDebtAmount),
                weekly_payment_amount: parseFloat(weeklyPaymentAmount) || 0,
                frequency: debtFrequency,
                type: 'company'
            });
            addToast({ title: 'Success', description: 'Company debt logged.', variant: 'success' });
            setDescription(''); setTotalDebtAmount(''); setWeeklyPaymentAmount(''); setDebtFrequency('Weekly');
            refetch?.();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleNewEmpDebtSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });

        const employee = employees.find(emp => String(emp.id) === String(selectedEmployeeId));
        const employeeName = employee ? employee.name : 'Unknown Employee';
        const finalDescription = empReason.trim() ? `${employeeName} - ${empReason.trim()}` : employeeName;

        try {
            await createDebtMutation.mutateAsync({
                debt_date: empDebtDate,
                description: finalDescription,
                total_debt_amount: parseFloat(empTotalDebtAmount),
                weekly_payment_amount: parseFloat(empWeeklyPaymentAmount) || 0,
                frequency: empDebtFrequency,
                type: 'employee',
                employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : null
            });
            addToast({ title: 'Success', description: 'Employee advance logged and linked to Salary Monitoring.', variant: 'success' });

            setSelectedEmployeeId('');
            setEmpReason('');
            setEmpTotalDebtAmount('');
            setEmpWeeklyPaymentAmount('');
            setEmpDebtFrequency('Weekly');
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // Inline Payment Handler
    const handleOpenPaymentModal = (debt) => {
        setPaymentModalTarget(debt);
        const suggested = debt.weekly_payment_amount && debt.weekly_payment_amount <= debt.remainingDebt
            ? String(debt.weekly_payment_amount)
            : String(debt.remainingDebt || '');
        setPaymentAmount(suggested);
        setPaymentDate(getPhilippineDateString());
    };

    const handleConfirmPaymentSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });
        if (!paymentModalTarget) return;

        const amountNum = parseFloat(paymentAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return addToast({ title: 'Invalid Amount', description: 'Please enter a valid payment amount.', variant: 'destructive' });
        }

        setIsSubmittingPayment(true);
        try {
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(paymentModalTarget.id, 10),
                amount_paid: amountNum,
                date_paid: paymentDate
            });

            // Automatically record as an expense if it's a company debt
            if (!paymentModalTarget.type || paymentModalTarget.type === 'company') {
                await createExpenseMutation.mutateAsync({
                    expense_date: paymentDate,
                    category: 'Debt Repayment',
                    description: `Amortization - ${paymentModalTarget.description || `Account #${paymentModalTarget.id}`}`,
                    amount: amountNum
                });
            }

            addToast({
                title: 'Payment Recorded',
                description: `Successfully logged ₱${amountNum.toFixed(2)} for ${paymentModalTarget.description}.`,
                variant: 'success'
            });

            setPaymentModalTarget(null);
            setPaymentAmount('');
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

    // Account Edit / Delete
    const handleUpdateDebtSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });
        if (!editingDebt) return;

        setIsUpdatingDebt(true);
        try {
            const { error } = await supabase
                .from('debts')
                .update({
                    description: editingDebt.description,
                    total_debt_amount: parseFloat(editingDebt.total_debt_amount),
                    weekly_payment_amount: parseFloat(editingDebt.weekly_payment_amount) || 0,
                    frequency: editingDebt.frequency || 'Weekly',
                    debt_date: editingDebt.debt_date
                })
                .eq('id', editingDebt.id);

            if (error) throw error;

            addToast({ title: 'Updated', description: `Account #${editingDebt.id} updated.`, variant: 'success' });
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
        if (!window.confirm(`Are you sure you want to delete "${debt.description}" (#${debt.id})? All recorded payments will be deleted as well.`)) {
            return;
        }

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

    // Refactored Liability Registry Table
    const DebtTable = ({ data, emptyMessage }) => {
        const [expandedRows, setExpandedRows] = useState(new Set());

        const toggleRow = (id) => {
            const next = new Set(expandedRows);
            next.has(id) ? next.delete(id) : next.add(id);
            setExpandedRows(next);
        };

        if (isLoading) {
            return <div className="text-center py-16 text-slate-400 font-medium text-xs">Loading records...</div>;
        }

        if (data.length === 0) {
            return (
                <div className="text-center py-16 text-slate-400 font-medium text-xs space-y-1">
                    <p>{emptyMessage}</p>
                    <p className="text-[11px] text-slate-400">Use the form on the left to log a new liability entry.</p>
                </div>
            );
        }

        return (
            <div className="w-full">
                {/* Desktop Table View */}
                <div className="hidden md:block w-full overflow-x-hidden">
                    <table className="w-full table-fixed text-xs divide-y divide-slate-100">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                        <tr>
                            <th className="w-[32%] py-3 px-3 text-left">Account Details</th>
                            <th className="w-[18%] py-3 px-3 text-left">Terms</th>
                            <th className="w-[22%] py-3 px-3 text-left">Progress</th>
                            <th className="w-[14%] py-3 px-3 text-right">Remaining</th>
                            <th className="w-[14%] py-3 px-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                        {data.map((debt) => {
                            const isExpanded = expandedRows.has(debt.id);
                            const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                            const isFullyPaid = debt.remainingDebt <= 0;

                            return (
                                <React.Fragment key={debt.id}>
                                    <tr className={`hover:bg-slate-50/70 transition-colors ${isFullyPaid ? 'bg-slate-50/40 opacity-75' : ''}`}>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[200px]" title={debt.description}>
                                                        {debt.description}
                                                    </span>
                                                {isFullyPaid && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Cleared
                                                        </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                                <span>#{debt.id}</span>
                                                <span>•</span>
                                                <span>{formatDateSafe(debt.debt_date)}</span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-3">
                                            <div className="font-bold text-slate-800">
                                                {currency(debt.total_debt_amount, { symbol: '₱' }).format()}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium">
                                                {currency(debt.weekly_payment_amount || 0, { symbol: '₱' }).format()}
                                                {(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}
                                            </div>
                                        </td>

                                        <td className="py-3 px-3">
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-[#8DB600]'}`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mt-1 text-[10px] font-bold">
                                                    <span className="text-emerald-700 font-mono">
                                                        {currency(debt.totalPaid, { symbol: '₱' }).format()} PAID
                                                    </span>
                                                <span className="text-slate-400">
                                                        {Math.round(progressPct)}%
                                                    </span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-3 text-right">
                                            <div className={`font-black text-xs sm:text-sm whitespace-nowrap ${isFullyPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                            </div>
                                        </td>

                                        <td className="py-3 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {!isFullyPaid && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPaymentModal(debt)}
                                                        className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                                                        title="Record Payment"
                                                        disabled={isDemo}
                                                    >
                                                        Pay
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => toggleRow(debt.id)}
                                                    className={`h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-bold border transition-colors ${
                                                        isExpanded
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                    title={isExpanded ? 'Hide History' : 'View Payment History'}
                                                >
                                                    <span>{debt.sortedPayments.length}</span>
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setEditingDebt(debt)}
                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                                                    title="Edit Account Details"
                                                    disabled={isDemo}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDebt(debt)}
                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                                                    title="Delete Liability Account"
                                                    disabled={isDemo}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Tabular Payment History */}
                                    {isExpanded && (
                                        <tr className="bg-slate-50/70 border-b border-slate-200">
                                            <td colSpan={5} className="p-0">
                                                <div className="p-4 border-l-4 border-l-[#8DB600] bg-white m-3 rounded-xl border border-slate-200 shadow-2xs">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                            <Receipt className="w-4 h-4 text-[#8DB600]" />
                                                            <span>Payment History ({debt.sortedPayments.length})</span>
                                                        </div>
                                                        {!isFullyPaid && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenPaymentModal(debt)}
                                                                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                                            >
                                                                <span>+ Add Payment</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {debt.sortedPayments.length > 0 ? (
                                                        <div className="overflow-hidden border border-slate-100 rounded-lg">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                                                                <tr>
                                                                    <th className="py-2 px-3 text-left">Date Paid</th>
                                                                    <th className="py-2 px-3 text-left">Reference</th>
                                                                    <th className="py-2 px-3 text-right">Amount Paid</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 font-mono">
                                                                {debt.sortedPayments.map((p, idx) => (
                                                                    <tr key={p.id || idx} className="hover:bg-slate-50/60">
                                                                        <td className="py-2 px-3 text-slate-700">{formatDateSafe(p.date_paid || p.payment_date)}</td>
                                                                        <td className="py-2 px-3 text-slate-400">TXN #{p.id || idx + 1}</td>
                                                                        <td className="py-2 px-3 text-right font-bold text-emerald-600">
                                                                            +{currency(p.amount_paid, { symbol: '₱' }).format()}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-xs text-slate-400 italic">
                                                            No payments recorded for this account yet.
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="block md:hidden divide-y divide-slate-100">
                    {data.map((debt) => {
                        const isExpanded = expandedRows.has(debt.id);
                        const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                        const isFullyPaid = debt.remainingDebt <= 0;

                        return (
                            <div key={debt.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                                            {debt.description}
                                            {isFullyPaid && (
                                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                    Cleared
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                                            #{debt.id} • {formatDateSafe(debt.debt_date)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-black text-sm ${isFullyPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                        </div>
                                        <div className="text-[10px] text-slate-400">remaining</div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span>Principal: <strong>{currency(debt.total_debt_amount, { symbol: '₱' }).format()}</strong></span>
                                    <span>Terms: <strong>{currency(debt.weekly_payment_amount || 0, { symbol: '₱' }).format()}{(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15d'}</strong></span>
                                </div>

                                <div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-[#8DB600]'}`}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[10px] font-bold">
                                        <span className="text-emerald-700">{currency(debt.totalPaid, { symbol: '₱' }).format()} PAID</span>
                                        <span className="text-slate-400">{Math.round(progressPct)}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => toggleRow(debt.id)}
                                        className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-slate-900"
                                    >
                                        <History className="w-3.5 h-3.5 text-slate-400" />
                                        <span>History ({debt.sortedPayments.length})</span>
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {!isFullyPaid && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenPaymentModal(debt)}
                                                className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setEditingDebt(debt)}
                                            className="p-1.5 text-blue-600 border border-slate-200 rounded-lg"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDebt(debt)}
                                            className="p-1.5 text-rose-600 border border-slate-200 rounded-lg"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                        {debt.sortedPayments.length > 0 ? (
                                            debt.sortedPayments.map((p, idx) => (
                                                <div key={p.id || idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100">
                                                    <div>
                                                        <span className="font-bold text-slate-800">{formatDateSafe(p.date_paid || p.payment_date)}</span>
                                                        <span className="text-[10px] text-slate-400 block font-mono">TXN #{p.id || idx + 1}</span>
                                                    </div>
                                                    <span className="font-black text-emerald-600">+{currency(p.amount_paid, { symbol: '₱' }).format()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-2 text-xs text-slate-400 italic">No payments recorded yet.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const currentMetrics = activeTab === 'company' ? companyMetrics : employeeMetrics;

    return (
        <div className="debt-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6 overflow-x-hidden">
            <Head>
                <title>Debt Management | Seaside POS</title>
            </Head>

            {/* Top Navigation Switcher */}
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

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto border border-slate-200/80">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('company'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'company'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Landmark className="w-3.5 h-3.5 text-[#8DB600]" />
                        <span>Company ({companyMetrics.activeCount})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('employee'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'employee'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Employees ({employeeMetrics.activeCount})</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {activeTab === 'company' ? 'Initial Capital Debt' : 'Total Advances Granted'}
                        </span>
                        <span className="text-xl font-black text-slate-900">{currentMetrics.original}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                        <Landmark className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {activeTab === 'company' ? 'Principal Amount Paid' : 'Total Repaid / Deducted'}
                        </span>
                        <span className="text-xl font-black text-emerald-600">{currentMetrics.paid}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {activeTab === 'company' ? 'Net Remaining Liability' : 'Outstanding Balances'}
                        </span>
                        <span className="text-xl font-black text-rose-600">{currentMetrics.remaining}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Main Content: Creation Form (Left) & Filterable Registry (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Focused Creation Form */}
                <div className="lg:col-span-4 space-y-4">
                    {activeTab === 'company' ? (
                        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
                            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4 text-[#8DB600]" />
                                    <span>Log Company Debt</span>
                                </h3>
                            </CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleNewDebtSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Date of Initiation</Label>
                                        <Input
                                            type="date"
                                            value={debtDate}
                                            onChange={e => setDebtDate(e.target.value)}
                                            required
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Account Description</Label>
                                        <Input
                                            type="text"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="e.g., Solar Dryer Repair, Vehicle Registration"
                                            required
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Total Principal (₱)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={totalDebtAmount}
                                            onChange={e => setTotalDebtAmount(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Installment (₱)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={weeklyPaymentAmount}
                                                onChange={e => setWeeklyPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Frequency</Label>
                                            <Select
                                                value={debtFrequency}
                                                onChange={e => setDebtFrequency(e.target.value)}
                                                required
                                                className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                            >
                                                <option value="Weekly">Weekly</option>
                                                <option value="Every 15 days">Every 15 days</option>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={createDebtMutation.isPending || isDemo}
                                        className="w-full h-10 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                                    >
                                        {createDebtMutation.isPending ? 'Logging...' : 'Save Company Debt'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border border-indigo-100 shadow-2xs rounded-2xl bg-white overflow-hidden">
                            <CardHeader className="px-5 py-4 border-b border-indigo-50 bg-indigo-50/40">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                                    <span>Log Employee Advance (Bale)</span>
                                </h3>
                            </CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleNewEmpDebtSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Date of Advance</Label>
                                        <Input
                                            type="date"
                                            value={empDebtDate}
                                            onChange={e => setEmpDebtDate(e.target.value)}
                                            required
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Employee Name</Label>
                                        <Select
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                            required
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                        >
                                            <option value="" disabled>-- Select Staff Member --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Reason (Optional)</Label>
                                        <Input
                                            type="text"
                                            value={empReason}
                                            onChange={e => setEmpReason(e.target.value)}
                                            placeholder="e.g., Medical Emergency, Motor Repair"
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Total Advance Amount (₱)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={empTotalDebtAmount}
                                            onChange={e => setEmpTotalDebtAmount(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Deduction (₱)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={empWeeklyPaymentAmount}
                                                onChange={e => setEmpWeeklyPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Frequency</Label>
                                            <Select
                                                value={empDebtFrequency}
                                                onChange={e => setEmpDebtFrequency(e.target.value)}
                                                required
                                                className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                            >
                                                <option value="Weekly">Weekly</option>
                                                <option value="Every 15 days">Every 15 days</option>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={createDebtMutation.isPending || isDemo}
                                        className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                                    >
                                        {createDebtMutation.isPending ? 'Logging...' : 'Save Employee Debt'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Liability Registry with Status Filter Chips */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <div className="text-xs font-bold text-slate-700">
                            <span>{activeTab === 'company' ? 'Company Liability Registry' : 'Employee Liability Registry'}</span>
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                    statusFilter === 'active'
                                        ? 'bg-slate-900 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                                    statusFilter === 'cleared'
                                        ? 'bg-slate-900 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                                    statusFilter === 'all'
                                        ? 'bg-slate-900 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                All ({currentMetrics.totalCount})
                            </button>
                        </div>
                    </div>

                    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardContent className="p-0">
                            <DebtTable
                                data={displayedDebts}
                                emptyMessage={statusFilter === 'active' ? 'No active debts found. All cleared!' : 'No debt records found.'}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* INLINE PAYMENT SETTLEMENT MODAL */}
            {paymentModalTarget && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <Receipt className="w-4 h-4" />
                                </div>
                                <span>Record Payment / Amortization</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPaymentModalTarget(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmPaymentSubmit} className="p-6 space-y-4">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Account</span>
                                    <span className="font-bold text-slate-900">{paymentModalTarget.description}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                                    <span className="font-black text-sm text-rose-600">
                                        {currency(paymentModalTarget.remainingDebt, { symbol: '₱' }).format()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Settlement Date</Label>
                                <Input
                                    type="date"
                                    value={paymentDate}
                                    onChange={e => setPaymentDate(e.target.value)}
                                    required
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Amount to Pay (₱)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    autoFocus
                                    className="h-10 mt-1 text-sm font-mono font-bold rounded-xl border-slate-200 focus:border-emerald-600"
                                />
                            </div>

                            {(!paymentModalTarget.type || paymentModalTarget.type === 'company') && (
                                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                    <span>This repayment will automatically log an expense under <strong>Debt Repayment</strong>.</span>
                                </div>
                            )}

                            <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPaymentModalTarget(null)}
                                    className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingPayment}
                                    className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                                >
                                    {isSubmittingPayment ? 'Saving...' : 'Confirm Payment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT ACCOUNT MODAL */}
            {editingDebt && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-blue-600" />
                                <span>Edit Account Details (#{editingDebt.id})</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingDebt(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateDebtSubmit} className="p-6 space-y-4">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Account Title</Label>
                                <Input
                                    type="text"
                                    value={editingDebt.description || ''}
                                    onChange={(e) => setEditingDebt({ ...editingDebt, description: e.target.value })}
                                    required
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Total Principal (₱)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editingDebt.total_debt_amount || ''}
                                    onChange={(e) => setEditingDebt({ ...editingDebt, total_debt_amount: e.target.value })}
                                    required
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Installment (₱)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editingDebt.weekly_payment_amount || ''}
                                        onChange={(e) => setEditingDebt({ ...editingDebt, weekly_payment_amount: e.target.value })}
                                        className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Frequency</Label>
                                    <Select
                                        value={editingDebt.frequency || 'Weekly'}
                                        onChange={(e) => setEditingDebt({ ...editingDebt, frequency: e.target.value })}
                                        className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                    >
                                        <option value="Weekly">Weekly</option>
                                        <option value="Every 15 days">Every 15 days</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Date of Initiation</Label>
                                <Input
                                    type="date"
                                    value={editingDebt.debt_date ? format(parseISO(editingDebt.debt_date), 'yyyy-MM-dd') : ''}
                                    onChange={(e) => setEditingDebt({ ...editingDebt, debt_date: e.target.value })}
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                />
                            </div>

                            <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingDebt(null)}
                                    className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUpdatingDebt}
                                    className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                                >
                                    {isUpdatingDebt ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}