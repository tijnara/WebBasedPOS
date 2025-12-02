import React from 'react';
import { Button, Dialog, DialogContent } from '../ui';
import { ProductImage } from './ProductImage';
import currency from 'currency.js';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

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
    clearSale
}) => {
    const cartItems = Object.entries(currentSale);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="fixed bottom-0 left-0 right-0 w-full max-w-full rounded-t-2xl rounded-b-none p-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-100 flex flex-col h-[85vh] md:hidden z-50"
                style={{ margin: 0, transform: 'none', height: '85vh', maxHeight: '85vh' }}
            >
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white rounded-t-2xl flex-shrink-0">
                    <h2 className="text-xl font-bold text-[#7F00FF]">Current Order</h2>
                    <button
                        onClick={() => {
                            if (cartItems.length > 0 && confirm("Clear current order?")) {
                                clearSale();
                                onClose();
                            } else if (cartItems.length === 0) {
                                onClose();
                            }
                        }}
                        className="text-red-500 text-sm font-semibold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded"
                    >
                        <span>✕ Clear</span>
                    </button>
                </div>

                {/* --- BODY LIST --- */}
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                            <span className="text-4xl opacity-50">🛒</span>
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {cartItems.map(([key, item]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-white">
                                    {/* Left: Image & Name */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                        <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden">
                                            <ProductImage
                                                product={{ name: item.name, category: '' }}
                                                style={{ width: '100%', height: '100%', border: 'none', padding: 0, objectFit: 'contain' }}
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-gray-900 text-sm truncate leading-tight">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                @ {currency(item.price).format({ symbol: '₱' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Controls Row */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Qty Controls: - 1 + */}
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                            <button
                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-transform text-lg leading-none pb-1"
                                                onClick={() => handleDecreaseQuantity(key)}
                                            >
                                                -
                                            </button>
                                            <span className="w-4 text-center text-gray-900 font-bold">{item.quantity}</span>
                                            <button
                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-transform text-lg leading-none pb-1"
                                                onClick={() => handleIncreaseQuantity(key)}
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Item Total */}
                                        <span className="font-bold text-gray-900 text-sm w-[70px] text-right">
                                            {currency(item.price * item.quantity).format({ symbol: '₱' })}
                                        </span>

                                        {/* Delete Icon */}
                                        <button
                                            className="text-red-500 hover:text-red-700 p-1 active:scale-95 transition-transform"
                                            onClick={() => handleRemoveItem(key)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- FOOTER --- */}
                <div className="p-5 bg-white border-t border-gray-100 flex-shrink-0 mb-safe">
                    <div className="flex justify-between items-center text-gray-500 text-sm mb-1">
                        <span>Subtotal</span>
                        <span>{currency(subtotal).format({ symbol: '₱' })}</span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-[#00C853]">
                            {currency(subtotal).format({ symbol: '₱' })}
                        </span>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full h-12 text-base font-bold rounded-xl shadow-lg bg-[#7F00FF] hover:bg-[#6a00d9] text-white active:scale-[0.98] transition-transform"
                        onClick={() => {
                            onClose();
                            openPaymentModal();
                        }}
                        disabled={cartItems.length === 0 || createSaleMutation.isPending}
                    >
                        {createSaleMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CartDrawer;
