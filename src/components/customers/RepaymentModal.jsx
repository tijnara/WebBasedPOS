// src/components/customers/RepaymentModal.jsx
import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton,
    Button, Input, Label
} from '../ui';
import currency from 'currency.js';

export default function RepaymentModal({ isOpen, onClose, customer, onRepay, isMutating }) {
    const [amount, setAmount] = useState('');
    const balance = customer?.credit_balance || 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (!val || val <= 0) return;
        onRepay(customer.id, val);
        setAmount('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} className="flex items-center justify-center">
            <DialogContent className="sm:max-w-sm bg-white" style={{ zIndex: 100 }}>
                <DialogHeader>
                    <DialogTitle>Repay Credit (Utang)</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                        <div className="text-sm text-red-600 font-medium uppercase tracking-wide">Current Balance</div>
                        <div className="text-3xl font-bold text-red-700 mt-1">
                            {currency(balance, { symbol: '₱' }).format()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="repayAmount">Payment Amount</Label>
                        <Input
                            id="repayAmount"
                            type="number"
                            step="0.01"
                            min="1"
                            max={balance} // Optional: limit to balance
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="text-lg py-3 h-12 font-medium"
                            autoFocus
                            required
                        />
                        {amount && !isNaN(amount) && (
                            <p className="text-sm text-gray-500 text-right">
                                Remaining: <span className="font-bold">{currency(balance - amount, { symbol: '₱' }).format()}</span>
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="success"
                            disabled={isMutating || !amount || parseFloat(amount) <= 0}
                            className="btn--success"
                        >
                            {isMutating ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}