// src/components/debts/CompanyDebtForm.jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Select } from '../ui';
import { PlusCircle } from 'lucide-react';

const getTodayString = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

export default function CompanyDebtForm({ onSubmit, isSubmitting, isDemo }) {
    const [debtDate, setDebtDate] = useState(getTodayString());
    const [description, setDescription] = useState('');
    const [totalDebtAmount, setTotalDebtAmount] = useState('');
    const [weeklyPaymentAmount, setWeeklyPaymentAmount] = useState('');
    const [debtFrequency, setDebtFrequency] = useState('Weekly');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit({
            debt_date: debtDate,
            description,
            total_debt_amount: parseFloat(totalDebtAmount),
            weekly_payment_amount: parseFloat(weeklyPaymentAmount) || 0,
            frequency: debtFrequency,
            type: 'company'
        });
        setDescription('');
        setTotalDebtAmount('');
        setWeeklyPaymentAmount('');
        setDebtFrequency('Weekly');
    };

    return (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-2xs rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-[#8DB600]" />
                    <span>Log Company Debt</span>
                </h3>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Initiation</Label>
                        <Input
                            type="date"
                            value={debtDate}
                            onChange={e => setDebtDate(e.target.value)}
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Description</Label>
                        <Input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g., Solar Dryer Repair, Vehicle Registration"
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Principal (₱)</Label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                                ₱
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                value={totalDebtAmount}
                                onChange={e => setTotalDebtAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="h-10 pl-7 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Installment (₱)</Label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                                    ₱
                                </span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={weeklyPaymentAmount}
                                    onChange={e => setWeeklyPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-10 pl-7 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Frequency</Label>
                            <Select
                                value={debtFrequency}
                                onChange={e => setDebtFrequency(e.target.value)}
                                required
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="Weekly">Weekly</option>
                                <option value="Every 15 days">Every 15 days</option>
                            </Select>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || isDemo}
                        className="w-full h-10 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md active:scale-[0.99] transition-transform"
                    >
                        {isSubmitting ? 'Logging...' : 'Save Company Debt'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}