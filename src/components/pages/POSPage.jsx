import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, CardFooter, Table, TableBody, TableRow, TableCell, ScrollArea, Dialog, DialogContent, DialogHeader, DialogFooter, DialogCloseButton, Input } from '../ui';

// Empty cart icon
const EmptyCartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted">
        <path d="M7.5 7.625C7.5 4.7625 9.7625 2.5 12.625 2.5C15.4875 2.5 17.75 4.7625 17.75 7.625" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.3375 21.5H8.9125C5.9375 21.5 5.075 19.5875 4.075 16.1L2.8 12.1875C2.2625 10.375 3.0125 9 4.9625 9H20.2875C22.2375 9 22.9875 10.375 22.45 12.1875L20.5 18.5" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.5 13H10.5" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Trash icon
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);


export default function POSPage() {
    const products = useStore(s => s.products);
    const currentSale = useStore(s => s.currentSale);
    const addItemToSale = useStore(s => s.addItemToSale);
    const removeItemFromSale = useStore(s => s.removeItemFromSale); // Get remove function
    const clearSale = useStore(s => s.clearSale);
    const getTotalAmount = useStore(s => s.getTotalAmount); // This is actually the subtotal
    const currentCustomer = useStore(s => s.currentCustomer);
    const addToast = useStore(s => s.addToast);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Calculations for Current Order Footer ---
    const subtotal = getTotalAmount();
    const taxRate = 0.08; // 8% tax rate (as implied by image calculation)
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    // -------------------------------------------

    const handleAdd = (p) => addItemToSale(p, 1);
    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            addItemToSale({ id: item.productId, name: item.name, price: item.price }, 1);
        }
    };
    const handleDecreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            addItemToSale({ id: item.productId, name: item.name, price: item.price }, -1);
        }
    };
    const handleRemoveItem = (key) => {
        removeItemFromSale(key);
    };


    const handleCheckout = async () => {
        const items = Object.values(currentSale).map(i => ({ productId: i.productId, productName: i.name, quantity: i.quantity, priceAtSale: i.price, subtotal: i.price * i.quantity }));
        if (items.length === 0) return addToast({ title: 'No items', description: 'Add items before finalizing', variant: 'warning' });

        // Removed customer check - assuming walk-in or optional customer selection elsewhere

        setIsSubmitting(true);
        try {
            const payload = {
                saleTimestamp: new Date().toISOString(),
                totalAmount: totalAmount, // Use the calculated total including tax
                customerId: currentCustomer?.id || null, // Allow null customer
                customerName: currentCustomer?.name || 'Walk-in', // Default to Walk-in
                items,
                status: 'Completed',
                paymentMethod: 'Cash', // Default payment method
                // You might want to add subtotal and taxAmount to the payload too
                subtotal: subtotal,
                taxAmount: taxAmount,
            };

            console.log('Payload for createSale:', payload);

            const created = await api.createSale(payload);
            addToast({ title: 'Sale saved', description: `Sale ${created.id} recorded`, variant: 'success' });
            clearSale();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error saving sale', description: e.message, variant: 'destructive' });
        } finally { setIsSubmitting(false); }
    };

    return (
        // Wrapper div is needed as the direct child of <main>
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Point of Sale</h1>
            </div>

            {/* Main content area - Reversed layout */}
            <div className="flex flex-row-reverse gap-4 h-[calc(100vh-12rem)]"> {/* Adjusted height */}

                {/* Current Order Sidebar */}
                <div className="w-full max-w-sm flex-shrink-0">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-primary">Current Order</h3>
                                {/* Simple close button - functionality can be added later */}
                                <Button variant="ghost" size="sm" className="p-1 h-auto">✖</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0"> {/* Remove padding */}
                            {!Object.keys(currentSale).length ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <EmptyCartIcon />
                                    <p className="text-muted mt-2">Your cart is empty</p>
                                </div>
                            ) : (
                                // Use a div for scrolling instead of Table wrapper
                                <ScrollArea className="h-full">
                                    <Table>
                                        <TableBody>
                                            {Object.entries(currentSale).map(([key, item]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium">{item.name}<br/><span className="text-sm text-muted">${item.price.toFixed(2)} each</span></TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => handleDecreaseQuantity(key)}>-</Button>
                                                            <span>{item.quantity}</span>
                                                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => handleIncreaseQuantity(key)}>+</Button>
                                                        </div>
                                                    </TableCell>
                                                    {/* Price column removed as it's under name now */}
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="text-destructive h-auto p-1" onClick={() => handleRemoveItem(key)}>
                                                            <TrashIcon />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </CardContent>
                        <CardFooter>
                            <div className="w-full">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-2 text-sm">
                                    <span>Tax ({(taxRate * 100).toFixed(0)}%)</span> {/* Display tax rate */}
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-4 font-bold text-lg border-t pt-2 mt-2">
                                    <span>Total</span>
                                    <span className="text-success">${totalAmount.toFixed(2)}</span>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleCheckout}
                                    disabled={isSubmitting || Object.keys(currentSale).length === 0}
                                >
                                    {isSubmitting ? 'Processing...' : 'Checkout'}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Main product grid */}
                <div className="flex-1 overflow-auto">
                    {/* Search Bar - Add functionality later */}
                    <div className="mb-4">
                        <Input placeholder="Search products..." className="w-full" />
                    </div>

                    <Card>
                        {/* Removed Header for cleaner look */}
                        <CardContent>
                            {!products.length ? <div className="p-4 text-center text-muted">No products available</div> : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map(p => (
                                        <button key={p.id} className="product-card" onClick={() => handleAdd(p)}>
                                            <div className="product-card-image">
                                                {/* Replace with actual image if available */}
                                                <span role="img" aria-label={p.name} style={{fontSize: '3rem'}}>🍔</span>
                                            </div>
                                            <div className="font-medium text-lg">{p.name}</div>
                                            <div className="text-sm text-muted">${Number(p.price || 0).toFixed(2)}</div>
                                            {/* Stock indicator can be added here if needed */}
                                            {/* <span className="stock-indicator">{p.stock}</span> */}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div> // End of wrapper div
    );
}