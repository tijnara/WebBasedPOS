// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
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

import {
    Search,
    ScanLine,
    PlusCircle,
    Filter,
    Keyboard
} from 'lucide-react';

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
        if (p.is_custom || p.track_stock === false || String(p.id).startsWith('custom_')) return true;
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

            // F3 Hotkey to trigger Custom Sale Item Modal
            if (event.key === 'F3') {
                event.preventDefault();
                if (!isCustomSaleModalOpen && !isPaymentModalOpen) {
                    openCustomSale();
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
        openCustomSale, closeCustomSale, closeScanner, closeEditItem, closeCartDrawer, setSearchTerm,
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
            // Bypass stock checks for custom / unlisted items or non-stock services
            const isCustom = item.is_custom || item.track_stock === false || String(item.productId || item.id).startsWith('custom_');
            if (isCustom) {
                addItemToSale({ ...item, id: item.productId || item.id, stock: null }, 1);
                return;
            }

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
        if (item) addItemToSale({ ...item, id: item.productId || item.id }, -1);
    };

    const handleRemoveItem = (key) => {
        useStore.getState().removeItemFromSale(key);
    };

    const handleSetQuantity = (key, qty) => {
        const item = currentSale[key];
        if (!item) return;

        // Bypass stock limits for custom items
        const isCustom = item.is_custom || item.track_stock === false || String(item.productId || item.id).startsWith('custom_');
        if (isCustom) {
            updateCartItem(key, { quantity: qty });
            return;
        }

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
                title: 'Camera Blocked',
                description: 'Camera access requires HTTPS or localhost.',
                variant: 'destructive',
            });
            return;
        }
        openScanner();
    };

    return (
        <div className="pos-page flex flex-col md:flex-row gap-4 h-[calc(100vh-5rem)] min-h-[600px] max-w-[1920px] mx-auto overflow-hidden p-2 md:p-4 bg-slate-100">

            {/* --- LEFT PANEL: CATALOG & ACTIONS --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10">

                {/* Header Row: Search & Action Buttons (Apple Green Themed) */}
                <div className="p-3 md:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                    <div className="relative w-full sm:max-w-md flex items-center group">
                        <Search className="w-5 h-5 absolute left-3.5 text-slate-400 group-focus-within:text-[#8DB600] transition-colors pointer-events-none z-10" />
                        <input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Scan Barcode or Search Product (F1)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.85rem' }}
                            className="w-full pr-11 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#8DB600] focus:ring-4 focus:ring-[#8DB600]/10 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleCameraButtonClick}
                            className="absolute right-2 p-2 text-slate-400 hover:text-[#8DB600] hover:bg-lime-50 rounded-lg transition-colors outline-none z-10"
                            title="Open Camera Scanner"
                        >
                            <ScanLine className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsScanSalesModalOpen(true)}
                            className="flex-1 sm:flex-none h-12 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#5f7d00] hover:border-lime-300 font-bold whitespace-nowrap transition-all active:scale-95"
                        >
                            <ScanLine className="w-4 h-4 mr-2" /> Scan List
                        </Button>
                        <Button
                            variant="primary"
                            onClick={openCustomSale}
                            className="flex-1 sm:flex-none h-12 px-5 rounded-xl shadow-md font-bold whitespace-nowrap transition-all active:scale-95 bg-[#8DB600] hover:bg-[#7ca000] text-white"
                            disabled={isDemo}
                        >
                            <PlusCircle className="w-4 h-4 mr-2" /> Custom (F3)
                        </Button>
                    </div>
                </div>

                {/* Filters & Quick Keys Area */}
                <div className="px-3 md:px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900">

                    {/* Category Scroll Container */}
                    <div className="category-scroll-container flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 w-full">
                        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200 mr-1 shrink-0 text-slate-400">
                            <Filter className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Filter</span>
                        </div>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all select-none ${
                                    categoryFilter === cat
                                        ? 'bg-slate-800 text-white shadow-md ring-2 ring-slate-800 ring-offset-1'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Quick Add Hotkeys & Shortcut Indicators */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 mr-1 shrink-0">
                            <img src="/seasidelogo_.png" alt="Seaside" className="w-4 h-4 object-contain" />
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block text-slate-600">Quick</span>
                        </div>

                        {[3, 2, 30].map((id, index) => {
                            const product = hotkeyProducts[id];
                            if (!product) return null;
                            const hotkeys = ['1', '2', '3'];
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        handleAdd(product);
                                        addToast({ title: 'Quick Add', description: `${product.name} added.`, variant: 'success' });
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-lime-400 hover:bg-lime-50 rounded-lg shadow-sm text-xs font-bold text-slate-700 transition-all flex-shrink-0 active:scale-95 group"
                                >
                                    <kbd className="hidden sm:flex min-w-[18px] h-5 items-center justify-center bg-slate-100 border border-slate-300 rounded text-[10px] text-slate-600 font-bold group-hover:bg-white group-hover:border-lime-300 group-hover:text-[#5f7d00]">
                                        {hotkeys[index]}
                                    </kbd>
                                    <span className="truncate max-w-[120px]">{product.name}</span>
                                </button>
                            );
                        })}

                        <div className="hidden md:flex items-center gap-3.5 ml-auto text-xs text-slate-400 font-medium shrink-0">
                            <span className="flex items-center gap-1">
                                <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                                <kbd className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded">F1</kbd> Search
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-[#5f7d00] bg-lime-100 px-1 rounded">F3</kbd> Custom
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded">F4</kbd> Pay
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded">Esc</kbd> Close
                            </span>
                        </div>
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50/50 dark:bg-slate-900/50 relative">
                    <POSProductGrid
                        isLoading={isLoadingProducts}
                        products={products}
                        handleAdd={handleAdd}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </div>

            {/* --- RIGHT PANEL: FIXED CART --- */}
            <div className="hidden md:flex w-full md:w-[360px] lg:w-[420px] xl:w-[460px] flex-shrink-0 flex-col h-full z-10">
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

            {/* --- MODALS --- */}
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
                        const isCustom = updatedItem.is_custom || updatedItem.track_stock === false || String(updatedItem.productId || updatedItem.id).startsWith('custom_');
                        if (!isCustom) {
                            const product = products.find(p => p.id === updatedItem.productId);
                            const stock = product ? (product.stock ?? product.stock_quantity) : null;
                            const isService = isServiceProduct(product);
                            if (product && !isService && stock !== null && updatedItem.quantity > stock) {
                                addToast({ title: 'Stock Limit', description: `Limited to ${stock} items.`, variant: 'warning' });
                                updatedItem.quantity = stock;
                            }
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