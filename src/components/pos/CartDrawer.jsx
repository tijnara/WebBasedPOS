// src/components/pos/CartDrawer.jsx
import React from 'react';
import { Button, Dialog, DialogContent } from '../ui';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';
import { Edit2 } from 'lucide-react';

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
        // 300ms allows the drawer dialog exit animation to finish so the payment modal isn't dismissed
        setTimeout(() => {
            openPaymentModal();
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="pos-cart-drawer fixed bottom-0 left-0 right-0 w-full max-w-full rounded-t-3xl rounded-b-none p-0 bg-white shadow-2xl border-t border-slate-200 flex flex-col h-[85vh] md:hidden z-50 overflow-hidden"
                style={{ margin: 0, transform: 'none', height: '85vh', maxHeight: '85vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white rounded-t-3xl flex-shrink-0">
                    <h2 className="text-base font-extrabold text-[#8DB600]">Current Order</h2>
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
                        className="text-rose-500 text-xs font-bold hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                        disabled={isDemo}
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-0 bg-white min-h-0">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-6">
                            <span className="text-4xl">🛒</span>
                            <p className="text-sm font-bold text-slate-600">Cart is empty</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {cartItems.map(([key, item]) => (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between p-3.5 bg-white active:bg-slate-50 transition-colors cursor-pointer ${
                                        stockWarningKey === key ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                                    }`}
                                    onClick={() => onEditItem && onEditItem(key)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                        <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                            <ProductImage
                                                product={item}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-slate-900 text-xs truncate">
                                                {item.name}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-semibold">
                                                @ {currency(item.price, { symbol: '₱' }).format()}
                                            </span>
                                            {item.discountType && item.discountType !== 'none' && (
                                                <span className="text-[9px] text-[#5f7d00] font-bold bg-lime-100 px-1 rounded w-max mt-0.5">
                                                    -{item.discountType === 'percent' ? `${item.discountValue}%` : `₱${item.discountValue}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="flex items-center gap-1 text-sm font-medium text-slate-600" onClick={e => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 active:scale-95 text-sm font-bold"
                                                onClick={() => handleDecreaseQuantity(key)}
                                                disabled={isDemo || item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-8 text-center text-xs font-black text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val) && val > 0) handleSetQuantity(key, val);
                                                }}
                                                onClick={(e) => { e.stopPropagation(); e.target.select(); }}
                                                disabled={isDemo}
                                            />
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 active:scale-95 text-sm font-bold"
                                                onClick={() => handleIncreaseQuantity(key)}
                                                disabled={isDemo}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-end w-[64px]">
                                            <span className="font-black text-slate-900 text-xs">
                                                {currency(Number(item.price) * Number(item.quantity), { symbol: '₱' }).format()}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="p-1 text-slate-400 hover:text-blue-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditItem && onEditItem(key);
                                            }}
                                            disabled={isDemo}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                        <span>Subtotal</span>
                        <span>{currency(subtotal, { symbol: '₱' }).format()}</span>
                    </div>

                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Total</span>
                        <span className="text-xl font-black text-[#8DB600]">
                            {currency(subtotal, { symbol: '₱' }).format()}
                        </span>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full h-11 text-sm font-black rounded-xl shadow-md bg-[#8DB600] hover:bg-[#7ca000] text-white active:scale-[0.98] transition-transform flex items-center justify-center"
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