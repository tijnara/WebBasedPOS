import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton } from '../ui';
import currency from 'currency.js';
import { ProductImage } from './ProductImage';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
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
    createSaleMutation
}) => {
    // Safety check: ensure currentSale exists
    const cartItems = currentSale ? Object.entries(currentSale) : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="md:hidden flex flex-col p-0 bg-white border-0 shadow-2xl rounded-t-2xl rounded-b-none"
                style={{
                    position: 'fixed',
                    top: 'auto',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    transform: 'none',
                    maxWidth: '100vw',
                    width: '100vw',
                    maxHeight: '85dvh',
                    height: 'auto', // Grows with content up to max-height
                    margin: 0
                }}
            >
                {/* Header - Fixed Height */}
                <DialogHeader className="px-4 py-3 border-b bg-white flex-shrink-0 rounded-t-2xl">
                    <DialogTitle>Current Order</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                {/* Product List - Flexible Height with Scroll */}
                {/* "min-h-[150px]" ensures it doesn't collapse if there are few items */}
                <div className="flex-1 overflow-y-auto w-full p-4 min-h-[20vh]">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                            <span className="text-4xl">🛒</span>
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-gray-100">
                            {cartItems.map(([key, item]) => (
                                <div key={key} className="flex items-center gap-3 py-3 animate-in fade-in duration-300">
                                    {/* Image */}
                                    <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 bg-gray-50">
                                        <ProductImage
                                            product={{ name: item.name, category: '' }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    {/* Name & Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-gray-900 leading-tight mb-1">{item.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {currency(item.price).format({ symbol: '₱' })} / unit
                                        </div>
                                    </div>
                                    {/* Quantity & Total Column */}
                                    <div className="flex flex-col items-end gap-2">
                                        {/* Total Price */}
                                        <span className="font-bold text-sm text-primary">
                                            {currency(item.price * item.quantity).format({ symbol: '₱' })}
                                        </span>
                                        {/* Controls Row */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-gray-200 rounded-lg h-7 bg-white">
                                                <button
                                                    className="px-2 h-full text-gray-600 hover:bg-gray-50 rounded-l-lg disabled:opacity-50"
                                                    onClick={() => handleDecreaseQuantity(key)}
                                                >
                                                    -
                                                </button>
                                                <span className="min-w-[20px] text-center font-medium text-xs">{item.quantity}</span>
                                                <button
                                                    className="px-2 h-full text-gray-600 hover:bg-gray-50 rounded-r-lg"
                                                    onClick={() => handleIncreaseQuantity(key)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {/* Delete Button */}
                                            <button
                                                className="text-gray-400 hover:text-red-500"
                                                onClick={() => handleRemoveItem(key)}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Footer Section - Fixed at Bottom */}
                <div className="px-4 py-4 border-t bg-gray-50 w-full flex-shrink-0 safe-area-bottom">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                            {currency(subtotal).format({ symbol: '₱' })}
                        </span>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full h-12 text-lg font-semibold rounded-xl shadow-md"
                        onClick={() => {
                            onClose();
                            openPaymentModal();
                        }}
                        disabled={cartItems.length === 0 || (createSaleMutation && createSaleMutation.isPending)}
                    >
                        {(createSaleMutation && createSaleMutation.isPending) ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CartDrawer;