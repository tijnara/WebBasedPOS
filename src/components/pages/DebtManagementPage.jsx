// src/components/pages/DebtManagementPage.jsx
import React, { useState, useMemo } from 'react';
import { useDebts, useCreateDebt, useCreateDebtPayment } from '../../hooks/useDebts';
import { useStore } from '../../store/useStore';
import currency from 'currency.js';
import { format, parseISO } from 'date-fns';
import { 
    Card, CardHeader, CardContent, Button, Input, Label, Select, 
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea 
} from '../ui';
import { Landmark, PlusCircle, CreditCard, Calendar, BarChart3, TrendingDown, History } from 'lucide-react';

export default function DebtManagementPage() {
    const { user } = useStore(s => ({ user: s.user }));
    const isDemo = user?.isDemo;
    const addToast = useStore(s => s.addToast);

    // Queries & Mutations
    const { data: debts = [], isLoading } = useDebts();
    const createDebtMutation = useCreateDebt();
    const createPaymentMutation = useCreateDebtPayment();

    // Form 1 State: New Company Debt
    const [debtDate, setDebtDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState('');
    const [totalDebtAmount, setTotalDebtAmount] = useState('');
    const [weeklyPaymentAmount, setWeeklyPaymentAmount] = useState('');

    // Form 2 State: Quick Payment Log
    const [selectedDebtId, setSelectedDebtId] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [datePaid, setDatePaid] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Processed Data & Calculations
    const processedDebts = useMemo(() => {
        return debts.map(debt => {
            const totalPaid = (debt.debt_payments || []).reduce((sum, payment) => {
                return sum.add(currency(payment.amount_paid));
            }, currency(0)).value;

            const remainingDebt = currency(debt.total_debt_amount).subtract(totalPaid).value;

            // Sort payments newest first for the history list
            const sortedPayments = [...(debt.debt_payments || [])].sort(
                (a, b) => new Date(b.date_paid) - new Date(a.date_paid)
            );

            return {
                ...debt,
                totalPaid,
                remainingDebt,
                sortedPayments
            };
        });
    }, [debts]);

    const metrics = useMemo(() => {
        let original = currency(0);
        let paid = currency(0);
        let remaining = currency(0);

        processedDebts.forEach(d => {
            original = original.add(d.total_debt_amount);
            paid = paid.add(d.totalPaid);
            remaining = remaining.add(d.remainingDebt);
        });

        return {
            original: original.format({ symbol: '₱' }),
            paid: paid.format({ symbol: '₱' }),
            remaining: remaining.format({ symbol: '₱' })
        };
    }, [processedDebts]);

    // Handle Form 1 Submit
    const handleNewDebtSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Actions are disabled in demo mode.', variant: 'warning' });
            return;
        }

        try {
            await createDebtMutation.mutateAsync({
                debt_date: debtDate,
                description: description,
                total_debt_amount: parseFloat(totalDebtAmount),
                weekly_payment_amount: parseFloat(weeklyPaymentAmount)
            });
            addToast({ title: 'Success', description: 'Overall company debt successfully logged.', variant: 'success' });
            setDescription('');
            setTotalDebtAmount('');
            setWeeklyPaymentAmount('');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // Handle Form 2 Submit
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Actions are disabled in demo mode.', variant: 'warning' });
            return;
        }

        if (!selectedDebtId) {
            addToast({ title: 'Selection Error', description: 'Please choose an active debt target.', variant: 'destructive' });
            return;
        }

        try {
            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(selectedDebtId, 10),
                amount_paid: parseFloat(amountPaid),
                date_paid: datePaid
            });
            addToast({ title: 'Payment Saved', description: 'Payment recorded against selected account.', variant: 'success' });
            setAmountPaid('');
            setSelectedDebtId('');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6 responsive-page max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Landmark className="text-primary w-7 h-7" /> Company Debt Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-300">
                        Log capital liabilities, recurring obligations, and track real-time amortization balances.
                    </p>
                </div>
            </div>

            {/* Metrics Ribbon Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Initial Capital Debt</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.original}</h3>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-500 opacity-20" />
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Principal Amount Paid</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">{metrics.paid}</h3>
                        </div>
                        <CreditCard className="w-8 h-8 text-green-500 opacity-20" />
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Remaining Liability</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">{metrics.remaining}</h3>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
                    </CardContent>
                </Card>
            </div>

            {/* Dashboard Split View Section */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                
                {/* Lodgement Operations Panel (1 Column) */}
                <div className="space-y-6 xl:col-span-1">
                    {/* Form 1: New Obligation Entry */}
                    <Card className="shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-3 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                <PlusCircle className="w-4 h-4 text-primary" /> Log New Company Debt
                            </h3>
                        </CardHeader>
                        <CardContent className="p-5">
                            <form onSubmit={handleNewDebtSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="debtDate" className="text-xs font-semibold text-gray-600">Date of Initiation</Label>
                                    <Input id="debtDate" type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} required className="h-10 text-sm mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="description" className="text-xs font-semibold text-gray-600">Description / Purpose</Label>
                                    <Input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Delivery Truck Financing" required className="h-10 text-sm mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="totalAmount" className="text-xs font-semibold text-gray-600">Total Borrowed Principal (₱)</Label>
                                    <Input id="totalAmount" type="number" step="0.01" min="0" value={totalDebtAmount} onChange={e => setTotalDebtAmount(e.target.value)} placeholder="0.00" required className="h-10 text-sm mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="weeklyCadence" className="text-xs font-semibold text-gray-600">Scheduled Weekly Payment (₱)</Label>
                                    <Input id="weeklyCadence" type="number" step="0.01" min="0" value={weeklyPaymentAmount} onChange={e => setWeeklyPaymentAmount(e.target.value)} placeholder="0.00" required className="h-10 text-sm mt-1" />
                                </div>
                                <Button type="submit" variant="primary" className="w-full h-10 text-sm font-semibold" disabled={createDebtMutation.isPending}>
                                    {createDebtMutation.isPending ? 'Saving Record...' : 'Log Liability Account'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Form 2: Amortization Payment Log */}
                    <Card className="shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-3 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-600" /> Quick Amortization Log
                            </h3>
                        </CardHeader>
                        <CardContent className="p-5">
                            <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="targetDebt" className="text-xs font-semibold text-gray-600">Select Target Debt Account</Label>
                                    <Select id="targetDebt" value={selectedDebtId} onChange={e => setSelectedDebtId(e.target.value)} className="h-10 text-sm mt-1 w-full" required>
                                        <option value="" disabled>-- Select Debt Account --</option>
                                        {processedDebts.filter(d => d.remainingDebt > 0).map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.description ? `${d.description} ` : `Ref #${d.id} `}
                                                (Rem: ₱{d.remainingDebt.toFixed(2)})
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="amountPaid" className="text-xs font-semibold text-gray-600">Payment Installment Amount (₱)</Label>
                                    <Input id="amountPaid" type="number" step="0.01" min="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" required className="h-10 text-sm mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="datePaid" className="text-xs font-semibold text-gray-600">Payment Settlement Date</Label>
                                    <Input id="datePaid" type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)} required className="h-10 text-sm mt-1" />
                                </div>
                                <Button type="submit" variant="success" className="w-full h-10 text-sm font-semibold btn--success" disabled={createPaymentMutation.isPending}>
                                    {createPaymentMutation.isPending ? 'Logging Installment...' : 'Confirm Amortization'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Ledger Registry Display Panel (3 Columns on Extra Large Screens) */}
                <div className="xl:col-span-3">
                    <Card className="shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 pb-3 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-base text-gray-800 dark:text-white">Active Liability Registry & Ledger</h3>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[calc(100vh-280px)]">
                                <Table>
                                    <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>Account ID</TableHead>
                                            <TableHead>Date & Desc.</TableHead>
                                            <TableHead>Principal Debt</TableHead>
                                            <TableHead>Weekly Cadence</TableHead>
                                            <TableHead className="w-64">Amortization History</TableHead>
                                            <TableHead>Total Cleared</TableHead>
                                            <TableHead className="text-right">Remaining Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                                    Fetching liability accounts...
                                                </TableCell>
                                            </TableRow>
                                        ) : processedDebts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                                    No corporate balance debts logged found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            processedDebts.map((debt) => (
                                                <TableRow key={debt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all border-b border-gray-100 dark:border-slate-800 align-top">
                                                    <TableCell className="font-mono text-xs font-bold text-slate-500 pt-4">
                                                        #{debt.id}
                                                    </TableCell>
                                                    <TableCell className="pt-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {debt.description || 'No Description'}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                                {format(parseISO(debt.debt_date), 'MMM dd, yyyy')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-900 dark:text-white pt-4">
                                                        {currency(debt.total_debt_amount, { symbol: '₱' }).format()}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-500 dark:text-slate-400 font-medium pt-4">
                                                        {currency(debt.weekly_payment_amount, { symbol: '₱' }).format()} / wk
                                                    </TableCell>
                                                    
                                                    {/* New Amortization History Column */}
                                                    <TableCell className="pt-4">
                                                        {debt.sortedPayments.length > 0 ? (
                                                            <ScrollArea className="h-24 w-full pr-2">
                                                                <ul className="space-y-2">
                                                                    {debt.sortedPayments.map(payment => (
                                                                        <li key={payment.id} className="flex justify-between items-center text-xs border-b border-gray-100 dark:border-slate-800 pb-1 last:border-0">
                                                                            <span className="text-gray-500 flex items-center gap-1">
                                                                                <History className="w-3 h-3" />
                                                                                {format(parseISO(payment.date_paid), 'MMM dd, yyyy')}
                                                                            </span>
                                                                            <span className="text-green-600 font-semibold">
                                                                                +{currency(payment.amount_paid, { symbol: '₱' }).format()}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </ScrollArea>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic flex items-center gap-1">
                                                                No payments logged yet.
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-sm font-semibold text-green-600 pt-4">
                                                        {currency(debt.totalPaid, { symbol: '₱' }).format()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-sm text-red-600 pt-4">
                                                        {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
