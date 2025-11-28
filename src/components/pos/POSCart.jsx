// src/components/pos/POSCart.jsx
import React from 'react';
// 1. REMOVE 'ScrollArea' from this import
import { Button, Card, CardContent, CardHeader } from '../ui';
import currency from 'currency.js';
import { ProductImage } from './ProductImage';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);

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
}) => {
    return (
        <div className="hidden md:flex w-full h-full flex-shrink-0 flex-col">
            <Card className="flex flex-col shadow-lg border border-gray-200 rounded-xl bg-white overflow-hidden h-full">
                <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-xl flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-primary">Current Order</h3>
                        <Button variant="ghost" size="sm" className="p-1 h-auto text-destructive" onClick={clearSale} title="Clear Sale">✖ Clear</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative flex flex-col min-h-0">
                    {!Object.keys(currentSale).length ? (
                        <div className="flex items-center justify-center text-center p-3 text-sm text-gray-500 bg-gray-50 h-full">
                            Cart is empty
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto w-full current-order-scroll-area">
                            <div className="flex flex-col divide-y divide-gray-100 p-2">
                                {Object.entries(currentSale).map(([key, item]) => (
                                    <div key={key} className="flex items-center gap-2 py-2">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden border">
                                            <ProductImage product={{ name: item.name, category: '' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{item.name}</div>
                                            <div className="text-xs text-muted">@ {currency(item.price, { symbol: '₱', precision: 2 }).format()}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 h-auto"
                                                onClick={() => handleDecreaseQuantity(key)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </Button>
                                            <div className="text-sm font-medium w-6 text-center">{item.quantity}</div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 h-auto"
                                                onClick={() => handleIncreaseQuantity(key)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                        <div className="text-sm font-medium text-right w-16">
                                            {currency(item.price * item.quantity, { symbol: '₱', precision: 2 }).format()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-auto text-destructive"
                                            onClick={() => handleRemoveItem(key)}
                                            title="Remove"
                                        >
                                            <TrashIcon />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Footer Section */}
                <div className="p-3 border-t space-y-1 flex-shrink-0 bg-gray-50 rounded-b-xl">
                    <div className="w-full">
                        <div className="flex justify-between mb-1 text-sm"><span>Subtotal</span><span>₱{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span></div>
                        <div className="flex justify-between mb-3 font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span className="text-success">₱{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span></div>
                        <Button variant="primary" className="w-full h-12 text-lg rounded-lg shadow-md font-semibold flex" onClick={openPaymentModal} disabled={Object.keys(currentSale).length === 0 || createSaleMutation.isPending}>
                            {createSaleMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                    </div>
                </div>
            </Card>
            <div className="mt-2 flex justify-start flex-shrink-0">
                <span className="text-lg text-gray-800 font-semibold">Last Customer: <span className="font-bold">{lastCustomer ? lastCustomer.name : 'none'}</span></span>
            </div>
        </div>
    );
};

export default POSCart;