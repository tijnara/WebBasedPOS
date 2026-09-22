// src/components/pages/DebtManagementPage.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useDebts, useCreateDebt, useCreateDebtPayment } from '../../hooks/useDebts';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useEmployees } from '../../hooks/useEmployees';
import { useStore } from '../../store/useStore';
import currency from 'currency.js';
import { format, parseISO } from 'date-fns';
import {
    Card, CardHeader, CardContent, Button, Input, Label, Select,
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../ui';
import { Landmark, PlusCircle, CreditCard, Calendar, BarChart3, TrendingDown, History, Users, ChevronDown, ChevronUp } from 'lucide-react';

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

export default function DebtManagementPage() {
    const { user } = useStore(s => ({ user: s.user }));
    const isDemo = user?.isDemo;
    const addToast = useStore(s => s.addToast);

    // Queries
    const { data: debts = [], isLoading } = useDebts();
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

    // Process Debts & Separate Company vs Employee
    const { companyDebts, employeeDebts } = useMemo(() => {
        const processed = debts.map(debt => {
            const totalPaid = (debt.debt_payments || []).reduce((sum, payment) => {
                return sum.add(currency(payment.amount_paid));
            }, currency(0)).value;

            const remainingDebt = currency(debt.total_debt_amount).subtract(totalPaid).value;
            const sortedPayments = [...(debt.debt_payments || [])].sort(
                (a, b) => new Date(b.date_paid) - new Date(a.date_paid)
            );

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
                weekly_payment_amount: parseFloat(weeklyPaymentAmount),
                frequency: debtFrequency,
                type: 'company'
            });
            addToast({ title: 'Success', description: 'Company debt logged.', variant: 'success' });
            setDescription(''); setTotalDebtAmount(''); setWeeklyPaymentAmount(''); setDebtFrequency('Weekly');
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
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // === EMPLOYEE HANDLERS ===
    const handleNewEmpDebtSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) return addToast({ title: 'Demo', description: 'Disabled in demo.', variant: 'warning' });

        const employee = employees.find(emp => emp.id.toString() === selectedEmployeeId);
        const employeeName = employee ? employee.name : 'Unknown Employee';
        const finalDescription = empReason.trim() ? `${employeeName} - ${empReason}` : employeeName;

        try {
            await createDebtMutation.mutateAsync({
                debt_date: empDebtDate,
                description: finalDescription,
                total_debt_amount: parseFloat(empTotalDebtAmount),
                weekly_payment_amount: parseFloat(empWeeklyPaymentAmount),
                frequency: empDebtFrequency,
                type: 'employee',
                employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : null
            });
            addToast({ title: 'Success', description: 'Employee debt logged.', variant: 'success' });

            setSelectedEmployeeId('');
            setEmpReason('');
            setEmpTotalDebtAmount('');
            setEmpWeeklyPaymentAmount('');
            setEmpDebtFrequency('Weekly');
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

            await createExpenseMutation.mutateAsync({
                expense_date: empDatePaid,
                category: 'Debt Repayment',
                description: `Manual Repayment - ${targetDebt?.description || `Account #${selectedEmpDebtId}`}`,
                amount: -Math.abs(parseFloat(empAmountPaid))
            });

            addToast({ title: 'Success', description: 'Employee payment and expense logged.', variant: 'success' });
            setEmpAmountPaid(''); setSelectedEmpDebtId('');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // ========================================================
    // REFACTORED TABLE COMPONENT (Dual Desktop/Mobile Layout)
    // ========================================================
    const DebtTable = ({ data, emptyMessage }) => {
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
            return <div className="text-center py-12 text-gray-500">Loading...</div>;
        }

        if (data.length === 0) {
            return <div className="text-center py-12 text-gray-400">{emptyMessage}</div>;
        }

        return (
            <div className="w-full">
                {/* --- DESKTOP VIEW --- */}
                <div className="hidden md:block w-full overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80">
                            <TableRow>
                                <TableHead className="whitespace-nowrap">Account Details</TableHead>
                                <TableHead className="whitespace-nowrap">Terms</TableHead>
                                <TableHead className="w-1/4 min-w-[150px]">Progress</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Remaining</TableHead>
                                <TableHead className="w-12 text-center">History</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((debt) => {
                                const isExpanded = expandedRows.has(debt.id);
                                const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                                const isFullyPaid = debt.remainingDebt <= 0;

                                return (
                                    <React.Fragment key={debt.id}>
                                        <TableRow className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${isFullyPaid ? 'opacity-50 bg-gray-50/30' : ''}`}>
                                            <TableCell className="py-4">
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{debt.description}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">#{debt.id} • {format(parseISO(debt.debt_date), 'MMM dd, yyyy')}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{currency(debt.total_debt_amount, { symbol: '₱' }).format()}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {currency(debt.weekly_payment_amount, { symbol: '₱' }).format()}
                                                    {(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 overflow-hidden flex">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-green-500' : 'bg-primary'}`}
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-1.5">
                                                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                                                        {currency(debt.totalPaid, { symbol: '₱' }).format()} paid
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500">
                                                        {Math.round(progressPct)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className={`font-black text-sm ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                    {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                                </div>
                                                {isFullyPaid && <div className="text-[10px] text-green-600 font-bold uppercase mt-0.5 tracking-widest">Cleared</div>}
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-8 w-8 p-0 rounded-full transition-colors ${isExpanded ? 'bg-primary text-white hover:bg-primary-hover hover:text-white' : 'text-gray-500 hover:text-primary hover:bg-primary/10'}`}
                                                    onClick={() => toggleRow(debt.id)}
                                                    title="View Payment History"
                                                >
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expandable History Drawer */}
                                        {isExpanded && (
                                            <TableRow className="bg-gray-50/80 dark:bg-gray-800/40 border-b-2 border-b-gray-200 dark:border-b-gray-700">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="p-4 sm:p-6 border-l-4 border-l-primary">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <History className="w-4 h-4 text-primary" />
                                                            <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amortization History</h4>
                                                        </div>
                                                        {debt.sortedPayments.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {debt.sortedPayments.map(payment => (
                                                                    <div key={payment.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{format(parseISO(payment.date_paid), 'MMMM dd, yyyy')}</span>
                                                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">TXN #{payment.id}</span>
                                                                        </div>
                                                                        <span className="text-sm font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-md">
                                                                            +{currency(payment.amount_paid, { symbol: '₱' }).format()}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-sm">
                                                                <span className="text-sm text-gray-400 font-medium">No payments have been recorded for this account yet.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* --- MOBILE VIEW (Stacked Cards) --- */}
                <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {data.map((debt) => {
                        const isExpanded = expandedRows.has(debt.id);
                        const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                        const isFullyPaid = debt.remainingDebt <= 0;

                        return (
                            <div key={debt.id} className={`p-4 ${isFullyPaid ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{debt.description}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">#{debt.id} • {format(parseISO(debt.debt_date), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-black text-sm ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                                            {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                        </div>
                                        {isFullyPaid && <div className="text-[10px] text-green-600 font-bold uppercase mt-0.5 tracking-widest">Cleared</div>}
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs mb-3">
                                    <span className="text-gray-600 dark:text-gray-400">Principal: <span className="font-medium text-gray-900 dark:text-gray-200">{currency(debt.total_debt_amount, { symbol: '₱' }).format()}</span></span>
                                    <span className="text-gray-600 dark:text-gray-400">Terms: <span className="font-medium text-gray-900 dark:text-gray-200">{currency(debt.weekly_payment_amount, { symbol: '₱' }).format()}{(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}</span></span>
                                </div>

                                <div className="mb-4">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden flex">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-green-500' : 'bg-primary'}`}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1.5">
                                        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
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
                                    {isExpanded ? 'Hide History' : 'View History'}
                                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                                </Button>

                                {isExpanded && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                                        {debt.sortedPayments.length > 0 ? (
                                            <div className="space-y-2">
                                                {debt.sortedPayments.map(payment => (
                                                    <div key={payment.id} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2.5 rounded shadow-sm border border-gray-100 dark:border-gray-800">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{format(parseISO(payment.date_paid), 'MMM dd, yyyy')}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">TXN #{payment.id}</span>
                                                        </div>
                                                        <span className="text-xs font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                                            +{currency(payment.amount_paid, { symbol: '₱' }).format()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
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

            {/* ========================================================
                SECTION 1: COMPANY DEBT MANAGEMENT
                ======================================================== */}
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
                        <p className="text-xs text-gray-500 uppercase">Total Principal Amount Paid</p><h3 className="text-2xl font-bold text-green-600">{metrics.paid}</h3>
                    </CardContent></Card>
                    <Card className="border-l-4 border-l-red-500 shadow-sm"><CardContent className="p-5">
                        <p className="text-xs text-gray-500 uppercase">Net Remaining Liability</p><h3 className="text-2xl font-bold text-red-600">{metrics.remaining}</h3>
                    </CardContent></Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    <div className="space-y-6 xl:col-span-1">
                        {/* Company Forms */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4 text-primary" /> Log Company Debt</h3></CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleNewDebtSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Date of Initiation</Label>
                                        <Input type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} required />
                                    </div>
                                    <Input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
                                    <Input type="number" value={totalDebtAmount} onChange={e => setTotalDebtAmount(e.target.value)} placeholder="Total Principal (₱)" required />

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs font-semibold text-gray-600">Installment (₱)</Label>
                                            <Input type="number" value={weeklyPaymentAmount} onChange={e => setWeeklyPaymentAmount(e.target.value)} placeholder="0.00" required />
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
                            <CardHeader className="pb-3 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-green-600" /> Amortization Log</h3></CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600">Payment Settlement Date</Label>
                                        <Input type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)} required />
                                    </div>
                                    <Select value={selectedDebtId} onChange={(e) => {
                                        setSelectedDebtId(e.target.value);
                                        const d = companyDebts.find(d => d.id.toString() === e.target.value);
                                        if (d) setAmountPaid(d.weekly_payment_amount);
                                    }} required>
                                        <option value="" disabled>-- Select Company Debt --</option>
                                        {companyDebts.filter(d => d.remainingDebt > 0).map(d => (
                                            <option key={d.id} value={d.id}>{d.description} (Rem: ₱{d.remainingDebt.toFixed(2)})</option>
                                        ))}
                                    </Select>
                                    <Input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Amount (₱)" required />
                                    <Button type="submit" variant="success" className="w-full">Confirm Payment & Log Expense</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="xl:col-span-3">
                        <Card className="shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-gray-50/50"><h3 className="font-bold text-base text-gray-800">Company Liability Registry</h3></CardHeader>
                            <CardContent className="p-0"><DebtTable data={companyDebts} emptyMessage="No company debts found." /></CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ========================================================
                SECTION 2: EMPLOYEE DEBT MANAGEMENT
                ======================================================== */}
            <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-indigo-500 w-7 h-7" /> Employee Debt Management</h1>
                    <p className="text-sm text-gray-500">Log cash advances/debts for staff. Payments here will NOT trigger company expenses.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    <div className="space-y-6 xl:col-span-1">
                        {/* Employee Forms */}
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

                                    <Input type="number" value={empTotalDebtAmount} onChange={e => setEmpTotalDebtAmount(e.target.value)} placeholder="Total Advance (₱)" required />

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs font-semibold text-gray-600">Deduction (₱)</Label>
                                            <Input type="number" value={empWeeklyPaymentAmount} onChange={e => setEmpWeeklyPaymentAmount(e.target.value)} placeholder="0.00" required />
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
                                        if (d) setEmpAmountPaid(d.weekly_payment_amount);
                                    }} required>
                                        <option value="" disabled>-- Select Account --</option>
                                        {employeeDebts.filter(d => d.remainingDebt > 0).map(d => (
                                            <option key={d.id} value={d.id}>{d.description} (Rem: ₱{d.remainingDebt.toFixed(2)})</option>
                                        ))}
                                    </Select>
                                    <Input type="number" value={empAmountPaid} onChange={e => setEmpAmountPaid(e.target.value)} placeholder="Amount (₱)" required />
                                    <Button type="submit" variant="success" className="w-full">Confirm Employee Payment</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="xl:col-span-3">
                        <Card className="shadow-sm overflow-hidden border-indigo-100">
                            <CardHeader className="pb-3 border-b bg-indigo-50/30"><h3 className="font-bold text-base text-indigo-900">Employee Liability Registry</h3></CardHeader>
                            <CardContent className="p-0"><DebtTable data={employeeDebts} emptyMessage="No employee debts found." /></CardContent>
                        </Card>
                    </div>
                </div>
            </div>

        </div>
    );
}