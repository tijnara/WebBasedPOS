// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../store/useStore';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useCreateSale';
import { useCreateCustomer } from '../../hooks/useCustomerMutations';
import { useProductByBarcode } from '../../hooks/useProductByBarcode';
import { logActivity } from '../../hooks/useActivityLogs';
import { Button } from '../ui';
import { usePOSModals } from '../../hooks/usePOSModals';
import { usePOSCheckout, getLocalDateString, getLocalTimeString } from '../../hooks/usePOSCheckout';
import { DEBOUNCE_DELAY_MS, DEFAULT_ITEMS_PER_PAGE, CUSTOMER_SEARCH_LIMIT } from '../../config/constants';

import {
    Search,
    ScanLine,
    Keyboard,
    X
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
import POSProductTour from '../pos/POSProductTour';
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
        const trimmed = (customerSearchTerm || '').trim();
        if (!trimmed) {
            setDebouncedCustomerSearchTerm('');
            setCustomerSearchResults([]);
            setIsSearchingCustomers(false);
            return;
        }

        setIsSearchingCustomers(true);
        const handler = setTimeout(() => {
            setDebouncedCustomerSearchTerm(trimmed);
        }, 150);

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

    const handleClearCart = useCallback(() => {
        try {
            if (typeof clearSale === 'function') {
                clearSale();
            }
        } catch (err) {
            console.error('Error invoking clearSale action:', err);
        }

        try {
            useStore.setState({ currentSale: {} });
            localStorage.removeItem('currentSale');
            localStorage.removeItem('pos_cart');
        } catch (err) {
            console.error('Error wiping cart state:', err);
        }

        closeCartDrawer();

        addToast({
            title: 'Cart Cleared',
            description: 'All items removed from current order.',
            variant: 'info'
        });
    }, [clearSale, closeCartDrawer, addToast]);

    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    const [selectedCustomer, setSelectedCustomer] = useState(currentCustomer);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    const productSearchInputRef = useRef(null);
    const desktopCustomerInputRef = useRef(null);
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

    // Keep amountReceived synced with subtotal unless user picked a higher quick-tender bill
    useEffect(() => {
        const cur = parseFloat(amountReceived);
        if (subtotal <= 0 || isNaN(cur) || cur < subtotal) {
            setAmountReceived(subtotal > 0 ? subtotal.toFixed(2) : '');
        }
    }, [subtotal]);

    const handleScanResult = (code) => {
        closeScanner();
        setSearchTerm(code);
        addToast({ title: 'Scanned', description: `Searching for code: ${code}`, variant: 'info' });
    };

    useEffect(() => {
        if (scannedProduct) {
            handleAdd(scannedProduct);
            addToast({ title: 'Added', description: `${scannedProduct.name} added to cart.`, variant: 'success' });
            logActivity({
                user,
                action: 'SCAN',
                entity_type: 'SALE',
                description: `Scanned barcode for ${scannedProduct.name} (₱${Number(scannedProduct.price).toFixed(2)}) in POS`
            });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            setSearchTerm('');
            productSearchInputRef.current?.focus();
        }
    }, [scannedProduct]);

    const openPaymentModal = useCallback(() => {
        const currentTotal = getTotalAmount();
        if (Object.keys(currentSale).length === 0) {
            addToast({ title: 'Empty Cart', description: 'Add items before proceeding.', variant: 'warning' });
            return;
        }

        const currentTendered = parseFloat(amountReceived);
        if (!amountReceived || isNaN(currentTendered) || currentTendered < currentTotal) {
            setAmountReceived(currentTotal.toFixed(2));
        }
        if (!paymentMethod) {
            setPaymentMethod('Cash');
        }
        setSaleDate(getLocalDateString());
        setSaleTime(getLocalTimeString());

        setCustomerSearchTerm('');
        setCustomerSearchResults([]);

        if (isCartDrawerOpen) {
            closeCartDrawer();
            setTimeout(() => {
                openPaymentModalHandler();
            }, 120);
        } else {
            openPaymentModalHandler();
        }
    }, [
        getTotalAmount, currentSale, addToast, amountReceived, setAmountReceived,
        paymentMethod, setPaymentMethod, setSaleDate, setSaleTime,
        isCartDrawerOpen, closeCartDrawer, openPaymentModalHandler
    ]);

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

            if (event.key === 'F1' || (!isTyping && event.key === '/')) {
                event.preventDefault();
                productSearchInputRef.current?.focus();
            }

            if (event.key === 'F2') {
                event.preventDefault();
                if (!isPaymentModalOpen) {
                    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                        if (selectedCustomer) {
                            handleSetSelectedCustomer(null);
                        }
                        setTimeout(() => {
                            desktopCustomerInputRef.current?.focus();
                        }, 10);
                    } else if (!isCustomerModalOpen) {
                        openCustomerModal();
                    }
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

            if (event.key === 'F3' || (!isTyping && (event.key === 'p' || event.key === 'P'))) {
                event.preventDefault();
                if (!isCustomSaleModalOpen && !isPaymentModalOpen && !isDemo) {
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
                handleClearCart();
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
                } else if (customerSearchTerm) {
                    setCustomerSearchTerm('');
                } else {
                    setSearchTerm('');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isPaymentModalOpen, isCustomerModalOpen, isCustomSaleModalOpen,
        isScannerOpen, editItemKey, isCartDrawerOpen, isDemo, selectedCustomer,
        customerSearchTerm, openPaymentModal, closePaymentModal, openCustomerModal,
        closeCustomerModal, openCustomSale, closeCustomSale, closeScanner,
        closeEditItem, closeCartDrawer, setSearchTerm, hotkeyProducts, handleClearCart
    ]);

    // Resilient Customer Search (Triggers automatically as soon as user starts typing)
    useEffect(() => {
        if (!debouncedCustomerSearchTerm) {
            setCustomerSearchResults([]);
            setIsSearchingCustomers(false);
            return;
        }

        let isMounted = true;

        const searchCustomers = async () => {
            setIsSearchingCustomers(true);
            try {
                const term = debouncedCustomerSearchTerm.trim();
                const sanitized = term.replace(/["',()]/g, '');

                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, phone, address, credit_balance')
                    .or(`name.ilike."*${sanitized}*",phone.ilike."*${sanitized}*",address.ilike."*${sanitized}*"`)
                    .order('name', { ascending: true })
                    .limit(CUSTOMER_SEARCH_LIMIT || 25);

                if (error) {
                    console.warn('Customer search .or() fallback engaged:', error.message);
                    const { data: fallbackData } = await supabase
                        .from('customers')
                        .select('id, name, phone, address, credit_balance')
                        .ilike('name', `%${sanitized}%`)
                        .order('name', { ascending: true })
                        .limit(CUSTOMER_SEARCH_LIMIT || 25);

                    if (isMounted) setCustomerSearchResults(fallbackData || []);
                } else if (isMounted) {
                    setCustomerSearchResults(data || []);
                }
            } catch (err) {
                console.error('Customer search exception:', err);
                if (isMounted) setCustomerSearchResults([]);
            } finally {
                if (isMounted) setIsSearchingCustomers(false);
            }
        };

        searchCustomers();

        return () => {
            isMounted = false;
        };
    }, [debouncedCustomerSearchTerm]);

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

    const handleOpenScanList = () => {
        setIsScanSalesModalOpen(true);
        logActivity({
            user,
            action: 'SCAN',
            entity_type: 'SCAN_LIST',
            description: 'Opened Scan Sales List modal on POS'
        });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    };

    const isAnyModalOpen =
        isCartDrawerOpen ||
        isPaymentModalOpen ||
        isCustomerModalOpen ||
        isCustomSaleModalOpen ||
        Boolean(editItemKey) ||
        isScannerOpen ||
        isScanSalesModalOpen;

    return (
        <div className="pos-page flex flex-col md:flex-row gap-2.5 h-full max-h-full w-full overflow-hidden p-1.5 md:p-2.5 bg-slate-100 dark:bg-[#0b111e] box-border">
            {/* Hide distracting horizontal scrollbar tracks while keeping smooth touch swipe */}
            <style jsx global>{`
                .pos-page .category-scroll-container,
                .pos-page .no-scrollbar {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
                .pos-page .category-scroll-container::-webkit-scrollbar,
                .pos-page .no-scrollbar::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `}</style>

            {/* --- LEFT PANEL: CATALOG & ACTIONS --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111827] rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10 h-full max-h-full min-h-0">

                {/* Clean Header Row: Search + Camera + Scan List */}
                <div
                    id="tour-pos-search-bar"
                    className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-[#111827] shrink-0"
                >
                    <div className="relative flex-1 flex items-center group min-w-0">
                        <Search className="w-4 h-4 absolute left-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none z-10" />
                        <input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Search product or barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '2.25rem',
                                paddingRight: searchTerm ? '4.25rem' : '2.75rem'
                            }}
                            className="w-full h-9 sm:h-10 rounded-xl bg-slate-50 dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                        />

                        {searchTerm ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    productSearchInputRef.current?.focus();
                                }}
                                aria-label="Clear search"
                                className="absolute right-8 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors z-10 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <kbd className="hidden md:inline-flex items-center justify-center absolute right-9 px-1.5 py-0.5 text-[9.5px] font-mono font-bold text-slate-400 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 rounded pointer-events-none">
                                /
                            </kbd>
                        )}

                        <button
                            type="button"
                            onClick={handleCameraButtonClick}
                            className="absolute right-1.5 p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none z-10 cursor-pointer"
                            title="Open Camera Scanner"
                        >
                            <ScanLine className="w-4 h-4" />
                        </button>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenScanList}
                        className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 font-bold whitespace-nowrap transition-all active:scale-95 text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                        title="Scan Sales List"
                    >
                        <ScanLine className="w-3.5 h-3.5 shrink-0" />
                        <span>Scan List</span>
                    </Button>
                </div>

                {/* Single Clean Category Filter Bar + Desktop-Only Hotkeys */}
                <div
                    id="tour-pos-categories-hotkeys"
                    className="px-2.5 sm:px-3 py-2 border-b border-slate-100 dark:border-slate-800/90 flex flex-col gap-2 shrink-0 bg-slate-50/50 dark:bg-[#111827]"
                >
                    {/* Category Pill Strip */}
                    <div className="category-scroll-container flex items-center gap-1.5 overflow-x-auto w-full">
                        {availableCategories.map((cat) => {
                            const isActive = categoryFilter === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                                    className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all select-none cursor-pointer ${
                                        isActive
                                            ? 'bg-[#8DB600] text-white shadow-2xs'
                                            : 'bg-white dark:bg-[#1a2333] border border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop-Only Quick Add Hotkeys Bar */}
                    <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-100 dark:border-slate-800/70">
                        <div className="flex items-center gap-1 pr-1.5 text-slate-400 shrink-0">
                            <img src="/seasidelogo_.png" alt="Seaside" className="w-3.5 h-3.5 object-contain" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">QUICK</span>
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
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/60 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all flex-shrink-0 active:scale-95 group cursor-pointer"
                                >
                                    <kbd className="flex min-w-[15px] h-4 items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[9px] text-slate-600 dark:text-slate-300 font-bold">
                                        {key}
                                    </kbd>
                                    <span className="truncate max-w-[130px]">{prod.name}</span>
                                    <span className="text-[#659000] dark:text-emerald-400 font-black font-mono">
                                        ₱{Number(prod.price).toFixed(2)}
                                    </span>
                                </button>
                            );
                        })}

                        <div className="hidden xl:flex items-center gap-2.5 ml-auto text-[10.5px] text-slate-400 font-medium shrink-0">
                            <span className="flex items-center gap-1">
                                <Keyboard className="w-3 h-3 text-slate-500" />
                                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px]">F1</kbd> Search
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px]">F2</kbd> Cust
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-[#5f7d00] dark:text-emerald-400 bg-lime-100 dark:bg-emerald-950/60 px-1 rounded text-[9px]">F3</kbd> Custom
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px]">F4</kbd> Pay
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Scrollable 3D Product Grid Region --- */}
                <div
                    id="tour-pos-product-grid"
                    className="pos-product-scroll-area flex-1 p-2.5 sm:p-3.5 pb-36 md:pb-3.5 bg-slate-50/50 dark:bg-[#0e1525] relative min-h-0 overflow-y-auto"
                >
                    <POSProductGrid
                        isLoading={isLoadingProducts}
                        products={products}
                        handleAdd={handleAdd}
                        openCustomSale={openCustomSale}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                        currentSale={currentSale}
                    />
                </div>
            </div>

            {/* --- RIGHT PANEL: CURRENT ORDER (Desktop Split View with Direct Customer Search) --- */}
            <div
                id="tour-pos-cart-panel"
                className="hidden md:flex w-full md:w-[340px] lg:w-[385px] xl:w-[410px] flex-shrink-0 flex-col h-full max-h-full z-10 min-h-0"
            >
                <POSCart
                    currentSale={currentSale}
                    clearSale={handleClearCart}
                    subtotal={subtotal}
                    handleIncreaseQuantity={handleIncreaseQuantity}
                    handleDecreaseQuantity={handleDecreaseQuantity}
                    handleRemoveItem={handleRemoveItem}
                    openPaymentModal={openPaymentModal}
                    createSaleMutation={createSaleMutation}
                    lastCustomer={lastCustomer}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={handleSetSelectedCustomer}
                    desktopCustomerInputRef={desktopCustomerInputRef}
                    customerSearchTerm={customerSearchTerm}
                    setCustomerSearchTerm={setCustomerSearchTerm}
                    debouncedCustomerSearchTerm={debouncedCustomerSearchTerm}
                    customerSearchResults={customerSearchResults}
                    isSearchingCustomers={isSearchingCustomers}
                    handleAddCustomer={handleAddCustomer}
                    createCustomerMutation={createCustomerMutation}
                    onEditItem={openEditItem}
                    handleSetQuantity={handleSetQuantity}
                    stockWarningKey={stockWarningKey}
                    isDemo={isDemo}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    amountReceived={amountReceived}
                    setAmountReceived={setAmountReceived}
                />
            </div>

            {/* Mobile-Only Customer Selection Modal */}
            <div className="md:hidden">
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
            </div>

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
                onAddItem={(product, quantity, price) => {
                    addItemToSale(product, quantity, price);
                    logActivity({
                        user,
                        action: 'CREATE',
                        entity_type: 'SALE',
                        description: `Added custom POS item: ${product.name} × ${quantity} @ ₱${Number(price).toFixed(2)}`
                    });
                    queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
                }}
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
                    queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
                }}
            />

            {/* Mobile Cart Floating Action Bar */}
            {!isAnyModalOpen && (
                <div id="tour-pos-mobile-cart">
                    <MobileCartBar
                        itemCount={Object.keys(currentSale).length}
                        totalQty={totalQty}
                        subtotal={subtotal}
                        onOpenCart={openCartDrawer}
                        onDirectCheckout={openPaymentModal}
                        onClearCart={handleClearCart}
                    />
                </div>
            )}

            {/* Mobile Slide-Up Cart Drawer */}
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
                clearSale={handleClearCart}
                onClearSale={handleClearCart}
                onEditItem={openEditItem}
                handleSetQuantity={handleSetQuantity}
                stockWarningKey={stockWarningKey}
                isDemo={isDemo}
            />

            <POSProductTour isProductsLoading={isLoadingProducts} />
        </div>
    );
}