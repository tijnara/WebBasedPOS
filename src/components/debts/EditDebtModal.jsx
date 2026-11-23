// src/components/debts/EditDebtModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogCloseButton,
    Button,
    Input,
    Label,
    Select
} from '../ui';
import { Edit2 } from 'lucide-react';

export default function EditDebtModal({
                                          debt,
                                          isOpen,
                                          onClose,
                                          onSave,
                                          isUpdating = false
                                      }) {
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [installmentAmount, setInstallmentAmount] = useState('');
    const [frequency, setFrequency] = useState('Weekly');
    const [debtDate, setDebtDate] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!debt || !isOpen) return;
        setDescription(debt.description || '');
        setTotalAmount(debt.total_debt_amount != null ? String(debt.total_debt_amount) : '');
        setInstallmentAmount(debt.weekly_payment_amount != null ? String(debt.weekly_payment_amount) : '');
        setFrequency(debt.frequency || 'Weekly');
        setDebtDate(debt.debt_date ? String(debt.debt_date).slice(0, 10) : '');
        setErrorMsg('');
    }, [debt, isOpen]);

    if (!debt) return null;

    const preventEnterReload = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleSubmit = () => {
        setErrorMsg('');
        const parsedTotal = parseFloat(totalAmount);
        const parsedInstallment = parseFloat(installmentAmount) || 0;

        if (!description.trim()) {
            setErrorMsg('Account title is required.');
            return;
        }
        if (isNaN(parsedTotal) || parsedTotal <= 0) {
            setErrorMsg('Total principal must be greater than ₱0.00.');
            return;
        }
        if (!debtDate) {
            setErrorMsg('Date of initiation is required.');
            return;
        }

        onSave?.({
            ...debt,
            description: description.trim(),
            total_debt_amount: parsedTotal,
            weekly_payment_amount: parsedInstallment,
            frequency,
            debt_date: debtDate
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="p-0 w-[95vw] sm:w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl dark:[color-scheme:dark]">
                <DialogHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Edit Account Details (#{debt.id})</span>
                    </DialogTitle>
                    <DialogCloseButton
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    />
                </DialogHeader>

                <div onKeyDown={preventEnterReload} className="p-5 space-y-4 bg-white dark:bg-slate-900">
                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Account Title
                        </Label>
                        <Input
                            type="text"
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setErrorMsg('');
                            }}
                            className="h-10 mt-1 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Total Principal (₱)
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={totalAmount}
                            onChange={(e) => {
                                setTotalAmount(e.target.value);
                                setErrorMsg('');
                            }}
                            className="h-10 mt-1 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Installment (₱)
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={installmentAmount}
                                onChange={(e) => setInstallmentAmount(e.target.value)}
                                className="h-10 mt-1 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Frequency
                            </Label>
                            <Select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="h-10 mt-1 text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl cursor-pointer"
                            >
                                <option value="Weekly" className="bg-white dark:bg-slate-900">Weekly</option>
                                <option value="Every 15 days" className="bg-white dark:bg-slate-900">Every 15 days</option>
                                <option value="Monthly" className="bg-white dark:bg-slate-900">Monthly</option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Date of Initiation
                        </Label>
                        <Input
                            type="date"
                            value={debtDate}
                            onChange={(e) => {
                                setDebtDate(e.target.value);
                                setErrorMsg('');
                            }}
                            className="h-10 mt-1 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl cursor-pointer"
                        />
                    </div>

                    {errorMsg && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-300">
                            {errorMsg}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isUpdating}
                        className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isUpdating}
                        className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
                    >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}