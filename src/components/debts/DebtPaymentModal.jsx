// src/components/debts/DebtPaymentModal.jsx
import React, { useState, useEffect } from 'react';
import currency from 'currency.js';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogCloseButton,
    Button,
    Input,
    Label
} from '../ui';
import { DollarSign, Receipt, CheckCircle2, Info } from 'lucide-react';

function getManilaTodayString() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

export default function DebtPaymentModal({
                                             targetDebt,
                                             isOpen,
                                             onClose,
                                             onConfirm,
                                             isSubmitting = false
                                         }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(getManilaTodayString);
    const [recordToExpense, setRecordToExpense] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isCompanyDebt = !targetDebt?.type || targetDebt?.type === 'company';
    const remaining = Math.max(0, Number(targetDebt?.remainingDebt ?? targetDebt?.total_debt_amount ?? 0));
    const scheduled = Number(targetDebt?.weekly_payment_amount || 0);

    useEffect(() => {
        if (!targetDebt || !isOpen) return;
        const defaultPay =
            scheduled > 0 && scheduled < remaining
                ? scheduled.toFixed(2)
                : remaining > 0
                    ? remaining.toFixed(2)
                    : '';
        setAmount(defaultPay);
        setDate(getManilaTodayString());
        setRecordToExpense(false);
        setErrorMsg('');
    }, [targetDebt, isOpen, remaining, scheduled]);

    if (!targetDebt) return null;

    const parsedAmount = currency(amount || 0).value;
    const projectedRemaining = Math.max(0, currency(remaining).subtract(parsedAmount).value);

    const preventEnterReload = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleSubmit = () => {
        setErrorMsg('');
        if (!parsedAmount || parsedAmount <= 0) {
            setErrorMsg('Please enter a valid payment amount greater than ₱0.00.');
            return;
        }
        if (parsedAmount > remaining + 0.01) {
            setErrorMsg(`Payment cannot exceed the remaining balance of ${currency(remaining, { symbol: '₱' }).format()}.`);
            return;
        }
        if (!date) {
            setErrorMsg('Please select a payment date.');
            return;
        }

        onConfirm?.({
            debt: targetDebt,
            amount: parsedAmount,
            date,
            recordToExpense: isCompanyDebt ? recordToExpense : false
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="p-0 w-[95vw] sm:w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl dark:[color-scheme:dark]">
                <DialogHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                        <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#8DB600] dark:text-lime-400 flex items-center justify-center shrink-0">
                                <DollarSign className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span className="truncate">Record Debt Payment</span>
                        </DialogTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {targetDebt.description}
                        </p>
                    </div>
                    <DialogCloseButton
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    />
                </DialogHeader>

                <div onKeyDown={preventEnterReload} className="p-4 sm:p-5 space-y-4">
                    {/* Balance Overview Strip */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Current Remaining
                            </span>
                            <span className="text-base font-mono font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                                {currency(remaining, { symbol: '₱' }).format()}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                After Payment
                            </span>
                            <span className={`text-base font-mono font-black mt-0.5 block ${
                                projectedRemaining === 0
                                    ? 'text-[#659000] dark:text-lime-400'
                                    : 'text-slate-900 dark:text-slate-100'
                            }`}>
                                {currency(projectedRemaining, { symbol: '₱' }).format()}
                            </span>
                        </div>
                    </div>

                    {/* Payment Amount Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Payment Amount (₱) <span className="text-rose-500">*</span>
                            </Label>
                            <div className="flex items-center gap-1.5">
                                {scheduled > 0 && scheduled < remaining && (
                                    <button
                                        type="button"
                                        onClick={() => setAmount(scheduled.toFixed(2))}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-lime-100 dark:hover:bg-lime-950/60 hover:text-[#5f7d00] dark:hover:text-lime-400 transition-colors cursor-pointer"
                                    >
                                        Installment ({currency(scheduled, { symbol: '₱' }).format()})
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setAmount(remaining.toFixed(2))}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-lime-100/80 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 hover:bg-lime-200/80 transition-colors cursor-pointer"
                                >
                                    Full Balance
                                </button>
                            </div>
                        </div>

                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={remaining}
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setErrorMsg('');
                            }}
                            placeholder="0.00"
                            autoFocus
                            className="h-11 font-mono font-black text-base bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-[#8DB600] focus:ring-[#8DB600] rounded-xl"
                        />
                    </div>

                    {/* Payment Date */}
                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Payment Date <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                setErrorMsg('');
                            }}
                            className="h-10 mt-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl cursor-pointer"
                        />
                    </div>

                    {/* Company Debt Option: Record to Expenses OR Deduct Debt Only */}
                    {isCompanyDebt && (
                        <div className="space-y-2">
                            <label
                                onClick={() => setRecordToExpense(prev => !prev)}
                                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                                    recordToExpense
                                        ? 'bg-lime-50/70 dark:bg-lime-950/30 border-[#8DB600] dark:border-lime-600/70'
                                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={recordToExpense}
                                    onChange={(e) => setRecordToExpense(e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-0.5 w-4 h-4 rounded text-[#8DB600] focus:ring-[#8DB600] border-slate-300 dark:border-slate-600 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                        <Receipt className="w-3.5 h-3.5 text-[#659000] dark:text-lime-400 shrink-0" />
                                        <span>Also record this payment to Expenses</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                        {recordToExpense
                                            ? 'Enabled: Deducts from this debt AND adds a Debt Repayment entry on the Expenses page.'
                                            : 'Disabled: Only reduces this debt balance without adding an entry to the Expenses page.'}
                                    </p>
                                </div>
                            </label>

                            {!recordToExpense && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-[10.5px] text-blue-800 dark:text-blue-300">
                                    <Info className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    <span>Debt deduction only — no expense record will be created.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-300">
                            {errorMsg}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="h-10 px-5 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                            {isSubmitting
                                ? 'Saving...'
                                : isCompanyDebt && recordToExpense
                                    ? 'Pay & Record Expense'
                                    : 'Record Payment'}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}