// src/components/pages/SalaryMonitoringPage.jsx
// created on 6/16/2026
import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import {
    Card, CardHeader, CardContent, Button, Input, Label, Select,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, ScrollArea
} from '../ui';
import { useSalaryRecords, useCreateSalary, useProcessDeductions } from '../../hooks/useSalary';
import { useEmployees, useManageEmployee } from '../../hooks/useEmployees';
import { useDebts } from '../../hooks/useDebts';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import currency from 'currency.js';
import { format, endOfMonth, subMonths, addMonths, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Edit2, Trash2, Calendar, Calculator, FileText, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

// --- Date Math Helpers ---
const getInitialPeriod = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    if (day <= 15) {
        return {
            start: format(startOfDay(new Date(year, month, 1)), 'yyyy-MM-dd'),
            end: format(endOfDay(new Date(year, month, 15)), 'yyyy-MM-dd')
        };
    } else {
        return {
            start: format(startOfDay(new Date(year, month, 16)), 'yyyy-MM-dd'),
            end: format(endOfDay(endOfMonth(today)), 'yyyy-MM-dd')
        };
    }
};

const getPrevPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 16) {
        return {
            start: format(startOfDay(new Date(year, month, 1)), 'yyyy-MM-dd'),
            end: format(endOfDay(new Date(year, month, 15)), 'yyyy-MM-dd')
        };
    } else {
        const prevMonthDate = subMonths(currentStart, 1);
        return {
            start: format(startOfDay(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 16)), 'yyyy-MM-dd'),
            end: format(endOfDay(endOfMonth(prevMonthDate)), 'yyyy-MM-dd')
        };
    }
};

const getNextPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        return {
            start: format(startOfDay(new Date(year, month, 16)), 'yyyy-MM-dd'),
            end: format(endOfDay(endOfMonth(currentStart)), 'yyyy-MM-dd')
        };
    } else {
        const nextMonthDate = addMonths(currentStart, 1);
        return {
            start: format(startOfDay(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1)), 'yyyy-MM-dd'),
            end: format(endOfDay(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 15)), 'yyyy-MM-dd')
        };
    }
};

