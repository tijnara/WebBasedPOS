// src/components/debts/EmployeeDebtForm.jsx
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

export default function EmployeeDebtForm({ employees = [], onSubmit, isSubmitting, isDemo }) {
    const [empDebtDate, setEmpDebtDate] = useState(getTodayString());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [empReason, setEmpReason] = useState('');
    const [empTotalDebtAmount, setEmpTotalDebtAmount] = useState('');
    const [empWeeklyPaymentAmount, setEmpWeeklyPaymentAmount] = useState('');
    const [empDebtFrequency, setEmpDebtFrequency] = useState('Weekly');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const employee = employees.find(emp => String(emp.id) === String(selectedEmployeeId));
        const employeeName = employee ? employee.name : 'Unknown Employee';
        const finalDescription = empReason.trim() ? `${employeeName} - ${empReason.trim()}` : employeeName;

        await onSubmit({
            debt_date: empDebtDate,
            description: finalDescription,
            total_debt_amount: parseFloat(empTotalDebtAmount),
            weekly_payment_amount: parseFloat(empWeeklyPaymentAmount) || 0,
            frequency: empDebtFrequency,
            type: 'employee',
            employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : null
        });

        setSelectedEmployeeId('');
        setEmpReason('');
        setEmpTotalDebtAmount('');
        setEmpWeeklyPaymentAmount('');
        setEmpDebtFrequency('Weekly');
    };

    return (
        <Card className="border border-indigo-100 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-indigo-50 bg-indigo-50/40">
                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span>Log Employee Advance (Bale)</span>
                </h3>
            </CardHeader>
            <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Date of Advance</Label>
                        <Input
                            type="date"
                            value={empDebtDate}
                            onChange={e => setEmpDebtDate(e.target.value)}
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Employee Name</Label>
                        <Select
                            value={selectedEmployeeId}
                            onChange={e => setSelectedEmployeeId(e.target.value)}
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        >
                            <option value="" disabled>-- Select Staff Member --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Reason (Optional)</Label>
                        <Input
                            type="text"
                            value={empReason}
                            onChange={e => setEmpReason(e.target.value)}
                            placeholder="e.g., Medical Emergency, Motor Repair"
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Total Advance Amount (₱)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={empTotalDebtAmount}
                            onChange={e => setEmpTotalDebtAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Deduction (₱)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={empWeeklyPaymentAmount}
                                onChange={e => setEmpWeeklyPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Frequency</Label>
                            <Select
                                value={empDebtFrequency}
                                onChange={e => setEmpDebtFrequency(e.target.value)}
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
                        className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                    >
                        {isSubmitting ? 'Logging...' : 'Save Employee Debt'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}