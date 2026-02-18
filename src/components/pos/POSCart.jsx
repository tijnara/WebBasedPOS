// src/components/pos/POSCart.jsx
import React from 'react';
import { Button, Card, CardContent, CardHeader } from '../ui';
import currency from 'currency.js';
import { ProductImage } from './ProductImage';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 4.232a1 1 0 011.414 0l3.122 3.122a1 1 0 010 1.414l-9.193 9.193a1 1 0 01-.393.242l-4.95 1.65a.5.5 0 01-.63-.63l1.65-4.95a1 1 0 01.242-.393l9.193-9.193zM16.646 5.646l-9.193 9.193-.97 2.91 2.91-.97 9.193-9.193-2.94-2.94z" />
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
                     onEditItem // Receive callback
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
                        <div
                            className="overflow-y-auto w-full current-order-scroll-area"
                            style={{
                                height: '14rem' // Approx 4 items (3.5rem each)
                            }}
                        >
                            <div className="flex flex-col divide-y divide-gray-100 p-2">
                                {Object.entries(currentSale).map(([key, item]) => (
                                    <div
                                        key={key}
                                        className="flex items-center gap-2 py-2 group hover:bg-gray-50 rounded-lg px-1 transition-colors cursor-pointer"
                                        onClick={() => onEditItem && onEditItem(key)} // Open modal on row click
                                        style={{ minHeight: '3.5rem' }}
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center overflow-hidden border border-gray-200 bg-white">
                                            <ProductImage
                                                product={{ name: item.name, category: '' }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                    padding: '0',
                                                    objectFit: 'cover',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate text-gray-800">
                                                {item.name}
                                                {item.note && <span className="ml-2 text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">📝</span>}
                                            </div>
                                            <div className="text-xs text-muted flex items-center gap-1">
                                                <span>@ {currency(item.price, { symbol: '₱', precision: 2 }).format()}</span>
                                                {item.discountType && item.discountType !== 'none' && (
                                                    <span className="text-green-600 bg-green-50 px-1 rounded text-[10px] font-medium">
                                                        -{item.discountType === 'percent' ? `${item.discountValue}%` : `₱${item.discountValue}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Controls Wrapper - prevent row click propagation */}
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 h-auto text-gray-500 hover:text-primary"
                                                onClick={() => handleDecreaseQuantity(key)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </Button>
                                            <div className="text-sm font-medium w-6 text-center">{item.quantity}</div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 h-auto text-gray-500 hover:text-primary"
                                                onClick={() => handleIncreaseQuantity(key)}
                                            >
                                                +
                                            </Button>
                                        </div>

                                        <div className="text-sm font-medium text-right w-16">
                                            {currency(item.price * item.quantity, { symbol: '₱', precision: 2 }).format()}
                                        </div>

                                        {/* Edit Button (Visual cue) */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-auto text-blue-500 hover:bg-blue-50 md:hidden group-hover:inline-flex"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditItem && onEditItem(key);
                                            }}
                                            title="Edit"
                                        >
                                            <EditIcon />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-auto text-destructive hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveItem(key);
                                            }}
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

                <div className="p-3 border-t space-y-1 flex-shrink-0 bg-gray-50 rounded-b-xl mt-auto">
                    <div className="w-full">
                        <div className="flex justify-between mb-1 text-sm">
                            <span>Subtotal</span>
                            <span>₱{currency(subtotal, { symbol: '', precision: 2 }).format()}</span>
                        </div>
                        <div className="flex justify-between mb-3 font-bold text-lg border-t pt-2 mt-2">
                            <span>Total</span>
                            <span className="text-success">₱{currency(subtotal, { symbol: '', precision: 2 }).format()}</span>
                        </div>
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