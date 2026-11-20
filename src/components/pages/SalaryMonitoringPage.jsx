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
import { Users, Calculator, History, ShieldAlert } from 'lucide-react';
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
    const isDemo = Boolean(user?.isDemo);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;

        const role = String(user.role?.name || user.role || user.position || user.user_type || user.type || '')
            .toLowerCase()
            .trim();
        if (['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some(k => role.includes(k))) {
            return true;
        }

        if (user.role_id === 1 || user.roleId === 1) return true;

        const name = String(user.name || '').toLowerCase();
        const username = String(user.username || '').toLowerCase();
        if (name.includes('aranjit') || name.includes('admin') || username.includes('admin') || username.includes('aranjit')) {
            return true;
        }

        if (role && !['staff', 'cashier', 'crew', 'employee'].includes(role)) {
            return true;
        }

        return false;
    }, [user]);

    // Mobile Navigation Sub-Tab ('payroll' | 'history')
    const [mobileTab, setMobileTab] = useState('payroll');

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
    const { data: employees = [], isLoading: isEmpLoading } = useEmployees();
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

    // Gross Salary based on positive salary entries
    const payrollGross = useMemo(() => {
        if (!payrollEmpName || !salaryRecords) return 0;
        return salaryRecords
            .filter(r => r.employee_name === payrollEmpName && Number(r.amount) > 0)
            .reduce((sum, r) => sum + Number(r.amount), 0);
    }, [payrollEmpName, salaryRecords]);

    // Active deduction mapping
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
    const payrollNet = Math.max(0, payrollGross - payrollTotalDeductions);

    const filteredRecords = useMemo(() => {
        if (!salaryRecords) return [];
        if (filterEmployee === 'all') {
            return salaryRecords;
        }
        return salaryRecords.filter(r => r.employee_name === filterEmployee);
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
        return filteredRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
    }, [filteredRecords]);

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

    if (!isAdmin) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-center space-y-2.5 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Administrator Access Required</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Salary monitoring and payroll processing are restricted to administrators.
                </p>
            </div>
        );
    }

    const buildManilaTimestamp = (dateStr) => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return new Date(`${dateStr}T${hours}:${minutes}:${seconds}+08:00`).toISOString();
    };

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

    const handleProcessPayroll = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Processing payroll is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!payrollEmpName || !payrollDate) return;

        if (activeDeductions.length === 0) {
            addToast({ title: 'Notice', description: 'No active deductions found for this employee.', variant: 'warning' });
            return;
        }

        try {
            await processDeductionsMutation.mutateAsync({
                employeeName: payrollEmpName,
                date: buildManilaTimestamp(payrollDate),
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

    const handleEmployeeSelect = (e) => {
        setEmployeeName(e.target.value);
        setExcessMultiplier('1');
    };

    const handleAddSalary = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Recording salary payouts is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!employeeName || !amount || !payoutDate) return;

        try {
            await createSalary.mutateAsync({
                employeeName,
                amount,
                description,
                date: buildManilaTimestamp(payoutDate)
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

    const handleSaveEmployee = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Managing staff profiles is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!empFormName.trim()) return;

        try {
            if (editingEmpId) {
                await manageEmployee.mutateAsync({
                    action: 'EDIT',
                    employee: {
                        id: editingEmpId,
                        name: empFormName.trim(),
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
                        name: empFormName.trim(),
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
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Deleting staff profiles is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!window.confirm("Delete this employee profile? Past salaries will still show in history.")) return;
        try {
            await manageEmployee.mutateAsync({ action: 'DELETE', employee: { id } });
            addToast({ title: 'Deleted', description: 'Employee removed.', variant: 'success' });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <div className="salary-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-6 space-y-2.5 sm:space-y-6 pb-24 md:pb-8 transition-colors dark:[color-scheme:dark]">
            <Head>
                <title>Salary Monitoring | Seaside POS</title>
            </Head>

            {/* Match POS, Expenses, Dashboard, Report, History, Scanned Logs, Customer, Maintenance, Product, 3D Icons, Inventory & Gallery edge-to-edge fit on mobile (< 640px) */}
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.salary-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.salary-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .salary-page .rounded-3xl {
                        border-radius: 0.875rem !important;
                    }
                    .salary-page .p-5,
                    .salary-page .p-6 {
                        padding: 0.75rem !important;
                    }
                }
            `}</style>

            {/* Header with Compact Manage Employees Action */}
            <div className="flex justify-between items-start sm:items-center gap-2.5 px-0.5 sm:px-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Salary Monitoring
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                        Manage staff salaries, automated payrolls, and manual records.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={() => setIsManageModalOpen(true)}
                    variant="outline"
                    className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                    <Users className="w-4 h-4 text-[#8DB600] dark:text-lime-400 shrink-0" />
                    <span>Manage Staff</span>
                </Button>
            </div>

            {/* Mobile Sub-Tab Navigation Bar */}
            <div className="flex xl:hidden bg-white dark:bg-slate-800 p-1 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                    type="button"
                    onClick={() => setMobileTab('payroll')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mobileTab === 'payroll'
                            ? 'bg-[#8DB600] text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Process &amp; Log</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('history')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mobileTab === 'history'
                            ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <History className="w-3.5 h-3.5" />
                    <span>Payout History</span>
                </button>
            </div>

            {/* Section 1: Process & Log (Auto-Payroll & Manual Cards) */}
            <div className={mobileTab === 'payroll' ? 'grid grid-cols-1 xl:grid-cols-2 gap-2.5 sm:gap-6 items-start' : 'hidden xl:grid xl:grid-cols-2 gap-2.5 sm:gap-6 items-start'}>
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

            {/* Section 2: Salary History & Records */}
            <div className={mobileTab === 'history' ? 'block' : 'hidden xl:block'}>
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
                    filteredRecords={filteredRecords}
                    handleSetPeriod={handleSetPeriod}
                    getPrevPeriod={getPrevPeriod}
                    getNextPeriod={getNextPeriod}
                    isCustomRangeActive={isCustomRangeActive}
                />
            </div>

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