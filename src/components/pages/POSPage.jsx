import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, CardFooter, Table, TableBody, TableRow, TableCell, ScrollArea, Dialog, DialogContent, DialogHeader, DialogFooter, DialogCloseButton } from '../ui';

// Empty cart icon from the design
const EmptyCartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted">
        <path d="M7.5 7.625C7.5 4.7625 9.7625 2.5 12.625 2.5C15.4875 2.5 17.75 4.7625 17.75 7.625" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.3375 21.5H8.9125C5.9375 21.5 5.075 19.5875 4.075 16.1L2.8 12.1875C2.2625 10.375 3.0125 9 4.9625 9H20.2875C22.2375 9 22.9875 10.375 22.45 12.1875L20.5 18.5" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.5 13H10.5" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export default function POSPage() {
    const products = useStore(s => s.products);
    const currentSale = useStore(s => s.currentSale);
    const addItemToSale = useStore(s => s.addItemToSale);
    const clearSale = useStore(s => s.clearSale);
    const getTotalAmount = useStore(s => s.getTotalAmount);
    const currentCustomer = useStore(s => s.currentCustomer);
    const addToast = useStore(s => s.addToast);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAdd = (p) => addItemToSale(p, 1);
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleFinalize = async () => {
        const items = Object.values(currentSale).map(i => ({ productId: i.productId, productName: i.name, quantity: i.quantity, priceAtSale: i.price, subtotal: i.price * i.quantity }));
        if (items.length === 0) return addToast({ title: 'No items', description: 'Add items before finalizing', variant: 'warning' });

        if (!currentCustomer?.id || !currentCustomer?.name) {
            return addToast({ title: 'No customer selected', description: 'Please select a customer before finalizing the sale.', variant: 'warning' });
        }

        setIsSubmitting(true);
        try {
            const payload = {
                saleTimestamp: new Date().toISOString(),
                totalAmount: getTotalAmount(),
                customerId: currentCustomer.id,
                customerName: currentCustomer.name,
                items,
                status: 'Completed',
                paymentMethod: 'Cash',
            };

            console.log('Payload for createSale:', payload); // Log payload for debugging

            const created = await api.createSale(payload);
            addToast({ title: 'Sale saved', description: `Sale ${created.id} recorded`, variant: 'success' });
            clearSale();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error saving sale', description: e.message, variant: 'destructive' });
        } finally { setIsSubmitting(false); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Point of Sale</h1>
            </div>

            {/* Main content */}
            <div className="flex flex-row-reverse gap-4 h-[calc(100vh-12rem)]">

                {/* Current Order Sidebar */}
                <div className="w-full max-w-sm">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-primary">Current Order</h3>
                                <Button variant="ghost" size="sm">✖</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            {!Object.keys(currentSale).length ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <EmptyCartIcon />
                                    <p className="text-muted mt-2">Your cart is empty</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableBody>
                                        {Object.entries(currentSale).map(([key, item]) => (
                                            <TableRow key={key}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>
                                                  <Button variant="ghost" size="sm">-</Button>
                                                  <span>{item.quantity}</span>
                                                  <Button variant="ghost" size="sm">+</Button>
                                                </TableCell>
                                                <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                                                <TableCell>
                                                  <Button variant="ghost" size="sm">🗑</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                        <CardFooter>
                          <div className="w-full">
                            <div className="flex justify-between mb-4">
                              <div className="font-semibold text-lg">Subtotal</div>
                              <div className="font-semibold text-lg">$8.99</div>
                            </div>
                            <div className="flex justify-between mb-4">
                              <div className="font-semibold text-lg">Tax (8%)</div>
                              <div className="font-semibold text-lg">$0.72</div>
                            </div>
                            <div className="flex justify-between mb-4">
                              <div className="font-semibold text-lg">Total</div>
                              <div className="font-semibold text-lg text-success">$9.71</div>
                            </div>
                            <Button variant="primary" className="w-full">Checkout</Button>
                          </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Main product grid */}
                <div className="flex-1 overflow-auto">
                    <Card>
                        <CardHeader><h3 className="font-semibold text-primary">Products</h3></CardHeader>
                        <CardContent>
                            {!products.length ? <div className="p-4 text-center text-muted">No products available</div> : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map(p => (
                                        <button key={p.id} className="product-card" onClick={() => handleAdd(p)}>
                                            <div className="product-card-image">
                                                <span role="img" aria-label={p.name} style={{fontSize: '3rem'}}>🍔</span>
                                            </div>
                                            <div className="font-medium text-lg">{p.name}</div>
                                            <div className="text-sm text-muted">${Number(p.price || 0).toFixed(2)}</div>
                                       </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Example Modal */}
            <Dialog open={isModalOpen}>
                <DialogContent>
                    <DialogCloseButton onClick={handleCloseModal} />
                    <DialogHeader>Example Modal</DialogHeader>
                    <p>This is an example modal for demonstration purposes.</p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleCloseModal}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}