import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, ScrollArea } from '../ui';
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
    const cartItems = Object.entries(currentSale);

    return (
        <Dialog open={isOpen} onOpenChange={onClose} className="md:hidden items-end p-0">
            {/* Bottom Sheet Container */}
            <DialogContent className="sm:max-w-full w-full rounded-t-2xl rounded-b-none m-0 p-0 max-h-[85dvh] flex flex-col bg-white">
                {/* Header */}
                <DialogHeader className="p-4 border-b sticky top-0 bg-white z-10">
                    <DialogTitle>Current Order</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                {/* Scrollable Product List */}
                <ScrollArea className="flex-1 w-full">
                    <div className="p-4">
                        {cartItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <p>Your cart is empty.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-gray-100">
                                {cartItems.map(([key, item]) => (
                                    <div key={key} className="flex items-center gap-3 py-3">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 bg-white">
                                            <ProductImage
                                                product={{ name: item.name, category: '' }}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', border: 'none', background: 'transparent', padding: 0 }}
                                            />
                                        </div>
                                        {/* Product Name & Unit Price */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                @ ₱{currency(item.price, { symbol: '', precision: 2 }).format()}
                                            </div>
                                        </div>
                                        {/* Quantity Controls */}
                                        <div className="flex items-center border border-gray-200 rounded-lg h-8">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-0 h-full w-8 rounded-l-lg hover:bg-gray-50 text-gray-600"
                                                onClick={() => handleDecreaseQuantity(key)}
                                            >
                                                -
                                            </Button>
                                            <span className="w-8 text-center font-medium text-sm text-gray-900 leading-8">{item.quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-0 h-full w-8 rounded-r-lg hover:bg-gray-50 text-gray-600"
                                                onClick={() => handleIncreaseQuantity(key)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                        {/* Line Total & Remove Button */}
                                        <div className="text-right flex flex-col items-end min-w-[70px]">
                                            <span className="font-bold text-sm text-gray-900">
                                                ₱{currency(item.price * item.quantity, { symbol: '', precision: 2 }).format()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-red-500 p-0 mt-1"
                                                onClick={() => handleRemoveItem(key)}
                                                title="Remove Item"
                                            >
                                                <TrashIcon />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
                {/* Footer: Total & Checkout Button */}
                <div className="p-4 border-t bg-gray-50 w-full mt-auto sticky bottom-0">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600 font-medium text-lg">Total</span>
                        <span className="text-2xl font-bold text-primary">
                            ₱{currency(subtotal, { symbol: '', precision: 2 }).format()}
                        </span>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full h-12 text-lg font-semibold rounded-xl shadow-sm"
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