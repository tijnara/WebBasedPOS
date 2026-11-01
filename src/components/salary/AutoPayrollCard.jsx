// src/components/salary/AutoPayrollCard.jsx
import React from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Select } from '../ui';
import { Calculator } from 'lucide-react';
import { formatInTimeZone, toDate } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Manila';

export default function AutoPayrollCard({
                                            payrollEmpId,
                                            setPayrollEmpId,
                                            payrollDate,
                                            setPayrollDate,
                                            employees,
                                            activeDeductions,
                                            payrollGross,
                                            payrollTotalDeductions,
                                            payrollNet,
                                            handleProcessPayroll,
                                            isPending
                                        }) {
    return (
        <Card className="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 shadow-2xs bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 p-4 sm:p-5">
                <h3 className="font-bold text-sm sm:text-base text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Auto-Deduct Payroll</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Calculates gross from the Salary History below and applies debts on cutoffs.
                </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
                <form onSubmit={handleProcessPayroll} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Employee</Label>
                            <Select
                                value={payrollEmpId}
                                onChange={(e) => setPayrollEmpId(e.target.value)}
                                required
                                className="h-10 sm:h-11 mt-1 text-xs sm:text-sm rounded-xl w-full border-slate-200 dark:border-slate-700"
                            >
                                <option value="" disabled>Select Staff...</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payout Date</Label>
                            <Input
                                type="date"
                                value={payrollDate}
                                onChange={e => setPayrollDate(e.target.value)}
                                required
                                className="h-10 sm:h-11 mt-1 text-xs sm:text-sm rounded-xl w-full border-slate-200 dark:border-slate-700 font-semibold"
                            />
                        </div>
                    </div>

                    {/* Computations Table UI - Responsive Layout */}
                    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs overflow-hidden mt-2">
                        <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Salary Computation
                        </div>

                        {activeDeductions.length > 0 ? (
                            <div className="px-3.5 py-3 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20">
                                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1.5 uppercase tracking-wide">
                                    Active Debt Deductions:
                                </p>
                                <ul className="text-xs space-y-1.5">
                                    {activeDeductions.map(d => (
                                        <li key={d.debt_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                            <span className="flex-1 text-slate-700 dark:text-slate-300 break-words font-medium">
                                                {d.description}
                                                <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2">
                                                    (₱{d.baseAmount.toFixed(2)} / {d.frequency} • {d.debtDate ? formatInTimeZone(toDate(d.debtDate), TIME_ZONE, 'MMM d, yyyy') : 'N/A'})
                                                </span>
                                            </span>
                                            <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0 font-mono">
                                                -₱{d.amount.toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 italic">
                                No active auto-deductions found for the selected date.
                            </div>
                        )}

                        {/* Flex Layout for Totals */}
                        <div className="p-3.5 sm:p-4 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                            <div className="flex justify-between sm:flex-col sm:justify-start">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">History Gross</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base font-mono">
                                    ₱{payrollGross.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between sm:flex-col sm:justify-start">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Deduction</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm sm:text-base font-mono">
                                    -₱{payrollTotalDeductions.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between sm:flex-col sm:text-right border-t border-indigo-100 dark:border-indigo-900/50 sm:border-0 pt-2 sm:pt-0">
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 uppercase font-black tracking-wider">Net Payout</span>
                                <span className="font-black text-xl sm:text-2xl text-indigo-600 dark:text-indigo-300 font-mono">
                                    ₱{payrollNet.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Differentiated Administrative Action Button */}
                    <Button
                        type="submit"
                        disabled={isPending || activeDeductions.length === 0}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                        {isPending ? 'Processing Deductions...' : 'Process Deductions'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}