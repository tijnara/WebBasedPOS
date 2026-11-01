// src/components/pos/MobileCartBar.jsx
import React, { useState } from 'react';
import currency from 'currency.js';
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function MobileCartBar({
                                          itemCount = 0,
                                          totalQty = 0,
                                          subtotal = 0,
                                          onOpenCart,
                                          onDirectCheckout,
                                          onClearCart
                                      }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const clearSaleStore = useStore((state) => state.clearSale);

    if (itemCount === 0) return null;

    const handleClear = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Invoke passed prop if provided
        if (typeof onClearCart === 'function') {
            onClearCart();
        }

        // 2. Direct store wipe guarantees cart resets immediately
        try {
            if (typeof clearSaleStore === 'function') {
                clearSaleStore();
            }
            useStore.setState({ currentSale: {} });
            localStorage.removeItem('currentSale');
            localStorage.removeItem('pos_cart');
        } catch (err) {
            console.error('Failed to clear cart from mobile bar:', err);
        }

        setConfirmDelete(false);
    };

    return (
        <div className="fixed bottom-3 inset-x-3 z-40 md:hidden animate-in slide-in-from-bottom-3 duration-200">
            <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2 px-3 shadow-2xl border border-slate-800 flex items-center justify-between gap-2.5">

                {/* Left Area: Trash Bin Icon + Cart Indicator */}
                <div className="flex items-center gap-2 min-w-0">
                    {/* Trash Button */}
                    {confirmDelete ? (
                        <div
                            className="flex items-center gap-1 bg-rose-950/80 border border-rose-600/80 rounded-xl p-1 z-50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black active:scale-90 transition-transform cursor-pointer"
                            >
                                Clear?
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(false);
                                }}
                                className="px-1 text-slate-400 text-[10px] font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmDelete(true);
                                setTimeout(() => setConfirmDelete(false), 3500); // auto revert after 3.5s
                            }}
                            className="w-9 h-9 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/50 text-rose-400 flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer"
                            title="Clear all items in cart"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    {/* Cart Trigger */}
                    <div
                        className="flex items-center gap-2 cursor-pointer select-none min-w-0"
                        onClick={onOpenCart}
                    >
                        <div className="relative w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lime-400 shrink-0 border border-slate-700">
                            <ShoppingBag className="w-4 h-4" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8DB600] text-slate-900 font-black text-[9px] flex items-center justify-center shadow-xs">
                                {totalQty}
                            </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate leading-tight">
                                {itemCount} {itemCount === 1 ? 'Item' : 'Items'} ({totalQty} pcs)
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                                Review cart &rsaquo;
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Area: Pay Button */}
                <button
                    type="button"
                    onClick={onDirectCheckout}
                    className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition-transform cursor-pointer"
                >
                    <span>Pay {currency(subtotal, { symbol: '₱' }).format()}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
            </div>
        </div>
    );
}