// src/components/salary/ManualSalaryCard.jsx
import React from 'react';
import currency from 'currency.js';
import { Card, CardHeader, CardContent, Button, Input, Label, Select } from '../ui';
import { FileText, AlertCircle, Plus } from 'lucide-react';

export default function ManualSalaryCard({
                                             employeeName,
                                             handleEmployeeSelect,
                                             employees,
                                             amount,
                                             setAmount,
                                             payoutDate,
                                             setPayoutDate,
                                             description,
                                             setDescription,
                                             dailyGallons,
                                             excessMultiplier,
                                             setExcessMultiplier,
                                             handleAddSalary,
                                             isPending
                                         }) {
    return (
        <Card className="rounded-2xl border border-blue-100 dark:border-blue-950/60 shadow-2xs bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 p-4 sm:p-5">
                <h3 className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    <span>Manual Record Salary Entry</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Record a salary payout or bonus into the Salary History below.
                </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
                <form onSubmit={handleAddSalary} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:items-end">
                    <div className="md:col-span-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee</Label>
                        <Select
                            value={employeeName}
                            onChange={handleEmployeeSelect}
                            required
                            className="h-10 sm:h-11 mt-1 text-xs sm:text-sm rounded-xl w-full border-slate-200 dark:border-slate-700"
                        >
                            <option value="" disabled>Select Staff...</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Gross Amount with Dedicated ₱ Badge & Decimal InputMode */}
                    <div className="md:col-span-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gross Amount (₱)</Label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 select-none z-10">
                                ₱
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                min="1"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                style={{ paddingLeft: '2rem' }}
                                className="h-10 sm:h-11 w-full !pl-8 text-xs sm:text-sm font-mono font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payout Date</Label>
                        <Input
                            type="date"
                            value={payoutDate}
                            onChange={e => { setPayoutDate(e.target.value); setExcessMultiplier('1'); }}
                            required
                            className="h-10 sm:h-11 mt-1 text-xs sm:text-sm rounded-xl w-full border-slate-200 dark:border-slate-700 font-semibold"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</Label>
                        <Input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            className="h-10 sm:h-11 mt-1 text-xs sm:text-sm rounded-xl w-full border-slate-200 dark:border-slate-700"
                        />
                    </div>

                    {/* Calculation Helper Info */}
                    {(employeeName && employees?.find(e => e.name === employeeName)) && (
                        <div className="md:col-span-2">
                            {(() => {
                                const emp = employees?.find(e => e.name === employeeName);
                                const isPerContainer = emp?.salary_type === 'per_container';
                                if (!isPerContainer && dailyGallons <= 100) return null;

                                return (
                                    <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200 flex flex-wrap gap-x-4 gap-y-1">
                                        {isPerContainer && (
                                            <span>
                                                <span className="font-bold opacity-70 uppercase mr-1">Base:</span>
                                                {dailyGallons} gal × ₱{emp.container_multiplier} = {currency(dailyGallons * Number(emp.container_multiplier || 1), { symbol: '₱' }).format()}
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
                        <div className="md:col-span-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row justify-between items-center gap-2.5">
                            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs font-medium">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Quota Exceeded: {dailyGallons - 100} gallons exceed the 100-gal quota.</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                <Label className="whitespace-nowrap text-amber-950 dark:text-amber-200 text-xs mb-0 font-bold">Multiplier:</Label>
                                <Select
                                    value={excessMultiplier}
                                    onChange={e => setExcessMultiplier(e.target.value)}
                                    className="h-9 w-full sm:w-28 text-xs bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800 rounded-lg"
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
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{isPending ? 'Saving...' : 'Record Salary'}</span>
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}