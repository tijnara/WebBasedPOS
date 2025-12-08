import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton,
    Button, Input, Label, Select
} from '../ui';
import currency from 'currency.js';

export default function EditCartItemModal({ isOpen, onClose, item, onSave }) {
    const [quantity, setQuantity] = useState(1);
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState(0);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && item) {
            setQuantity(item.quantity || 1);
            setDiscountType(item.discountType || 'none');
            setDiscountValue(item.discountValue || 0);
            setNote(item.note || '');
        }
    }, [isOpen, item]);

    const basePrice = item ? (item.basePrice !== undefined ? item.basePrice : item.price) : 0;

    const calculatedPrice = (() => {
        let price = currency(basePrice);
        if (discountType === 'fixed') {
            price = price.subtract(discountValue);
        } else if (discountType === 'percent') {
            const percent = currency(discountValue).divide(100);
            const discountAmount = price.multiply(percent);
            price = price.subtract(discountAmount);
        }
        return Math.max(0, price.value);
    })();

    const handleSave = (e) => {
        e.preventDefault();
        onSave({
            ...item,
            quantity: parseInt(quantity, 10),
            discountType,
            discountValue: parseFloat(discountValue),
            price: calculatedPrice,
            basePrice: basePrice,
            note: note.trim()
        });
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
            // FIX: Manually set z-index higher than the Mobile Cart Drawer (usually z-50)
            style={{ zIndex: 200 }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Item: {item?.name}</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 p-4">
                    {/* Quantity */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-quantity">Quantity</Label>
                        <Input
                            id="edit-quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="h-11"
                            required
                        />
                    </div>

                    {/* Discount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="discount-type">Discount Type</Label>
                            <Select
                                id="discount-type"
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="h-11"
                            >
                                <option value="none">None</option>
                                <option value="fixed">Fixed Amount (₱)</option>
                                <option value="percent">Percentage (%)</option>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="discount-value">Discount Value</Label>
                            <Input
                                id="discount-value"
                                type="number"
                                min="0"
                                step="0.01"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                disabled={discountType === 'none'}
                                className="h-11"
                            />
                        </div>
                    </div>

                    {/* Price Preview */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
                        <span className="text-gray-600">New Unit Price:</span>
                        <span className="font-bold text-gray-900">
                            {currency(calculatedPrice, { symbol: '₱' }).format()}
                            {basePrice !== calculatedPrice && (
                                <span className="text-xs text-gray-400 line-through ml-2">
                                    {currency(basePrice, { symbol: '₱' }).format()}
                                </span>
                            )}
                        </span>
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <Label htmlFor="item-note">Note (Optional)</Label>
                        <Input
                            id="item-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Damaged, Employee Meal"
                            className="h-11"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary">Update Item</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}