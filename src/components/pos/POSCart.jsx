// src/components/pos/POSCart.jsx
import React from 'react';
import { Button, Card, CardContent, CardHeader } from '../ui';
import currency from 'currency.js';
import { ProductImage } from './ProductImage';
import { Trash2, Edit2, ShoppingBag } from 'lucide-react';

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
                     isDemo
                 }) => {

    const isEmpty = Object.keys(currentSale).length === 0;

    return (
        <Card className="flex flex-col shadow-xl rounded-[1.25rem] bg-white border border-slate-200 overflow-hidden h-full">

            {/* Header */}
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-5 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        Current Order
                    </h3>
                    {!isEmpty && (
                        <button
                            type="button"
                            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            onClick={clearSale}
                            disabled={isDemo}
                        >
                            Clear (Shift+Del)
                        </button>
                    )}
                </div>
            </CardHeader>

            {/* Scrollable Cart Items */}
            <CardContent className="p-0 flex-1 relative flex flex-col min-h-0 bg-white">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 h-full gap-3">
                        <ShoppingBag className="w-12 h-12 text-slate-200" />
                        <p className="text-sm font-medium">Your cart is empty.<br/>Scan or select products to begin.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto w-full flex-1 scroll-smooth">
                        <div className="flex flex-col p-2 divide-y divide-slate-50">
                            {Object.entries(currentSale).map(([key, item]) => (
                                <div
                                    key={key}
                                    className={`flex items-start gap-3 py-3 group hover:bg-slate-50 rounded-xl px-3 transition-colors cursor-pointer ${
                                        stockWarningKey === key ? 'ring-2 ring-red-500 bg-red-50' : ''
                                    }`}
                                    onClick={() => onEditItem && onEditItem(key)}
                                >
                                    {/* Image */}
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-slate-100 border border-slate-200 mt-0.5">
                                        <ProductImage
                                            product={item}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-slate-800 leading-tight pr-2">
                                            {item.name}
                                            {item.note && <span className="ml-2 text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Note</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                                            <span>{currency(item.price, { symbol: '₱', precision: 2 }).format()}</span>
                                            {item.discountType && item.discountType !== 'none' && (
                                                <span className="text-emerald-700 bg-emerald-100 px-1.5 rounded text-[10px] font-bold">
                                                    -{item.discountType === 'percent' ? `${item.discountValue}%` : `₱${item.discountValue}`}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quantity Stepper */}
                                        <div className="flex items-center gap-1 mt-2 bg-slate-100 w-max rounded-lg p-0.5" onClick={e => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-emerald-600 disabled:opacity-50 font-bold"
                                                onClick={() => handleDecreaseQuantity(key)}
                                                disabled={item.quantity <= 1 || isDemo}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-10 text-center text-sm font-bold text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-emerald-600 disabled:opacity-50 font-bold"
                                                onClick={() => handleIncreaseQuantity(key)}
                                                disabled={isDemo}
                                            >
                                                +
                                            </button>
                                        </div>
                                        {stockWarningKey === key && <span className="text-[10px] text-red-600 font-bold block mt-1">Stock Limit Reached</span>}
                                    </div>

                                    {/* Actions & Price */}
                                    <div className="flex flex-col items-end justify-between h-full gap-2">
                                        <div className="text-sm font-black text-slate-900">
                                            {currency(item.price * item.quantity, { symbol: '₱', precision: 2 }).format()}
                                        </div>
                                        <div className="flex items-center gap-1 mt-auto">
                                            <button
                                                type="button"
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(key); }}
                                                title="Edit"
                                                disabled={isDemo}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(key); }}
                                                title="Remove"
                                                disabled={isDemo}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Total & Checkout Section */}
            <div className="bg-slate-50 border-t border-slate-200 p-5 flex-shrink-0 z-20">
                <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-500">
                    <span>Subtotal</span>
                    <span>{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span>
                </div>
                <div className="flex justify-between items-end mb-4 pt-2 mt-2 border-t border-slate-200 border-dashed">
                    <span className="font-bold text-slate-800">Total Amount</span>
                    <span className="text-3xl font-black tracking-tight text-emerald-600">
                        {currency(subtotal, { symbol: '₱', precision: 2 }).format()}
                    </span>
                </div>
                <Button
                    variant="primary"
                    className="w-full h-14 text-lg rounded-xl shadow-lg shadow-emerald-600/20 font-extrabold flex items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700"
                    onClick={openPaymentModal}
                    disabled={isEmpty || createSaleMutation.isPending || isDemo}
                >
                    {createSaleMutation.isPending ? 'Processing...' : 'Charge (F4)'}
                </Button>

                {/* Last Customer Info */}
                <div className="mt-3 text-center">
                    <span className="text-[11px] font-semibold text-slate-500">
                        Last Transaction: <span className="text-slate-800">{lastCustomer ? lastCustomer.name : 'Walk-in'}</span>
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default POSCart;