export default function SalaryMonitoringPage() {
    useEffect(() => {
        document.title = 'Salary Monitoring | Seaside WRS';
    }, []);

    const { user, addToast } = useStore();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.isadmin;

    const [period, setPeriod] = useState(getInitialPeriod());
    const [filterEmployee, setFilterEmployee] = useState('all');

    // State for custom date range
    const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isCustomRangeActive, setIsCustomRangeActive] = useState(false);

    // ============================================================
    // STATE 1: AUTOMATED PAYROLL SECTION
    // ============================================================
    const [payrollEmpId, setPayrollEmpId] = useState('');
    const [payrollDate, setPayrollDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // ============================================================
    // STATE 2: MANUAL SALARY SECTION
    // ============================================================
    const [employeeName, setEmployeeName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Salary Payout');
    const [payoutDate, setPayoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [excessMultiplier, setExcessMultiplier] = useState('1');

    // Employee Modal State
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [editingEmpId, setEditingEmpId] = useState(null);
    const [empFormName, setEmpFormName] = useState('');
    const [empFormSalary, setEmpFormSalary] = useState('');
    const [empFormSalaryType, setEmpFormSalaryType] = useState('per_day');
    const [empFormMultiplier, setEmpFormMultiplier] = useState('');

    const { data: salaryRecords, isLoading: isSalaryLoading } = useSalaryRecords(period.start, period.end);
    const { data: employees, isLoading: isEmpLoading } = useEmployees();
    const { data: debts = [] } = useDebts();

    // Fetch daily summary for the payoutDate in Manual Record
    const { data: dailySummary } = useSalesSummary({
        startDate: useMemo(() => payoutDate ? startOfDay(new Date(payoutDate)) : null, [payoutDate]),
        endDate: useMemo(() => payoutDate ? endOfDay(new Date(payoutDate)) : null, [payoutDate])
    });
    const dailyGallons = dailySummary?.totalGallons || 0;
    const createSalary = useCreateSalary();
    const processDeductionsMutation = useProcessDeductions();
    const manageEmployee = useManageEmployee();

    const selectedPayrollEmp = employees?.find(e => e.id.toString() === payrollEmpId);
    const payrollEmpName = selectedPayrollEmp?.name || '';

    // Calculate Gross Salary based on the Salary History for the current period
    const payrollGross = useMemo(() => {
        if (!payrollEmpName || !salaryRecords) return 0;
        return salaryRecords
            .filter(r => r.employee_name === payrollEmpName)
            .reduce((sum, r) => sum + Number(r.amount), 0);
    }, [payrollEmpName, salaryRecords]);

    const activeDeductions = useMemo(() => {
        if (!payrollEmpId || !payrollDate) return [];

        // 1. Determine the exact start and end dates of the CURRENT payroll period
        const [y, m, dDay] = payrollDate.split('-').map(Number);
        let periodStart, periodEnd;

        if (dDay <= 15) {
            periodStart = new Date(y, m - 1, 1);   // 1st of the month
            periodEnd = new Date(y, m - 1, 15);    // 15th of the month
        } else {
            periodStart = new Date(y, m - 1, 16);  // 16th of the month
            periodEnd = new Date(y, m, 0);         // Last day of the month
        }

        const empDebts = debts.filter(d =>
            d.type?.toLowerCase() === 'employee' &&
            (d.employee_id === Number(payrollEmpId) || (d.description && d.description.toLowerCase().includes(payrollEmpName.toLowerCase())))
        );

        return empDebts.map(debt => {
            const totalPaid = (debt.debt_payments || []).reduce((sum, p) => sum + Number(p.amount_paid), 0);
            const remainingDebt = Number(debt.total_debt_amount) - totalPaid;

            if (remainingDebt <= 0) return null; // Debt is fully paid off

            // 2. Calculate the base scheduled deduction
            let scheduledDeduction = debt.frequency === 'Every 15 days'
                ? Number(debt.weekly_payment_amount || 0)
                : Number(debt.weekly_payment_amount || 0) * 2;

            // 3. Find any manual payments made specifically during this cutoff period
            const paymentsInPeriod = (debt.debt_payments || []).filter(p => {
                const pDateStr = p.date_paid.split('T')[0];
                const [py, pm, pd] = pDateStr.split('-').map(Number);
                const pDate = new Date(py, pm - 1, pd);

                return pDate >= periodStart && pDate <= periodEnd;
            });

            // Sum up how much they already paid manually this period
            const amountPaidInPeriod = paymentsInPeriod.reduce((sum, p) => sum + Number(p.amount_paid), 0);

            // 4. Subtract early manual payments from the scheduled deduction
            let finalDeduction = scheduledDeduction - amountPaidInPeriod;

            // If they already paid equal to (or more than) their expected deduction, SKIP auto-deduct for this date
            if (finalDeduction <= 0) return null;

            // Ensure we don't over-deduct the actual remaining balance
            if (finalDeduction > remainingDebt) finalDeduction = remainingDebt;

            return {
                debt_id: debt.id,
                description: debt.description,
                amount: finalDeduction,
                remaining: remainingDebt,
                frequency: debt.frequency,
                baseAmount: Number(debt.weekly_payment_amount),
                debtDate: debt.debt_date
            };
        }).filter(Boolean);
    }, [debts, payrollEmpId, payrollEmpName, payrollDate]);

    const payrollTotalDeductions = activeDeductions.reduce((sum, d) => sum + d.amount, 0);
    const payrollNet = payrollGross - payrollTotalDeductions;

    const filteredRecords = useMemo(() => {
        if (filterEmployee === 'all') {
            return salaryRecords;
        }
        return salaryRecords?.filter(r => r.employee_name === filterEmployee);
    }, [salaryRecords, filterEmployee]);

    const periodTotal = useMemo(() => {
        return filteredRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    }, [filteredRecords]);

    if (!isAdmin) {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
    }

    // --- DATE FILTER LOGIC ---
    const handleApplyCustomDate = () => {
        if (customStartDate && customEndDate) {
            setPeriod({
                start: customStartDate,
                end: customEndDate
            });
            setIsCustomRangeActive(true);
        }
    };

    const handleSetPeriod = (newPeriod) => {
        setPeriod(newPeriod);
        setIsCustomRangeActive(false);
    };

    // ============================================================
    // HANDLER: AUTOMATED PAYROLL
    // ============================================================
    const handleProcessPayroll = async (e) => {
        e.preventDefault();
        if (!payrollEmpName || !payrollDate) return;

        if (activeDeductions.length === 0) {
            addToast({ title: 'Notice', description: 'No active deductions to process for this date.', variant: 'warning' });
            return;
        }

        const now = new Date();
        const [year, month, day] = payrollDate.split('-').map(Number);
        const combinedDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

        try {
            await processDeductionsMutation.mutateAsync({
                employeeName: payrollEmpName,
                date: combinedDateTime.toISOString(),
                deductions: activeDeductions
            });
            addToast({ title: 'Success', description: 'Automated deductions processed successfully', variant: 'success' });

            setPayrollEmpId('');
            setPayrollDate(format(new Date(), 'yyyy-MM-dd'));
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // ============================================================
    // HANDLER: ORIGINAL MANUAL SALARY
    // ============================================================
    const handleEmployeeSelect = (e) => {
        setEmployeeName(e.target.value);
        setExcessMultiplier('1');
    };

    useEffect(() => {
        if (!employeeName) return;
        const emp = employees?.find(e => e.name === employeeName);
        if (emp) {
            let baseAmount = 0;
            let bonusAmount = 0;
            let breakdown = '';

            if (emp.salary_type === 'per_container') {
                const multiplier = Number(emp.container_multiplier || 1);
                baseAmount = dailyGallons * multiplier;
                breakdown = `(${dailyGallons} gal x${multiplier} = ${baseAmount})`;
            } else {
                baseAmount = Number(emp.default_salary || 0);
            }

            if (dailyGallons > 100) {
                const excess = dailyGallons - 100;
                const bonus = excess * Number(excessMultiplier);
                bonusAmount = bonus;
                breakdown += (breakdown ? ' + ' : ' ') + `Excess Bonus (${excess} gal x${excessMultiplier} = ${bonus})`;
            }

            setAmount((baseAmount + bonusAmount).toFixed(2));
            setDescription(`Salary Payout${breakdown ? ' ' + breakdown : ''}`);
        }
    }, [employeeName, dailyGallons, employees, excessMultiplier]);

    const handleAddSalary = async (e) => {
        e.preventDefault();
        if (!employeeName || !amount || !payoutDate) return;

        const now = new Date();
        const [year, month, day] = payoutDate.split('-').map(Number);
        const combinedDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

        try {
            await createSalary.mutateAsync({
                employeeName,
                amount,
                description,
                date: combinedDateTime.toISOString()
            });
            addToast({ title: 'Success', description: 'Salary recorded successfully', variant: 'success' });

            setAmount('');
            setEmployeeName('');
            setDescription('Salary Payout');
            setPayoutDate(format(new Date(), 'yyyy-MM-dd'));
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // --- EMPLOYEE MANAGEMENT LOGIC ---
    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        if (!empFormName.trim()) return;

        try {
            if (editingEmpId) {
                await manageEmployee.mutateAsync({
                    action: 'EDIT',
                    employee: {
                        id: editingEmpId,
                        name: empFormName,
                        default_salary: empFormSalary,
                        salary_type: empFormSalaryType,
                        container_multiplier: empFormSalaryType === 'per_container' ? empFormMultiplier : null
                    }
                });
                addToast({ title: 'Updated', description: 'Employee updated.', variant: 'success' });
            } else {
                await manageEmployee.mutateAsync({
                    action: 'ADD',
                    employee: {
                        name: empFormName,
                        default_salary: empFormSalary,
                        salary_type: empFormSalaryType,
                        container_multiplier: empFormSalaryType === 'per_container' ? empFormMultiplier : null
                    }
                });
                addToast({ title: 'Added', description: 'New employee added.', variant: 'success' });
            }
            setEditingEmpId(null);
            setEmpFormName('');
            setEmpFormSalary('');
            setEmpFormSalaryType('per_day');
            setEmpFormMultiplier('');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleEditClick = (emp) => {
        setEditingEmpId(emp.id);
        setEmpFormName(emp.name);
        setEmpFormSalary(emp.default_salary);
        setEmpFormSalaryType(emp.salary_type || 'per_day');
        setEmpFormMultiplier(emp.container_multiplier || '');
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Delete this employee profile? Past salaries will still show in history.")) return;
        try {
            await manageEmployee.mutateAsync({ action: 'DELETE', employee: { id } });
            addToast({ title: 'Deleted', description: 'Employee removed.', variant: 'success' });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6 responsive-page max-w-7xl mx-auto">
            <Head>
                <title>Salary Monitoring | Seaside POS</title>
            </Head>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Salary Monitoring</h1>
                    <p className="text-gray-500 text-sm">Manage staff salaries, automated payrolls, and manual records.</p>
                </div>
                <Button
                    onClick={() => setIsManageModalOpen(true)}
                    className="flex items-center gap-2 btn-apple-green text-white"
                >
                    <Users className="w-4 h-4" /> Manage Employees
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                {/* ========================================================
                    NEW SECTION: AUTOMATED PAYROLL CALCULATOR
                    ======================================================== */}
                <Card className="border-indigo-100 shadow-sm">
                    <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                        <h3 className="font-bold text-indigo-800 flex items-center gap-2"><Calculator className="w-5 h-5"/> Auto-Deduct Payroll</h3>
                        <p className="text-xs text-indigo-600">Calculates gross from the Salary History below and applies debts on cutoffs.</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleProcessPayroll} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Select Employee</Label>
                                    <Select value={payrollEmpId} onChange={(e) => setPayrollEmpId(e.target.value)} required className="h-11 w-full">
                                        <option value="" disabled>Select Staff...</option>
                                        {employees?.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label>Payout Date</Label>
                                    <Input type="date" value={payrollDate} onChange={e => setPayrollDate(e.target.value)} required className="h-11 w-full" />
                                </div>
                            </div>

                            {/* Computations Table UI - Responsive Flex Layout */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-2">
                                <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Salary Computation
                                </div>

                                {(() => {
                                    if (activeDeductions.length > 0) {
                                        return (
                                            <div className="px-4 py-3 border-b bg-red-50/50">
                                                <p className="text-xs font-bold text-red-600 mb-1">Active Debt Deductions:</p>
                                                <ul className="text-sm space-y-1">
                                                    {activeDeductions.map(d => (
                                                        <li key={d.debt_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                                                            <span className="flex-1 text-gray-700 break-words">
                                                                {d.description}
                                                                <span className="text-xs text-gray-500 italic ml-2">
                                                                    (₱{d.baseAmount.toFixed(2)} / {d.frequency} | Date: {d.debtDate ? format(new Date(d.debtDate), 'MMM d, yyyy') : 'N/A'})
                                                                </span>
                                                            </span>
                                                            <span className="font-medium text-red-600 sm:whitespace-nowrap">- ₱{d.amount.toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="px-4 py-3 border-b text-sm text-gray-500 italic">
                                            No active auto-deductions found for the selected date.
                                        </div>
                                    );
                                })()}

                                {/* Replaced Table with Mobile-Friendly Flex Layout */}
                                <div className="p-4 bg-indigo-50/30 flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex justify-between sm:flex-col sm:justify-start">
                                        <span
                                            className="text-xs text-gray-500 uppercase font-semibold">History Gross &nbsp; &nbsp;</span>
                                        <span className="font-medium text-gray-700 text-lg">₱{payrollGross.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between sm:flex-col sm:justify-start">
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Total Deduction &nbsp;&nbsp;</span>
                                        <span className="font-medium text-red-600 text-lg">- ₱{payrollTotalDeductions.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between sm:flex-col sm:text-right border-t border-indigo-100 sm:border-0 pt-3 sm:pt-0">
                                        <span className="text-xs text-indigo-700 uppercase font-bold">Net Payout&nbsp;&nbsp;</span>
                                        <span className="font-black text-2xl text-indigo-600">₱{payrollNet.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={processDeductionsMutation.isPending || activeDeductions.length === 0} className="w-full h-11 btn-apple-green text-white">
                                {processDeductionsMutation.isPending ? 'Processing...' : 'Process Deductions'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ========================================================
                    ORIGINAL SECTION: RECORD SALARY PAYMENT (UPDATED LAYOUT)
                    ======================================================== */}
                <Card>
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2"><FileText className="w-5 h-5"/> Manual Record Salary Entry</h3>
                        <p className="text-xs text-blue-600">Record a salary payout or bonus into the Salary History below.</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAddSalary} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-end">
                            <div className="md:col-span-2">
                                <Label>Employee</Label>
                                <Select value={employeeName} onChange={handleEmployeeSelect} required className="h-11 w-full">
                                    <option value="" disabled>Select Staff...</option>
                                    {employees?.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="md:col-span-1">
                                <Label>Gross Amount (₱)</Label>
                                <Input type="number" step="0.01" min="1" value={amount} onChange={e => setAmount(e.target.value)} required className="h-11 w-full" />
                            </div>
                            <div className="md:col-span-1">
                                <Label>Payout Date</Label>
                                <Input type="date" value={payoutDate} onChange={e => { setPayoutDate(e.target.value); setExcessMultiplier('1'); }} required className="h-11 w-full" />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="h-11 w-full" />
                            </div>

                            {/* Calculation Info Helper */}
                            {(employeeName && employees?.find(e => e.name === employeeName)) && (
                                <div className="md:col-span-2">
                                    {(() => {
                                        const emp = employees?.find(e => e.name === employeeName);
                                        const isPerContainer = emp?.salary_type === 'per_container';
                                        if (!isPerContainer && dailyGallons <= 100) return null;

                                        return (
                                            <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-[11px] sm:text-xs text-blue-800 flex flex-wrap gap-x-4 gap-y-1">
                                                {isPerContainer && (
                                                    <span>
                                                        <span className="font-bold opacity-70 uppercase mr-1">Base Calculation:</span>
                                                        {dailyGallons} gal × ₱{emp.container_multiplier} = {currency(dailyGallons * Number(emp.container_multiplier), { symbol: '₱' }).format()}
                                                    </span>
                                                )}
                                                {dailyGallons > 100 && (
                                                    <span>
                                                        <span className="font-bold opacity-70 uppercase mr-1">Quota Bonus:</span>
                                                        {dailyGallons - 100} gal × x{excessMultiplier} = {currency((dailyGallons - 100) * Number(excessMultiplier), { symbol: '₱' }).format()}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {dailyGallons > 100 && (
                                <div className="md:col-span-2 bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-orange-800 text-sm font-medium">
                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                        <span>Quota exceeded: {dailyGallons - 100} gallons exceed the 100-gal daily quota.</span>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Label className="whitespace-nowrap text-orange-900 mb-0">Multiplier:</Label>
                                        <Select
                                            value={excessMultiplier}
                                            onChange={e => setExcessMultiplier(e.target.value)}
                                            className="h-10 w-full sm:w-28 bg-white border-orange-200"
                                        >
                                            <option value="0">x0</option>
                                            <option value="0.5">x0.5</option>
                                            <option value="1">x1</option>
                                            <option value="1.5">x1.5</option>
                                            <option value="2">x2</option>
                                            <option value="2.5">x2.5</option>
                                            <option value="3">x3</option>
                                            <option value="3.5">x3.5</option>
                                            <option value="4">x4</option>
                                            <option value="4.5">x4.5</option>
                                            <option value="5">x5</option>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <Button type="submit" disabled={createSalary.isPending} className="btn--primary w-full h-11">
                                    {createSalary.isPending ? 'Saving...' : 'Record Salary'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* SALARY HISTORY & FILTERS */}
            <Card>
                <CardHeader className="border-b border-gray-100 pb-4 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex-1">
                            <h3 className="font-bold">Salary History (Gross Payouts)</h3>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                                Period: {format(new Date(period.start), 'EEE, MMM d, yyyy')} — {format(new Date(period.end), 'EEE, MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                            <div className="w-full sm:w-48">
                                <Select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="w-full">
                                    <option value="all">All Employees</option>
                                    {employees?.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period Total</p>
                                <p className="text-xl font-bold text-red-600">{currency(periodTotal, { symbol: '₱' }).format()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Custom Date Filter */}
                    <div className="flex flex-col md:flex-row items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <Label className="font-semibold text-sm">Custom Date Range:</Label>
                        <Input
                            type="date"
                            value={customStartDate}
                            onChange={e => setCustomStartDate(e.target.value)}
                            className="h-9 w-full sm:max-w-xs"
                        />
                        <span className="hidden sm:inline text-gray-500">-</span>
                        <Input
                            type="date"
                            value={customEndDate}
                            onChange={e => setCustomEndDate(e.target.value)}
                            className="h-9 w-full sm:max-w-xs"
                        />
                        <Button onClick={handleApplyCustomDate} className="h-9 btn-primary w-full sm:w-auto">Apply</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table and List Views */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Gross Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isSalaryLoading ? <TableRow><TableCell colSpan="4" className="text-center py-6">Loading...</TableCell></TableRow> :
                                    filteredRecords?.length === 0 ? <TableRow><TableCell colSpan="4" className="text-center py-8">No records for this period.</TableCell></TableRow> :
                                        filteredRecords?.map(record => (
                                            <TableRow key={record.id} className="border-b">
                                                <TableCell>{format(new Date(record.expense_date), 'EEE, MMM d, yyyy h:mm a')}</TableCell>
                                                <TableCell className="font-bold">{record.employee_name || 'N/A'}</TableCell>
                                                <TableCell>{record.description}</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">{currency(record.amount, { symbol: '₱' }).format()}</TableCell>
                                            </TableRow>
                                        ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="block md:hidden p-4 space-y-4">
                        {isSalaryLoading ? <p className="text-center py-6">Loading...</p> :
                            filteredRecords?.length === 0 ? <p className="text-center py-8">No records for this period.</p> :
                                filteredRecords?.map(record => (
                                    <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border-b">
                                        <div className="flex justify-between items-start"><span className="font-bold">{record.employee_name || 'N/A'}</span><span className="font-bold text-red-600">{currency(record.amount, { symbol: '₱' }).format()}</span></div>
                                        <div className="flex justify-between items-center text-sm text-gray-500 mt-2"><span>{record.description}</span><span>{format(new Date(record.expense_date), 'EEE, MMM d, h:mm a')}</span></div>
                                    </div>
                                ))}
                    </div>

                    {/* Period Navigation */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-lg border-t">
                        <Button
                            onClick={() => handleSetPeriod(getPrevPeriod(period.start))}
                            disabled={isCustomRangeActive}
                            variant="outline"
                            className="flex items-center gap-1 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev 15-Day
                        </Button>
                        <span className="text-xs font-bold text-gray-400 uppercase">
                           {isCustomRangeActive ? "Custom Range" : `${format(new Date(period.start), 'MMM d')} - ${format(new Date(period.end), 'MMM d')}`}
                        </span>
                        <Button
                            onClick={() => handleSetPeriod(getNextPeriod(period.start))}
                            disabled={isCustomRangeActive}
                            variant="outline"
                            className="flex items-center gap-1 disabled:opacity-50"
                        >
                            Next 15-Day <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* EMPLOYEE MANAGEMENT MODAL */}
            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="max-w-2xl w-full">
                    <DialogHeader>
                        <DialogTitle>Manage Employees</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-6">
                        <form onSubmit={handleSaveEmployee} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Employee Name</Label><Input value={empFormName} onChange={e => setEmpFormName(e.target.value)} required /></div>
                                <div>
                                    <Label>Salary Type</Label>
                                    <Select value={empFormSalaryType} onChange={e => setEmpFormSalaryType(e.target.value)} required>
                                        <option value="per_day">Per Day</option>
                                        <option value="per_container">Per Container</option>
                                    </Select>
                                </div>
                                {empFormSalaryType === 'per_day' ? (
                                    <div><Label>Daily Wage Rate (₱)</Label><Input type="number" step="0.01" value={empFormSalary} onChange={e => setEmpFormSalary(e.target.value)} /></div>
                                ) : (
                                    <div>
                                        <Label>Container Multiplier</Label>
                                        <Select value={empFormMultiplier} onChange={e => setEmpFormMultiplier(e.target.value)} required>
                                            <option value="" disabled>Select Multiplier...</option>
                                            <option value="1">x1</option>
                                            <option value="2">x2</option>
                                            <option value="3">x3</option>
                                            <option value="4">x4</option>
                                            <option value="5">x5</option>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                {editingEmpId && (
                                    <Button type="button" variant="ghost" onClick={() => {
                                        setEditingEmpId(null);
                                        setEmpFormName('');
                                        setEmpFormSalary('');
                                        setEmpFormSalaryType('per_day');
                                        setEmpFormMultiplier('');
                                    }}>Cancel</Button>
                                )}
                                <Button type="submit" disabled={manageEmployee.isPending}>{editingEmpId ? 'Update' : 'Add Employee'}</Button>
                            </div>
                        </form>
                        <div className="max-h-80 overflow-y-auto border rounded-lg">
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Salary Info</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isEmpLoading ? <TableRow><TableCell colSpan="3" className="text-center">Loading...</TableCell></TableRow> :
                                        employees?.map(emp => (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell>
                                                    {emp.salary_type === 'per_container'
                                                        ? `Per Container (x${emp.container_multiplier})`
                                                        : currency(emp.default_salary, { symbol: '₱' }).format() + ' / day'}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <button onClick={() => handleEditClick(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t">
                        <Button variant="outline" onClick={() => setIsManageModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}