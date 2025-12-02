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
            <DialogContent className="sm:max-w-full w-full rounded-t-2xl rounded-b-none m-0 p-0 max-h-[80dvh] flex flex-col">
                <DialogHeader className="p-4 border-b sticky top-0 bg-white z-10">
                    <DialogTitle>Current Order</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        {cartItems.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
                        ) : (
                            <div className="flex flex-col divide-y divide-gray-100">
                                {cartItems.map(([key, item]) => (
                                    <div key={key} className="flex items-center gap-3 py-3">
                                        {/* Image: Reduced size for mobile, no gray background */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center overflow-hidden border border-gray-200 bg-white">
                                            <ProductImage
                                                product={{ name: item.name, category: '' }}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', padding: '0', border: 'none', background: 'transparent' }}
                                            />
                                        </div>

                                        {/* Name & Price */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                                            <div className="text-xs text-gray-500">
                                                @ ₱{currency(item.price, { precision: 2 }).format()}
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-center space-x-1 rounded-lg p-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-0 h-7 w-7 rounded-md hover:bg-white hover:shadow-sm"
                                                onClick={() => handleDecreaseQuantity(key)}
                                            >
                                                -
                                            </Button>
                                            <span className="w-6 text-center font-semibold text-sm text-gray-700">{item.quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-0 h-7 w-7 rounded-md hover:bg-white hover:shadow-sm"
                                                onClick={() => handleIncreaseQuantity(key)}
                                            >
                                                +
                                            </Button>
                                        </div>

                                        {/* Subtotal & Remove */}
                                        <div className="text-right flex flex-col items-end min-w-[70px]">
                                            <span className="font-bold text-sm text-gray-900">
                                                ₱{currency(item.price * item.quantity, { precision: 2 }).format()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 -mr-2"
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

                {/* Footer with Total */}
                <div className="p-4 border-t bg-white sticky bottom-0 z-10">
                    <div className="flex justify-between mb-3 font-bold text-lg text-gray-900">
                        <span>Total</span>
                        <span className="text-primary">₱{currency(subtotal, { precision: 2 }).format()}</span>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full h-12 text-lg rounded-lg shadow-md font-semibold"
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