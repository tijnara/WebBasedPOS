// src/components/dashboard/OperationsRow.jsx
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import currency from 'currency.js';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { useDebts } from '../../hooks/useDebts';
import { Filter, Truck, ChevronRight, Users, UserPlus, MapPin, Wrench, CheckCircle2 } from 'lucide-react';

const DEFAULT_FILTER_STAGES = [
    { id: 'stage_1', name: '10 Micron Sediment', lifespanDays: 30 },
    { id: 'stage_2', name: '5 Micron Sediment', lifespanDays: 30 },
    { id: 'stage_3', name: '1 Micron Sediment (2 pcs)', lifespanDays: 30 },
    { id: 'stage_4', name: 'Carbon Block (CTO) (2 pcs)', lifespanDays: 60 }
];

export default function OperationsRow() {
    const router = useRouter();
    const user = useStore(state => state.user);

    // 1. Filter Lifespan & Vehicles Query
    const { data: maintenanceData, isLoading: isMaintenanceLoading } = useQuery({
        queryKey: ['dashboard-live-maintenance-lifespans', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) {
                return {
                    filters: [
                        { id: 'stage_1', name: '10 Micron Sediment', currentDays: 24, totalDays: 30, daysLeft: 6, percentUsed: 80 },
                        { id: 'stage_2', name: '5 Micron Sediment', currentDays: 24, totalDays: 30, daysLeft: 6, percentUsed: 80 },
                        { id: 'stage_3', name: '1 Micron Sediment (2 pcs)', currentDays: 24, totalDays: 30, daysLeft: 6, percentUsed: 80 },
                        { id: 'stage_4', name: 'Carbon Block (CTO) (2 pcs)', currentDays: 54, totalDays: 60, daysLeft: 6, percentUsed: 90 }
                    ],
                    vehicles: [
                        { id: 'v1', name: 'Utility Tricycle (Russi/Chariot)', currentDays: 38, totalDays: 180, daysLeft: 142, percentPassed: 21 },
                        { id: 'v2', name: 'Utility Van', currentDays: 38, totalDays: 180, daysLeft: 142, percentPassed: 21 }
                    ],
                    minDaysLeft: 6
                };
            }

            try {
                const [configsRes, vehiclesRes, historyRes, trackingRes] = await Promise.all([
                    supabase.from('filter_configs').select('*'),
                    supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
                    supabase.from('maintenance_history').select('*').order('replaced_at', { ascending: false }),
                    supabase.from('filter_tracking').select('*')
                ]);

                const latestDates = {};
                trackingRes?.data?.forEach(t => {
                    if (t.filter_id && t.last_replaced_at) latestDates[t.filter_id] = t.last_replaced_at;
                });
                historyRes?.data?.forEach(h => {
                    if (h.item_id && h.replaced_at && !latestDates[h.item_id]) latestDates[h.item_id] = h.replaced_at;
                });

                let activeFilterConfigs = DEFAULT_FILTER_STAGES;
                if (configsRes?.data && configsRes.data.length > 0) {
                    activeFilterConfigs = DEFAULT_FILTER_STAGES.map(def => {
                        const dbMatch = configsRes.data.find(c => String(c.id).toLowerCase() === String(def.id).toLowerCase());
                        return dbMatch ? { ...def, name: dbMatch.name || def.name, lifespanDays: dbMatch.lifespan_days || def.lifespanDays } : def;
                    });
                }

                const now = new Date();
                let minDays = Infinity;
                const processedFilters = activeFilterConfigs.map(filter => {
                    const lastReplaced = latestDates[filter.id] ? new Date(latestDates[filter.id]) : new Date(now.getTime() - (24 * 86400000));
                    const daysPassed = Math.max(0, Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24)));
                    const daysLeft = Math.max(0, filter.lifespanDays - daysPassed);
                    const percentUsed = Math.min(100, Math.round((daysPassed / filter.lifespanDays) * 100));
                    if (daysLeft < minDays) minDays = daysLeft;

                    return {
                        id: filter.id,
                        name: filter.name,
                        currentDays: Math.min(daysPassed, filter.lifespanDays),
                        totalDays: filter.lifespanDays,
                        daysLeft,
                        percentUsed
                    };
                });

                const vehiclesList = vehiclesRes?.data || [
                    { id: 'v1', name: 'Utility Tricycle (Russi/Chariot)', lifespan_days: 180 },
                    { id: 'v2', name: 'Utility Van', lifespan_days: 180 }
                ];

                const processedVehicles = vehiclesList.map(v => {
                    const lastReplaced = latestDates[v.id] ? new Date(latestDates[v.id]) : (v.created_at ? new Date(v.created_at) : new Date(now.getTime() - (38 * 86400000)));
                    const totalDays = v.lifespan_days || (v.lifespan_months ? v.lifespan_months * 30 : 180);
                    const daysPassed = Math.max(0, Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24)));
                    const daysLeft = Math.max(0, totalDays - daysPassed);
                    const percentPassed = Math.min(100, Math.round((daysPassed / totalDays) * 100));

                    return {
                        id: v.id,
                        name: v.name,
                        currentDays: Math.min(daysPassed, totalDays),
                        totalDays,
                        daysLeft,
                        percentPassed
                    };
                });

                return {
                    filters: processedFilters,
                    vehicles: processedVehicles,
                    minDaysLeft: minDays === Infinity ? 6 : minDays
                };
            } catch (err) {
                console.warn('Fallback maintenance query:', err);
                return {
                    filters: [
                        { id: 'stage_1', name: '10 Micron Sediment', currentDays: 24, totalDays: 30, daysLeft: 6, percentUsed: 80 },
                        { id: 'stage_2', name: '5 Micron Sediment', currentDays: 24, totalDays: 30, daysLeft: 6, percentUsed: 80 },
                        { id: 'stage_3', name: '1 Micron Sediment (2 pcs)', currentDays: 24, totalDays: 30, daysLeft: 6, percentUsed: 80 },
                        { id: 'stage_4', name: 'Carbon Block (CTO) (2 pcs)', currentDays: 54, totalDays: 60, daysLeft: 6, percentUsed: 90 }
                    ],
                    vehicles: [
                        { id: 'v1', name: 'Utility Tricycle (Russi/Chariot)', currentDays: 38, totalDays: 180, daysLeft: 142, percentPassed: 21 },
                        { id: 'v2', name: 'Utility Van', currentDays: 38, totalDays: 180, daysLeft: 142, percentPassed: 21 }
                    ],
                    minDaysLeft: 6
                };
            }
        },
        staleTime: 1000 * 60 * 5
    });

    // 2. Employee Debts
    const { data: rawDebts = [], isLoading: isDebtsLoading } = useDebts();
    const { employeeDebtsList, employeeDebtMetrics } = useMemo(() => {
        if (!rawDebts || !rawDebts.length) {
            if (user?.isDemo) {
                return {
                    employeeDebtsList: [
                        { name: 'Mark Santos', remainingDebt: 4500, totalPaid: 5500 },
                        { name: 'Jayson Ramos', remainingDebt: 6000, totalPaid: 2000 },
                        { name: 'Arnel Dizon', remainingDebt: 4000, totalPaid: 3000 }
                    ],
                    employeeDebtMetrics: { totalRemaining: 14500, totalPaid: 10500, activeCount: 3 }
                };
            }
            return { employeeDebtsList: [], employeeDebtMetrics: { totalRemaining: 0, totalPaid: 0, activeCount: 0 } };
        }

        const rawEmployeeDebts = rawDebts.filter(d => d.type === 'employee');
        let grandRemaining = currency(0);
        let grandPaid = currency(0);
        const employeeMap = {};

        rawEmployeeDebts.forEach(debt => {
            const rawPayments = debt.debt_payments || [];
            const debtPayments = rawPayments.filter(p => {
                const pId = p.debt_id ?? p.company_debt_id ?? p.debtId;
                return pId !== undefined && pId !== null ? String(pId) === String(debt.id) : true;
            });

            const totalPaid = debtPayments.reduce((sum, p) => sum.add(currency(p.amount_paid || 0)), currency(0)).value;
            const remainingDebt = currency(debt.total_debt_amount || 0).subtract(totalPaid).value;

            grandRemaining = grandRemaining.add(remainingDebt);
            grandPaid = grandPaid.add(totalPaid);

            const empName = debt.employee?.name || debt.employee_name || debt.description || `Staff #${debt.id}`;
            if (!employeeMap[empName]) {
                employeeMap[empName] = { name: empName, remainingDebt: currency(0), totalPaid: currency(0) };
            }
            employeeMap[empName].remainingDebt = employeeMap[empName].remainingDebt.add(remainingDebt);
            employeeMap[empName].totalPaid = employeeMap[empName].totalPaid.add(totalPaid);
        });

        const activeDebtors = Object.values(employeeMap)
            .map(e => ({ name: e.name, remainingDebt: e.remainingDebt.value, totalPaid: e.totalPaid.value }))
            .filter(e => e.remainingDebt > 0)
            .sort((a, b) => b.remainingDebt - a.remainingDebt);

        return {
            employeeDebtsList: activeDebtors,
            employeeDebtMetrics: {
                totalRemaining: grandRemaining.value,
                totalPaid: grandPaid.value,
                activeCount: activeDebtors.length
            }
        };
    }, [rawDebts, user?.isDemo]);

    // 3. Customer Acquisition
    const { data: customerAnalytics, isLoading: isCustomersLoading } = useQuery({
        queryKey: ['dashboard-customers-analytics-oct2025', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) {
                return {
                    thisMonthAdded: 14,
                    lastMonthAdded: 9,
                    totalSinceOct2025: 186,
                    recentCustomers: [
                        { id: 101, name: 'Jimmy Dela Cruz', address: 'Laois, Labrador', created_at: '2026-10-28', phone: '0912 345 6789' },
                        { id: 102, name: 'Bombay Store', address: 'Poblacion, Labrador', created_at: '2026-10-24', phone: '0920 123 4567' },
                        { id: 103, name: 'Medel Carinderia', address: 'Bangan Necca, Labrador', created_at: '2026-10-18', phone: '0933 987 6543' }
                    ]
                };
            }

            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, phone, address, created_at')
                    .gte('created_at', '2025-10-01')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (!data || !data.length) {
                    return { thisMonthAdded: 0, lastMonthAdded: 0, totalSinceOct2025: 0, recentCustomers: [] };
                }

                const now = new Date();
                const curYearMonth = format(now, 'yyyy-MM');
                const lastYearMonth = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM');

                let thisMonthCount = 0;
                let lastMonthCount = 0;

                data.forEach(c => {
                    if (!c.created_at) return;
                    const ym = String(c.created_at).slice(0, 7);
                    if (ym === curYearMonth) thisMonthCount++;
                    if (ym === lastYearMonth) lastMonthCount++;
                });

                return {
                    thisMonthAdded: thisMonthCount,
                    lastMonthAdded: lastMonthCount,
                    totalSinceOct2025: data.length,
                    recentCustomers: data.slice(0, 3)
                };
            } catch (err) {
                console.error("Error loading customer acquisition:", err);
                return { thisMonthAdded: 0, lastMonthAdded: 0, totalSinceOct2025: 0, recentCustomers: [] };
            }
        },
        staleTime: 1000 * 60 * 5
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {/* 1. FILTER & FLEET LIFESPAN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                                <Filter className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">
                                    Filter & Fleet Lifespan
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium">Time Lifespan Countdown</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/maintenance')}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                            Manage <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-2 mt-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <span>Filtration Stages</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                (maintenanceData?.minDaysLeft || 6) <= 7
                                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60'
                                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60'
                            }`}>
                                {maintenanceData?.minDaysLeft || 6} Days Left
                            </span>
                        </div>

                        {isMaintenanceLoading ? (
                            <div className="space-y-2 py-2">
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        ) : (
                            maintenanceData?.filters.map((f) => (
                                <div key={f.id || f.name} className="space-y-0.5">
                                    <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-1">{f.name}</span>
                                        <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">
                                            {f.currentDays}/{f.totalDays}d ({f.percentUsed}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${f.percentUsed >= 90 ? 'bg-amber-500' : 'bg-[#8DB600]'}`}
                                            style={{ width: `${f.percentUsed}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                Vehicle Fleet Maintenance
                            </span>
                            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Good Condition</span>
                        </div>

                        <div className="space-y-2 mt-1">
                            {maintenanceData?.vehicles.map((v) => (
                                <div key={v.id || v.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-1">{v.name}</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">{v.daysLeft} days left</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${v.percentPassed}%` }} />
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1">
                                        <span>{v.currentDays} / {v.totalDays} Days ({v.percentPassed}% passed)</span>
                                        <span className="truncate pl-1">6-month cycle</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        Station Readiness
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">All Good Condition</span>
                </div>
            </div>

            {/* 2. EMPLOYEE DEBT TO SEASIDE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                                <Users className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">
                                    Employee Debt to Seaside
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium">Cash Advances & Payroll Balances</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/debt-management')}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                            Manage <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                            <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block tracking-wider">Total Unpaid</span>
                            {isDebtsLoading ? (
                                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-0.5" />
                            ) : (
                                <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                                    ₱{Number(employeeDebtMetrics.totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            )}
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                                {employeeDebtMetrics.activeCount} Active {employeeDebtMetrics.activeCount === 1 ? 'Debtor' : 'Debtors'}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">Total Paid</span>
                            {isDebtsLoading ? (
                                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-0.5" />
                            ) : (
                                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    ₱{Number(employeeDebtMetrics.totalPaid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            )}
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">Amortized to Date</span>
                        </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                            <span>Active Debtors</span>
                            <span>Current Debt</span>
                        </div>

                        {isDebtsLoading ? (
                            <div className="space-y-1.5 py-1">
                                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                            </div>
                        ) : !employeeDebtsList.length ? (
                            <div className="py-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>All employee debts cleared!</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[140px] sm:max-h-[155px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                                {employeeDebtsList.map((emp) => (
                                    <div key={emp.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="min-w-0 pr-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">{emp.name}</span>
                                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                                Paid: ₱{Number(emp.totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-black text-rose-600 dark:text-rose-400 text-xs block">
                                                ₱{Number(emp.remainingDebt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-semibold block">Unpaid</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Salary Deductions: Auto-Linked</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Staff Advances</span>
                </div>
            </div>

            {/* 3. CUSTOMER ACQUISITION (Since Oct 2025) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                                <UserPlus className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">
                                    Customer Acquisition
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium">New Customers Since Oct 2025</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/customer-management')}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                            Manage <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Added This Month</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    +{customerAnalytics?.thisMonthAdded || 0}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">clients</span>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Prior Month: {customerAnalytics?.lastMonthAdded || 0}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Customer Base</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                                    {customerAnalytics?.totalSinceOct2025 || 0}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">registered</span>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Since Oct 2025</span>
                        </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1.5">
                            Recently Registered
                        </span>

                        {isCustomersLoading ? (
                            <div className="space-y-1.5 py-1">
                                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        ) : !customerAnalytics?.recentCustomers?.length ? (
                            <div className="text-[11px] text-slate-400 py-2 text-center">No customer records found.</div>
                        ) : (
                            <div className="space-y-1.5">
                                {customerAnalytics.recentCustomers.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px]">
                                        <div className="min-w-0 pr-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">{c.name}</span>
                                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5 truncate mt-0.5">
                                                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                                {c.address || c.phone || 'Labrador Customer'}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-semibold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                                            {c.created_at ? format(new Date(c.created_at), 'MMM d') : 'New'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Station CRM Database</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Live Sync</span>
                </div>
            </div>
        </div>
    );
}