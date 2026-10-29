// src/components/pages/POSPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    Keyboard,
    ArrowUpDown,
    User
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
    const [sortBy, setSortBy] = useState('highest_sold');

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
        excludeHidden: true,
        sortBy
    });

    const rawProducts = productsData.products || [];
    const totalPages = productsData.totalPages || 1;

    const sortedProducts = useMemo(() => {
        if (!rawProducts.length) return [];
        const copy = [...rawProducts];

        switch (sortBy) {
            case 'highest_sold':
                return copy.sort((a, b) => {
                    const soldA = Number(a.total_sold ?? a.sales_count ?? a.sold_quantity ?? 0);
                    const soldB = Number(b.total_sold ?? b.sales_count ?? b.sold_quantity ?? 0);
                    if (soldB !== soldA) return soldB - soldA;
                    const aIsRefill = (a.category || '').toLowerCase().includes('refill') || (a.name || '').toLowerCase().startsWith('refill') || [30, 3, 2].includes(Number(a.id));
                    const bIsRefill = (b.category || '').toLowerCase().includes('refill') || (b.name || '').toLowerCase().startsWith('refill') || [30, 3, 2].includes(Number(b.id));
                    if (aIsRefill && !bIsRefill) return -1;
                    if (!aIsRefill && bIsRefill) return 1;
                    return (a.name || '').localeCompare(b.name || '');
                });
            case 'stock_desc':
                return copy.sort((a, b) => Number(b.stock ?? b.stock_quantity ?? 0) - Number(a.stock ?? a.stock_quantity ?? 0));
            case 'stock_asc':
                return copy.sort((a, b) => Number(a.stock ?? a.stock_quantity ?? 0) - Number(b.stock ?? b.stock_quantity ?? 0));
            case 'price_asc':
                return copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
            case 'price_desc':
                return copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
            default:
                return copy;
        }
    }, [rawProducts, sortBy]);

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

        if (isCartDrawerOpen) {
            closeCartDrawer();
            setTimeout(() => {
                openPaymentModalHandler();
            }, 120);
        } else {
            openPaymentModalHandler();
        }
    };

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

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(25);
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
                if (isPaymentModalOpen) closePaymentModal();
                else if (isCustomerModalOpen) closeCustomerModal();
                else if (isCustomSaleModalOpen) closeCustomSale();
                else if (isScannerOpen) closeScanner();
                else if (editItemKey) closeEditItem();
                else if (isCartDrawerOpen) closeCartDrawer();
                else setSearchTerm('');
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

    const handleIncreaseQuantity = (key) => {
        const item = currentSale[key];
        if (item) {
            const isCustom = item.is_custom || item.track_stock === false || String(item.productId || item.id).startsWith('custom_');
            if (isCustom) {
                addItemToSale({ ...item, id: item.productId || item.id, stock: null }, 1);
                return;
            }

            const product = sortedProducts.find(p => p.id === item.productId);
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

        const product = sortedProducts.find(p => p.id === item.productId);
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

    const isAnyModalOpen = isCartDrawerOpen || isPaymentModalOpen || isCustomerModalOpen || isCustomSaleModalOpen || Boolean(editItemKey) || isScannerOpen || isScanSalesModalOpen;

    return (
        <div className="pos-page flex flex-col md:flex-row gap-2 h-full max-h-full w-full overflow-hidden p-1.5 md:p-2.5 bg-slate-100 dark:bg-slate-950 dark:[color-scheme:dark] box-border transition-colors">

            {/* --- LEFT PANEL: CATALOG & ACTIONS --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800/80 overflow-hidden relative z-10 h-full max-h-full min-h-0">

                {/* Header Row: Seamless borderless search header */}
                <div className="p-2 sm:p-2.5 flex items-center gap-1.5 bg-white dark:bg-slate-900 shrink-0">
                    <div className="relative flex-1 flex items-center group min-w-0">
                        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 dark:text-slate-500 group-focus-within:text-[#8DB600] dark:group-focus-within:text-lime-400 transition-colors pointer-events-none z-10" />
                        <input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Search product / barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.2rem' }}
                            className="w-full pr-8 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500 focus:ring-2 focus:ring-[#8DB600]/20 dark:focus:ring-lime-500/20 transition-all font-medium text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleCameraButtonClick}
                            className="absolute right-1.5 p-1 text-slate-400 dark:text-slate-500 hover:text-[#8DB600] dark:hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-950/40 rounded-lg transition-colors outline-none z-10 cursor-pointer"
                            title="Open Camera Scanner"
                        >
                            <ScanLine className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {selectedCustomer && (
                        <div
                            onClick={openCustomerModal}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-[10px] font-bold text-emerald-700 dark:text-emerald-300 cursor-pointer shrink-0 truncate max-w-[120px] transition-colors"
                            title="Assigned Customer"
                        >
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{selectedCustomer.name}</span>
                        </div>
                    )}

                    <div className="hidden md:flex items-center gap-1.5 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsScanSalesModalOpen(true)}
                            className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold whitespace-nowrap text-xs transition-colors"
                            title="Scan Sales List"
                        >
                            <ScanLine className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
                            <span>Scan List</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={openCustomSale}
                            className="h-9 px-3 rounded-xl shadow-xs font-bold whitespace-nowrap bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs transition-all active:scale-95"
                            disabled={isDemo}
                        >
                            <PlusCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Custom (F3)</span>
                        </Button>
                    </div>
                </div>

                {/* Categories & Desktop Quick Hotkeys Bar (Lines removed) */}
                <div className="px-2 sm:px-2.5 py-1.5 flex flex-col gap-1 shrink-0 bg-slate-50/50 dark:bg-slate-900/60">
                    <div className="category-scroll-container flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full no-scrollbar">
                        <div className="flex items-center gap-1 pr-1.5 mr-0.5 shrink-0 text-slate-400 dark:text-slate-500">
                            <Filter className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline-block">Filter</span>
                        </div>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                                className={`flex-shrink-0 whitespace-nowrap px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all select-none cursor-pointer ${
                                    categoryFilter === cat
                                        ? 'bg-[#8DB600] text-white shadow-2xs'
                                        : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Quick Hotkeys Bar: Desktop Only (Divider lines removed) */}
                    <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                        <div className="flex items-center gap-1 pr-1.5 mr-0.5 shrink-0">
                            <img src="/seasidelogo_.png" alt="Seaside" className="w-3 h-3 object-contain dark:brightness-110" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Quick</span>
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
                                    className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-lime-400 dark:hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-950/30 rounded-lg shadow-2xs text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all flex-shrink-0 active:scale-95 group cursor-pointer"
                                >
                                    <kbd className="flex min-w-[14px] h-3.5 items-center justify-center bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[8px] text-slate-600 dark:text-slate-300 font-bold group-hover:bg-white dark:group-hover:bg-slate-600 group-hover:border-lime-300 group-hover:text-[#5f7d00] dark:group-hover:text-lime-300">
                                        {key}
                                    </kbd>
                                    <span className="truncate max-w-[110px]">{prod.name}</span>
                                    <span className="text-[#8DB600] dark:text-lime-400 font-black font-mono">₱{Number(prod.price).toFixed(2)}</span>
                                </button>
                            );
                        })}

                        <div className="flex items-center gap-2.5 ml-auto text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">
                            <span className="flex items-center gap-1">
                                <Keyboard className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[9px]">F1</kbd> Search
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[9px]">F2</kbd> Cust
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-[#5f7d00] dark:text-lime-300 bg-lime-100 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900/60 px-1 rounded text-[9px]">F3</kbd> Custom
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[9px]">F4</kbd> Pay
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub-header: Count + Arrange by dropdown (Line removed) */}
                <div className="px-2.5 sm:px-3 py-1 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                        <span className="uppercase tracking-wider text-[9px] text-slate-400 dark:text-slate-500">Products</span>
                        <span className="text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono font-bold border border-transparent dark:border-slate-700">
                            {sortedProducts.length}
                        </span>
                        {categoryFilter !== 'All' && (
                            <span className="text-[10px] text-[#5f7d00] dark:text-lime-400 font-semibold truncate max-w-[120px]">
                                • {categoryFilter}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline-block">Arrange by:</span>
                        <div className="relative flex items-center">
                            <ArrowUpDown className="w-3 h-3 text-[#8DB600] dark:text-lime-400 absolute left-2 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{ paddingLeft: '1.6rem' }}
                                className="h-6.5 text-[10px] sm:text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg pr-2 py-0 outline-none cursor-pointer hover:border-[#8DB600] dark:hover:border-lime-500 transition-colors shadow-2xs"
                                title="Arrange Products"
                            >
                                <option value="highest_sold" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🔥 Highest Sold</option>
                                <option value="stock_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">📦 Stock: High to Low</option>
                                <option value="stock_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">⚠️ Stock: Low to High</option>
                                <option value="price_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">₱ Price: Low to High</option>
                                <option value="price_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">₱ Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Scrollable Product Grid */}
                <div className="pos-product-scroll-area flex-1 p-2 sm:p-2.5 pb-36 sm:pb-32 md:pb-2.5 bg-slate-50/50 dark:bg-slate-950/40 relative min-h-0 overflow-y-auto">
                    <POSProductGrid
                        isLoading={isLoadingProducts}
                        products={sortedProducts}
                        handleAdd={handleAdd}
                        openCustomSale={openCustomSale}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                        currentSale={currentSale}
                    />
                </div>
            </div>

            {/* --- RIGHT PANEL: CART --- */}
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

            {/* Modals & Dialogs */}
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
                products={sortedProducts}
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
                            const product = sortedProducts.find(p => p.id === updatedItem.productId);
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
                products={sortedProducts}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    queryClient.invalidateQueries({ queryKey: ['sales'] });
                    queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
                    queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
                    queryClient.invalidateQueries({ queryKey: ['weekly-growth'] });
                    queryClient.invalidateQueries({ queryKey: ['monthly-growth'] });
                }}
            />

            {!isAnyModalOpen && (
                <MobileCartBar
                    itemCount={Object.keys(currentSale).length}
                    totalQty={totalQty}
                    subtotal={subtotal}
                    onOpenCart={openCartDrawer}
                    onDirectCheckout={openPaymentModal}
                    onClearCart={clearSale}
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