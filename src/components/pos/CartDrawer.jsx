// src/components/pos/CartDrawer.jsx
import React from 'react';
import { Button, Dialog, DialogContent } from '../ui';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';
import { Edit2, Trash2, ShoppingBag } from 'lucide-react';

const CartDrawer = ({
                        isOpen,
                        onClose,
                        currentSale,
                        subtotal,
                        handleIncreaseQuantity,
                        handleDecreaseQuantity,
                        handleRemoveItem,
                        openPaymentModal,
                        createSaleMutation,
                        clearSale,
                        onEditItem,
                        handleSetQuantity,
                        stockWarningKey,
                        isDemo
                    }) => {
    const cartItems = Object.entries(currentSale);

    const handleProceedToPayment = () => {
        onClose();
        setTimeout(() => {
            openPaymentModal();
        }, 180);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="pos-cart-drawer fixed bottom-0 left-0 right-0 w-full max-w-full rounded-t-3xl rounded-b-none p-0 bg-white dark:bg-slate-900 shadow-2xl border-t border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] md:hidden z-50 overflow-hidden"
                style={{ margin: 0, transform: 'none', height: '85vh', maxHeight: '85vh' }}
            >
                {/* Visual Drawer Handle Bar */}
                <div className="w-full flex justify-center pt-2.5 pb-1 bg-white dark:bg-slate-900 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-extrabold text-[#8DB600] uppercase tracking-wide">Current Order</h2>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cartItems.reduce((acc, [, item]) => acc + (item.quantity || 0), 0)} items
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (cartItems.length > 0 && confirm("Clear current order?")) {
                                clearSale();
                                onClose();
                            } else if (cartItems.length === 0) {
                                onClose();
                            }
                        }}
                        className="text-rose-500 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg transition-colors"
                        disabled={isDemo}
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-slate-900 min-h-0">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Cart is empty</p>
                            <p className="text-[11px] text-slate-400">Tap products to ring up items</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cartItems.map(([key, item]) => (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors ${
                                        stockWarningKey === key ? 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''
                                    }`}
                                >
                                    {/* Product Details */}
                                    <div
                                        className="flex items-center gap-3 flex-1 min-w-0 mr-2 cursor-pointer"
                                        onClick={() => onEditItem && onEditItem(key)}
                                    >
                                        <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            <ProductImage
                                                product={item}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                                                {item.name}
                                            </span>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold font-mono">
                                                @ {currency(item.price, { symbol: '₱' }).format()}
                                            </span>
                                            {item.discountType && item.discountType !== 'none' && (
                                                <span className="text-[9px] text-[#5f7d00] font-bold bg-lime-100 dark:bg-lime-950/40 px-1 rounded w-max mt-0.5">
                                                    -{item.discountType === 'percent' ? `${item.discountValue}%` : `₱${item.discountValue}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stepper & Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs active:scale-95 text-sm font-bold disabled:opacity-40"
                                                onClick={() => handleDecreaseQuantity(key)}
                                                disabled={isDemo || item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                inputMode="numeric"
                                                className="w-8 text-center text-xs font-black text-slate-900 dark:text-slate-100 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val) && val > 0) handleSetQuantity(key, val);
                                                }}
                                                onClick={(e) => e.target.select()}
                                                disabled={isDemo}
                                            />
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs active:scale-95 text-sm font-bold disabled:opacity-40"
                                                onClick={() => handleIncreaseQuantity(key)}
                                                disabled={isDemo}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-end w-[62px]">
                                            <span className="font-black text-slate-900 dark:text-slate-100 text-xs font-mono">
                                                {currency(Number(item.price) * Number(item.quantity), { symbol: '₱' }).format()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                                onClick={() => onEditItem && onEditItem(key)}
                                                disabled={isDemo}
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                onClick={() => handleRemoveItem && handleRemoveItem(key)}
                                                disabled={isDemo}
                                                title="Remove"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Bottom Clearance */}
                <div className="p-4 pb-6 sm:pb-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <span>Subtotal</span>
                        <span className="font-mono">{currency(subtotal, { symbol: '₱' }).format()}</span>
                    </div>

                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Total</span>
                        <span className="text-xl font-black text-[#8DB600] font-mono">
                            {currency(subtotal, { symbol: '₱' }).format()}
                        </span>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full h-11 text-xs sm:text-sm font-black rounded-xl shadow-md bg-[#8DB600] hover:bg-[#7ca000] text-white active:scale-[0.98] transition-transform flex items-center justify-center"
                        onClick={handleProceedToPayment}
                        disabled={cartItems.length === 0 || createSaleMutation.isPending || isDemo}
                    >
                        {createSaleMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CartDrawer;