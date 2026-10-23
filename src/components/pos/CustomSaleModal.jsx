// src/components/pos/CustomSaleModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogCloseButton,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Input,
    Label,
    Select
} from '../ui';
import { useStore } from '../../store/useStore';
import { Sparkles, Tag, Plus } from 'lucide-react';

const CustomSaleModal = ({ isOpen, onClose, products = [], onAddItem, isDemo }) => {
    const { addToast } = useStore();
    const [mode, setMode] = useState('unlisted'); // 'unlisted' | 'existing'

    // Mode 1: Unlisted Item State
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customQuantity, setCustomQuantity] = useState('1');
    const [customNote, setCustomNote] = useState('');
    const nameInputRef = useRef(null);

    // Mode 2: Existing Product Override State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [overridePrice, setOverridePrice] = useState('');
    const [overrideQuantity, setOverrideQuantity] = useState('1');

    useEffect(() => {
        if (isOpen) {
            setMode('unlisted');
            setCustomName('');
            setCustomPrice('');
            setCustomQuantity('1');
            setCustomNote('');
            setSelectedProductId('');
            setOverridePrice('');
            setOverrideQuantity('1');

            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 60);
        }
    }, [isOpen]);

    const handleExistingProductChange = (productId) => {
        const prod = products.find(p => String(p.id) === String(productId));
        if (prod) {
            setSelectedProductId(prod.id);
            setOverridePrice(String(prod.price || 0));
        } else {
            setSelectedProductId('');
            setOverridePrice('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === 'unlisted') {
            const parsedPrice = parseFloat(customPrice);
            const parsedQuantity = parseInt(customQuantity, 10);

            if (!customName.trim()) {
                addToast({ title: 'Name Required', description: 'Please enter a name for the unlisted item.', variant: 'destructive' });
                return;
            }
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                addToast({ title: 'Invalid Price', description: 'Please enter a valid price (₱0 or higher).', variant: 'destructive' });
                return;
            }
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                addToast({ title: 'Invalid Quantity', description: 'Quantity must be at least 1.', variant: 'destructive' });
                return;
            }

            const syntheticProduct = {
                id: `custom_${Date.now()}`,
                name: customName.trim(),
                price: parsedPrice,
                cost: 0,
                stock: null,
                track_stock: false,
                is_custom: true,
                category: 'Custom / Unlisted',
                note: customNote.trim() || undefined
            };

            onAddItem(syntheticProduct, parsedQuantity, parsedPrice);
            addToast({
                title: 'Custom Item Added',
                description: `${parsedQuantity} x ${customName.trim()} at ₱${parsedPrice.toFixed(2)} added to order.`,
                variant: 'success'
            });
            onClose();

        } else {
            const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
            const parsedPrice = parseFloat(overridePrice);
            const parsedQuantity = parseInt(overrideQuantity, 10);

            if (!selectedProduct) {
                addToast({ title: 'Select Product', description: 'Please select an existing catalog item.', variant: 'destructive' });
                return;
            }
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                addToast({ title: 'Invalid Price', description: 'Please enter a valid price.', variant: 'destructive' });
                return;
            }
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                addToast({ title: 'Invalid Quantity', description: 'Quantity must be at least 1.', variant: 'destructive' });
                return;
            }
            if (
                selectedProduct.track_stock !== false &&
                selectedProduct.stock !== null &&
                selectedProduct.stock !== undefined &&
                parsedQuantity > selectedProduct.stock
            ) {
                addToast({ title: 'Stock Limit', description: `Only ${selectedProduct.stock} units currently on hand.`, variant: 'warning' });
                return;
            }

            onAddItem(selectedProduct, parsedQuantity, parsedPrice);
            addToast({
                title: 'Item Added',
                description: `${parsedQuantity} x ${selectedProduct.name} at ₱${parsedPrice.toFixed(2)} added.`,
                variant: 'success'
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="responsive-page max-w-md p-0 overflow-hidden rounded-3xl bg-white shadow-2xl border-0">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-lime-100 text-[#8DB600] flex items-center justify-center">
                            <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span>Custom Transaction Item</span>
                    </DialogTitle>
                    <DialogCloseButton onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4">

                        {/* Mode Segmented Switch */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                            <button
                                type="button"
                                onClick={() => setMode('unlisted')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    mode === 'unlisted'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <Plus className="w-3.5 h-3.5 text-[#8DB600]" />
                                <span>Unlisted / Open Item</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('existing')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    mode === 'existing'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <Tag className="w-3.5 h-3.5 text-blue-600" />
                                <span>Price Override</span>
                            </button>
                        </div>

                        {/* MODE 1: UNLISTED ITEM FORM */}
                        {mode === 'unlisted' && (
                            <div className="space-y-3.5 animate-in fade-in duration-150">
                                <div>
                                    <Label htmlFor="customItemName" className="text-xs font-bold text-slate-700">
                                        Item Name / Description <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="customItemName"
                                        ref={nameInputRef}
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="e.g. Spare Bottle Faucet or Water Dispenser Tubing"
                                        required
                                        className="h-10 mt-1 text-xs rounded-xl border-slate-200 focus:border-[#8DB600] focus:ring-[#8DB600]"
                                        disabled={isDemo}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="customItemPrice" className="text-xs font-bold text-slate-700">
                                            Selling Price (₱) <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="customItemPrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={customPrice}
                                            onChange={(e) => setCustomPrice(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="h-10 mt-1 font-mono font-black text-sm text-[#8DB600] rounded-xl border-slate-200 focus:border-[#8DB600]"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="customItemQuantity" className="text-xs font-bold text-slate-700">
                                            Quantity
                                        </Label>
                                        <Input
                                            id="customItemQuantity"
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={customQuantity}
                                            onChange={(e) => setCustomQuantity(e.target.value)}
                                            required
                                            className="h-10 mt-1 font-mono font-bold text-sm rounded-xl border-slate-200"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="customItemNote" className="text-xs font-bold text-slate-700">
                                        Cashier Audit Note (Optional)
                                    </Label>
                                    <Input
                                        id="customItemNote"
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder="e.g. Requested by Walk-in Customer"
                                        className="h-9 mt-1 text-xs rounded-xl border-slate-200"
                                        disabled={isDemo}
                                    />
                                </div>
                            </div>
                        )}

                        {/* MODE 2: EXISTING PRODUCT OVERRIDE FORM */}
                        {mode === 'existing' && (
                            <div className="space-y-3.5 animate-in fade-in duration-150">
                                <div>
                                    <Label htmlFor="existingProductSelect" className="text-xs font-bold text-slate-700">
                                        Select Existing Catalog Product <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        id="existingProductSelect"
                                        className="w-full h-10 mt-1 text-xs rounded-xl border-slate-200"
                                        value={selectedProductId}
                                        onChange={(e) => handleExistingProductChange(e.target.value)}
                                        required
                                        disabled={isDemo}
                                    >
                                        <option value="" disabled>-- Select Catalog Item --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Default: ₱{p.price?.toFixed(2)})
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="overridePrice" className="text-xs font-bold text-slate-700">
                                            Discounted / Override Price (₱) <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="overridePrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={overridePrice}
                                            onChange={(e) => setOverridePrice(e.target.value)}
                                            required
                                            className="h-10 mt-1 font-mono font-black text-sm text-blue-600 rounded-xl border-slate-200"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="overrideQuantity" className="text-xs font-bold text-slate-700">
                                            Quantity
                                        </Label>
                                        <Input
                                            id="overrideQuantity"
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={overrideQuantity}
                                            onChange={(e) => setOverrideQuantity(e.target.value)}
                                            required
                                            className="h-10 mt-1 font-mono font-bold text-sm rounded-xl border-slate-200"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                            disabled={isDemo}
                        >
                            Add to Order
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomSaleModal;