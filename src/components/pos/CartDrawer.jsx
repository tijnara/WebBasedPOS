import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, ScrollArea } from '../ui';
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
                            <p className="text-center text-gray-500">Your cart is empty.</p>
                        ) : (
                            <div className="flex flex-col divide-y divide-gray-100">
                                {cartItems.map(([key, item]) => (
                                    <div key={key} className="flex items-center gap-3 py-3">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center overflow-hidden border">
                                            <ProductImage product={{ name: item.name, category: '' }} style={{ width: '100%', height: '100%', border: 'none', background: 'none', padding: 0 }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{item.name}</div>
                                            <div className="text-xs text-muted">@ ₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="flex items-center justify-center space-x-1">
                                            <Button variant="ghost" size="sm" className="p-1 h-9 w-9 rounded-full" onClick={() => handleDecreaseQuantity(key)}>-</Button>
                                            <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                                            <Button variant="ghost" size="sm" className="p-1 h-9 w-9 rounded-full" onClick={() => handleIncreaseQuantity(key)}>+</Button>
                                        </div>
                                        <div className="text-right flex flex-col items-end" style={{ minWidth: '70px' }}>
                                            <span className="font-semibold text-sm">₱{Number(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <Button variant="ghost" size="icon" className="text-destructive h-7 w-7 p-0" onClick={() => handleRemoveItem(key)} title="Remove Item">
                                                <TrashIcon />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-gray-50 sticky bottom-0">
                    <div className="flex justify-between mb-3 font-bold text-lg">
                        <span>Total</span>
                        <span className="text-success">₱{Number(subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
