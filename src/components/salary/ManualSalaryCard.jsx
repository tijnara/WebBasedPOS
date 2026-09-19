import React from 'react';
import currency from 'currency.js';
import { Card, CardHeader, CardContent, Button, Input, Label, Select } from '../ui';
import { FileText, AlertCircle } from 'lucide-react';

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
                                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                <span>Quota exceeded: {dailyGallons - 100} gallons exceed the 100-gal daily quota.</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                <Label className="whitespace-nowrap text-orange-900 mb-0">Multiplier:</Label>
                                <Select
                                    value={excessMultiplier}
                                    onChange={e => setExcessMultiplier(e.target.value)}
                                    className="h-10 w-full sm:w-32 bg-white border-orange-200"
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
                        <Button type="submit" disabled={isPending} className="btn--primary w-full h-11">
                            {isPending ? 'Saving...' : 'Record Salary'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}