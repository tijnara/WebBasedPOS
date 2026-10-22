// src/components/pages/SalaryMonitoringPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '../ui';
import { useSalaryRecords, useCreateSalary, useProcessDeductions } from '../../hooks/useSalary';
import { useEmployees, useManageEmployee } from '../../hooks/useEmployees';
import { useDebts } from '../../hooks/useDebts';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { format as formatDate, endOfMonth, subMonths, addMonths, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useQueryClient } from '@tanstack/react-query';

// Extracted Modular Components
import AutoPayrollCard from '../salary/AutoPayrollCard';
import ManualSalaryCard from '../salary/ManualSalaryCard';
import SalaryHistoryCard from '../salary/SalaryHistoryCard';
import EmployeeManagementModal from '../salary/EmployeeManagementModal';

const TIME_ZONE = 'Asia/Manila';

// --- Date Math Helpers ---
const getInitialPeriod = () => {
    const today = toDate(new Date(), { timeZone: TIME_ZONE });
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    if (day <= 15) {
        return {
            start: formatDate(startOfDay(new Date(year, month, 1)), 'yyyy-MM-dd'),
            end: formatDate(endOfDay(new Date(year, month, 15)), 'yyyy-MM-dd')
        };
    } else {
        return {
            start: formatDate(startOfDay(new Date(year, month, 16)), 'yyyy-MM-dd'),
            end: formatDate(endOfDay(endOfMonth(today)), 'yyyy-MM-dd')
        };
    }
};

const getPrevPeriod = (currentStartStr) => {
    const currentStart = toDate(currentStartStr, { timeZone: TIME_ZONE });
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 16) {
        return {
            start: formatDate(startOfDay(new Date(year, month, 1)), 'yyyy-MM-dd'),
            end: formatDate(endOfDay(new Date(year, month, 15)), 'yyyy-MM-dd')
        };
    } else {
        const prevMonthDate = subMonths(currentStart, 1);
        return {
            start: formatDate(startOfDay(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 16)), 'yyyy-MM-dd'),
            end: formatDate(endOfDay(endOfMonth(prevMonthDate)), 'yyyy-MM-dd')
        };
    }
};

const getNextPeriod = (currentStartStr) => {
    const currentStart = toDate(currentStartStr, { timeZone: TIME_ZONE });
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        return {
            start: formatDate(startOfDay(new Date(year, month, 16)), 'yyyy-MM-dd'),
            end: formatDate(endOfDay(endOfMonth(currentStart)), 'yyyy-MM-dd')
        };
    } else {
        const nextMonthDate = addMonths(currentStart, 1);
        return {
            start: formatDate(startOfDay(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1)), 'yyyy-MM-dd'),
            end: formatDate(endOfDay(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 15)), 'yyyy-MM-dd')
        };
    }
};

