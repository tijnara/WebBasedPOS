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
    ChevronDown, ChevronUp, Edit2, Trash2, CheckCircle2, Receipt
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

    // Queries
    const { data: debts = [], isLoading, refetch } = useDebts();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const createDebtMutation = useCreateDebt();
    const createPaymentMutation = useCreateDebtPayment();
    const createExpenseMutation = useCreateExpense();

    // Form State: Company Debt
    const [debtDate, setDebtDate] = useState(getPhilippineDateString());
    const [description, setDescription] = useState('');
    const [totalDebtAmount, setTotalDebtAmount] = useState('');
    const [weeklyPaymentAmount, setWeeklyPaymentAmount] = useState('');
    const [debtFrequency, setDebtFrequency] = useState('Weekly');

    const [selectedDebtId, setSelectedDebtId] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [datePaid, setDatePaid] = useState(getPhilippineDateString());

    // Form State: Employee Debt
    const [empDebtDate, setEmpDebtDate] = useState(getPhilippineDateString());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [empReason, setEmpReason] = useState('');
    const [empTotalDebtAmount, setEmpTotalDebtAmount] = useState('');
    const [empWeeklyPaymentAmount, setEmpWeeklyPaymentAmount] = useState('');
    const [empDebtFrequency, setEmpDebtFrequency] = useState('Weekly');

    const [selectedEmpDebtId, setSelectedEmpDebtId] = useState('');
    const [empAmountPaid, setEmpAmountPaid] = useState('');
    const [empDatePaid, setEmpDatePaid] = useState(getPhilippineDateString());

    // Edit Modal State
    const [editingDebt, setEditingDebt] = useState(null);
    const [isUpdatingDebt, setIsUpdatingDebt] = useState(false);

    // Process Debts & Separate Company vs Employee
    const { companyDebts, employeeDebts } = useMemo(() => {
        const processed = debts.map(debt => {
            const rawPayments = debt.debt_payments || [];

            // Isolate payments belonging strictly to this debt
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
                return dateB - dateA;
            });

            return { ...debt, totalPaid, remainingDebt, sortedPayments };
        });

        return {
            companyDebts: processed.filter(d => !d.type || d.type === 'company'),
            employeeDebts: processed.filter(d => d.type === 'employee')
        };
    }, [debts]);

    const metrics = useMemo(() => {
        let original = currency(0), paid = currency(0), remaining = currency(0);
        companyDebts.forEach(d => {
            original = original.add(d.total_debt_amount);
            paid = paid.add(d.totalPaid);
            remaining = remaining.add(d.remainingDebt);
        });
        return {
            original: original.format({ symbol: '₱' }),
            paid: paid.format({ symbol: '₱' }),
            remaining: remaining.format({ symbol: '₱' })
        };
    }, [companyDebts]);

    // === COMPANY HANDLERS ===
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

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });

        const targetDebt = companyDebts.find(d => d.id.toString() === selectedDebtId);
        try {
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(selectedDebtId, 10),
                amount_paid: parseFloat(amountPaid),
                date_paid: datePaid
            });

            await createExpenseMutation.mutateAsync({
                expense_date: datePaid,
                category: 'Debt Repayment',
                description: `Amortization - ${targetDebt?.description || `Account #${selectedDebtId}`}`,
                amount: parseFloat(amountPaid)
            });

            addToast({ title: 'Success', description: 'Payment and expense logged.', variant: 'success' });
            setAmountPaid(''); setSelectedDebtId('');
            refetch?.();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // === EMPLOYEE HANDLERS (LINKED TO SALARY MONITORING) ===
    const handleNewEmpDebtSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });

        const employee = employees.find(emp => String(emp.id) === String(selectedEmployeeId));
        const employeeName = employee ? employee.name : 'Unknown Employee';
        const finalDescription = empReason.trim() ? `${employeeName} • ${empReason.trim()}` : employeeName;

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

    const handleEmpPaymentSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });

        const targetDebt = employeeDebts.find(d => d.id.toString() === selectedEmpDebtId);

        try {
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(selectedEmpDebtId, 10),
                amount_paid: parseFloat(empAmountPaid),
                date_paid: empDatePaid
            });

            addToast({ title: 'Success', description: 'Payment logged. Updated in Salary Monitoring.', variant: 'success' });
            setEmpAmountPaid(''); setSelectedEmpDebtId('');
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // === ACCOUNT DATA MANAGEMENT (EDIT & DELETE) ===
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

            addToast({ title: 'Updated', description: `Account #${editingDebt.id} updated successfully.`, variant: 'success' });
            setEditingDebt(null);
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (err) {
            console.error('Update debt error:', err);
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

            addToast({ title: 'Deleted', description: `Account #${debt.id} deleted successfully.`, variant: 'success' });
            refetch?.();
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (err) {
            console.error('Delete debt error:', err);
            addToast({ title: 'Delete Error', description: err.message, variant: 'destructive' });
        }
    };

    // ========================================================
    // REFACTORED TABLE COMPONENT (FULL-WIDTH HISTORY DRAWER)
    // ========================================================
    const DebtTable = ({ data, emptyMessage, onEdit, onDelete }) => {
        const [expandedRows, setExpandedRows] = useState(new Set());

        const toggleRow = (id) => {
            const newSet = new Set(expandedRows);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            setExpandedRows(newSet);
        };

        if (isLoading) {
            return <div className="text-center py-12 text-gray-500 font-medium text-xs">Loading liabilities...</div>;
        }

        if (data.length === 0) {
            return <div className="text-center py-12 text-gray-400 font-medium text-xs">{emptyMessage}</div>;
        }

        return (
            <div className="w-full">
                {/* --- DESKTOP VIEW --- */}
                <div className="hidden md:block w-full overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80">
                            <TableRow>
                                <TableHead className="whitespace-nowrap">Account Details</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Terms</TableHead>
                                <TableHead className="w-1/4 min-w-[160px] text-center">Progress</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Remaining</TableHead>
                                <TableHead className="w-24 text-center">History</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((debt) => {
                                const isExpanded = expandedRows.has(debt.id);
                                const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                                const isFullyPaid = debt.remainingDebt <= 0;

                                return (
                                    <React.Fragment key={debt.id}>
                                        <TableRow className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${isFullyPaid ? 'opacity-60 bg-gray-50/30' : ''}`}>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                        {debt.description}
                                                    </span>
                                                    {isFullyPaid && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Cleared
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-1">
                                                    <span>#{debt.id}</span>
                                                    <span>•</span>
                                                    <span>{formatDateSafe(debt.debt_date)}</span>

                                                    <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => onEdit(debt)}
                                                            className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-0.5"
                                                            title="Edit Account Details"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => onDelete(debt)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                                                            title="Delete Debt Account"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right py-4">
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                    {currency(debt.total_debt_amount, { symbol: '₱' }).format()}
                                                </div>
                                                <div className="text-[11px] text-gray-500 mt-0.5">
                                                    {currency(debt.weekly_payment_amount || 0, { symbol: '₱' }).format()}
                                                    {(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 px-2">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-primary'}`}
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold">
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        {currency(debt.totalPaid, { symbol: '₱' }).format()} PAID
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {Math.round(progressPct)}%
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right py-4">
                                                <div className={`font-black text-sm ${isFullyPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-8 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all mx-auto ${
                                                        isExpanded
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 shadow-inner'
                                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400'
                                                    }`}
                                                    onClick={() => toggleRow(debt.id)}
                                                    title={isExpanded ? 'Hide History' : 'View Payment History'}
                                                >
                                                    <span>{debt.sortedPayments.length}</span>
                                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && (
                                            <tr className="bg-gray-50/70 dark:bg-gray-800/40 border-b-2 border-b-gray-200 dark:border-b-gray-700">
                                                <td colSpan={5} className="p-0 w-full">
                                                    <div className="w-full p-4 sm:p-5 border-l-4 border-l-emerald-600 bg-gray-50/80 dark:bg-gray-800/60 animate-in fade-in duration-150">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Receipt className="w-4 h-4 text-emerald-600" />
                                                            <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                                Amortization History ({debt.sortedPayments.length})
                                                            </h4>
                                                        </div>

                                                        {debt.sortedPayments.length > 0 ? (
                                                            <div className="flex flex-wrap gap-3 w-full">
                                                                {debt.sortedPayments.map((payment, idx) => (
                                                                    <div
                                                                        key={payment.id || idx}
                                                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 shadow-xs min-w-[210px] flex-1 sm:flex-initial"
                                                                    >
                                                                        <div className="flex flex-col min-w-0 pr-1">
                                                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                                                                {formatDateSafe(payment.date_paid || payment.payment_date, 'MMM dd, yyyy')}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                                                TXN #{payment.id || idx + 1}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                                                                            +{currency(payment.amount_paid, { symbol: '₱' }).format()}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                                                                <span className="text-xs text-gray-400 font-medium italic">
                                                                    No payments have been recorded for this account yet.
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* --- MOBILE VIEW --- */}
                <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {data.map((debt) => {
                        const isExpanded = expandedRows.has(debt.id);
                        const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                        const isFullyPaid = debt.remainingDebt <= 0;

                        return (
                            <div key={debt.id} className={`p-4 ${isFullyPaid ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                                            {debt.description}
                                            {isFullyPaid && (
                                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                    Cleared
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                                            <span>#{debt.id}</span>
                                            <span>•</span>
                                            <span>{formatDateSafe(debt.debt_date)}</span>
                                            <div className="flex items-center gap-1 ml-1.5 border-l border-gray-200 pl-1.5">
                                                <button type="button" onClick={() => onEdit(debt)} className="p-0.5 text-gray-400 hover:text-emerald-600">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button type="button" onClick={() => onDelete(debt)} className="p-0.5 text-gray-400 hover:text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-black text-sm ${isFullyPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs mb-3">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Principal: <span className="font-medium text-gray-900 dark:text-gray-200">{currency(debt.total_debt_amount, { symbol: '₱' }).format()}</span>
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Terms: <span className="font-medium text-gray-900 dark:text-gray-200">{currency(debt.weekly_payment_amount || 0, { symbol: '₱' }).format()}{(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}</span>
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-primary'}`}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1.5">
                                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                            {currency(debt.totalPaid, { symbol: '₱' }).format()} paid
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-500">
                                            {Math.round(progressPct)}%
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full text-xs h-9 flex justify-center items-center gap-2"
                                    onClick={() => toggleRow(debt.id)}
                                >
                                    <History className="w-3.5 h-3.5" />
                                    {isExpanded ? 'Hide History' : `View History (${debt.sortedPayments.length})`}
                                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                                </Button>

                                {isExpanded && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg space-y-2">
                                        {debt.sortedPayments.length > 0 ? (
                                            debt.sortedPayments.map(payment => (
                                                <div key={payment.id} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2.5 rounded shadow-sm border border-gray-100 dark:border-gray-800">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                            {formatDateSafe(payment.date_paid || payment.payment_date)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">TXN #{payment.id}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                                        +{currency(payment.amount_paid, { symbol: '₱' }).format()}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-xs text-gray-400 font-medium border border-dashed border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900">
                                                No payments yet.
                                            </div>
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

    return (
        <div className="p-6 space-y-12 responsive-page max-w-7xl mx-auto">
            <Head>
                <title>Debt Management | Seaside POS</title>
            </Head>

            {/* SECTION 1: COMPANY DEBT MANAGEMENT */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Landmark className="text-primary w-7 h-7" /> Company Debt Management</h1>
                    <p className="text-sm text-gray-500">Log capital liabilities and track real-time amortization balances.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm"><CardContent className="p-5">
                        <p className="text-xs text-gray-500 uppercase">Total Initial Capital Debt</p><h3 className="text-2xl font-bold">{metrics.original}</h3>
                    </CardContent></Card>
                    <Card className="border-l-4 border-l-green-500 shadow-sm"><CardContent className="p-5">
                        <p className="text-xs text-gray-500 uppercase">Total Principal Amount Paid</p><h3 className="text-2xl font-bold text-emerald-600">{metrics.paid}</h3>
                    </CardContent></Card>
                    <Card className="border-l-4 border-l-red-500 shadow-sm"><CardContent className="p-5">
                        <p className="text-xs text-gray-500 uppercase">Net Remaining Liability</p><h3 className="text-2xl font-bold text-red-600">{metrics.remaining}</h3>
                    </CardContent></Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    <div className="space-y-6 xl:col-span-1">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4 text-primary" /> Log Company Debt</h3></CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleNewDebtSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Date of Initiation</Label>
                                        <Input type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} required />
                                    </div>
                                    <Input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
                                    <Input type="number" step="0.01" value={totalDebtAmount} onChange={e => setTotalDebtAmount(e.target.value)} placeholder="Total Principal (₱)" required />

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs font-semibold text-gray-600">Installment (₱)</Label>
                                            <Input type="number" step="0.01" value={weeklyPaymentAmount} onChange={e => setWeeklyPaymentAmount(e.target.value)} placeholder="0.00" />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs font-semibold text-gray-600">Frequency</Label>
                                            <Select value={debtFrequency} onChange={e => setDebtFrequency(e.target.value)} required>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Every 15 days">Every 15 days</option>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={createDebtMutation.isPending}>Save Company Debt</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" /> Amortization Log</h3></CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Payment Settlement Date</Label>
                                        <Input type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)} required />
                                    </div>
                                    <Select value={selectedDebtId} onChange={(e) => {
                                        setSelectedDebtId(e.target.value);
                                        const d = companyDebts.find(d => d.id.toString() === e.target.value);
                                        if (d) setAmountPaid(d.weekly_payment_amount || '');
                                    }} required>
                                        <option value="" disabled>-- Select Company Debt --</option>
                                        {companyDebts.filter(d => d.remainingDebt > 0).map(d => (
                                            <option key={d.id} value={d.id}>{d.description} (Rem: ₱{d.remainingDebt.toFixed(2)})</option>
                                        ))}
                                    </Select>
                                    <Input type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Amount (₱)" required />
                                    <Button type="submit" variant="success" className="w-full">Confirm Payment & Log Expense</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="xl:col-span-3">
                        <Card className="shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-gray-50/50"><h3 className="font-bold text-base text-gray-800">Company Liability Registry</h3></CardHeader>
                            <CardContent className="p-0">
                                <DebtTable
                                    data={companyDebts}
                                    emptyMessage="No company debts found."
                                    onEdit={setEditingDebt}
                                    onDelete={handleDeleteDebt}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* SECTION 2: EMPLOYEE DEBT MANAGEMENT */}
            <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-indigo-500 w-7 h-7" /> Employee Debt Management</h1>
                    <p className="text-sm text-gray-500">Log cash advances/debts for staff. Connected to Salary Monitoring Auto-Deductions.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    <div className="space-y-6 xl:col-span-1">
                        <Card className="shadow-sm border-indigo-100">
                            <CardHeader className="pb-3 border-b bg-indigo-50/30"><h3 className="font-bold text-sm flex items-center gap-2 text-indigo-700"><PlusCircle className="w-4 h-4" /> Log Employee Advance</h3></CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleNewEmpDebtSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Date of Advance</Label>
                                        <Input type="date" value={empDebtDate} onChange={e => setEmpDebtDate(e.target.value)} required />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Employee Name</Label>
                                        <Select
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>-- Select Staff --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Reason (Optional)</Label>
                                        <Input type="text" value={empReason} onChange={e => setEmpReason(e.target.value)} placeholder="e.g., Medical Emergency" />
                                    </div>

                                    <Input type="number" step="0.01" value={empTotalDebtAmount} onChange={e => setEmpTotalDebtAmount(e.target.value)} placeholder="Total Advance (₱)" required />

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs font-semibold text-gray-600">Deduction (₱)</Label>
                                            <Input type="number" step="0.01" value={empWeeklyPaymentAmount} onChange={e => setEmpWeeklyPaymentAmount(e.target.value)} placeholder="0.00" />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs font-semibold text-gray-600">Frequency</Label>
                                            <Select value={empDebtFrequency} onChange={e => setEmpDebtFrequency(e.target.value)} required>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Every 15 days">Every 15 days</option>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createDebtMutation.isPending}>Save Employee Debt</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-indigo-100">
                            <CardHeader className="pb-3 border-b bg-indigo-50/30"><h3 className="font-bold text-sm flex items-center gap-2 text-indigo-700"><Calendar className="w-4 h-4" /> Employee Payment Log</h3></CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleEmpPaymentSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Payment Settlement Date</Label>
                                        <Input type="date" value={empDatePaid} onChange={e => setEmpDatePaid(e.target.value)} required />
                                    </div>
                                    <Select value={selectedEmpDebtId} onChange={(e) => {
                                        setSelectedEmpDebtId(e.target.value);
                                        const d = employeeDebts.find(d => d.id.toString() === e.target.value);
                                        if (d) setEmpAmountPaid(d.weekly_payment_amount || '');
                                    }} required>
                                        <option value="" disabled>-- Select Account --</option>
                                        {employeeDebts.filter(d => d.remainingDebt > 0).map(d => (
                                            <option key={d.id} value={d.id}>{d.description} (Rem: ₱{d.remainingDebt.toFixed(2)})</option>
                                        ))}
                                    </Select>
                                    <Input type="number" step="0.01" value={empAmountPaid} onChange={e => setEmpAmountPaid(e.target.value)} placeholder="Amount (₱)" required />
                                    <Button type="submit" variant="success" className="w-full">Confirm Employee Payment</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="xl:col-span-3">
                        <Card className="shadow-sm overflow-hidden border-indigo-100">
                            <CardHeader className="pb-3 border-b bg-indigo-50/30"><h3 className="font-bold text-base text-indigo-900">Employee Liability Registry</h3></CardHeader>
                            <CardContent className="p-0">
                                <DebtTable
                                    data={employeeDebts}
                                    emptyMessage="No employee debts found."
                                    onEdit={setEditingDebt}
                                    onDelete={handleDeleteDebt}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* MODAL: EDIT ACCOUNT DETAILS */}
            {editingDebt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-sm">Edit Account Details (#{editingDebt.id})</h3>
                            <button
                                type="button"
                                onClick={() => setEditingDebt(null)}
                                className="text-white/80 hover:text-white p-1 font-bold text-lg leading-none transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateDebtSubmit} className="p-5 space-y-4">
                            <div>
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Description / Account Title</Label>
                                <Input
                                    type="text"
                                    value={editingDebt.description || ''}
                                    onChange={(e) => setEditingDebt({ ...editingDebt, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total Principal (₱)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editingDebt.total_debt_amount || ''}
                                    onChange={(e) => setEditingDebt({ ...editingDebt, total_debt_amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Installment (₱)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editingDebt.weekly_payment_amount || ''}
                                        onChange={(e) => setEditingDebt({ ...editingDebt, weekly_payment_amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Frequency</Label>
                                    <Select
                                        value={editingDebt.frequency || 'Weekly'}
                                        onChange={(e) => setEditingDebt({ ...editingDebt, frequency: e.target.value })}
                                    >
                                        <option value="Weekly">Weekly</option>
                                        <option value="Every 15 days">Every 15 days</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Date of Initiation</Label>
                                <Input
                                    type="date"
                                    value={editingDebt.debt_date ? format(parseISO(editingDebt.debt_date), 'yyyy-MM-dd') : ''}
                                    onChange={(e) => setEditingDebt({ ...editingDebt, debt_date: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingDebt(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUpdatingDebt}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isUpdatingDebt ? 'Saving Changes...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}