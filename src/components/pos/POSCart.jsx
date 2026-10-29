// src/components/pos/POSCart.jsx
import React from 'react';
import { Card, CardContent, CardHeader } from '../ui';
import currency from 'currency.js';
import { ProductImage } from './ProductImage';
import { Trash2, Edit2, ShoppingBag, User, ChevronRight } from 'lucide-react';

const POSCart = ({
                     currentSale,
                     clearSale,
                     subtotal,
                     handleIncreaseQuantity,
                     handleDecreaseQuantity,
                     handleRemoveItem,
                     openPaymentModal,
                     createSaleMutation,
                     lastCustomer,
                     onEditItem,
                     handleSetQuantity,
                     stockWarningKey,
                     selectedCustomer,
                     openCustomerModal,
                     isDemo
                 }) => {
    const items = Object.entries(currentSale);
    const isEmpty = items.length === 0;
    const totalItemCount = items.reduce((sum, [, item]) => sum + (item.quantity || 0), 0);

    const quickCashPresets = [
        { label: 'Exact', value: subtotal },
        { label: '₱50', value: 50 },
        { label: '₱100', value: 100 },
        { label: '₱200', value: 200 },
        { label: '₱500', value: 500 },
        { label: '₱1,000', value: 1000 },
    ].filter(preset => preset.label === 'Exact' || preset.value >= subtotal);

    return (
        <Card className="flex flex-col shadow-2xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden h-full max-h-full transition-colors">

            {/* Header with Active Customer Pill */}
            <CardHeader className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800/80 py-2 px-3.5 flex-shrink-0 space-y-1.5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6.5 h-6.5 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                            Current Order
                        </h3>
                        {!isEmpty && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700 font-mono">
                                {totalItemCount}
                            </span>
                        )}
                    </div>

                    {!isEmpty && (
                        <button
                            type="button"
                            className="text-[10px] font-bold text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-0.5 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            onClick={clearSale}
                            disabled={isDemo}
                            title="Shift + Delete"
                        >
                            Clear Cart
                        </button>
                    )}
                </div>

                {/* Customer Selector Button */}
                <button
                    type="button"
                    onClick={openCustomerModal}
                    className="w-full flex items-center justify-between px-2.5 py-1 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-[#8DB600] dark:hover:border-lime-500 hover:bg-lime-50/40 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate text-[11px]">
                            {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                        </span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 group-hover:text-[#5f7d00] dark:group-hover:text-lime-400 font-mono flex items-center gap-0.5 shrink-0">
                        <span>(F2) Change</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                </button>
            </CardHeader>

            {/* Scrollable Cart Items */}
            <CardContent className="p-0 flex-1 relative flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 h-full gap-2 select-none">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-2xs">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Cart is empty</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[170px] leading-relaxed">
                            Scan a barcode or tap products to ring up items
                        </p>
                    </div>
                ) : (
                    <div className="overflow-y-auto w-full flex-1 scroll-smooth">
                        <div className="flex flex-col p-1.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                            {items.map(([key, item]) => {
                                const isCustom = item.is_custom || String(item.id || item.productId).startsWith('custom_');

                                return (
                                    <div
                                        key={key}
                                        className={`flex items-start gap-2 py-2 group hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-2 transition-colors cursor-pointer ${
                                            stockWarningKey === key
                                                ? 'ring-2 ring-rose-500 bg-rose-50/60 dark:bg-rose-950/30'
                                                : ''
                                        }`}
                                        onClick={() => onEditItem && onEditItem(key)}
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-0.5">
                                            <ProductImage
                                                product={item}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight pr-1 flex items-center gap-1 flex-wrap">
                                                <span className="truncate">{item.name}</span>
                                                {isCustom && (
                                                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-300 border border-lime-200 dark:border-lime-900/50">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                                <span>{currency(item.price, { symbol: '₱' }).format()}</span>
                                                {item.discountType && item.discountType !== 'none' && (
                                                    <span className="text-[#5f7d00] dark:text-lime-400 bg-lime-100 dark:bg-lime-950/60 px-1 rounded text-[8px] font-bold">
                                                        -{item.discountType === 'percent' ? `${item.discountValue}%` : `₱${item.discountValue}`}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stepper */}
                                            <div
                                                className="flex items-center gap-0.5 mt-1 bg-slate-100 dark:bg-slate-800 w-max rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-5.5 h-5.5 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 shadow-2xs hover:text-[#8DB600] dark:hover:text-lime-400 disabled:opacity-40 font-bold text-xs transition-colors cursor-pointer"
                                                    onClick={() => handleDecreaseQuantity(key)}
                                                    disabled={item.quantity <= 1 || isDemo}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-7 text-center text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        if (!isNaN(val) && val > 0) handleSetQuantity(key, val);
                                                    }}
                                                    onClick={(e) => { e.stopPropagation(); e.target.select(); }}
                                                    onFocus={(e) => e.target.select()}
                                                    disabled={isDemo}
                                                />
                                                <button
                                                    type="button"
                                                    className="w-5.5 h-5.5 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 shadow-2xs hover:text-[#8DB600] dark:hover:text-lime-400 disabled:opacity-40 font-bold text-xs transition-colors cursor-pointer"
                                                    onClick={() => handleIncreaseQuantity(key)}
                                                    disabled={isDemo}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {stockWarningKey === key && (
                                                <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
                                                    Stock Limit Reached
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end justify-between h-full gap-1.5">
                                            <div className="text-xs font-black font-mono text-slate-900 dark:text-slate-100">
                                                {currency(Number(item.price) * Number(item.quantity), { symbol: '₱' }).format()}
                                            </div>
                                            <div className="flex items-center gap-0.5 mt-auto">
                                                <button
                                                    type="button"
                                                    className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(key); }}
                                                    title="Edit"
                                                    disabled={isDemo}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(key); }}
                                                    title="Remove"
                                                    disabled={isDemo}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Compact Bottom Footer */}
            <div className="bg-slate-50/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 flex-shrink-0 z-20 space-y-1.5 transition-colors">
                {!isEmpty && (
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Tender:</span>
                        {quickCashPresets.map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={openPaymentModal}
                                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-lime-50 dark:hover:bg-lime-950/40 hover:border-lime-300 dark:hover:border-lime-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#5f7d00] dark:hover:text-lime-300 transition-colors shrink-0 shadow-2xs cursor-pointer"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{currency(subtotal, { symbol: '₱' }).format()}</span>
                </div>

                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/80 dark:border-slate-800 border-dashed">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Total</span>
                    <span className="text-2xl font-black font-mono tracking-tight text-[#8DB600] dark:text-lime-400">
                        {currency(subtotal, { symbol: '₱' }).format()}
                    </span>
                </div>

                <button
                    type="button"
                    className={`w-full h-10.5 text-sm rounded-xl font-black flex items-center justify-center transition-all shadow-sm active:scale-[0.99] cursor-pointer ${
                        isEmpty || isDemo || createSaleMutation.isPending
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent dark:border-slate-700/60'
                            : 'bg-[#8DB600] hover:bg-[#7ca000] text-white shadow-md'
                    }`}
                    onClick={openPaymentModal}
                    disabled={isEmpty || createSaleMutation.isPending || isDemo}
                >
                    {createSaleMutation.isPending ? 'Processing...' : 'Charge (F4)'}
                </button>

                <div className="text-center pt-0.5">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        Last Transaction: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{lastCustomer ? lastCustomer.name : 'Walk-in'}</strong>
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default POSCart;