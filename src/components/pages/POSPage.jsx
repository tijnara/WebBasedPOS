// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCustomerMutations';
import { useProductByBarcode } from '../../hooks/useProductByBarcode';
import { Button, Input } from '../ui';
import { usePOSModals } from '../../hooks/usePOSModals';
import { usePOSCheckout, getLocalDateString, getLocalTimeString } from '../../hooks/usePOSCheckout';
import { DEBOUNCE_DELAY_MS, DEFAULT_ITEMS_PER_PAGE, CUSTOMER_SEARCH_LIMIT } from '../../config/constants';

import TabBar from '../TabBar';
import POSCart from '../pos/POSCart';
import POSProductGrid from '../pos/POSProductGrid';
import CustomerSelectionModal from '../pos/CustomerSelectionModal';
import PaymentModal from '../pos/PaymentModal';
import CustomSaleModal from '../pos/CustomSaleModal';
import MobileCartBar from '../pos/MobileCartBar';
import CartDrawer from '../pos/CartDrawer';
import EditCartItemModal from '../pos/EditCartItemModal';
import BarcodeScannerModal from '../pos/BarcodeScannerModal';
import ScanSalesListModal from '../pos/ScanSalesListModal';
import { supabase } from '../../lib/supabaseClient';

export default function POSPage() {
    const queryClient = useQueryClient();

    const {
        isCustomerModalOpen, closeCustomerModal,
        isCustomSaleModalOpen, openCustomSale, closeCustomSale,
        isPaymentModalOpen, openPaymentModal: openPaymentModalHandler, closePaymentModal,
        isCartDrawerOpen, openCartDrawer, closeCartDrawer,
        isScannerOpen, openScanner, closeScanner,
        editItemKey, openEditItem, closeEditItem
    } = usePOSModals();

    const [isScanSalesModalOpen, setIsScanSalesModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

    const [categoryFilter, setCategoryFilter] = useState('All');
    const [availableCategories, setAvailableCategories] = useState(['All']);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [debouncedCustomerSearchTerm, setDebouncedCustomerSearchTerm] = useState('');
    const [stockWarningKey, setStockWarningKey] = useState(null);
    const { user } = useStore();
    const isDemo = user?.isDemo;

    const triggerStockWarning = (key) => {
        setStockWarningKey(key);
        setTimeout(() => setStockWarningKey(null), 3000);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('category')
                .not('category', 'is', null)
                .eq('is_hidden', false);

            if (!error && data) {
                const uniqueCats = Array.from(new Set(data.map(item => item.category || 'General')));
                setAvailableCategories(['All', ...uniqueCats.sort()]);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (!/^[0-9]{3,}$/.test(searchTerm)) {
                setDebouncedSearchTerm(searchTerm);
            } else {
                setDebouncedSearchTerm('');
            }
        }, DEBOUNCE_DELAY_MS);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCustomerSearchTerm(customerSearchTerm);
        }, DEBOUNCE_DELAY_MS);
        return () => clearTimeout(handler);
    }, [customerSearchTerm]);

    const { data: productsData = { products: [], totalPages: 1 }, isLoading: isLoadingProducts } = useProducts({
        searchTerm: debouncedSearchTerm,
        category: categoryFilter,
        page: currentPage,
        itemsPerPage,
        excludeHidden: true
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

    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    const productSearchInputRef = useRef(null);
    const customerPaymentInputRef = useRef(null);

    const [lastCustomer, setLastCustomer] = useState(() => {
        try {
            const stored = localStorage.getItem('lastCustomer');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    useEffect(() => {
        setSelectedCustomer(currentCustomer);
    }, [currentCustomer]);

    const handleSetSelectedCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCurrentCustomer(customer);
    };

    const subtotal = getTotalAmount();
    const totalQty = Object.values(currentSale).reduce((sum, item) => sum + (item.quantity || 0), 0);

    const {
        paymentMethod, setPaymentMethod,
        amountReceived, setAmountReceived,
        saleDate, setSaleDate,
        saleTime, setSaleTime,
        handleFinalizeSale,
    } = usePOSCheckout({
        subtotal,
        selectedCustomer,
        createSaleMutation,
        handleSetSelectedCustomer,
        setLastCustomer,
        closePaymentModal,
        setSearchTerm,
    });

    const handleScanResult = (code) => {
        closeScanner();
        setSearchTerm(code);
        addToast({ title: 'Scanned', description: `Searching for code: ${code}`, variant: 'info' });
    };

    useEffect(() => {
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Added', description: `${scannedProduct.name} added to cart.`, variant: 'success' });
            setSearchTerm('');
            productSearchInputRef.current?.focus();
        }
    }, [scannedProduct]);

    const openPaymentModal = () => {
        const currentTotal = getTotalAmount();
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding.', variant: 'warning' });
            return;
        }

        setAmountReceived(currentTotal.toFixed(2));
        setPaymentMethod('Cash');
        setSaleDate(getLocalDateString());
        setSaleTime(getLocalTimeString());

        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
        openPaymentModalHandler();
    };

    const [hotkeyProducts, setHotkeyProducts] = useState({});

    useEffect(() => {
        const fetchHotkeys = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in('id', [2, 3, 30]);

            if (!error && data) {
                const mapping = {};
                data.forEach(p => {
                    mapping[p.id] = {
                        ...p,
                        price: Number(p.price) || 0,
                        stock: p.stock_quantity ?? p.stock ?? 0,
                    };
                });
                setHotkeyProducts(mapping);
            }
        };
        fetchHotkeys();
    }, []);

    const isServiceProduct = (p) => {
        if (!p) return false;
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const stock = p.stock ?? p.stock_quantity;
        return cat.includes('refill') || cat.includes('service') || name.includes('refill') || (stock !== null && stock > 9999);
    };

    const handleAdd = (product) => {
        if (!product) return;
        const itemKey = `${product.id}__${Number(product.price).toFixed(2)}`;
        const currentQtyInCart = currentSale[itemKey]?.quantity || 0;
        const stock = product.stock ?? product.stock_quantity;
        const isService = isServiceProduct(product);

        if (!isService && stock !== null && stock !== undefined && currentQtyInCart + 1 > stock) {
            addToast({ title: 'Stock Limit', description: `Cannot add more than the ${stock} available.`, variant: 'warning' });
            triggerStockWarning(itemKey);
            return;
        }

        addItemToSale({ ...product, stock }, 1);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;

            if (event.key === 'F1') {
                event.preventDefault();
                productSearchInputRef.current?.focus();
            }

            if (!isTyping && ['1', '2', '3'].includes(event.key)) {
                const idMap = { '1': 3, '2': 2, '3': 30 };
                const productId = idMap[event.key];
                const product = hotkeyProducts[productId];

                if (product) {
                    event.preventDefault();
                    handleAdd(product);
                    addToast({
                        title: 'Quick Add',
                        description: `${product.name} added to cart.`,
                        variant: 'success'
                    });
                }
            }

            if (event.key === 'F4') {
                event.preventDefault();
                if (!isPaymentModalOpen) {
                    openPaymentModal();
                }
            }

            if (event.shiftKey && event.key === 'Delete') {
                event.preventDefault();
                clearSale();
            }

            if (event.key === 'Escape') {
                if (isPaymentModalOpen) {
                    closePaymentModal();
                } else if (isCustomerModalOpen) {
                    closeCustomerModal();
                } else if (isCustomSaleModalOpen) {
                    closeCustomSale();
                } else if (isScannerOpen) {
                    closeScanner();
                } else if (editItemKey) {
                    closeEditItem();
                } else if (isCartDrawerOpen) {
                    closeCartDrawer();
                } else {
                    setSearchTerm('');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isPaymentModalOpen, isCustomerModalOpen, isCustomSaleModalOpen,
        isScannerOpen, editItemKey, isCartDrawerOpen,
        openPaymentModal, clearSale, closePaymentModal, closeCustomerModal,
        closeCustomSale, closeScanner, closeEditItem, closeCartDrawer, setSearchTerm,
        hotkeyProducts
    ]);

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
                    .limit(CUSTOMER_SEARCH_LIMIT);
                if (!error) setCustomerSearchResults(data || []);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        searchCustomers();
    }, [debouncedCustomerSearchTerm, isCustomerModalOpen, isPaymentModalOpen]);

    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            const product = products.find(p => p.id === item.productId);
            const stock = product ? (product.stock ?? product.stock_quantity) : null;
            const isService = isServiceProduct(product);

            if (product && !isService && stock !== null && item.quantity + 1 > stock) {
                addToast({ title: 'Stock Limit', description: `Cannot add more than the ${stock} available.`, variant: 'warning' });
                triggerStockWarning(key);
                return;
            }
            addItemToSale({ ...item, id: item.productId, stock }, 1);
        }
    };

    const handleDecreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) addItemToSale({ ...item, id: item.productId }, -1);
    };

    const handleRemoveItem = (key) => {
        useStore.getState().removeItemFromSale(key);
    };

    const handleSetQuantity = (key, qty) => {
        const item = currentSale[key];
        if (!item) return;

        const product = products.find(p => p.id === item.productId);
        const stock = product ? (product.stock ?? product.stock_quantity) : null;
        const isService = isServiceProduct(product);
        let finalQty = qty;

        if (product && !isService && stock !== null && stock !== undefined) {
            if (qty > stock) {
                addToast({ title: 'Stock Limit', description: `Cannot add more than the ${stock} available.`, variant: 'warning' });
                triggerStockWarning(key);
                finalQty = stock;
            }
        }

        updateCartItem(key, { quantity: finalQty });
    };

    const handleSelectCustomerFromModal = (c) => {
        handleSetSelectedCustomer(c);
        setCustomerSearchTerm('');
        closeCustomerModal();
    };

    const handleSelectCustomerInPayment = (c) => {
        handleSetSelectedCustomer(c);
        setCustomerSearchTerm('');
        setDebouncedCustomerSearchTerm('');
        setCustomerSearchResults([]);
        setIsSearchingCustomers(false);
    };

    const handleAddCustomer = async (name) => {
        if (!name?.trim()) return;
        try {
            const added = await createCustomerMutation.mutateAsync({ name: name.trim() });
            handleSelectCustomerFromModal(added);
            if (isPaymentModalOpen) handleSelectCustomerInPayment(added);
        } catch (e) {
            addToast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };

    const handleCameraButtonClick = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addToast({
                title: 'Camera Blocked by Browser',
                description: 'Camera access requires a secure connection. If using a phone, access the site via HTTPS or localhost.',
                variant: 'destructive',
            });
            return;
        }

        openScanner();
    };

    return (
        <div className="pos-page responsive-page">

            {/* Quick Keys / Fast Action Touch Row */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                <span className="hidden sm:inline-flex items-center text-gray-400 uppercase tracking-wider font-bold text-[11px] mr-1">
                    Quick Keys:
                </span>

                {hotkeyProducts[3] && (
                    <button
                        type="button"
                        onClick={() => {
                            handleAdd(hotkeyProducts[3]);
                            addToast({ title: 'Quick Add', description: `${hotkeyProducts[3].name} added.`, variant: 'success' });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-500 rounded-lg shadow-sm text-xs font-semibold text-gray-700 transition-all flex-shrink-0 active:scale-95"
                    >
                        <kbd className="hidden sm:inline-flex min-w-[1.25rem] h-4 items-center justify-center bg-gray-100 border border-gray-300 rounded text-[10px] text-gray-600 font-bold">1</kbd>
                        <span className="text-emerald-700 font-bold">⚡ {hotkeyProducts[3].name}</span>
                    </button>
                )}

                {hotkeyProducts[2] && (
                    <button
                        type="button"
                        onClick={() => {
                            handleAdd(hotkeyProducts[2]);
                            addToast({ title: 'Quick Add', description: `${hotkeyProducts[2].name} added.`, variant: 'success' });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-500 rounded-lg shadow-sm text-xs font-semibold text-gray-700 transition-all flex-shrink-0 active:scale-95"
                    >
                        <kbd className="hidden sm:inline-flex min-w-[1.25rem] h-4 items-center justify-center bg-gray-100 border border-gray-300 rounded text-[10px] text-gray-600 font-bold">2</kbd>
                        <span className="text-emerald-700 font-bold">⚡ {hotkeyProducts[2].name}</span>
                    </button>
                )}

                {hotkeyProducts[30] && (
                    <button
                        type="button"
                        onClick={() => {
                            handleAdd(hotkeyProducts[30]);
                            addToast({ title: 'Quick Add', description: `${hotkeyProducts[30].name} added.`, variant: 'success' });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-500 rounded-lg shadow-sm text-xs font-semibold text-gray-700 transition-all flex-shrink-0 active:scale-95"
                    >
                        <kbd className="hidden sm:inline-flex min-w-[1.25rem] h-4 items-center justify-center bg-gray-100 border border-gray-300 rounded text-[10px] text-gray-600 font-bold">3</kbd>
                        <span className="text-emerald-700 font-bold">⚡ {hotkeyProducts[30].name}</span>
                    </button>
                )}

                <div className="hidden sm:flex items-center gap-5 ml-auto text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 h-5 flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm text-gray-700 font-bold">F4</kbd> Payment
                    </span>
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 h-5 flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm text-gray-700 font-bold">Esc</kbd> Close/Clear
                    </span>
                </div>
            </div>

            {/* Category Bar */}
            <div className="category-bar-container mb-4 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2 pb-2 flex-nowrap w-max min-w-full">
                    {availableCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                            className={`flex-shrink-0 whitespace-nowrap px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border-2 select-none ${
                                categoryFilter === cat
                                    ? 'bg-primary-soft border-primary text-primary shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-2/3 flex items-center gap-2">
                    <div className="relative flex w-full sm:w-auto gap-2">
                        <Input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Scan/Search (F1)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 sm:w-64 md:w-72 sm:max-w-xs"
                        />
                        <Button
                            variant="secondary"
                            className="px-3"
                            onClick={handleCameraButtonClick}
                            title="Open Camera Scanner"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                        </Button>
                    </div>
                </div>

                <div className="w-full md:w-1/3 xl:w-1/3 flex-shrink-0 flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsScanSalesModalOpen(true)}
                        className="flex-1 h-11 rounded-lg border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold whitespace-nowrap shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        title="Scan Delivery / Sales Log Sheet"
                    >
                        <span className="text-base">📷</span> Scan List
                    </Button>
                    <Button
                        variant="primary"
                        onClick={openCustomSale}
                        className="flex-1 rounded-lg shadow-md font-semibold whitespace-nowrap h-11"
                        disabled={isDemo}
                    >
                        + Custom
                    </Button>
                </div>
            </div>

            {/* Product Grid and Cart Panel */}
            <div className="flex flex-col md:flex-row gap-4 w-full relative items-start">
                <POSProductGrid
                    isLoading={isLoadingProducts}
                    products={products}
                    handleAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />

                <div className="hidden md:flex w-full md:w-1/3 xl:w-1/3 flex-shrink-0 flex-col sticky top-4" style={{ height: '70vh' }}>
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
                        onEditItem={openEditItem}
                        handleSetQuantity={handleSetQuantity}
                        stockWarningKey={stockWarningKey}
                        isDemo={isDemo}
                    />
                </div>
            </div>

            {/* Modals */}
            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                setIsOpen={closeCustomerModal}
                searchTerm={customerSearchTerm}
                setSearchTerm={setCustomerSearchTerm}
                selectedCustomer={selectedCustomer}
                handleSelectCustomerFromModal={handleSelectCustomerFromModal}
                isSearchingCustomers={isSearchingCustomers}
                customerSearchResults={customerSearchResults}
                debouncedSearchTerm={debouncedCustomerSearchTerm}
                handleAddCustomer={handleAddCustomer}
                createCustomerMutation={createCustomerMutation}
                isDemo={isDemo}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                setIsOpen={closePaymentModal}
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
                isDemo={isDemo}
            />

            <CustomSaleModal
                isOpen={isCustomSaleModalOpen}
                onClose={closeCustomSale}
                products={products}
                onAddItem={(product, quantity, price) => addItemToSale(product, quantity, price)}
                isDemo={isDemo}
            />

            {editItemKey && (
                <EditCartItemModal
                    isOpen={!!editItemKey}
                    onClose={closeEditItem}
                    item={currentSale[editItemKey]}
                    onSave={(updatedItem) => {
                        const product = products.find(p => p.id === updatedItem.productId);
                        const stock = product ? (product.stock ?? product.stock_quantity) : null;
                        const isService = isServiceProduct(product);
                        if (product && !isService && stock !== null && updatedItem.quantity > stock) {
                            addToast({ title: 'Stock Limit', description: `Limited to ${stock} items.`, variant: 'warning' });
                            updatedItem.quantity = stock;
                        }
                        updateCartItem(editItemKey, updatedItem);
                        closeEditItem();
                    }}
                    isDemo={isDemo}
                />
            )}

            {isScannerOpen && (
                <BarcodeScannerModal
                    isOpen={isScannerOpen}
                    onClose={closeScanner}
                    onScan={handleScanResult}
                />
            )}

            {/* --- SCAN SALES LIST MODAL --- */}
            <ScanSalesListModal
                isOpen={isScanSalesModalOpen}
                onClose={() => setIsScanSalesModalOpen(false)}
                products={products}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    queryClient.invalidateQueries({ queryKey: ['sales'] });
                    queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
                    queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
                    queryClient.invalidateQueries({ queryKey: ['weekly-growth'] });
                    queryClient.invalidateQueries({ queryKey: ['monthly-growth'] });
                }}
            />

            {/* --- MOBILE CART BAR --- */}
            {!(isCartDrawerOpen || isPaymentModalOpen) && (
                <MobileCartBar
                    itemCount={Object.keys(currentSale).length}
                    totalQty={totalQty}
                    subtotal={subtotal}
                    onOpenCart={openCartDrawer}
                />
            )}

            <CartDrawer
                isOpen={isCartDrawerOpen}
                onClose={closeCartDrawer}
                currentSale={currentSale}
                subtotal={subtotal}
                handleIncreaseQuantity={handleIncreaseQuantity}
                handleDecreaseQuantity={handleDecreaseQuantity}
                handleRemoveItem={handleRemoveItem}
                openPaymentModal={openPaymentModal}
                createSaleMutation={createSaleMutation}
                clearSale={clearSale}
                onEditItem={openEditItem}
                handleSetQuantity={handleSetQuantity}
                stockWarningKey={stockWarningKey}
                isDemo={isDemo}
            />

            <TabBar />
        </div>
    );
}