import React, { useState, useEffect } from 'react'; // Import useEffect
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
    const removeItemFromSale = useStore(s => s.removeItemFromSale);
    const clearSale = useStore(s => s.clearSale);
    const getTotalAmount = useStore(s => s.getTotalAmount);
    const addToast = useStore(s => s.addToast);
    // const customers = useStore(s => s.customers); // No longer needed for search

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    // State for API search
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- Calculations for Current Order Footer ---
    const subtotal = getTotalAmount();
    // -------------------------------------------

    // Debounce effect for search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // API fetching effect
    useEffect(() => {
        // Don't fetch if modal is closed
        if (!isCustomerModalOpen) {
            setSearchResults([]);
            return;
        }

        const fetchCustomers = async () => {
            setIsSearching(true);
            try {
                // Use `search` param. If no term, it should return all (or first page)
                const url = `http://localhost:8055/items/customers?search=${encodeURIComponent(debouncedSearchTerm)}`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch customers');
                }
                const result = await response.json();
                // API returns results in a 'data' array
                setSearchResults(result.data || []);
            } catch (error) {
                console.error("Failed to fetch customers:", error);
                setSearchResults([]);
                addToast({ title: 'Search Error', description: error.message, variant: 'destructive' });
            } finally {
                setIsSearching(false);
            }
        };

        fetchCustomers();

    }, [debouncedSearchTerm, isCustomerModalOpen, addToast]);


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

    // Handler for selecting customer from modal
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setSearchTerm(''); // Clear search input
        setIsCustomerModalOpen(false); // Close modal
    };

    const handleCheckout = async () => {
        const items = Object.values(currentSale).map(i => ({ productId: i.productId, productName: i.name, quantity: i.quantity, priceAtSale: i.price, subtotal: i.price * i.quantity }));
        if (items.length === 0) return addToast({ title: 'No items', description: 'Add items before finalizing', variant: 'warning' });

        setIsSubmitting(true);
        try {
            const payload = {
                id: Date.now(),
                saleTimestamp: new Date().toISOString(),
                totalAmount: subtotal,
                // Use null for walk-in, or the customer ID if one is selected
                customerId: selectedCustomer?.id || null,
                customerName: selectedCustomer?.name || 'Walk-in',
                items,
                status: 'Completed',
                paymentMethod: 'Cash',
                subtotal: subtotal,
            };

            console.log('Payload for createSale:', payload);

            const created = await api.createSale(payload);
            addToast({ title: 'Sale saved', description: `Sale ₱{created.id} recorded`, variant: 'success' });
            clearSale();
            setSelectedCustomer(null); // Reset customer
            setSearchTerm('');
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error saving sale', description: e.message, variant: 'destructive' });
        } finally { setIsSubmitting(false); }
    };

    // Filtered customers is no longer needed
    // const filteredCustomers = ...

    return (
        // Wrapper div is needed as the direct child of <main>
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Point of Sale</h1>
            </div>

            {/* Main content area - Reversed layout */}
            <div className="flex flex-row-reverse gap-4 h-full"> {/* Adjusted height to full */}

                {/* Current Order Sidebar */}
                <div className="w-full max-w-sm flex-shrink-0">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-primary">Current Order</h3>
                                <Button variant="ghost" size="sm" className="p-1 h-auto">✖</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            {!Object.keys(currentSale).length ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <EmptyCartIcon />
                                    <p className="text-muted mt-2">Your cart is empty</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-full">
                                    <Table>
                                        <TableBody>
                                            {Object.entries(currentSale).map(([key, item]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium">{item.name}<br/><span className="text-sm text-muted">₱{item.price.toFixed(2)} each</span></TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => handleDecreaseQuantity(key)}>-</Button>
                                                            <span>{item.quantity}</span>
                                                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => handleIncreaseQuantity(key)}>+</Button>
                                                        </div>
                                                    </TableCell>
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

                        {/* --- CUSTOMER SECTION --- */}
                        <div className="p-4 border-t space-y-2">
                            <h4 className="text-sm font-medium">Customer</h4>
                            <Button
                                variant="outline"
                                className="w-full justify-between"
                                onClick={() => setIsCustomerModalOpen(true)}
                            >
                                <span>{selectedCustomer?.name || 'Walk-in Customer'}</span>
                                <span className="text-xs text-muted-foreground">Change</span>
                            </Button>
                        </div>
                        {/* --- END CUSTOMER SECTION --- */}

                        <CardFooter>
                            <div className="w-full">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span>Subtotal</span>
                                    <span>₱{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-4 font-bold text-lg border-t pt-2 mt-2">
                                    <span>Total</span>
                                    <span className="text-success">₱{subtotal.toFixed(2)}</span>
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
                    <div className="mb-4">
                        <Input placeholder="Search products..." className="w-full" />
                    </div>

                    <Card>
                        <CardContent>
                            {!products.length ? <div className="p-4 text-center text-muted">No products available</div> : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map(p => (
                                        <button key={p.id} className="product-card" onClick={() => handleAdd(p)}>
                                            <div className="product-card-image">
                                                <span role="img" aria-label={p.name} style={{fontSize: '3rem'}}>🍔</span>
                                            </div>
                                            <div className="font-medium text-lg">{p.name}</div>
                                            <div className="text-sm text-muted">₱{Number(p.price || 0).toFixed(2)}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- CUSTOMER SELECTION DIALOG (MODAL) --- */}
            {/* Added bg-background to remove transparency */}
            <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white shadow-lg rounded-md" style={{ backgroundColor: 'var(--surface)', opacity: 1, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                    <DialogHeader>
                        <h3 className="font-semibold text-lg">Select Customer</h3>
                        <DialogCloseButton />
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            id="customer-search-modal"
                            type="text"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full mb-4"
                        />
                        <ScrollArea className="h-[300px] border rounded-md">
                            <div className="p-2 space-y-1">
                                {/* Static "Walk-in" option to select 'null' customer */}
                                <Button
                                    variant={selectedCustomer === null ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => handleSelectCustomer(null)}
                                >
                                    Walk-in Customer
                                </Button>

                                {/* Divider */}
                                {(isSearching || searchResults.length > 0) && <hr className="my-1" />}

                                {/* API Search Results */}
                                {isSearching ? (
                                    <p className="p-4 text-sm text-center text-muted">Searching...</p>
                                ) : (
                                    <>
                                        {searchResults.map(customer => (
                                            <Button
                                                key={customer.id}
                                                variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                className="w-full justify-start"
                                                onClick={() => handleSelectCustomer(customer)}
                                            >
                                                {customer.name}
                                            </Button>
                                        ))}
                                        {/* Show "No customers" only if a search was typed and no results found */}
                                        {searchResults.length === 0 && debouncedSearchTerm && (
                                            <p className="p-4 text-sm text-center text-muted">No customers found.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

        </div> // End of wrapper div
    );
}