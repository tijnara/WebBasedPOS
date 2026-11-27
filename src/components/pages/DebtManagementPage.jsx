// src/components/pages/DebtManagementPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import { useDebts, useCreateDebt, useCreateDebtPayment } from '../../hooks/useDebts';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useEmployees } from '../../hooks/useEmployees';
import { logActivity } from '../../hooks/useActivityLogs';
import { useStore } from '../../store/useStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import currency from 'currency.js';
import {
    Landmark,
    Users,
    History,
    PlusCircle,
    ArrowDownLeft,
    X,
    Calendar,
    Pencil,
    Trash2,
    Check,
    Plus,
    ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '../ui';

// Modular Subcomponents
import DebtMetricsCards from '../debts/DebtMetricsCards';
import CompanyDebtForm from '../debts/CompanyDebtForm';
import EmployeeDebtForm from '../debts/EmployeeDebtForm';
import DebtRegistryTable from '../debts/DebtRegistryTable';
import DebtPaymentModal from '../debts/DebtPaymentModal';
import EditDebtModal from '../debts/EditDebtModal';

const getManilaDateStr = (dateObj = new Date()) => {
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(dateObj);
    } catch {
        return dateObj.toISOString().slice(0, 10);
    }
};

const formatManilaDisplayDate = (rawDate) => {
    if (!rawDate) return '—';
    try {
        const str = String(rawDate).trim().slice(0, 10);
        const parsed = /^\d{4}-\d{2}-\d{2}$/.test(str)
            ? new Date(`${str}T12:00:00+08:00`)
            : new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) return String(rawDate);
        return new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(parsed);
    } catch {
        return String(rawDate);
    }
};

