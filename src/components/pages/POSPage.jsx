// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCustomerMutations';
import { useProductByBarcode } from '../../hooks/useProductByBarcode';
import { Button, Input } from '../ui';

import TabBar from '../TabBar';
import POSCart from '../pos/POSCart';
import POSProductGrid from '../pos/POSProductGrid';
import CustomerSelectionModal from '../pos/CustomerSelectionModal';
import PaymentModal from '../pos/PaymentModal';
import CustomSaleModal from '../pos/CustomSaleModal';
import MobileCartBar from '../pos/MobileCartBar';
import CartDrawer from '../pos/CartDrawer';
import EditCartItemModal from '../pos/EditCartItemModal';
import { supabase } from '../../lib/supabaseClient';
import currency from 'currency.js';

export default function POSPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // --- CATEGORY STATE ---
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [availableCategories, setAvailableCategories] = useState(['All']);

    // --- SEARCH STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm] = useState('');

    // --- FETCH UNIQUE CATEGORIES FROM DB ---
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('category')
                .not('category', 'is', null);

            if (!error && data) {
                const uniqueCats = Array.from(new Set(data.map(item => item.category || 'General')));
                setAvailableCategories(['All', ...uniqueCats.sort()]);
            }
        };
        fetchCategories();
    }, []);

    // --- DEBOUNCE EFFECTS ---
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!/^[0-9]{3,}$/.test(searchTerm)) {
                setDebouncedSearchTerm(searchTerm);
            } else {
                setDebouncedSearchTerm('');
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCustomerSearchTerm(customerSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [customerSearchTerm]);

    // --- DATA FETCHING (Pass Category Filter) ---
    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({
        searchTerm: debouncedSearchTerm,
        category: categoryFilter,
        page: currentPage,
        itemsPerPage
    });
    const products = productsData.products || [];
    const totalPages = productsData.totalPages || 1;

    const isBarcodeScan = /^[0-9]{3,}$/.test(searchTerm.trim());
    const { data: scannedProduct } = useProductByBarcode(isBarcodeScan ? searchTerm.trim() : null);

    const {
        currentSale, addItemToSale, clearSale, getTotalAmount, addToast,
        currentCustomer, setCurrentCustomer, updateCartItem
    } = useStore();

    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    // --- MODAL STATES ---
    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [editItemKey, setEditItemKey] = useState(null);

    // --- REFS ---
    const productSearchInputRef = useRef(null);
    const customerPaymentInputRef = useRef(null);

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

    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer);
    };

    const subtotal = getTotalAmount();

    // --- SHORTCUTS & SCANNER ---
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

    useEffect(() => {
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Scanned', description: `${scannedProduct.name} added.`, variant: 'success' });
            setSearchTerm('');
            productSearchInputRef.current?.focus();
        }
    }, [scannedProduct]);

    // --- CUSTOMER SEARCH ---
    useEffect(() => {
        if (!(isCustomerModalOpen || isPaymentModalOpen) || !debouncedCustomerSearchTerm) {
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
                    .or(`name.ilike.%${debouncedCustomerSearchTerm}%,phone.ilike.%${debouncedCustomerSearchTerm}%`)
                    .limit(10);
                if (!error) setCustomerSearchResults(data || []);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        searchCustomers();
    }, [debouncedCustomerSearchTerm, isCustomerModalOpen, isPaymentModalOpen]);

    // --- HANDLERS ---
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
            addItemToSale({ id: item.productId, name: item.name, price: item.price, cost: item.cost }, 1);
        }
    };

    const handleDecreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) addItemToSale({ id: item.productId, name: item.name, price: item.price }, -1);
    };

    const handleRemoveItem = (key) => {
        useStore.getState().removeItemFromSale(key);
    };

    const handleSelectCustomerFromModal = (customer) => {
        handleSetSelectedCustomer(customer);
        setCustomerSearchTerm('');
        setIsCustomerModalOpen(false);
    };

    const handleSelectCustomerInPayment = (customer) => {
        handleSetSelectedCustomer(customer);
        setCustomerSearchTerm('');
        setDebouncedCustomerSearchTerm('');
        setCustomerSearchResults([]);
        setIsSearchingCustomers(false);
    };

    const handleAddCustomer = async (newCustomerName) => {
        if (!newCustomerName || !newCustomerName.trim()) return;
        try {
            const addedCustomer = await createCustomerMutation.mutateAsync({ name: newCustomerName.trim() });
            handleSelectCustomerFromModal(addedCustomer);
            addToast({ title: 'Customer Added', description: `${addedCustomer.name} added.`, variant: 'success' });
            if(isPaymentModalOpen) handleSelectCustomerInPayment(addedCustomer);
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
        setSaleTime(new Date().toTimeString().slice(0,5));
        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
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
            cost_at_sale: i.cost || 0,
            subtotal: currency(i.price).multiply(i.quantity).value,
            basePrice: i.basePrice,
            note: i.note
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
            setCustomerSearchTerm('');
            setIsPaymentModalOpen(false);
        } catch (e) {
            addToast({ title: 'Checkout Error', description: e.message, variant: 'destructive' });
        }
    };

    return (
        <div className="pos-page">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />

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

            {/* --- CATEGORY BAR UI --- */}
            <div className="category-bar-container mb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 pb-2">
                    {availableCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setCategoryFilter(cat);
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap border-2 ${
                                categoryFilter === cat
                                    ? 'bg-primary border-primary text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full relative items-start">
                <POSProductGrid
                    isLoading={isLoadingProducts}
                    products={products}
                    recentProducts={recentProducts}
                    handleAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />

                <div className="hidden md:flex w-full md:w-1/3 xl:w-1/4 flex-shrink-0 flex-col sticky top-4" style={{ height: '42.5vh' }}>
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
                        onEditItem={(key) => setEditItemKey(key)}
                    />
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                setIsOpen={setIsCustomerModalOpen}
                searchTerm={customerSearchTerm}
                setSearchTerm={setCustomerSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerFromModal={handleSelectCustomerFromModal}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                debouncedSearchTerm={debouncedCustomerSearchTerm}
                handleAddCustomer={handleAddCustomer}
                createCustomerMutation={createCustomerMutation}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                setIsOpen={setIsPaymentModalOpen}
                searchTerm={customerSearchTerm}
                setSearchTerm={setCustomerSearchTerm}
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

            {editItemKey && (
                <EditCartItemModal
                    isOpen={!!editItemKey}
                    onClose={() => setEditItemKey(null)}
                    item={currentSale[editItemKey]}
                    onSave={(updatedItem) => updateCartItem(editItemKey, updatedItem)}
                />
            )}

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
                onEditItem={(key) => setEditItemKey(key)}
            />

            <TabBar />
        </div>
    );
}