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
        <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-[#8DB600]" />
                    <span>Log Company Debt</span>
                </h3>
            </CardHeader>
            <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Date of Initiation</Label>
                        <Input
                            type="date"
                            value={debtDate}
                            onChange={e => setDebtDate(e.target.value)}
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Account Description</Label>
                        <Input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g., Solar Dryer Repair, Vehicle Registration"
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Total Principal (₱)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={totalDebtAmount}
                            onChange={e => setTotalDebtAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Installment (₱)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={weeklyPaymentAmount}
                                onChange={e => setWeeklyPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Frequency</Label>
                            <Select
                                value={debtFrequency}
                                onChange={e => setDebtFrequency(e.target.value)}
                                required
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                            >
                                <option value="Weekly">Weekly</option>
                                <option value="Every 15 days">Every 15 days</option>
                            </Select>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isDemo}
                        className="w-full h-10 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                    >
                        {isSubmitting ? 'Logging...' : 'Save Company Debt'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}