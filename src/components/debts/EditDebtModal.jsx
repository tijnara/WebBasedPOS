// src/components/debts/EditDebtModal.jsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Label, Select } from '../ui';
import { Edit2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function EditDebtModal({ debt, isOpen, onClose, onSave, isUpdating }) {
    const [formData, setFormData] = useState({
        description: '',
        total_debt_amount: '',
        weekly_payment_amount: '',
        frequency: 'Weekly',
        debt_date: ''
    });

    useEffect(() => {
        if (debt) {
            setFormData({
                description: debt.description || '',
                total_debt_amount: debt.total_debt_amount || '',
                weekly_payment_amount: debt.weekly_payment_amount || '',
                frequency: debt.frequency || 'Weekly',
                debt_date: debt.debt_date ? format(parseISO(debt.debt_date), 'yyyy-MM-dd') : ''
            });
        }
    }, [debt]);

    if (!isOpen || !debt) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave({
            ...debt,
            ...formData,
            total_debt_amount: parseFloat(formData.total_debt_amount),
            weekly_payment_amount: parseFloat(formData.weekly_payment_amount) || 0
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                        <span>Edit Account Details (#{debt.id})</span>
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
                    <div>
                        <Label className="text-xs font-bold text-slate-700">Account Title</Label>
                        <Input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700">Total Principal (₱)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.total_debt_amount}
                            onChange={e => setFormData({ ...formData, total_debt_amount: e.target.value })}
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
                                value={formData.weekly_payment_amount}
                                onChange={e => setFormData({ ...formData, weekly_payment_amount: e.target.value })}
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Frequency</Label>
                            <Select
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                            >
                                <option value="Weekly">Weekly</option>
                                <option value="Every 15 days">Every 15 days</option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-bold text-slate-700">Date of Initiation</Label>
                        <Input
                            type="date"
                            value={formData.debt_date}
                            onChange={e => setFormData({ ...formData, debt_date: e.target.value })}
                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                        />
                    </div>

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
                            disabled={isUpdating}
                            className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                        >
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}