const toManilaTimestampMs = (rawDate) => {
    if (!rawDate) return 0;
    const str = String(rawDate).trim().slice(0, 10);
    const d = /^\d{4}-\d{2}-\d{2}$/.test(str)
        ? new Date(`${str}T00:00:00+08:00`)
        : new Date(rawDate);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const normalizeName = (val) => String(val || '').trim().toLowerCase();

export default function DebtManagementPage() {
    const user = useStore(s => s.user);
    const addToast = useStore(s => s.addToast);
    const isDemo = Boolean(user?.isDemo);
    const queryClient = useQueryClient?.() || null;

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Resolve Admin privilege across custom auth user shapes
    const isAdmin = useMemo(() => {
        if (!user) return false;
        const roleStr = String(user?.role?.name || user?.role || '').trim().toLowerCase();
        return (
            roleStr === 'admin' ||
            roleStr === 'administrator' ||
            roleStr === 'superadmin' ||
            Boolean(user?.is_admin) ||
            Boolean(user?.isAdmin)
        );
    }, [user]);

    // View & Filter States
    const [activeTab, setActiveTab] = useState('company'); // 'company' | 'employee'
    const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'cleared' | 'all'

    // Queries
    const { data: debts = [], isLoading, refetch } = useDebts();
    const { data: employees = [] } = useEmployees();

    // Fetch itemized debt additions history from public.debt_additions
    const { data: debtAdditions = [], refetch: refetchAdditions } = useQuery({
        queryKey: ['debt-additions', isDemo],
        queryFn: async () => {
            if (isDemo) return [];
            const { data, error } = await supabase
                .from('debt_additions')
                .select('id, debt_id, date_incurred, amount_added, reason, created_by, created_at, creator:created_by(name)')
                .order('date_incurred', { ascending: false })
                .order('id', { ascending: false });

            if (error) {
                console.warn('debt_additions lookup skipped:', error.message);
                return [];
            }
            return data || [];
        }
    });

    // Mutations
    const createDebtMutation = useCreateDebt();
    const createPaymentMutation = useCreateDebtPayment();
    const createExpenseMutation = useCreateExpense();

    // Modals & Action States
    const [paymentModalTarget, setPaymentModalTarget] = useState(null);
    const [editingDebt, setEditingDebt] = useState(null);
    const [historyModalDebtId, setHistoryModalDebtId] = useState(null);
    const [isUpdatingDebt, setIsUpdatingDebt] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [isConsolidatingDebt, setIsConsolidatingDebt] = useState(false);

    // Admin Ledger Modal CRUD States
    const [ledgerAddMode, setLedgerAddMode] = useState(null); // 'DEBT_ADDED' | 'PAYMENT' | null
    const [ledgerNewDate, setLedgerNewDate] = useState(getManilaDateStr);
    const [ledgerNewAmount, setLedgerNewAmount] = useState('');
    const [ledgerNewReason, setLedgerNewReason] = useState('');
    const [editingLedgerEvent, setEditingLedgerEvent] = useState(null);
    const [isLedgerMutating, setIsLedgerMutating] = useState(false);

    // Map employee names by id from public.employees
    const employeeById = useMemo(() => {
        const map = {};
        (employees || []).forEach(emp => {
            if (emp?.id !== undefined && emp?.id !== null) {
                map[String(emp.id)] = emp;
            }
        });
        return map;
    }, [employees]);

    // Group additions by debt_id
    const additionsByDebtId = useMemo(() => {
        const map = {};
        (debtAdditions || []).forEach(item => {
            const key = String(item.debt_id);
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        return map;
    }, [debtAdditions]);

    // Process & Group Debts + Build Chronological Ledger History
    const { companyDebts, employeeDebts } = useMemo(() => {
        const processed = debts.map(debt => {
            const rawPayments = debt.debt_payments || [];
            const debtPayments = rawPayments.filter(p => {
                const pId = p.debt_id ?? p.company_debt_id ?? p.debtId;
                return pId !== undefined && pId !== null ? String(pId) === String(debt.id) : true;
            });

            const totalPaid = debtPayments.reduce((sum, p) => sum.add(currency(p.amount_paid)), currency(0)).value;
            const remainingDebt = Math.max(0, currency(debt.total_debt_amount).subtract(totalPaid).value);
            const sortedPayments = [...debtPayments].sort((a, b) => {
                const diff = toManilaTimestampMs(b.date_paid) - toManilaTimestampMs(a.date_paid);
                return diff !== 0 ? diff : Number(b.id || 0) - Number(a.id || 0);
            });

            const matchedEmp = debt.employee_id ? employeeById[String(debt.employee_id)] : null;
            const resolvedEmployeeName =
                debt.employee?.name ||
                debt.employee_name ||
                matchedEmp?.name ||
                null;

            // Additions recorded for this debt account
            const rawAdditions = additionsByDebtId[String(debt.id)] || [];
            const effectiveAdditions = rawAdditions.length > 0
                ? rawAdditions
                : Number(debt.total_debt_amount) > 0
                    ? [
                        {
                            id: 0,
                            debt_id: debt.id,
                            amount_added: Number(debt.total_debt_amount) || 0,
                            date_incurred: debt.debt_date || getManilaDateStr(),
                            reason: debt.description || 'Initial Debt Balance',
                            created_at: null,
                            isSyntheticInitial: true
                        }
                    ]
                    : [];

            const sortedAdditions = [...effectiveAdditions].sort((a, b) => {
                const diff = toManilaTimestampMs(b.date_incurred) - toManilaTimestampMs(a.date_incurred);
                return diff !== 0 ? diff : Number(b.id || 0) - Number(a.id || 0);
            });

            // Unified chronological ledger (oldest -> newest to calculate running balance, then reverse for UI)
            const rawEvents = [
                ...effectiveAdditions.map(a => ({
                    uid: `add-${a.id}-${a.date_incurred}`,
                    rawId: a.id,
                    isSyntheticInitial: Boolean(a.isSyntheticInitial),
                    sortOrderId: Number(a.id) || 0,
                    entryType: 'DEBT_ADDED',
                    amount: currency(a.amount_added).value,
                    eventDate: String(a.date_incurred || debt.debt_date || getManilaDateStr()).slice(0, 10),
                    note: a.reason || 'Cash Advance / Debt Incurred',
                    recordedBy: a.creator?.name || null
                })),
                ...debtPayments.map(p => ({
                    uid: `pay-${p.id}-${p.date_paid}`,
                    rawId: p.id,
                    isSyntheticInitial: false,
                    sortOrderId: Number(p.id) || 0,
                    entryType: 'PAYMENT',
                    amount: currency(p.amount_paid).value,
                    eventDate: String(p.date_paid || getManilaDateStr()).slice(0, 10),
                    note: debt.type === 'employee' ? 'Salary Deduction / Payment' : 'Debt Payment',
                    recordedBy: null
                }))
            ];

            rawEvents.sort((a, b) => {
                const diff = toManilaTimestampMs(a.eventDate) - toManilaTimestampMs(b.eventDate);
                if (diff !== 0) return diff;
                if (a.entryType !== b.entryType) {
                    return a.entryType === 'DEBT_ADDED' ? -1 : 1;
                }
                return a.sortOrderId - b.sortOrderId;
            });

            let running = currency(0);
            const timelineAsc = rawEvents.map(ev => {
                running = ev.entryType === 'DEBT_ADDED'
                    ? running.add(ev.amount)
                    : running.subtract(ev.amount);
                return {
                    ...ev,
                    runningBalance: Math.max(0, running.value)
                };
            });

            return {
                ...debt,
                resolvedEmployeeName,
                totalPaid,
                remainingDebt,
                sortedPayments,
                debt_additions: sortedAdditions,
                additionsCount: sortedAdditions.length,
                ledgerHistory: [...timelineAsc].reverse()
            };
        });

        return {
            companyDebts: processed.filter(d => !d.type || d.type === 'company'),
            employeeDebts: processed.filter(d => d.type === 'employee')
        };
    }, [debts, additionsByDebtId, employeeById]);

    const historyModalTarget = useMemo(() => {
        if (!historyModalDebtId) return null;
        return [...employeeDebts, ...companyDebts].find(
            d => String(d.id) === String(historyModalDebtId)
        ) || null;
    }, [historyModalDebtId, employeeDebts, companyDebts]);

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

    // Refresh helper across all debt queries
    const invalidateAllDebtQueries = async () => {
        await Promise.all([
            refetch?.(),
            refetchAdditions?.(),
            queryClient?.invalidateQueries({ queryKey: ['debts'] }),
            queryClient?.invalidateQueries({ queryKey: ['debt-additions'] }),
            queryClient?.invalidateQueries({ queryKey: ['salary-records'] }),
            queryClient?.invalidateQueries({ queryKey: ['activity-logs'] })
        ]);
    };

    // Recalculate and sync public.debts.total_debt_amount from public.debt_additions rows
    const syncParentDebtTotalFromAdditions = async (debtId) => {
        const numericDebtId = parseInt(debtId, 10);
        const { data: rows, error } = await supabase
            .from('debt_additions')
            .select('amount_added, date_incurred')
            .eq('debt_id', numericDebtId)
            .order('date_incurred', { ascending: false })
            .order('id', { ascending: false });

        if (error) throw error;

        if (!rows || rows.length === 0) {
            const { error: updErr } = await supabase
                .from('debts')
                .update({ total_debt_amount: 0 })
                .eq('id', numericDebtId);
            if (updErr) throw updErr;
            return 0;
        }

        const newTotal = rows.reduce((sum, r) => sum.add(currency(r.amount_added)), currency(0)).value;
        const latestDate = rows[0]?.date_incurred || getManilaDateStr();

        const { error: updErr } = await supabase
            .from('debts')
            .update({
                total_debt_amount: newTotal,
                debt_date: latestDate
            })
            .eq('id', numericDebtId);

        if (updErr) throw updErr;
        return newTotal;
    };

    // Locate an employee's existing active (unpaid) debt record via employee_id (primary) or name fallback
    const findExistingActiveEmployeeDebt = (payload) => {
        if (payload?.type !== 'employee') return null;

        const incomingEmpId = payload.employee_id ?? payload.employeeId ?? null;
        const matchedEmpRecord =
            incomingEmpId !== null && incomingEmpId !== undefined && incomingEmpId !== ''
                ? employeeById[String(incomingEmpId)]
                : null;

        const incomingEmpName = normalizeName(
            payload.employee_name ||
            payload.employeeName ||
            matchedEmpRecord?.name ||
            ''
        );

        const activeEmployeeDebts = employeeDebts.filter(d => d.remainingDebt > 0);

        return activeEmployeeDebts.find(d => {
            if (
                incomingEmpId !== null &&
                incomingEmpId !== undefined &&
                incomingEmpId !== '' &&
                d.employee_id !== null &&
                d.employee_id !== undefined &&
                String(d.employee_id) === String(incomingEmpId)
            ) {
                return true;
            }

            if (incomingEmpName) {
                const debtEmpName = normalizeName(d.resolvedEmployeeName);
                if (debtEmpName && debtEmpName === incomingEmpName) {
                    return true;
                }

                const descNorm = normalizeName(d.description);
                if (
                    !d.employee_id &&
                    (descNorm === incomingEmpName ||
                        descNorm.startsWith(`${incomingEmpName} -`) ||
                        descNorm.startsWith(`${incomingEmpName}:`))
                ) {
                    return true;
                }
            }

            return false;
        }) || null;
    };

    // Insert itemized debt event into public.debt_additions
    const recordDebtAdditionRow = async ({
                                             debtRecordForBaseline = null,
                                             debtId,
                                             amountAdded,
                                             dateIncurred,
                                             reason
                                         }) => {
        const numericDebtId = parseInt(debtId, 10);
        if (Number.isNaN(numericDebtId)) return;

        if (debtRecordForBaseline) {
            const existingRows = additionsByDebtId[String(numericDebtId)] || [];
            if (existingRows.length === 0 && Number(debtRecordForBaseline.total_debt_amount) > 0) {
                await supabase.from('debt_additions').insert([
                    {
                        debt_id: numericDebtId,
                        date_incurred: String(debtRecordForBaseline.debt_date || getManilaDateStr()).slice(0, 10),
                        amount_added: currency(debtRecordForBaseline.total_debt_amount).value,
                        reason: debtRecordForBaseline.description || 'Initial Debt Balance',
                        created_by: user?.id || null
                    }
                ]);
            }
        }

        const { error } = await supabase.from('debt_additions').insert([
            {
                debt_id: numericDebtId,
                date_incurred: String(dateIncurred || getManilaDateStr()).slice(0, 10),
                amount_added: currency(amountAdded).value,
                reason: reason || 'Cash Advance',
                created_by: user?.id || null
            }
        ]);

        if (error) throw error;
    };

    // =========================================================================
    // MAIN DEBT ACCOUNT CRUD HANDLERS
    // =========================================================================
    const handleCreateDebt = async (payload) => {
        if (isDemo) {
            return addToast({
                title: 'Demo Mode',
                description: 'Adding records is disabled in demo mode.',
                variant: 'warning'
            });
        }
        if (!isAdmin) {
            return addToast({
                title: 'Admin Only',
                description: 'Only administrators can create or modify debt records.',
                variant: 'destructive'
            });
        }

        try {
            const addedAmount = currency(payload.total_debt_amount || 0).value;
            if (addedAmount <= 0) {
                return addToast({
                    title: 'Invalid Amount',
                    description: 'Debt amount must be greater than zero.',
                    variant: 'destructive'
                });
            }

            const effectiveDateStr = String(payload.debt_date || getManilaDateStr()).slice(0, 10);
            const existingActiveDebt = findExistingActiveEmployeeDebt(payload);

            // CASE A: Employee already has an active unpaid debt -> Stack onto balance & save itemized history
            if (existingActiveDebt) {
                setIsConsolidatingDebt(true);

                const previousTotalAmount = currency(existingActiveDebt.total_debt_amount || 0).value;
                const previousRemaining = currency(existingActiveDebt.remainingDebt || 0).value;
                const newTotalDebtAmount = currency(previousTotalAmount).add(addedAmount).value;
                const newRemainingBalance = currency(previousRemaining).add(addedAmount).value;

                await recordDebtAdditionRow({
                    debtRecordForBaseline: existingActiveDebt,
                    debtId: existingActiveDebt.id,
                    amountAdded: addedAmount,
                    dateIncurred: effectiveDateStr,
                    reason: String(payload.description || '').trim() || 'Additional Cash Advance'
                });

                const updateFields = {
                    total_debt_amount: newTotalDebtAmount,
                    debt_date: effectiveDateStr
                };

                if (
                    payload.weekly_payment_amount !== undefined &&
                    payload.weekly_payment_amount !== null &&
                    payload.weekly_payment_amount !== '' &&
                    Number(payload.weekly_payment_amount) > 0
                ) {
                    updateFields.weekly_payment_amount = currency(payload.weekly_payment_amount).value;
                }

                if (payload.frequency) {
                    updateFields.frequency = payload.frequency;
                }

                if (!existingActiveDebt.employee_id && payload.employee_id) {
                    updateFields.employee_id = Number(payload.employee_id);
                }

                const { error } = await supabase
                    .from('debts')
                    .update(updateFields)
                    .eq('id', existingActiveDebt.id);

                if (error) throw error;

                const empLabel =
                    existingActiveDebt.resolvedEmployeeName ||
                    (payload.employee_id ? employeeById[String(payload.employee_id)]?.name : null) ||
                    existingActiveDebt.description ||
                    `Account #${existingActiveDebt.id}`;

                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'DEBT',
                    description: `Added ₱${addedAmount.toFixed(2)} to ${empLabel}'s active debt (#${existingActiveDebt.id}) on ${effectiveDateStr}. Remaining balance: ₱${previousRemaining.toFixed(2)} → ₱${newRemainingBalance.toFixed(2)}`
                });

                addToast({
                    title: 'Added to Existing Debt & History',
                    description: `+₱${addedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added to ${empLabel}'s debt history. New remaining balance: ₱${newRemainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
                    variant: 'success'
                });

                await invalidateAllDebtQueries();
                return;
            }

            // CASE B: No active debt -> Create new public.debts row & record initial history item
            const createdDebt = await createDebtMutation.mutateAsync(payload);

            let newDebtId = createdDebt?.id ?? (Array.isArray(createdDebt) ? createdDebt[0]?.id : null);
            if (!newDebtId) {
                let lookupQuery = supabase
                    .from('debts')
                    .select('id')
                    .eq('type', payload.type || 'company')
                    .order('id', { ascending: false })
                    .limit(1);

                if (payload.employee_id) {
                    lookupQuery = lookupQuery.eq('employee_id', payload.employee_id);
                }

                const { data: latestRow } = await lookupQuery.maybeSingle();
                newDebtId = latestRow?.id || null;
            }

            if (newDebtId) {
                await recordDebtAdditionRow({
                    debtId: newDebtId,
                    amountAdded: addedAmount,
                    dateIncurred: effectiveDateStr,
                    reason: String(payload.description || '').trim() || 'Initial Debt / Advance'
                });
            }

            await logActivity({
                user,
                action: 'CREATE',
                entity_type: 'DEBT',
                description: `Logged ${payload.type === 'company' ? 'company liability' : 'employee advance'}: "${payload.description}" (₱${addedAmount.toFixed(2)})`
            });

            addToast({
                title: 'Success',
                description: `${payload.type === 'company' ? 'Company liability' : 'Employee advance'} logged with history.`,
                variant: 'success'
            });

            await invalidateAllDebtQueries();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsConsolidatingDebt(false);
        }
    };

    const handleConfirmPayment = async ({ debt, amount, date, recordToExpense = false }) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Recording payments is disabled in demo mode.', variant: 'warning' });
        if (!isAdmin) return addToast({ title: 'Admin Only', description: 'Only administrators can record debt payments.', variant: 'destructive' });

        setIsSubmittingPayment(true);
        try {
            const numericAmount = currency(amount).value;
            const cleanDateStr = String(date || getManilaDateStr()).trim().slice(0, 10);

            await createPaymentMutation.mutateAsync({
                debt_id: parseInt(debt.id, 10),
                amount_paid: numericAmount,
                date_paid: cleanDateStr
            });

            const isCompanyDebt = !debt.type || debt.type === 'company';
            const shouldLogExpense = isCompanyDebt && Boolean(recordToExpense);

            if (shouldLogExpense) {
                const manilaExpenseIso = /^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)
                    ? new Date(`${cleanDateStr}T12:00:00+08:00`).toISOString()
                    : date;

                await createExpenseMutation.mutateAsync({
                    expense_date: manilaExpenseIso,
                    category: 'Debt Repayment',
                    description: `Debt Payment - ${debt.description || `Account #${debt.id}`}`,
                    amount: numericAmount
                });
            }

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'DEBT',
                description: `Recorded ₱${numericAmount.toFixed(2)} payment for "${debt.description || `Account #${debt.id}`}"${shouldLogExpense ? ' (also logged to Expenses)' : ' (debt deduction only)'}`
            });

            addToast({
                title: 'Payment Recorded',
                description: shouldLogExpense
                    ? `Deducted ₱${numericAmount.toFixed(2)} from ${debt.description} and recorded to Expenses.`
                    : `Deducted ₱${numericAmount.toFixed(2)} from ${debt.description}.`,
                variant: 'success'
            });

            setPaymentModalTarget(null);
            await invalidateAllDebtQueries();
            if (shouldLogExpense) {
                queryClient?.invalidateQueries({ queryKey: ['expenses'] });
                queryClient?.invalidateQueries({ queryKey: ['expense-summary'] });
            }
        } catch (error) {
            addToast({ title: 'Payment Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleUpdateDebt = async (updatedDebt) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Editing records is disabled in demo mode.', variant: 'warning' });
        if (!isAdmin) return addToast({ title: 'Admin Only', description: 'Only administrators can edit debt accounts.', variant: 'destructive' });

        setIsUpdatingDebt(true);
        try {
            const newTotal = currency(updatedDebt.total_debt_amount || 0).value;
            const prevDebt = [...employeeDebts, ...companyDebts].find(d => String(d.id) === String(updatedDebt.id));
            const prevTotal = currency(prevDebt?.total_debt_amount || 0).value;
            const diff = currency(newTotal).subtract(prevTotal).value;

            const { error } = await supabase
                .from('debts')
                .update({
                    description: updatedDebt.description,
                    total_debt_amount: newTotal,
                    weekly_payment_amount: updatedDebt.weekly_payment_amount ?? 0,
                    frequency: updatedDebt.frequency,
                    debt_date: updatedDebt.debt_date
                })
                .eq('id', updatedDebt.id);

            if (error) throw error;

            const existingRows = additionsByDebtId[String(updatedDebt.id)] || [];
            if (existingRows.length === 1) {
                await supabase
                    .from('debt_additions')
                    .update({
                        amount_added: newTotal,
                        date_incurred: String(updatedDebt.debt_date || getManilaDateStr()).slice(0, 10),
                        reason: updatedDebt.description || existingRows[0].reason
                    })
                    .eq('id', existingRows[0].id);
            } else if (diff > 0) {
                await recordDebtAdditionRow({
                    debtRecordForBaseline: existingRows.length === 0 ? prevDebt : null,
                    debtId: updatedDebt.id,
                    amountAdded: diff,
                    dateIncurred: updatedDebt.debt_date || getManilaDateStr(),
                    reason: 'Admin Manual Balance Adjustment (+)'
                });
            }

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'DEBT',
                description: `Updated debt account #${updatedDebt.id}: "${updatedDebt.description}" (₱${newTotal.toFixed(2)})`
            });

            addToast({ title: 'Updated', description: `Account #${updatedDebt.id} updated.`, variant: 'success' });
            setEditingDebt(null);
            await invalidateAllDebtQueries();
        } catch (err) {
            addToast({ title: 'Update Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsUpdatingDebt(false);
        }
    };

    const handleDeleteDebt = async (debt) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Deleting records is disabled in demo mode.', variant: 'warning' });
        if (!isAdmin) return addToast({ title: 'Admin Only', description: 'Only administrators can delete debt accounts.', variant: 'destructive' });
        if (!window.confirm(`Are you sure you want to delete "${debt.description}" (#${debt.id})? All recorded debt history and payments will also be deleted.`)) return;

        try {
            await supabase.from('debt_additions').delete().eq('debt_id', debt.id);
            await supabase.from('debt_payments').delete().eq('debt_id', debt.id);
            const { error } = await supabase.from('debts').delete().eq('id', debt.id);
            if (error) throw error;

            await logActivity({
                user,
                action: 'DELETE',
                entity_type: 'DEBT',
                description: `Deleted debt account #${debt.id}: "${debt.description}"`
            });

            addToast({ title: 'Deleted', description: `Account #${debt.id} removed.`, variant: 'success' });
            await invalidateAllDebtQueries();
        } catch (err) {
            addToast({ title: 'Delete Error', description: err.message, variant: 'destructive' });
        }
    };

    // =========================================================================
    // ADMIN LEDGER ITEM CRUD HANDLERS (Create / Edit / Delete inside History Modal)
    // =========================================================================
    const handleAdminCreateLedgerEntry = async (e) => {
        e.preventDefault();
        if (!historyModalTarget || !ledgerAddMode || isDemo || !isAdmin) return;

        const numericAmt = currency(ledgerNewAmount).value;
        if (numericAmt <= 0) {
            return addToast({ title: 'Invalid Amount', description: 'Enter an amount greater than ₱0.00.', variant: 'destructive' });
        }

        const cleanDate = String(ledgerNewDate || getManilaDateStr()).slice(0, 10);
        setIsLedgerMutating(true);
        try {
            if (ledgerAddMode === 'DEBT_ADDED') {
                await recordDebtAdditionRow({
                    debtRecordForBaseline: historyModalTarget,
                    debtId: historyModalTarget.id,
                    amountAdded: numericAmt,
                    dateIncurred: cleanDate,
                    reason: String(ledgerNewReason || '').trim() || 'Additional Cash Advance'
                });
                const updatedTotal = await syncParentDebtTotalFromAdditions(historyModalTarget.id);

                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'DEBT',
                    description: `Admin added ₱${numericAmt.toFixed(2)} loan entry to "${historyModalTarget.resolvedEmployeeName || historyModalTarget.description}" (#${historyModalTarget.id}). Total Incurred: ₱${updatedTotal.toFixed(2)}`
                });

                addToast({
                    title: 'Debt Entry Added',
                    description: `Added +₱${numericAmt.toFixed(2)} to history and updated balance.`,
                    variant: 'success'
                });
            } else {
                await createPaymentMutation.mutateAsync({
                    debt_id: parseInt(historyModalTarget.id, 10),
                    amount_paid: numericAmt,
                    date_paid: cleanDate
                });

                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'DEBT',
                    description: `Admin recorded ₱${numericAmt.toFixed(2)} payment in ledger for "${historyModalTarget.resolvedEmployeeName || historyModalTarget.description}" (#${historyModalTarget.id})`
                });

                addToast({
                    title: 'Payment Entry Added',
                    description: `Recorded -₱${numericAmt.toFixed(2)} payment in history.`,
                    variant: 'success'
                });
            }

            setLedgerAddMode(null);
            setLedgerNewAmount('');
            setLedgerNewReason('');
            setLedgerNewDate(getManilaDateStr());
            await invalidateAllDebtQueries();
        } catch (err) {
            addToast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsLedgerMutating(false);
        }
    };

    const handleAdminSaveLedgerEdit = async () => {
        if (!historyModalTarget || !editingLedgerEvent || isDemo || !isAdmin) return;

        const numericAmt = currency(editingLedgerEvent.amount).value;
        if (numericAmt <= 0) {
            return addToast({ title: 'Invalid Amount', description: 'Amount must be greater than ₱0.00.', variant: 'destructive' });
        }
        const cleanDate = String(editingLedgerEvent.eventDate || getManilaDateStr()).slice(0, 10);

        setIsLedgerMutating(true);
        try {
            if (editingLedgerEvent.entryType === 'DEBT_ADDED') {
                if (editingLedgerEvent.isSyntheticInitial) {
                    const { error } = await supabase.from('debt_additions').insert([
                        {
                            debt_id: parseInt(historyModalTarget.id, 10),
                            date_incurred: cleanDate,
                            amount_added: numericAmt,
                            reason: String(editingLedgerEvent.note || '').trim() || 'Initial Debt Balance',
                            created_by: user?.id || null
                        }
                    ]);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('debt_additions')
                        .update({
                            date_incurred: cleanDate,
                            amount_added: numericAmt,
                            reason: String(editingLedgerEvent.note || '').trim() || 'Cash Advance'
                        })
                        .eq('id', editingLedgerEvent.rawId);
                    if (error) throw error;
                }

                const newTotal = await syncParentDebtTotalFromAdditions(historyModalTarget.id);

                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'DEBT',
                    description: `Admin updated loan history entry on account #${historyModalTarget.id} to ₱${numericAmt.toFixed(2)} (${cleanDate}). New Total Incurred: ₱${newTotal.toFixed(2)}`
                });

                addToast({ title: 'Loan Entry Updated', description: 'Debt history and balance recalculated.', variant: 'success' });
            } else {
                const { error } = await supabase
                    .from('debt_payments')
                    .update({
                        date_paid: cleanDate,
                        amount_paid: numericAmt
                    })
                    .eq('id', editingLedgerEvent.rawId);
                if (error) throw error;

                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'DEBT',
                    description: `Admin updated payment entry #${editingLedgerEvent.rawId} on account #${historyModalTarget.id} to ₱${numericAmt.toFixed(2)} (${cleanDate})`
                });

                addToast({ title: 'Payment Updated', description: 'Payment history and remaining balance updated.', variant: 'success' });
            }

            setEditingLedgerEvent(null);
            await invalidateAllDebtQueries();
        } catch (err) {
            addToast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsLedgerMutating(false);
        }
    };

    const handleAdminDeleteLedgerEvent = async (ev) => {
        if (!historyModalTarget || isDemo || !isAdmin) return;

        const label = ev.entryType === 'DEBT_ADDED' ? 'debt incurred entry' : 'payment entry';
        if (!window.confirm(`Delete this ${label} of ₱${Number(ev.amount).toFixed(2)} (${formatManilaDisplayDate(ev.eventDate)})? The account balance will update automatically.`)) {
            return;
        }

        setIsLedgerMutating(true);
        try {
            if (ev.entryType === 'DEBT_ADDED') {
                if (ev.isSyntheticInitial) {
                    await supabase
                        .from('debts')
                        .update({ total_debt_amount: 0 })
                        .eq('id', historyModalTarget.id);
                } else {
                    const { error } = await supabase
                        .from('debt_additions')
                        .delete()
                        .eq('id', ev.rawId);
                    if (error) throw error;

                    await syncParentDebtTotalFromAdditions(historyModalTarget.id);
                }

                await logActivity({
                    user,
                    action: 'DELETE',
                    entity_type: 'DEBT',
                    description: `Admin deleted ₱${Number(ev.amount).toFixed(2)} loan entry from account #${historyModalTarget.id}`
                });

                addToast({ title: 'Loan Entry Deleted', description: 'Removed loan entry and recalculated total debt.', variant: 'success' });
            } else {
                const { error } = await supabase
                    .from('debt_payments')
                    .delete()
                    .eq('id', ev.rawId);
                if (error) throw error;

                await logActivity({
                    user,
                    action: 'DELETE',
                    entity_type: 'DEBT',
                    description: `Admin deleted ₱${Number(ev.amount).toFixed(2)} payment entry from account #${historyModalTarget.id}`
                });

                addToast({ title: 'Payment Deleted', description: 'Removed payment entry and updated remaining balance.', variant: 'success' });
            }

            if (editingLedgerEvent?.uid === ev.uid) {
                setEditingLedgerEvent(null);
            }
            await invalidateAllDebtQueries();
        } catch (err) {
            addToast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsLedgerMutating(false);
        }
    };

    const closeHistoryModal = () => {
        setHistoryModalDebtId(null);
        setLedgerAddMode(null);
        setEditingLedgerEvent(null);
    };

    const isFormSubmitting = createDebtMutation.isPending || isConsolidatingDebt;

    return (
        <div className="debt-page w-full max-w-7xl mx-auto px-1.5 pt-2 pb-32 sm:px-5 sm:pt-5 sm:pb-32 md:p-6 space-y-2.5 sm:space-y-6 overflow-x-hidden transition-colors dark:[color-scheme:dark]">
            <Head>
                <title>Debt Management | Seaside WRS</title>
            </Head>

            <style jsx global>{`
                @media (max-width: 767px) {
                    .app:has(.debt-page) .main,
                    .app:has(.debt-page) .container {
                        padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important;
                    }
                }
                @media (max-width: 639px) {
                    .app:has(.debt-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.debt-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .debt-page .grid.grid-cols-3 {
                        gap: 0.375rem !important;
                    }
                    .debt-page .grid.grid-cols-3 > div {
                        padding: 0.625rem !important;
                        border-radius: 0.75rem !important;
                    }
                    .debt-page .rounded-3xl {
                        border-radius: 0.875rem !important;
                    }
                }
                .debt-page .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .debt-page .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Header & Segmented Domain Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 px-0.5 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        {activeTab === 'company' ? (
                            <>
                                <Landmark className="text-[#8DB600] dark:text-lime-400 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                <span>Company Debt Management</span>
                            </>
                        ) : (
                            <>
                                <Users className="text-indigo-600 dark:text-indigo-400 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                <span>Employee Debt Management</span>
                            </>
                        )}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeTab === 'company'
                            ? 'Log capital liabilities and track real-time amortization balances.'
                            : 'New advances stack onto existing balances while preserving a full editable Admin debt & payment history.'}
                    </p>
                </div>

                {/* Segmented Top Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl w-full sm:w-auto border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('company'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer select-none ${
                            activeTab === 'company'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        <Landmark className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400 shrink-0" />
                        <span>Company ({companyMetrics.activeCount})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('employee'); setStatusFilter('active'); }}
                        className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer select-none ${
                            activeTab === 'employee'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Employees ({employeeMetrics.activeCount})</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <DebtMetricsCards metrics={currentMetrics} activeTab={activeTab} />

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-6 items-start">
                {/* Left Column: Form (Enabled for Admin) */}
                {isAdmin && (
                    <div className="lg:col-span-4 space-y-2.5 sm:space-y-4">
                        {activeTab === 'company' ? (
                            <CompanyDebtForm
                                onSubmit={handleCreateDebt}
                                isSubmitting={isFormSubmitting}
                                isDemo={isDemo}
                            />
                        ) : (
                            <EmployeeDebtForm
                                employees={employees}
                                activeEmployeeDebts={employeeDebts.filter(d => d.remainingDebt > 0)}
                                onSubmit={handleCreateDebt}
                                isSubmitting={isFormSubmitting}
                                isDemo={isDemo}
                            />
                        )}
                    </div>
                )}

                {/* Right Column: Registry Table, Quick Ledger Strip & Filters */}
                <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-2.5 sm:space-y-4`}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {activeTab === 'company' ? 'Company Liability Registry' : 'Employee Liability Registry'}
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 ${
                                    statusFilter === 'active'
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>Active</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    statusFilter === 'active'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {currentMetrics.activeCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('cleared')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 ${
                                    statusFilter === 'cleared'
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>Cleared</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    statusFilter === 'cleared'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {currentMetrics.clearedCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none shrink-0 ${
                                    statusFilter === 'all'
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                All ({currentMetrics.totalCount})
                            </button>
                        </div>
                    </div>

                    {/* Quick Debt Ledger Access Strip */}
                    {displayedDebts.length > 0 && (
                        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-50/50 dark:bg-slate-900/90 border border-indigo-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 mr-1">
                                <History className="w-3.5 h-3.5 shrink-0" />
                                <span>{isAdmin ? 'Manage Debt History Ledgers:' : 'Debt History Ledgers:'}</span>
                            </span>
                            {displayedDebts.map(d => {
                                const label =
                                    d.resolvedEmployeeName ||
                                    d.description ||
                                    `Account #${d.id}`;
                                return (
                                    <button
                                        key={`ledger-btn-${d.id}`}
                                        type="button"
                                        onClick={() => {
                                            setHistoryModalDebtId(d.id);
                                            setLedgerAddMode(null);
                                            setEditingLedgerEvent(null);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs transition-colors cursor-pointer"
                                    >
                                        <span className="truncate max-w-[140px]">{label}</span>
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                                            {d.additionsCount} {d.additionsCount === 1 ? 'loan' : 'loans'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden transition-colors">
                        <CardContent className="p-0">
                            <DebtRegistryTable
                                data={displayedDebts}
                                isLoading={isLoading}
                                emptyMessage={statusFilter === 'active' ? 'No active debts found. All cleared!' : 'No debt records found.'}
                                onPay={isAdmin ? setPaymentModalTarget : undefined}
                                onEdit={isAdmin ? setEditingDebt : undefined}
                                onDelete={isAdmin ? handleDeleteDebt : undefined}
                                onViewHistory={(debt) => {
                                    setHistoryModalDebtId(debt.id);
                                    setLedgerAddMode(null);
                                    setEditingLedgerEvent(null);
                                }}
                                isDemo={isDemo || !isAdmin}
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

            {/* Portaled Debt & Payment History Modal (Immune to parent flex/margin clipping) */}
            {mounted &&
                historyModalTarget &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
                        onClick={closeHistoryModal}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="shrink-0 p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                                            {historyModalTarget.resolvedEmployeeName || historyModalTarget.description}
                                        </h3>
                                        {isAdmin && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>Admin Editable</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Complete ledger of incurred debts (+₱) and deductions/payments (-₱)
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {isAdmin && !isDemo && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const target = historyModalTarget;
                                                    closeHistoryModal();
                                                    setEditingDebt(target);
                                                }}
                                                title="Edit parent account terms"
                                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const target = historyModalTarget;
                                                    closeHistoryModal();
                                                    handleDeleteDebt(target);
                                                }}
                                                title="Delete entire debt account"
                                                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={closeHistoryModal}
                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
                                        aria-label="Close history modal"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Summary Strip */}
                            <div className="shrink-0 grid grid-cols-3 gap-2 p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center tabular-nums">
                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Incurred</span>
                                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                        {currency(historyModalTarget.total_debt_amount).format({ symbol: '₱' })}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30">
                                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Total Paid</span>
                                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                                        {currency(historyModalTarget.totalPaid).format({ symbol: '₱' })}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30">
                                    <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">Remaining</span>
                                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                                        {currency(historyModalTarget.remainingDebt).format({ symbol: '₱' })}
                                    </span>
                                </div>
                            </div>

                            {/* Admin Quick Create Toolbar (+ Add Debt / + Add Payment) */}
                            {isAdmin && !isDemo && (
                                <div className="shrink-0 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                            Admin Ledger Actions:
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingLedgerEvent(null);
                                                    setLedgerNewDate(getManilaDateStr());
                                                    setLedgerNewAmount('');
                                                    setLedgerNewReason('');
                                                    setLedgerAddMode(prev => prev === 'DEBT_ADDED' ? null : 'DEBT_ADDED');
                                                }}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                                                    ledgerAddMode === 'DEBT_ADDED'
                                                        ? 'bg-rose-600 text-white border-rose-600'
                                                        : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                }`}
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>Add Debt (+₱)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingLedgerEvent(null);
                                                    setLedgerNewDate(getManilaDateStr());
                                                    setLedgerNewAmount('');
                                                    setLedgerNewReason('');
                                                    setLedgerAddMode(prev => prev === 'PAYMENT' ? null : 'PAYMENT');
                                                }}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                                                    ledgerAddMode === 'PAYMENT'
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                }`}
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>Add Payment (-₱)</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline Create Form */}
                                    {ledgerAddMode && (
                                        <form
                                            onSubmit={handleAdminCreateLedgerEntry}
                                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                                        Date (Manila)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={ledgerNewDate}
                                                        onChange={e => setLedgerNewDate(e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                                        Amount (₱)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        required
                                                        placeholder="0.00"
                                                        value={ledgerNewAmount}
                                                        onChange={e => setLedgerNewAmount(e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            {ledgerAddMode === 'DEBT_ADDED' && (
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                                        Reason / Description
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., Emergency Bale, Additional Cash Advance"
                                                        value={ledgerNewReason}
                                                        onChange={e => setLedgerNewReason(e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-1.5 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setLedgerAddMode(null)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isLedgerMutating}
                                                    className={`px-3 py-1 rounded-lg text-xs font-extrabold text-white cursor-pointer disabled:opacity-50 ${
                                                        ledgerAddMode === 'DEBT_ADDED'
                                                            ? 'bg-rose-600 hover:bg-rose-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                                    }`}
                                                >
                                                    {isLedgerMutating
                                                        ? 'Saving...'
                                                        : ledgerAddMode === 'DEBT_ADDED'
                                                            ? 'Save New Debt'
                                                            : 'Save Payment'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Section Subheader */}
                            <div className="shrink-0 px-4 pt-3 pb-1 flex items-center justify-between bg-white dark:bg-slate-900">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Borrowing &amp; Repayment History
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {(historyModalTarget.ledgerHistory || []).length}{' '}
                                    {(historyModalTarget.ledgerHistory || []).length === 1 ? 'record' : 'records'}
                                </span>
                            </div>

                            {/* Chronological Events List with Explicit Min/Max Height */}
                            <div className="px-4 pb-4 pt-1.5 min-h-[220px] max-h-[45vh] overflow-y-auto space-y-2.5 bg-white dark:bg-slate-900">
                                {(historyModalTarget.ledgerHistory || []).length === 0 ? (
                                    <div className="py-12 text-center text-xs font-semibold text-slate-400">
                                        No debt or payment history entries recorded yet.
                                    </div>
                                ) : (
                                    (historyModalTarget.ledgerHistory || []).map(ev => {
                                        const isAdded = ev.entryType === 'DEBT_ADDED';
                                        const isEditingThis = editingLedgerEvent?.uid === ev.uid;

                                        if (isEditingThis && isAdmin) {
                                            return (
                                                <div
                                                    key={ev.uid}
                                                    className="p-3 rounded-xl border-2 border-indigo-500/60 bg-indigo-50/30 dark:bg-slate-800/90 space-y-2.5 tabular-nums"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
                                                            Editing {isAdded ? 'Debt Incurred (+₱)' : 'Payment Entry (-₱)'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                                                Date
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={editingLedgerEvent.eventDate}
                                                                onChange={e =>
                                                                    setEditingLedgerEvent(prev => ({
                                                                        ...prev,
                                                                        eventDate: e.target.value
                                                                    }))
                                                                }
                                                                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                                                Amount (₱)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                value={editingLedgerEvent.amount}
                                                                onChange={e =>
                                                                    setEditingLedgerEvent(prev => ({
                                                                        ...prev,
                                                                        amount: e.target.value
                                                                    }))
                                                                }
                                                                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>

                                                    {isAdded && (
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                                                Reason / Description
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={editingLedgerEvent.note}
                                                                onChange={e =>
                                                                    setEditingLedgerEvent(prev => ({
                                                                        ...prev,
                                                                        note: e.target.value
                                                                    }))
                                                                }
                                                                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex justify-end gap-1.5 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingLedgerEvent(null)}
                                                            disabled={isLedgerMutating}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAdminSaveLedgerEdit}
                                                            disabled={isLedgerMutating}
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:opacity-50"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>{isLedgerMutating ? 'Updating...' : 'Update'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={ev.uid}
                                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 tabular-nums ${
                                                    isAdded
                                                        ? 'bg-rose-50/45 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50'
                                                        : 'bg-emerald-50/45 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <div
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                            isAdded
                                                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {isAdded ? (
                                                            <PlusCircle className="w-4 h-4" />
                                                        ) : (
                                                            <ArrowDownLeft className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span
                                                                className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                    isAdded
                                                                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                                                                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                                                }`}
                                                            >
                                                                {isAdded ? 'Debt Incurred' : 'Payment / Deduction'}
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatManilaDisplayDate(ev.eventDate)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 break-words">
                                                            {ev.note}
                                                        </p>
                                                        {ev.recordedBy && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                Logged by {ev.recordedBy}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 shrink-0">
                                                    <div className="text-right">
                                                        <span
                                                            className={`text-xs sm:text-sm font-black block ${
                                                                isAdded
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-emerald-600 dark:text-emerald-400'
                                                            }`}
                                                        >
                                                            {isAdded ? '+' : '-'}
                                                            {currency(ev.amount).format({ symbol: '₱' })}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                                            Bal: {currency(ev.runningBalance).format({ symbol: '₱' })}
                                                        </span>
                                                    </div>

                                                    {/* Admin Row Edit & Delete Controls */}
                                                    {isAdmin && !isDemo && (
                                                        <div className="flex flex-col sm:flex-row items-center gap-1 pl-1.5 border-l border-slate-200/70 dark:border-slate-700/70">
                                                            <button
                                                                type="button"
                                                                disabled={isLedgerMutating}
                                                                onClick={() => {
                                                                    setLedgerAddMode(null);
                                                                    setEditingLedgerEvent({
                                                                        uid: ev.uid,
                                                                        rawId: ev.rawId,
                                                                        entryType: ev.entryType,
                                                                        isSyntheticInitial: ev.isSyntheticInitial,
                                                                        eventDate: ev.eventDate,
                                                                        amount: ev.amount,
                                                                        note: ev.note
                                                                    });
                                                                }}
                                                                title="Edit this entry"
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isLedgerMutating}
                                                                onClick={() => handleAdminDeleteLedgerEvent(ev)}
                                                                title="Delete this entry"
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}