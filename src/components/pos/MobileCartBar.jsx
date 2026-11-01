// src/components/pos/MobileCartBar.jsx
import React from 'react';
import currency from 'currency.js';
import { ShoppingBag, ChevronRight, ArrowRight, Trash2 } from 'lucide-react';

const MobileCartBar = ({ itemCount, totalQty, subtotal, onOpenCart, onDirectCheckout, onClearCart }) => {
    if (!itemCount || itemCount === 0) {
        return null;
    }

    const handleDirectPay = (e) => {
        e.stopPropagation();
        if (onDirectCheckout) {
            onDirectCheckout();
        } else if (onOpenCart) {
            onOpenCart();
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (window.confirm('Cancel and clear all items in current cart?')) {
            onClearCart && onClearCart();
        }
    };

    return (
        <div className="mobile-cart-bar fixed bottom-[68px] left-2 right-2 sm:left-4 sm:right-4 z-40 md:hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div
                onClick={onOpenCart}
                className="w-full bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-1.5 pl-2.5 shadow-2xl border border-slate-700/70 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] transition-transform select-none"
            >
                {/* Left Side: Cancel Order Button + Tap to Review */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Quick Cancel All Button */}
                    <button
                        type="button"
                        onClick={handleClear}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 flex items-center justify-center shrink-0 active:scale-90 transition-colors"
                        title="Cancel Order"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Cart Quantity Badge & Review Label */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-8 rounded-xl bg-slate-800 text-[#8DB600] flex items-center justify-center shrink-0 border border-slate-700">
                            <ShoppingBag className="w-4 h-4" />
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#8DB600] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs font-mono">
                                {totalQty || itemCount}
                            </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200 leading-tight truncate">
                                <span>{itemCount} {itemCount > 1 ? 'Items' : 'Item'}</span>
                                <span className="text-slate-400 font-normal">({totalQty} pcs)</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                Review cart <ChevronRight className="w-2.5 h-2.5 inline" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Direct 1-Tap Fast Checkout */}
                <button
                    type="button"
                    onClick={handleDirectPay}
                    className="h-10 px-3.5 sm:px-4 bg-[#8DB600] hover:bg-[#7ca000] text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                >
                    <span>Pay</span>
                    <span className="font-mono text-xs font-black">
                        {currency(subtotal, { symbol: '₱' }).format()}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
            </div>
        </div>
    );
};

export default MobileCartBar;