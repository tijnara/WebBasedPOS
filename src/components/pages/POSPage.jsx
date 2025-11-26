// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react'; // --- FIX: Imported useRef ---
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCreateCustomer';
import {
    Button, Card, CardContent, CardHeader, ScrollArea, Input,
    Dialog, DialogContent, DialogCloseButton, Select, Label, CardFooter, DialogHeader, DialogTitle,
    DialogFooter
} from '../ui';
import MobileLogoutButton from '../MobileLogoutButton';
// --- FIX: Added missing imports ---
import TabBar from '../TabBar';
import { supabase } from '../../lib/supabaseClient';
import Pagination from '../Pagination';
import currency from 'currency.js';

// --- (REMOVED) CartDrawer is no longer used ---
// import CartDrawer from '../CartDrawer';

// --- Icons (Assuming TrashIcon exist as before) ---
// Removed EmptyCartIcon (unused)
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);
// --- FIX: Added placeholder for missing PackageIcon ---
const PackageIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

// --- ProductImage helper component ---
const ProductImage = ({ product }) => {
    // 1. Check for uploaded image first
    if (product.image_url) {
        return (
            <img
                src={product.image_url}
                alt={product.name}
                style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                }}
            />
        );
    }

    // 2. Fallback to hardcoded images based on name/category
    let imageUrl = '';
    let altText = product.name;
    const lowerName = (product.name || '').toLowerCase();
    const lowerCategory = (product.category || '').toLowerCase();

    // Check for Ice Tubes/Cubes (more robust)
    if (lowerName.includes('ice tube') || lowerName.includes('ice cubes') || lowerName.includes('ice cube') || lowerName.includes('ice tubes/cubes')) {
        imageUrl = '/icecubes.png';
    }
    // Check for Pet Bottles (Specific)
    else if (lowerName.includes('pet bottles')) {
        imageUrl = '/petbottles.png';
    }
    // Check for Containers (General)
    else if (lowerCategory.includes('container') || lowerName.includes('empty bottle') || lowerName.includes('container')) {
        imageUrl = '/container1.png';
    }
    // Check for Water/Refills (Broad)
    else if (lowerCategory === 'water' || lowerName.includes('refill') || lowerName.includes('alkaline') || lowerName.includes('purified')) {
        imageUrl = '/refill.png';
    }

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={altText}
                style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    padding: '4px',
                }}
            />
        );
    }
    // Fallback icon
    return <PackageIcon className="w-10 h-10 text-muted" />;
};

