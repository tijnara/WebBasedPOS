import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

// --- Import Supabase hooks ---
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCreateCustomer';
// useCustomers is needed if you want to pre-load or offer a dropdown
// import { useCustomers } from '../../hooks/useCustomerMutations';
import { supabase } from '../../lib/supabaseClient'; // Import supabase for direct search query

import {
    Button, Card, CardHeader, CardContent, CardFooter, Table, TableBody, TableRow, TableCell,
    ScrollArea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton,
    Input, Label, Select // Assuming Select is correctly exported from ui.js
} from '../ui';

// Empty cart icon (keep as is)
const EmptyCartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted">
        <path d="M7.5 7.625C7.5 4.7625 9.7625 2.5 12.625 2.5C15.4875 2.5 17.75 4.7625 17.75 7.625" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.3375 21.5H8.9125C5.9375 21.5 5.075 19.5875 4.075 16.1L2.8 12.1875C2.2625 10.375 3.0125 9 4.9625 9H20.2875C22.2375 9 22.9875 10.375 22.45 12.1875L20.5 18.5" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.5 13H10.5" stroke="#6b7280" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Trash icon (keep as is)
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);


export default function POSPage() {
    // --- Fetch products using the Supabase hook ---
    const { data: products = [], isLoading: isLoadingProducts } = useProducts();

    // --- Zustand state for UI (Cart, Customer, Toasts) ---
    const {
        currentSale, addItemToSale, removeItemFromSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer // Get customer state management
    } = useStore();

    // --- Initialize mutation hooks ---
    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    // --- Component State ---
    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer); // Init from store
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Search input for customers/products
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Debounced customer search term
    const [customerSearchResults, setCustomerSearchResults] = useState([]); // Results for customer search modal
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false); // Loading state for customer search

    // State for Custom Sale Modal
    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [customSaleProduct, setCustomSaleProduct] = useState('');
    const [customSalePrice, setCustomSalePrice] = useState('');
    const [customSaleQuantity, setCustomSaleQuantity] = useState('1');

    // State for Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default payment method
    const [amountReceived, setAmountReceived] = useState('');


    // Sync local selectedCustomer with global store state
    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    // Update global store when local selectedCustomer changes
    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer); // Update Zustand store
    };


    const subtotal = getTotalAmount();
    const changeDue = Math.max(0, parseFloat(amountReceived || 0) - subtotal);

    // Debounce effect for customer search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Customer Search Effect
    useEffect(() => {
        // Only search if the modal is open and the debounced term is not empty
        if (!isCustomerModalOpen || !debouncedSearchTerm) {
            setCustomerSearchResults([]);
            setIsSearchingCustomers(false);
            return;
        }

        const searchCustomers = async () => {
            setIsSearchingCustomers(true);
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .ilike('name', `%${debouncedSearchTerm}%`) // Case-insensitive search
                    .limit(10); // Limit results

                if (error) throw error;

                setCustomerSearchResults(data || []);
            } catch (error) {
                console.error("Failed to search customers:", error);
                setCustomerSearchResults([]);
                addToast({ title: 'Search Error', description: error.message, variant: 'destructive' });
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        searchCustomers();
    }, [debouncedSearchTerm, isCustomerModalOpen, addToast]);


    // --- Cart handling functions ---
    const handleAdd = (p) => addItemToSale(p, 1);
    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) addItemToSale({ id: item.productId, name: item.name, price: item.price }, 1);
    };
    const handleDecreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) addItemToSale({ id: item.productId, name: item.name, price: item.price }, -1);
    };
    const handleRemoveItem = (key) => removeItemFromSale(key);

    // --- Customer selection ---
    const handleSelectCustomerFromModal = (customer) => {
        handleSetSelectedCustomer(customer); // Use combined function
        setSearchTerm(''); // Clear search term after selection
        setIsCustomerModalOpen(false);
    };

    // --- Add New Customer ---
    const handleAddCustomer = async (newCustomerName) => {
        if (!newCustomerName || !newCustomerName.trim()) {
            addToast({ title: 'Error', description: 'Customer name cannot be empty.', variant: 'destructive' });
            return;
        }
        try {
            const payload = { name: newCustomerName.trim() }; // Basic payload
            const addedCustomer = await createCustomerMutation.mutateAsync(payload);
            handleSelectCustomerFromModal(addedCustomer); // Select the newly added customer
            addToast({ title: 'Customer Added', description: `${addedCustomer.name} added and selected.`, variant: 'success' });
        } catch (error) {
            console.error('Error adding customer:', error);
            addToast({ title: 'Error Adding Customer', description: error.message, variant: 'destructive' });
        }
    };

    // --- Checkout Process ---
    const openPaymentModal = () => {
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding to payment.', variant: 'warning' });
            return;
        }
        setAmountReceived(subtotal.toFixed(2)); // Pre-fill with exact amount
        setPaymentMethod('Cash'); // Reset to default
        setIsPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setAmountReceived(''); // Clear amount received
    }

    const handleFinalizeSale = async () => {
        const items = Object.values(currentSale).map(i => ({
            productId: i.productId,
            productName: i.name, // Store name at time of sale
            quantity: i.quantity,
            priceAtSale: i.price, // Store price at time of sale
            subtotal: i.price * i.quantity
        }));

        // Basic validation in modal ensures amountReceived is likely valid number
        const received = parseFloat(amountReceived || 0);

        try {
            const payload = {
                // Supabase handles 'id' and 'created_at'
                saleTimestamp: new Date().toISOString(),
                totalAmount: subtotal,
                customerId: selectedCustomer?.id || null,
                // Store selected customer name or 'Walk-in' at time of sale
                customerName: selectedCustomer?.name || 'Walk-in',
                items: items, // Should be acceptable by Supabase if column type is jsonb
                status: 'Completed', // Default status
                paymentMethod: paymentMethod,
                amountReceived: received,
                changeGiven: Math.max(0, received - subtotal), // Calculate change given
                // subtotal: subtotal, // totalAmount usually serves this purpose
            };

            console.log('Finalizing Sale - Payload:', payload);
            const created = await createSaleMutation.mutateAsync(payload);
            console.log('Finalizing Sale - Success:', created);

            addToast({ title: 'Sale Completed', description: `Sale #${created.id.toString().slice(-6)} recorded.`, variant: 'success' });
            clearSale();
            handleSetSelectedCustomer(null); // Clear selected customer via store
            closePaymentModal(); // Close the payment modal

        } catch (e) {
            console.error('Error finalizing sale:', e);
            addToast({ title: 'Checkout Error', description: e.message, variant: 'destructive' });
            // Keep payment modal open on error? Or close? Closing might be less confusing.
            // closePaymentModal();
        }
    };


    // --- Custom Sale Modal Functions ---
    const openCustomSaleModal = () => {
        setCustomSaleProduct('');
        setCustomSalePrice('');
        setCustomSaleQuantity('1');
        setIsCustomSaleModalOpen(true);
    };

    const closeCustomSaleModal = () => {
        setIsCustomSaleModalOpen(false);
    };

    // Auto-fill price when product is selected in custom sale modal
    const handleCustomProductChange = (productId) => {
        const product = products.find(p => String(p.id) === String(productId)); // Compare as strings just in case
        if (product) {
            setCustomSaleProduct(product.id);
            setCustomSalePrice(String(product.price || 0)); // Set price based on selected product
        } else {
            setCustomSaleProduct('');
            setCustomSalePrice(''); // Clear price if product not found
        }
    };

    const handleCustomSaleSubmit = (e) => {
        e.preventDefault();

        const selectedProduct = products.find(p => String(p.id) === String(customSaleProduct));
        const parsedPrice = parseFloat(customSalePrice);
        const parsedQuantity = parseInt(customSaleQuantity, 10);

        if (!selectedProduct) {
            addToast({ title: 'Error', description: 'Please select a valid product.', variant: 'destructive' });
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            addToast({ title: 'Error', description: 'Please enter a valid, non-negative price.', variant: 'destructive' });
            return;
        }
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            addToast({ title: 'Error', description: 'Please enter a valid quantity greater than 0.', variant: 'destructive' });
            return;
        }

        // Use the addItemToSale function with the overridePrice parameter
        addItemToSale(selectedProduct, parsedQuantity, parsedPrice);

        addToast({ title: 'Item Added', description: `${parsedQuantity} x ${selectedProduct.name} at ₱${parsedPrice.toFixed(2)} each added.`, variant: 'success' });
        closeCustomSaleModal();
    };
    // ----------------------------------------


    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h1 className="text-2xl font-bold">Point of Sale</h1>
                <div className="flex gap-2">
                    <Input
                        placeholder="Search products..."
                        className="w-full sm:w-64"
                        // Add onChange handler for product search if needed
                    />
                    <Button variant="outline" onClick={openCustomSaleModal}>
                        Custom Sale
                    </Button>
                </div>
            </div>

            {/* Main Layout: Product Grid | Order Sidebar */}
            <div className="flex flex-col lg:flex-row-reverse gap-4" style={{ height: 'calc(100vh - 150px)' }}> {/* Adjust height calculation based on your header/footer */}

                {/* --- Current Order Sidebar --- */}
                <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
                    <Card className="flex flex-col h-full">
                        {/* Card Header */}
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Current Order</h3>
                                <Button variant="ghost" size="sm" className="p-1 h-auto text-destructive" onClick={clearSale} title="Clear Sale">✖ Clear</Button>
                            </div>
                        </CardHeader>

                        {/* Cart Items */}
                        <CardContent className="flex-1 overflow-auto p-0">
                            {!Object.keys(currentSale).length ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500">
                                    <EmptyCartIcon />
                                    <p className="mt-2">Cart is empty</p>
                                </div>
                            ) : (
                                // Use ScrollArea for consistent styling if needed, or just rely on overflow-auto
                                <ScrollArea className="h-full px-2 py-1">
                                    <Table>
                                        <TableBody>
                                            {Object.entries(currentSale).map(([key, item]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium pr-1 py-2"> {/* Reduced padding */}
                                                        {item.name}
                                                        <br/>
                                                        <span className="text-xs text-muted">₱{item.price.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center px-0 py-2"> {/* Reduced padding */}
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={() => handleDecreaseQuantity(key)}>-</Button>
                                                            <span className="w-4 text-center">{item.quantity}</span>
                                                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={() => handleIncreaseQuantity(key)}>+</Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pl-1 py-2"> {/* Reduced padding */}
                                                        <span className="font-semibold mr-1">₱{(item.price * item.quantity).toFixed(2)}</span>
                                                        <Button variant="ghost" size="icon" className="text-destructive h-6 w-6 p-0" onClick={() => handleRemoveItem(key)} title="Remove Item">
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

                        {/* Customer Section */}
                        <div className="p-3 border-t space-y-1">
                            <Label className="text-sm font-medium">Customer</Label>
                            <Button
                                variant="outline"
                                className="w-full justify-between h-9 px-3 py-2" // Adjusted size
                                onClick={() => setIsCustomerModalOpen(true)}
                            >
                                <span className="truncate">{selectedCustomer?.name || 'Walk-in Customer'}</span>
                                <span className="text-xs text-muted-foreground ml-2">Change</span>
                            </Button>
                        </div>

                        {/* Totals & Checkout Button */}
                        <CardFooter className="p-3">
                            <div className="w-full">
                                <div className="flex justify-between mb-1 text-sm">
                                    <span>Subtotal</span>
                                    <span>₱{subtotal.toFixed(2)}</span>
                                </div>
                                {/* Add Taxes/Discounts here if needed */}
                                <div className="flex justify-between mb-3 font-bold text-lg border-t pt-2 mt-2">
                                    <span>Total</span>
                                    <span className="text-success">₱{subtotal.toFixed(2)}</span>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full h-12 text-lg" // Larger checkout button
                                    onClick={openPaymentModal}
                                    disabled={Object.keys(currentSale).length === 0 || createSaleMutation.isPending}
                                >
                                    {createSaleMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>


                {/* --- Main Product Grid --- */}
                <div className="flex-1 overflow-auto pr-2"> {/* Added padding-right */}
                    {/* Product Search Input (Moved to Header) */}
                    {/* <div className="mb-4">
                        <Input placeholder="Search products..." className="w-full" />
                    </div> */}
                    {isLoadingProducts ? (
                        <div className="p-10 text-center text-muted">Loading products...</div>
                    ) : !products.length ? (
                        <div className="p-10 text-center text-muted">No products available. Add products in Management.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"> {/* Adjusted gaps */}
                            {products
                                // Optional: Filter products based on search term state if you implement it
                                // .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                .map(p => (
                                    <button
                                        key={p.id}
                                        className="product-card p-3 text-center border rounded-md shadow-sm hover:border-primary hover:shadow-md transition-all duration-150 bg-white flex flex-col items-center"
                                        onClick={() => handleAdd(p)}
                                        title={p.name}
                                    >
                                        {/* Placeholder Image */}
                                        <div className="product-card-image h-16 w-16 mb-2 flex items-center justify-center text-4xl bg-gray-100 rounded">
                                            {/* You can replace this emoji based on category or use a placeholder image component */}
                                            <span>{p.category?.startsWith('Drink') ? '\ud83e\udd64' : '\ud83c\udf54'}</span>
                                        </div>
                                        <div className="font-medium text-sm leading-tight mb-1 line-clamp-2">{p.name}</div>
                                        <div className="text-xs text-muted font-semibold">
                                            ₱{Number(p.price || 0).toFixed(2)}
                                        </div>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>

            </div> {/* End Main Layout Flex */}


            {/* --- CUSTOMER SELECTION DIALOG --- */}
            <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select or Add Customer</DialogTitle>
                        <DialogCloseButton onClick={() => setIsCustomerModalOpen(false)} />
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <Input
                            id="customer-search-modal"
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                            autoFocus
                        />
                        <ScrollArea className="h-[300px] border rounded-md">
                            <div className="p-2 space-y-1">
                                {/* Walk-in Option */}
                                <Button
                                    variant={selectedCustomer === null ? "secondary" : "ghost"}
                                    className="w-full justify-start text-left h-auto py-2 px-3"
                                    onClick={() => handleSelectCustomerFromModal(null)}
                                >
                                    Walk-in Customer
                                </Button>
                                <hr className="my-1 border-border" />

                                {/* Search Results / Loading / Add New */}
                                {isSearchingCustomers ? (
                                    <p className="p-4 text-sm text-center text-muted">Searching...</p>
                                ) : (
                                    <>
                                        {customerSearchResults.map(customer => (
                                            <Button
                                                key={customer.id}
                                                variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                className="w-full justify-start text-left h-auto py-2 px-3"
                                                onClick={() => handleSelectCustomerFromModal(customer)}
                                            >
                                                {customer.name} {customer.phone && `(${customer.phone})`}
                                            </Button>
                                        ))}
                                        {/* Option to Add New Customer */}
                                        {customerSearchResults.length === 0 && debouncedSearchTerm && (
                                            <div className="p-4 text-center">
                                                <p className="text-sm text-muted mb-2">No existing customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleAddCustomer(debouncedSearchTerm)}
                                                    disabled={createCustomerMutation.isPending}
                                                >
                                                    {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${debouncedSearchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                        {/* Initial Prompt */}
                                        {customerSearchResults.length === 0 && !debouncedSearchTerm && !isSearchingCustomers && (
                                            <p className="p-4 text-sm text-center text-muted">Type to search existing customers or add a new one.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCustomerModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* --- CUSTOM SALE DIALOG --- */}
            <Dialog open={isCustomSaleModalOpen} onOpenChange={setIsCustomSaleModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Custom Sale Item</DialogTitle>
                        <DialogCloseButton onClick={closeCustomSaleModal} />
                    </DialogHeader>
                    <form onSubmit={handleCustomSaleSubmit}>
                        <div className="p-4 space-y-4">
                            {/* Product Selection */}
                            <div>
                                <Label htmlFor="customProduct">Product</Label>
                                <Select
                                    id="customProduct"
                                    className="w-full" // Use input class for styling consistency
                                    value={customSaleProduct}
                                    onChange={(e) => handleCustomProductChange(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Select Product --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (₱{p.price?.toFixed(2)})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            {/* Price Input */}
                            <div>
                                <Label htmlFor="customPrice">Custom Price (₱)</Label>
                                <Input
                                    id="customPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customSalePrice}
                                    onChange={e => setCustomSalePrice(e.target.value)}
                                    required
                                    className="w-full"
                                    placeholder="Enter price per item"
                                />
                            </div>
                            {/* Quantity Input */}
                            <div>
                                <Label htmlFor="customQuantity">Quantity</Label>
                                <Input
                                    id="customQuantity"
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={customSaleQuantity}
                                    onChange={e => setCustomSaleQuantity(e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeCustomSaleModal}>Cancel</Button>
                            <Button type="submit" variant="primary">Add to Order</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- PAYMENT DIALOG (MODAL) --- */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Complete Sale</DialogTitle>
                        <DialogCloseButton onClick={closePaymentModal} />
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-muted">Total Amount Due</p>
                            <p className="text-3xl font-bold">₱{subtotal.toFixed(2)}</p>
                        </div>

                        <div>
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            {/* Use Select component from ui.js */}
                            <Select
                                id="paymentMethod"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="GCash">GCash</option>
                                <option value="Other">Other</option>
                            </Select>
                        </div>

                        {/* Only show Amount Received and Change for Cash */}
                        {paymentMethod === 'Cash' && (
                            <>
                                <div>
                                    <Label htmlFor="amountReceived">Amount Received (₱)</Label>
                                    <Input
                                        id="amountReceived"
                                        type="number"
                                        step="0.01"
                                        min={subtotal.toFixed(2)} // Minimum amount is the total
                                        value={amountReceived}
                                        onChange={e => setAmountReceived(e.target.value)}
                                        required
                                        className="w-full"
                                        placeholder="Enter amount customer paid"
                                        autoFocus
                                    />
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-sm text-muted">Change Due</p>
                                    <p className="text-xl font-semibold">₱{changeDue.toFixed(2)}</p>
                                </div>
                            </>
                        )}
                        {/* You might add fields for Card/GCash reference numbers here if needed */}

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closePaymentModal}>Cancel</Button>
                        <Button
                            variant="success" // Use success variant
                            onClick={handleFinalizeSale}
                            disabled={createSaleMutation.isPending || (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < subtotal)}
                        >
                            {createSaleMutation.isPending ? 'Saving...' : 'Confirm Sale'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div> // End of wrapper div
    );
}