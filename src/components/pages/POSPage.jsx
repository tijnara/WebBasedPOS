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
import { supabase } from '../../lib/supabaseClient';
import currency from 'currency.js';

// --- IMPORT YOUR NEW COMPONENTS ---
import POSCart from '../pos/POSCart';
import POSProductGrid from '../pos/POSProductGrid';
import PaymentModal from '../pos/PaymentModal';
import CustomerSelectionModal from '../pos/CustomerSelectionModal';
import CustomSaleModal from '../pos/CustomSaleModal';
import CartDrawer from '../pos/CartDrawer';
import MobileCartBar from '../pos/MobileCartBar';

export default function POSPage() {
    // --- Pagination state ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // --- Fetch products ---
    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({ searchTerm: '', page: currentPage, itemsPerPage });
    const products = productsData.products;
    const totalPages = productsData.totalPages || 1;
    const allProducts = products || [];

    // --- Zustand state ---
    const {
        currentSale, addItemToSale, removeItemFromSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer
    } = useStore();

    // --- Hooks ---
    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    // --- Component State ---
    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    const customerPaymentInputRef = useRef(null);
    const productSearchInputRef = useRef(null);

    // Custom Sale State
    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountReceived, setAmountReceived] = useState('');

    // Cart Drawer State
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

    // --- Responsive state ---
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- Effects ---
    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer);
    };

    const subtotal = getTotalAmount();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

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

    // Scanner Logic
    useEffect(() => {
        if (!searchTerm) return;
        const trimmed = searchTerm.trim();
        const scannedProduct = allProducts.find(p => p.barcode === trimmed);
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Scanned', description: `${scannedProduct.name} added.`, variant: 'success' });
            setSearchTerm('');
            productSearchInputRef.current?.focus(); // Re-focus after successful scan
        }
    }, [searchTerm, allProducts]);

    // Customer Search
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

    // --- Handlers ---
    const [recentProducts, setRecentProducts] = useState([]);

    const handleAdd = (product) => {
        if (!product) return;
        const itemKey = `${product.id}__${Number(product.price).toFixed(2)}`;
        const currentQtyInCart = currentSale[itemKey]?.quantity || 0;

        if (currentQtyInCart + 1 > product.stock) {
            addToast({ title: 'Stock Limit', description: `Cannot add more than the ${product.stock} available.`, variant: 'warning' });
            return;
        }

        // Store stock in sale item for future-proofing
        addItemToSale({ ...product, stock: product.stock }, 1);
        setRecentProducts(prev => {
            const without = prev.filter(p => p.id !== product.id);
            return [product, ...without].slice(0, 3);
        });
    };

    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            // Use stock from item if available, fallback to allProducts
            const productStock = typeof item.stock !== 'undefined' ? item.stock : (allProducts.find(p => p.id === item.productId)?.stock);
            if (productStock !== undefined && item.quantity + 1 > productStock) {
                addToast({ title: 'Stock Limit', description: `Cannot add more than the ${productStock} available.`, variant: 'warning' });
                return;
            }
            addItemToSale({ id: item.productId, name: item.name, price: item.price }, 1);
        }
    };

    const handleDecreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) addItemToSale({ id: item.productId, name: item.name, price: item.price }, -1);
    };

    const handleRemoveItem = (key) => removeItemFromSale(key);

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

            const created = await createSaleMutation.mutateAsync(payload);
            addToast({ title: 'Sale Completed', description: `Sale #${created.id.toString().slice(-6)} recorded.`, variant: 'success' });

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

            <div className="flex flex-col md:flex-row-reverse gap-4 w-full">
                {/* --- 1. REPLACED SIDEBAR WITH COMPONENT --- */}
                {!isMobile && (
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
                )}
                {/* --- 2. REPLACED GRID WITH COMPONENT --- */}
                <POSProductGrid
                    isLoading={isLoadingProducts}
                    products={products}
                    recentProducts={recentProducts}
                    handleAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            </div>

            {/* --- 3. REPLACED DIALOGS WITH COMPONENTS --- */}
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

            {/* Custom Sale Dialog (Left inline as it is small/simple) */}
            <CustomSaleModal
                isOpen={isCustomSaleModalOpen}
                onClose={() => setIsCustomSaleModalOpen(false)}
                products={products}
                onAddItem={(product, quantity, price) => addItemToSale(product, quantity, price)}
            />

            <MobileCartBar
                itemCount={Object.keys(currentSale).length}
                subtotal={subtotal}
                onOpenCart={() => setIsCartDrawerOpen(true)}
            />

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
            />

            <TabBar />

            {/* Note: All duplicate modals at the bottom have been removed in this version */}
        </div>
    );
}