// src/components/debts/DebtPaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Label } from '../ui';
import { Receipt, X, AlertCircle } from 'lucide-react';
import currency from 'currency.js';

const getTodayString = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

export default function DebtPaymentModal({ targetDebt, isOpen, onClose, onConfirm, isSubmitting }) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(getTodayString());

    useEffect(() => {
        if (targetDebt) {
            const suggested = targetDebt.weekly_payment_amount && targetDebt.weekly_payment_amount <= targetDebt.remainingDebt
                ? String(targetDebt.weekly_payment_amount)
                : String(targetDebt.remainingDebt || '');
            setPaymentAmount(suggested);
            setPaymentDate(getTodayString());
        }
    }, [targetDebt]);

    if (!isOpen || !targetDebt) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onConfirm({
            debt: targetDebt,
            amount: parseFloat(paymentAmount),
            date: paymentDate
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <span>Record Payment / Amortization</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Account</span>
                            <span className="font-bold text-slate-900">{targetDebt.description}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                            <span className="font-black text-sm text-rose-600">
                                {currency(targetDebt.remainingDebt, { symbol: '₱' }).format()}
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700">Settlement Date</Label>
                        <Input
                            type="date"
                            value={paymentDate}
                            onChange={e => setPaymentDate(e.target.value)}
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700">Amount to Pay (₱)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            autoFocus
                            className="h-10 mt-1 text-sm font-mono font-bold rounded-xl border-slate-200 focus:border-emerald-600"
                        />
                    </div>

                    {(!targetDebt.type || targetDebt.type === 'company') && (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>This repayment will automatically log an expense under <strong>Debt Repayment</strong>.</span>
                        </div>
                    )}

                    <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                        >
                            {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}