export default function POSPage() {
    // --- Pagination state (added) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    // --- Fetch products using the Supabase hook (paginated & barcode lookup) ---
    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({ searchTerm: '', page: currentPage, itemsPerPage });
    const products = productsData.products;
    const totalPages = productsData.totalPages || 1;
    const allProducts = products || []; // Alias for barcode lookup

    // --- Zustand state for UI (Cart, Customer, Toasts) ---
    const {
        currentSale, addItemToSale, removeItemFromSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer
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

    // --- FIX: Defined the missing ref ---
    const customerPaymentInputRef = useRef(null); // Ref for payment modal customer input

    // State for Custom Sale Modal
    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [customSaleProduct, setCustomSaleProduct] = useState('');
    const [customSalePrice, setCustomSalePrice] = useState('');
    const [customSaleQuantity, setCustomSaleQuantity] = useState('1');

    // State for Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default payment method
    const [amountReceived, setAmountReceived] = useState('');

    // Add lastCustomer state, initialize from localStorage
    const [lastCustomer, setLastCustomer] = useState(() => {
        try {
            const stored = localStorage.getItem('lastCustomer');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Add state for sale date, default to today
    const [saleDate, setSaleDate] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    });

    // Add state for sale time, default to now
    const [saleTime, setSaleTime] = useState(() => {
        const now = new Date();
        return now.toTimeString().slice(0,5); // 'HH:MM'
    });

    // --- (REMOVED) CartDrawer state ---
    // const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    // (REMOVED) Helper to get cart items as array
    /*
    const cartItems = Object.entries(currentSale).map(([key, item]) => ({
        key,
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));
    */

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

    // Debounce effect for customer search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- SCANNER LOGIC ---
    useEffect(() => {
        if (!searchTerm) return;
        const trimmed = searchTerm.trim();
        const scannedProduct = allProducts.find(p => p.barcode === trimmed);
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Scanned', description: `${scannedProduct.name} added.`, variant: 'success' });
            setSearchTerm('');
        }
    }, [searchTerm, allProducts]);

    // Customer Search Effect
    useEffect(() => {
        // Only search if a customer modal OR payment modal is open and the debounced term is not empty
        if (!(isCustomerModalOpen || isPaymentModalOpen) || !debouncedSearchTerm) {
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

                if (error) {
                    // Optionally log error for debugging, but do not throw to avoid console output
                    // console.error('Failed to search customers:', error);
                    setCustomerSearchResults([]);
                    addToast({ title: 'Search Error', description: error.message, variant: 'destructive' });
                    return;
                }

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
    }, [debouncedSearchTerm, isCustomerModalOpen, isPaymentModalOpen, addToast]);


    // --- Recently Used Products State ---
    const [recentProducts, setRecentProducts] = useState([]);

    // Add product (standard click or barcode scan) and track recent list (max 3)
    const handleAdd = (product) => {
        if (!product) return;
        addItemToSale(product, 1);
        setRecentProducts(prev => {
            const without = prev.filter(p => p.id !== product.id);
            return [product, ...without].slice(0, 3);
        });
    };

    // --- Cart handling functions ---
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

    // --- NEW: Payment modal customer selection helper (clears suggestions) ---
    const handleSelectCustomerInPayment = (customer) => {
        handleSetSelectedCustomer(customer);
        // Clear search related state so suggestions disappear
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setCustomerSearchResults([]);
        setIsSearchingCustomers(false);
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
        setAmountReceived(subtotal.toFixed(2)); // FIX: Use plain number string
        setPaymentMethod('Cash'); // Reset to default
        // Set default time to now when opening modal
        const now = new Date();
        setSaleTime(now.toTimeString().slice(0,5));
        setIsPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setAmountReceived(''); // Clear amount received
    }

    const user = useStore(s => s.user); // Get current logged-in user

    const handleFinalizeSale = async () => {
        if (!selectedCustomer) {
            addToast({ title: 'Customer Required', description: 'Please select a customer before confirming the sale.', variant: 'warning' });
            return;
        }
        // --- FIX 1: Calculate Item Subtotals Safely ---
        const items = Object.values(currentSale).map(i => ({
            productId: i.productId,
            productName: i.name,
            quantity: i.quantity,
            priceAtSale: i.price,
            subtotal: currency(i.price).multiply(i.quantity).value // <-- FIX: No native math
        }));
        const received = currency(amountReceived || 0).value;
        // --- FIX 2: Calculate Change Safely ---
        const changeCalculated = currency(received).subtract(subtotal).value;
        try {
            const saleTimestamp = saleDate && saleTime
                ? new Date(`${saleDate}T${saleTime}:00`).toISOString()
                : new Date().toISOString();
            const payload = {
                saleTimestamp,
                totalAmount: subtotal,
                customerId: selectedCustomer?.id || null,
                customerName: selectedCustomer?.name || 'Walk-in',
                items,
                status: 'Completed',
                paymentMethod: paymentMethod,
                amountReceived: received,
                changeGiven: Math.max(0, changeCalculated), // <-- Use the safe calculated change
                created_by: user?.id || null
            };
            const created = await createSaleMutation.mutateAsync(payload);
            addToast({ title: 'Sale Completed', description: `Sale #${created.id.toString().slice(-6)} recorded.`, variant: 'success' });
            clearSale();
            handleSetSelectedCustomer(null);
            setLastCustomer(selectedCustomer);
            localStorage.setItem('lastCustomer', JSON.stringify(selectedCustomer));
            // Auto-clear all modal fields
            setAmountReceived('');
            setPaymentMethod('Cash');
            setSaleDate(() => {
                const today = new Date();
                return today.toISOString().slice(0, 10);
            });
            setSaleTime(() => {
                const now = new Date();
                return now.toTimeString().slice(0,5);
            });
            setSearchTerm('');
            setDebouncedSearchTerm('');
            setCustomerSearchResults([]);
            setIsSearchingCustomers(false);
            setIsPaymentModalOpen(false);
        } catch (e) {
            addToast({ title: 'Checkout Error', description: e.message, variant: 'destructive' });
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

        addItemToSale(selectedProduct, parsedQuantity, parsedPrice);
        // Track product as recently used
        setRecentProducts(prev => {
            const without = prev.filter(p => p.id !== selectedProduct.id);
            return [selectedProduct, ...without].slice(0, 3);
        });

        addToast({ title: 'Item Added', description: `${parsedQuantity} x ${selectedProduct.name} at ₱${parsedPrice.toFixed(2)} each added.`, variant: 'success' });
        closeCustomSaleModal();
    };
    // ----------------------------------------


    // Show all products, filtering is now handled by the product grid directly
    const filteredProducts = products;

    return (
        <div className="pos-page">
            {/* --- Brand Logo at the very top left --- */}
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
            <MobileLogoutButton />
            {/* --- Header --- */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Point of Sale</h1>
                <div className="flex gap-4">
                    {/* Removed product search field from the header */}
                    <Button variant="primary" onClick={openCustomSaleModal} className="rounded-lg shadow-md font-semibold">
                        + Custom Sale
                    </Button>
                </div>
            </div>
            {/* --- Main Layout: Product Grid | Order Sidebar --- */}
            {/* --- (MODIFIED) --- */}
            <div className="flex flex-col md:flex-row-reverse gap-4 w-full">
                {/* --- Sidebar: Current Order --- */}
                {/* --- (MODIFIED) Removed hidden logic, fixed height, and added order-1 --- */}
                <div className="w-full md:w-1/3 xl:w-1/4 flex-shrink-0 flex flex-col order-1 md:order-none" style={{height: 'auto'}}>
                    {/* Current Order Card */}
                    {/* --- (MODIFIED) Removed flex-1 --- */}
                    <Card className="flex flex-col shadow-lg border border-gray-200 rounded-xl bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-primary">Current Order</h3>
                                <Button variant="ghost" size="sm" className="p-1 h-auto text-destructive" onClick={clearSale} title="Clear Sale">✖ Clear</Button>
                            </div>
                        </CardHeader>
                        {/* --- (MODIFIED) Removed flex-1 --- */}
                        <CardContent className="p-0 relative">
                            {!Object.keys(currentSale).length ? (
                                // --- (MODIFIED) Compact Empty State ---
                                <div className="flex items-center justify-center text-center p-3 text-sm text-gray-500 bg-gray-50 border-b md:p-4" style={{ minHeight: '60px' }}>
                                    Cart is empty — Start order
                                </div>
                            ) : (
                                // --- (MODIFIED) Use Flexbox instead of Table ---
                                <ScrollArea className="relative w-full current-order-scroll-area">
                                    <div className="flex flex-col divide-y divide-gray-100 p-2">
                                        {Object.entries(currentSale).map(([key, item]) => (
                                            <div key={key} className="flex items-center gap-2 py-2" style={{ minHeight: '60px' }}> {/* Item Row */}
                                                {/* 1. Thumbnail */}
                                                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden border">
                                                    <ProductImage product={{ name: item.name, category: '' }} />
                                                </div>

                                                {/* 2. Name & Unit Price */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{item.name}</div>
                                                    <div className="text-xs text-muted">@ {currency(item.price, { symbol: '₱', precision: 2 }).format()}</div>
                                                </div>

                                                {/* 3. Quantity Controls (min 44px height) */}
                                                <div className="flex items-center justify-center space-x-0" style={{ minHeight: '44px' }}>
                                                    <Button variant="ghost" size="sm" className="p-1 h-9 w-9 rounded-full" onClick={() => handleDecreaseQuantity(key)}>-</Button>
                                                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                                                    <Button variant="ghost" size="sm" className="p-1 h-9 w-9 rounded-full" onClick={() => handleIncreaseQuantity(key)}>+</Button>
                                                </div>

                                                {/* 4. Line Total & Remove */}
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
                            {/* Removed Customer section as per the change request */}
                        </div>
                        <CardFooter className="p-3 flex-shrink-0 bg-gray-50 rounded-b-xl">
                            <div className="w-full">
                                <div className="flex justify-between mb-1 text-sm"><span>Subtotal</span><span>₱{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span></div>
                                <div className="flex justify-between mb-3 font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span className="text-success">₱{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span></div>
                                {/* --- (MODIFIED) Hide button on mobile, show on desktop --- */}
                                <Button variant="primary" className="w-full h-12 text-lg rounded-lg shadow-md font-semibold hidden md:flex" onClick={openPaymentModal} disabled={Object.keys(currentSale).length === 0 || createSaleMutation.isPending}>
                                    {createSaleMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                                </Button>
                                {/* --- (NEW) Show button on mobile, hide on desktop --- */}
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
                        </CardFooter>
                    </Card>
                    {/* Last Customer label below the card, left-aligned, larger font */}
                    <div className="mt-2 flex justify-start flex-shrink-0">
                        <span className="text-lg text-gray-800 font-semibold">Last Customer Used: <span className="font-bold">{lastCustomer ? lastCustomer.name : 'none'}</span></span>
                    </div>
                </div>

                {/* --- Main Product Grid --- */}
                {/* --- (MODIFIED) Added order-2 --- */}
                <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-100px)] order-2">
                    {isLoadingProducts ? (
                        <div className="p-10 text-center text-muted">Loading products...</div>
                    ) : !filteredProducts.length ? (
                        <div className="p-10 text-center text-muted">
                            {/* --- FIX: Removed undefined variable 'productSearchTerm' --- */}
                            'No products available.'
                        </div>
                    ) : (
                        <>
                            {/* --- Recently Used Products (Desktop & Mobile) --- */}
                            {recentProducts.length > 0 && (
                                <div className="mb-4">
                                    <h2 className="text-base font-semibold text-primary mb-2">Recently Used Products</h2>
                                    <div className="flex gap-2">
                                        {recentProducts.map(p => (
                                            <button
                                                key={p.id}
                                                className="product-card p-2 border rounded-xl shadow bg-white flex flex-col items-center hover:border-primary transition-all duration-150"
                                                onClick={() => handleAdd(p)}
                                                title={p.name}
                                                style={{ minWidth: '80px', maxWidth: '120px' }}
                                            >
                                                <div className="h-12 w-12 mb-1 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                                                    <ProductImage product={p} />
                                                </div>
                                                <div className="font-medium text-xs text-gray-800 truncate mb-1">{p.name}</div>
                                                <div className="text-xs text-primary font-bold">₱{Number(p.price || 0).toFixed(2)}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- Desktop Grid Layout --- */}
                            {/* --- FIX: Removed undefined 'productGridRef' --- */}
                            <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map((p) => (
                                    <button
                                        key={p.id}
                                        className="product-card p-4 text-center border rounded-xl shadow-md hover:border-primary hover:shadow-lg transition-all duration-150 bg-white flex flex-col items-center relative"
                                        onClick={() => handleAdd(p)}
                                        title={p.name}
                                        tabIndex={-1}
                                        disabled={p.stock <= 0}
                                        style={{ opacity: p.stock <= 0 ? 0.5 : 1 }}
                                    >
                                        {/* Stock Badge */}
                                        <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full ${
                                            p.stock <= 0 ? 'bg-red-100 text-red-600' :
                                            p.stock <= p.minStock ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                            {p.stock} left
                                        </div>
                                        {/* --- Product Image --- */}
                                        <div className="product-card-image h-20 w-full mb-2 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-1">
                                            <ProductImage product={p} />
                                        </div>
                                        <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2 text-gray-800">{p.name}</div>
                                        <div className="text-xs text-primary font-bold">₱{Number(p.price || 0).toFixed(2)}</div>
                                    </button>
                                ))}
                            </div>
                            {/* --- MOBILE LIST VIEW (Show on mobile, hide on md+) --- */}
                            <div className="block md:hidden">
                                <Card>
                                    <CardContent className="p-0">
                                        {isLoadingProducts ? (
                                            <div className="text-center text-muted p-6">Loading products...</div>
                                        ) : !filteredProducts.length ? (
                                            <div className="text-center text-muted p-6">No products found.</div>
                                        ) : (
                                            // Mobile grid view (2 columns)
                                            <div className="grid grid-cols-2 gap-3 p-3">
                                                {filteredProducts.map(p => (
                                                    <button
                                                        key={p.id}
                                                        className={`relative flex flex-col items-center p-2 rounded-xl border shadow-sm bg-white hover:border-primary transition-colors duration-150 ${p.stock <= 0 ? 'opacity-50' : ''}`}
                                                        onClick={() => handleAdd(p)}
                                                        disabled={p.stock <= 0}
                                                        title={p.name}
                                                    >
                                                        {/* Stock Badge */}
                                                        <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock <= 0 ? 'bg-red-100 text-red-600' : p.stock <= p.minStock ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{p.stock} left</div>
                                                        {/* Image */}
                                                        <div className="w-16 h-16 mb-1 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
                                                            <ProductImage product={p} />
                                                        </div>
                                                        {/* Name */}
                                                        <div className="w-full text-center font-medium text-[11px] leading-tight line-clamp-2 mb-0.5 text-gray-800">
                                                            {p.name}
                                                        </div>
                                                        {/* Price */}
                                                        <div className="text-[11px] font-semibold text-primary">₱{Number(p.price || 0).toFixed(2)}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- DIALOGS (Customer, Custom Sale, Payment) --- */}
            <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                <DialogContent
                    className="p-0 overflow-hidden max-h-[calc(100dvh-2rem)] sm:max-w-lg bg-white shadow-xl border border-gray-100"
                    style={{ backgroundColor: '#ffffff', zIndex: 50 }}
                >
                    <div className="flex flex-col h-full max-h-[calc(100dvh-2rem)] bg-white" style={{ backgroundColor: '#ffffff' }}>
                        {/* Header */}
                        <DialogHeader
                            className="px-6 py-4 border-b bg-white flex-shrink-0 z-10"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            <DialogTitle className="text-lg font-bold text-gray-900">Select or Add Customer</DialogTitle>
                            <DialogCloseButton onClick={() => setIsCustomerModalOpen(false)} />
                        </DialogHeader>

                        {/* Scrollable Body */}
                        <div
                            className="flex-1 overflow-y-auto px-6 py-6 space-y-4 modal-scroll modal-scrollbar bg-white"
                            style={{ minHeight: '0', backgroundColor: '#ffffff' }}
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="customer-search-modal" className="text-sm font-semibold text-gray-700">
                                    Search Customer
                                </Label>
                                <Input
                                    id="customer-search-modal"
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-base py-2.5"
                                    autoFocus
                                />
                            </div>

                            <ScrollArea className="h-[300px] border rounded-md">
                                <div className="p-2 space-y-1">
                                    {/* Walk-in Option */}
                                    <Button
                                        variant={selectedCustomer === null ? "secondary" : "ghost"}
                                        className="w-full justify-start text-left h-auto py-2.5 px-3 text-base"
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
                                                    className="w-full justify-start text-left h-auto py-2.5 px-3 text-base"
                                                    onClick={() => handleSelectCustomerFromModal(customer)}
                                                >
                                                    {customer.name} {customer.phone && `(${customer.phone})`}
                                                </Button>
                                            ))}
                                            {/* Option to Add New Customer */}
                                            {customerSearchResults.length === 0 && debouncedSearchTerm && (
                                                <div className="p-4 text-center">
                                                    <p className="text-sm text-gray-600 mb-3">No existing customer found.</p>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleAddCustomer(debouncedSearchTerm)}
                                                        disabled={createCustomerMutation.isPending}
                                                        className="px-4"
                                                    >
                                                        {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${debouncedSearchTerm}"`}
                                                    </Button>
                                                </div>
                                            )}
                                            {/* Initial Prompt */}
                                            {customerSearchResults.length === 0 && !debouncedSearchTerm && !isSearchingCustomers && (
                                                <p className="p-4 text-sm text-center text-gray-600">Type to search existing customers or add a new one.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Footer */}
                        <DialogFooter
                            className="px-6 py-4 border-t bg-gray-50 flex-shrink-0"
                            style={{ backgroundColor: '#f9fafb' }}
                        >
                            <div className="flex w-full justify-end">
                                <Button variant="outline" onClick={() => setIsCustomerModalOpen(false)} className="px-6">Close</Button>
                            </div>
                        </DialogFooter>
                    </div>
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
                <DialogContent
                    className="sm:max-w-sm"
                >
                    <DialogHeader>
                        <DialogTitle>Complete Sale</DialogTitle>
                        <DialogCloseButton onClick={closePaymentModal} />
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        {/* --- Customer Searchable Dropdown --- */}
                        <div>
                            <Label htmlFor="customer-search-payment">
                                Customer {lastCustomer ? `(last used: ${lastCustomer.name || 'Walk-in'})` : ''}
                            </Label>
                            <Input
                                id="customer-search-payment"
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                // --- FIX: Add text-base to prevent mobile zoom ---
                                className="w-full mb-2 text-base"
                                // --- FIX: The ref is now defined ---
                                ref={customerPaymentInputRef}
                                inputMode="text"
                                pattern=".*"
                                autoComplete="off"
                            />
                            <ScrollArea className="h-[150px] border rounded-md mb-2">
                                <div className="p-2 space-y-1">
                                    {/* Walk-in Option */}
                                    <Button
                                        variant={selectedCustomer === null ? "secondary" : "ghost"}
                                        className="w-full justify-start text-left h-auto py-2 px-3"
                                        onClick={() => handleSelectCustomerInPayment(null)}
                                    >
                                        Walk-in Customer
                                    </Button>
                                    <hr className="my-1 border-border" />
                                    {/* Search Results / Loading / Add New */}
                                    {isSearchingCustomers ? (
                                        <p className="p-2 text-sm text-center text-muted">Searching...</p>
                                    ) : (
                                        <>
                                            {customerSearchResults.map(customer => (
                                                <Button
                                                    key={customer.id}
                                                    variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                    className={`w-full justify-start text-left h-auto py-2 px-3 ${selectedCustomer?.id === customer.id ? 'opacity-50 cursor-default' : ''}`}
                                                    onClick={() => {
                                                        if (selectedCustomer?.id !== customer.id) {
                                                            handleSelectCustomerInPayment(customer);
                                                        }
                                                    }}
                                                    disabled={selectedCustomer?.id === customer.id}
                                                >
                                                    {customer.name} {customer.phone && `(${customer.phone})`}
                                                </Button>
                                            ))}
                                            {/* Option to Add New Customer */}
                                            {customerSearchResults.length === 0 && searchTerm && (
                                                <div className="p-2 text-center">
                                                    <p className="text-sm text-muted mb-2">No existing customer found.</p>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleAddCustomer(searchTerm)}
                                                        disabled={createCustomerMutation.isPending}
                                                    >
                                                        {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${searchTerm}"`}
                                                    </Button>
                                                </div>
                                            )}
                                            {/* Initial Prompt */}
                                            {customerSearchResults.length === 0 && !searchTerm && !isSearchingCustomers && (
                                                <p className="p-2 text-sm text-center text-muted">Type to search existing customers or add a new one.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                            {/* Show selected customer below search with highlighted badge */}
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Selected:</span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full shadow-sm border font-semibold whitespace-nowrap bg-[#E8F9E6] border-[#C6ECC2]">
                                    <span style={{ fontSize: '16px', color: '#7F00FF', fontWeight: '600' }}>{selectedCustomer?.name || 'Walk-in Customer'}</span>
                                </span>
                            </div>
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
                                        min={subtotal.toFixed(2)}
                                        value={amountReceived}
                                        onChange={e => setAmountReceived(e.target.value)}
                                        required
                                        className="w-full"
                                        placeholder="Enter amount customer paid"
                                        // --- FIX: Removed autoFocus to allow customer field to focus first ---
                                        // autoFocus
                                    />
                                </div>
                                {/* Summary Section: Only Total Amount Due */}
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="text-center">
                                        <p className="text-sm text-muted">Total Amount Due</p>
                                        <p className="text-xl font-semibold" style={{ color: '#7F00FF' }}>₱{subtotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </>
                        )}
                        {/* You might add fields for Card/GCash reference numbers here if needed */}

                        {/* --- Date Picker --- */}
                        <div className="mb-2 flex gap-2">
                            <div style={{ flex: 1 }}>
                                <Label htmlFor="sale-date">Date</Label>
                                <Input
                                    id="sale-date"
                                    type="date"
                                    value={saleDate}
                                    onChange={e => setSaleDate(e.target.value)}
                                    className="w-full"
                                    max={new Date().toISOString().slice(0, 10)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Label htmlFor="sale-time">Time</Label>
                                <Input
                                    id="sale-time"
                                    type="time"
                                    value={saleTime}
                                    onChange={e => setSaleTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closePaymentModal}>Cancel</Button>
                        <Button
                            onClick={handleFinalizeSale}
                            disabled={createSaleMutation.isPending || (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < subtotal) || !selectedCustomer}
                            style={{ backgroundColor: '#7F00FF', color: 'white' }}
                            className="px-4 py-2 rounded-md font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {createSaleMutation.isPending ? 'Saving...' : 'Confirm Sale'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <TabBar />

            {/* --- Remove sticky mobile CTA bar at the bottom --- */}
            {/*
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-2px_6px_rgba(0,0,0,0.05)] z-40">
                <Button
                    variant="primary"
                    className="w-full h-12 text-base rounded-lg shadow-md font-semibold"
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
            */}

            {/* Body scroll lock when any POS modal is open */}
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
                            // --- FIX: Corrected typo e.g.target.value ---
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
                                                <p className="text-sm text-gray-600 mb-2">No existing customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleAddCustomer(debouncedSearchTerm)}
                                                    disabled={createCustomerMutation.isPending}
                                                    className="px-4"
                                                >
                                                    {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${debouncedSearchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                        {/* Initial Prompt */}
                                        {customerSearchResults.length === 0 && !debouncedSearchTerm && !isSearchingCustomers && (
                                            <p className="p-4 text-sm text-center text-gray-600">Type to search existing customers or add a new one.</p>
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
                <DialogContent
                    className="sm:max-w-sm"
                >
                    <DialogHeader>
                        <DialogTitle>Complete Sale</DialogTitle>
                        <DialogCloseButton onClick={closePaymentModal} />
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        {/* --- Customer Searchable Dropdown --- */}
                        <div>
                            <Label htmlFor="customer-search-payment">
                                Customer {lastCustomer ? `(last used: ${lastCustomer.name || 'Walk-in'})` : ''}
                            </Label>
                            <Input
                                id="customer-search-payment"
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                // --- FIX: Add text-base to prevent mobile zoom ---
                                className="w-full mb-2 text-base"
                                // --- FIX: The ref is now defined ---
                                ref={customerPaymentInputRef}
                                inputMode="text"
                                pattern=".*"
                                autoComplete="off"
                            />
                            <ScrollArea className="h-[150px] border rounded-md mb-2">
                                <div className="p-2 space-y-1">
                                    {/* Walk-in Option */}
                                    <Button
                                        variant={selectedCustomer === null ? "secondary" : "ghost"}
                                        className="w-full justify-start text-left h-auto py-2 px-3"
                                        onClick={() => handleSelectCustomerInPayment(null)}
                                    >
                                        Walk-in Customer
                                    </Button>
                                    <hr className="my-1 border-border" />
                                    {/* Search Results / Loading / Add New */}
                                    {isSearchingCustomers ? (
                                        <p className="p-2 text-sm text-center text-muted">Searching...</p>
                                    ) : (
                                        <>
                                            {customerSearchResults.map(customer => (
                                                <Button
                                                    key={customer.id}
                                                    variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                    className={`w-full justify-start text-left h-auto py-2 px-3 ${selectedCustomer?.id === customer.id ? 'opacity-50 cursor-default' : ''}`}
                                                    onClick={() => {
                                                        if (selectedCustomer?.id !== customer.id) {
                                                            handleSelectCustomerInPayment(customer);
                                                        }
                                                    }}
                                                    disabled={selectedCustomer?.id === customer.id}
                                                >
                                                    {customer.name} {customer.phone && `(${customer.phone})`}
                                                </Button>
                                            ))}
                                            {/* Option to Add New Customer */}
                                            {customerSearchResults.length === 0 && searchTerm && (
                                                <div className="p-2 text-center">
                                                    <p className="text-sm text-muted mb-2">No existing customer found.</p>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleAddCustomer(searchTerm)}
                                                        disabled={createCustomerMutation.isPending}
                                                    >
                                                        {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${searchTerm}"`}
                                                    </Button>
                                                </div>
                                            )}
                                            {/* Initial Prompt */}
                                            {customerSearchResults.length === 0 && !searchTerm && !isSearchingCustomers && (
                                                <p className="p-2 text-sm text-center text-muted">Type to search existing customers or add a new one.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                            {/* Show selected customer below search with highlighted badge */}
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Selected:</span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full shadow-sm border font-semibold whitespace-nowrap bg-[#E8F9E6] border-[#C6ECC2]">
                                    <span style={{ fontSize: '16px', color: '#7F00FF', fontWeight: '600' }}>{selectedCustomer?.name || 'Walk-in Customer'}</span>
                                </span>
                            </div>
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
                                        min={subtotal.toFixed(2)}
                                        value={amountReceived}
                                        onChange={e => setAmountReceived(e.target.value)}
                                        required
                                        className="w-full"
                                        placeholder="Enter amount customer paid"
                                        // --- FIX: Removed autoFocus to allow customer field to focus first ---
                                        // autoFocus
                                    />
                                </div>
                                {/* Summary Section: Only Total Amount Due */}
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="text-center">
                                        <p className="text-sm text-muted">Total Amount Due</p>
                                        <p className="text-xl font-semibold" style={{ color: '#7F00FF' }}>₱{subtotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </>
                        )}
                        {/* You might add fields for Card/GCash reference numbers here if needed */}

                        {/* --- Date Picker --- */}
                        <div className="mb-2 flex gap-2">
                            <div style={{ flex: 1 }}>
                                <Label htmlFor="sale-date">Date</Label>
                                <Input
                                    id="sale-date"
                                    type="date"
                                    value={saleDate}
                                    onChange={e => setSaleDate(e.target.value)}
                                    className="w-full"
                                    max={new Date().toISOString().slice(0, 10)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Label htmlFor="sale-time">Time</Label>
                                <Input
                                    id="sale-time"
                                    type="time"
                                    value={saleTime}
                                    onChange={e => setSaleTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closePaymentModal}>Cancel</Button>
                        <Button
                            onClick={handleFinalizeSale}
                            disabled={createSaleMutation.isPending || (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < subtotal) || !selectedCustomer}
                            style={{ backgroundColor: '#7F00FF', color: 'white' }}
                            className="px-4 py-2 rounded-md font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {createSaleMutation.isPending ? 'Saving...' : 'Confirm Sale'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

