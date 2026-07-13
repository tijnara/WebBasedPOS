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
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea
} from '../ui';
import { Landmark, PlusCircle, CreditCard, Calendar, BarChart3, TrendingDown, History, Users } from 'lucide-react';

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
                employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : null // Added employee_id here
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

        try {
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(selectedEmpDebtId, 10),
                amount_paid: parseFloat(empAmountPaid),
                date_paid: empDatePaid
            });
            addToast({ title: 'Success', description: 'Employee payment logged (No expense triggered).', variant: 'success' });
            setEmpAmountPaid(''); setSelectedEmpDebtId('');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const DebtTable = ({ data, emptyMessage }) => (
        <ScrollArea className="h-[400px] w-full">
            <div className="overflow-x-auto w-full">
                <Table className="min-w-[900px] w-full !block">
                    <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10">
                        <TableRow>
                            <TableHead>Account ID</TableHead>
                            <TableHead>Date & Desc.</TableHead>
                            <TableHead>Principal Debt</TableHead>
                            <TableHead>Payment Cadence</TableHead>
                            <TableHead className="w-64">Amortization History</TableHead>
                            <TableHead>Total Cleared</TableHead>
                            <TableHead className="text-right">Remaining Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-12">Loading...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">{emptyMessage}</TableCell></TableRow>
                        ) : (
                            data.map((debt) => (
                                <TableRow key={debt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 align-top">
                                    <TableCell className="font-mono text-xs font-bold pt-4">#{debt.id}</TableCell>
                                    <TableCell className="pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{debt.description}</span>
                                            <span className="text-xs text-gray-500">{format(parseISO(debt.debt_date), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium pt-4 whitespace-nowrap">{currency(debt.total_debt_amount, { symbol: '₱' }).format()}</TableCell>
                                    <TableCell className="text-xs text-gray-500 pt-4 whitespace-nowrap">
                                        {currency(debt.weekly_payment_amount, { symbol: '₱' }).format()}
                                        {(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}
                                    </TableCell>
                                    <TableCell className="pt-4">
                                        {debt.sortedPayments.length > 0 ? (
                                            <ScrollArea className="h-24 w-full pr-2">
                                                <ul className="space-y-2">
                                                    {debt.sortedPayments.map(payment => (
                                                        <li key={payment.id} className="flex justify-between items-center text-xs pb-1 border-b">
                                                            <span className="text-gray-500">{format(parseISO(payment.date_paid), 'MMM dd, yyyy')}</span>
                                                            <span className="text-green-600 font-semibold">+{currency(payment.amount_paid, { symbol: '₱' }).format()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </ScrollArea>
                                        ) : <span className="text-xs text-gray-400">No payments yet.</span>}
                                    </TableCell>
                                    <TableCell className="text-sm font-semibold text-green-600 pt-4">{currency(debt.totalPaid, { symbol: '₱' }).format()}</TableCell>
                                    <TableCell className="text-right font-black text-sm text-red-600 pt-4">{currency(debt.remainingDebt, { symbol: '₱' }).format()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </ScrollArea>
    );

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
                            <CardHeader className="pb-3 border-b"><h3 className="font-bold text-base">Company Liability Registry</h3></CardHeader>
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