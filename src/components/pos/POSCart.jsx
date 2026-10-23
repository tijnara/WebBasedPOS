// src/components/pos/POSCart.jsx
import React from 'react';
import { Button, Card, CardContent, CardHeader } from '../ui';
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
        <Card className="flex flex-col shadow-sm rounded-2xl bg-white border border-slate-200 overflow-hidden h-full max-h-full">

            {/* Header with Active Customer Pill */}
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-2 px-3.5 flex-shrink-0 space-y-1.5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6.5 h-6.5 rounded-lg bg-lime-100 text-[#5f7d00] flex items-center justify-center">
                            <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                            Current Order
                        </h3>
                        {!isEmpty && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                                {totalItemCount}
                            </span>
                        )}
                    </div>

                    {!isEmpty && (
                        <button
                            type="button"
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
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
                    className="w-full flex items-center justify-between px-2.5 py-1 bg-white border border-slate-200 hover:border-[#8DB600] hover:bg-lime-50/40 rounded-lg text-xs font-bold transition-all shadow-2xs group"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-[#8DB600] shrink-0" />
                        <span className="text-slate-700 group-hover:text-slate-900 truncate text-[11px]">
                            {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                        </span>
                    </div>
                    <span className="text-[9px] text-slate-400 group-hover:text-[#5f7d00] font-mono flex items-center gap-0.5 shrink-0">
                        <span>(F2) Change</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                </button>
            </CardHeader>

            {/* Scrollable Cart Items */}
            <CardContent className="p-0 flex-1 relative flex flex-col min-h-0 bg-white overflow-hidden">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 h-full gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                        <p className="text-[10px] text-slate-400 max-w-[160px]">
                            Scan a barcode or tap products to ring up items
                        </p>
                    </div>
                ) : (
                    <div className="overflow-y-auto w-full flex-1 scroll-smooth">
                        <div className="flex flex-col p-1.5 divide-y divide-slate-100">
                            {items.map(([key, item]) => {
                                const isCustom = item.is_custom || String(item.id || item.productId).startsWith('custom_');

                                return (
                                    <div
                                        key={key}
                                        className={`flex items-start gap-2 py-2 group hover:bg-slate-50 rounded-lg px-2 transition-colors cursor-pointer ${
                                            stockWarningKey === key ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                                        }`}
                                        onClick={() => onEditItem && onEditItem(key)}
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-200 mt-0.5">
                                            <ProductImage
                                                product={item}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-xs text-slate-800 leading-tight pr-1 flex items-center gap-1 flex-wrap">
                                                <span className="truncate">{item.name}</span>
                                                {isCustom && (
                                                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-lime-100 text-[#5f7d00]">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                                                <span>{currency(item.price, { symbol: '₱' }).format()}</span>
                                                {item.discountType && item.discountType !== 'none' && (
                                                    <span className="text-[#5f7d00] bg-lime-100 px-1 rounded text-[8px] font-bold">
                                                        -{item.discountType === 'percent' ? `${item.discountValue}%` : `₱${item.discountValue}`}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stepper */}
                                            <div className="flex items-center gap-0.5 mt-1 bg-slate-100 w-max rounded p-0.5" onClick={e => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="w-5.5 h-5.5 flex items-center justify-center rounded bg-white text-slate-600 shadow-2xs hover:text-[#8DB600] disabled:opacity-40 font-bold text-xs"
                                                    onClick={() => handleDecreaseQuantity(key)}
                                                    disabled={item.quantity <= 1 || isDemo}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-7 text-center text-xs font-black text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                                    className="w-5.5 h-5.5 flex items-center justify-center rounded bg-white text-slate-600 shadow-2xs hover:text-[#8DB600] disabled:opacity-40 font-bold text-xs"
                                                    onClick={() => handleIncreaseQuantity(key)}
                                                    disabled={isDemo}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {stockWarningKey === key && <span className="text-[9px] text-rose-600 font-bold block mt-0.5">Stock Limit Reached</span>}
                                        </div>

                                        <div className="flex flex-col items-end justify-between h-full gap-1.5">
                                            <div className="text-xs font-black text-slate-900">
                                                {currency(Number(item.price) * Number(item.quantity), { symbol: '₱' }).format()}
                                            </div>
                                            <div className="flex items-center gap-0.5 mt-auto">
                                                <button
                                                    type="button"
                                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(key); }}
                                                    title="Edit"
                                                    disabled={isDemo}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
            <div className="bg-slate-50/90 border-t border-slate-200 p-2.5 sm:p-3 flex-shrink-0 z-20 space-y-1.5">
                {!isEmpty && (
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Tender:</span>
                        {quickCashPresets.map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={openPaymentModal}
                                className="px-2 py-0.5 bg-white hover:bg-lime-50 hover:border-lime-300 border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:text-[#5f7d00] transition-colors shrink-0 shadow-2xs"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Subtotal</span>
                    <span>{currency(subtotal, { symbol: '₱' }).format()}</span>
                </div>

                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/80 border-dashed">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Total</span>
                    <span className="text-2xl font-black tracking-tight text-[#8DB600]">
                        {currency(subtotal, { symbol: '₱' }).format()}
                    </span>
                </div>

                <Button
                    variant="primary"
                    className="w-full h-10.5 text-sm rounded-xl shadow-md font-black flex items-center justify-center transition-all bg-[#8DB600] hover:bg-[#7ca000] text-white active:scale-[0.99] disabled:opacity-50"
                    onClick={openPaymentModal}
                    disabled={isEmpty || createSaleMutation.isPending || isDemo}
                >
                    {createSaleMutation.isPending ? 'Processing...' : 'Charge (F4)'}
                </Button>

                <div className="text-center pt-0.5">
                    <span className="text-[10px] font-medium text-slate-400">
                        Last Transaction: <strong className="text-slate-600">{lastCustomer ? lastCustomer.name : 'Walk-in'}</strong>
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default POSCart;