// src/components/pages/SalaryMonitoringPage.jsx
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui';
import { useSalaryRecords, useCreateSalary } from '../../hooks/useSalary';
import currency from 'currency.js';
import { format, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';

// --- Date Math Helpers ---
const getInitialPeriod = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    // If today is 1st-15th, show 1st-15th. If 16th+, show 16th-End.
    if (day <= 15) {
        return {
            start: format(new Date(year, month, 1), 'yyyy-MM-dd'),
            end: format(new Date(year, month, 15), 'yyyy-MM-dd')
        };
    } else {
        return {
            start: format(new Date(year, month, 16), 'yyyy-MM-dd'),
            end: format(endOfMonth(today), 'yyyy-MM-dd')
        };
    }
};

const getPrevPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 16) {
        // Move back to 1st-15th of the SAME month
        return {
            start: format(new Date(year, month, 1), 'yyyy-MM-dd'),
            end: format(new Date(year, month, 15), 'yyyy-MM-dd')
        };
    } else {
        // Move back to 16th-End of PREVIOUS month
        const prevMonthDate = subMonths(currentStart, 1);
        return {
            start: format(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 16), 'yyyy-MM-dd'),
            end: format(endOfMonth(prevMonthDate), 'yyyy-MM-dd')
        };
    }
};

const getNextPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        // Move forward to 16th-End of SAME month
        return {
            start: format(new Date(year, month, 16), 'yyyy-MM-dd'),
            end: format(endOfMonth(currentStart), 'yyyy-MM-dd')
        };
    } else {
        // Move forward to 1st-15th of NEXT month
        const nextMonthDate = addMonths(currentStart, 1);
        return {
            start: format(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1), 'yyyy-MM-dd'),
            end: format(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 15), 'yyyy-MM-dd')
        };
    }
};

export default function SalaryMonitoringPage() {
    const { user, addToast } = useStore();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.isadmin;
    
    // Period State
    const [period, setPeriod] = useState(getInitialPeriod());

    const { data: salaryRecords, isLoading } = useSalaryRecords(period.start, period.end);
    const createSalary = useCreateSalary();

    const [employeeName, setEmployeeName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('Salary Payout');

    // Calculate total for current view
    const periodTotal = useMemo(() => {
        return salaryRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    }, [salaryRecords]);

    if (!isAdmin) {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
    }

    const handleAddSalary = async (e) => {
        e.preventDefault();
        if (!employeeName.trim() || !amount || !date) return;

        try {
            await createSalary.mutateAsync({ employeeName, amount, description, date });
            addToast({ title: 'Success', description: 'Salary recorded successfully', variant: 'success' });
            setAmount('');
            setEmployeeName(''); 
            setDescription('Salary Payout');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6 responsive-page max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Salary Monitoring</h1>
                <p className="text-gray-500 text-sm">Manage staff salaries. Records here automatically sync with your general Expenses.</p>
            </div>

            {/* RECORD SALARY FORM */}
            <Card>
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <h3 className="font-bold text-blue-800">Record Salary Payment</h3>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleAddSalary} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <Label>Employee Name</Label>
                            <Input type="text" placeholder="e.g. John Doe" value={employeeName} onChange={e => setEmployeeName(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Label>Amount (₱)</Label>
                            <Input type="number" step="0.01" min="1" value={amount} onChange={e => setAmount(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Label>Description</Label>
                            <Input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Button type="submit" disabled={createSalary.isPending} className="btn--primary w-full h-11">
                                {createSalary.isPending ? 'Saving...' : 'Record'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* BI-MONTHLY HISTORY */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-end border-b border-gray-100 pb-4">
                    <div>
                        <h3 className="font-bold">Salary History</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            Period: {format(new Date(period.start), 'MMM d, yyyy')} — {format(new Date(period.end), 'MMM d, yyyy')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period Total</p>
                        <p className="text-xl font-bold text-red-600">{currency(periodTotal, { symbol: '₱' }).format()}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan="4" className="text-center py-6 text-gray-500">Loading...</TableCell></TableRow>
                            ) : salaryRecords?.length === 0 ? (
                                <TableRow><TableCell colSpan="4" className="text-center py-8 text-gray-500 font-medium">No salary records for this period.</TableCell></TableRow>
                            ) : (
                                salaryRecords?.map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell>{format(new Date(record.expense_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-bold text-gray-800">{record.employee_name || 'N/A'}</TableCell>
                                        <TableCell className="text-gray-500">{record.description}</TableCell>
                                        <TableCell className="text-right text-red-600 font-bold">
                                            {currency(record.amount, { symbol: '₱' }).format()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    
                    {/* PAGINATION / PERIOD NAVIGATION */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
                        <button
                            onClick={() => setPeriod(getPrevPeriod(period.start))}
                            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous Period
                        </button>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {format(new Date(period.start), 'MMM d')} - {format(new Date(period.end), 'MMM d')}
                        </span>
                        <button
                            onClick={() => setPeriod(getNextPeriod(period.start))}
                            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            Next Period <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
