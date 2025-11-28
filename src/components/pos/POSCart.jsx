import React from 'react';
import {
    Button, Card, CardContent, CardHeader, ScrollArea,
} from '../ui';
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
        <div className="flex w-full md:w-1/3 xl:w-1/4 flex-shrink-0 flex-col order-1 md:order-none" style={{height: 'auto'}}>
            <Card className="flex flex-col shadow-lg border border-gray-200 rounded-xl bg-white overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-primary">Current Order</h3>
                        <Button variant="ghost" size="sm" className="p-1 h-auto text-destructive" onClick={clearSale} title="Clear Sale">✖ Clear</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 relative">
                    {!Object.keys(currentSale).length ? (
                        <div className="flex items-center justify-center text-center p-3 text-sm text-gray-500 bg-gray-50 border-b md:p-4" style={{ minHeight: '60px' }}>
                            Cart is empty — Start order
                        </div>
                    ) : (
                        <ScrollArea className="relative w-full current-order-scroll-area">
                            <div className="flex flex-col divide-y divide-gray-100 p-2">
                                {Object.entries(currentSale).map(([key, item]) => (
                                    <div key={key} className="flex items-center gap-2 py-2" style={{ minHeight: '60px' }}>
                                        <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden border">
                                            <ProductImage product={{ name: item.name, category: '' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{item.name}</div>
                                            <div className="text-xs text-muted">@ {currency(item.price, { symbol: '₱', precision: 2 }).format()}</div>
                                        </div>
                                        <div className="flex items-center justify-center space-x-0" style={{ minHeight: '44px' }}>
                                            <Button variant="ghost" size="sm" className="p-1 h-9 w-9 rounded-full" onClick={() => handleDecreaseQuantity(key)}>-</Button>
                                            <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                                            <Button variant="ghost" size="sm" className="p-1 h-9 w-9 rounded-full" onClick={() => handleIncreaseQuantity(key)}>+</Button>
                                        </div>
                                        <div className="text-right flex flex-col items-end" style={{ minWidth: '70px' }}>
                                            <span className="font-semibold text-sm">₱{currency(item.price).multiply(item.quantity).format({ symbol: '₱', precision: 2 })}</span>
                                            <Button variant="ghost" size="icon" className="text-destructive h-7 w-7 p-0" onClick={() => handleRemoveItem(key)} title="Remove Item">
                                                <TrashIcon />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
                <div className="p-3 border-t space-y-1 flex-shrink-0 bg-gray-50">
                </div>
                <div className="p-3 flex-shrink-0 bg-gray-50 rounded-b-xl">
                    <div className="w-full">
                        <div className="flex justify-between mb-1 text-sm"><span>Subtotal</span><span>₱{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span></div>
                        <div className="flex justify-between mb-3 font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span className="text-success">₱{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span></div>
                        <Button variant="primary" className="w-full h-12 text-lg rounded-lg shadow-md font-semibold hidden md:flex" onClick={openPaymentModal} disabled={Object.keys(currentSale).length === 0 || createSaleMutation.isPending}>
                            {createSaleMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                        <Button
                            variant="primary"
                            className="w-full h-12 text-base rounded-lg shadow-md font-semibold md:hidden mt-2"
                            onClick={openPaymentModal}
                            disabled={Object.keys(currentSale).length === 0 || createSaleMutation.isPending}
                            style={{ height: '48px' }}
                        >
                            {createSaleMutation.isPending
                                ? 'Processing...'
                                : (Object.keys(currentSale).length === 0
                                        ? 'Proceed to Payment'
                                        : `Proceed to Payment (₱${subtotal.toFixed(2)})`
                                )
                            }
                        </Button>
                    </div>
                </div>
            </Card>
            <div className="mt-2 flex justify-start flex-shrink-0">
                <span className="text-lg text-gray-800 font-semibold">Last Customer Used: <span className="font-bold">{lastCustomer ? lastCustomer.name : 'none'}</span></span>
            </div>
        </div>
    );
};

export default POSCart;
