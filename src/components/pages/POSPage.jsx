// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCustomerMutations';
import { useProductByBarcode } from '../../hooks/useProductByBarcode';
import { Button } from '../ui';
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

    // Lock page scrolling while on POS
    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    const {
        isCustomerModalOpen, openCustomerModal, closeCustomerModal,
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

    // Hotkey Products loaded dynamically from DB
    const [hotkeyProducts, setHotkeyProducts] = useState({});

    useEffect(() => {
        const fetchHotkeys = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in('id', [30, 3, 2]);

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
    }, [productsData]);

    const isServiceProduct = (p) => {
        if (!p) return false;
        if (p.is_custom || p.track_stock === false || String(p.id).startsWith('custom_')) return true;
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('refill') || cat.includes('service') || name.startsWith('refill');
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

            if (event.key === 'F2') {
                event.preventDefault();
                if (!isCustomerModalOpen && !isPaymentModalOpen) {
                    openCustomerModal();
                }
            }

            if (!isTyping && ['1', '2', '3'].includes(event.key)) {
                const idMap = { '1': 30, '2': 3, '3': 2 };
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
        openPaymentModal, clearSale, closePaymentModal, openCustomerModal, closeCustomerModal,
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
        <div className="pos-page flex flex-col md:flex-row gap-2 h-full max-h-full w-full overflow-hidden p-1.5 md:p-2.5 bg-slate-100 box-border">

            {/* --- LEFT PANEL: CATALOG & ACTIONS --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10 h-full max-h-full min-h-0">

                {/* Ultra-Compact Header Row: Search + Action Buttons (Single Row on Mobile) */}
                <div className="p-2 sm:p-2.5 md:p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900 shrink-0">
                    <div className="relative flex-1 flex items-center group min-w-0">
                        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 text-slate-400 group-focus-within:text-[#8DB600] transition-colors pointer-events-none z-10" />
                        <input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Search product / barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.2rem' }}
                            className="w-full pr-8 h-9 sm:h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleCameraButtonClick}
                            className="absolute right-1.5 p-1 text-slate-400 hover:text-[#8DB600] hover:bg-lime-50 rounded-lg transition-colors outline-none z-10"
                            title="Open Camera Scanner"
                        >
                            <ScanLine className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsScanSalesModalOpen(true)}
                            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#5f7d00] hover:border-lime-300 font-bold whitespace-nowrap transition-all active:scale-95 text-xs"
                            title="Scan Sales List"
                        >
                            <ScanLine className="w-3.5 h-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Scan List</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={openCustomSale}
                            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl shadow-xs font-bold whitespace-nowrap transition-all active:scale-95 bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs"
                            disabled={isDemo}
                        >
                            <PlusCircle className="w-3.5 h-3.5 sm:mr-1" />
                            <span>Custom</span>
                            <span className="hidden md:inline ml-0.5">(F3)</span>
                        </Button>
                    </div>
                </div>

                {/* Filters & Quick Keys Area */}
                <div className="px-2 sm:px-2.5 md:px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1 shrink-0 bg-slate-50/50 dark:bg-slate-900">

                    {/* Category Scroll Container */}
                    <div className="category-scroll-container flex items-center gap-1.5 overflow-x-auto pb-1 w-full">
                        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200 mr-0.5 shrink-0 text-slate-400">
                            <Filter className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline-block">Filter</span>
                        </div>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                                className={`flex-shrink-0 whitespace-nowrap px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all select-none ${
                                    categoryFilter === cat
                                        ? 'bg-[#8DB600] text-white shadow-2xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Quick Add Hotkeys Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200 mr-0.5 shrink-0">
                            <img src="/seasidelogo_.png" alt="Seaside" className="w-3 h-3 object-contain" />
                            <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline-block text-slate-600">Quick</span>
                        </div>

                        {[
                            { id: 30, key: '1' },
                            { id: 3, key: '2' },
                            { id: 2, key: '3' }
                        ].map(({ id, key }) => {
                            const prod = hotkeyProducts[id];
                            if (!prod) return null;

                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        handleAdd(prod);
                                        addToast({ title: 'Quick Add', description: `${prod.name} added.`, variant: 'success' });
                                    }}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 hover:border-lime-400 hover:bg-lime-50 rounded-lg shadow-2xs text-[10px] sm:text-[11px] font-bold text-slate-700 transition-all flex-shrink-0 active:scale-95 group"
                                >
                                    <kbd className="flex min-w-[14px] h-3.5 items-center justify-center bg-slate-100 border border-slate-300 rounded text-[8px] text-slate-600 font-bold group-hover:bg-white group-hover:border-lime-300 group-hover:text-[#5f7d00]">
                                        {key}
                                    </kbd>
                                    <span className="truncate max-w-[110px]">{prod.name}</span>
                                    <span className="text-[#8DB600] font-black">₱{Number(prod.price).toFixed(2)}</span>
                                </button>
                            );
                        })}

                        <div className="hidden md:flex items-center gap-2.5 ml-auto text-[11px] text-slate-400 font-medium shrink-0">
                            <span className="flex items-center gap-1">
                                <Keyboard className="w-3 h-3 text-slate-400" />
                                <kbd className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded text-[9px]">F1</kbd> Search
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded text-[9px]">F2</kbd> Cust
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-[#5f7d00] bg-lime-100 px-1 rounded text-[9px]">F3</kbd> Custom
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded text-[9px]">F4</kbd> Pay
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Scrollable Product Grid Region with pb-24 for Mobile TabBar clearance --- */}
                <div className="pos-product-scroll-area flex-1 p-2 sm:p-2.5 pb-24 md:pb-2.5 bg-slate-50/50 dark:bg-slate-900/50 relative min-h-0">
                    <POSProductGrid
                        isLoading={isLoadingProducts}
                        products={products}
                        handleAdd={handleAdd}
                        openCustomSale={openCustomSale}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </div>

            {/* --- RIGHT PANEL: CART (Hidden on mobile, Drawer used instead) --- */}
            <div className="hidden md:flex w-full md:w-[340px] lg:w-[380px] xl:w-[420px] flex-shrink-0 flex-col h-full max-h-full z-10 min-h-0">
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
                    selectedCustomer={selectedCustomer}
                    openCustomerModal={openCustomerModal}
                    onEditItem={openEditItem}
                    handleSetQuantity={handleSetQuantity}
                    stockWarningKey={stockWarningKey}
                    isDemo={isDemo}
                />
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

            {/* Mobile Cart Bar */}
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
        </div>
    );
}