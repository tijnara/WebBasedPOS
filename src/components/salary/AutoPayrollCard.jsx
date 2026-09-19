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
        <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5"/> Auto-Deduct Payroll
                </h3>
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
                                                            (₱{d.baseAmount.toFixed(2)} / {d.frequency} | Date: {d.debtDate ? formatInTimeZone(toDate(d.debtDate), TIME_ZONE, 'MMM d, yyyy') : 'N/A'})
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

                        {/* Flex Layout for Totals */}
                        <div className="p-4 bg-indigo-50/30 flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex justify-between sm:flex-col sm:justify-start">
                                <span className="text-xs text-gray-500 uppercase font-semibold">History Gross &nbsp; &nbsp;</span>
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

                    <Button type="submit" disabled={isPending || activeDeductions.length === 0} className="w-full h-11 btn-apple-green text-white">
                        {isPending ? 'Processing...' : 'Process Deductions'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}