// src/components/pos/CustomSaleModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogCloseButton,
    DialogTitle,
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
    const productSelectRef = useRef(null);

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

            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleModeSwitch = (nextMode) => {
        setMode(nextMode);
        setTimeout(() => {
            if (nextMode === 'unlisted') {
                nameInputRef.current?.focus();
            } else {
                productSelectRef.current?.focus();
            }
        }, 30);
    };

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
                addToast({
                    title: 'Name Required',
                    description: 'Please enter a name for the unlisted item.',
                    variant: 'destructive'
                });
                return;
            }
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                addToast({
                    title: 'Invalid Price',
                    description: 'Please enter a valid price (₱0 or higher).',
                    variant: 'destructive'
                });
                return;
            }
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                addToast({
                    title: 'Invalid Quantity',
                    description: 'Quantity must be at least 1.',
                    variant: 'destructive'
                });
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
                description: `${parsedQuantity} × ${customName.trim()} at ₱${parsedPrice.toFixed(2)} added to order.`,
                variant: 'success'
            });
            onClose();
        } else {
            const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
            const parsedPrice = parseFloat(overridePrice);
            const parsedQuantity = parseInt(overrideQuantity, 10);

            if (!selectedProduct) {
                addToast({
                    title: 'Select Product',
                    description: 'Please select an existing catalog item.',
                    variant: 'destructive'
                });
                return;
            }
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                addToast({
                    title: 'Invalid Price',
                    description: 'Please enter a valid price.',
                    variant: 'destructive'
                });
                return;
            }
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                addToast({
                    title: 'Invalid Quantity',
                    description: 'Quantity must be at least 1.',
                    variant: 'destructive'
                });
                return;
            }
            if (
                selectedProduct.track_stock !== false &&
                selectedProduct.stock !== null &&
                selectedProduct.stock !== undefined &&
                parsedQuantity > selectedProduct.stock
            ) {
                addToast({
                    title: 'Stock Limit',
                    description: `Only ${selectedProduct.stock} units currently on hand.`,
                    variant: 'warning'
                });
                return;
            }

            onAddItem(selectedProduct, parsedQuantity, parsedPrice);
            addToast({
                title: 'Item Added',
                description: `${parsedQuantity} × ${selectedProduct.name} at ₱${parsedPrice.toFixed(2)} added.`,
                variant: 'success'
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[94vw] sm:w-full max-w-md p-0 overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 dark:[color-scheme:dark]">
                {/* Header */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
                        <div className="w-8 h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 border border-lime-200/80 dark:border-lime-800/60 text-[#659000] dark:text-lime-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span>Custom Transaction Item</span>
                    </DialogTitle>
                    <DialogCloseButton
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-4 max-h-[70dvh] overflow-y-auto modal-scroll modal-scrollbar bg-white dark:bg-slate-900">
                        {/* Mode Segmented Switch */}
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => handleModeSwitch('unlisted')}
                                className={`py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    mode === 'unlisted'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-slate-700/80'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                                }`}
                            >
                                <Plus className="w-3.5 h-3.5 text-[#659000] dark:text-lime-400 shrink-0" />
                                <span className="truncate">Unlisted / Open Item</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeSwitch('existing')}
                                className={`py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    mode === 'existing'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-slate-700/80'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                                }`}
                            >
                                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                                <span className="truncate">Price Override</span>
                            </button>
                        </div>

                        {/* MODE 1: UNLISTED ITEM FORM */}
                        {mode === 'unlisted' && (
                            <div className="space-y-3.5">
                                <div>
                                    <Label
                                        htmlFor="customItemName"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Item Name / Description <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="customItemName"
                                        ref={nameInputRef}
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="e.g. Spare Bottle Faucet or Water Dispenser Tubing"
                                        required
                                        className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                        disabled={isDemo}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label
                                            htmlFor="customItemPrice"
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                        >
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
                                            className="h-10 mt-1 font-mono font-black text-sm text-[#659000] dark:text-lime-400 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="customItemQuantity"
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                        >
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
                                            className="h-10 mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label
                                        htmlFor="customItemNote"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Cashier Audit Note (Optional)
                                    </Label>
                                    <Input
                                        id="customItemNote"
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder="e.g. Requested by Walk-in Customer"
                                        className="h-9 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                        disabled={isDemo}
                                    />
                                </div>
                            </div>
                        )}

                        {/* MODE 2: EXISTING PRODUCT OVERRIDE FORM */}
                        {mode === 'existing' && (
                            <div className="space-y-3.5">
                                <div>
                                    <Label
                                        htmlFor="existingProductSelect"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Select Existing Catalog Product <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        id="existingProductSelect"
                                        ref={productSelectRef}
                                        className="w-full h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                        value={selectedProductId}
                                        onChange={(e) => handleExistingProductChange(e.target.value)}
                                        required
                                        disabled={isDemo}
                                    >
                                        <option value="" disabled>
                                            -- Select Catalog Item --
                                        </option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Default: ₱{Number(p.price || 0).toFixed(2)})
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label
                                            htmlFor="overridePrice"
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                        >
                                            Override Price (₱) <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="overridePrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={overridePrice}
                                            onChange={(e) => setOverridePrice(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="h-10 mt-1 font-mono font-black text-sm text-blue-600 dark:text-sky-400 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="overrideQuantity"
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                        >
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
                                            className="h-10 mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
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