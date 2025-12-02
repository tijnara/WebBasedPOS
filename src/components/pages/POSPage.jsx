// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCreateCustomer';
import {
    Button, Input
} from '../ui';
import MobileLogoutButton from '../MobileLogoutButton';
import TabBar from '../TabBar';
import POSCart from '../pos/POSCart';
import POSProductGrid from '../pos/POSProductGrid';
import CustomerSelectionModal from '../pos/CustomerSelectionModal';
import PaymentModal from '../pos/PaymentModal';
import CustomSaleModal from '../pos/CustomSaleModal';
import MobileCartBar from '../pos/MobileCartBar';
import CartDrawer from '../pos/CartDrawer';
import { supabase } from '../../lib/supabaseClient';
import currency from 'currency.js';

export default function POSPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // --- SEARCH STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // --- DEBOUNCE EFFECT ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- FETCH PAGINATED PRODUCTS FOR DISPLAY ---
    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({ searchTerm: debouncedSearchTerm, page: currentPage, itemsPerPage });
    const products = productsData.products || [];
    const totalPages = productsData.totalPages || 1;

    // --- FETCH ALL PRODUCTS FOR SCANNER/SEARCH ---
    const { data: allProductsData } = useProducts({ fetchAll: true, itemsPerPage: 5000 });
    const allProducts = allProductsData?.products || [];

    const {
        currentSale, addItemToSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer
    } = useStore();

    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    // --- REFS ---
    const productSearchInputRef = useRef(null);
    const customerPaymentInputRef = useRef(null); // <--- ADDED THIS LINE

    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    const [lastCustomer, setLastCustomer] = useState(() => {
        try {
            const stored = localStorage.getItem('lastCustomer');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [saleTime, setSaleTime] = useState(() => new Date().toTimeString().slice(0,5));

    // Update local selected customer when global store changes
    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer);
    };

    const subtotal = getTotalAmount();

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'F1') {
                event.preventDefault();
                productSearchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- SCANNER LOGIC (uses allProducts for instant search) ---
    useEffect(() => {
        if (!searchTerm) return;
        const trimmed = searchTerm.trim();
        // Search against the full local array, not the paginated API
        const scannedProduct = allProducts.find(p => p.barcode === trimmed);
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Scanned', description: `${scannedProduct.name} added.`, variant: 'success' });
            setSearchTerm('');
            productSearchInputRef.current?.focus();
        }
    }, [searchTerm, allProducts]);

    // --- CUSTOMER SEARCH LOGIC ---
    useEffect(() => {
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
                    .ilike('name', `%${debouncedSearchTerm}%`)
                    .limit(10);
                if (error) {
                    setCustomerSearchResults([]);
                    addToast({ title: 'Search Error', description: error.message, variant: 'destructive' });
                    return;
                }
                setCustomerSearchResults(data || []);
            } catch (error) {
                console.error("Failed to search customers:", error);
                setCustomerSearchResults([]);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        searchCustomers();
    }, [debouncedSearchTerm, isCustomerModalOpen, isPaymentModalOpen, addToast]);

    // --- RECENT PRODUCTS LOGIC ---
    const [recentProducts, setRecentProducts] = useState([]);

    const handleAdd = (product) => {
        if (!product) return;
        const itemKey = `${product.id}__${Number(product.price).toFixed(2)}`;
        const currentQtyInCart = currentSale[itemKey]?.quantity || 0;
        if (currentQtyInCart + 1 > product.stock) {
            addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
            return;
        }
        addItemToSale(product, 1);
        setRecentProducts(prev => {
            const without = prev.filter(p => p.id !== product.id);
            return [product, ...without].slice(0, 3);
        });
    };

    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            // Use allProducts for stock check to ensure accuracy
            const product = allProducts.find(p => p.id === item.productId);
            if (product && item.quantity + 1 > product.stock) {
                addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
                return;
            }
            addItemToSale({ id: item.productId, name: item.name, price: item.price }, 1);
        }
    };

    const handleDecreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) addItemToSale({ id: item.productId, name: item.name, price: item.price }, -1);
    };

    const handleRemoveItem = (key) => {
        // Use store action
        useStore.getState().removeItemFromSale(key);
    };

    const handleSelectCustomerFromModal = (customer) => {
        handleSetSelectedCustomer(customer);
        setSearchTerm('');
        setIsCustomerModalOpen(false);
    };

    const handleSelectCustomerInPayment = (customer) => {
        handleSetSelectedCustomer(customer);
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setCustomerSearchResults([]);
        setIsSearchingCustomers(false);
    };

    const handleAddCustomer = async (newCustomerName) => {
        if (!newCustomerName || !newCustomerName.trim()) {
            addToast({ title: 'Error', description: 'Customer name cannot be empty.', variant: 'destructive' });
            return;
        }
        try {
            const addedCustomer = await createCustomerMutation.mutateAsync({ name: newCustomerName.trim() });
            handleSelectCustomerFromModal(addedCustomer);
            addToast({ title: 'Customer Added', description: `${addedCustomer.name} added.`, variant: 'success' });
        } catch (error) {
            addToast({ title: 'Error Adding Customer', description: error.message, variant: 'destructive' });
        }
    };

    const openPaymentModal = () => {
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding.', variant: 'warning' });
            return;
        }
        setAmountReceived(subtotal.toFixed(2));
        setPaymentMethod('Cash');
        const now = new Date();
        setSaleTime(now.toTimeString().slice(0,5));
        setIsPaymentModalOpen(true);
    };

    const user = useStore(s => s.user);

    const handleFinalizeSale = async () => {
        if (!selectedCustomer) {
            addToast({ title: 'Customer Required', description: 'Please select a customer.', variant: 'warning' });
            return;
        }
        const items = Object.values(currentSale).map(i => ({
            productId: i.productId,
            productName: i.name,
            quantity: i.quantity,
            priceAtSale: i.price,
            cost_at_sale: i.cost || 0, // <-- PROFIT TRACKING
            subtotal: currency(i.price).multiply(i.quantity).value
        }));
        const received = currency(amountReceived || 0).value;
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
                changeGiven: Math.max(0, changeCalculated),
                created_by: user?.id || null
            };
            await createSaleMutation.mutateAsync(payload);
            addToast({ title: 'Sale Completed', description: `Sale recorded.`, variant: 'success' });
            clearSale();
            handleSetSelectedCustomer(null);
            setLastCustomer(selectedCustomer);
            localStorage.setItem('lastCustomer', JSON.stringify(selectedCustomer));
            setAmountReceived('');
            setPaymentMethod('Cash');
            setSearchTerm('');
            setCustomerSearchResults([]);
            setIsPaymentModalOpen(false);
        } catch (e) {
            addToast({ title: 'Checkout Error', description: e.message, variant: 'destructive' });
        }
    };

    return (
        <div className="pos-page">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
            <MobileLogoutButton />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Point of Sale</h1>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial sm:w-full sm:max-w-xs">
                        <Input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Scan or search (F1)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button variant="primary" onClick={() => setIsCustomSaleModalOpen(true)} className="rounded-lg shadow-md font-semibold whitespace-nowrap">
                        + Custom
                    </Button>
                </div>
            </div>

            {/* --- Main Layout: Sticky Cart --- */}
            <div className="flex flex-col md:flex-row gap-4 w-full relative items-start">
                {/* LEFT COLUMN: PRODUCTS - Fills remaining width */}
                <POSProductGrid
                    isLoading={isLoadingProducts}
                    products={products}
                    recentProducts={recentProducts}
                    handleAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />

                {/* RIGHT COLUMN: CART - Sticky Float */}
                <div
                    className="hidden md:flex w-full md:w-1/3 xl:w-1/4 flex-shrink-0 flex-col sticky top-4"
                    style={{ height: '50vh' }}
                >
                    <POSCart
                        currentSale={currentSale}
                        clearSale={clearSale}
                        subtotal={subtotal}
                        handleIncreaseQuantity={handleIncreaseQuantity}
                        handleDecreaseQuantity={handleDecreaseQuantity}
                        handleRemoveItem={handleRemoveItem}
                        openPaymentModal={openPaymentModal}
                        createSaleMutation={createSaleMutation}
                        lastCustomer={lastCustomer}
                    />
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                setIsOpen={setIsCustomerModalOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerFromModal={handleSelectCustomerFromModal}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                debouncedSearchTerm={debouncedSearchTerm}
                handleAddCustomer={handleAddCustomer}
                createCustomerMutation={createCustomerMutation}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                setIsOpen={setIsPaymentModalOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerInPayment={handleSelectCustomerInPayment}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                handleAddCustomer={handleAddCustomer}
                createCustomerMutation={createCustomerMutation}
                lastCustomer={lastCustomer}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                amountReceived={amountReceived}
                setAmountReceived={setAmountReceived}
                subtotal={subtotal}
                saleDate={saleDate}
                setSaleDate={setSaleDate}
                saleTime={saleTime}
                setSaleTime={setSaleTime}
                handleFinalizeSale={handleFinalizeSale}
                createSaleMutation={createSaleMutation}
                customerPaymentInputRef={customerPaymentInputRef}
            />

            <CustomSaleModal
                isOpen={isCustomSaleModalOpen}
                onClose={() => setIsCustomSaleModalOpen(false)}
                products={products}
                onAddItem={(product, quantity, price) => addItemToSale(product, quantity, price)}
            />

            {/* MobileCartBar only visible when cart drawer and payment modal are both closed */}
            {!(isCartDrawerOpen || isPaymentModalOpen) && (
                <MobileCartBar
                    itemCount={Object.keys(currentSale).length}
                    subtotal={subtotal}
                    onOpenCart={() => setIsCartDrawerOpen(true)}
                />
            )}

            <CartDrawer
                isOpen={isCartDrawerOpen}
                onClose={() => setIsCartDrawerOpen(false)}
                currentSale={currentSale}
                subtotal={subtotal}
                handleIncreaseQuantity={handleIncreaseQuantity}
                handleDecreaseQuantity={handleDecreaseQuantity}
                handleRemoveItem={handleRemoveItem}
                openPaymentModal={openPaymentModal}
                createSaleMutation={createSaleMutation}
                clearSale={clearSale}
            />

            <TabBar />
        </div>
    );
}