export default function SalaryMonitoringPage() {
    useEffect(() => {
        document.title = 'Salary Monitoring | Seaside WRS';
    }, []);

    const queryClient = useQueryClient?.() || null;
    const { user, addToast } = useStore();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.isadmin;

    const [period, setPeriod] = useState(getInitialPeriod());
    const [filterEmployee, setFilterEmployee] = useState('all');

    // State for custom date range
    const [customStartDate, setCustomStartDate] = useState(formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd'));
    const [isCustomRangeActive, setIsCustomRangeActive] = useState(false);

    // ============================================================
    // STATE 1: AUTOMATED PAYROLL SECTION
    // ============================================================
    const [payrollEmpId, setPayrollEmpId] = useState('');
    const [payrollDate, setPayrollDate] = useState(formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd'));

    // ============================================================
    // STATE 2: MANUAL SALARY SECTION
    // ============================================================
    const [employeeName, setEmployeeName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Salary Payout');
    const [payoutDate, setPayoutDate] = useState(formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd'));
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

    const { data: dailySummary } = useSalesSummary({
        startDate: useMemo(() => payoutDate ? startOfDay(toDate(payoutDate, { timeZone: TIME_ZONE })) : null, [payoutDate]),
        endDate: useMemo(() => payoutDate ? endOfDay(toDate(payoutDate, { timeZone: TIME_ZONE })) : null, [payoutDate])
    });
    const dailyGallons = dailySummary?.totalGallons || 0;
    const createSalary = useCreateSalary();
    const processDeductionsMutation = useProcessDeductions();
    const manageEmployee = useManageEmployee();

    const selectedPayrollEmp = employees?.find(e => String(e.id) === String(payrollEmpId));
    const payrollEmpName = selectedPayrollEmp?.name || '';

    // Calculate Gross Salary based on positive salary entries in Salary History
    const payrollGross = useMemo(() => {
        if (!payrollEmpName || !salaryRecords) return 0;
        return salaryRecords
            .filter(r => r.employee_name === payrollEmpName && Number(r.amount) > 0)
            .reduce((sum, r) => sum + Number(r.amount), 0);
    }, [payrollEmpName, salaryRecords]);

    // Robust bidirectional deduction linking with Employee Debt Management
    const activeDeductions = useMemo(() => {
        if (!payrollEmpId || !payrollDate) return [];

        const [pYear, pMonth, pDay] = payrollDate.split('-').map(Number);
        const lastDayOfMonth = new Date(pYear, pMonth, 0).getDate();

        const periodStartStr = pDay <= 15
            ? `${pYear}-${String(pMonth).padStart(2, '0')}-01`
            : `${pYear}-${String(pMonth).padStart(2, '0')}-16`;
        const periodEndStr = pDay <= 15
            ? `${pYear}-${String(pMonth).padStart(2, '0')}-15`
            : `${pYear}-${String(pMonth).padStart(2, '0')}-${lastDayOfMonth}`;

        const periodStart = new Date(`${periodStartStr}T00:00:00+08:00`);
        const periodEnd = new Date(`${periodEndStr}T23:59:59.999+08:00`);

        const cleanEmpName = (payrollEmpName || '').trim().toLowerCase();
        const firstName = cleanEmpName.split(' ')[0];

        // 1. Identify all employee debts for this staff member
        const empDebts = debts.filter(d => {
            const isEmployeeType = d.type?.toLowerCase() === 'employee';
            if (!isEmployeeType) return false;

            const isIdMatch = d.employee_id && String(d.employee_id) === String(payrollEmpId);
            const debtDesc = (d.description || '').toLowerCase();
            const isNameMatch = cleanEmpName && (
                debtDesc.includes(cleanEmpName) ||
                cleanEmpName.includes(debtDesc.split(/[-•:]/)[0].trim()) ||
                (firstName.length >= 2 && debtDesc.includes(firstName))
            );

            return isIdMatch || isNameMatch;
        });

        // 2. Calculate remaining balance and active deduction per debt
        return empDebts.map(debt => {
            const debtPayments = (debt.debt_payments || []).filter(
                p => !p.debt_id || String(p.debt_id) === String(debt.id)
            );

            const totalPaid = debtPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
            const remainingDebt = Math.max(0, Number(debt.total_debt_amount || 0) - totalPaid);

            if (remainingDebt <= 0) return null;

            let scheduledDeduction = Number(debt.weekly_payment_amount || 0);
            if (debt.frequency === 'Weekly') {
                scheduledDeduction = scheduledDeduction * 2;
            }
            if (scheduledDeduction <= 0) {
                scheduledDeduction = remainingDebt;
            }

            // Exclude already processed payments in this specific cutoff
            const paymentsInPeriod = debtPayments.filter(p => {
                if (!p.date_paid) return false;
                const pDate = new Date(`${p.date_paid}T00:00:00+08:00`);
                return pDate >= periodStart && pDate <= periodEnd;
            });

            const amountPaidInPeriod = paymentsInPeriod.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
            let finalDeduction = scheduledDeduction - amountPaidInPeriod;

            if (finalDeduction <= 0) return null;
            if (finalDeduction > remainingDebt) finalDeduction = remainingDebt;

            return {
                debt_id: debt.id,
                description: debt.description,
                amount: finalDeduction,
                remaining: remainingDebt,
                frequency: debt.frequency,
                baseAmount: Number(debt.weekly_payment_amount || 0),
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

    const groupedRecords = useMemo(() => {
        if (!filteredRecords) return {};
        return filteredRecords.reduce((acc, record) => {
            const key = record.employee_name || 'N/A';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(record);
            return acc;
        }, {});
    }, [filteredRecords]);

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
            addToast({ title: 'Notice', description: 'No active deductions found for this employee.', variant: 'warning' });
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
            addToast({
                title: 'Deductions Synchronized',
                description: `Successfully processed ₱${payrollTotalDeductions.toFixed(2)} in deductions. Updated in Employee Debt Management!`,
                variant: 'success'
            });

            setPayrollEmpId('');
            setPayrollDate(formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd'));
            queryClient?.invalidateQueries({ queryKey: ['debts'] });
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // ============================================================
    // HANDLER: MANUAL SALARY ENTRY
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
            setPayoutDate(formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd'));
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
                {/* Automated Payroll Calculator */}
                <AutoPayrollCard
                    payrollEmpId={payrollEmpId}
                    setPayrollEmpId={setPayrollEmpId}
                    payrollDate={payrollDate}
                    setPayrollDate={setPayrollDate}
                    employees={employees}
                    activeDeductions={activeDeductions}
                    payrollGross={payrollGross}
                    payrollTotalDeductions={payrollTotalDeductions}
                    payrollNet={payrollNet}
                    handleProcessPayroll={handleProcessPayroll}
                    isPending={processDeductionsMutation.isPending}
                />

                {/* Manual Record Salary Entry */}
                <ManualSalaryCard
                    employeeName={employeeName}
                    handleEmployeeSelect={handleEmployeeSelect}
                    employees={employees}
                    amount={amount}
                    setAmount={setAmount}
                    payoutDate={payoutDate}
                    setPayoutDate={setPayoutDate}
                    description={description}
                    setDescription={setDescription}
                    dailyGallons={dailyGallons}
                    excessMultiplier={excessMultiplier}
                    setExcessMultiplier={setExcessMultiplier}
                    handleAddSalary={handleAddSalary}
                    isPending={createSalary.isPending}
                />
            </div>

            {/* Salary History & Filters */}
            <SalaryHistoryCard
                period={period}
                filterEmployee={filterEmployee}
                setFilterEmployee={setFilterEmployee}
                employees={employees}
                periodTotal={periodTotal}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
                handleApplyCustomDate={handleApplyCustomDate}
                isSalaryLoading={isSalaryLoading}
                groupedRecords={groupedRecords}
                handleSetPeriod={handleSetPeriod}
                getPrevPeriod={getPrevPeriod}
                getNextPeriod={getNextPeriod}
                isCustomRangeActive={isCustomRangeActive}
            />

            {/* Employee Management Modal */}
            <EmployeeManagementModal
                isManageModalOpen={isManageModalOpen}
                setIsManageModalOpen={setIsManageModalOpen}
                handleSaveEmployee={handleSaveEmployee}
                empFormName={empFormName}
                setEmpFormName={setEmpFormName}
                empFormSalaryType={empFormSalaryType}
                setEmpFormSalaryType={setEmpFormSalaryType}
                empFormSalary={empFormSalary}
                setEmpFormSalary={setEmpFormSalary}
                empFormMultiplier={empFormMultiplier}
                setEmpFormMultiplier={setEmpFormMultiplier}
                editingEmpId={editingEmpId}
                setEditingEmpId={setEditingEmpId}
                isPending={manageEmployee.isPending}
                isEmpLoading={isEmpLoading}
                employees={employees}
                handleEditClick={handleEditClick}
                handleDeleteEmployee={handleDeleteEmployee}
            />
        </div>
    );
}